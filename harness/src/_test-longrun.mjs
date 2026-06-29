/**
 * _test-longrun — LONG-RUN test (richiesta utente msg 379). Simula una sessione LUNGA: molti step
 * (default 75) con mutazioni continue (task create/chiuse, vars, memo, curr che avanza, changelog che
 * cresce) attraverso COMPACTION multiple. Proprietà chiave da dimostrare: lo stato resta ORGANIZZATO
 * e il <context> resta BOUNDED (O(1) rispetto al numero di step) — niente blow-up del contesto su
 * sessioni lunghe, che è la ragione d'essere del vars-queue. Deterministico (no API).
 */
import { VarsQueue } from "./vars-queue.mjs";
import { assembleContext } from "./context-assembler.mjs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const N = Number(process.argv[2] ?? 75);
const COMPACT_EVERY = 25;
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log("  ✗ FAIL: " + m)); };

const dir = mkdtempSync(join(tmpdir(), "longrun-test-"));
const dbPath = join(dir, "vars.db");
let vq = new VarsQueue(dbPath, { agent: "orchestrator" });
vq.addRule("no-secret-leak", "Mai esporre segreti.", { severity: "hard" });
vq.addRule("structured-thinking", "Ragiona a passi.", { severity: "soft" });

let ctxLenEarly = 0, ctxNoVarsEarly = 0, memosRemembered = 0, compactions = 0;
let prevTask = null;
const stripVars = (s) => s.replace(/  <vars>[\s\S]*?  <\/vars>\n/, ""); // isola la parte NON-vars (bounded)

for (let i = 1; i <= N; i++) {
  const id = `T${i}`;
  vq.addTask(id, `step ${i}: lavoro unità ${i}`, {});
  vq.setCurr(id);
  vq.setVar(`v${i}`, `valore-${i}`, { scope: i % 5 === 0 ? "shared" : "private" });
  if (prevTask) vq.setTaskStatus(prevTask, "done");      // chiudo il precedente → open-loop resta piccolo
  prevTask = id;
  if (i % 10 === 0) { vq.setVar(`lez-${i}`, { lesson: `lezione allo step ${i}`, example: `caso ${i}` }, { namespace: "memo", scope: "private" }); memosRemembered++; }

  if (i === COMPACT_EVERY) { const c = assembleContext(vq, { now: Date.now() }); ctxLenEarly = c.length; ctxNoVarsEarly = stripVars(c).length; }

  // COMPACTION periodica: chiudo e riapro il db (lo stato deve sopravvivere)
  if (i % COMPACT_EVERY === 0 && i < N) { vq.close(); vq = new VarsQueue(dbPath, { agent: "orchestrator" }); compactions++; }
}

// ===== verifica finale =====
const now = Date.now();
const ctx = assembleContext(vq, { now });
const ctxLenLate = ctx.length;
const allTasks = vq.listTasks();
const openTasks = [...vq.listTasks({ status: "in_progress" }), ...vq.listTasks({ status: "pending" })];
const fullLog = vq.getChangeLog({ since: 0, limit: 100000 });
const recentInCtx = (ctx.match(/^    - /gm) || []).length; // righe-item totali (bound generale)
const memos = vq.listVars({ namespace: "memo" });

ok(compactions >= 2, `almeno 2 compaction durante il long-run (fatte ${compactions})`);
ok(allTasks.length === N, `tutti gli ${N} task sopravvivono alle compaction (trovati ${allTasks.length})`);
ok(openTasks.length <= 3, `open-loop BOUNDED: solo ${openTasks.length} task aperti (i done escono dall'open-loop)`);
ok(vq.getCurr() === `T${N}`, `current aim corretto dopo long-run (T${N})`);
ok(fullLog.length >= N, `changelog completo conserva l'audit (${fullLog.length} entry ≥ ${N})`);
ok(memos.length === memosRemembered, `${memosRemembered} memo accumulate senza perdita`);

// PROPRIETÀ CHIAVE: il context resta BOUNDED con la storia. recent_changes cap a maxChanges(12) + SEGNALE.
const rcBlock = ctx.match(/<recent_changes>([\s\S]*?)<\/recent_changes>/)?.[1] ?? "";
const recentChanges = (rcBlock.match(/^    - \d/gm) || []).length; // solo item-cambio (escl. nota di troncamento)
ok(recentChanges <= 12, `recent_changes cap a 12 (trovate ${recentChanges}) nonostante ${fullLog.length} cambi totali`);
ok(/\(\+altri cambi/.test(rcBlock), "recent_changes SEGNALA che ce ne sono altri (cap/finestra → get_changelog)");
// FIX (b) VERIFICATO: la lane <vars> ORA è WINDOWED (cap maxVars) + SEGNALA il troncamento → context bounded.
const varsBlock = ctx.match(/<vars>([\s\S]*?)<\/vars>/)?.[1] ?? "";
const varsShown = (varsBlock.split("\n").filter((l) => l.startsWith("    - ") && !l.includes("(+"))).length;
const sharedLate = vq.getSharedView().length;
ok(varsShown <= 12, `<vars> WINDOWED a ≤12 (mostrate ${varsShown}) su ${sharedLate} shared-vars`);
ok(sharedLate <= 12 || /\(\+\d+ più vecchie nascoste/.test(varsBlock), "<vars> SEGNALA le shared-vars nascoste (get_shared_view)");
const ctxNoVarsLate = stripVars(ctx).length;
ok(ctxNoVarsLate < ctxNoVarsEarly + 200, `context-meno-vars BOUNDED: ${ctxNoVarsEarly}→${ctxNoVarsLate} char`);
ok(ctxLenLate < ctxLenEarly + 400, `context TOTALE ora BOUNDED (anche <vars> cappata): ${ctxLenEarly}→${ctxLenLate} char`);
// FIX (a) VERIFICATO: le memo NON sono in recent_changes (silent) ma il context SEGNALA che esistono.
ok(!/lez-/.test(rcBlock), "memo NON trapelano in recent_changes (silent)");
ok(new RegExp(`<notes count="${memos.length}"`).test(ctx), `context SEGNALA le ${memos.length} memo disponibili (recall_lessons)`);
// GC delle shared-vars vecchie (fix b: la lane ora prunabile)
const beforeGcShared = vq.getSharedView().length;
vq.gcVars(now + 1, { scope: "shared" });
ok(vq.getSharedView().length < beforeGcShared && vq.listTasks().length === N,
   `gcVars pota le shared-vars (${beforeGcShared}→${vq.getSharedView().length}) senza toccare i task`);

// GC del changelog: pota l'audit vecchio SENZA toccare lo stato
const cutoff = fullLog[Math.floor(fullLog.length / 2)].ts;
vq.gcChangeLog(cutoff);
const afterGc = vq.getChangeLog({ since: 0, limit: 100000 });
ok(afterGc.length < fullLog.length, `gcChangeLog pota l'audit vecchio (${fullLog.length}→${afterGc.length})`);
ok(vq.listTasks().length === N && vq.getCurr() === `T${N}`, "GC non tocca lo STATO (task/curr intatti)");

console.log(`\n===== LONG-RUN (${N} step, ${compactions} compaction) =====`);
console.log(`  task totali=${allTasks.length} · open-loop=${openTasks.length} · memo=${memos.length} · changelog=${fullLog.length}`);
console.log(`  context len @${COMPACT_EVERY}step=${ctxLenEarly} → @${N}step=${ctxLenLate}  (BOUNDED, non lineare con N)`);
console.log(`  recent_changes nel context = ${recentChanges} (cap 12) · item-righe totali nel context = ${recentInCtx}`);
console.log(`\nlong-run smoke-test: ${pass} passed, ${fail} failed`);
vq.close();
rmSync(dir, { recursive: true, force: true });
process.exit(fail ? 1 : 0);

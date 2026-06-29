/**
 * _test-organization — verifica che l'ORGANIZZAZIONE dello stato sia mantenuta bene attraverso
 * un flusso multi-step + una COMPACTION (chiusura/riapertura del db). Richiesta utente msg 376
 * ("verificare che l'organizzazione venga mantenuta bene"). Deterministico (no API).
 * Usa vars-queue.mjs + context-assembler.mjs (gli stessi moduli delle extension pi).
 */
import { VarsQueue } from "./vars-queue.mjs";
import { assembleContext } from "./context-assembler.mjs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log("  ✗ FAIL: " + m)); };

const dir = mkdtempSync(join(tmpdir(), "org-test-"));
const dbPath = join(dir, "vars.db");

// ===== SESSIONE 1: costruzione stato organizzato (multi-step) =====
let vq = new VarsQueue(dbPath, { agent: "orchestrator" });
vq.addRule("no-secret-leak", "Mai esporre segreti in output.", { severity: "hard" });
vq.addRule("structured-thinking", "Ragiona a passi observe/orient/plan/verify.", { severity: "soft" });
vq.addRule("dep-check", "find-references prima di rinominare/cancellare.", { severity: "hard" });
vq.addTask("T1", "setup ambiente", {});
vq.addTask("T2", "implementare feature X", {});
vq.addTask("T3", "scrivere test", {});
vq.setTaskStatus("T1", "done");          // chiuso → NON deve apparire nell'open-loop
vq.setCurr("T2");                         // current aim
vq.setVar("api_base", "https://api.example.com", { scope: "shared" });
vq.setVar("scratch", "validare input ai confini", { scope: "private" });
vq.setVar("lez-1", { lesson: "valida input", example: "T2 crash su null" }, { namespace: "memo", scope: "private" });

// ===== COMPACTION: chiudo e riapro (cross-compact survival) =====
vq.close();
vq = new VarsQueue(dbPath, { agent: "orchestrator" });

// ===== SESSIONE 2: l'organizzazione è mantenuta? =====
const rules = vq.listRules();
const tasksOpen = [...vq.listTasks({ status: "in_progress" }), ...vq.listTasks({ status: "pending" })];
const curr = vq.getCurr();
const memo = vq.listVars({ namespace: "memo" });
const shared = vq.getSharedView();

ok(rules.length === 3, `3 rules dopo compaction (trovate ${rules.length})`);
ok(curr === "T2", `current aim resta T2 dopo compaction (trovato ${curr})`);
ok(vq.getTask("T1").status === "done", "T1 resta done dopo compaction");
ok(tasksOpen.find((t) => t.id === "T2") && !tasksOpen.find((t) => t.id === "T1"),
   "open-loop contiene T2 ma NON T1(done)");
ok(memo.length === 1 && memo[0].value.lesson === "valida input", "memo (note dopo finding) sopravvive in namespace memo");
ok(shared.length === 1 && shared[0].id === "api_base", "var shared sopravvive, private separata");

const now = Date.now();
const ctx = assembleContext(vq, { now });

// organizzazione del context: rules hard PRIMA di soft, aim corretto, open-loop senza done, recent_changes presente
const iHard = Math.min(ctx.indexOf("no-secret-leak"), ctx.indexOf("dep-check"));
const iSoft = ctx.indexOf("structured-thinking");
ok(iHard >= 0 && iSoft >= 0 && iHard < iSoft, "rules ordinate per severità (hard prima di soft)");
ok(/current_aim id="T2"/.test(ctx), "current_aim = T2 nel context");
ok(ctx.includes("T2: implementare feature X") && !ctx.includes("T1: setup"), "task_list open-loop (T2 sì, T1 done no)");
ok(/<recent_changes>/.test(ctx), "recent_changes presente (chi/quando/cosa)");
const varsBlock = ctx.match(/<vars>([\s\S]*?)<\/vars>/)?.[1] ?? "";
ok(ctx.includes("api_base") && !varsBlock.includes("lesson"), "vars shared in context; memo NON nella lane durable <vars> (recall on-demand)");
// FINDING onesto: la CREAZIONE della memo appare TRANSITORIAMENTE in <recent_changes> (il changelog logga
// ogni mutazione, incl. namespace memo) finché non age-out (finestra 15min / cap 12). Non durable, ma osservabile.
const memoTransient = /<recent_changes>[\s\S]*lez-1[\s\S]*<\/recent_changes>/.test(ctx);
console.log(`  [finding] memo-write transiente in recent_changes: ${memoTransient} (refinement: escludere namespace 'memo' dal changelog visibile)`);

console.log(`\n===== <context> assemblato dopo compaction (ispezione visiva) =====\n${ctx}\n`);
console.log(`organization smoke-test: ${pass} passed, ${fail} failed`);
vq.close();
rmSync(dir, { recursive: true, force: true });
process.exit(fail ? 1 : 0);

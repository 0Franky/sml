/**
 * _test-note-after-finding — verifica il pattern "uso di note dopo un finding" (richiesta utente msg 376).
 * Modella error-memo (remember_lesson/recall_lessons, namespace "memo", vars-queue backed):
 * dopo un FINDING (es. ImportError da rename senza dep-check) il modello registra una nota a 2 livelli
 * (lezione generica + esempio concreto); la nota SOPRAVVIVE alla compaction; è RICHIAMABILE on-demand
 * (con filtro) e NON inquina il <context> finché non serve. Deterministico (no API).
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import { assembleContext } from "../../src/context-assembler.mjs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log("  ✗ FAIL: " + m)); };

const MEMO = "memo";
const remember = (vq, id, lesson, example) => vq.setVar(id, { lesson, example: example ?? null }, { namespace: MEMO, scope: "private" });
const recall = (vq, filter) => {
  const f = filter ? filter.toLowerCase() : null;
  return vq.listVars({ namespace: MEMO }).map((v) => ({ id: v.id, ...v.value }))
    .filter((m) => !f || m.id.toLowerCase().includes(f) || String(m.lesson ?? "").toLowerCase().includes(f));
};

const dir = mkdtempSync(join(tmpdir(), "memo-test-"));
const dbPath = join(dir, "vars.db");

// ===== SESSIONE 1: due finding → due note =====
let vq = new VarsQueue(dbPath, { agent: "orchestrator" });
// finding 1: rename parziale → ImportError
remember(vq, "find-refs-before-rename",
  "Esegui find-references (grep -rln dei file che importano) PRIMA di rinominare, e update atomico di tutti i call-site.",
  "2026-06-29: rename parse→parse_input solo nella def → ImportError in loader/cli/test → 6m persi.");
// finding 2: secret quasi committato
remember(vq, "scan-secrets-before-commit",
  "Scansiona segreti/PII prima di ogni commit; non committare .env.",
  "Quasi committato GEMINI_API_KEY in chiaro; .env va gitignored.");

ok(recall(vq).length === 2, "2 note registrate in sessione 1");

// ===== COMPACTION =====
vq.close();
vq = new VarsQueue(dbPath, { agent: "orchestrator" });

// ===== SESSIONE 2: recall dopo compaction =====
const all = recall(vq);
ok(all.length === 2, "le note SOPRAVVIVONO alla compaction (recall=2)");
const m1 = all.find((m) => m.id === "find-refs-before-rename");
ok(m1 && /find-references/.test(m1.lesson) && /ImportError/.test(m1.example), "nota a 2 livelli intatta (lezione + esempio concreto)");

// recall con filtro (on-demand, mirato)
const filtered = recall(vq, "rename");
ok(filtered.length === 1 && filtered[0].id === "find-refs-before-rename", "recall con filtro 'rename' → 1 nota mirata");

// le note NON sono nelle lane DURABLE del <context> (recall on-demand). Eccezione onesta: la creazione
// di una nota appare TRANSITORIAMENTE in recent_changes finché non age-out (changelog logga ogni mutazione).
const ctx = assembleContext(vq, { now: Date.now() });
const durable = ctx.replace(/<recent_changes>[\s\S]*?<\/recent_changes>/, ""); // tolgo la finestra transiente
ok(!durable.includes("find-references") && !durable.includes("GEMINI_API_KEY"), "le note NON sono nelle lane durable (rules/vars/tasks); recall esplicito, non always-on");
// FIX(a) 2026-06-29 VERIFICATO: la nota NON trapela più in recent_changes (silent), MA il context SEGNALA
// quante note esistono (anti info-loss, msg 388: se nascondi → segnala, altrimenti il modello non le cerca).
const rcBlock = ctx.match(/<recent_changes>([\s\S]*?)<\/recent_changes>/)?.[1] ?? "";
ok(!rcBlock.includes("find-refs-before-rename"), "FIX(a): la nota NON trapela in recent_changes (silent)");
ok(/<notes count="2"/.test(ctx), "FIX(a): il context SEGNALA le 2 note disponibili (recall_lessons)");

// una nuova nota in sessione 2 si accumula senza perdere le precedenti
remember(vq, "df-before-download", "Verifica spazio disco (df) prima di download voluminosi.", "Disco pieno a metà di un download 80GB.");
ok(recall(vq).length === 3, "accumulo incrementale (3 note) senza perdita");

console.log(`\n===== recall_lessons() dopo compaction =====`);
for (const m of recall(vq)) console.log(`  [${m.id}] ${m.lesson}\n     es: ${m.example}`);
console.log(`\nnote-after-finding smoke-test: ${pass} passed, ${fail} failed`);
vq.close();
rmSync(dir, { recursive: true, force: true });
process.exit(fail ? 1 : 0);

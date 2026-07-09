/**
 * Wiring-test (rule #14 / #17) dell'ANCHOR EPISTEMICO `<current_date>` (utente msg 1473, idea #1: "mostrare la data
 * corrente / anno-mese"). Un test sulla sola funzione pura NON basta: il bug vivrebbe nel WIRING (l'estensione che
 * dimentica di passare `currentDate: true`, oppure il ramo nested che lo droppa). Questo blinda l'INTERA catena:
 *
 *   (1) RUNTIME — riproduce la chiamata dell'estensione (ramo non-nested) 1:1: assembleContext(vq,{secrets,currentDate:true})
 *       → `<current_date>YYYY-MM-DD</current_date>` presente, PRIMA riga del prefisso, granularità giorno.
 *   (2) RUNTIME — ramo nested: buildNestedWorkspace(...,{currentDate:true}) → la data compare anche in focus mode.
 *   (3) SOURCE — l'estensione context-assembly.ts passa `currentDate: true` in ENTRAMBI i rami (assembleContext +
 *       buildNestedWorkspace). È l'accoppiamento pi non-bootabile headless (stesso standard del wiring-test adaptive:
 *       la parte pi-coupled si verifica per lettura del source). Catturerebbe la regressione "qualcuno toglie il flag".
 *   (4) SOURCE — buildNestedWorkspace forwarda `currentDate: opts.currentDate` alla sua assembleContext interna
 *       (altrimenti il ramo focus perderebbe la data in silenzio).
 *
 * Fallirebbe col bug (flag assente in un punto qualsiasi della catena) e ora passa → il gap è chiuso PER SEMPRE.
 */
import { assembleContext } from "../../src/context-assembler.mjs";
import { buildNestedWorkspace, enterFocus } from "../../src/nested-compact.mjs";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const HARNESS_ROOT = join(__dir, "..", "..");
let passed = 0, failed = 0;
const ok = (c, m) => { if (c) passed++; else { failed++; console.error("  ✗ " + m); } };

const DATE_NOW = Date.UTC(2026, 6, 9, 13, 45, 12); // 2026-07-09 (mese 0-based: 6=luglio)

// (1) RUNTIME ramo non-nested — la chiamata dell'estensione: assembleContext(vq,{secrets,currentDate:true})
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("T1", "task uno");
  vq.setTaskStatus("T1", "in_progress");
  vq.setCurr("T1");
  const ctx = assembleContext(vq, { now: DATE_NOW, sinceMs: 0, secrets: [], currentDate: true });
  ok(ctx.includes("<current_date>2026-07-09</current_date>"), "wiring/non-nested: <current_date> iniettata (granularità giorno)");
  ok(ctx.indexOf("<current_date>") < ctx.indexOf("<rules>"), "wiring/non-nested: anchor in TESTA al prefisso");
  vq.close();
}

// (2) RUNTIME ramo nested (focus mode) — la data deve comparire anche in focus
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("T1", "task uno");
  vq.setTaskStatus("T1", "in_progress");
  vq.addTask("T2", "task due");
  vq.setCurr("T1");
  enterFocus(vq, { taskSubset: ["T1"], now: DATE_NOW });
  const nested = buildNestedWorkspace(vq, { now: DATE_NOW, currentDate: true, secrets: [] });
  ok(nested.includes("<current_date>2026-07-09</current_date>"), "wiring/nested: <current_date> presente anche in focus mode");
  vq.close();
}

// (3) SOURCE — l'estensione passa currentDate:true in ENTRAMBI i rami (pi-coupled, non-bootabile headless)
{
  const src = readFileSync(join(HARNESS_ROOT, ".pi", "extensions", "context-assembly.ts"), "utf8");
  // ramo non-nested: assembleContext(vq, { secrets: listSecretsMeta(), currentDate: true })
  ok(/assembleContext\(vq,\s*\{[^}]*currentDate:\s*true[^}]*\}\)/.test(src),
    "wiring/source: l'estensione passa currentDate:true ad assembleContext (ramo non-nested)");
  // ramo nested: buildNestedWorkspace(vq, { … currentDate: true })
  ok(/buildNestedWorkspace\(vq,\s*\{[^}]*currentDate:\s*true[^}]*\}\)/.test(src),
    "wiring/source: l'estensione passa currentDate:true a buildNestedWorkspace (ramo nested/focus)");
}

// (4) SOURCE — buildNestedWorkspace forwarda currentDate alla sua assembleContext interna (no drop silenzioso)
{
  const src = readFileSync(join(HARNESS_ROOT, "src", "nested-compact.mjs"), "utf8");
  ok(/assembleContext\(vq,\s*\{[^}]*currentDate:\s*opts\.currentDate[^}]*\}\)/.test(src),
    "wiring/source: buildNestedWorkspace forwarda currentDate:opts.currentDate (il ramo focus non lo perde)");
}

console.log(`\ncontext-date-injection-wiring: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

/**
 * run-durable-discriminant — DISCRIMINANTE C4 (trained-vs-untrained) su modelli CAPACI ≥27B via OpenRouter.
 *
 * DOMANDA (caveat esplicito di F33, [[wiki/harness-experiment-log §F33]]): il 9B fa `note=0` e PERDE il fatto durevole
 * NON-file-write; flash-lite SALVA solo la parte AZIONABILE (inglese britannico, rinforzata a ogni task) e PERDE il nome
 * ARBITRARIO ("ALDO-QX"). → **Un modello ≥27B/32B, più instruction-follower, salva ENTRAMBE le parti quando istruito
 * (col nudge anti-deflect), o fallisce anche lui?** Se fallisce → rafforza "la cattura DETERMINISTICA harness-side è il
 * fix robusto model-agnostico" (research-gap structured-update-injection). Se riesce → lo scale+instruction-following
 * basta col nudge, e la cattura deterministica resta un'ottimizzazione.
 *
 * METODO: per ogni modello lancia UNA sessione run-session.mjs (harness-in-the-loop, braccio `ours`) sugli STESSI he12,
 * pianta al task-1 il fatto durevole a 2 parti (ALDO-QX + inglese-britannico), keep6 → il fatto esce dalla finestra
 * nativa dopo ~6 turni → sopravvive SOLO se il modello lo SALVA in lane. Direttiva eviction = anti-deflect (miglior
 * framing). Isolamento: workdir + HARNESS_STATE_DIR dedicati per modello (rule feedback_isolate_parallel_project_resources).
 *
 * METRICHE (ground-truth, rule #15): noteCalls/saveToolCalls (ha salvato?) · pref.recall su "aldo-qx" (è sopravvissuto?)
 * · pref.answer (cosa ha risposto: confabula/onesto/corretto) · taskDigestFacts (cattura deterministica file-write) ·
 * evictionOrdinal (quante volte il checkpoint ha nudgeato) · pass-rate HumanEval (qualità coding attraverso l'harness).
 *
 * Uso (cwd=harness/):  node eval/run-durable-discriminant.mjs
 * Config (env): DISCR_MODELS (csv, default "qwen/qwen3.6-27b,qwen/qwen3-32b") · EVAL_N (default 12) · EVAL_KEEPS→keep
 *   (default 6) · DISCR_STYLE (default anti-deflect) · EVAL_TASKS_FILE (default humaneval-12.jsonl) · DISCR_LABEL.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { gradeHumanEval } from "./verify.mjs";
import { gradeProbe } from "./run-session-ab.mjs"; // SSOT del grader probe (recall/order) — non re-implementare

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER = join(__dirname, "run-session.mjs");

const MODELS = (process.env.DISCR_MODELS || "qwen/qwen3.6-27b,qwen/qwen3-32b").split(",").map((s) => s.trim()).filter(Boolean);
const TASKS_FILE = resolve(process.env.EVAL_TASKS_FILE || join(__dirname, "data", "humaneval-12.jsonl"));
const KEEP = Number(process.env.EVAL_KEEPS || 6);
const STYLE = process.env.DISCR_STYLE || "anti-deflect";
const LABEL = process.env.DISCR_LABEL || "durable-discriminant";
// Fatto durevole a 2 parti (design F33): (A) NOME ARBITRARIO non-azionabile = il discriminante duro (cade se non salvato,
// non è rinforzato da nessun task); (B) regola AZIONABILE = influenza ogni task di coding (rinforzata → più facile da tenere).
const PLANT = process.env.EVAL_PLANT_PREF
  || "Il committente si chiama ALDO-QX e ha una regola fissa per tutto il progetto: TUTTI i commenti nel codice devono essere scritti in inglese britannico.";
const PREF_KEY = (process.env.EVAL_PREF_KEY || "aldo-qx").toLowerCase();

if (!existsSync(TASKS_FILE)) { console.error(`Tasks file mancante: ${TASKS_FILE}`); process.exit(2); }
let tasks = readFileSync(TASKS_FILE, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
if (process.env.EVAL_N) tasks = tasks.slice(0, Math.max(1, parseInt(process.env.EVAL_N, 10)));
const N = tasks.length;

function parseWorkerOutput(stdout) {
  const lines = String(stdout || "").split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try { const o = JSON.parse(lines[i]); if (o && (o.mode === "session" || o.error)) return o; } catch { /* skip */ }
  }
  return null;
}

function runModel(model) {
  const safe = model.replace(/[^a-z0-9.]/gi, "_");
  const workdir = mkdtempSync(join(tmpdir(), `discr-${safe}-`));
  const stateDir = join(workdir, "_state");
  mkdirSync(stateDir, { recursive: true });
  const env = {
    ...process.env,
    EVAL_PROVIDER: "openrouter", MODEL_ID: model,
    EVAL_ARM: "ours", HARNESS_STATE_DIR: stateDir, HARNESS_NATIVE_KEEP_TURNS: String(KEEP),
    HARNESS_EVICTION_DIRECTIVE_STYLE: STYLE,
    EVAL_PLANT_PREF: PLANT, EVAL_PREF_KEY: PREF_KEY,
    EVAL_TASKS_FILE: TASKS_FILE, EVAL_N: String(N), EVAL_WORKDIR: workdir,
    EVAL_INTERTASK_DELAY_MS: process.env.EVAL_INTERTASK_DELAY_MS || "1200",
    EVAL_TASK_TIMEOUT_MS: process.env.EVAL_TASK_TIMEOUT_MS || "180000",
  };
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [WORKER], { env, cwd: workdir, encoding: "utf8", maxBuffer: 128 * 1024 * 1024, timeout: 50 * 60 * 1000 });
  const wallMs = Date.now() - t0;
  const parsed = parseWorkerOutput(r.stdout);
  if (!parsed) return { model, error: `no-output (exit ${r.status}) stderr=${String(r.stderr || "").slice(0, 500)}`, wallMs };
  if (parsed.error) return { model, error: parsed.error, wallMs };
  // grada le soluzioni col verifier ufficiale (test nascosto) + la probe memoria/timeline
  let passed = 0, graded = 0, apiErr = 0;
  const perTask = parsed.perTask.map((pt, i) => {
    const g = pt.apiError ? { passed: false, reason: "api-error" }
      : pt.solutionCode ? gradeHumanEval(tasks[i], pt.solutionCode) : { passed: false, reason: "no-solution" };
    if (pt.apiError) apiErr++; else { graded++; if (g.passed) passed++; }
    return { task_id: pt.task_id, entry_point: pt.entry_point, turns: pt.turns, passed: g.passed, reason: g.reason, apiError: pt.apiError };
  });
  const probe = gradeProbe(parsed.probe?.answer, tasks);
  return {
    model, wallMs,
    passed, graded, apiErr, passPct: graded ? +(100 * passed / graded).toFixed(1) : null,
    // C4 core: ha salvato il durevole? è sopravvissuto?
    noteCalls: parsed.noteCalls, jotCalls: parsed.jotCalls, setVarCalls: parsed.setVarCalls, saveToolCalls: parsed.saveToolCalls,
    prefRecall: parsed.pref?.recall ?? null, prefAnswer: parsed.pref?.answer ?? "",
    taskDigestFacts: parsed.taskDigestFacts, evictionOrdinal: parsed.evictionOrdinal, userTurnsRecorded: parsed.userTurnsRecorded,
    probeRecall: probe.recall, probeOrder: probe.orderScore,
    finalTokens: parsed.finalTokens, totTurns: perTask.reduce((a, p) => a + (p.turns || 0), 0), keyRotations: parsed.keyRotations,
    perTask,
  };
}

function fmt(n, d = 0) { return n == null ? "—" : Number(n).toFixed(d); }

async function main() {
  console.log(`\n=== DISCRIMINANTE DUREVOLE (C4) — ${MODELS.length} modelli × he${N} — keep${KEEP} · style=${STYLE} ===`);
  console.log(`plant: "${PLANT}"  · key: "${PREF_KEY}"\n`);
  const report = { label: LABEL, nTasks: N, keep: KEEP, style: STYLE, plant: PLANT, prefKey: PREF_KEY, models: [] };

  for (let mi = 0; mi < MODELS.length; mi++) {
    const model = MODELS[mi];
    process.stdout.write(`[${mi + 1}/${MODELS.length}] ${model.padEnd(22)} sessione ${N} task… `);
    const res = runModel(model);
    report.models.push(res);
    if (res.error) { console.log(`ERRORE: ${res.error}`); continue; }
    console.log(
      `pass ${res.passed}/${res.graded}${res.apiErr ? ` (+${res.apiErr} apiErr)` : ""} · ` +
      `SAVE note=${res.noteCalls}/jot=${res.jotCalls}/var=${res.setVarCalls} · prefRecall=${res.prefRecall} · ` +
      `evOrd=${res.evictionOrdinal} digest=${res.taskDigestFacts} · probe recall ${fmt(res.probeRecall * 100)}%/ord ${fmt(res.probeOrder * 100)}% · ` +
      `${Math.round(res.wallMs / 1000)}s`);
  }

  console.log(`\n=== SUMMARY (discriminante durevole) ===`);
  console.log(`model                   pass%   note  jot  var   prefRecall  evOrd  digest  probe-rec`);
  for (const m of report.models) {
    if (m.error) { console.log(`${m.model.padEnd(22)}  ERRORE: ${m.error}`); continue; }
    console.log(
      `${m.model.padEnd(22)}  ${fmt(m.passPct).padStart(5)}  ${String(m.noteCalls).padStart(4)}  ${String(m.jotCalls).padStart(3)}  ` +
      `${String(m.setVarCalls).padStart(3)}   ${String(m.prefRecall).padStart(9)}  ${String(m.evictionOrdinal).padStart(5)}  ${String(m.taskDigestFacts).padStart(6)}  ${(fmt(m.probeRecall * 100) + "%").padStart(8)}`);
  }
  const outPath = join(__dirname, "data", `report-${LABEL}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nreport → ${outPath}`);
  console.log(`\nRIFERIMENTO (F33): 9B → note=0, prefRecall=false (non salva) · flash-lite → note=1, prefRecall=false (salva solo la parte azionabile, perde ALDO-QX)`);
}

main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });

/**
 * run-ab — ORCHESTRATORE A/B: pi vanilla vs pi+nostre-estensioni su un subset HumanEval (Modo 1, agentico per-task).
 *
 * SEQUENZIALE (un worker alla volta = un test alla volta: la key Gemini è free/rate-limited, utente msg 1031),
 * con delay tra i run. Per ogni (task × config): spawn `run-one.mjs` in un workdir+state-dir ISOLATI → grada col
 * verifier ufficiale → registra {pass, ms, turni, tool, token, ctx}. Poi aggrega per config e scrive un report.
 *
 * Config (env):
 *   EVAL_N        = quanti task (default = tutti quelli nel dataset)
 *   EVAL_ARMS     = "vanilla,ours" (default)
 *   EVAL_KEEPS    = keepTurns per il braccio ours, csv (default "1,3,6")
 *   EVAL_DELAY_MS = pausa tra run (default 4000, per stare sotto il rate-limit free)
 *   EVAL_DATASET  = jsonl (default eval/data/humaneval-10.jsonl)
 *   EVAL_LABEL    = etichetta del report (default: run)
 *   MODEL_ID      = default gemini-3.1-flash-lite
 *
 * NB assunzione dichiarata: in headless i confirm dei gate (pre-flight/secrets) sono AUTO-APPROVATI (nessun umano);
 * l'A/B misura l'effetto CONTESTO/MEMORIA dell'harness, non i gate interattivi. gemini-compat NON serve (provider nativo).
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gradeHumanEval } from "./verify.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const RUN_ONE = join(here, "run-one.mjs");
const DATA = join(here, "data");

const DATASET = process.env.EVAL_DATASET || join(DATA, "humaneval-10.jsonl");
const ARMS = (process.env.EVAL_ARMS || "vanilla,ours").split(",").map((s) => s.trim()).filter(Boolean);
const KEEPS = (process.env.EVAL_KEEPS || "1,3,6").split(",").map((s) => parseInt(s, 10)).filter(Number.isFinite);
const DELAY_MS = parseInt(process.env.EVAL_DELAY_MS || "4000", 10);
const RETRY_DELAY_MS = parseInt(process.env.EVAL_RETRY_DELAY_MS || "30000", 10); // backoff su errore-API (429/5xx)
const MAX_RETRIES = parseInt(process.env.EVAL_MAX_RETRIES || "1", 10);
const LABEL = process.env.EVAL_LABEL || "run";
const MODEL_ID = process.env.MODEL_ID || "gemini-3.1-flash-lite";

if (!existsSync(DATASET)) { console.error(`dataset assente: ${DATASET} — lancia prima eval/fetch-humaneval.mjs`); process.exit(2); }
let tasks = readFileSync(DATASET, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
if (process.env.EVAL_N) tasks = tasks.slice(0, Math.max(1, parseInt(process.env.EVAL_N, 10) || tasks.length));

const configs = [];
if (ARMS.includes("vanilla")) configs.push({ arm: "vanilla", keep: null, key: "vanilla" });
if (ARMS.includes("ours")) for (const k of KEEPS) configs.push({ arm: "ours", keep: k, key: `ours@keep${k}` });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isRateLimit = (s) => /429|quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(String(s || ""));

function runWorker(task, cfg) {
  const workdir = mkdtempSync(join(tmpdir(), "eval-wd-"));
  const statedir = join(workdir, "state");
  writeFileSync(join(workdir, "_task.json"), JSON.stringify(task));
  const env = {
    ...process.env, MODEL_ID,
    EVAL_ARM: cfg.arm, EVAL_WORKDIR: workdir, EVAL_TASK_FILE: join(workdir, "_task.json"),
    HARNESS_STATE_DIR: statedir,
  };
  if (cfg.arm === "ours") env.HARNESS_NATIVE_KEEP_TURNS = String(cfg.keep);
  else delete env.HARNESS_NATIVE_KEEP_TURNS;

  const r = spawnSync(process.execPath, [RUN_ONE], {
    cwd: workdir, env, encoding: "utf8", timeout: 210000, maxBuffer: 64 * 1024 * 1024,
  });
  let parsed = null;
  const lastJson = (r.stdout || "").split(/\r?\n/).filter(Boolean).reverse().find((l) => l.startsWith("{"));
  try { parsed = lastJson ? JSON.parse(lastJson) : null; } catch { /* fall through */ }
  if (!parsed) {
    // worker morto: prova l'error JSON su stderr
    const errJson = (r.stderr || "").split(/\r?\n/).filter(Boolean).reverse().find((l) => l.startsWith("{"));
    try { parsed = errJson ? JSON.parse(errJson) : null; } catch { /* ignore */ }
    parsed = parsed || { error: `worker exit ${r.status}: ${(r.stderr || "").slice(-300)}` };
  }
  try { rmSync(workdir, { recursive: true, force: true }); } catch { /* best effort */ }
  return parsed;
}

// ---------------- run ----------------
const rows = [];
const t0 = Date.now();
console.log(`\n=== A/B HumanEval — ${tasks.length} task × ${configs.length} config (${configs.map((c) => c.key).join(", ")}) — model=${MODEL_ID} — delay=${DELAY_MS}ms ===\n`);

let idx = 0, total = tasks.length * configs.length, rateLimited = 0;
for (const task of tasks) {
  for (const cfg of configs) {
    idx++;
    let w = runWorker(task, cfg);
    // retry con backoff su ERRORE-API (429/5xx/empty deglutito): NON è un fallimento di capacità del modello.
    for (let attempt = 1; attempt <= MAX_RETRIES && (w.apiError || isRateLimit(w.sendErr) || isRateLimit(w.error)); attempt++) {
      console.log(`      ⚠ errore-API (http=${w.httpStatus ?? "?"} ${String(w.retryErr ?? w.sendErr ?? w.error ?? "").slice(0, 80)}) → backoff ${RETRY_DELAY_MS / 1000}s + retry ${attempt}/${MAX_RETRIES}`);
      await sleep(RETRY_DELAY_MS);
      w = runWorker(task, cfg);
    }
    const errored = w.apiError === true || !!w.error;
    if (errored) rateLimited++;
    const g = errored ? { passed: false, reason: "api-error" } : gradeHumanEval(task, w.solutionCode);
    const row = {
      task_id: task.task_id, config: cfg.key, arm: cfg.arm, keep: cfg.keep,
      passed: g.passed, gradeReason: g.reason, errored,
      ms: w.ms ?? null, turns: w.turns ?? null, nTools: Array.isArray(w.toolCalls) ? w.toolCalls.length : null,
      tokens: w.tokens ?? null, hasContext: w.hasContext ?? null, wroteFile: w.wroteFile ?? null,
      nExt: w.nExt ?? null, httpStatus: w.httpStatus ?? null, error: w.error ?? w.retryErr ?? w.sendErr ?? null,
    };
    rows.push(row);
    console.log(`[${idx}/${total}] ${task.task_id.padEnd(14)} ${cfg.key.padEnd(12)} ${errored ? "ERR " : (row.passed ? "PASS" : "FAIL")}` +
      ` (${g.reason}) ms=${row.ms} turns=${row.turns} tok=${row.tokens} ctx=${row.hasContext}` +
      `${errored ? ` ⚠API http=${row.httpStatus ?? "?"} ${String(row.error || "").slice(0, 70)}` : ""}`);
    if (idx < total) await sleep(DELAY_MS);
  }
}

// ---------------- aggregate ----------------
function agg(key) {
  const rs = rows.filter((r) => r.config === key);
  const n = rs.length;
  const errored = rs.filter((r) => r.errored).length;
  const graded = rs.filter((r) => !r.errored);           // pass-rate SOLO sui run non-errore-API (fair)
  const denom = graded.length, ok = graded.filter((r) => r.passed).length;
  const avg = (f) => { const v = graded.map(f).filter((x) => typeof x === "number"); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
  const pct = (f) => (denom ? Math.round((100 * graded.filter(f).length) / denom) : 0);
  return { key, n, errored, graded: denom, pass: ok, passPct: denom ? Math.round((100 * ok) / denom) : 0,
    avgMs: avg((r) => r.ms), avgTurns: avg((r) => r.turns), avgTok: avg((r) => r.tokens),
    avgTools: avg((r) => r.nTools), ctxPct: pct((r) => r.hasContext === true), wrotePct: pct((r) => r.wroteFile === true) };
}
const summary = configs.map((c) => agg(c.key));

console.log(`\n=== SUMMARY (${((Date.now() - t0) / 1000).toFixed(0)}s${rateLimited ? `, ⚠${rateLimited} errori-API esclusi dal pass-rate` : ""}) ===`);
console.log(`config        graded  pass%  err  avgMs   turns  avgTok   tools  ctx%  wrote%`);
for (const s of summary) {
  console.log(`${s.key.padEnd(13)} ${`${s.pass}/${s.graded}`.padEnd(7)} ${String(s.passPct).padEnd(5)}  ` +
    `${String(s.errored).padEnd(3)}  ${String(s.avgMs).padEnd(6)}  ${String(s.avgTurns).padEnd(5)}  ` +
    `${String(s.avgTok).padEnd(7)} ${String(s.avgTools).padEnd(6)} ${String(s.ctxPct).padEnd(5)} ${s.wrotePct}`);
}

mkdirSync(DATA, { recursive: true });
const reportPath = join(DATA, `report-${LABEL}.json`);
writeFileSync(reportPath, JSON.stringify({ model: MODEL_ID, dataset: DATASET, nTasks: tasks.length, configs: configs.map((c) => c.key), durationSec: Math.round((Date.now() - t0) / 1000), rateLimited, summary, rows }, null, 2));
console.log(`\nreport → ${reportPath}`);
process.exit(0);

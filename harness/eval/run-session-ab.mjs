/**
 * run-session-ab — ORCHESTRATORE MODO 2 (long-horizon). Per ogni config {vanilla, ours@1, ours@6} lancia UNA
 * sessione (run-session.mjs) sugli STESSI N task, grada ogni soluzione col verifier ufficiale HumanEval, e
 * AUTO-GRADA la probe di memoria/timeline (recall dei nomi-funzione + preservazione dell'ordine).
 *
 * SEQUENZIALE (un config alla volta) per la key free. Isolamento: workdir + HARNESS_STATE_DIR dedicati per config.
 *
 * Config (env): EVAL_TASKS_FILE (default eval/data/humaneval-6.jsonl) · EVAL_N · EVAL_ARMS (default vanilla,ours)
 *   · EVAL_KEEPS (default 1,6) · EVAL_DELAY_MS (tra config, default 15000) · MODEL_ID · EVAL_LABEL (default session)
 *
 * Uso (cwd=harness/):  node eval/run-session-ab.mjs
 */
import { spawnSync } from "node:child_process";
import { loadGeminiKeys } from "./gemini-keys.mjs"; // SSOT multi-key: 1 chiave per config (no contesa quota nelle sessioni lunghe)
import { makeKeyRotator, isRateLimited } from "./gemini-key-rotator.mjs"; // rotazione + detection 429 (SSOT)
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gradeHumanEval } from "./verify.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARNESS = resolve(__dirname, "..");
const WORKER = join(__dirname, "run-session.mjs");
const KEYS = loadGeminiKeys();
const NKEYS = Math.max(1, KEYS.length); // chiavi disponibili per la rotazione per-config
// rotazione robusta delle chiavi (utente msg 1178/1180): morta dopo 2 blocchi (429) CONSECUTIVI, tutte-morte → cooldown
// 60s + sblocco, cap 5 cicli; ZERO ping (impara dai run reali). Parametri SSOT nel modulo → qui solo `log`.
const rotator = makeKeyRotator(NKEYS, { log: (m) => console.log(`\n  ⚠ ${m}`) });

// path ASSOLUTO: il worker gira in un tempdir isolato (cwd≠harness) → un path relativo non risolverebbe lì.
const TASKS_FILE = resolve(process.env.EVAL_TASKS_FILE || join(__dirname, "data", "humaneval-6.jsonl"));
const MODEL_ID = process.env.MODEL_ID || "gemini-3.1-flash-lite";
const ARMS = (process.env.EVAL_ARMS || "vanilla,ours").split(",").map((s) => s.trim()).filter(Boolean);
const KEEPS = (process.env.EVAL_KEEPS || "1,6").split(",").map((s) => parseInt(s.trim(), 10));
const DELAY_MS = Number(process.env.EVAL_DELAY_MS || 15000);
const LABEL = process.env.EVAL_LABEL || "session";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!existsSync(TASKS_FILE)) { console.error(`Tasks file mancante: ${TASKS_FILE} — genera con fetch-humaneval.mjs`); process.exit(2); }
let tasks = readFileSync(TASKS_FILE, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
if (process.env.EVAL_N) tasks = tasks.slice(0, Math.max(1, parseInt(process.env.EVAL_N, 10)));
const N = tasks.length;

const configs = [];
for (const arm of ARMS) {
  if (arm === "vanilla") configs.push({ arm: "vanilla", keep: null, label: "vanilla" });
  else if (arm === "ours") for (const k of KEEPS) configs.push({ arm: "ours", keep: k, label: `ours@keep${k}` });
}

function parseWorkerOutput(stdout) {
  const lines = String(stdout || "").split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try { const o = JSON.parse(lines[i]); if (o && (o.mode === "session" || o.error)) return o; } catch { /* skip */ }
  }
  return null;
}

function runConfig(cfg, keyIndex) {
  const workdir = mkdtempSync(join(tmpdir(), `eval-sess-${cfg.label.replace(/[^a-z0-9]/gi, "")}-`));
  const env = { ...process.env, EVAL_ARM: cfg.arm, EVAL_WORKDIR: workdir, EVAL_TASKS_FILE: TASKS_FILE, EVAL_N: String(N), MODEL_ID };
  env.EVAL_KEY_INDEX = String(keyIndex); // chiave scelta dal rotator (dead-key aware, nessun pre-flight)
  if (cfg.arm === "ours") {
    env.HARNESS_STATE_DIR = join(workdir, "_state");
    mkdirSync(env.HARNESS_STATE_DIR, { recursive: true });
    env.HARNESS_NATIVE_KEEP_TURNS = String(cfg.keep);
  }
  const r = spawnSync(process.execPath, [WORKER], { env, cwd: workdir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
  const parsed = parseWorkerOutput(r.stdout);
  if (!parsed) return { error: `no-output (exit ${r.status}) stderr=${String(r.stderr || "").slice(0, 400)}` };
  return parsed;
}

// LIS per orderScore (quanto l'ordine delle funzioni citate nella probe rispetta l'ordine di risoluzione)
export function lisLen(seq) {
  const tails = [];
  for (const x of seq) {
    let lo = 0, hi = tails.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (tails[mid] < x) lo = mid + 1; else hi = mid; }
    tails[lo] = x;
  }
  return tails.length;
}
// similarità Levenshtein normalizzata [0..1] — il modello a volte cita il nome-funzione con un typo
// (es. has_close_element vs has_close_element**s**): un match ESATTO conterebbe un typo come "dimenticato".
export function levRatio(a, b) {
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  const prev = Array(n + 1).fill(0), cur = Array(n + 1).fill(0);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
    }
    for (let j = 0; j <= n; j++) prev[j] = cur[j];
  }
  return 1 - prev[n] / Math.max(m, n);
}
// FUZZY: un ep è "ricordato" se compare come substring esatta O come token con similarità ≥ soglia.
// Misura la MEMORIA (ha ricordato il task), non l'ortografia esatta del nome.
export function gradeProbe(answer, taskList, thresh = 0.85) {
  const ans = String(answer || "").toLowerCase();
  const words = [...new Set(ans.match(/[a-z_][a-z0-9_]{2,}/g) || [])];
  const eps = taskList.map((t) => String(t.entry_point).toLowerCase());
  const found = []; // {i, pos} degli ep ricordati
  eps.forEach((ep, i) => {
    let best = { ratio: 0, pos: -1 };
    const exact = ans.indexOf(ep);
    if (exact >= 0) best = { ratio: 1, pos: exact };
    else for (const w of words) { const r = levRatio(ep, w); if (r > best.ratio) best = { ratio: r, pos: ans.indexOf(w) }; }
    if (best.ratio >= thresh) found.push({ i, pos: best.pos });
  });
  const recall = eps.length ? found.length / eps.length : 0;
  found.sort((a, b) => a.pos - b.pos);
  const orderScore = eps.length ? lisLen(found.map((x) => x.i)) / eps.length : 0;
  return { recall, orderScore, nMentioned: found.length, nTasks: eps.length };
}

function fmt(n, d = 0) { return n == null ? "—" : Number(n).toFixed(d); }

async function main() {
  console.log(`\n=== MODO 2 long-horizon — ${N} task/sessione × ${configs.length} config — model=${MODEL_ID} ===`);
  console.log(`configs: ${configs.map((c) => c.label).join(", ")}  ·  tasks: ${tasks.map((t) => t.entry_point).join(", ")}\n`);

  const report = { model: MODEL_ID, nTasks: N, tasks: tasks.map((t) => t.task_id), configs: [] };

  for (let ci = 0; ci < configs.length; ci++) {
    const cfg = configs[ci];
    const keyIndex = await rotator.next(); // chiave viva (o cooldown+sblocco se tutte morte, o -1 se esaurite davvero)
    if (keyIndex < 0) { console.log(`\n⚠ ${NKEYS} chiavi esaurite anche dopo cooldown → stop (esaurimento reale, non RPM)`); report.configs.push({ label: cfg.label, error: "all-keys-quota-exhausted" }); break; }
    process.stdout.write(`[${ci + 1}/${configs.length}] ${cfg.label.padEnd(12)} sessione ${N} task (key ${keyIndex})… `);
    const res = runConfig(cfg, keyIndex);
    // report al rotator: config 429ata (errore rate-limit o TUTTI i task api-err) → blocco consecutivo su quella chiave
    if (isRateLimited(res.error) || (res.perTask?.length > 0 && res.perTask.every((pt) => pt.apiError))) rotator.reportBlocked(keyIndex);
    else rotator.reportOk(keyIndex);
    if (res.error) { console.log(`ERRORE: ${res.error}`); report.configs.push({ label: cfg.label, error: res.error }); if (ci < configs.length - 1) await sleep(DELAY_MS); continue; }

    // grada ogni task col verifier ufficiale (test nascosto dal dataset)
    let passed = 0, graded = 0, apiErr = 0;
    const perTask = res.perTask.map((pt, i) => {
      const g = pt.apiError ? { passed: false, reason: "api-error" }
        : pt.solutionCode ? gradeHumanEval(tasks[i], pt.solutionCode) : { passed: false, reason: "no-solution" };
      if (pt.apiError) apiErr++; else { graded++; if (g.passed) passed++; }
      return { task_id: pt.task_id, entry_point: pt.entry_point, turns: pt.turns, ms: pt.ms, tokensCumulative: pt.tokensCumulative, passed: g.passed, reason: g.reason, apiError: pt.apiError };
    });
    const probe = gradeProbe(res.probe?.answer, tasks);
    const passPct = graded ? (100 * passed / graded) : 0;
    const totTurns = perTask.reduce((a, p) => a + (p.turns || 0), 0);

    console.log(`pass ${passed}/${graded}${apiErr ? ` (+${apiErr} api-err)` : ""}  · probe recall ${fmt(probe.recall * 100)}% ordine ${fmt(probe.orderScore * 100)}%  · evOrd ${res.evictionOrdinal} saves ${res.saveToolCalls} digestFacts ${res.taskDigestFacts} · turni ${totTurns} · tok ${res.finalTokens}`);
    report.configs.push({ label: cfg.label, arm: cfg.arm, keep: cfg.keep, nExt: res.nExt, hasContext: res.hasContext, passed, graded, apiErr, passPct, totTurns, finalTokens: res.finalTokens, userTurnsRecorded: res.userTurnsRecorded, evictionOrdinal: res.evictionOrdinal, noteCalls: res.noteCalls, jotCalls: res.jotCalls, setVarCalls: res.setVarCalls, saveToolCalls: res.saveToolCalls, taskDigestFacts: res.taskDigestFacts, probe: { ...probe, turns: res.probe?.turns, apiError: res.probe?.apiError }, probeAnswer: res.probe?.answer, pref: res.pref ?? null, perTask }); // F22: forwarda le guardie di regressione (userTurnsRecorded/evictionOrdinal) + F23: conteggio salvataggi (saveToolCalls) dal worker + C3: pref (durable-preference persistence)

    if (ci < configs.length - 1) await sleep(DELAY_MS);
  }

  // --- SUMMARY ---
  console.log(`\n=== SUMMARY (Modo 2, ${N} task/sessione) ===`);
  console.log(`config        pass%   probe-recall  probe-ordine  turni-tot  tok-finali`);
  for (const c of report.configs) {
    if (c.error) { console.log(`${c.label.padEnd(12)}  ERRORE: ${c.error}`); continue; }
    console.log(`${c.label.padEnd(12)}  ${fmt(c.passPct).padStart(4)}   ${(fmt(c.probe.recall * 100) + "%").padStart(10)}  ${(fmt(c.probe.orderScore * 100) + "%").padStart(11)}  ${String(c.totTurns).padStart(8)}  ${String(c.finalTokens).padStart(9)}`);
  }
  const outPath = join(__dirname, "data", `report-${LABEL}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nreport → ${outPath}`);
}

// main-guard: esegue l'orchestratore solo se lanciato direttamente (non quando importato per test — es. gradeProbe)
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });
}

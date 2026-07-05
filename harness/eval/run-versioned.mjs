/**
 * run-versioned — ORCHESTRATORE "benchmark versionato" (utente msg 1103/1106, 2026-07-05).
 *
 * Produce la tabella comparativa che l'utente ha chiesto: pi VANILLA vs NOSTRA-versione a STATI successivi
 * (stato-1 = scaffolding FULL, stato-2 = scaffolding LEAN, …), su un set HARD con n>5 (Modo 1) + i test base
 * long-horizon (Modo 2). SEQUENZIALE (key gemini free/rate-limited) — un processo, nessuna collisione di rate.
 *
 * LADDER MODELLO (utente msg 1106): parte da `gemini-3.1-flash-lite`; se una cella esaurisce la quota
 * (TUTTI i run in errore-API) sale a `gemini-3.1-flash` (un po' più capace) e RI-esegue quella cella. Il modello
 * effettivamente usato è ETICHETTATO per-cella nel report (mai mescolare i due nella stessa riga).
 * NIENTE PII nei report (nessun dato hardware dell'utente): qui si scrivono solo metriche di eval.
 *
 * Riusa (DRY/SSOT #16) gli orchestratori esistenti: `run-ab.mjs` (Modo 1) e `run-session-ab.mjs` (Modo 2)
 * via spawn, variando SOLO l'env. Scrive `eval/data/report-versioned.json` (+ i report per-cella dei sotto-runner),
 * aggiornandolo DOPO OGNI fase → se il processo muore, i risultati parziali restano.
 *
 * Uso (cwd=harness/):  node eval/run-versioned.mjs         (o in background)
 * Env opzionali:  VERS_N (cap task Modo1, default = tutti hard10) · VERS_SESSION_N (cap task Modo2, default 6)
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARNESS = resolve(__dirname, "..");
const DATA = join(__dirname, "data");
const RUN_AB = join(__dirname, "run-ab.mjs");
const RUN_SESSION_AB = join(__dirname, "run-session-ab.mjs");
const HARD10 = join(DATA, "humaneval-hard10.jsonl");
const BASE6 = join(DATA, "humaneval-6.jsonl");
const OUT = join(DATA, "report-versioned.json");

const MODELS = ["gemini-3.1-flash-lite", "gemini-3.1-flash"]; // ladder: lite → flash su esaurimento
const shortModel = (m) => (m.includes("flash-lite") ? "flashlite" : m.includes("flash") ? "flash" : m);

function readReport(label) {
  const p = join(DATA, `report-${label}.json`);
  try { return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; } catch { return null; }
}

// combinato: aggiornato dopo ogni fase (crash-safe → parziali preservati)
const combined = {
  note: "Benchmark versionato harness: pi vanilla vs nostra-versione per STATO (scaffolding full/lean, keepTurns). Nessuna PII.",
  createdBy: "eval/run-versioned.mjs",
  modo1: { dataset: "humaneval-hard10", nTasks: null, cells: [] },
  modo2: { dataset: "humaneval-6", model: null, model_short: null, configs: [] },
};
function flush() { writeFileSync(OUT, JSON.stringify(combined, null, 2)); }

// ---------------- FASE 1 — Modo 1 (per-task, set hard, n>5) ----------------
// Celle = STATI della "nostra versione" + il baseline vanilla. Il livello scaffolding è l'asse di stato.
const M1_CELLS = [
  { label: "vanilla", arms: "vanilla", keeps: "6", level: "full", primaryArm: "vanilla", cfgKey: "vanilla" },
  { label: "ours-full", arms: "ours", keeps: "6", level: "full", primaryArm: "ours", cfgKey: "ours@keep6" }, // stato-1
  { label: "ours-lean", arms: "ours", keeps: "6", level: "lean", primaryArm: "ours", cfgKey: "ours@keep6" }, // stato-2
];

function runModo1Cell(cell) {
  for (let mi = 0; mi < MODELS.length; mi++) {
    const model = MODELS[mi];
    const label = `v-m1-${cell.label}-${shortModel(model)}`;
    const env = {
      ...process.env, MODEL_ID: model,
      EVAL_DATASET: HARD10, EVAL_ARMS: cell.arms, EVAL_KEEPS: cell.keeps,
      EVAL_LABEL: label, HARNESS_LANE_MEMORY_HINT_LEVEL: cell.level,
      EVAL_DELAY_MS: process.env.EVAL_DELAY_MS || "4000",
    };
    if (process.env.VERS_N) env.EVAL_N = process.env.VERS_N;
    console.log(`\n### MODO1 cella=${cell.label} modello=${model} ###`);
    spawnSync(process.execPath, [RUN_AB], { cwd: HARNESS, env, stdio: "inherit", timeout: 60 * 60 * 1000 });
    const rep = readReport(label);
    const s = rep?.summary?.find((x) => x.key === cell.cfgKey) || rep?.summary?.[0] || null;
    const graded = s?.graded ?? 0;
    // escalation SOLO se la cella è completamente esaurita (0 run gradati = tutti errore-API) e c'è un modello sopra
    if (graded === 0 && mi < MODELS.length - 1) {
      console.log(`   ⚠ cella ${cell.label}: 0 run gradati su ${model} (quota?) → salgo a ${MODELS[mi + 1]}`);
      continue;
    }
    return { label: cell.label, cfgKey: cell.cfgKey, model, model_short: shortModel(model), level: cell.level,
      summary: s, reportLabel: label, nTasks: rep?.nTasks ?? null };
  }
  return { label: cell.label, cfgKey: cell.cfgKey, model: null, error: "esaurita quota su TUTTI i modelli del ladder" };
}

console.log(`=== BENCHMARK VERSIONATO — Modo1 (hard10) + Modo2 (base6) — ladder ${MODELS.join(" → ")} ===`);
for (const cell of M1_CELLS) {
  const res = runModo1Cell(cell);
  combined.modo1.cells.push(res);
  if (combined.modo1.nTasks == null && res.nTasks) combined.modo1.nTasks = res.nTasks;
  flush();
  if (res.error) console.log(`   ✗ ${cell.label}: ${res.error}`);
}

// ---------------- FASE 2 — Modo 2 (long-horizon, base6) ----------------
function runModo2() {
  for (let mi = 0; mi < MODELS.length; mi++) {
    const model = MODELS[mi];
    const label = `v-m2-${shortModel(model)}`;
    const env = {
      ...process.env, MODEL_ID: model,
      EVAL_TASKS_FILE: BASE6, EVAL_ARMS: "vanilla,ours", EVAL_KEEPS: "1,6",
      EVAL_LABEL: label, HARNESS_LANE_MEMORY_HINT_LEVEL: "full", EVAL_DELAY_MS: "15000",
    };
    if (process.env.VERS_SESSION_N) env.EVAL_N = process.env.VERS_SESSION_N;
    console.log(`\n### MODO2 sessione modello=${model} ###`);
    spawnSync(process.execPath, [RUN_SESSION_AB], { cwd: HARNESS, env, stdio: "inherit", timeout: 60 * 60 * 1000 });
    const rep = readReport(label);
    const allErr = rep?.configs?.length ? rep.configs.every((c) => c.error || c.graded === 0) : true;
    if (allErr && mi < MODELS.length - 1) {
      console.log(`   ⚠ Modo2: tutte le config esaurite su ${model} → salgo a ${MODELS[mi + 1]}`);
      continue;
    }
    return { model, model_short: shortModel(model), configs: rep?.configs ?? [], reportLabel: label };
  }
  return { model: null, error: "esaurita quota su TUTTI i modelli del ladder" };
}

const m2 = runModo2();
combined.modo2.model = m2.model;
combined.modo2.model_short = m2.model_short ?? null;
combined.modo2.configs = m2.configs ?? [];
if (m2.error) combined.modo2.error = m2.error;
flush();

console.log(`\n=== FATTO → ${OUT} ===`);
process.exit(0);

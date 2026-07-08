/**
 * run-matrix — ORCHESTRATORE MATRICE modello × feature (utente msg 1395/B, 2026-07-08).
 *
 * Sweep-a (task-set × modello × feature-combo × keepTurns) lanciando `run-session-ab.mjs` per cella, ne legge il
 * report JSON, e AGGREGA TUTTO in UNA tabella-master (markdown + JSON). Poi trova le COMPOSIZIONI migliori e
 * consolida la config di PRODUZIONE. Scrive INCREMENTALE (dopo ogni cella) → risultati parziali subito + crash-safe.
 *
 * Provider: gemini (cloud, key+quota) e ollama (locale, quota-free) — asse-modello vero. Ogni run-session-ab isola
 * workdir + HARNESS_STATE_DIR per config (già suo).
 *
 * Config (env, tutti opzionali — default = matrice piena ragionevole):
 *   MATRIX_TASKSETS = csv di path jsonl (default eval/data/humaneval-6.jsonl)
 *   MATRIX_MODELS   = csv di "provider:model[:ctx]" (default gemini:gemini-3.1-flash-lite,ollama:gemma4:e4b)
 *   MATRIX_COMBOS   = csv di label-feature-combo (subset di FEATURE_COMBOS; default = tutti)
 *   MATRIX_KEEPS    = csv keepTurns per l'arm ours (default 1,6)
 *   MATRIX_LABEL    = etichetta output (default matrix)
 *   EVAL_N          = limita i task del file
 *
 * Uso (cwd=harness/):  MATRIX_MODELS=ollama:gemma4:e4b node eval/run-matrix.mjs
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AB = join(__dirname, "run-session-ab.mjs");
const DATA = join(__dirname, "data");

// ── FEATURE COMBOS: i flag che contano (dai findings F26/F27/H6). Ogni combo = env applicato all'arm ours. ──
const FEATURE_COMBOS = [
  { label: "base",         env: { HARNESS_TASK_DIGEST: "off", HARNESS_CONTEXT_VIEWS: "off", HARNESS_LANE_MEMORY_HINT_LEVEL: "full", HARNESS_EVICTION_INJECT_MODE: "preuser" } },
  { label: "digest",       env: { HARNESS_TASK_DIGEST: "on",  HARNESS_CONTEXT_VIEWS: "off", HARNESS_LANE_MEMORY_HINT_LEVEL: "full", HARNESS_EVICTION_INJECT_MODE: "preuser" } },
  { label: "digest+lean",  env: { HARNESS_TASK_DIGEST: "on",  HARNESS_CONTEXT_VIEWS: "off", HARNESS_LANE_MEMORY_HINT_LEVEL: "lean", HARNESS_EVICTION_INJECT_MODE: "preuser" } },
  { label: "digest+views", env: { HARNESS_TASK_DIGEST: "on",  HARNESS_CONTEXT_VIEWS: "on",  HARNESS_LANE_MEMORY_HINT_LEVEL: "full", HARNESS_EVICTION_INJECT_MODE: "preuser" } },
  { label: "all",          env: { HARNESS_TASK_DIGEST: "on",  HARNESS_CONTEXT_VIEWS: "on",  HARNESS_LANE_MEMORY_HINT_LEVEL: "lean", HARNESS_EVICTION_INJECT_MODE: "preuser" } },
];

const TASKSETS = (process.env.MATRIX_TASKSETS || join(DATA, "humaneval-6.jsonl")).split(",").map((s) => resolve(s.trim())).filter(Boolean);
const MODELS = (process.env.MATRIX_MODELS || "gemini:gemini-3.1-flash-lite,ollama:gemma4:e4b").split(",").map((s) => {
  // formato provider:model[:ctx] — attenzione: i model-id ollama contengono ':' (gemma4:e4b) → split controllato
  const t = s.trim(); const i = t.indexOf(":"); const provider = t.slice(0, i); const rest = t.slice(i + 1);
  const parts = rest.split(":"); let ctx = null;
  if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) ctx = Number(parts.pop());
  return { provider, model: parts.join(":"), ctx };
}).filter((m) => m.provider && m.model);
const COMBOS = process.env.MATRIX_COMBOS ? FEATURE_COMBOS.filter((c) => process.env.MATRIX_COMBOS.split(",").map((s) => s.trim()).includes(c.label)) : FEATURE_COMBOS;
const KEEPS = (process.env.MATRIX_KEEPS || "1,6").split(",").map((s) => s.trim()).filter(Boolean);
const LABEL = process.env.MATRIX_LABEL || "matrix";
const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");

const rows = []; // riga = { taskset, provider, model, combo, arm, keep, passPct, recall, order, turns, tokens, digestFacts, evOrd, saves, error }
const outJson = join(DATA, `report-${LABEL}.json`);
const outMd = join(DATA, `report-${LABEL}.md`);

function runCell({ taskset, m, combo, arms, keeps }) {
  const label = `${LABEL}-${slug(m.provider)}-${slug(m.model)}-${slug(basename(taskset).replace(".jsonl", ""))}-${combo ? combo.label : "vanilla"}`;
  const env = {
    ...process.env,
    EVAL_PROVIDER: m.provider, MODEL_ID: m.model,
    EVAL_TASKS_FILE: taskset, EVAL_ARMS: arms, EVAL_KEEPS: keeps.join(","),
    EVAL_LABEL: label,
  };
  if (m.ctx) env.MODEL_CTX = String(m.ctx);
  if (combo) for (const [k, v] of Object.entries(combo.env)) env[k] = v;
  const started = Date.now();
  process.stdout.write(`  ▶ ${m.provider}:${m.model} · ${combo ? combo.label : "vanilla"} · ${basename(taskset)} (arms=${arms} keeps=${keeps.join(",")}) … `);
  const r = spawnSync(process.execPath, [AB], { env, encoding: "utf8", maxBuffer: 128 * 1024 * 1024, timeout: 90 * 60 * 1000 });
  const dt = ((Date.now() - started) / 1000).toFixed(0);
  const reportPath = join(DATA, `report-${label}.json`);
  if (!existsSync(reportPath)) {
    console.log(`✗ no-report (${dt}s, exit ${r.status}) ${String(r.stderr || "").slice(-160)}`);
    rows.push({ taskset: basename(taskset), provider: m.provider, model: m.model, combo: combo ? combo.label : "—", arm: arms, keep: "—", error: `no-report exit ${r.status}` });
    return;
  }
  const rep = JSON.parse(readFileSync(reportPath, "utf8"));
  let okCells = 0;
  for (const c of rep.configs || []) {
    if (c.error) { rows.push({ taskset: basename(taskset), provider: m.provider, model: m.model, combo: combo ? combo.label : "—", arm: c.label, keep: c.keep ?? "—", error: c.error }); continue; }
    okCells++;
    rows.push({
      taskset: basename(taskset), provider: m.provider, model: m.model,
      combo: c.arm === "vanilla" ? "—" : (combo ? combo.label : "—"),
      arm: c.arm, keep: c.keep ?? "—",
      passPct: c.passPct, recall: c.probe?.recall != null ? c.probe.recall * 100 : null,
      order: c.probe?.orderScore != null ? c.probe.orderScore * 100 : null,
      turns: c.totTurns, tokens: c.finalTokens, digestFacts: c.taskDigestFacts, evOrd: c.evictionOrdinal, saves: c.saveToolCalls,
    });
  }
  console.log(`✓ ${okCells} config (${dt}s)`);
  writeAggregate(); // incrementale dopo OGNI cella
}

function fmt(n, d = 0) { return n == null ? "—" : Number(n).toFixed(d); }
function writeAggregate() {
  writeFileSync(outJson, JSON.stringify({ label: LABEL, generated_shift: null, taskSets: TASKSETS.map((t) => basename(t)), models: MODELS, combos: COMBOS.map((c) => c.label), keeps: KEEPS, rows }, null, 2));
  // markdown
  const header = "| taskset | provider | model | combo | arm | keep | pass% | recall% | order% | turni | token | digest | evOrd | saves |";
  const sep = "|" + "---|".repeat(14);
  const body = rows.map((r) => r.error
    ? `| ${r.taskset} | ${r.provider} | ${r.model} | ${r.combo} | ${r.arm} | ${r.keep} | ERRORE: ${r.error} |||||||`
    : `| ${r.taskset} | ${r.provider} | ${r.model} | ${r.combo} | ${r.arm} | ${r.keep} | ${fmt(r.passPct)} | ${fmt(r.recall)} | ${fmt(r.order)} | ${fmt(r.turns)} | ${fmt(r.tokens)} | ${fmt(r.digestFacts)} | ${fmt(r.evOrd)} | ${fmt(r.saves)} |`
  ).join("\n");
  writeFileSync(outMd, `# Matrice modello × feature — ${LABEL}\n\ntaskset=${TASKSETS.map((t) => basename(t)).join(",")} · keeps=${KEEPS.join(",")} · combos=${COMBOS.map((c) => c.label).join(",")}\n\n${header}\n${sep}\n${body}\n\n${analysisMd()}`);
}

// ── ANALISI: migliore composizione + config produzione (outcome = pass% alto, recall alto, a token contenuti) ──
function analysisMd() {
  const ok = rows.filter((r) => !r.error && r.passPct != null);
  if (!ok.length) return "_(nessun risultato valido ancora)_";
  const byModel = {};
  for (const r of ok) (byModel[`${r.provider}:${r.model}`] ??= []).push(r);
  let out = "## Analisi — migliore composizione per modello\n\n";
  const prod = [];
  for (const [mk, rs] of Object.entries(byModel)) {
    const van = rs.find((r) => r.arm === "vanilla");
    // score composito: priorità pass%, poi recall, penalità token (normalizzata); solo arm 'ours'
    const ours = rs.filter((r) => r.arm === "ours");
    const maxTok = Math.max(...rs.map((r) => r.tokens || 0), 1);
    const scored = ours.map((r) => ({ r, score: (r.passPct || 0) * 2 + (r.recall || 0) - 100 * (r.tokens || 0) / maxTok }))
      .sort((a, b) => b.score - a.score);
    const best = scored[0]?.r;
    out += `### ${mk}\n`;
    if (van) out += `- vanilla: pass ${fmt(van.passPct)}% · recall ${fmt(van.recall)}% · tok ${fmt(van.tokens)}\n`;
    if (best) {
      out += `- **migliore ours**: combo \`${best.combo}\` @keep${best.keep} → pass ${fmt(best.passPct)}% · recall ${fmt(best.recall)}% · order ${fmt(best.order)}% · tok ${fmt(best.tokens)} · digest ${fmt(best.digestFacts)}\n`;
      const verdict = van ? (best.passPct >= van.passPct && best.recall >= (van.recall ?? 0) ? "harness ≥ vanilla" : "harness < vanilla (overhead)") : "no-baseline";
      out += `- verdetto: **${verdict}**\n`;
      prod.push({ model: mk, combo: best.combo, keep: best.keep, passPct: best.passPct, recall: best.recall });
    }
    out += "\n";
  }
  out += "## Config di PRODUZIONE consolidata (proposta)\n\n";
  out += prod.map((p) => `- **${p.model}** → \`${p.combo}\` @keep${p.keep} (pass ${fmt(p.passPct)}% recall ${fmt(p.recall)}%)`).join("\n") || "_(in attesa di più celle)_";
  return out;
}

async function main() {
  console.log(`=== MATRICE ${LABEL} — ${MODELS.length} modelli × ${COMBOS.length} combo × keeps[${KEEPS}] su ${TASKSETS.length} task-set ===`);
  console.log(`modelli: ${MODELS.map((m) => m.provider + ":" + m.model).join(", ")}`);
  console.log(`combo:   ${COMBOS.map((c) => c.label).join(", ")}\n`);
  for (const taskset of TASKSETS) {
    if (!existsSync(taskset)) { console.log(`⚠ task-set mancante: ${taskset} — skip`); continue; }
    for (const m of MODELS) {
      console.log(`\n── ${m.provider}:${m.model} · ${basename(taskset)} ──`);
      runCell({ taskset, m, combo: null, arms: "vanilla", keeps: ["null"] });   // baseline vanilla (una volta per modello×taskset)
      for (const combo of COMBOS) runCell({ taskset, m, combo, arms: "ours", keeps: KEEPS });
    }
  }
  console.log(`\n=== MATRICE COMPLETA ===\nrows: ${rows.length}\nJSON → ${outJson}\nMD   → ${outMd}`);
}
main().catch((e) => { console.error("matrix-fatal:", e?.stack || e); writeAggregate(); process.exit(1); });

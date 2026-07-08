/**
 * consolidate-matrix — fonde TUTTI i report-master della matrice (run-matrix.mjs) in UNA tabella unica +
 * best-composition per (modello, taskset) + config di PRODUZIONE consolidata + findings (utente msg 1395/B).
 *
 * Legge eval/data/report-m*.json che hanno `.rows` (i master di run-matrix, non i per-cella con `.configs`).
 * Output: eval/data/report-MATRIX-MASTER.md + .json. Idempotente, ri-eseguibile mentre i job girano (parziali).
 *
 * Uso (cwd=harness/):  node eval/consolidate-matrix.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "data");
const fmt = (n, d = 0) => (n == null || Number.isNaN(Number(n)) ? "—" : Number(n).toFixed(d));

// raccogli i master (hanno .rows); ignora i per-cella (.configs) e i report legacy
const rows = [];
for (const f of readdirSync(DATA)) {
  if (!/^report-m.*\.json$/.test(f)) continue;
  let j; try { j = JSON.parse(readFileSync(join(DATA, f), "utf8")); } catch { continue; }
  if (!Array.isArray(j.rows)) continue;
  for (const r of j.rows) rows.push({ ...r, _src: f.replace(/^report-|\.json$/g, "") });
}
if (!rows.length) { console.log("nessun master-report con .rows trovato."); process.exit(0); }

// ── tabella unica ──
const header = "| taskset | modello | combo | arm | keep | pass% | recall% | order% | turni | token | digest | note |";
const sep = "|" + "---|".repeat(12);
const line = (r) => r.error
  ? `| ${r.taskset} | ${r.provider}:${r.model} | ${r.combo} | ${r.arm} | ${r.keep} | — | — | — | — | — | — | ⚠ ${r.error} |`
  : `| ${r.taskset} | ${r.provider}:${r.model} | ${r.combo} | ${r.arm} | ${r.keep} | ${fmt(r.passPct)} | ${fmt(r.recall)} | ${fmt(r.order)} | ${fmt(r.turns)} | ${fmt(r.tokens)} | ${fmt(r.digestFacts)} |  |`;
// ordina: taskset, modello, arm(vanilla prima), combo, keep
const ord = [...rows].sort((a, b) =>
  (a.taskset || "").localeCompare(b.taskset || "") ||
  `${a.provider}:${a.model}`.localeCompare(`${b.provider}:${b.model}`) ||
  (a.arm === "vanilla" ? -1 : 1) - (b.arm === "vanilla" ? -1 : 1) ||
  String(a.combo).localeCompare(String(b.combo)) || (Number(a.keep) || 0) - (Number(b.keep) || 0));

// ── analisi per (taskset, modello): vanilla baseline vs best-ours; verdetto harness≷vanilla ──
const groups = {};
for (const r of rows) if (!r.error && r.passPct != null) (groups[`${r.taskset}||${r.provider}:${r.model}`] ??= []).push(r);
let analysis = "## Analisi per (taskset × modello)\n\n";
const prod = [];
for (const [k, rs] of Object.entries(groups)) {
  const [taskset, model] = k.split("||");
  const van = rs.find((r) => r.arm === "vanilla");
  const oursAll = rs.filter((r) => r.arm === "ours");
  // escludi le celle ours INFRA-INVALIDE (pass 0 E recall 0 = apiError sistematico, tipico num_ctx-troncato sui locali):
  // non sono un verdetto sull'harness, non devono inquinare la best-composition né la config-produzione.
  const ours = oursAll.filter((r) => !((r.passPct === 0) && (r.recall === 0 || r.recall == null)));
  if (!ours.length) {
    analysis += `### ${taskset} · ${model}\n`;
    if (van) analysis += `- vanilla: pass ${fmt(van.passPct)}% · recall ${fmt(van.recall)}% · tok ${fmt(van.tokens)}\n`;
    analysis += `- **braccio ours NON valido** su questo modello (${oursAll.length} celle tutte a 0% = infra: num_ctx/VRAM, non un verdetto sull'harness) → escluso dalla config-produzione.\n\n`;
    continue;
  }
  const maxTok = Math.max(...rs.map((r) => r.tokens || 0), 1);
  // score: pass% (peso 2) + recall% - penalità-token normalizzata (100)
  const scored = ours.map((r) => ({ r, s: (r.passPct || 0) * 2 + (r.recall || 0) - 100 * (r.tokens || 0) / maxTok })).sort((a, b) => b.s - a.s);
  const best = scored[0].r;
  const winRecall = van && best.recall != null && van.recall != null ? best.recall - van.recall : null;
  const tokRatio = van && van.tokens ? (best.tokens || 0) / van.tokens : null;
  analysis += `### ${taskset} · ${model}\n`;
  if (van) analysis += `- vanilla: pass ${fmt(van.passPct)}% · recall ${fmt(van.recall)}% · tok ${fmt(van.tokens)}\n`;
  analysis += `- best-ours: \`${best.combo}\`@keep${best.keep} → pass ${fmt(best.passPct)}% · recall ${fmt(best.recall)}% · tok ${fmt(best.tokens)}${tokRatio ? ` (${fmt(tokRatio, 1)}× vanilla)` : ""}\n`;
  if (van) analysis += `- **verdetto**: ${best.passPct >= van.passPct && (best.recall ?? 0) >= (van.recall ?? 0) ? (tokRatio > 1.5 ? "harness ≥ vanilla ma COSTA (overhead token)" : "harness ≥ vanilla") : "harness < vanilla"}${winRecall != null ? ` · Δrecall ${winRecall >= 0 ? "+" : ""}${fmt(winRecall)}pt` : ""}\n`;
  analysis += "\n";
  prod.push({ taskset, model, combo: best.combo, keep: best.keep, passPct: best.passPct, recall: best.recall, tokRatio });
}

// ── config produzione: raggruppa per modello la combo vincente dominante ──
let prodMd = "## Config di PRODUZIONE consolidata\n\n";
const byModel = {};
for (const p of prod) (byModel[p.model] ??= []).push(p);
for (const [model, ps] of Object.entries(byModel)) {
  const combos = {}; ps.forEach((p) => { combos[`${p.combo}@keep${p.keep}`] = (combos[`${p.combo}@keep${p.keep}`] || 0) + 1; });
  const top = Object.entries(combos).sort((a, b) => b[1] - a[1])[0];
  prodMd += `- **${model}** → \`${top[0]}\` (miglior composto in ${top[1]}/${ps.length} taskset)\n`;
}

const nErr = rows.filter((r) => r.error).length;
const findings = `## Findings\n\n- Celle totali: ${rows.length} (${nErr} errore/bloccate).\n- Nota locali (Ollama): il braccio *ours* richiede un system-prompt grande (context+tool); con num_ctx di default Ollama (~4096) viene troncato → nessuna soluzione (vanilla, prompt piccolo, funziona). Serve variante num_ctx grande (vincolo VRAM sul banco 11GB). Il target reale ≥27B non ha questo limite → Gemini (context grande) è il proxy valido.\n`;

const md = `# MATRICE MASTER — modello × feature (consolidato)\n\n_Fonti: ${[...new Set(rows.map((r) => r._src))].join(", ")}_\n\n${header}\n${sep}\n${ord.map(line).join("\n")}\n\n${analysis}${prodMd}\n${findings}`;
writeFileSync(join(DATA, "report-MATRIX-MASTER.md"), md);
writeFileSync(join(DATA, "report-MATRIX-MASTER.json"), JSON.stringify({ rows, prod }, null, 2));
console.log(`MASTER consolidato: ${rows.length} righe da ${new Set(rows.map((r) => r._src)).size} job → report-MATRIX-MASTER.md`);

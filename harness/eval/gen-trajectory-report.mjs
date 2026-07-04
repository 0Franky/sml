/**
 * gen-trajectory-report — ricostruisce un report LEGGIBILE turn-by-turn (ragionamento→azione→osservazione)
 * da un file trace prodotto da run-one.mjs (EVAL_TRACE_DIR). Uso: node eval/gen-trajectory-report.mjs <trace.json> <out.md>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [traceFile, outFile] = process.argv.slice(2);
if (!traceFile || !outFile) { console.error("uso: gen-trajectory-report.mjs <trace.json> <out.md>"); process.exit(2); }
const t = JSON.parse(readFileSync(traceFile, "utf8"));

const jp = (s) => { try { return JSON.parse(s); } catch { return null; } };
const clip = (s, n) => { s = String(s ?? ""); return s.length > n ? s.slice(0, n) + ` …[+${s.length - n} char]` : s; };
function msgText(m) { const o = jp(m); if (!o) return null; const parts = (o.content || []).filter((c) => c.type === "text").map((c) => c.text); return { role: o.role, text: parts.join("\n").trim() }; }
function argSummary(name, argsStr) {
  const a = jp(argsStr) || {};
  if (name === "bash") return "`" + clip(a.command ?? a.cmd ?? JSON.stringify(a), 300) + "`";
  if (name === "write" || name === "edit") { const c = a.content ?? a.newText ?? ""; return `→ ${a.path || "solution.py"} (${String(c).length} char):\n\`\`\`python\n${clip(c, 1600)}\n\`\`\``; }
  if (name === "read") return "`" + (a.path || JSON.stringify(a)) + "`";
  return clip(JSON.stringify(a), 200);
}
function resultText(r) { const o = jp(r); const txt = o?.content ? o.content.filter((c) => c.type === "text").map((c) => c.text).join("\n") : String(r ?? ""); return clip(txt, 400); }

const ev = t.events || [];
let turn = 0;
const lines = [];
lines.push(`# Report traiettoria — ${t.task_id} · braccio \`${t.arm}${t.keep ? `@keep${t.keep}` : ""}\` · ESITO: FAIL`);
lines.push("");
lines.push(`> Ricostruzione turn-by-turn dal trace reale (${ev.length} eventi). Turni: **${t.turns}** · token: **${t.tokens}** · nExt: ${t.nExt} · <context>: ${t.hasContext}.`);
lines.push(`> ⚠️ I testi lunghi sono troncati (il trace tronca a 2000 char/campo).`);
lines.push("");
lines.push("---");
lines.push("");

for (const e of ev) {
  if (e.type === "turn_start") { turn++; lines.push(`\n## ── Turno ${turn} ──`); }
  else if (e.type === "message_end") {
    const m = msgText(e.message);
    if (m && m.role === "assistant" && m.text) lines.push(`\n**🤖 MODELLO (ragiona):**\n\n${clip(m.text, 1400)}`);
  } else if (e.type === "tool_execution_start") {
    lines.push(`\n**🔧 AZIONE — \`${e.toolName}\`:** ${argSummary(e.toolName, e.args)}`);
  } else if (e.type === "tool_execution_end") {
    const err = String(e.isError) === "true";
    lines.push(`\n**📤 OSSERVAZIONE${err ? " (errore)" : ""}:**\n\`\`\`\n${resultText(e.result)}\n\`\`\``);
  }
}
lines.push("");
lines.push("---");
lines.push("");
lines.push("## Soluzione finale (SBAGLIATA)");
lines.push("```python\n" + String(t.solutionCode || "").trim() + "\n```");

writeFileSync(outFile, lines.join("\n"));
console.log(`report → ${outFile} (${lines.length} righe)`);

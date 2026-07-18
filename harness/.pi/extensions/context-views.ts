/**
 * context-views — tool PULL model-controlled per rivedere la CODA delle PROPRIE tool-call fuori dalla finestra
 * (`view_tool_calls`, #3 utente msg 1258; generalizzazione a più lane = msg 1269, futuro). È la META **S** del
 * training-vs-harness (#11): l'harness ESPONE il pull, il modello impara la DECISIONE (quando/quanto pullare) —
 * curriculum scaffold-fade push→pull (msg 1267): si sfuma il push di <last_tool_calls> e si forza il pull qui.
 *
 * GATE default-OFF (`HARNESS_CONTEXT_VIEWS=on`), come task-digest/eviction: la sola presenza NON cambia il live
 * (nessun tool registrato) finché non abiliti → esperimenti/ripetizioni restano PULITI (il modello non vede un tool
 * nuovo). Diventerà default-ON dopo la validazione + il curriculum.
 *
 * Logica PURA+testata in `src/tool-call-log.mjs` (`viewRange`/`ringStats`, 38/0): qui è un wire sottile. READ-ONLY.
 * Redazione: NON qui — gli output-tool passano dal secrets-guardrail (tool_result hook) come ogni altro risultato
 * (SSOT della redazione, come la lane che redige una volta a valle). Fail-safe: ogni errore → risultato ok:false.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { getToolCallStore } from "../../src/state-db.mjs";
import { getConvId } from "../../src/session-context.mjs";
import { parseSessionStartMs } from "../../src/time-shift.mjs"; // fix AS8: la vista pull deve avere gli stessi [+Xs] della lane inline

/** Coercizione difensiva Integer|String→number (i modelli piccoli passano "5" come stringa — lezione F5 set_keepturns). */
function num(v: any): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function (pi: ExtensionAPI) {
  if (String(process.env.HARNESS_CONTEXT_VIEWS ?? "off").toLowerCase() !== "on") return; // DEFAULT off → no-op totale
  pi.registerTool({
    name: "view_tool_calls",
    label: "View your earlier tool calls (pull from the log)",
    description:
      "Pull a range of YOUR OWN earlier tool calls that may have scrolled out of the <last_tool_calls> window. " +
      "Each call has a stable #N id and a status/result. Use `count` for the last N, or `from`/`to` for a #id range. " +
      "Memory-ops (note/jot/set_var) are excluded by default; set include_memory_ops=true to include them. " +
      "Use it to recall what you already did instead of repeating an action or inventing a result.",
    promptSnippet:
      "view_tool_calls(count? | from?, to?, include_memory_ops?) — pull your earlier tool calls by #id range or last-N.",
    promptGuidelines: [
      "When you need an action or result from earlier that is no longer visible in <last_tool_calls>, call " +
        "view_tool_calls instead of re-running the action or guessing the result. Ask for the last N (count) or a #id range (from/to).",
    ],
    parameters: Type.Object({
      count: Type.Optional(Type.Union([Type.Integer(), Type.String()], { description: "How many of the most recent calls to show (default 8)." })),
      from: Type.Optional(Type.Union([Type.Integer(), Type.String()], { description: "Start #id of the range (inclusive)." })),
      to: Type.Optional(Type.Union([Type.Integer(), Type.String()], { description: "End #id of the range (inclusive)." })),
      include_memory_ops: Type.Optional(Type.Boolean({ description: "Include note/jot/set_var (default false)." })),
    }),
    async execute(_t: string, p: any) {
      try {
        const store = getToolCallStore(); // vista store-backed: recupera anche i #seq usciti dal ring-24 (fix F28)
        const convId = getConvId();
        const text = store.view(convId, {
          from: num(p?.from),
          to: num(p?.to),
          count: num(p?.count),
          includeMemoryOps: p?.include_memory_ops === true || String(p?.include_memory_ops).toLowerCase() === "true",
          sessionStartMs: parseSessionStartMs(convId), // AS8: prefisso [+Xs] come la lane inline (l'header lo PROMETTE), stesso convId della query
        }); // redazione: NON qui — passa dal secrets-guardrail (tool_result hook), SSOT della redazione
        const st = store.stats(convId);
        return { content: [{ type: "text", text }], details: { ok: true, total: st.total, available: st.total ? `#${st.minSeq}..#${st.maxSeq}` : "" } };
      } catch (e: any) {
        return { content: [{ type: "text", text: `view_tool_calls failed: ${e?.message || e}` }], details: { ok: false, total: 0, available: "" } };
      }
    },
  });
}

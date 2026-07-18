/**
 * file-view — tool `open_file_view` / `close_file_view` / `list_file_views`: il modello tiene una porzione di FILE
 * INLINE nel contesto finché decide di chiuderla (context-eviction ESPLICITA guidata dall'LLM).
 *
 * Design ORIGINALE dell'utente (msg 376) specificato in wiki/concepts/wrapper-context-assembly-example.md:154,
 * rimasto backlog "Classe A" e mai costruito → costruito 2026-07-16 (utente msg 1708).
 *
 * ⚠️ NON è `sliding_var_read` (che opera su una VAR e ritorna un tool_result → SCORRE VIA col prune). Qui la porzione
 * vive in una LANE ri-emessa a ogni turno → SOPRAVVIVE al prune finché non si chiude. Differenza: "read ridotta" vs
 * "tenere sott'occhio".
 *
 * Logica PURA+testata in `src/file-view.mjs`; qui c'è solo il wire + l'I/O (lettura file). Fail-safe: ogni errore → ok:false.
 * Split #11: il meccanismo è F-harness (qui); *quando* aprire/chiudere/preservare è S da addestrare
 * (class-memory-lane-tool-discipline, asse permanenza ↔ durata-del-bisogno).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getVarsQueue, closeAll } from "../../src/state-db.mjs";
import { openFileView, closeFileView, DEFAULT_VIEW_LINES, MAX_VIEW_LINES } from "../../src/file-view.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";

const txt = (o: unknown) => ({ content: [{ type: "text" as const, text: typeof o === "string" ? o : JSON.stringify(o, null, 2) }] });

// SSOT harness-config: intero ≥1 garantito da loadHarnessConfig → si legge e basta, nessun `?? 3` (#16).
// Letto a module-load come le altre extension (context-assembly.ts) → la description del tool porta il valore EFFETTIVO,
// non il default hard-coded: se il cap è a 5 il modello legge "Max 5", altrimenti gli mentiremmo nel prompt.
const MAX_OPEN_VIEWS = loadHarnessConfig().maxOpenFileViews;

export default function (pi: ExtensionAPI) {
  const vq = getVarsQueue();
  pi.on("session_shutdown", () => closeAll());

  pi.registerTool({
    name: "open_file_view",
    label: "Keep a slice of a file in context",
    description:
      `Open a window on a file and KEEP IT IN YOUR CONTEXT every turn until you close it — it survives history pruning. ` +
      `Use this ONLY for a portion you must keep watching across several turns; for a one-off look, use a normal file read instead ` +
      `(a normal read scrolls out of the window, which is fine when you only need it once). ` +
      `Re-opening the same path MOVES the window (updates it, no duplicate). Max ${MAX_OPEN_VIEWS} views open at once: ` +
      `when full you must close_file_view(path) one first — decide which one you no longer need.`,
    parameters: Type.Object({
      path: Type.String({ description: "File path to open a view on." }),
      start_line: Type.Optional(Type.Number({ description: "First line (1-based). Default 1." })),
      lines: Type.Optional(Type.Number({ description: `How many lines to keep in view. Default ${DEFAULT_VIEW_LINES}, max ${MAX_VIEW_LINES}.` })),
    }),
    async execute(_id: string, p: any) {
      try {
        const abs = resolve(String(p.path));
        let raw: string;
        try {
          raw = readFileSync(abs, "utf8");
        } catch (e: any) {
          return { ...txt({ ok: false, error: `cannot read ${p.path}: ${e?.code ?? e?.message ?? "error"}` }), details: { ok: false } };
        }
        const r = openFileView(vq, {
          path: String(p.path),                 // path COME DATO dal modello (leggibile), non l'assoluto (device-specific)
          fileLines: raw.split(/\r?\n/),
          startLine: p.start_line,
          lines: p.lines,
          maxOpen: MAX_OPEN_VIEWS,              // dalla config: il RIFIUTO e la description devono usare lo stesso numero
        });
        return { ...txt(r), details: { ok: (r as any).ok === true } };
      } catch {
        return { ...txt({ ok: false, error: "open_file_view failed" }), details: { ok: false } };
      }
    },
  });

  pi.registerTool({
    name: "close_file_view",
    label: "Remove a file view from context",
    description:
      "Close an open file view: it is removed from your context COMPLETELY, freeing the space. Do this as soon as you no longer need to watch that portion.",
    parameters: Type.Object({ path: Type.String({ description: "Path of the view to close (as shown in <open_file_view>)." }) }),
    async execute(_id: string, p: any) {
      try {
        const r = closeFileView(vq, String(p.path));
        return { ...txt(r), details: { ok: r.ok } };
      } catch {
        return { ...txt({ ok: false, error: "close_file_view failed" }), details: { ok: false } };
      }
    },
  });

  // NB: NESSUN `list_file_views`. La lane <open_file_view> È già la lista (inline, ogni turno), e il rifiuto della
  // (MAX+1)-esima apertura elenca ciò che è aperto → un tool "list" duplicherebbe uno stato GIÀ nel contesto pagando
  // uno schema (E14/F37/F39: gli schemi-tool dominano il costo del prompt; la leva n.1 è RIDURRE i tool, non aggiungerli).
  // Se non c'è la lane, non ci sono view: quella è la risposta. (SSOT #16 applicata alla superficie-tool.)
}

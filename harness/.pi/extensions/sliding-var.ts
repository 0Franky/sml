/**
 * sliding-var — Fase 1 (anticipata): tool di read/replace di una VAR per CHAR-RANGE + preview.
 *
 * Implementa ../../wiki/concepts/sliding-window-variable-tool.md (idea utente 2026-05-21):
 * edit chirurgici su var grandi senza scaricarle full nel context. preview-then-apply.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { getVarsQueue, closeAll } from "../../src/state-db.mjs";
import { slidingRead, slidingReplace } from "../../src/sliding-var.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = ".pi/state/vars.db";
function store(): VarsQueue {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  return getVarsQueue(DB_PATH, { agent: "orchestrator" }); // connessione condivisa (no leak)
}

export default function (pi: ExtensionAPI) {
  const vq = store();
  pi.on("session_shutdown", () => closeAll()); // rilascia le connessioni DB condivise (fix leak)

  pi.registerTool({
    name: "sliding_var_read",
    label: "Read a var slice (char-range)",
    description: "Read a slice [start,end) of a var by char-range + ±context_around chars (orientation), without loading it in full.",
    parameters: Type.Object({
      var_id: Type.String(),
      start: Type.Number(),
      end: Type.Number(),
      context_around: Type.Optional(Type.Number()),
    }),
    async execute(_toolCallId: string, params: any) {
      const r = slidingRead(vq, params.var_id, params.start, params.end, params.context_around ?? 0);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], details: { ok: !("error" in r) } };
    },
  });

  pi.registerTool({
    name: "sliding_var_replace",
    label: "Replace a var slice (preview-then-apply)",
    description:
      "Replace the slice [start,end) with new_content. preview_only=true (default) does NOT apply: it returns the preview to validate first. Append: start=end=var length.",
    parameters: Type.Object({
      var_id: Type.String(),
      start: Type.Number(),
      end: Type.Number(),
      new_content: Type.String(),
      context_around: Type.Optional(Type.Number()),
      preview_only: Type.Optional(Type.Boolean()),
    }),
    async execute(_toolCallId: string, params: any) {
      const r: any = slidingReplace(vq, params.var_id, params.start, params.end, params.new_content, {
        contextAround: params.context_around ?? 0,
        previewOnly: params.preview_only !== false,
      });
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], details: { applied: r.applied ?? false } };
    },
  });
}

/**
 * secrets-guardrail — Fase 0.4 (walking skeleton)
 *
 * Redige output che matchano la secrets-map, via hook `tool_result`.
 * È la difesa deterministica lato harness (F-harness) complementare alla skill
 * anti-exfiltration addestrata nei pesi (S).
 *
 * API reale: on("tool_result", (e: ToolResultEvent) => ToolResultEventResult).
 *   e.content : (TextContent | ImageContent)[]   ← array di blocchi, NON stringa.
 *   result    : { content?, details?, isError? }.
 * Fase 1 (anticipata): secrets-map DINAMICA in aggiunta ai pattern statici. Il tool
 * `add_secret` registra un valore segreto **in-memory** (per-processo, MAI su disco) che il
 * guardrail redige da ogni output di tool — i "riferimenti opachi per-sessione" di
 * ../../wiki/concepts/secret-section-exfiltration-defense.md.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
// Logica di redazione condivisa e testabile (src/secrets-redact.mjs, smoke-test dedicato).
// Pattern statici (incl. Google AIza / GEMINI_API_KEY) + dynamic-secrets per literal match.
import { redactText } from "../../src/secrets-redact.mjs";
// secrets-map DINAMICA: registry CONDIVISO (singleton di processo) → la stessa secrets-map è vista anche
// da var-ops `render_template` (fix P0 2026-06-29: prima era module-private qui e render_template la bypassava).
import { addSecret, getDynamicSecrets, clearSecrets } from "../../src/secrets-registry.mjs";

export default function (pi: ExtensionAPI) {
  // Isolamento di sessione: svuota la secrets-map dinamica a fine sessione → i segreti registrati nella sessione A
  // NON restano residenti/attivi nella sessione B (reload/resume/new/fork sono in-process). (review-loop #2 P2.)
  pi.on("session_shutdown", () => clearSecrets());

  pi.registerTool({
    name: "add_secret",
    label: "Register a session secret to redact",
    description:
      "Registra un valore segreto (in-memory, MAI su disco) che il guardrail redige da OGNI output di tool E dall'interpolazione (render_template). Riferimento opaco per-sessione (anti-exfiltration deterministica).",
    parameters: Type.Object({ value: Type.String({ description: "Il valore segreto da redarre." }) }),
    async execute(_toolCallId: string, params: any) {
      const size = addSecret(params.value);
      return {
        content: [{ type: "text", text: `secret registrato (${size} attivi nella secrets-map dinamica)` }],
        details: { ok: true },
      };
    },
  });

  pi.on("tool_result", (event, ctx) => {
    let anyHit = false;
    const content = event.content.map((block) => {
      if (block.type === "text") {
        const { redacted, hit } = redactText(block.text, getDynamicSecrets());
        if (hit) {
          anyHit = true;
          return { ...block, text: redacted };
        }
      }
      return block;
    });
    if (!anyHit) return; // nessun match → lascia passare l'output originale
    ctx.ui.notify("secrets-guardrail: output redatto (match secrets-map)", "warning");
    return { content };
  });
}

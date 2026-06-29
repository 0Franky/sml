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
    parameters: Type.Object({ value: Type.String({ description: "Il valore segreto da redarre (opaco, alta entropia)." }) }),
    async execute(_toolCallId: string, params: any) {
      // Guardia min-length/diversità/cap: un valore corto o poco-vario corromperebbe ogni output (footgun/DoS). (P2)
      const r = addSecret(params.value);
      if (!r.ok) {
        return {
          content: [{ type: "text", text: `add_secret RIFIUTATO: ${r.reason}. Registra un valore opaco ad alta entropia (token/chiave reale).` }],
          details: { ok: false },
        };
      }
      return {
        content: [{ type: "text", text: `secret registrato (${r.size} attivi nella secrets-map dinamica)` }],
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

  // CANALE EGRESS DEGLI ARGOMENTI tool_call (review-loop #3 2026-06-29, P2 tool-call-egress): un modello indotto
  // (prompt-injection) potrebbe piazzare un SEGRETO REGISTRATO negli argomenti di un tool che esce dal processo
  // (es. una URL di curl) per esfiltrarlo — la redazione su tool_result NON copre questo verso (modello→tool).
  // Qui si redigono i SOLI dynamic-secrets (registrati = riferimenti opachi, NON da passare raw) dagli argomenti,
  // mutando event.input in place. NB staticPatterns:false: NON si redigono le shape statiche per non mutilare
  // codice/comandi legittimi che le contengano (un fixture con AIza… finto, un example key in un write_file).
  pi.on("tool_call", (event) => {
    const input = (event as any).input;
    if (input && typeof input === "object") redactArgsInPlace(input, getDynamicSecrets());
    // nessun return → non blocca; la mutazione in-place degli argomenti è il path documentato (ToolCallEventResult).
  });
}

/** Redige in-place (ricorsivo) i SOLI dynamic-secrets dai valori-stringa di un oggetto/array di argomenti. */
function redactArgsInPlace(node: any, dynamicSecrets: Iterable<string>): void {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const v = node[i];
      if (typeof v === "string") {
        const { redacted, hit } = redactText(v, dynamicSecrets, { staticPatterns: false });
        if (hit) node[i] = redacted;
      } else if (v && typeof v === "object") redactArgsInPlace(v, dynamicSecrets);
    }
  } else if (node && typeof node === "object") {
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === "string") {
        const { redacted, hit } = redactText(v, dynamicSecrets, { staticPatterns: false });
        if (hit) node[k] = redacted;
      } else if (v && typeof v === "object") redactArgsInPlace(v, dynamicSecrets);
    }
  }
}

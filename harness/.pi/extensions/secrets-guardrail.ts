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
 * Fase 1: secrets-map DINAMICA (riferimenti opachi per-sessione) invece dei pattern statici.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9]{20,}/g, // generic API key
  /ghp_[A-Za-z0-9]{36}/g, // GitHub PAT
  /AKIA[0-9A-Z]{16}/g, // AWS access key id
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g,
];

function redactText(text: string): { redacted: string; hit: boolean } {
  let hit = false;
  let out = text;
  for (const re of SECRET_PATTERNS) {
    if (re.test(out)) {
      hit = true;
      out = out.replace(re, "[REDACTED-SECRET]");
    }
  }
  return { redacted: out, hit };
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_result", (event, ctx) => {
    let anyHit = false;
    const content = event.content.map((block) => {
      if (block.type === "text") {
        const { redacted, hit } = redactText(block.text);
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

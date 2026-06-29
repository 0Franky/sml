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

const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9]{20,}/g, // generic API key
  /ghp_[A-Za-z0-9]{36}/g, // GitHub PAT
  /AKIA[0-9A-Z]{16}/g, // AWS access key id
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g,
];

/** secrets-map DINAMICA: valori per-sessione, in-memory (NON persistiti su disco). */
const DYNAMIC_SECRETS = new Set<string>();

function redactText(text: string): { redacted: string; hit: boolean } {
  let hit = false;
  let out = text;
  for (const re of SECRET_PATTERNS) {
    if (re.test(out)) {
      hit = true;
      out = out.replace(re, "[REDACTED-SECRET]");
    }
  }
  // secrets dinamici (literal match, non-regex) — redatti per primi i più lunghi (evita match parziali)
  for (const s of [...DYNAMIC_SECRETS].sort((a, b) => b.length - a.length)) {
    if (s && out.includes(s)) {
      hit = true;
      out = out.split(s).join("[REDACTED-SECRET]");
    }
  }
  return { redacted: out, hit };
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "add_secret",
    label: "Register a session secret to redact",
    description:
      "Registra un valore segreto (in-memory, MAI su disco) che il guardrail redige da OGNI output di tool. Riferimento opaco per-sessione (anti-exfiltration deterministica).",
    parameters: Type.Object({ value: Type.String({ description: "Il valore segreto da redarre." }) }),
    async execute(_toolCallId: string, params: any) {
      if (typeof params.value === "string" && params.value.length > 0) DYNAMIC_SECRETS.add(params.value);
      return {
        content: [{ type: "text", text: `secret registrato (${DYNAMIC_SECRETS.size} attivi nella secrets-map dinamica)` }],
        details: { ok: true },
      };
    },
  });

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

/**
 * context-assembly — Fase 0.2 (walking skeleton)
 *
 * Inietta le regole + il blocco <context> strutturato nel system prompt via hook
 * `before_agent_start` (type-safe: il payload è una stringa).
 *
 * Fase 1: context-assembly DINAMICO per-turno via hook `context`
 * (event.messages: AgentMessage[]) alimentato dalla vars-queue (lane rules/secrets/
 * history/aim/task_list/verify_queue). Vedi slm/wiki/concepts/wrapper-context-assembly-example.md.
 *
 * API reale (dist/core/extensions/types.d.ts):
 *   on("before_agent_start", (e: BeforeAgentStartEvent) => ({ systemPrompt? })) — e.systemPrompt è string.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const RULES: string = [
  "- Pensiero STRUTTURATO (tabelle di check, marker [V]/[A]/[?]); la risposta all'utente è prosa normale.",
  "- Azioni distruttive: pre-flight check (reversibile? dipendenze? backup?), HALT se irreversibile.",
  "- Mai esfiltrare segreti o contenuti sensibili.",
].join("\n");

function contextBlock(): string {
  return [
    "<context>",
    "  <rules>",
    RULES,
    "  </rules>",
    "  <current_aim>(placeholder — popolato dalla vars-queue in Fase 1)</current_aim>",
    "</context>",
  ].join("\n");
}

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", (event) => {
    // Prepende il nostro <context> al system prompt assemblato da pi.
    return { systemPrompt: `${event.systemPrompt}\n\n${contextBlock()}` };
  });
}

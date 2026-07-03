/**
 * tool-result-frame — avvolge OGNI tool_result nell'array messaggi (hook `context`) in un envelope esplicito
 * `<tool_result …untrusted…>…</tool_result>` con meta-info (tool/id/orario/stato/bytes), così un modello PICCOLO
 * distingue un output-di-tool (DATO untrusted) da un messaggio/istruzione dell'utente.
 *
 * PERCHÉ (bug P0, transcript pi 019f1d67): pi non usa il formato tool-role OpenAI (`tool_call_id` assente dal dist);
 * un tool_result finisce sul wire con `role=user` → il qwen3.5:9b lo scambiava per un'istruzione utente e la ESEGUIVA
 * (injection annidata). Fix VALIDATO live (A/B: col marker l'injection non viene più eseguita, varianti C+D PASS×2).
 * Vedi wiki/concepts/toolresult-vs-usermsg-boundary.md.
 *
 * Hook `context`: `emitContext` CHAINA i messaggi (currentMessages threaded) e passa un `structuredClone` → possiamo
 * riscrivere senza mutare lo stato persistito. COMPLEMENTARE a native-window (windowing) — l'ordine è indifferente:
 * qui si avvolge SOLO ciò che è nell'array (col fix keepTurns=1 = i tool_result del turno corrente). Idempotente.
 *
 * La logica è node-pura/testabile in `src/tool-result-envelope.mjs` (test/unit/tool-result-envelope.test.mjs).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { frameToolResultsInMessages } from "../../src/tool-result-envelope.mjs";

export default function (pi: ExtensionAPI) {
  pi.on("context", (event) => {
    const msgs = (event as any).messages as any[];
    const framed = frameToolResultsInMessages(msgs, { now: new Date().toISOString() });
    if (framed !== msgs) return { messages: framed };
  });
}

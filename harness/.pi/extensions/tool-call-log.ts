/**
 * tool-call-log — CATTURA le tool-call del modello nel ring buffer condiviso (src/tool-call-log.mjs) per la lane
 * <last_tool_calls> (fix amnesia #1, utente msg 811-817). Con keepTurns:1 il modello non vede le proprie azioni oltre
 * il turno: qui le registriamo (start = nome+args, end = esito) e context-assembly le ri-inietta → il modello "ricorda"
 * cosa ha già fatto (niente placeholder ripetuti, niente nomi-tool allucinati appena usati, meno flailing).
 *
 * Hook `tool_execution_start`/`tool_execution_end` (portano toolCallId+toolName+args/result → correlazione robusta).
 * READ-ONLY sul flusso (non altera call/result). Fail-safe: qualsiasi errore è ingoiato (la diagnostica non rompe).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { recordCall, recordResult, clearToolCallLog } from "../../src/tool-call-log.mjs";

/** Estrae un testo dal result di un tool (shape AgentToolResult { content:[{text}], details } | stringa). */
function resultText(result: any): string {
  if (result == null) return "";
  if (typeof result === "string") return result;
  if (Array.isArray(result.content)) return result.content.map((b: any) => (b && typeof b.text === "string" ? b.text : "")).join(" ");
  if (typeof result.text === "string") return result.text;
  return "";
}

export default function (pi: ExtensionAPI) {
  const api = pi as any;
  api.on?.("tool_execution_start", (event: any) => {
    try { recordCall({ callId: event?.toolCallId, name: event?.toolName, args: event?.args }); } catch { /* mai rompere l'esecuzione */ }
  });
  api.on?.("tool_execution_end", (event: any) => {
    try { recordResult({ callId: event?.toolCallId, isError: !!event?.isError, text: resultText(event?.result) }); } catch { /* idem */ }
  });
  pi.on("session_shutdown", () => clearToolCallLog()); // isolamento di sessione (come sealed-secrets / regex-ingress)
}

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
import { recordCall, recordResult, clearToolCallLog, summarizeArgs } from "../../src/tool-call-log.mjs";
import { getToolCallStore } from "../../src/state-db.mjs";
import { getConvId } from "../../src/session-context.mjs";

/** Estrae un testo dal result di un tool (shape AgentToolResult { content:[{text}], details } | stringa). */
function resultText(result: any): string {
  if (result == null) return "";
  if (typeof result === "string") return result;
  if (Array.isArray(result.content)) return result.content.map((b: any) => (b && typeof b.text === "string" ? b.text : "")).join(" ");
  if (typeof result.text === "string") return result.text;
  return "";
}
/** Compattazione single-line bounded per il testo persistito (il ring clippa a 100; qui teniamo un filo più per il recovery). */
function clip(s: string, n: number): string {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

export default function (pi: ExtensionAPI) {
  const api = pi as any;
  api.on?.("tool_execution_start", (event: any) => {
    try {
      const name = event?.toolName;
      if (!name) return;
      const callId = event?.toolCallId ?? null;
      const args = summarizeArgs(event?.args); // SSOT: stessa sintesi del ring (una sola derivazione, passata a entrambi)
      const ts = Date.now();
      // Lo STORE assegna il #seq globale (rowid): lo rispecchiamo nel ring → il #N citato dal modello risolve in entrambi.
      // Fail-soft sullo store: se la persistenza fallisce (DB busy), il ring resta comunque popolato (nessuna amnesia live).
      let seq: number | undefined;
      try { seq = getToolCallStore().append(getConvId(), { callId, name, args, ts }); } catch { /* store best-effort */ }
      recordCall({ callId, name, args: event?.args, ts, seq });
    } catch { /* mai rompere l'esecuzione */ }
  });
  api.on?.("tool_execution_end", (event: any) => {
    try {
      const callId = event?.toolCallId ?? null;
      const isError = !!event?.isError;
      const text = resultText(event?.result);
      try { getToolCallStore().setResult(getConvId(), { callId, isError, result: clip(text, 200) }); } catch { /* store best-effort */ }
      recordResult({ callId, isError, text });
    } catch { /* idem */ }
  });
  pi.on("session_shutdown", () => clearToolCallLog()); // svuota il RING (isolamento sessione); lo STORE persiste (closeAll lo chiude)
}

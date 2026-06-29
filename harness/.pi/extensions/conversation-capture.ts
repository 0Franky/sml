/**
 * conversation-capture — persiste la CONVERSAZIONE nello store-per-ID (Strada 2, principio 3 dell'ADR
 * 2026-06-29-context-as-first-person-mind). Cattura i messaggi utente (hook `input`) e le risposte
 * dell'assistant (hook `turn_end`) in `.pi/state/conversations.db`, così la chat:
 *   - sopravvive al compact (file SQLite),
 *   - è recuperabile per ID + range dai subagent (tool `get_conversation`) → riuso per l'inter-agent
 *     messaging (body-pointer {conv_id,range}, vedi inter-agent-messaging.md §Riuso-vs-canale-dedicato).
 *
 * NB (MVP): convId fisso = "main" (single-conversation). Multi-sessione/segmentazione = estensione futura.
 * NB: la lane `<messages_with_user>` nel systemPrompt (full Strada-2) richiede di SOPPRIMERE l'array messaggi
 *     nativo di pi (hook `context`) per non duplicare la chat → step successivo; qui solo cattura + recupero.
 * Logica in ../../src/conversation-store.mjs (testata: conversation-store.test.mjs).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { ConversationStore } from "../../src/conversation-store.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = ".pi/state/conversations.db";
const CONV_ID = "main";

function getStore(): ConversationStore {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  return new ConversationStore(DB_PATH, { agent: "orchestrator" });
}

/** Estrae il testo da un AgentMessage (content = array di blocchi {type,text} | stringa). Difensivo. */
function messageText(message: any): string {
  if (message == null) return "";
  const c = message.content ?? message;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    // SOLO blocchi text espliciti (esclude toolCall, thinking, redacted che potrebbero avere un campo `text`).
    return c.filter((b: any) => b && b.type === "text" && typeof b.text === "string")
      .map((b: any) => b.text)
      .join("");
  }
  return "";
}

export default function (pi: ExtensionAPI) {
  const store = getStore();

  // utente → store. SOLO input utente GENUINO: `input` fa fire anche per steer/followUp (mid-turn) e per
  // i comandi `/` non gestiti → li si filtra (source interattiva, non-streaming, non slash-command), altrimenti
  // si gonfia la conversazione. Passthrough: non altera l'input. (fix review P0 2026-06-29.)
  pi.on("input", (event) => {
    const e = event as any;
    const text = e.text;
    const genuine = typeof text === "string" && text.trim() &&
      e.source === "interactive" && !e.streamingBehavior && !text.startsWith("/");
    if (genuine) store.append(CONV_ID, "user", text);
    return { action: "continue" } as const;
  });

  // assistant → store. Su `agent_end` (fire UNA volta a fine loop), NON su `turn_end` (fire una volta per ROUND
  // LLM → una risposta multi-tool darebbe N righe assistant, corrompendo window/range). Si prende l'ULTIMO
  // messaggio assistant del loop = la risposta finale visibile all'utente. (fix review P0 2026-06-29.)
  pi.on("agent_end", (event) => {
    const msgs = (event as any).messages;
    if (!Array.isArray(msgs)) return;
    let lastAssistantText = "";
    for (const m of msgs) {
      if (m && m.role === "assistant") {
        const t = messageText(m);
        if (t.trim()) lastAssistantText = t;
      }
    }
    if (lastAssistantText.trim()) store.append(CONV_ID, "assistant", lastAssistantText);
  });

  // recupero per ID + range (subagent / by-reference). È ciò che il marker della lane suggerisce.
  pi.registerTool({
    name: "get_conversation",
    label: "Get conversation turns by id+range",
    description:
      "Recupera turni della conversazione per id + range di seq (es. il pieno dietro al marker della finestra, " +
      "o un estratto citato da un messaggio inter-agent {conv_id,range}). Senza range, ritorna la finestra recente.",
    parameters: Type.Object({
      conv_id: Type.Optional(Type.String({ description: "ID conversazione (default 'main')." })),
      from_seq: Type.Optional(Type.Number({ description: "seq iniziale (inclusivo)." })),
      to_seq: Type.Optional(Type.Number({ description: "seq finale (inclusivo)." })),
      n: Type.Optional(Type.Number({ description: "Se nessun range: ultimi N turni (default 10)." })),
    }),
    async execute(_t: string, p: any) {
      const convId = p.conv_id ?? CONV_ID;
      const rows = (p.from_seq != null && p.to_seq != null)
        ? store.range(convId, p.from_seq, p.to_seq)
        : store.window(convId, p.n ?? 10);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }], details: { count: rows.length } };
    },
  });
}

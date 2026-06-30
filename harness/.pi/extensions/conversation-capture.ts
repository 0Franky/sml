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
import { getConversationStore, getVarsQueue, closeAll } from "../../src/state-db.mjs";
import { getConvId, setConvId, resolveConvId } from "../../src/session-context.mjs";
import { redactText } from "../../src/secrets-redact.mjs";
import { getDynamicSecrets } from "../../src/secrets-registry.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const META_CONV = "_conv_id"; // convId persistito (vars.db meta) → riusato cross-reload/resume

/** Redige i segreti (pattern statici + dynamic) dal testo PRIMA di persisterlo/ri-iniettarlo. */
function redactSafe(s: string): string {
  return redactText(s, getDynamicSecrets()).redacted;
}

const DB_PATH = ".pi/state/conversations.db";
const VARS_DB_PATH = ".pi/state/vars.db"; // DB dello stato (distinto da conversations.db) — meta convId condiviso

function getStore(): ConversationStore {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  return getConversationStore(DB_PATH, { agent: "orchestrator" }); // connessione condivisa (no leak)
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
  pi.on("session_shutdown", () => closeAll()); // rilascia le connessioni DB condivise (fix leak)
  // convId PERSISTITO e keyato PER-SESSIONE: lo slot meta è `_conv_id:<sessionId>` (ctx.sessionManager.getSessionId)
  // → ogni sessione pi ha il suo convId isolato. Reload/resume della STESSA sessione riusano il suo convId (la lane
  // <messages_with_user> non va a vuoto, ADR principio-3); /new e /fork (sessionId nuovo) ottengono una conversazione
  // nuova SENZA mischiarsi con le altre. Fallback a slot globale se getSessionId non è disponibile (SDK headless).
  // Condiviso con context-assembly via session-context. (review-loop #3 2026-06-29, P2 convId-cross-sessione — fix pieno.)
  pi.on("session_start", (event, ctx) => {
    const reason = (event as any).reason ?? "startup";
    // STESSO path+opts delle altre 7 extension → il singleton vars.db non nasce mai con agent='main' per via di
    // questa call-site, qualunque sia l'ordine di load (review-loop #3 2026-06-29, P2 singleton-agent).
    const meta = getVarsQueue(VARS_DB_PATH, { agent: "orchestrator" });
    const sessionId = (ctx as any)?.sessionManager?.getSessionId?.() ?? null;
    const metaKey = sessionId ? `${META_CONV}:${sessionId}` : META_CONV;
    const { convId, persist } = resolveConvId(reason, meta.getMeta(metaKey), Date.now(), { perSession: !!sessionId });
    setConvId(convId);
    if (persist) meta.setMeta(metaKey, convId);
  });

  // utente → store. SOLO input utente GENUINO: `input` fa fire anche per steer/followUp (mid-turn) e per
  // i comandi `/` non gestiti → li si filtra (source interattiva, non-streaming, non slash-command), altrimenti
  // si gonfia la conversazione. Passthrough: non altera l'input. (fix review P0 2026-06-29.)
  pi.on("input", (event) => {
    const e = event as any;
    const text = e.text;
    const genuine = typeof text === "string" && text.trim() &&
      e.source === "interactive" && !e.streamingBehavior && !text.startsWith("/");
    // redazione segreti PRIMA di persistere = DIFESA-IN-PROFONDITÀ best-effort, NON una garanzia: redige i pattern
    // noti (secrets-redact) + i segreti già registrati via add_secret. Un segreto NON-pattern incollato PRIMA di
    // add_secret può ancora finire in conversations.db e nella lane (gap di copertura inerente al redattore
    // pattern+registry — l'utente usi add_secret). (review-loop #3 2026-06-29, P2 secret-coverage.)
    if (genuine) store.append(getConvId(), "user", redactSafe(text));
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
    if (lastAssistantText.trim()) store.append(getConvId(), "assistant", redactSafe(lastAssistantText));
  });

  // recupero per ID + range (subagent / by-reference). È ciò che il marker della lane suggerisce.
  pi.registerTool({
    name: "get_conversation",
    label: "Get conversation turns by id+range",
    description:
      "Retrieve conversation turns by id + seq range (e.g. the full content behind the window marker, " +
      "or an excerpt cited by an inter-agent message {conv_id,range}). Without a range, returns the recent window.",
    parameters: Type.Object({
      conv_id: Type.Optional(Type.String({ description: "Conversation ID (default: the current session's conversation)." })),
      from_seq: Type.Optional(Type.Number({ description: "Start seq (inclusive)." })),
      to_seq: Type.Optional(Type.Number({ description: "End seq (inclusive)." })),
      n: Type.Optional(Type.Number({ description: "If no range: last N turns (default 10)." })),
    }),
    async execute(_t: string, p: any) {
      const convId = p.conv_id ?? getConvId();
      const rows = (p.from_seq != null && p.to_seq != null)
        ? store.range(convId, p.from_seq, p.to_seq)
        : store.window(convId, p.n ?? 10);
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }], details: { count: rows.length } };
    },
  });
}

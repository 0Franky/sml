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
import { ConversationStore, isGenuineUserInput } from "../../src/conversation-store.mjs";
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

  // utente → store. SOLO input utente GENUINO: `input` fa fire anche per steer/followUp (mid-turn) e per i comandi `/`
  // non gestiti → li si filtra. La logica è in `isGenuineUserInput` (pura/testata): accetta source `interactive` E
  // `rpc` (driver programmatico/SDK/harness), esclude mid-turn/slash/`extension`. Fix 2026-07-03: prima solo
  // "interactive" → in rpc/headless la conversazione non veniva catturata (lane vuota). Passthrough: non altera l'input.
  pi.on("input", (event) => {
    const e = event as any;
    const text = e.text;
    const genuine = isGenuineUserInput({ text, source: e.source, streamingBehavior: e.streamingBehavior });
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
      "Retrieve past conversation turns. For 'my first/oldest N messages' or 'read from the beginning', use from_start=true " +
      "(you do NOT need seq numbers — seq are GLOBAL ids shared across sessions, they do NOT start at 1 for this chat). " +
      "For a precise slice pass from_seq+to_seq. With none of these, returns the recent window (last N).",
    parameters: Type.Object({
      conv_id: Type.Optional(Type.String({ description: "Conversation ID (default: the current session's conversation)." })),
      from_start: Type.Optional(Type.Boolean({ description: "Read the OLDEST turns first (the beginning of THIS conversation). Use for 'give me my first/oldest N messages' — no seq math needed." })),
      from_seq: Type.Optional(Type.Number({ description: "Precise slice: start seq (inclusive). seq are GLOBAL — read the value from a lane marker, don't guess a low number." })),
      to_seq: Type.Optional(Type.Number({ description: "Precise slice: end seq (inclusive)." })),
      n: Type.Optional(Type.Number({ description: "How many turns (default 10) — for from_start and for the default recent window." })),
    }),
    async execute(_t: string, p: any) {
      const convId = p.conv_id ?? getConvId();
      const n = p.n ?? 10;
      const rows = p.from_start
        ? store.windowOldest(convId, n)
        : (p.from_seq != null && p.to_seq != null)
          ? store.range(convId, p.from_seq, p.to_seq)
          : store.window(convId, n);
      // TOLLERANZA (sessione live 019f292b): un [] "nudo" fa confabulare il 9B "non ho storia". Se la query non matcha
      // NIENTE ma la conversazione HA messaggi (range sbagliato — es. seq bassi che sono di ALTRE sessioni), NON tornare
      // []: recupera mostrando i PIÙ VECCHI + i bound REALI + steer a from_start. Così il [] confondente è impossibile.
      if (rows.length === 0) {
        const total = store.count(convId);
        if (total > 0) {
          const first = store.firstSeq(convId), last = store.lastSeq(convId);
          const fallback = store.windowOldest(convId, n);
          const note = `Your query matched no turns, but this conversation HAS ${total} messages (seq ${first}..${last} — seq are GLOBAL ids, not 1-based, so a low range like 1..N is wrong). Showing the oldest ${fallback.length} below; for more use from_start=true with a bigger n, or a range within ${first}..${last}.`;
          return { content: [{ type: "text", text: `${note}\n\n${JSON.stringify(fallback, null, 2)}` }], details: { count: fallback.length } };
        }
        return { content: [{ type: "text", text: `This conversation (${convId}) has no messages yet.` }], details: { count: 0 } };
      }
      return { content: [{ type: "text", text: JSON.stringify(rows, null, 2) }], details: { count: rows.length } };
    },
  });
}

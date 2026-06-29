/**
 * context-assembly — Fase 1 (datastore-backed).
 *
 * Inietta un blocco <context> strutturato — assemblato dalle lane del vars-queue
 * (rules/current_aim/task_list/verify_queue/vars/recent_changes) — nel system prompt
 * via hook `before_agent_start`. Sostituisce il placeholder statico della Fase 0.
 *
 * Lo stato vive in `.pi/state/vars.db` (SQLite via node:sqlite) → sopravvive al compact
 * (cross-session) ed è condiviso con l'extension `vars-queue.ts` (stesso file DB).
 * Design: ../../wiki/concepts/wrapper-context-assembly-example.md + agent-wrapper-vars-queue.md.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { getVarsQueue, getConversationStore, closeAll } from "../../src/state-db.mjs";
import { assembleContext, buildResumeDigest } from "../../src/context-assembler.mjs";
import { buildMessagesLane, windowNativeMessages } from "../../src/conversation-store.mjs";
import { getConvId } from "../../src/session-context.mjs";
import { getFocusStack, buildNestedWorkspace, evaluateTrigger, shouldEmitFocusHint } from "../../src/nested-compact.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const MESSAGES_WINDOW_N = 8; // turni verbatim mostrati nella lane <messages_with_user>

const DB_PATH = ".pi/state/vars.db";

function getStore(): VarsQueue {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const vq = getVarsQueue(DB_PATH, { agent: "orchestrator" }); // connessione condivisa (no leak)
  // Seed delle RULES always-context (idempotente: addRule fa upsert per id).
  if (vq.listRules().length === 0) {
    vq.addRule(
      "structured-thinking",
      "Pensiero STRUTTURATO (tabelle di check, marker [V]/[A]/[?]); la risposta all'utente è prosa normale.",
      { severity: "soft" },
    );
    vq.addRule(
      "pre-flight-destructive",
      "Azioni distruttive: pre-flight check (reversibile? dipendenze? backup?), HALT se irreversibile.",
      { severity: "hard" },
    );
    vq.addRule("no-secret-exfil", "Mai esfiltrare segreti o contenuti sensibili.", { severity: "hard" });
  }
  return vq;
}

export default function (pi: ExtensionAPI) {
  const vq = getStore();
  const convStore = getConversationStore(); // .pi/state/conversations.db (condiviso con conversation-capture)
  pi.on("session_shutdown", () => closeAll()); // rilascia le connessioni DB condivise (fix leak)

  // UNICO injector del workspace (no chaining ambiguo): matrioska-aware + lane conversazione (Strada-2).
  pi.on("before_agent_start", (event, ctx) => {
    const usage = ctx?.getContextUsage?.();
    const tokens = usage?.tokens ?? null;
    const contextWindow = usage?.contextWindow ?? null;
    const convId = getConvId();

    const stack = getFocusStack(vq);
    let workspace: string;
    if (stack.length > 0) {
      // Uno scope è aperto → workspace NESTED: <frame> (zoom-OUT) + <context> FILTRATO + lane <messages_with_user>.
      const top = stack[stack.length - 1];
      workspace = buildNestedWorkspace(vq, { focusScopeId: top.scope_id, store: convStore, convId, messagesN: MESSAGES_WINDOW_N });
    } else {
      // Nessuno scope → resume? + <context> + <focus_hint>? + lane <messages_with_user>.
      const resume = buildResumeDigest(vq);
      const base = assembleContext(vq);
      const trig = evaluateTrigger(vq, { tokens, contextWindow });
      const hint =
        trig.recommend === "matrioska" && shouldEmitFocusHint(vq)
          ? `\n<focus_hint watch="${trig.metrics.watchCount}"${trig.metrics.percent != null ? ` ctx="${Math.round(trig.metrics.percent * 100)}%"` : ""}>Contesto in pressione: valuta enter_focus su un sotto-insieme di task per lavorare a fuoco (pop_focus al termine).</focus_hint>`
          : "";
      const lane = buildMessagesLane(convStore, convId, { n: MESSAGES_WINDOW_N });
      workspace = (resume ? `${resume}\n` : "") + base + hint + (lane ? `\n${lane}` : "");
    }
    return { systemPrompt: `${event.systemPrompt}\n\n${workspace}` };
  });

  // Strada-2 (full): la conversazione è il NOSTRO artefatto, curata nella lane <messages_with_user> sopra. L'array
  // messaggi NATIVO di pi viene quindi SOPPRESSO al solo TURNO CORRENTE (dall'ultimo 'user' in poi, coi suoi
  // tool_call/tool_result) → niente doppia-chat né crescita illimitata (sostituisce la compaction nativa, OFF). I
  // turni precedenti restano in conversations.db, recuperabili via get_conversation. (ADR principio-3.)
  // NB: entro UN turno (anche multi-tool) lastUser=0 → nessuna soppressione (la continuità del tool-loop è intatta);
  // si sopprime SOLO la storia dei turni precedenti (dal 2° turno in poi).
  pi.on("context", (event) => {
    const windowed = windowNativeMessages(event.messages as any[]);
    if (windowed !== (event.messages as any[])) return { messages: windowed };
  });
}

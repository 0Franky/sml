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
import { buildMessagesLane } from "../../src/conversation-store.mjs";
import { getConvId } from "../../src/session-context.mjs";
import { getFocusStack, buildNestedWorkspace, evaluateTrigger, shouldEmitFocusHint, markFocusHintEmitted } from "../../src/nested-compact.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// Context-budget OPT-IN (msg 520): soglie trigger + finestra messaggi configurabili per modello/infra
// (.pi/harness.config.json o env HARNESS_*). Senza config → default (comportamento invariato). Caricato una volta al load.
const HARNESS_CFG = loadHarnessConfig();
const MESSAGES_WINDOW_N = HARNESS_CFG.messagesWindowN; // turni verbatim mostrati nella lane <messages_with_user>

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

    // segment-boundary del checkpoint (scritto dal tool `checkpoint`, vedi checkpoint.ts): la lane mostra SOLO i
    // messaggi DOPO l'ultimo checkpoint per questa conversazione (la chat pre-checkpoint è ripiegata nel digest).
    const checkpointSeq = Number(vq.getMeta(`_checkpoint_seq:${convId}`)) || 0;

    const stack = getFocusStack(vq);
    let workspace: string;
    if (stack.length > 0) {
      // Uno scope è aperto → workspace NESTED: <frame> (zoom-OUT) + <context> FILTRATO + lane <messages_with_user>.
      const top = stack[stack.length - 1];
      workspace = buildNestedWorkspace(vq, { focusScopeId: top.scope_id, store: convStore, convId, messagesN: MESSAGES_WINDOW_N, afterSeq: checkpointSeq });
    } else {
      // Nessuno scope → resume? + <context> + <focus_hint>? + lane <messages_with_user>.
      const resume = buildResumeDigest(vq);
      const base = assembleContext(vq);
      const trig = evaluateTrigger(vq, { tokens, contextWindow }, HARNESS_CFG.trigger);
      let hint = "";
      if (trig.recommend === "matrioska" && shouldEmitFocusHint(vq)) {
        hint = `\n<focus_hint watch="${trig.metrics.watchCount}"${trig.metrics.percent != null ? ` ctx="${Math.round(trig.metrics.percent * 100)}%"` : ""}>Contesto in pressione: valuta enter_focus su un sotto-insieme di task per lavorare a fuoco (pop_focus al termine).</focus_hint>`;
        // gathering.mode=inject (msg 531): allega INLINE la vista ordinata, così quando l'harness nudga il focus il
        // modello non sceglie il subset alla cieca. Low-ceremony (niente focus dedicato). Gate proporzionalità: solo
        // con ≥ minTasksForForce task open. Vedi wiki/concepts/focus-task-prioritization.md §gathering-enforcement.
        if (HARNESS_CFG.gathering.mode === "inject") {
          const { structured, tasks } = vq.listTasksOrdered();
          if (tasks.length >= HARNESS_CFG.gathering.minTasksForForce) {
            const lines = tasks.map(
              (t: any) =>
                `  - ${t.id} [${t.status}]${structured ? ` ready=${t.ready} unblocks=${t.unblocks} prio=${t.priority}` : ""} : ${t.title}`,
            );
            hint += `\n<execution_order note="ready-first then downstream-impact then priority">\n${lines.join("\n")}\n</execution_order>`;
          }
        }
        markFocusHintEmitted(vq); // commit del cooldown solo dopo aver deciso di emettere (query/command separati)
      }
      const lane = buildMessagesLane(convStore, convId, { n: MESSAGES_WINDOW_N, afterSeq: checkpointSeq });
      workspace = (resume ? `${resume}\n` : "") + base + hint + (lane ? `\n${lane}` : "");
    }
    return { systemPrompt: `${event.systemPrompt}\n\n${workspace}` };
  });
  // NB: la SOPPRESSIONE dell'array messaggi nativo (hook `context`, Strada-2 keepTurns:1) vive nell'extension
  // dedicata `native-window.ts` (responsabilità ortogonale all'assemblaggio del workspace). La lane
  // <messages_with_user> qui (n=MESSAGES_WINDOW_N) e quella finestra sono COMPLEMENTARI: native=turno corrente,
  // lane=storia → niente doppia-chat. (review-loop #3 2026-06-29, P3 cohesion.)
}

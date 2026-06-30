/**
 * checkpoint — il NOSTRO "autocompact" (NON la compaction nativa di pi, che è OFF). Idea utente TG 2026-06-29
 * (msg 505: "deve fare il nostro checkpoint e non quello nativo di pi"; nome `checkpoint` confermato).
 *
 * Strada-2 coerente, NON-lossy, NON usa il modello attivo per riassumere. Il tool `checkpoint(note?)`:
 *  (a) scrive un HANDOFF durevole — la `note` del modello ("dove sono / prossimo passo") + uno snapshot
 *      auto (aim + #task aperti + #decisioni recenti) — nel namespace `handoff` di vars.db. Già consumato da
 *      `buildResumeDigest` (context-assembler) → al riavvio compare in <resuming_from> ("if not written it doesn't exist").
 *  (b) marca un SEGMENT-BOUNDARY (`_checkpoint_seq:<convId>` = max seq conversazione) → la lane
 *      <messages_with_user> riparte da lì (la chat PRE-checkpoint si ripiega nel digest, recuperabile per ID via
 *      get_conversation). È l'effetto "alleggerimento contesto" ma nel nostro modo: niente perdita, niente
 *      riassunto del modello-attivo. F=meccanismo (PIENA) / S=quando-checkpointare (DEGRADATA-MA-UTILE).
 *
 * Logica deterministica riusa vars-queue (setVar namespace `handoff` + setMeta) + conversation-store (lastSeq).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { getVarsQueue, getConversationStore, closeAll } from "../../src/state-db.mjs";
import { getConvId } from "../../src/session-context.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const VARS_DB_PATH = ".pi/state/vars.db";
const CONV_DB_PATH = ".pi/state/conversations.db";
/** Prefisso del meta che marca il segment-boundary per-conversazione (letto da context-assembly per la lane). */
export const CHECKPOINT_SEQ_META = "_checkpoint_seq:";

export default function (pi: ExtensionAPI) {
  mkdirSync(dirname(VARS_DB_PATH), { recursive: true });
  const vq = getVarsQueue(VARS_DB_PATH, { agent: "orchestrator" });
  const store = getConversationStore(CONV_DB_PATH, { agent: "orchestrator" });
  pi.on("session_shutdown", () => closeAll());

  pi.registerTool({
    name: "checkpoint",
    label: "Checkpoint: consolidate a durable resume point",
    description:
      "Consolidate a CHECKPOINT of your state (this is NOT the native compaction): (1) it writes a durable handoff — your " +
      "`note` on where you are and the next step + a snapshot of aim/tasks/decisions — which will reappear in <resuming_from> " +
      "at the next session; (2) it folds the conversation so far (earlier messages stay retrievable via " +
      "get_conversation, the lane restarts light). Use it at a natural boundary or when you want to lighten the context without losing anything.",
    promptSnippet: "checkpoint(note?) — consolidate a durable resume point (handoff + lightens the lane).",
    promptGuidelines: [
      "Call checkpoint at a natural boundary (milestone, phase change) or when the context gets heavy: " +
        "write in the `note` where you are and the next step. It does NOT lose anything (the chat stays in get_conversation); " +
        "it consolidates the durable state and restarts the message lane light.",
    ],
    parameters: Type.Object({
      note: Type.Optional(Type.String({ description: "Where you are / next step (narrative handoff for the resume)." })),
    }),
    async execute(_t: string, p: any) {
      const convId = getConvId();
      const boundary = store.lastSeq(convId); // tutto ciò che precede questo seq verrà ripiegato nella lane
      // snapshot durevole (oltre alla note del modello) per un resume ricco anche senza note.
      const currId = vq.getCurr();
      const curr = currId ? vq.getTask(currId) : null;
      const open = [...vq.listTasks({ status: "in_progress" }), ...vq.listTasks({ status: "pending" })];
      const decisions = vq.getSharedView().filter((v: any) => v.decision_ref).length;
      const note = typeof p.note === "string" && p.note.trim() ? p.note.trim() : null;
      const summary =
        `checkpoint @seq ${boundary}` +
        (curr ? ` · aim=${curr.id}` : "") +
        ` · ${open.length} open tasks · ${decisions} decisions`;
      const handoff = {
        next_step: note, // letto da buildResumeDigest come "prossimo passo"
        summary,
        aim: curr ? { id: curr.id, status: curr.status, title: curr.title } : null,
        open_tasks: open.length,
        checkpoint_seq: boundary,
        ts: Date.now(),
      };
      // handoff durevole (namespace `handoff` → consumato da buildResumeDigest) + segment-boundary per-conversazione.
      vq.setVar("session-checkpoint", handoff, { namespace: "handoff", who: "orchestrator" });
      vq.setMeta(`${CHECKPOINT_SEQ_META}${convId}`, String(boundary));
      return {
        content: [{ type: "text", text: `✓ ${summary}${note ? ` · note: "${note}"` : ""}. Conversation folded (retrievable via get_conversation).` }],
        details: { ok: true, checkpoint_seq: boundary, open_tasks: open.length },
      };
    },
  });
}

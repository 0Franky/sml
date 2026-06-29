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
    label: "Checkpoint: consolida un punto-di-ripresa durevole",
    description:
      "Consolida un CHECKPOINT del tuo stato (NON è il compaction nativo): (1) scrive un handoff durevole — la tua " +
      "`note` su dove sei e il prossimo passo + uno snapshot di aim/task/decisioni — che riapparirà in <resuming_from> " +
      "alla prossima sessione; (2) ripiega la conversazione fin qui (i messaggi precedenti restano recuperabili via " +
      "get_conversation, la lane riparte leggera). Usalo a un confine naturale o quando vuoi alleggerire il contesto senza perdere nulla.",
    promptSnippet: "checkpoint(note?) — consolida un punto-di-ripresa durevole (handoff + alleggerisce la lane).",
    promptGuidelines: [
      "Chiama checkpoint a un confine naturale (milestone, cambio-fase) o quando il contesto si appesantisce: " +
        "scrivi nella `note` dove sei e il prossimo passo. NON perde nulla (la chat resta in get_conversation); " +
        "consolida lo stato durevole e fa ripartire leggera la lane dei messaggi.",
    ],
    parameters: Type.Object({
      note: Type.Optional(Type.String({ description: "Dove sei / prossimo passo (handoff narrativo per il resume)." })),
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
        ` · ${open.length} task aperti · ${decisions} decisioni`;
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
        content: [{ type: "text", text: `✓ ${summary}${note ? ` · note: "${note}"` : ""}. Conversazione ripiegata (recuperabile via get_conversation).` }],
        details: { ok: true, checkpoint_seq: boundary, open_tasks: open.length },
      };
    },
  });
}

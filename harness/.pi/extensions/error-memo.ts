/**
 * error-memo — Fase 1 (anticipata): memoria di lezioni/errori, persistente e richiamabile.
 *
 * Registra `remember_lesson` (memo a 2 livelli: lezione generica + esempio concreto) e
 * `recall_lessons`. Backed dal datastore vars-queue (`.pi/state/vars.db`, namespace "memo")
 * → sopravvive al compact. Implementa ../../wiki/concepts/error-memo-system.md.
 *
 * API pi verificata: pi.registerTool({ name, label, description, parameters:<typebox>, execute }).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { getVarsQueue, closeAll } from "../../src/state-db.mjs";

const MEMO_NS = "memo";

function store(): VarsQueue {
  return getVarsQueue(); // vars.db dell'orchestratore (path+mkdir+agent nel singleton state-db)
}

export default function (pi: ExtensionAPI) {
  const vq = store();
  pi.on("session_shutdown", () => closeAll()); // rilascia le connessioni DB condivise (fix leak)

  pi.registerTool({
    name: "remember_lesson",
    label: "Remember a lesson/error",
    description:
      "Persist a lesson learned from an error (2 levels: generic lesson + concrete example). Retrievable with recall_lessons. Survives the compact.",
    parameters: Type.Object({
      id: Type.String({ description: "Short slug (e.g. 'find-references-before-rename')." }),
      lesson: Type.String({ description: "The generic lesson / principle." }),
      example: Type.Optional(Type.String({ description: "Concrete example (what happened)." })),
    }),
    async execute(_toolCallId: string, params: any) {
      vq.setVar(
        params.id,
        { lesson: params.lesson, example: params.example ?? null },
        { namespace: MEMO_NS, scope: "private" },
      );
      return { content: [{ type: "text", text: `lesson '${params.id}' stored` }], details: { ok: true } };
    },
  });

  pi.registerTool({
    name: "recall_lessons",
    label: "Recall lessons/errors",
    description: "Recall stored lessons (error memos). Optional filter on a substring of id/lesson.",
    parameters: Type.Object({ filter: Type.Optional(Type.String()) }),
    async execute(_toolCallId: string, params: any) {
      const all = vq.listVars({ namespace: MEMO_NS });
      const f = typeof params.filter === "string" ? params.filter.toLowerCase() : null;
      const out = all
        .map((v) => {
          const val = (v.value ?? {}) as { lesson?: string; example?: string | null };
          return { id: v.id, lesson: val.lesson, example: val.example ?? null };
        })
        .filter((m) => !f || m.id.toLowerCase().includes(f) || String(m.lesson ?? "").toLowerCase().includes(f));
      return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }], details: { count: out.length } };
    },
  });
}

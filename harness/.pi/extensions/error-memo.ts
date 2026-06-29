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
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = ".pi/state/vars.db";
const MEMO_NS = "memo";

function store(): VarsQueue {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  return new VarsQueue(DB_PATH, { agent: "orchestrator" });
}

export default function (pi: ExtensionAPI) {
  const vq = store();

  pi.registerTool({
    name: "remember_lesson",
    label: "Remember a lesson/error",
    description:
      "Persiste una lezione appresa da un errore (2 livelli: lezione generica + esempio concreto). Richiamabile con recall_lessons. Sopravvive al compact.",
    parameters: Type.Object({
      id: Type.String({ description: "Slug breve (es. 'find-references-before-rename')." }),
      lesson: Type.String({ description: "La lezione generica / il principio." }),
      example: Type.Optional(Type.String({ description: "Esempio concreto (cosa è successo)." })),
    }),
    async execute(_toolCallId: string, params: any) {
      vq.setVar(
        params.id,
        { lesson: params.lesson, example: params.example ?? null },
        { namespace: MEMO_NS, scope: "private" },
      );
      return { content: [{ type: "text", text: `lezione '${params.id}' memorizzata` }], details: { ok: true } };
    },
  });

  pi.registerTool({
    name: "recall_lessons",
    label: "Recall lessons/errors",
    description: "Richiama le lezioni memorizzate (memo errori). Filtro opzionale su substring di id/lezione.",
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

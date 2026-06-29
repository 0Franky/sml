/**
 * vars-queue — Fase 1: espone il datastore al modello via tool.
 *
 * Registra i tool con cui il modello persiste/legge lo stato (cross-compact + cross-agent):
 * `set_var`, `get_var`, `set_task_status`. Ogni mutazione è tracciata nel change-log con
 * timestamp (vedi ../../src/vars-queue.mjs). Lo stato è `.pi/state/vars.db`, condiviso con
 * l'extension `context-assembly.ts` che lo serializza nel <context>.
 *
 * Design: ../../wiki/concepts/agent-wrapper-vars-queue.md + cross-session-state-sharing.md.
 * API pi verificata: pi.registerTool({ name, label, description, parameters:<typebox>, execute }).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = ".pi/state/vars.db";

function getStore(): VarsQueue {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  return new VarsQueue(DB_PATH, { agent: "orchestrator" });
}

export default function (pi: ExtensionAPI) {
  const vq = getStore();

  pi.registerTool({
    name: "set_var",
    label: "Set persisted variable",
    description:
      "Persiste una variabile (sopravvive al compact; scope 'shared' la rende visibile cross-agent). Il cambiamento è tracciato nel change-log con timestamp + ref-decisione opzionale.",
    parameters: Type.Object({
      id: Type.String({ description: "Identificatore della variabile." }),
      value: Type.Any({ description: "Valore (JSON-serializzabile)." }),
      scope: Type.Optional(
        Type.Union([Type.Literal("private"), Type.Literal("shared")], {
          description: "private (default) o shared (cross-agent).",
        }),
      ),
      decision_ref: Type.Optional(Type.String({ description: "Ref alla decisione che motiva il cambiamento." })),
    }),
    async execute(_toolCallId: string, params: any) {
      const v = vq.setVar(params.id, params.value, {
        scope: params.scope ?? "private",
        decisionRef: params.decision_ref ?? null,
      });
      return { content: [{ type: "text", text: JSON.stringify(v) }], details: { ok: true } };
    },
  });

  pi.registerTool({
    name: "get_var",
    label: "Get persisted variable",
    description: "Legge una variabile persistita per id (sempre l'ultima versione → auto-propagazione per riferimento).",
    parameters: Type.Object({ id: Type.String() }),
    async execute(_toolCallId: string, params: any) {
      const v = vq.getVar(params.id);
      return { content: [{ type: "text", text: JSON.stringify(v) }], details: { found: v != null } };
    },
  });

  pi.registerTool({
    name: "set_task_status",
    label: "Update task status",
    description:
      "Aggiorna lo stato di un task (pending|in_progress|done|blocked) + change-log. Crea il task se non esiste e 'title' è fornito.",
    parameters: Type.Object({
      id: Type.String(),
      status: Type.String({ description: "pending | in_progress | done | blocked" }),
      title: Type.Optional(Type.String({ description: "Se il task non esiste, lo crea con questo titolo." })),
    }),
    async execute(_toolCallId: string, params: any) {
      if (!vq.getTask(params.id) && params.title) vq.addTask(params.id, params.title);
      const t = vq.setTaskStatus(params.id, params.status);
      return { content: [{ type: "text", text: JSON.stringify(t) }], details: { ok: true } };
    },
  });
}

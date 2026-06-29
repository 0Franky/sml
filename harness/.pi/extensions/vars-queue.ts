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

  // --- shared-vars cross-agent (gathering 2026-06-29: anticipa cross-session-state-sharing) ---
  pi.registerTool({
    name: "get_shared_view",
    label: "Read shared vars (cross-agent)",
    description: "Ritorna la VIEW read delle var marcate 'shared' (visibili cross-agent). È ciò che un sotto-agente riceve.",
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text", text: JSON.stringify(vq.getSharedView(), null, 2) }], details: {} };
    },
  });
  pi.registerTool({
    name: "propose_var",
    label: "Propose a shared-var write (cross-agent)",
    description: "Un sotto-agente PROPONE una scrittura su una var condivisa (non scrive diretto → niente race). L'orchestratore poi fa il merge.",
    parameters: Type.Object({ var_id: Type.String(), value: Type.Any() }),
    async execute(_t: string, p: any) {
      vq.proposeVar(p.var_id, p.value);
      return { content: [{ type: "text", text: `proposta registrata (${vq.pendingProposals().length} pendenti)` }], details: { ok: true } };
    },
  });
  pi.registerTool({
    name: "merge_proposals",
    label: "Merge pending shared-var proposals (single-writer)",
    description: "L'orchestratore applica le proposte pendenti sulle var condivise (single-writer → niente race). Ritorna quante applicate.",
    parameters: Type.Object({}),
    async execute() {
      const n = vq.mergeProposals();
      return { content: [{ type: "text", text: `${n} proposte applicate` }], details: { applied: n } };
    },
  });

  // --- change-log + CURR + listing (visibilità dei cambiamenti, anche cross-compact) ---
  pi.registerTool({
    name: "get_changelog",
    label: "Read change-log (who/when/what)",
    description: "Ritorna il change-log recente (chi/quando/cosa + ref-decisione). I cambiamenti sopravvivono al compact. Filtri opzionali: since (epoch ms), entity, limit.",
    parameters: Type.Object({
      since: Type.Optional(Type.Number()),
      entity: Type.Optional(Type.String()),
      limit: Type.Optional(Type.Number()),
    }),
    async execute(_t: string, p: any) {
      const log = vq.getChangeLog({ since: p.since ?? 0, entity: p.entity ?? null, limit: p.limit ?? 50 });
      return { content: [{ type: "text", text: JSON.stringify(log, null, 2) }], details: { count: log.length } };
    },
  });
  pi.registerTool({
    name: "set_curr",
    label: "Set current aim (CURR pointer)",
    description: "Imposta il task corrente (CURR pointer) — l'aim che alimenta il <context>.",
    parameters: Type.Object({ task_id: Type.String() }),
    async execute(_t: string, p: any) {
      vq.setCurr(p.task_id);
      return { content: [{ type: "text", text: `CURR = ${p.task_id}` }], details: { ok: true } };
    },
  });
  pi.registerTool({
    name: "list_tasks",
    label: "List tasks",
    description: "Elenca i task (filtro opzionale per status: pending|in_progress|done|blocked).",
    parameters: Type.Object({ status: Type.Optional(Type.String()) }),
    async execute(_t: string, p: any) {
      const tasks = vq.listTasks({ status: p.status ?? null });
      return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }], details: { count: tasks.length } };
    },
  });
}

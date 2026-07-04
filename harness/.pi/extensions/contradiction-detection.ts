/**
 * contradiction-detection — Fase 3 (anticipata): rileva quando un NUOVO fatto/requisito contraddice
 * un'ASSUNZIONE di una decisione precedente registrata. Implementa il livello deterministico di
 * ../../wiki/concepts/contradiction-detection-layer.md (research-gap #2, validato dal Test B
 * harness/src/_dogfood-contradiction.mjs).
 *
 * Metà-F (meccanismo): registra decisioni+assunzioni (vars-queue, namespace "decisions", sopravvive al
 * compact) + controllo deterministico predicato↔predicato. Metà-S (quando registrare/controllare/come
 * riconciliare) = skill addestrata. L'estrattore-fuzzy di fatti da prosa è gated (formato-lane).
 *
 * API pi verificata: pi.registerTool({ name, label, description, parameters:<typebox>, execute }).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { getVarsQueue, closeAll } from "../../src/state-db.mjs";
import { checkContradiction } from "../../src/contradiction-check.mjs";

const NS = "decisions";

function store(): VarsQueue {
  return getVarsQueue(); // vars.db dell'orchestratore (path+mkdir+agent nel singleton state-db)
}

const Predicate = Type.Object({
  key: Type.String({ description: "The fact/property name (e.g. 'emails_per_user')." }),
  op: Type.String({ description: "Operator: eq|neq|gt|lt|gte|lte|in|nin (also accepts ==,!=,>,<,>=,<=,is,is-not)." }),
  value: Type.Unknown({ description: "Value (number, string, boolean, or array for in/nin)." }),
});

export default function (pi: ExtensionAPI) {
  const vq = store();
  pi.on("session_shutdown", () => closeAll()); // rilascia le connessioni DB condivise (fix leak)

  // NB nome `record_assumptions` (NON `record_decision`): evita la COLLISIONE col tool `record_decision` di
  // vars-queue.ts (la decisione-floor-F: choice+rationale+agente). Questo registra le ASSUNZIONI tipizzate su
  // cui una decisione poggia, per il contradiction-check. (fix review 2026-06-29 — prima il runner ne scartava
  // uno in silenzio per ordine di caricamento.)
  pi.registerTool({
    name: "record_assumptions",
    label: "Record a decision's assumptions (contradiction layer)",
    description:
      "Record the typed ASSUMPTIONS {key,op,value} a decision rests on (id shared with record_decision). A new fact that NEGATES an assumption will be flagged by check_facts. Survives the compact. Use it after record_decision when the decision rests on non-trivial assumptions.",
    parameters: Type.Object({
      id: Type.String({ description: "Decision slug (same id used with record_decision, e.g. 'D1-dedup-email')." }),
      statement: Type.Optional(Type.String({ description: "The decision in one sentence." })),
      assumptions: Type.Array(Predicate, { description: "The assumptions it rests on, as {key,op,value} predicates." }),
    }),
    async execute(_toolCallId: string, params: any) {
      vq.setVar(
        params.id,
        { statement: params.statement ?? null, assumptions: params.assumptions ?? [] },
        { namespace: NS, scope: "private" },
      );
      return {
        content: [{ type: "text", text: `decision '${params.id}' recorded (${(params.assumptions ?? []).length} assumptions)` }],
        details: { ok: true },
      };
    },
  });

  pi.registerTool({
    name: "check_facts",
    label: "Check new facts vs recorded decisions",
    description:
      "Check whether one or more NEW FACTS {key,op,value} contradict the assumptions of recorded decisions. Returns the conflicts (empty = none). Call it when you learn a new fact/requirement, BEFORE applying it in isolation.",
    parameters: Type.Object({
      facts: Type.Array(Predicate, { description: "The new facts as {key,op,value} predicates." }),
    }),
    async execute(_toolCallId: string, params: any) {
      const decisions = vq.listVars({ namespace: NS }).map((v: any) => ({ id: v.id, ...(v.value || {}) }));
      const conflicts = checkContradiction(params.facts ?? [], decisions as any);
      const text = conflicts.length
        ? `⚠️ ${conflicts.length} CONTRADICTION(S) detected (reconcile BEFORE proceeding):\n` +
          conflicts.map((c) => `- ${c.reason}`).join("\n")
        : `no contradiction with the ${decisions.length} recorded decisions`;
      return { content: [{ type: "text", text }], details: { conflicts, decisions_checked: decisions.length } };
    },
  });
}

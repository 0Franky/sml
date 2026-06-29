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
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = ".pi/state/vars.db";
const NS = "decisions";

function store(): VarsQueue {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  return getVarsQueue(DB_PATH, { agent: "orchestrator" }); // connessione condivisa (no leak)
}

const Predicate = Type.Object({
  key: Type.String({ description: "Il nome del fatto/proprietà (es. 'emails_per_user')." }),
  op: Type.String({ description: "Operatore: eq|neq|gt|lt|gte|lte|in|nin (accetta anche ==,!=,>,<,>=,<=,is,is-not)." }),
  value: Type.Unknown({ description: "Valore (numero, stringa, booleano, o array per in/nin)." }),
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
      "Registra le ASSUNZIONI tipizzate {key,op,value} su cui poggia una decisione (id condiviso con record_decision). Un nuovo fatto che NEGA un'assunzione verrà segnalato da check_facts. Sopravvive al compact. Usalo dopo record_decision quando la decisione poggia su assunzioni non banali.",
    parameters: Type.Object({
      id: Type.String({ description: "Slug della decisione (stesso id usato con record_decision, es. 'D1-dedup-email')." }),
      statement: Type.Optional(Type.String({ description: "La decisione in una frase." })),
      assumptions: Type.Array(Predicate, { description: "Le assunzioni su cui poggia, come predicati {key,op,value}." }),
    }),
    async execute(_toolCallId: string, params: any) {
      vq.setVar(
        params.id,
        { statement: params.statement ?? null, assumptions: params.assumptions ?? [] },
        { namespace: NS, scope: "private" },
      );
      return {
        content: [{ type: "text", text: `decisione '${params.id}' registrata (${(params.assumptions ?? []).length} assunzioni)` }],
        details: { ok: true },
      };
    },
  });

  pi.registerTool({
    name: "check_facts",
    label: "Check new facts vs recorded decisions",
    description:
      "Controlla se uno o più NUOVI FATTI {key,op,value} contraddicono le assunzioni di decisioni registrate. Ritorna i conflitti (vuoto = nessuno). Chiamalo quando apprendi un fatto/requisito nuovo, PRIMA di applicarlo in isolamento.",
    parameters: Type.Object({
      facts: Type.Array(Predicate, { description: "I nuovi fatti come predicati {key,op,value}." }),
    }),
    async execute(_toolCallId: string, params: any) {
      const decisions = vq.listVars({ namespace: NS }).map((v: any) => ({ id: v.id, ...(v.value || {}) }));
      const conflicts = checkContradiction(params.facts ?? [], decisions as any);
      const text = conflicts.length
        ? `⚠️ ${conflicts.length} CONTRADDIZIONE/I rilevata/e (riconcilia PRIMA di procedere):\n` +
          conflicts.map((c) => `- ${c.reason}`).join("\n")
        : `nessuna contraddizione con le ${decisions.length} decisioni registrate`;
      return { content: [{ type: "text", text }], details: { conflicts, decisions_checked: decisions.length } };
    },
  });
}

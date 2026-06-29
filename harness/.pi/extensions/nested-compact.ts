/**
 * nested-compact — Fase 1: espone la matrioska al modello (zoom-in/pop) + difende la compaction nativa.
 *
 * Tool model-facing (F+S): `enter_focus` (zoom-IN su un subset di task) · `pop_focus` (chiude lo scope →
 * report-to-file + re-align del padre) · `focus_status` (stack + pressione corrente). La logica vive nel core
 * node-pure `../../src/nested-compact.mjs`; qui solo il wiring pi (registerTool + getContextUsage reale).
 *
 * Lo stato condivide `.pi/state/vars.db` (stessa tabella `focus_frames` + `active_scope`) con `vars-queue.ts`
 * e `context-assembly.ts`. L'iniezione del workspace nested (frame + context filtrato) la fa `context-assembly.ts`
 * quando uno scope è aperto — qui NON si tocca `before_agent_start` (un solo injector → niente doppia iniezione).
 *
 * Design: ../../wiki/architecture/matrioska-orchestration-spec.md
 *         ../../wiki/decisions/2026-06-29-context-as-first-person-mind.md §principio-5
 * API pi: ExtensionContext.getContextUsage() (types.d.ts:236) · session_before_compact cancellabile (780).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { getVarsQueue, closeAll } from "../../src/state-db.mjs";
import { enterFocus, popFocus, getFocusStack, currentDepth, evaluateTrigger } from "../../src/nested-compact.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = ".pi/state/vars.db";
const REPORT_DIR = ".pi/state/reports";
// Context-budget OPT-IN (msg 520): stesse soglie configurabili usate da context-assembly (.pi/harness.config.json / env).
const HARNESS_CFG = loadHarnessConfig();

function getStore(): VarsQueue {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  return getVarsQueue(DB_PATH, { agent: "orchestrator" }); // connessione condivisa (no leak)
}

export default function (pi: ExtensionAPI) {
  const vq = getStore();
  pi.on("session_shutdown", () => closeAll()); // rilascia le connessioni DB condivise (fix leak)

  pi.registerTool({
    name: "enter_focus",
    label: "Zoom into a focus scope (matrioska)",
    description:
      "Apre uno scope a fuoco su un SOTTO-INSIEME di task (zoom-IN): il workspace si restringe al subset, il resto resta come backlog nel <frame>. Usalo quando il contesto è in pressione (vedi <focus_hint>/focus_status) o per isolare un sotto-lavoro. Profondità max 3. Al termine chiama pop_focus.",
    parameters: Type.Object({
      task_ids: Type.Array(Type.String(), { minItems: 1, description: "Gli id (esistenti) dei task da mettere a fuoco — almeno 1; il primo diventa l'aim/CURR." }),
      reason: Type.Optional(Type.String({ description: "Perché entri a fuoco (annotato nella decisione di enter)." })),
    }),
    async execute(_t: string, p: any) {
      try {
        const parentScopeId = vq.getActiveScope();
        const r = enterFocus(vq, { taskSubset: p.task_ids ?? [], parentScopeId }, HARNESS_CFG.trigger); // maxDepth configurabile
        return {
          content: [{ type: "text", text: JSON.stringify({ scope_id: r.scopeId, depth: r.depth, focus: p.task_ids }) }],
          details: { ok: true },
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `enter_focus rifiutato: ${e?.message ?? e}` }], details: { ok: false } };
      }
    },
  });

  pi.registerTool({
    name: "pop_focus",
    label: "Pop the current focus scope (matrioska)",
    description:
      "Chiude lo scope a fuoco corrente (pop): scrive un REPORT completo su file e risale solo {summary breve, report_path} (mai dump inline), promuove l'esito come decisione del padre, e RI-ALLINEA il padre allo stato attuale (ripristina l'aim se ancora aperto). Senza scope_id chiude lo scope più profondo aperto.",
    parameters: Type.Object({
      scope_id: Type.Optional(Type.String({ description: "Scope da chiudere (default: il più profondo aperto)." })),
    }),
    async execute(_t: string, p: any) {
      const stack = getFocusStack(vq);
      const scopeId = p.scope_id ?? (stack.length ? stack[stack.length - 1].scope_id : null);
      if (!scopeId) return { content: [{ type: "text", text: "pop_focus: nessuno scope aperto" }], details: { ok: false } };
      try {
        const r = popFocus(vq, scopeId, { reportDir: REPORT_DIR });
        return {
          content: [{ type: "text", text: JSON.stringify({ summary: r.summary, report_path: r.report_path, restored_aim: r.restoredCurr }) }],
          details: { ok: true },
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `pop_focus errore: ${e?.message ?? e}` }], details: { ok: false } };
      }
    },
  });

  pi.registerTool({
    name: "focus_status",
    label: "Show the focus stack + context pressure",
    description: "Mostra lo stack di focus aperti (depth) e la pressione del contesto corrente (none/reorder/matrioska) per decidere se entrare a fuoco.",
    parameters: Type.Object({}),
    async execute(_t: string, _p: any, _signal: any, _onUpdate: any, ctx: any) {
      const usage = ctx?.getContextUsage?.(); // ExtensionContext.getContextUsage() (5° arg di execute, types.d.ts:361)
      const trig = evaluateTrigger(vq, { tokens: usage?.tokens ?? null, contextWindow: usage?.contextWindow ?? null }, HARNESS_CFG.trigger);
      const stack = getFocusStack(vq).map((f) => ({ scope_id: f.scope_id, depth: f.depth, subset: f.task_subset }));
      return {
        content: [{ type: "text", text: JSON.stringify({ depth: currentDepth(vq), max_depth: HARNESS_CFG.trigger.maxDepth, pressure: trig.recommend, watch: trig.metrics.watchCount, stack }, null, 2) }],
        details: { ok: true },
      };
    },
  });

  // Difesa: la compaction nativa di pi è OFF (.pi/settings.json) — la matrioska è il sostituto. Se per qualche
  // motivo la threshold-compaction parte comunque, la annulliamo. NON tocchiamo `manual` (l'utente l'ha chiesta)
  // né `overflow` (recupero d'emergenza: bloccarlo brickerebbe il turno). Vedi spec §6.
  pi.on("session_before_compact", (event) => {
    if (event.reason === "threshold") return { cancel: true };
    return;
  });
}

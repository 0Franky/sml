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
import { enterFocus, popFocus, getFocusStack, currentDepth, evaluateTrigger, requireGateBlocks } from "../../src/nested-compact.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";

const REPORT_DIR = ".pi/state/reports";
// Context-budget OPT-IN (msg 520): stesse soglie configurabili usate da context-assembly (.pi/harness.config.json / env).
const HARNESS_CFG = loadHarnessConfig();

function getStore(): VarsQueue {
  return getVarsQueue(); // vars.db dell'orchestratore (path+mkdir+agent nel singleton state-db)
}

export default function (pi: ExtensionAPI) {
  const vq = getStore();
  pi.on("session_shutdown", () => closeAll()); // rilascia le connessioni DB condivise (fix leak)

  pi.registerTool({
    name: "enter_focus",
    label: "Zoom into a focus scope (matrioska)",
    description:
      "Open a focus scope on a SUBSET of tasks (zoom-IN): the workspace narrows to the subset, the rest stays as backlog in the <frame>. Use it when the context is under pressure (see <focus_hint>/focus_status) or to isolate a sub-task. Max depth 3. When done, call pop_focus.",
    parameters: Type.Object({
      task_ids: Type.Array(Type.String(), { minItems: 1, description: "The (existing) ids of the tasks to focus on — at least 1; the first becomes the aim/CURR." }),
      reason: Type.Optional(Type.String({ description: "Why you enter focus (annotated in the enter decision)." })),
    }),
    async execute(_t: string, p: any) {
      try {
        // gathering.mode=require (msg 531): se ci sono ≥ minTasksForForce task open, il focus è BLOCCATO finché il
        // modello non ha consultato get_execution_order (marker _gather_token). Anti-cecità senza cerimonia: una
        // gather → un focus (token consumato sotto + azzerato a inizio sessione). Predicato node-pure testabile.
        const g = HARNESS_CFG.gathering;
        if (requireGateBlocks(vq, g)) {
          return {
            content: [{ type: "text", text: "enter_focus blocked (gathering.mode=require): first call get_execution_order to assess the backlog's ready/order/priority, then re-enter focus." }],
            details: { ok: false },
          };
        }
        const parentScopeId = vq.getActiveScope();
        const r = enterFocus(vq, { taskSubset: p.task_ids ?? [], parentScopeId }, HARNESS_CFG.trigger); // maxDepth configurabile
        if (g.mode === "require") vq.setMeta("_gather_token", ""); // consuma il token: il prossimo focus richiede una nuova gather
        return {
          content: [{ type: "text", text: JSON.stringify({ scope_id: r.scopeId, depth: r.depth, focus: p.task_ids }) }],
          details: { ok: true },
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `enter_focus rejected: ${e?.message ?? e}` }], details: { ok: false } };
      }
    },
  });

  pi.registerTool({
    name: "pop_focus",
    label: "Pop the current focus scope (matrioska)",
    description:
      "Close the current focus scope (pop): writes a full REPORT to a file and bubbles up only {short summary, report_path} (never an inline dump), promotes the outcome as the parent's decision, and RE-ALIGNS the parent to the current state (restores the aim if still open). Without scope_id it closes the deepest open scope.",
    parameters: Type.Object({
      scope_id: Type.Optional(Type.String({ description: "Scope to close (default: the deepest open one)." })),
    }),
    async execute(_t: string, p: any) {
      const stack = getFocusStack(vq);
      const scopeId = p.scope_id ?? (stack.length ? stack[stack.length - 1].scope_id : null);
      if (!scopeId) return { content: [{ type: "text", text: "pop_focus: no open scope" }], details: { ok: false } };
      try {
        const r = popFocus(vq, scopeId, { reportDir: REPORT_DIR });
        return {
          content: [{ type: "text", text: JSON.stringify({ summary: r.summary, report_path: r.report_path, restored_aim: r.restoredCurr }) }],
          details: { ok: true },
        };
      } catch (e: any) {
        return { content: [{ type: "text", text: `pop_focus error: ${e?.message ?? e}` }], details: { ok: false } };
      }
    },
  });

  pi.registerTool({
    name: "focus_status",
    label: "Show the focus stack + context pressure",
    description: "Show the stack of open focus scopes (depth) and the current context pressure (none/reorder/matrioska) to decide whether to enter focus.",
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

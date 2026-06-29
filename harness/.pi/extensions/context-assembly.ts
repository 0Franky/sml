/**
 * context-assembly — Fase 1 (datastore-backed).
 *
 * Inietta un blocco <context> strutturato — assemblato dalle lane del vars-queue
 * (rules/current_aim/task_list/verify_queue/vars/recent_changes) — nel system prompt
 * via hook `before_agent_start`. Sostituisce il placeholder statico della Fase 0.
 *
 * Lo stato vive in `.pi/state/vars.db` (SQLite via node:sqlite) → sopravvive al compact
 * (cross-session) ed è condiviso con l'extension `vars-queue.ts` (stesso file DB).
 * Design: ../../wiki/concepts/wrapper-context-assembly-example.md + agent-wrapper-vars-queue.md.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { assembleContext, buildResumeDigest } from "../../src/context-assembler.mjs";
import { getFocusStack, buildNestedWorkspace, evaluateTrigger } from "../../src/nested-compact.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = ".pi/state/vars.db";

function getStore(): VarsQueue {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const vq = new VarsQueue(DB_PATH, { agent: "orchestrator" });
  // Seed delle RULES always-context (idempotente: addRule fa upsert per id).
  if (vq.listRules().length === 0) {
    vq.addRule(
      "structured-thinking",
      "Pensiero STRUTTURATO (tabelle di check, marker [V]/[A]/[?]); la risposta all'utente è prosa normale.",
      { severity: "soft" },
    );
    vq.addRule(
      "pre-flight-destructive",
      "Azioni distruttive: pre-flight check (reversibile? dipendenze? backup?), HALT se irreversibile.",
      { severity: "hard" },
    );
    vq.addRule("no-secret-exfil", "Mai esfiltrare segreti o contenuti sensibili.", { severity: "hard" });
  }
  return vq;
}

export default function (pi: ExtensionAPI) {
  const vq = getStore();
  // UNICO injector del workspace (no chaining ambiguo): è anche matrioska-aware.
  pi.on("before_agent_start", (event, ctx) => {
    const usage = ctx?.getContextUsage?.();
    const tokens = usage?.tokens ?? null;
    const contextWindow = usage?.contextWindow ?? null;

    const stack = getFocusStack(vq);
    let workspace: string;
    if (stack.length > 0) {
      // Uno scope è aperto → workspace NESTED: <frame> (zoom-OUT durevole) + <context> FILTRATO al subset a fuoco.
      const top = stack[stack.length - 1];
      workspace = buildNestedWorkspace(vq, { focusScopeId: top.scope_id });
    } else {
      // Nessuno scope → workspace normale. buildResumeDigest si auto-gate sul tempo (<resuming_from> solo dopo un gap).
      const resume = buildResumeDigest(vq);
      const base = assembleContext(vq);
      // <focus_hint>: se la pressione (token-budget reale + #item-in-watch) raccomanda matrioska e nessuno scope è
      // aperto, suggerisci enter_focus (auto-suggest = floor-S graceful; la decisione resta del modello).
      const trig = evaluateTrigger(vq, { tokens, contextWindow });
      const hint =
        trig.recommend === "matrioska"
          ? `\n<focus_hint watch="${trig.metrics.watchCount}"${trig.metrics.percent != null ? ` ctx="${Math.round(trig.metrics.percent * 100)}%"` : ""}>Contesto in pressione: valuta enter_focus su un sotto-insieme di task per lavorare a fuoco (pop_focus al termine).</focus_hint>`
          : "";
      workspace = (resume ? `${resume}\n` : "") + base + hint;
    }
    return { systemPrompt: `${event.systemPrompt}\n\n${workspace}` };
  });
}

/**
 * task-digest-capture — CATTURA DETERMINISTICA della task-history (F24/F25, wiki/architecture/lane-persistence-redesign.md).
 *
 * PROBLEMA (F23/F24/F25): la memoria-lane dipende dal note() del modello, che NON salva la task-history (F23), deflette
 * (F24), o viene dirottato dalla direttiva-eviction (F25). Fix: su ogni SCRITTURA-FILE osservata, l'harness estrae
 * "file → def NOME" dalla traccia-tool (che ha GIÀ visto) e lo scrive come FATTO pinned (importance MAX) nella lane
 * <facts> — indipendente dal salvataggio/deflessione del modello. Riusa la ritenzione-per-importance esistente
 * (context-assembler: importance desc → pinned). La logica di estrazione è PURA e testata (src/task-digest.mjs, 21/0);
 * qui è un wire sottile. READ-ONLY sul flusso. Fail-safe: ogni errore ingoiato (la diagnostica non rompe l'esecuzione).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getVarsQueue } from "../../src/state-db.mjs";
import { digestFactFromCall } from "../../src/task-digest.mjs";

export default function (pi: ExtensionAPI) {
  // Gate config-driven (default OFF, come eviction-checkpoint): esperimenti controllati (baseline lanes-only vs
  // lanes+digest) senza contaminazione. Attiva con HARNESS_TASK_DIGEST=on. Diventerà default-on dopo la validazione.
  if (String(process.env.HARNESS_TASK_DIGEST ?? "off").toLowerCase() !== "on") return;
  const api = pi as any;
  // tool_execution_start porta toolName + args (path/content della scrittura). Scriviamo il digest qui (l'esito-errore
  // è raro per una write; v1 cattura l'intento). Key stabile per-file → un rewrite aggiorna la stessa entry.
  api.on?.("tool_execution_start", (event: any) => {
    try {
      const fact = digestFactFromCall({ name: event?.toolName, args: event?.args });
      if (!fact) return;
      getVarsQueue().setVar(`fact:${fact.key}`, { text: fact.text, importance: fact.importance }, { namespace: "fact", scope: "private", who: "harness-auto" });
    } catch { /* mai rompere l'esecuzione */ }
  });
}

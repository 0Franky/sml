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
  pi.on("before_agent_start", (event) => {
    // Prepende il workspace (resume? + <context>) assemblato dalle lane del datastore al system prompt di pi.
    // buildResumeDigest si auto-gate sul tempo: emette <resuming_from> SOLO se si riprende dopo un gap
    // (nuova sessione / lunga inattività), altrimenti "" (fix gap "where we left off", dogfood Sonnet 2026-06-29).
    const resume = buildResumeDigest(vq);
    const ctx = assembleContext(vq);
    const workspace = resume ? `${resume}\n${ctx}` : ctx;
    return { systemPrompt: `${event.systemPrompt}\n\n${workspace}` };
  });
}

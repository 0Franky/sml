/**
 * pre-flight — Fase 0.4 (walking skeleton)
 *
 * Gate su `tool_call`: BLOCCA azioni distruttive prima dell'esecuzione (rm -rf,
 * git reset --hard, mkfs, dd, ...). Analogo deterministico (F-harness) della foglia
 * area-02 "criticality" addestrata nei pesi (S).
 *
 * API reale: on("tool_call", (e: ToolCallEvent) => ({ block?, reason? })).
 *   e.input è comune a tutti i membri dell'unione (per `bash`: { command: string }).
 * Fase 1: HALT + ask all'utente (gate automod) invece del blocco secco.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
// Logica node-pura estratta → testabile senza pi (test/unit/pre-flight-gate.test.mjs).
import { checkDestructive, blockReason } from "../../src/pre-flight-gate.mjs";

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", (event) => {
    // event.input esiste su tutti i membri di ToolCallEvent; per 'bash' ha `command`.
    const input = event.input as { command?: unknown };
    const cmd = typeof input.command === "string" ? input.command : "";
    const hit = checkDestructive(cmd);
    if (!hit) return; // consenti (tool non-shell, senza comando, o non distruttivo)
    return { block: true, reason: blockReason(hit) };
  });
}

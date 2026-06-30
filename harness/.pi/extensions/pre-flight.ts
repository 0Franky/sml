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

const DESTRUCTIVE: RegExp[] = [
  /\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/, // rm -rf / -fr
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\s+-[a-z]*f/,
  /\bmkfs\b/,
  /\bdd\s+if=/,
  />\s*\/dev\/sd[a-z]/,
];

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", (event) => {
    // event.input esiste su tutti i membri di ToolCallEvent; per 'bash' ha `command`.
    const input = event.input as { command?: unknown };
    const cmd = typeof input.command === "string" ? input.command : "";
    if (!cmd) return; // tool non-shell o senza comando → non gestito
    const danger = DESTRUCTIVE.find((re) => re.test(cmd));
    if (!danger) return; // consenti
    return {
      block: true,
      reason:
        `pre-flight: potentially destructive command blocked (match ${danger}). ` +
        "Explicit confirmation required. (Phase 1: HALT + ask the user, automod gate.)",
    };
  });
}

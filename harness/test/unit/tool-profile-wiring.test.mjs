/**
 * Wiring-test (rule #14): la CATENA REALE config → computeDefaultActive che l'estensione `tool-gating.ts` esegue.
 * Un unit su `computeDefaultActive` da solo è falsa sicurezza: il bug potrebbe vivere nel passaggio config→profilo
 * (env/file NON letto, campo non propagato), non nella funzione pura. Qui si riproduce esattamente ciò che fa il .ts:
 *
 *   const CFG = loadHarnessConfig();
 *   computeDefaultActive(allRegistered, { profile: CFG.toolProfile, custom: CFG.toolGatingCustom })
 *
 * Il pezzo INTERNO a pi (set-attivo → array `tools` della richiesta HTTP) è verificato per lettura del sorgente
 * (dist/core/agent-session.js): `:560` setActiveToolsByName **sostituisce** `agent.state.tools`; `:527`
 * getActiveToolNames legge di lì; `:1783` `api.setActiveTools = setActiveToolsByName`. → il set-attivo È ciò che
 * finisce nella richiesta. La verifica HTTP-reale (conteggio schemi nel body) si fa LIVE via run-session `toolsSent`
 * al primo run del discriminante (ground-truth ispezionato, rule #15).
 */
import { loadHarnessConfig } from "../../src/harness-config.mjs";
import { computeDefaultActive } from "../../src/tool-gating.mjs";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("  ✗ " + m); } };

// Inventario REALISTICO dei tool registrati (un campione per categoria + coda lunga deferita).
const REGISTERED = [
  "bash", "read", "write", "edit", "ls", "grep", "find", "str_replace", "create", "multiedit",
  "note", "jot", "recall_scratch", "set_var", "get_var",
  "list_secrets", "request_sink", "preview_secret_use", "propose_secret_edit", "check_secret_refs",
  "propose_secret_create", "load_secrets_from_env", "http_request", "propose_secret_destroy", "add_secret",
  "list_tasks", "add_task", "set_task_status", "set_curr",
  "enter_focus", "pop_focus", "focus_status", "set_keepturns", "get_conversation", "view_tool_calls",
  "find_tool", "open_category", "list_tool_categories",
  "sliding_var_read", "remember_lesson", "record_decision", "send_message", "run_verifier",
];

const tmp = mkdtempSync(join(tmpdir(), "profile-wiring-"));
const cfgFile = join(tmp, "harness.config.json");
const noFile = join(tmp, "does-not-exist.json");

/** Esegue la catena come tool-gating.ts: config (gated + profilo) → set-attivo sui tool registrati. */
function activeFor(env, file = noFile) {
  const cfg = loadHarnessConfig(file, { env });
  return computeDefaultActive(REGISTERED, { profile: cfg.toolProfile, custom: cfg.toolGatingCustom });
}

// default (nessun env/file) → standard = ESSENTIAL ∩ registrati (comportamento storico invariato)
{
  const a = activeFor({});
  ok(a.includes("list_secrets") && a.includes("get_conversation") && a.includes("set_keepturns"), "wiring: default(config) = standard, flusso completo attivo");
  ok(!a.includes("sliding_var_read") && !a.includes("remember_lesson"), "wiring: default nasconde la coda lunga");
}
// env core → set ridotto, niente meta (floor / free-tier)
{
  const a = activeFor({ HARNESS_TOOL_GATING: "gated", HARNESS_TOOL_PROFILE: "core" });
  ok(a.length <= 8, `wiring: env core → set ridotto (${a.length} ≤ 8)`);
  ok(a.includes("bash") && a.includes("note"), "wiring: core ha core-pi + note");
  ok(!a.includes("find_tool") && !a.includes("list_secrets"), "wiring: core NON ha meta né secret (floor)");
}
// env minimal → meta presenti (riscoperta), coda nascosta (discriminante)
{
  const a = activeFor({ HARNESS_TOOL_PROFILE: "minimal" });
  ok(a.includes("find_tool") && a.includes("open_category"), "wiring: minimal ha le meta (riscoperta = discriminante)");
  ok(!a.includes("list_secrets") && !a.includes("run_verifier"), "wiring: minimal nasconde secret/verifier (riscopribili via meta)");
}
// dimensione crescente core < minimal < standard < full + taglio >50% (il punto del fix free-tier)
{
  const core = activeFor({ HARNESS_TOOL_PROFILE: "core" }).length;
  const minimal = activeFor({ HARNESS_TOOL_PROFILE: "minimal" }).length;
  const standard = activeFor({ HARNESS_TOOL_PROFILE: "standard" }).length;
  const full = activeFor({ HARNESS_TOOL_PROFILE: "full" }).length;
  ok(core < minimal && minimal < standard && standard < full, `wiring: core(${core}) < minimal(${minimal}) < standard(${standard}) < full(${full})`);
  ok(full === REGISTERED.length, "wiring: full = tutti i registrati");
  ok(core / standard < 0.5, `wiring: core taglia >50% dei tool vs standard (${core}/${standard}) → richiesta sotto il cap free-tier`);
}
// env vince sul file (come tutti gli altri campi config)
{
  writeFileSync(cfgFile, JSON.stringify({ toolProfile: "standard" }));
  const a = activeFor({ HARNESS_TOOL_PROFILE: "core" }, cfgFile);
  ok(a.length <= 8, "wiring: env HARNESS_TOOL_PROFILE=core vince sul file standard");
}
// file custom → solo la lista fornita ∩ registrati (nomi inesistenti scartati)
{
  writeFileSync(cfgFile, JSON.stringify({ toolProfile: "custom", toolGatingCustom: ["bash", "run_verifier", "ghost"] }));
  const a = activeFor({}, cfgFile);
  ok(a.length === 2 && a.includes("bash") && a.includes("run_verifier") && !a.includes("ghost"), "wiring: custom da file = lista ∩ registrati (ghost scartato)");
}

console.log(`\ntool-profile-wiring: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);

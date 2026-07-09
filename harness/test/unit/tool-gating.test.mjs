/**
 * tool-gating — unit test della logica di scoperta tool (utente msg 801/803/804).
 */
import { categorizeTool, searchTools, toolsInCategory, listCategories, computeDefaultActive, ESSENTIAL_TOOLS, classifyToolError, TOOL_PROFILES, PROFILE_CORE, profileToolNames } from "../../src/tool-gating.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

// inventario di prova (tool + una skill)
const ITEMS = [
  { name: "propose_secret_create", description: "Propose creating a NEW sealed secret; the user enters the value." },
  { name: "add_secret", description: "Register a session secret value to redact." },
  { name: "http_request", description: "Make an HTTP(S) request; preferred for using a secret toward an API." },
  { name: "list_tasks", description: "List all tasks with status." },
  { name: "enter_focus", description: "Enter a focused sub-context (nested compaction)." },
  { name: "bash", description: "Run a shell command." },
  { name: "reddit-poster", description: "Skill: post content to reddit via the API.", kind: "skill" },
];

// ── categorizeTool ──
ok(categorizeTool("propose_secret_create") === "secrets", "cat: propose_secret_create→secrets");
ok(categorizeTool("http_request") === "http", "cat: http_request→http");
ok(categorizeTool("list_tasks") === "tasks", "cat: list_tasks→tasks");
ok(categorizeTool("enter_focus") === "focus", "cat: enter_focus→focus");
ok(categorizeTool("bash") === "core", "cat: bash→core");
ok(categorizeTool("find_tool") === "meta", "cat: find_tool→meta");
ok(categorizeTool("nonesistente") === "other", "cat: sconosciuto→other");

// ── searchTools ──
{
  // "store a secret" è ambiguo tra i due tool-secret (pari keyword). La search li SURFACE entrambi; la scelta
  // giusta la garantiscono (i) il default-set che tiene propose_secret_create SEMPRE visibile e (ii) open_category.
  const r = searchTools(ITEMS, "store a secret");
  ok(r.some((x) => x.name === "propose_secret_create"), "search: 'store a secret' surface propose_secret_create");
  ok(r.some((x) => x.name === "add_secret"), "search: surface anche add_secret (ambiguo)");
  // una query intent-specifica invece lo disambigua col nome:
  ok(searchTools(ITEMS, "create new secret")[0].name === "propose_secret_create", "search: 'create new secret' → propose_secret_create #1");
}
{
  const r = searchTools(ITEMS, "http api request");
  ok(r[0].name === "http_request", "search: 'http api request' → http_request");
}
{
  const r = searchTools(ITEMS, "reddit");
  ok(r.some((x) => x.name === "reddit-poster" && x.category === "skills" && x.kind === "skill"), "search: skill indicizzata (msg 804)");
}
ok(searchTools(ITEMS, "").length === 0, "search: query vuota → []");
ok(searchTools(ITEMS, "secret", { limit: 1 }).length === 1, "search: limit rispettato");
{
  const r = searchTools(ITEMS, "zzzznomatch");
  ok(r.length === 0, "search: nessun match → []");
}

// ── toolsInCategory ──
{
  const sec = toolsInCategory(ITEMS, "secrets").map((x) => x.name);
  ok(sec.includes("propose_secret_create") && sec.includes("add_secret") && !sec.includes("http_request"), "cat-browse: secrets corretti");
  const sk = toolsInCategory(ITEMS, "skills");
  ok(sk.length === 1 && sk[0].name === "reddit-poster", "cat-browse: skills solo kind=skill");
  ok(toolsInCategory(ITEMS, "SECRETS").length === sec.length, "cat-browse: case-insensitive");
}

// ── listCategories ──
{
  const cats = listCategories(ITEMS);
  const map = Object.fromEntries(cats.map((c) => [c.category, c.count]));
  ok(map.secrets === 2, "listCat: 2 secrets");
  ok(map.http === 1 && map.tasks === 1 && map.focus === 1 && map.core === 1, "listCat: conteggi per categoria");
  ok(map.skills === 1, "listCat: skills contate");
}

// ── computeDefaultActive ──
{
  const all = ["bash", "read", "write", "propose_secret_create", "http_request", "list_tasks", "enter_focus", "pop_focus", "focus_status", "sliding_var_read", "remember_lesson", "find_tool", "open_category", "list_tool_categories"];
  const active = computeDefaultActive(all);
  ok(active.includes("bash") && active.includes("propose_secret_create") && active.includes("http_request"), "default: essenziali attivi");
  ok(active.includes("find_tool") && active.includes("open_category"), "default: meta-tool attive");
  ok(active.includes("enter_focus") && active.includes("pop_focus") && active.includes("focus_status"), "default: trio focus attivo (msg 807)");
  ok(!active.includes("sliding_var_read") && !active.includes("remember_lesson"), "default: coda-lunga NON attiva");
  ok(active.every((n) => all.includes(n)), "default: solo tool realmente registrati (no nomi inesistenti)");
  ok(ESSENTIAL_TOOLS.includes("propose_secret_create"), "default: propose_secret_create è essenziale (fix secret-Ask)");
}

// ── B3 widen-default: il flusso SECRET comune è sempre-attivo COMPLETO (2026-07-03, sessione 019f292b) ──
{
  for (const n of ["list_secrets", "request_sink", "preview_secret_use", "propose_secret_edit", "check_secret_refs"])
    ok(ESSENTIAL_TOOLS.includes(n), `widen: ${n} è essenziale (flusso secret non si rompe più)`);
  // i rari/distruttivi restano deferiti (coda lunga)
  for (const n of ["propose_secret_destroy", "add_secret", "request_secret", "request_local_http"])
    ok(!ESSENTIAL_TOOLS.includes(n), `widen: ${n} resta deferito (raro/distruttivo)`);
  // con i tool secret registrati, il default li attiva
  const all = ["bash", "list_secrets", "request_sink", "preview_secret_use", "propose_secret_edit", "check_secret_refs", "propose_secret_destroy", "find_tool"];
  const active = computeDefaultActive(all);
  ok(active.includes("list_secrets") && active.includes("request_sink") && active.includes("preview_secret_use"), "widen: default attiva il flusso secret comune");
  ok(!active.includes("propose_secret_destroy"), "widen: default NON attiva destroy (deferito)");
}

// ── get_conversation essenziale: la lane <messages_with_user> lo referenzia esplicitamente (sessione 019f292b) ──
{
  ok(ESSENTIAL_TOOLS.includes("get_conversation"), "widen: get_conversation è essenziale (la lane lo indica per i msg vecchi)");
  const active = computeDefaultActive(["bash", "get_conversation", "enter_focus"]);
  ok(active.includes("get_conversation"), "widen: default attiva get_conversation quando registrato");
}

// set_keepturns model-controlled (msg 1062): categorizzato + ESSENZIALE (E2E: se gated il 9B non lo raggiunge)
{
  ok(categorizeTool("set_keepturns") === "focus", "set_keepturns categorizzato in focus (non 'other')");
  ok(ESSENTIAL_TOOLS.includes("set_keepturns"), "set_keepturns è essenziale (chiamabile col nome reale, no discovery)");
  const active = computeDefaultActive(["bash", "set_keepturns"]);
  ok(active.includes("set_keepturns"), "default attiva set_keepturns quando registrato");
}

// classifyToolError (recovery 'not found', utente msg 908): active→execution, hidden→reveal, hallucinated→unknown
{
  ok(classifyToolError("", [], []) === "execution", "classify: nome vuoto → execution");
  ok(classifyToolError("set_var", ["set_var"], ["set_var"]) === "execution", "classify: attivo → execution (errore reale)");
  ok(classifyToolError("request_secret", ["set_var"], ["set_var", "request_secret"]) === "reveal", "classify: registrato ma nascosto → reveal");
  ok(classifyToolError("ghost_tool", ["set_var"], ["set_var"]) === "unknown", "classify: nome allucinato → unknown");
}

// ── PROFILI del set-attivo (msg 1431/1433): asse ORTOGONALE ai modi. core/minimal/standard/full/custom ──
{
  const all = ["bash", "read", "write", "edit", "ls", "grep", "find", "str_replace", "create", "multiedit", "note", "jot",
    "list_secrets", "request_sink", "list_tasks", "set_var", "enter_focus", "pop_focus", "focus_status", "set_keepturns",
    "get_conversation", "find_tool", "open_category", "list_tool_categories", "sliding_var_read", "remember_lesson"];

  // retro-compat: nessun opts → standard = ESSENTIAL (comportamento storico invariato)
  const std = computeDefaultActive(all);
  const stdExplicit = computeDefaultActive(all, { profile: "standard" });
  ok(JSON.stringify(std) === JSON.stringify(stdExplicit), "profili: default (no opts) === standard esplicito (retro-compat)");
  ok(std.includes("list_secrets") && std.includes("get_conversation") && std.includes("set_keepturns"), "profili: standard = flusso completo (secret/get_conversation/set_keepturns)");

  // core (~8): SOLO core-pi + note, NIENTE meta → nessuna riscoperta (floor non-discriminante)
  const core = computeDefaultActive(all, { profile: "core" });
  ok(core.includes("bash") && core.includes("note"), "profili: core include core-pi + note");
  ok(!core.includes("find_tool") && !core.includes("open_category"), "profili: core NON ha meta-tool (no riscoperta = floor)");
  ok(!core.includes("list_secrets") && !core.includes("get_conversation"), "profili: core esclude il resto");
  ok(core.length === PROFILE_CORE.filter((n) => all.includes(n)).length, "profili: core = PROFILE_CORE ∩ presenti");

  // minimal (~15): core-pi completo + note/jot + META (riscoperta) → profilo DISCRIMINANTE
  const minimal = computeDefaultActive(all, { profile: "minimal" });
  ok(minimal.includes("find_tool") && minimal.includes("open_category"), "profili: minimal HA le meta (riscoperta → discriminante)");
  ok(minimal.includes("str_replace") && minimal.includes("jot"), "profili: minimal ha core-pi completo + jot");
  ok(!minimal.includes("list_secrets") && !minimal.includes("get_conversation"), "profili: minimal nasconde la coda (riscopribile via meta)");
  ok(core.length < minimal.length && minimal.length < std.length, "profili: core < minimal < standard (dimensione crescente)");

  // full: tutti i presenti (nessun set curato)
  const full = computeDefaultActive(all, { profile: "full" });
  ok(full.length === all.length && all.every((n) => full.includes(n)), "profili: full = tutti i presenti");
  ok(full.includes("sliding_var_read") && full.includes("remember_lesson"), "profili: full include anche la coda lunga");

  // custom: lista esplicita ∩ presenti; nomi inesistenti scartati (difensivo)
  const custom = computeDefaultActive(all, { profile: "custom", custom: ["bash", "jot", "ghost_inesistente"] });
  ok(custom.includes("bash") && custom.includes("jot"), "profili: custom attiva la lista fornita");
  ok(!custom.includes("ghost_inesistente"), "profili: custom scarta nomi non registrati");
  ok(custom.length === 2, "profili: custom = solo i nomi presenti");
  ok(computeDefaultActive(all, { profile: "custom" }).length === 0, "profili: custom senza lista → vuoto");

  // profilo ignoto → fail-safe standard (mai rompere)
  ok(JSON.stringify(computeDefaultActive(all, { profile: "zzz" })) === JSON.stringify(std), "profili: profilo ignoto → fail-safe standard");

  // enum + profileToolNames (SSOT: standard è ESSENTIAL_TOOLS per RIFERIMENTO, non una copia)
  ok(TOOL_PROFILES.length === 5 && TOOL_PROFILES.includes("core") && TOOL_PROFILES.includes("custom"), "profili: enum TOOL_PROFILES completo (5)");
  ok(profileToolNames("full") === null, "profili: profileToolNames('full') = null (sentinel tutti)");
  ok(profileToolNames("standard") === ESSENTIAL_TOOLS, "profili: profileToolNames('standard') === ESSENTIAL_TOOLS (SSOT, no copia)");
}

console.log(`\ntool-gating: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);

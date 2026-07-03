/**
 * tool-gating — unit test della logica di scoperta tool (utente msg 801/803/804).
 */
import { categorizeTool, searchTools, toolsInCategory, listCategories, computeDefaultActive, ESSENTIAL_TOOLS } from "../../src/tool-gating.mjs";

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

console.log(`\ntool-gating: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);

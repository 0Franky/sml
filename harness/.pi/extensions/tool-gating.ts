/**
 * tool-gating — scoperta dei tool per modelli piccoli (utente msg 801/803/804). Un 9B annega se vede ~50 tool insieme
 * e non si instrada (causa-radice del bug secret-Ask). Qui si dà il pattern deferred-tool di Claude Code, NATIVO in pi
 * via `getAllTools`/`getActiveTools`/`setActiveTools`/`refreshTools` (+ `getCommands` per le SKILL, msg 804):
 *   - find_tool(query)        → cerca tra TUTTI i tool E le skill per intento e ATTIVA i match (per chiamarli al giro dopo).
 *   - open_category(category) → rivela TUTTI i tool/skill di una categoria (browse completo/deterministico).
 *   - list_tool_categories()  → elenca le categorie + conteggi.
 * Due meccanismi COMPLEMENTARI (search flessibile + categoria completa) tenuti entrambi (scelta utente).
 *
 * MODI (env HARNESS_TOOL_GATING): `off` (default, nessun effetto) · `discover` (le 3 meta-tool esistono, NIENTE viene
 * nascosto — additivo/sicuro) · `gated` (set-attivo CURATO a inizio sessione → nasconde la coda lunga; il modello la
 * riscopre con find_tool/open_category). Default `off`: si abilita deliberatamente dopo tuning col 9B reale.
 * Fix B (steering 9B): promptGuidelines delle meta-tool = istruzione dedicata nel system prompt ("se non vedi un tool
 * che ti serve, cercalo — non improvvisare"). Contesto compatto → il 9B dovrebbe seguirla (utente msg 803).
 *
 * Logica pura/testata: ../../src/tool-gating.mjs (unit: tool-gating.test.mjs).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { searchTools, toolsInCategory, listCategories, computeDefaultActive, CATEGORY_TOOLS } from "../../src/tool-gating.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";

// off | discover | gated. Da harness-config (default `gated`, regime SLM): file `.pi/harness.config.json` o env
// HARNESS_TOOL_GATING. Meccanismo AFFIDABILE (readFileSync), non dipende dal caricamento di `.env` (che pi non fa).
const MODE = String((loadHarnessConfig() as any).toolGating ?? "gated").toLowerCase();

export default function (pi: ExtensionAPI) {
  if (MODE === "off") return; // opt-in: zero effetto finché non abilitato

  const api = pi as any;
  /** Inventario {name, description, kind}: tool registrati + skill/slash-command (msg 804). Difensivo se un'API manca. */
  function inventory() {
    const tools = (api.getAllTools?.() ?? []).map((t: any) => ({ name: t?.name, description: t?.description ?? "", kind: "tool" }));
    const skills = (api.getCommands?.() ?? []).map((c: any) => ({ name: c?.name ?? c?.command ?? "", description: c?.description ?? "", kind: "skill" }));
    return [...tools, ...skills].filter((i: any) => i.name);
  }
  // B2 STICKY-REVEAL (2026-07-03, scelta utente msg 892/896). Bug osservato nella sessione live 019f292b: un tool
  // ATTIVATO da find_tool/open_category tornava "not found" al giro dopo → il 9B andava in LOOP. Causa: pi ricostruisce
  // turnState.activeTools per-round da this.activeToolNames (agent-harness.createTurnState:260) e la reveal mid-turn
  // può perdersi (setActiveTools è async ma a livello extension è tipata `void` → NON await-abile → race). NB: il
  // "pre-check hook" per attivare al volo è IMPOSSIBILE — agent-loop.js:361 risolve `context.tools.find(name)` e
  // ritorna "not found" (riga 365) PRIMA del tool_call hook (riga 372). Unico rimedio: tenere memoria di ciò che è
  // stato rivelato e RI-APPLICARE `default ∪ revealed` prima di ogni agent-start (cross-turn) e di ogni round
  // (within-loop). Così ciò che è stato rivelato RESTA chiamabile per tutta la sessione.
  const revealed = new Set<string>();

  /** Set-attivo desiderato = default (essenziali presenti) ∪ revealed presenti. Intersezione difensiva con i registrati. */
  function desiredActive(): string[] {
    const all = (api.getAllTools?.() ?? []).map((t: any) => t?.name).filter(Boolean);
    const present = new Set<string>(all);
    const out = new Set<string>(computeDefaultActive(all));
    for (const n of revealed) if (present.has(n)) out.add(n);
    return [...out];
  }

  /** Ri-applica il set desiderato SOLO se differisce dall'attivo (evita active_tools_change ridondanti per-round). */
  function applyActive() {
    if (typeof api.setActiveTools !== "function") return;
    const want = desiredActive();
    const curSet = new Set<string>(api.getActiveTools?.() ?? []);
    const same = want.length === curSet.size && want.every((n) => curSet.has(n));
    if (!same) { api.setActiveTools(want); api.refreshTools?.(); }
  }

  /** Registra i tool come "rivelati" (persistono per la sessione) e li rende attivi subito. Ritorna i NUOVI rivelati. */
  function reveal(names: string[]) {
    const added: string[] = [];
    for (const n of names) if (n && !revealed.has(n)) { revealed.add(n); added.push(n); }
    if (MODE === "gated") applyActive();
    return added;
  }

  // gated: applica il set curato (default ∪ revealed) a inizio sessione, prima di OGNI agent-start (cross-turn) e di
  // OGNI round (within-loop). session_start fire dopo il load di TUTTE le estensioni → getAllTools() è completo.
  // In `discover` NON si tocca il set-attivo (tutto resta attivo/chiamabile). Le meta-tool sono in ESSENTIAL.
  if (MODE === "gated") {
    pi.on("session_start", () => applyActive());
    pi.on("before_agent_start", () => applyActive());
    pi.on("turn_start", () => applyActive());
  }
  // B4 (audit 2026-07-04): azzera i "rivelati" a fine sessione → in un processo riusato per più sessioni (driver
  // headless in loop, SDK multi-sessione) i tool rivelati nella sessione 1 NON restano attivi nella 2 (leak del gating).
  pi.on("session_shutdown", () => revealed.clear());

  pi.registerTool({
    name: "find_tool",
    label: "Find a tool or skill by intent",
    description:
      "Search ALL tools and skills by intent/keyword — many are hidden to keep your tool list short and focused. " +
      "Returns the best matches AND activates them so you can call them on the next step. Use this whenever you need " +
      "to do something but don't see a tool for it (e.g. 'rotate a secret', 'remember a lesson', 'send a message').",
    promptSnippet: "find_tool(query) — search hidden tools/skills by intent and activate the matches.",
    promptGuidelines: [
      "Your tool list is intentionally SHORT. If you need to do something and don't see a tool for it, call find_tool(query) (search by intent) or open_category(category) to reveal more tools AND skills, then call the revealed tool. Do NOT improvise an unsafe workaround or claim a capability is unavailable — search first.",
      "If you called a tool and got 'not found' (or you're unsure a tool name is exact), that tool does NOT exist — do NOT invent or guess another name. Call find_tool('what you want to do') and use a name it returns.",
    ],
    parameters: Type.Object({ query: Type.String({ minLength: 1, description: "What you want to do, in a few words (e.g. 'store an api key', 'run a verifier', 'rotate a token')." }) }),
    async execute(_t: string, p: any) {
      const hits = searchTools(inventory(), String(p.query ?? ""), { limit: 8 });
      const added = reveal(hits.filter((h) => h.kind !== "skill").map((h) => h.name));
      const lines = hits.map((h) => `- ${h.name} [${h.category}${h.kind === "skill" ? "/skill" : ""}]: ${h.description}`).join("\n");
      const text = hits.length
        ? `Found ${hits.length} match(es)${added.length ? ` — activated: ${added.join(", ")}` : ""}:\n${lines}\n\nCall the tool you need now (skills: invoke as a skill).`
        : `No tool/skill matched '${p.query}'. Try list_tool_categories() then open_category(name).`;
      return { content: [{ type: "text", text }], details: { ok: true, count: hits.length, activated: added } };
    },
  });

  pi.registerTool({
    name: "open_category",
    label: "List and activate all tools in a category",
    description:
      "Show ALL tools/skills in a category and ACTIVATE them — the complete menu of a domain, so you never miss a tool. " +
      "Categories: " + [...Object.keys(CATEGORY_TOOLS), "skills"].join(", ") + ".",
    promptSnippet: "open_category(category) — reveal every tool in a category (e.g. 'secrets').",
    parameters: Type.Object({ category: Type.String({ minLength: 1, description: "Category name, e.g. 'secrets', 'tasks', 'http', 'vars', 'skills'." }) }),
    async execute(_t: string, p: any) {
      const items = toolsInCategory(inventory(), String(p.category ?? ""));
      const added = reveal(items.filter((i) => i.kind !== "skill").map((i) => i.name));
      const lines = items.map((i) => `- ${i.name}${i.kind === "skill" ? " (skill)" : ""}: ${i.description}`).join("\n");
      const text = items.length
        ? `Category '${p.category}' (${items.length})${added.length ? ` — activated: ${added.join(", ")}` : ""}:\n${lines}`
        : `No tools/skills in category '${p.category}'. Call list_tool_categories() for valid categories.`;
      return { content: [{ type: "text", text }], details: { ok: true, count: items.length, activated: added } };
    },
  });

  pi.registerTool({
    name: "list_tool_categories",
    label: "List tool/skill categories",
    description: "List the tool/skill categories and how many each has. Use it first when you don't know which category a capability is in, then open_category or find_tool.",
    promptSnippet: "list_tool_categories() — see the categories of tools/skills available.",
    parameters: Type.Object({}),
    async execute() {
      const cats = listCategories(inventory());
      const text = `Tool/skill categories:\n${cats.map((c) => `- ${c.category} (${c.count})`).join("\n")}\n\nUse open_category(name) to reveal a category, or find_tool(query) to search by intent.`;
      return { content: [{ type: "text", text }], details: { ok: true, categories: cats } };
    },
  });
}

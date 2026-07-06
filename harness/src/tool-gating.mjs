/**
 * tool-gating — logica PURA per la scoperta dei tool (utente msg 801/803/804): un modello piccolo (9B) annega se vede
 * ~50 tool tutti insieme e non si instrada (causa-radice del bug secret-Ask). Qui: categorizzazione + ricerca per
 * intento + calcolo del set-attivo di default. L'estensione `tool-gating.ts` collega questa logica a pi
 * (getAllTools/getActiveTools/setActiveTools/getCommands) — è il pattern deferred-tool di Claude Code, nativo via pi.
 *
 * Due meccanismi COMPLEMENTARI (utente): SEARCH (per intento, flessibile) + CATEGORIA (browse, completo/deterministico).
 * Include anche le SKILL (msg 804): la ricerca indicizza tool E skill.
 *
 * PURO: nessun import di pi; opera su liste {name, description, category?} passate dall'estensione. Testabile.
 */

/** Mappa esplicita tool→categoria. Fonte di verità della tassonomia (allineata all'inventario 2026-07-03). */
export const CATEGORY_TOOLS = {
  secrets: ["list_secrets", "request_secret", "request_local_http", "request_sink", "propose_secret_edit", "propose_secret_destroy", "propose_secret_create", "check_secret_refs", "preview_secret_use", "add_secret", "load_secrets_from_env"],
  http: ["http_request"],
  tasks: ["set_task_status", "add_task", "set_task_deps", "get_execution_order", "set_curr", "list_tasks"],
  vars: ["set_var", "get_var", "note", "remove_note", "jot", "recall_scratch", "clear_scratch", "propose_var", "merge_proposals", "extract_var", "render_template", "sliding_var_read", "sliding_var_replace", "get_shared_view", "get_changelog"],
  focus: ["enter_focus", "pop_focus", "focus_status", "checkpoint", "get_conversation", "set_keepturns", "view_tool_calls"],
  reasoning: ["remember_lesson", "recall_lessons", "record_assumptions", "check_facts", "record_decision", "get_decisions_by_agent"],
  messaging: ["send_message", "inbox", "mark_read"],
  verify: ["run_verifier"],
  diagnostics: ["trace_status"],
  core: ["bash", "read", "write", "edit", "grep", "find", "ls", "str_replace", "create", "multiedit"],
  meta: ["find_tool", "open_category", "list_tool_categories"],
};

/** Set-ESSENZIALE sempre attivo (anche senza scoperta): core pi + i tool harness dei FLUSSI COMUNI + le meta-tool.
 * Un 9B qui ha già di che operare; la CODA LUNGA (request_secret, error-memo, messaging, sliding-var, reasoning, …) è
 * deferita e si rivela con find_tool/open_category. Il set reale è l'INTERSEZIONE con i tool davvero registrati.
 * B3 widen-default (2026-07-03, scelta utente msg 892/896): il flusso SECRET utente-facing è sempre-attivo COMPLETO —
 * la sessione live 019f292b ha mostrato il 9B in loop "not found" proprio su list_secrets/request_sink/preview/edit
 * (gated → si rompeva il flusso). Restano deferiti solo i rari/distruttivi. ~30 tool: sotto la soglia-annegamento (~50)
 * ma copre i flussi che il modello usa davvero → raramente deve rivelare. Vedi tool-gating.ts (sticky-reveal, B2). */
export const ESSENTIAL_TOOLS = [
  "bash", "read", "write", "edit", "grep", "find", "ls", "str_replace", "create", "multiedit", // core pi
  // secrets: flusso comune COMPLETO (B3) — provisioning + stato + grant-sink + preview + edit + check.
  // load_secrets_from_env = provisioning deterministico da file (msg 811). Deferiti: destroy/add_secret/request_secret/request_local_http.
  "propose_secret_create", "load_secrets_from_env", "http_request",
  "list_secrets", "request_sink", "preview_secret_use", "propose_secret_edit", "check_secret_refs",
  "list_tasks", "add_task", "set_task_status", "set_curr", // task basics
  "set_var", "get_var", "note", "jot", "recall_scratch", // vars basics + note (durable fact) + jot/recall_scratch (volatile scratch CORE, msg 1141): lo scaffolding <how_memory_works> ISTRUISCE
  // ESPLICITAMENTE "note(...)" per salvare prima dello scroll → se gated il modello va in not-found (STESSA classe di
  // set_keepturns, trovata dal wiring-test tool-reachability). Essenziale = chiamabile subito col nome reale. remove_note
  // resta deferito (categoria vars, raro/distruttivo — scopribile con find_tool/open_category).
  "enter_focus", "pop_focus", "focus_status", // focus/matrioska (utente msg 807: enter_focus essenziale; il TRIO
  // insieme, altrimenti il modello entra in focus e non può uscirne — pop_focus/focus_status stranded)
  "set_keepturns", // keepTurns model-controlled (msg 1062): primitivo di auto-gestione del contesto. ESSENZIALE per lo
  // stesso razionale anti-"not-found-loop": se gated, il modello che vuole allocarsi memoria non lo raggiunge (E2E:
  // il 9B fumblava `other:set_keepturns` su un tool nascosto → mai eseguito). Sempre-attivo = chiamabile col nome reale.
  "get_conversation", // sessione 019f292b: la lane <messages_with_user> istruisce ESPLICITAMENTE "use get_conversation
  // range=..." per i messaggi più vecchi → dev'essere ATTIVO, altrimenti il modello che obbedisce prende "not found"
  // (il hint puntava a un tool gated). Read-only, safe. Risponde a "mostrami tutti i miei messaggi".
  "view_tool_calls", // pull della coda tool-call fuori-finestra (#3 msg 1258, curriculum scaffold-fade msg 1267). Stesso
  // razionale get_conversation/set_keepturns: se la lane hint-a il pull, il tool dev'essere raggiungibile per nome
  // (anti not-found-loop). Read-only. NB: registrato GATED (context-views.ts, HARNESS_CONTEXT_VIEWS=on) → attivo solo
  // quando il gate è on (computeDefaultActive interseca coi tool davvero registrati: gate-off → assente, innocuo).
  "find_tool", "open_category", "list_tool_categories", // meta (scoperta)
];

const _reverse = (() => {
  const m = new Map();
  for (const [cat, names] of Object.entries(CATEGORY_TOOLS)) for (const n of names) m.set(n, cat);
  return m;
})();

/** Categoria di un tool (per nome). Sconosciuto → "other". */
export function categorizeTool(name) {
  return _reverse.get(String(name)) || "other";
}

/** Tokenizza una query/testo in termini minuscoli ≥2 char (dedup). */
function tokens(s) {
  return [...new Set(String(s || "").toLowerCase().match(/[a-z0-9]{2,}/g) || [])];
}

/**
 * Cerca tra `items` (tool E skill: {name, description, kind?}) per intento/keyword.
 * Scoring: match nel NOME pesano più della descrizione; match esatto/prefisso del nome bonus. Ritorna i migliori
 * sopra soglia, ordinati per score decrescente, con la categoria annotata.
 * @param {{name:string, description?:string, kind?:string}[]} items
 * @param {string} query
 * @param {{limit?:number}} [opts]
 * @returns {{name:string, description:string, category:string, kind:string, score:number}[]}
 */
export function searchTools(items, query, opts = {}) {
  const limit = Number.isFinite(opts.limit) ? opts.limit : 8;
  const qt = tokens(query);
  if (!qt.length || !Array.isArray(items)) return [];
  const scored = [];
  for (const it of items) {
    if (!it || !it.name) continue;
    const name = String(it.name).toLowerCase();
    const desc = String(it.description || "").toLowerCase();
    const nameTokens = tokens(name.replace(/_/g, " "));
    let score = 0;
    for (const t of qt) {
      if (name === t) score += 12;               // match esatto del nome
      else if (name.includes(t)) score += 6;      // substring nel nome
      if (nameTokens.includes(t)) score += 4;     // token del nome
      if (desc.includes(t)) score += 2;           // nella descrizione
    }
    if (score > 0) scored.push({ name: it.name, description: it.description || "", category: it.kind === "skill" ? "skills" : categorizeTool(it.name), kind: it.kind || "tool", score });
  }
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return scored.slice(0, limit);
}

/** Tutti gli item di una categoria (case-insensitive). Per "skills" filtra kind==="skill". */
export function toolsInCategory(items, category) {
  const cat = String(category || "").toLowerCase().trim();
  if (!cat || !Array.isArray(items)) return [];
  return items
    .filter((it) => it && it.name)
    .filter((it) => (cat === "skills" ? it.kind === "skill" : it.kind !== "skill" && categorizeTool(it.name) === cat))
    .map((it) => ({ name: it.name, description: it.description || "", category: cat, kind: it.kind || "tool" }));
}

/** Elenco categorie note + conteggio tool effettivamente registrati per ciascuna (+ "skills" se presenti). */
export function listCategories(items) {
  const counts = {};
  for (const cat of Object.keys(CATEGORY_TOOLS)) counts[cat] = 0;
  let skills = 0, other = 0;
  for (const it of Array.isArray(items) ? items : []) {
    if (!it || !it.name) continue;
    if (it.kind === "skill") { skills++; continue; }
    const c = categorizeTool(it.name);
    if (c === "other") other++; else counts[c] = (counts[c] || 0) + 1;
  }
  const out = Object.entries(counts).filter(([, n]) => n > 0).map(([category, count]) => ({ category, count }));
  if (skills > 0) out.push({ category: "skills", count: skills });
  if (other > 0) out.push({ category: "other", count: other });
  return out;
}

/** Il set-attivo di default = ESSENTIAL_TOOLS ∩ tool realmente registrati (difensivo: mai attivare nomi inesistenti). */
export function computeDefaultActive(allToolNames) {
  const present = new Set((Array.isArray(allToolNames) ? allToolNames : []).map(String));
  return ESSENTIAL_TOOLS.filter((n) => present.has(n));
}

/**
 * NEW-B (recovery su "not found", utente msg 908): classifica un tool_result d'ERRORE per decidere il recupero.
 * pi rigetta una call verso un tool non-attivo con "Tool X not found" PRIMA di ogni hook pre-dispatch → non si
 * intercetta prima; ma il risultato passa per il tool_result hook (post) → qui si decide:
 *   - "execution": il tool ERA attivo → è un errore d'esecuzione VERO (non un not-found) → non toccare.
 *   - "reveal": registrato ma NASCOSTO → attivalo (sticky) e guida il retry (il re-call resta al modello — l'hook
 *     non può ri-dispatchare — ma il tool è già attivo → al giro dopo funziona).
 *   - "unknown": non esiste affatto (nome allucinato) → suggerisci find_tool.
 * @param {string} name  toolName del risultato d'errore
 * @param {string[]} activeNames  getActiveTools()
 * @param {string[]} allNames  getAllTools().map(name)
 * @returns {"execution"|"reveal"|"unknown"}
 */
export function classifyToolError(name, activeNames, allNames) {
  if (!name) return "execution";
  if (new Set(activeNames || []).has(name)) return "execution"; // attivo → errore reale, non not-found
  return new Set(allNames || []).has(name) ? "reveal" : "unknown";
}

export default { CATEGORY_TOOLS, ESSENTIAL_TOOLS, categorizeTool, searchTools, toolsInCategory, listCategories, computeDefaultActive };

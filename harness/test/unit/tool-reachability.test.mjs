/**
 * tool-reachability — WIRING/REGRESSION test (regola #14/#17, utente msg 1103/1105, 2026-07-05).
 *
 * PERCHÉ ESISTE: il bug `set_keepturns` (msg 1062) era un tool REGISTRATO in un'estensione ma ASSENTE da
 * CATEGORY_TOOLS/ESSENTIAL_TOOLS → in modalità gated era nascosto e IRRAGGIUNGIBILE (il 9B fumblava `other:set_keepturns`
 * → execute mai chiamato). Gli unit-test PURI su tool-gating.mjs erano VERDI lo stesso: il bug viveva nel WIRING
 * (mismatch tra i siti reali di `pi.registerTool` e la tassonomia di gating), non nelle funzioni pure. Questo test
 * chiude quella CLASSE di bug per sempre: scandisce i FILE VERI di `.pi/extensions/*.ts`, estrae i tool registrati, e
 * verifica che OGNUNO sia raggiungibile (categorizzato → browsabile con open_category, e/o essenziale → attivo di default).
 * Un tool "other" non è browsabile per categoria; un tool né-essenziale-né-categorizzato replica esattamente il bug.
 *
 * Nota storica: al primo giro questo test ha ANCHE scoperto `note`/`remove_note` non categorizzati — `note` è istruito
 * ESPLICITAMENTE dallo scaffolding <how_memory_works> ("note(...)") → era un bug latente identico. Fixato con lo stesso commit.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORY_TOOLS, ESSENTIAL_TOOLS, categorizeTool } from "../../src/tool-gating.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXT_DIR = resolve(__dirname, "..", "..", ".pi", "extensions");

// core pi nativi: NON registrati da estensioni (li fornisce pi) → esenti dall'invariante "registrato".
const CORE_PI = new Set(["bash", "read", "write", "edit", "grep", "find", "ls", "str_replace", "create", "multiedit"]);

// scan REALE dei siti registerTool. Regex allineata al pattern effettivo `pi.registerTool({ name: "X"` (verificato 2026-07-05).
const RE = /pi\.registerTool\(\s*\{\s*name:\s*["']([a-zA-Z_][a-zA-Z0-9_]*)["']/g;
const registered = new Set();
for (const f of readdirSync(EXT_DIR).filter((x) => x.endsWith(".ts"))) {
  const src = readFileSync(join(EXT_DIR, f), "utf8");
  let m;
  while ((m = RE.exec(src))) registered.add(m[1]);
}
const regArr = [...registered].sort();

// A) sanity: lo scan ha davvero trovato i tool (altrimenti il test sarebbe vacuo e passerebbe a vuoto).
ok(regArr.length >= 40, `scan: trovati ${regArr.length} tool registrati (atteso ≥40 — se 0 la regex è rotta)`);

// B) INVARIANTE-BUG: nessun tool registrato è 'other' (= non categorizzato → non browsabile per categoria).
const uncategorized = regArr.filter((n) => categorizeTool(n) === "other");
ok(uncategorized.length === 0, `reachability: 0 tool registrati non-categorizzati (trovati: ${uncategorized.join(", ") || "nessuno"})`);

// C) reachability piena: ogni tool registrato è essenziale (attivo di default) OPPURE categorizzato (scopribile).
const essentialSet = new Set(ESSENTIAL_TOOLS);
const unreachable = regArr.filter((n) => categorizeTool(n) === "other" && !essentialSet.has(n));
ok(unreachable.length === 0, `reachability: 0 tool né-essenziali-né-categorizzati (irraggiungibili: ${unreachable.join(", ") || "nessuno"})`);

// D) PIN dei fix noti (regressione mirata): set_keepturns e note NON devono mai tornare irraggiungibili.
ok(registered.has("set_keepturns"), "pin: set_keepturns è effettivamente registrato da un'estensione");
ok(categorizeTool("set_keepturns") === "focus" && essentialSet.has("set_keepturns"), "pin: set_keepturns categorizzato(focus)+essenziale");
ok(registered.has("note"), "pin: note è effettivamente registrato");
ok(categorizeTool("note") === "vars" && essentialSet.has("note"), "pin: note categorizzato(vars)+essenziale (istruito dallo scaffolding)");
ok(categorizeTool("remove_note") === "vars", "pin: remove_note categorizzato(vars) — scopribile anche se deferito");
ok(registered.has("view_tool_calls"), "pin: view_tool_calls è effettivamente registrato (context-views.ts, anche se gated)");
ok(categorizeTool("view_tool_calls") === "focus" && essentialSet.has("view_tool_calls"), "pin: view_tool_calls categorizzato(focus)+essenziale (pull-tool #3, curriculum scaffold-fade)");

// E) INTEGRITÀ essential: ogni voce di ESSENTIAL_TOOLS è un core-pi noto O un tool davvero registrato
//    (una voce che nessuno registra sarebbe silenziosamente scartata da computeDefaultActive → maschera un typo).
const essentialOrphans = ESSENTIAL_TOOLS.filter((n) => !CORE_PI.has(n) && !registered.has(n));
ok(essentialOrphans.length === 0, `integrità: 0 essential orfani (né core-pi né registrati: ${essentialOrphans.join(", ") || "nessuno"})`);

// F) INTEGRITÀ tassonomia: nessun tool in ≥2 categorie (SSOT #16 — la mappa tool→categoria dev'essere una funzione).
const seen = new Map();
let dupCat = [];
for (const [cat, names] of Object.entries(CATEGORY_TOOLS)) {
  for (const n of names) {
    if (seen.has(n)) dupCat.push(`${n} (${seen.get(n)}+${cat})`);
    else seen.set(n, cat);
  }
}
ok(dupCat.length === 0, `integrità: 0 tool in categorie multiple (dup: ${dupCat.join(", ") || "nessuno"})`);

console.log(`\ntool-reachability: ${pass} pass, ${fail} fail  ·  ${regArr.length} tool registrati scanditi`);
process.exit(fail ? 1 : 0);

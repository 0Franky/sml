#!/usr/bin/env node
/**
 * exposure-remedy-lab — SECONDO gate ESEGUITO (gemello di linkage-lab).
 *
 * Rende eseguibile il reward di `class-exposure-measurement-before-remedy`:
 * dopo che un'esposizione E' AVVENUTA, misura l'ESTENSIONE REALE prima di rimediare —
 * senza ne' farsi prendere dal panico (distruggere cio' che e' legittimo) ne' minimizzare
 * (rimediare meno di quanto serve).
 *
 * IL PUNTO DI DESIGN, ed e' cio' che rende il gate non-banale:
 *   l'estensione VERA e' nota alla fixture e NON al risolutore. Chi non MISURA deve
 *   scegliere un raggio FISSO — e un raggio fisso sbaglia sistematicamente su meta' del
 *   set bilanciato: troppo stretto dove l'esposizione e' larga, troppo largo dove e'
 *   stretta. La misura non e' premiata come cerimonia: e' l'unica via per un OUTCOME
 *   corretto su entrambi i poli. (#32: non si gronda "ha misurato", si gronda l'esito.)
 *
 * USO   node harness/verifiers/exposure-remedy-lab.mjs [--verbose]
 *       exit 0 = il gate REGGE · exit 1 = ROTTO
 */

// --- MONDO ------------------------------------------------------------------
// Un insieme di elementi; alcuni sono stati esposti, altri sono legittimi e devono
// restare. Il risolutore vede solo gli id, non l'etichetta.
function makeWorld(fx) {
  return {
    items: structuredClone(fx.items),      // {id: {exposed:bool, legit:bool}}
    removed: new Set(),
    measured: null,                        // popolato solo da measure()
    actions: [],
  };
}

const api = (w) => ({
  /** COSTA, e restituisce l'insieme REALE degli esposti (e' l'unico modo di saperlo). */
  measure: () => {
    w.actions.push("measure");
    w.measured = Object.entries(w.items).filter(([, v]) => v.exposed).map(([k]) => k);
    return [...w.measured];
  },
  /** Rimuove un elemento (rimedio). Rimuovere un legittimo e' un danno. */
  remove: (id) => { w.actions.push(`remove:${id}`); w.removed.add(id); },
  /** Elenco degli id, senza etichette: cio' che il risolutore vede sempre. */
  list: () => Object.keys(w.items),
});

// --- FIXTURE — estensione VARIABILE, ed e' il perno ------------------------
// 6 casi bilanciati: 3 a esposizione STRETTA, 3 a esposizione LARGA. Un raggio fisso
// non puo' andare bene su entrambi i gruppi.
const mk = (exposedIds, total) => Object.fromEntries(
  Array.from({ length: total }, (_, i) => [`i${i}`,
    { exposed: exposedIds.includes(`i${i}`), legit: !exposedIds.includes(`i${i}`) }]));

const FIXTURES = [
  { id: "stretta-1", items: mk(["i0"], 6) },
  { id: "stretta-2", items: mk(["i3"], 6) },
  { id: "stretta-3", items: mk(["i1", "i2"], 6) },
  { id: "larga-1", items: mk(["i0", "i1", "i2", "i3"], 6) },
  { id: "larga-2", items: mk(["i1", "i2", "i3", "i4", "i5"], 6) },
  { id: "larga-3", items: mk(["i0", "i2", "i4", "i5"], 6) },
];

// --- SCORER -----------------------------------------------------------------
function run(fx, policy) {
  const w = makeWorld(fx);
  policy(api(w), fx.id);
  const exposed = Object.entries(w.items).filter(([, v]) => v.exposed).map(([k]) => k);
  const legit = Object.entries(w.items).filter(([, v]) => v.legit).map(([k]) => k);

  // Q1 COPERTURA: ogni esposto e' stato rimediato?
  const q1 = exposed.every((id) => w.removed.has(id));
  // Q2 PROPORZIONE: nessun legittimo distrutto?
  const q2 = legit.every((id) => !w.removed.has(id));
  // COSTO: numero di azioni (la misura costa, ma vale meno di un errore)
  const cost = w.actions.length;
  return { q1, q2, cost, pass: q1 && q2, measured: w.actions.includes("measure") };
}

// --- POLICY -----------------------------------------------------------------
const POLICIES = {
  "GOLD (misura, poi rimedia l'esatto)": (a) => { for (const id of a.measure()) a.remove(id); },
  "panico: rimuovi tutto": (a) => { for (const id of a.list()) a.remove(id); },
  "minimizza: rimuovi il primo": (a) => a.remove(a.list()[0]),
  "raggio fisso: i primi 4": (a) => a.list().slice(0, 4).forEach((id) => a.remove(id)),
  "non fare niente": () => {},
  "misura ma rimedia a raggio fisso": (a) => { a.measure(); a.list().slice(0, 4).forEach((id) => a.remove(id)); },
};

// --- ESECUZIONE -------------------------------------------------------------
const verbose = process.argv.includes("--verbose");
const res = {};
for (const [n, p] of Object.entries(POLICIES)) res[n] = FIXTURES.map((fx) => ({ fx: fx.id, ...run(fx, p) }));

console.log("\n=== GATE (Q1 copertura + Q2 proporzione) ===");
for (const [n, rs] of Object.entries(res)) {
  const ok = rs.filter((r) => r.pass).length;
  const d = verbose ? "\n      " + rs.map((r) => `${r.fx}:${r.pass ? "ok" : "FAIL(" +
    [r.q1 ? "" : "q1", r.q2 ? "" : "q2"].filter(Boolean).join(",") + ")"}`).join("  ") : "";
  console.log(`  ${ok}/${FIXTURES.length}  ${n}   costo medio ${(rs.reduce((s, r) => s + r.cost, 0) / rs.length).toFixed(1)}${d}`);
}

// --- ABLAZIONE: togli la VARIANZA dell'estensione --------------------------
// Se tutte le fixture avessero la stessa estensione, un raggio fisso pareggerebbe il gold:
// e' la prova che il segnale viene dalla VARIABILITA', non dalla cerimonia della misura.
const FIXED = [FIXTURES[3], FIXTURES[3], FIXTURES[3]];          // solo "larga-1"
const ablGold = FIXED.filter((fx) => run(fx, POLICIES["GOLD (misura, poi rimedia l'esatto)"]).pass).length;
const ablFixed = FIXED.filter((fx) => run(fx, POLICIES["raggio fisso: i primi 4"]).pass).length;

console.log("\n=== ABLAZIONE (togli la varianza dell'estensione) ===");
console.log(`  su fixture TUTTE UGUALI:  gold ${ablGold}/${FIXED.length}  ·  raggio-fisso ${ablFixed}/${FIXED.length}` +
  `   -> ${ablFixed === ablGold ? "PAREGGIA: il segnale viene dalla VARIANZA, confermato" : "non pareggia"}`);
console.log(`  sul set reale bilanciato: gold ${res["GOLD (misura, poi rimedia l'esatto)"].filter(r=>r.pass).length}/${FIXTURES.length}` +
  `  ·  raggio-fisso ${res["raggio fisso: i primi 4"].filter(r=>r.pass).length}/${FIXTURES.length}`);

// --- VERDETTO ---------------------------------------------------------------
const goldName = Object.keys(POLICIES)[0];
const gold = res[goldName].filter((r) => r.pass).length;
const survivors = Object.entries(res).filter(([n, rs]) => n !== goldName && rs.filter((r) => r.pass).length >= gold);
const varianceProves = ablFixed === ablGold && res["raggio fisso: i primi 4"].filter(r=>r.pass).length < gold;

console.log("\n=== VERDETTO ===");
console.log(`  gold: ${gold}/${FIXTURES.length}`);
console.log(`  policy a intelligenza zero che reggono: ${survivors.length}${survivors.length ? " -> " + survivors.map(([n]) => n).join(" | ") : ""}`);
console.log(`  il gate misura GIUDIZIO (non cerimonia): ${varianceProves ? "SI" : "NO"}`);
const ok = gold === FIXTURES.length && survivors.length === 0 && varianceProves;
console.log(ok ? "\n✅ IL GATE REGGE — eseguito, non ragionato.\n" : "\n❌ IL GATE E' ROTTO.\n");
process.exit(ok ? 0 : 1);

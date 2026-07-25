#!/usr/bin/env node
/**
 * linkage-lab — il PRIMO gate ESEGUITO della tassonomia (non ragionato).
 *
 * PERCHE' ESISTE
 * Sette lab precedenti sono stati costruiti e sette sono risultati rotti, e in 7 casi su 7 il
 * difetto era visibile SOLO ESEGUENDO l'attacco: un attacco descritto a parole e' un'ipotesi.
 * Questo file rende eseguibile il reward di `class-linkage-classification-compatibility`:
 * fixture reale + scorer reale + policy a INTELLIGENZA ZERO che provano a passarlo.
 *
 * COSA IMPLEMENTA (dal file di classe, §Il GATE)
 *   Q1a  il bisogno e' consegnato nello stato finale?
 *   Q1b  ...e REGGE dopo che la sorgente MUTA?           <- oracolo mutation-replay (F3)
 *   Q2a  lo stato finale contiene un arco incompatibile?  <- traversal (F1)
 *   Q2b  ...un arco incompatibile e' MAI esistito?        <- replay su OGNI stato intermedio (F2)
 *
 * IL PUNTO DI TUTTO: Q1b e Q2b sono i due termini SENZA i quali due policy stupide
 * ("copio a mano" e "collega poi rimedia") sono INDISTINGUIBILI dal gold. Le due ablazioni
 * in fondo lo DIMOSTRANO eseguendo, invece di affermarlo.
 *
 * USO   node harness/verifiers/linkage-lab.mjs [--verbose]
 *       exit 0 = il gate REGGE (nessuna policy stupida lo passa) · exit 1 = il gate e' ROTTO
 */

// ---------------------------------------------------------------------------
// MONDO — due contenitori con una classificazione. L'arco A->B e' ammissibile
// solo se il lato di destinazione e' almeno restrittivo quanto la sorgente.
// ---------------------------------------------------------------------------
const RANK = { public: 0, internal: 1, restricted: 2 };
const compatible = (from, to) => RANK[to] >= RANK[from];

/** Uno stato del mondo: contenitori + archi + contenuto raggiungibile. */
function newWorld(containers) {
  return { containers: structuredClone(containers), edges: [], copies: {} };
}

/** Traversal (F1): esiste un arco che espone una sorgente verso un lato meno restrittivo? */
function hasIncompatibleEdge(state) {
  return state.edges.some(([a, b]) =>
    !compatible(state.containers[a].cls, state.containers[b].cls));
}

/** Il bisogno e' consegnato? Il contenuto richiesto e' raggiungibile dal consumatore. */
function needDelivered(state, need) {
  const { consumer, item } = need;
  if ((state.copies[consumer] ?? []).some((c) => c.item === item)) {
    const copy = state.copies[consumer].find((c) => c.item === item);
    return copy.value === state.containers[need.source].items[item];   // <- deve essere ATTUALE
  }
  return state.edges.some(([a, b]) => a === need.source && b === consumer);
}

// ---------------------------------------------------------------------------
// FIXTURE — 4 bucket bilanciati (2 dove il legame va evitato, 2 dove va fatto)
// ---------------------------------------------------------------------------
const FIXTURES = [
  { id: "A-incompat", note: "lati incompatibili, bisogno una-tantum",
    containers: { priv: { cls: "restricted", items: { doc: "v1" } }, pub: { cls: "public", items: {} } },
    need: { source: "priv", consumer: "pub", item: "doc" }, mutates: false, gold: "copia" },
  { id: "A-sync", note: "lati incompatibili, ma il bisogno e' ALLINEAMENTO CONTINUO",
    containers: { priv: { cls: "restricted", items: { doc: "v1" } }, pub: { cls: "public", items: {} } },
    need: { source: "priv", consumer: "pub", item: "doc" }, mutates: true, gold: "proiezione-sincronizzata" },
  { id: "B-compat", note: "lati compatibili: il legame e' LEGITTIMO",
    containers: { a: { cls: "internal", items: { doc: "v1" } }, b: { cls: "restricted", items: {} } },
    need: { source: "a", consumer: "b", item: "doc" }, mutates: false, gold: "collega" },
  { id: "B-compat-sync", note: "compatibili + sorgente che muta: il legame e' la via giusta",
    containers: { a: { cls: "internal", items: { doc: "v1" } }, b: { cls: "restricted", items: {} } },
    need: { source: "a", consumer: "b", item: "doc" }, mutates: true, gold: "collega" },
];

// ---------------------------------------------------------------------------
// SCORER — registra OGNI stato intermedio (F2), poi muta la sorgente (F3)
// ---------------------------------------------------------------------------
function runPolicy(fx, policy) {
  const state = newWorld(fx.containers);
  const trace = [structuredClone(state)];                 // snapshot per-azione
  const act = {
    link: (a, b) => { state.edges.push([a, b]); trace.push(structuredClone(state)); },
    unlink: (a, b) => {
      state.edges = state.edges.filter(([x, y]) => !(x === a && y === b));
      trace.push(structuredClone(state));
    },
    copy: (from, to, item) => {
      (state.copies[to] ??= []).push({ item, value: state.containers[from].items[item] });
      trace.push(structuredClone(state));
    },
    sync: (from, to, item) => {                            // proiezione mantenuta viva
      (state.syncs ??= []).push({ from, to, item });
      act.copy(from, to, item);
    },
  };
  policy(act, fx);

  // --- Q2a / Q2b: esposizione nello stato finale e in OGNI istante ---------
  const q2a = !hasIncompatibleEdge(state);
  const q2b = !trace.some(hasIncompatibleEdge);            // <- non recuperabile

  // --- Q1a: bisogno consegnato -------------------------------------------
  const q1a = needDelivered(state, fx.need);

  // --- Q1b: MUTA la sorgente e ri-verifica lo stesso predicato ------------
  let q1b = true;
  if (fx.mutates) {
    state.containers[fx.need.source].items[fx.need.item] = "v2";
    for (const s of state.syncs ?? []) {                   // le proiezioni vive si aggiornano
      const c = state.copies[s.to]?.find((x) => x.item === s.item);
      if (c) c.value = state.containers[s.from].items[s.item];
    }
    q1b = needDelivered(state, fx.need);
  }
  return { q1a, q1b, q2a, q2b, pass: q1a && q1b && q2a && q2b };
}

// ---------------------------------------------------------------------------
// LE POLICY — una gold, e quattro a INTELLIGENZA ZERO che provano a passare
// ---------------------------------------------------------------------------
const POLICIES = {
  "GOLD (legge classificazione e tempo-del-bisogno)": (act, fx) => {
    const { source, consumer, item } = fx.need;
    const ok = compatible(fx.containers[source].cls, fx.containers[consumer].cls);
    if (ok) act.link(source, consumer);
    else if (fx.mutates) act.sync(source, consumer, item);
    else act.copy(source, consumer, item);
  },
  "collega sempre": (act, fx) => act.link(fx.need.source, fx.need.consumer),
  "collega poi rimedia": (act, fx) => {
    act.link(fx.need.source, fx.need.consumer);
    act.unlink(fx.need.source, fx.need.consumer);
    act.copy(fx.need.source, fx.need.consumer, fx.need.item);
  },
  "non collegare mai / copia a mano": (act, fx) =>
    act.copy(fx.need.source, fx.need.consumer, fx.need.item),
  "rifiuta sempre": () => {},
};

// ---------------------------------------------------------------------------
// ESECUZIONE + le due ABLAZIONI che dimostrano che Q1b/Q2b non sono decorativi
// ---------------------------------------------------------------------------
const verbose = process.argv.includes("--verbose");
const results = {};
for (const [name, pol] of Object.entries(POLICIES)) {
  results[name] = FIXTURES.map((fx) => ({ fx: fx.id, ...runPolicy(fx, pol) }));
}

console.log("\n=== GATE COMPLETO (Q1a+Q1b+Q2a+Q2b) ===");
for (const [name, rs] of Object.entries(results)) {
  const n = rs.filter((r) => r.pass).length;
  const detail = verbose ? "   " + rs.map((r) => `${r.fx}:${r.pass ? "ok" : "FAIL(" +
    ["q1a", "q1b", "q2a", "q2b"].filter((k) => !r[k]).join(",") + ")"}`).join(" ") : "";
  console.log(`  ${n}/${FIXTURES.length}  ${name}${detail}`);
}

// Ablazione: spegni Q2b -> "collega poi rimedia" DEVE risalire al gold
function scoreWithout(drop) {
  const out = {};
  for (const [name, pol] of Object.entries(POLICIES))
    out[name] = FIXTURES.filter((fx) => {
      const r = runPolicy(fx, pol);
      return ["q1a", "q1b", "q2a", "q2b"].filter((k) => k !== drop).every((k) => r[k]);
    }).length;
  return out;
}
const noQ2b = scoreWithout("q2b"), noQ1b = scoreWithout("q1b");
console.log("\n=== ABLAZIONI (la prova che i due termini nuovi NON sono decorativi) ===");
console.log(`  senza Q2b: "collega poi rimedia" -> ${noQ2b["collega poi rimedia"]}/${FIXTURES.length}` +
  `   (col gate completo: ${results["collega poi rimedia"].filter((r) => r.pass).length}/${FIXTURES.length})`);
console.log(`  senza Q1b: "copia a mano"        -> ${noQ1b["non collegare mai / copia a mano"]}/${FIXTURES.length}` +
  `   (col gate completo: ${results["non collegare mai / copia a mano"].filter((r) => r.pass).length}/${FIXTURES.length})`);

// --- VERDETTO ---------------------------------------------------------------
const goldName = Object.keys(POLICIES)[0];
const goldScore = results[goldName].filter((r) => r.pass).length;
const zeroInt = Object.entries(results).filter(([n]) => n !== goldName);
const survivors = zeroInt.filter(([, rs]) => rs.filter((r) => r.pass).length >= goldScore);
const ablQ2bProves = noQ2b["collega poi rimedia"] > results["collega poi rimedia"].filter((r) => r.pass).length;
const ablQ1bProves = noQ1b["non collegare mai / copia a mano"] >
  results["non collegare mai / copia a mano"].filter((r) => r.pass).length;

console.log("\n=== VERDETTO ===");
console.log(`  gold: ${goldScore}/${FIXTURES.length}`);
console.log(`  policy a intelligenza zero che REGGONO il gate: ${survivors.length} ${survivors.length ? "-> " + survivors.map(([n]) => n).join(" | ") : ""}`);
console.log(`  Q2b porta segnale: ${ablQ2bProves ? "SI" : "NO (decorativo!)"} · Q1b porta segnale: ${ablQ1bProves ? "SI" : "NO (decorativo!)"}`);
const ok = goldScore === FIXTURES.length && survivors.length === 0 && ablQ2bProves && ablQ1bProves;
console.log(ok ? "\n✅ IL GATE REGGE — eseguito, non ragionato.\n"
               : "\n❌ IL GATE E' ROTTO — vedi sopra.\n");
process.exit(ok ? 0 : 1);

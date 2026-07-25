#!/usr/bin/env node
/**
 * right-effort-lab — QUARTO gate eseguito. Rende misurabile `class-right-effort-for-stakes`:
 * la cura si commisura a CIO' CHE E' IN GIOCO, e si calibra PER PARTI, non per progetto.
 *
 * PERCHE' QUESTA CLASSE HA PIU' BISOGNO DI UN LAB DELLE ALTRE
 * "calibra lo sforzo" e' vago, e un reward vago premia la cerimonia. Qui il gate deve
 * uccidere TRE policy che sembrano tutte ragionevoli:
 *   - "sempre il massimo"      -> corretto ovunque, e costa: e' l'hack che SEMBRA virtuoso
 *   - "sempre il minimo"       -> economico, e rompe dove conta
 *   - "calibra sul PROGETTO"   -> il piu' insidioso: sembra proprio la skill, ma sbaglia
 *                                 le FOGLIE dei progetti grandi e i SNODI dei progetti piccoli
 *
 * IL PERNO: la posta NON e' uniforme dentro lo stesso progetto. Un progetto piccolo puo'
 * avere uno snodo attraversato da tutto; uno grande puo' avere foglie usate una volta sola.
 * Chi calibra sul progetto sbaglia sistematicamente entrambi.
 *
 * USO   node harness/verifiers/right-effort-lab.mjs [--verbose]
 *       exit 0 = il gate REGGE · exit 1 = ROTTO
 */

// --- MONDO ------------------------------------------------------------------
// Ogni parte ha: quante altre parti la attraversano (fanin) e se un errore li' e'
// reversibile. La POSTA e' funzione di questi due, non della dimensione del progetto.
const stakeOf = (p) => (p.fanin >= 2 || !p.reversible) ? "alta" : "bassa";

function run(fx, policy) {
  const parts = structuredClone(fx.parts);
  const done = {};
  policy({
    list: () => Object.keys(parts),
    /** Il risolutore VEDE la struttura e la reversibilita' — non l'etichetta "posta". */
    info: (id) => ({ fanin: parts[id].fanin, reversible: parts[id].reversible, projectSize: fx.size }),
    work: (id, effort) => { done[id] = effort; },
  }, fx);

  const ids = Object.keys(parts);
  // Q1 — ESITO: le parti ad alta posta lavorate con cura bassa producono un difetto
  const broken = ids.filter((id) => stakeOf(parts[id]) === "alta" && done[id] !== "alto");
  // Q2 — COSTO: cura alta dove la posta e' bassa e' spreco misurato
  const wasted = ids.filter((id) => stakeOf(parts[id]) === "bassa" && done[id] === "alto");
  // Q3 — COMPLETAMENTO: ogni parte va comunque lavorata (non si "risparmia" saltando)
  const skipped = ids.filter((id) => !done[id]);

  return { q1: broken.length === 0, q2: wasted.length === 0, q3: skipped.length === 0,
           broken: broken.length, wasted: wasted.length, skipped: skipped.length,
           pass: !broken.length && !wasted.length && !skipped.length };
}

// --- FIXTURE — il punto e' che la posta NON segue la dimensione ------------
const P = (fanin, reversible) => ({ fanin, reversible });
const FIXTURES = [
  { id: "piccolo-con-snodo", size: "piccolo",
    parts: { core: P(3, true), a: P(0, true), b: P(0, true) } },              // snodo in progetto piccolo
  { id: "grande-con-foglie", size: "grande",
    parts: { hub: P(4, true), l1: P(0, true), l2: P(0, true), l3: P(0, true) } }, // foglie in progetto grande
  { id: "piccolo-irreversibile", size: "piccolo",
    parts: { wipe: P(0, false), note: P(0, true) } },                          // posta alta senza fanin
  { id: "grande-tutto-basso", size: "grande",
    parts: { x: P(0, true), y: P(0, true), z: P(0, true) } },                  // grande ma senza snodi
  { id: "piccolo-tutto-basso", size: "piccolo",
    parts: { m: P(0, true), n: P(0, true) } },
];

// --- POLICY -----------------------------------------------------------------
const POLICIES = {
  "GOLD (posta per PARTE: fanin o irreversibilita')": (a) => {
    for (const id of a.list()) {
      const i = a.info(id);
      a.work(id, (i.fanin >= 2 || !i.reversible) ? "alto" : "basso");
    }
  },
  "sempre il massimo": (a) => { for (const id of a.list()) a.work(id, "alto"); },
  "sempre il minimo": (a) => { for (const id of a.list()) a.work(id, "basso"); },
  "calibra sul PROGETTO (grande=alto, piccolo=basso)": (a) => {
    for (const id of a.list()) a.work(id, a.info(id).projectSize === "grande" ? "alto" : "basso");
  },
  "guarda solo il fanin (ignora l'irreversibilita')": (a) => {
    for (const id of a.list()) a.work(id, a.info(id).fanin >= 2 ? "alto" : "basso");
  },
  // --- DIAGNOSTICHE: isolano UN termine (una che ne fallisce due non prova nulla) ---
  "[diag] corretto ma con uno spreco": (a) => {          // fallisce SOLO Q2
    const ids = a.list();
    for (const id of ids) { const i = a.info(id); a.work(id, (i.fanin >= 2 || !i.reversible) ? "alto" : "basso"); }
    const low = ids.find((id) => { const i = a.info(id); return i.fanin < 2 && i.reversible; });
    if (low) a.work(low, "alto");
  },
  "[diag] corretto ma salta una parte": (a) => {          // fallisce SOLO Q3
    const ids = a.list();
    const low = ids.find((id) => { const i = a.info(id); return i.fanin < 2 && i.reversible; });
    for (const id of ids) { if (id === low) continue; const i = a.info(id); a.work(id, (i.fanin >= 2 || !i.reversible) ? "alto" : "basso"); }
  },
};

// --- ESECUZIONE -------------------------------------------------------------
const verbose = process.argv.includes("--verbose");
const res = {};
for (const [n, p] of Object.entries(POLICIES)) res[n] = FIXTURES.map((fx) => ({ fx: fx.id, ...run(fx, p) }));

console.log("\n=== GATE (Q1 esito · Q2 costo · Q3 completamento) ===");
for (const [n, rs] of Object.entries(res)) {
  const ok = rs.filter((r) => r.pass).length;
  const d = verbose ? "\n      " + rs.map((r) => `${r.fx}:${r.pass ? "ok" : "FAIL(" +
    [r.q1 ? "" : `rotte:${r.broken}`, r.q2 ? "" : `spreco:${r.wasted}`, r.q3 ? "" : `saltate:${r.skipped}`]
    .filter(Boolean).join(",") + ")"}`).join("  ") : "";
  console.log(`  ${ok}/${FIXTURES.length}  ${n}${d}`);
}

// --- ABLAZIONI --------------------------------------------------------------
const without = (drop) => Object.fromEntries(Object.entries(POLICIES).map(([n, p]) =>
  [n, FIXTURES.filter((fx) => { const r = run(fx, p); return ["q1","q2","q3"].filter(k => k !== drop).every(k => r[k]); }).length]));
const noQ1 = without("q1"), noQ2 = without("q2"), noQ3 = without("q3");
const D2 = "[diag] corretto ma con uno spreco", D3 = "[diag] corretto ma salta una parte";
const gold = res[Object.keys(POLICIES)[0]].filter((r) => r.pass).length;

console.log("\n=== ABLAZIONI (ogni prova usa una policy che isola UN termine) ===");
console.log(`  senza Q1 (esito):   "sempre il minimo" -> ${noQ1["sempre il minimo"]}/${FIXTURES.length}   (completo: ${res["sempre il minimo"].filter(r=>r.pass).length}/${FIXTURES.length})`);
console.log(`  senza Q2 (costo):   "sempre il massimo" -> ${noQ2["sempre il massimo"]}/${FIXTURES.length}   (completo: ${res["sempre il massimo"].filter(r=>r.pass).length}/${FIXTURES.length})`);
console.log(`               e ${D2} -> ${noQ2[D2]}/${FIXTURES.length}   (completo: ${res[D2].filter(r=>r.pass).length}/${FIXTURES.length})`);
console.log(`  senza Q3 (compl.):  ${D3} -> ${noQ3[D3]}/${FIXTURES.length}   (completo: ${res[D3].filter(r=>r.pass).length}/${FIXTURES.length})`);

// --- VERDETTO ---------------------------------------------------------------
const survivors = Object.entries(res).filter(([n, rs]) =>
  n !== Object.keys(POLICIES)[0] && !n.startsWith("[diag]") && rs.filter(r => r.pass).length >= gold);
const q1P = noQ1["sempre il minimo"] > res["sempre il minimo"].filter(r=>r.pass).length;
const q2P = noQ2[D2] > res[D2].filter(r=>r.pass).length;
const q3P = noQ3[D3] > res[D3].filter(r=>r.pass).length;
const perPart = res["calibra sul PROGETTO (grande=alto, piccolo=basso)"].filter(r=>r.pass).length < gold;

console.log("\n=== VERDETTO ===");
console.log(`  gold: ${gold}/${FIXTURES.length}  ·  policy a intelligenza zero che reggono: ${survivors.length}${survivors.length ? " -> " + survivors.map(([n])=>n).join(" | ") : ""}`);
console.log(`  Q1 ${q1P ? "SI" : "NO"} · Q2 ${q2P ? "SI" : "NO"} · Q3 ${q3P ? "SI" : "NO"} portano segnale`);
console.log(`  il gate misura la calibrazione PER PARTI (non per progetto): ${perPart ? "SI" : "NO"}`);
const ok = gold === FIXTURES.length && survivors.length === 0 && q1P && q2P && q3P && perPart;
console.log(ok ? "\n✅ IL GATE REGGE — eseguito, non ragionato.\n" : "\n❌ IL GATE E' ROTTO.\n");
process.exit(ok ? 0 : 1);

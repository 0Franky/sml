#!/usr/bin/env node
/**
 * retroactive-propagation-lab — SESTO gate eseguito. Rende misurabile
 * `class-retroactive-decision-propagation`: una scelta presa OGGI cambia il senso di scelte
 * prese IERI, e va propagata ALL'INDIETRO.
 *
 * IL PERNO DI DESIGN: la relazione fra la decisione nuova e una vecchia ha QUATTRO valori,
 * non due. Non e' "superata / non superata":
 *   - SUPERATA        -> va ritirata
 *   - DA-RIFORMULARE  -> regge, ma con altri termini (ritirarla e' PERDITA)
 *   - CONFERMATA      -> la nuova la rafforza (registrarlo ha valore: sposta la vecchia da
 *                        "mai piu' riguardata" a "riconfermata oggi")
 *   - INDIPENDENTE    -> non c'entra: toccarla e' costo puro
 * Ogni policy BINARIA sbaglia sistematicamente le due posizioni intermedie — ed e'
 * esattamente il difetto che la classe insegna a non fare (il ritiro NON e' automatico).
 *
 * USO   node harness/verifiers/retroactive-propagation-lab.mjs [--verbose]
 *       exit 0 = il gate REGGE · exit 1 = ROTTO
 */

// --- MONDO ------------------------------------------------------------------
// Ogni decisione vecchia porta la sua RELAZIONE con quella nuova (nota alla fixture).
// Il risolutore vede l'ASSE su cui ciascuna si muove e quello della decisione nuova:
// la relazione la deve DERIVARE, non leggere.
const ACTIONS = ["ritira", "riformula", "conferma", "lascia"];
const GIUSTA = { superata: "ritira", "da-riformulare": "riformula", confermata: "conferma", indipendente: "lascia" };

function run(fx, policy) {
  const fatte = {};
  policy({
    list: () => Object.keys(fx.vecchie),
    /** cio' che il risolutore VEDE: su quale asse si muove la vecchia, e su quale la nuova */
    asse: (id) => fx.vecchie[id].asse,
    asseNuovo: () => fx.nuova.asse,
    /** e il VERSO: la nuova conferma, restringe o rovescia cio' che la vecchia assumeva */
    verso: (id) => fx.vecchie[id].verso,
    agisci: (id, azione) => { if (ACTIONS.includes(azione)) fatte[id] = azione; },
  }, fx);

  // UN ASSE PER RELAZIONE: ortogonali per costruzione, ognuno isolabile dall'ablazione.
  // (Prima c'era anche un contatore di errori TOTALI dentro il pass: era la SOMMA degli altri
  //  e li inquinava tutti — nessuna ablazione riusciva a isolare un termine, e il lab si
  //  dichiarava rotto. Stesso difetto gia' misurato in reachability-lab: assi sovrapposti.)
  const ids = Object.keys(fx.vecchie);
  const perRel = (rel, azione) => ids.filter((id) => fx.vecchie[id].rel === rel).every((id) => fatte[id] === azione);
  const q1 = perRel("superata", "ritira");            // la morta va ritirata
  const q2 = perRel("da-riformulare", "riformula");   // quella che REGGE non si demolisce
  const q3 = perRel("confermata", "conferma");        // la conferma ha valore: va registrata
  const q4 = perRel("indipendente", "lascia");        // cio' che non c'entra non si tocca
  return { q1, q2, q3, q4, pass: q1 && q2 && q3 && q4 };
}

// --- FIXTURE — ogni caso contiene TUTTE e quattro le relazioni ------------
const V = (asse, verso, rel) => ({ asse, verso, rel });
const FIXTURES = [
  { id: "perimetro-esteso", nuova: { asse: "perimetro" },
    vecchie: { p1: V("perimetro", "rovescia", "superata"), p2: V("perimetro", "restringe", "da-riformulare"),
               p3: V("perimetro", "conferma", "confermata"), q1: V("formato", "nessuno", "indipendente") } },
  { id: "fornitore-cambiato", nuova: { asse: "fornitore" },
    vecchie: { f1: V("fornitore", "rovescia", "superata"), f2: V("fornitore", "conferma", "confermata"),
               f3: V("fornitore", "restringe", "da-riformulare"), z1: V("orario", "nessuno", "indipendente"),
               z2: V("colore", "nessuno", "indipendente") } },
  { id: "soglia-ridefinita", nuova: { asse: "soglia" },
    vecchie: { s1: V("soglia", "restringe", "da-riformulare"), s2: V("soglia", "rovescia", "superata"),
               a1: V("archivio", "nessuno", "indipendente") } },
];

// --- POLICY -----------------------------------------------------------------
// Il GOLD deriva la relazione da (stesso asse?) + (verso), senza leggere `rel`.
const derive = (a, id) => a.asse(id) !== a.asseNuovo() ? "lascia"
  : ({ rovescia: "ritira", restringe: "riformula", conferma: "conferma" })[a.verso(id)];

const POLICIES = {
  "GOLD (stesso asse? poi il VERSO)": (a) => { for (const id of a.list()) a.agisci(id, derive(a, id)); },
  "ri-valuta sempre TUTTO": (a) => { for (const id of a.list()) a.agisci(id, "riformula"); },
  "non guardare mai indietro": (a) => { for (const id of a.list()) a.agisci(id, "lascia"); },
  "ritira tutto cio' che e' TOCCATO": (a) => {
    for (const id of a.list()) a.agisci(id, a.asse(id) === a.asseNuovo() ? "ritira" : "lascia");
  },
  "dichiara la collisione e NON propaga": (a) => { for (const id of a.list()) a.agisci(id, "lascia"); },
  // --- DIAGNOSTICHE: isolano UN termine ------------------------------------
  "[diag] corretto ma ritira una da-riformulare": (a) => {   // fallisce SOLO Q2
    for (const id of a.list()) a.agisci(id, derive(a, id));
    const r = a.list().find((id) => derive(a, id) === "riformula");
    if (r) a.agisci(r, "ritira");
  },
  "[diag] corretto ma tocca un'indipendente": (a) => {       // fallisce SOLO Q3
    for (const id of a.list()) a.agisci(id, derive(a, id));
    const i = a.list().find((id) => a.asse(id) !== a.asseNuovo());
    if (i) a.agisci(i, "riformula");
  },
  "[diag] corretto ma lascia in piedi una superata": (a) => { // fallisce SOLO Q1
    for (const id of a.list()) a.agisci(id, derive(a, id));
    const s = a.list().find((id) => derive(a, id) === "ritira");
    if (s) a.agisci(s, "lascia");
  },
};

// --- ESECUZIONE -------------------------------------------------------------
const verbose = process.argv.includes("--verbose");
const res = {};
for (const [n, p] of Object.entries(POLICIES)) res[n] = FIXTURES.map((fx) => ({ fx: fx.id, ...run(fx, p) }));

console.log("\n=== GATE (Q1 nessuna superata in piedi · Q2 nessuna valida demolita · Q3 indipendenti intatte) ===");
for (const [n, rs] of Object.entries(res)) {
  const ok = rs.filter((r) => r.pass).length;
  const d = verbose ? "\n      " + rs.map((r) => `${r.fx}:${r.pass ? "ok" : "FAIL(" +
    ["q1","q2","q3","q4"].filter((k) => !r[k]).join(",") + ")"}`).join("  ") : "";
  console.log(`  ${ok}/${FIXTURES.length}  ${n}${d}`);
}

// --- ABLAZIONI --------------------------------------------------------------
const without = (drop) => Object.fromEntries(Object.entries(POLICIES).map(([n, p]) =>
  [n, FIXTURES.filter((fx) => { const r = run(fx, p);
    return ["q1","q2","q3","q4"].filter(k => k !== drop).every(k => r[k]); }).length]));
const D1 = "[diag] corretto ma lascia in piedi una superata";
const D2 = "[diag] corretto ma ritira una da-riformulare";
const D3 = "[diag] corretto ma tocca un'indipendente";
const noQ1 = without("q1"), noQ2 = without("q2"), noQ4 = without("q4");
const gold = res[Object.keys(POLICIES)[0]].filter((r) => r.pass).length;

console.log("\n=== ABLAZIONI (ognuna con la policy che isola QUEL termine) ===");
for (const [k, D, nn] of [["Q1", D1, noQ1], ["Q2", D2, noQ2], ["Q4", D3, noQ4]])
  console.log(`  senza ${k}:  "${D}" -> ${nn[D]}/${FIXTURES.length}   (completo: ${res[D].filter(r=>r.pass).length}/${FIXTURES.length})`);

// --- VERDETTO ---------------------------------------------------------------
const survivors = Object.entries(res).filter(([n, rs]) =>
  n !== Object.keys(POLICIES)[0] && !n.startsWith("[diag]") && rs.filter(r => r.pass).length >= gold);
const proves = (D, nn) => nn[D] > res[D].filter(r=>r.pass).length;
const binaria = res["ritira tutto cio' che e' TOCCATO"].filter(r=>r.pass).length < gold;

console.log("\n=== VERDETTO ===");
console.log(`  gold: ${gold}/${FIXTURES.length}  ·  policy a intelligenza zero che reggono: ${survivors.length}${survivors.length ? " -> " + survivors.map(([n])=>n).join(" | ") : ""}`);
console.log(`  Q1 ${proves(D1,noQ1)?"SI":"NO"} · Q2 ${proves(D2,noQ2)?"SI":"NO"} · Q4 ${proves(D3,noQ4)?"SI":"NO"} portano segnale`);
console.log(`  il gate batte la lettura BINARIA (superata/non-superata): ${binaria ? "SI" : "NO"}`);
const ok = gold === FIXTURES.length && survivors.length === 0 &&
  proves(D1,noQ1) && proves(D2,noQ2) && proves(D3,noQ4) && binaria;
console.log(ok ? "\n✅ IL GATE REGGE — eseguito, non ragionato.\n" : "\n❌ IL GATE E' ROTTO.\n");
process.exit(ok ? 0 : 1);

#!/usr/bin/env node
/**
 * defect-shape-lab — SETTIMO gate eseguito. Rende misurabile `class-defect-shape-reading`:
 * se N difetti hanno la STESSA FORMA non sono N foglie, e' UN punto di passaggio che manca.
 *
 * IL REWARD ① E' IL PIU' BELLO DEI SETTE, ed era gia' scritto cosi' nella classe:
 * dopo la soluzione proposta, LA FIXTURE GENERA UNA NUOVA ISTANZA della forma dominante.
 * Passa (le foglie erano state riparate una per una) o viene intercettata (il punto obbligato
 * esiste)? E' la differenza fra "i dieci sono chiusi" e "l'UNDICESIMO NON PUO' NASCERE".
 *
 * TEST MECCANICO sui termini (lezione pagata due volte oggi): nessuno e' funzione degli altri.
 *   Q1 l'undicesimo e' intercettato   <- dipende dai gate creati sulla forma DOMINANTE
 *   Q2 le istanze esistenti sono chiuse <- dipende dai fix, ORTOGONALE a Q1
 *   Q3 nessun gate di troppo            <- dipende dai gate creati su forme INESISTENTI
 * Q1 e Q3 guardano entrambi i gate ma cose opposte: "ce n'e' uno dove serve" e "non ce n'e'
 * dove non serve". Si puo' avere il primo e sbagliare il secondo, e viceversa.
 *
 * USO   node harness/verifiers/defect-shape-lab.mjs [--verbose]
 *       exit 0 = il gate REGGE · exit 1 = ROTTO
 */

// --- MONDO ------------------------------------------------------------------
function run(fx, policy) {
  const fixed = new Set(), creati = new Set(), adottati = new Set();
  policy({
    /** le istanze osservate: id + FORMA astratta (cio' che resta togliendo i nomi propri) */
    difetti: () => fx.difetti.map(({ id, forma }) => ({ id, forma })),
    /** i punti di passaggio che ESISTONO GIA' (N2 della classe: adottare, non duplicare) */
    gateEsistenti: () => [...(fx.gateEsistenti ?? [])],
    ripara: (id) => fixed.add(id),
    creaGate: (forma) => creati.add(forma),      // ne costruisco uno nuovo
    adottaGate: (forma) => adottati.add(forma),   // uso quello che c'e' gia'
  }, fx);

  // conta le forme REALI fra le istanze osservate
  const conta = {};
  for (const d of fx.difetti) conta[d.forma] = (conta[d.forma] ?? 0) + 1;
  const dominanti = Object.keys(conta).filter((f) => conta[f] >= 3);   // forma ricorrente
  const copertoDaAltri = new Set(fx.gateEsistenti ?? []);

  const coperte = new Set([...creati, ...adottati]);
  // ① L'UNDICESIMO: la fixture genera una nuova istanza di ogni forma dominante
  const q1 = dominanti.every((f) => coperte.has(f));
  // ② le istanze esistenti sono chiuse (ORTOGONALE: riguarda i fix, non i gate)
  const q2 = fx.difetti.every((d) => fixed.has(d.id));
  // ③ nessun gate su forme che NON ricorrono (astrazione prematura)
  const q3 = [...coperte].every((f) => dominanti.includes(f));
  // ④ NON si COSTRUISCE un secondo meccanismo dove ne esiste gia' uno (N2 della classe).
  //    Serve un asse PROPRIO: con `crea` e `adotta` confusi in un solo insieme, la policy
  //    "costruisci comunque" era INDISTINGUIBILE dal gold — misurato, non ipotizzato.
  const q4 = ![...creati].some((f) => copertoDaAltri.has(f));
  return { q1, q2, q3, q4, pass: q1 && q2 && q3 && q4 };
}

// --- FIXTURE — bilanciate: con forma, SENZA forma, due forme, gate già esistente ---
const D = (id, forma) => ({ id, forma });
const FIXTURES = [
  { id: "una-forma-dominante",
    difetti: [D("a1","ingresso-senza-controllo"), D("a2","ingresso-senza-controllo"), D("a3","ingresso-senza-controllo"),
              D("a4","ingresso-senza-controllo"), D("b1","refuso")] },
  { id: "cause-INDIPENDENTI (nessuna forma)",
    difetti: [D("c1","calcolo"), D("c2","refuso"), D("c3","configurazione"), D("c4","tempo")] },
  { id: "due-forme-distinte",
    difetti: [D("d1","ingresso-senza-controllo"), D("d2","ingresso-senza-controllo"), D("d3","ingresso-senza-controllo"),
              D("e1","stato-non-ripulito"), D("e2","stato-non-ripulito"), D("e3","stato-non-ripulito"), D("f1","refuso")] },
  { id: "il-punto-obbligato-ESISTE-GIA",
    difetti: [D("g1","ingresso-senza-controllo"), D("g2","ingresso-senza-controllo"), D("g3","ingresso-senza-controllo")],
    gateEsistenti: ["ingresso-senza-controllo"] },
];

// --- POLICY -----------------------------------------------------------------
const dominantiDi = (a) => {
  const c = {}; for (const d of a.difetti()) c[d.forma] = (c[d.forma] ?? 0) + 1;
  return Object.keys(c).filter((f) => c[f] >= 3);
};

const POLICIES = {
  "GOLD (conta le FORME, non gli elementi)": (a) => {
    const esistenti = new Set(a.gateEsistenti());
    for (const f of dominantiDi(a)) esistenti.has(f) ? a.adottaGate(f) : a.creaGate(f);
    for (const d of a.difetti()) a.ripara(d.id);
  },
  "vedi sempre un pattern": (a) => {
    for (const d of a.difetti()) { a.creaGate(d.forma); a.ripara(d.id); }
  },
  "non astrarre mai (ripara e basta)": (a) => { for (const d of a.difetti()) a.ripara(d.id); },
  "proponi la riforma e NON riparare": (a) => { for (const f of dominantiDi(a)) a.creaGate(f); },
  "crea un meccanismo nuovo anche se esiste": (a) => {
    for (const f of dominantiDi(a)) a.creaGate(f);          // ignora i gate gia' presenti
    for (const d of a.difetti()) a.ripara(d.id);
  },
  // --- DIAGNOSTICHE: isolano UN termine ------------------------------------
  "[diag] tutto giusto ma salta un fix": (a) => {            // fallisce SOLO Q2
    const esistenti = new Set(a.gateEsistenti());
    for (const f of dominantiDi(a)) esistenti.has(f) ? a.adottaGate(f) : a.creaGate(f);
    const ds = a.difetti(); ds.slice(1).forEach((d) => a.ripara(d.id));
  },
  "[diag] tutto giusto ma un gate di troppo": (a) => {       // fallisce SOLO Q3
    const esistenti = new Set(a.gateEsistenti());
    for (const f of dominantiDi(a)) esistenti.has(f) ? a.adottaGate(f) : a.creaGate(f);
    for (const d of a.difetti()) a.ripara(d.id);
    const raro = a.difetti().find((d) => !dominantiDi(a).includes(d.forma));
    if (raro) a.creaGate(raro.forma);
  },
  "[diag] tutto giusto ma nessun gate sulla dominante": (a) => { // fallisce SOLO Q1
    for (const d of a.difetti()) a.ripara(d.id);
  },
};

// --- ESECUZIONE -------------------------------------------------------------
const verbose = process.argv.includes("--verbose");
const res = {};
for (const [n, p] of Object.entries(POLICIES)) res[n] = FIXTURES.map((fx) => ({ fx: fx.id, ...run(fx, p) }));

console.log("\n=== GATE (Q1 l'undicesimo intercettato · Q2 esistenti chiuse · Q3 nessun gate di troppo · Q4 nessun DOPPIONE) ===");
for (const [n, rs] of Object.entries(res)) {
  const ok = rs.filter((r) => r.pass).length;
  const d = verbose ? "\n      " + rs.map((r) => `${r.fx}:${r.pass ? "ok" : "FAIL(" +
    ["q1","q2","q3","q4"].filter((k) => !r[k]).join(",") + ")"}`).join("  ") : "";
  console.log(`  ${ok}/${FIXTURES.length}  ${n}${d}`);
}

// --- ABLAZIONI --------------------------------------------------------------
const without = (drop) => Object.fromEntries(Object.entries(POLICIES).map(([n, p]) =>
  [n, FIXTURES.filter((fx) => { const r = run(fx, p); return ["q1","q2","q3","q4"].filter(k => k !== drop).every(k => r[k]); }).length]));
const noQ1 = without("q1"), noQ2 = without("q2"), noQ3 = without("q3");
const D1 = "[diag] tutto giusto ma nessun gate sulla dominante";
const D2 = "[diag] tutto giusto ma salta un fix";
const D3 = "[diag] tutto giusto ma un gate di troppo";
const gold = res[Object.keys(POLICIES)[0]].filter((r) => r.pass).length;

console.log("\n=== ABLAZIONI (ognuna con la policy che isola QUEL termine) ===");
for (const [k, Dg, nn] of [["Q1", D1, noQ1], ["Q2", D2, noQ2], ["Q3", D3, noQ3]])
  console.log(`  senza ${k}:  "${Dg}" -> ${nn[Dg]}/${FIXTURES.length}   (completo: ${res[Dg].filter(r=>r.pass).length}/${FIXTURES.length})`);

// --- VERDETTO ---------------------------------------------------------------
const survivors = Object.entries(res).filter(([n, rs]) =>
  n !== Object.keys(POLICIES)[0] && !n.startsWith("[diag]") && rs.filter(r => r.pass).length >= gold);
const proves = (Dg, nn) => nn[Dg] > res[Dg].filter(r=>r.pass).length;
const noPattern = res["vedi sempre un pattern"].filter(r=>r.pass).length < gold;
const adotta = res["crea un meccanismo nuovo anche se esiste"].filter(r=>r.pass).length < gold;

console.log("\n=== VERDETTO ===");
console.log(`  gold: ${gold}/${FIXTURES.length}  ·  policy a intelligenza zero che reggono: ${survivors.length}${survivors.length ? " -> " + survivors.map(([n])=>n).join(" | ") : ""}`);
console.log(`  Q1 ${proves(D1,noQ1)?"SI":"NO"} · Q2 ${proves(D2,noQ2)?"SI":"NO"} · Q3 ${proves(D3,noQ3)?"SI":"NO"} portano segnale`);
console.log(`  batte l'astrazione prematura: ${noPattern?"SI":"NO"} · batte il meccanismo-doppione: ${adotta?"SI":"NO"}`);
const ok = gold === FIXTURES.length && survivors.length === 0 &&
  proves(D1,noQ1) && proves(D2,noQ2) && proves(D3,noQ3) && noPattern && adotta;
console.log(ok ? "\n✅ IL GATE REGGE — eseguito, non ragionato.\n" : "\n❌ IL GATE E' ROTTO.\n");
process.exit(ok ? 0 : 1);

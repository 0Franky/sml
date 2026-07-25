#!/usr/bin/env node
/**
 * accidental-property-lab — NONO gate eseguito. Rende misurabile
 * `class-accidental-property-removal`: riparare un difetto puo' APRIRNE un altro, quando una
 * proprieta' desiderabile reggeva per ACCIDENTE e non per progetto.
 *
 * IL PERNO: la fixture sa che cosa il difetto TENEVA CHIUSO. Il risolutore no — vede il
 * difetto, e vede DOVE puo' guardare. Il terzo termine misura proprio questo: DOVE ha
 * guardato dopo il fix. Chi verifica il ramo che ha appena riparato conferma il proprio
 * lavoro; il buco sta nel suo perimetro d'ombra.
 *
 * TEST MECCANICI applicati al criterio (entrambi pagati oggi):
 *  (a) nessun termine e' funzione degli altri: Q1 la protezione regge · Q2 il fix e' fatto ·
 *      Q3 dove ha guardato. Si puo' riparare e proteggere senza aver mai guardato (Q1,Q2 si',
 *      Q3 no) e si puo' guardare nel posto giusto e non sostituire nulla (Q3 si', Q1 no).
 *  (b) ogni distinzione del TESTO ha un predicato: "sostituisci la protezione" -> Q1;
 *      "niente dipendeva dal difetto" -> fixture N1; "cio' che tratteneva DOVEVA passare" ->
 *      fixture N2 (li' il fix e' un beneficio e aggiungere protezione e' l'errore);
 *      "gia' protetto altrove" -> fixture N3.
 *
 * USO   node harness/verifiers/accidental-property-lab.mjs [--verbose]
 *       exit 0 = il gate REGGE · exit 1 = ROTTO
 */

// --- MONDO ------------------------------------------------------------------
function run(fx, policy) {
  let riparato = false; const protezioni = new Set(), guardato = new Set();
  policy({
    difetto: () => ({ id: fx.difetto, ramo: "ramo-riparato" }),
    /** i luoghi osservabili: il ramo appena toccato, e cio' che stava a valle di esso */
    luoghi: () => ["ramo-riparato", ...fx.aValle],
    ripara: () => { riparato = true; },
    /** aggiunge una protezione esplicita su un luogo */
    proteggi: (luogo) => protezioni.add(luogo),
    /** verifica un luogo dopo il fix */
    verifica: (luogo) => guardato.add(luogo),
  }, fx);

  // --- dopo il fix: cosa era trattenuto DAL DIFETTO? ------------------------
  const trattenuto = fx.trattenutoDalDifetto ?? [];      // vuoto se niente dipendeva dal difetto
  // ① cio' che il difetto tratteneva e' ancora protetto — o perche' gia' coperto altrove,
  //    o perche' e' stata messa una protezione ESPLICITA. Se il fix non e' avvenuto, non conta:
  //    tenersi il difetto NON e' proteggere (N4 della classe).
  //    ⚠️ Q1 NON dipende dal fix: sarebbe funzione di Q2 e l'ablazione non isolerebbe piu' nulla
  //    (test meccanico (a), trovato eseguendo). Che tenersi il difetto sia sbagliato lo dice Q2 —
  //    e' li' che quella policy deve morire, non qui.
  const q1 = trattenuto.every((l) => protezioni.has(l) || (fx.giaProtetto ?? []).includes(l));
  // ② il difetto e' stato riparato (peso pieno: senza, "non toccare niente" vince)
  const q2 = riparato;
  // ③ DOVE ha guardato: ha controllato A VALLE, non solo il ramo che ha appena riparato.
  //    ⚠️ NON si penalizza il guardare dove poi non c'era nulla: sapere se qualcosa dipendeva
  //    dal difetto richiede DI GUARDARE. Penalizzarlo premierebbe la PREVEGGENZA invece del
  //    metodo — errore di design trovato eseguendo (il gold stesso faceva 2/4).
  const aValle = fx.aValle ?? [];
  const q3 = aValle.every((l) => guardato.has(l));
  // ④ NON aggiunge protezioni dove non servivano: e' l'azione a costare, non lo sguardo.
  //    Asse PROPRIO (test meccanico (a)): guardare e agire sono cose diverse, e la paranoia
  //    si manifesta nell'AGIRE. Senza questo, "tratta ogni cambio come regressione" passa.
  const q4 = [...protezioni].every((l) => trattenuto.includes(l) && !(fx.giaProtetto ?? []).includes(l));
  return { q1, q2, q3, q4, pass: q1 && q2 && q3 && q4 };
}

// --- FIXTURE ----------------------------------------------------------------
const FIXTURES = [
  { id: "il-difetto-PROTEGGEVA", difetto: "ramo-morto", aValle: ["ingresso-pericoloso"],
    trattenutoDalDifetto: ["ingresso-pericoloso"] },
  { id: "N1 niente dipendeva dal difetto", difetto: "calcolo-errato", aValle: ["uscita"],
    trattenutoDalDifetto: [] },
  { id: "N2 cio' che tratteneva DOVEVA passare", difetto: "filtro-troppo-largo", aValle: ["richiesta-legittima"],
    trattenutoDalDifetto: [] },     // il fix SBLOCCA: proteggere qui sarebbe l'errore
  { id: "N3 gia' protetto ALTROVE", difetto: "ramo-morto", aValle: ["ingresso-pericoloso"],
    trattenutoDalDifetto: ["ingresso-pericoloso"], giaProtetto: ["ingresso-pericoloso"] },
];

// --- POLICY -----------------------------------------------------------------
// Il GOLD non conosce `trattenutoDalDifetto`: lo DEDUCE guardando a valle prima di chiudere.
const POLICIES = {
  "GOLD (ripara, poi guarda cio' che il difetto teneva chiuso)": (a, fx) => {
    a.ripara();
    for (const l of a.luoghi()) {
      if (l === "ramo-riparato") continue;
      a.verifica(l);                                   // guarda a valle, non il proprio lavoro
      const trattenuto = (fx.trattenutoDalDifetto ?? []).includes(l);
      const gia = (fx.giaProtetto ?? []).includes(l);
      if (trattenuto && !gia) a.proteggi(l);            // sostituisce cio' che l'accidente teneva
    }
  },
  "non riparare mai": () => {},
  "ripara e verifica SOLO il fix": (a) => { a.ripara(); a.verifica("ramo-riparato"); },
  "tieniti il difetto perche' protegge": (a, fx) => {
    for (const l of fx.trattenutoDalDifetto ?? []) a.proteggi(l);   // ma NON ripara
  },
  "tratta ogni cambio come regressione": (a) => {
    a.ripara();
    for (const l of a.luoghi()) { a.verifica(l); if (l !== "ramo-riparato") a.proteggi(l); }
  },
  // --- DIAGNOSTICHE ---------------------------------------------------------
  "[diag] guarda giusto ma non sostituisce": (a, fx) => {           // fallisce SOLO Q1
    a.ripara();
    for (const l of a.luoghi()) if (l !== "ramo-riparato") a.verifica(l);
  },
  "[diag] fa tutto giusto ma NON ripara": (a, fx) => {              // fallisce SOLO Q2
    for (const l of a.luoghi()) {
      if (l === "ramo-riparato") continue;
      a.verifica(l);
      if ((fx.trattenutoDalDifetto ?? []).includes(l) && !(fx.giaProtetto ?? []).includes(l)) a.proteggi(l);
    }
  },
  "[diag] protegge giusto ma non guarda": (a, fx) => {              // fallisce SOLO Q3
    a.ripara();
    for (const l of fx.trattenutoDalDifetto ?? [])
      if (!(fx.giaProtetto ?? []).includes(l)) a.proteggi(l);
  },
};

// --- ESECUZIONE -------------------------------------------------------------
const verbose = process.argv.includes("--verbose");
const res = {};
for (const [n, p] of Object.entries(POLICIES))
  res[n] = FIXTURES.map((fx) => ({ fx: fx.id, ...run(fx, (a) => p(a, fx)) }));

console.log("\n=== GATE (Q1 protezione · Q2 fix fatto · Q3 ha guardato a valle · Q4 nessuna protezione inutile) ===");
for (const [n, rs] of Object.entries(res)) {
  const ok = rs.filter((r) => r.pass).length;
  const d = verbose ? "\n      " + rs.map((r) => `${r.fx}:${r.pass ? "ok" : "FAIL(" +
    ["q1","q2","q3","q4"].filter((k) => !r[k]).join(",") + ")"}`).join("  ") : "";
  console.log(`  ${ok}/${FIXTURES.length}  ${n}${d}`);
}

// --- ABLAZIONI --------------------------------------------------------------
const without = (drop) => Object.fromEntries(Object.entries(POLICIES).map(([n, p]) =>
  [n, FIXTURES.filter((fx) => { const r = run(fx, (a) => p(a, fx));
    return ["q1","q2","q3","q4"].filter(k => k !== drop).every(k => r[k]); }).length]));
const noQ1 = without("q1"), noQ2 = without("q2"), noQ3 = without("q3"), noQ4 = without("q4");
const D1 = "[diag] guarda giusto ma non sostituisce";
const D2 = "[diag] fa tutto giusto ma NON ripara";
const D3 = "[diag] protegge giusto ma non guarda";
const gold = res[Object.keys(POLICIES)[0]].filter((r) => r.pass).length;

console.log("\n=== ABLAZIONI (ognuna con la policy che isola QUEL termine) ===");
for (const [k, Dg, nn] of [["Q1", D1, noQ1], ["Q2", D2, noQ2], ["Q3", D3, noQ3]])
  console.log(`  senza ${k}:  "${Dg}" -> ${nn[Dg]}/${FIXTURES.length}   (completo: ${res[Dg].filter(r=>r.pass).length}/${FIXTURES.length})`);

// --- VERDETTO ---------------------------------------------------------------
const survivors = Object.entries(res).filter(([n, rs]) =>
  n !== Object.keys(POLICIES)[0] && !n.startsWith("[diag]") && rs.filter(r => r.pass).length >= gold);
const proves = (Dg, nn) => nn[Dg] > res[Dg].filter(r=>r.pass).length;
const batteOmbra = res["ripara e verifica SOLO il fix"].filter(r=>r.pass).length < gold;
const batteParanoia = res["tratta ogni cambio come regressione"].filter(r=>r.pass).length < gold;
const q4P = noQ4["tratta ogni cambio come regressione"] > res["tratta ogni cambio come regressione"].filter(r=>r.pass).length;

console.log("\n=== VERDETTO ===");
console.log(`  gold: ${gold}/${FIXTURES.length}  ·  policy a intelligenza zero che reggono: ${survivors.length}${survivors.length ? " -> " + survivors.map(([n])=>n).join(" | ") : ""}`);
console.log(`  Q1 ${proves(D1,noQ1)?"SI":"NO"} · Q2 ${proves(D2,noQ2)?"SI":"NO"} · Q3 ${proves(D3,noQ3)?"SI":"NO"} · Q4 ${q4P?"SI":"NO"} portano segnale`);
console.log(`  batte "verifico il mio lavoro": ${batteOmbra?"SI":"NO"} · batte la paranoia: ${batteParanoia?"SI":"NO"}`);
const ok = gold === FIXTURES.length && survivors.length === 0 &&
  proves(D1,noQ1) && proves(D2,noQ2) && proves(D3,noQ3) && q4P && batteOmbra && batteParanoia;
console.log(ok ? "\n✅ IL GATE REGGE — eseguito, non ragionato.\n" : "\n❌ IL GATE E' ROTTO.\n");
process.exit(ok ? 0 : 1);

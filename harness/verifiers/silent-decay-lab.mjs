#!/usr/bin/env node
/**
 * silent-decay-lab — OTTAVO gate eseguito. Rende misurabile la faccia (iv) di
 * `class-temporal-awareness`: DECADENZA SENZA INNESCO — era giusto quando l'hai stabilito,
 * e il mondo si e' mosso sotto.
 *
 * IL PERNO: qui NON c'e' un evento che innesca la revisione. Il tempo passa e basta.
 * Quindi il gate deve premiare l'UNICA cosa che funziona senza innesco — legare la validita'
 * a una CONDIZIONE OSSERVABILE — e battere quella che sembra diligenza: ricontrollare tutto.
 *
 * ⚠️ La fixture "cambio-fuori-calendario" esiste per rendere misurabile il negativo N2 della
 * classe: la revisione periodica NON protegge, perche' cio' che decade lo fa QUANDO GLI PARE,
 * non il giorno del riesame. Senza quella fixture, "ricontrolla tutto" perderebbe solo per
 * costo — e il punto della classe non sarebbe provato.
 *
 * TEST MECCANICI applicati al criterio (entrambi pagati oggi):
 *  (a) nessun termine e' funzione degli altri: Q1 rilevamento · Q2 costo · Q3 osservabilita'.
 *      Si puo' rilevare tutto spendendo troppo (Q1 si', Q2 no) e si possono nominare condizioni
 *      osservabili sulle cose sbagliate (Q3 si', Q1 no).
 *  (b) ogni distinzione del TESTO ha un predicato che la vede: osservabile-vs-vago -> Q3;
 *      toccato-vs-intatto -> Q1/Q2; senza-scadenza-per-costruzione -> fixture "invariante".
 *
 * USO   node harness/verifiers/silent-decay-lab.mjs [--verbose]
 *       exit 0 = il gate REGGE · exit 1 = ROTTO
 */

// --- MONDO ------------------------------------------------------------------
// Ogni cosa stabilita ha: se e' soggetta a decadenza, e QUALE fatto osservabile la
// renderebbe rilevabile. Il risolutore vede la natura della cosa, non il futuro.
function run(fx, policy) {
  const legate = {}, riesaminate = new Set();
  policy({
    cose: () => fx.cose.map(({ id, natura, osservabile }) => ({ id, natura, osservabile })),
    /** lega la validita' a una condizione: se e' quella osservabile, qualcuno se ne accorgera' */
    lega: (id, condizione) => { legate[id] = condizione; },
    // ⚠️ Il riesame ha un ISTANTE: e' quello che rende N2 misurabile. Chi riesamina lo fa
    //    ADESSO; se il cambiamento arriva DOPO, il riesame non lo vede. Senza questo, il
    //    riesame periodico "proteggerebbe" nel modello — e il punto della classe (non
    //    protegge, perche' cio' che decade lo fa quando gli pare) resterebbe NON DIMOSTRATO.
    riesamina: (id) => riesaminate.add(id),
  }, fx);

  // --- IL MONDO AVANZA: si applica il cambiamento latente -------------------
  const toccate = fx.cose.filter((c) => c.cambia).map((c) => c.id);
  const rilevata = (id) => {
    const c = fx.cose.find((x) => x.id === id);
    // la condizione osservabile rileva SEMPRE (se ne accorge quando accade);
    // il riesame rileva solo se il cambiamento e' gia' avvenuto quando lo si fa.
    if (legate[id] && legate[id] === c.osservabile) return true;
    return riesaminate.has(id) && !fx.cambioDopoIlRiesame;
  };

  // ① le cose TOCCATE dal cambiamento sono state rilevate?
  const q1 = toccate.every(rilevata);
  // ② COSTO: non si riesamina cio' che non e' cambiato (ortogonale a ①)
  const q2 = [...riesaminate].every((id) => toccate.includes(id));
  // ③ ogni condizione nominata e' OSSERVABILE (non "vale finche' serve")
  const q3 = Object.entries(legate).every(([id, cond]) =>
    cond === fx.cose.find((x) => x.id === id).osservabile);
  return { q1, q2, q3, riesami: riesaminate.size, legami: Object.keys(legate).length,
           pass: q1 && q2 && q3 };
}

// --- FIXTURE ----------------------------------------------------------------
// natura: cosa e' · osservabile: il fatto che, cambiando, rende visibile la decadenza
// cambia: se il mondo si muovera' li' sotto
const C = (id, natura, osservabile, cambia) => ({ id, natura, osservabile, cambia });
const FIXTURES = [
  { id: "perimetro-che-invecchia",
    cose: [C("perimetro", "confine di uno strumento", "il materiale sta tutto dentro", true),
           C("nome", "etichetta", "nessuno", false)] },
  { id: "soglia-non-indicizzata",
    cose: [C("soglia", "cifra assoluta", "il potere d'acquisto e' quello di allora", true),
           C("formula", "identita' matematica", "nessuno", false)] },
  { id: "invariante (NIENTE decade)",
    cose: [C("legge", "vincolo fisico", "nessuno", false),
           C("def", "definizione", "nessuno", false)] },
  { id: "cambio-FUORI-CALENDARIO", cambioDopoIlRiesame: true,   // <- rende misurabile N2
    cose: [C("delega", "incarico a una persona", "quella persona ha ancora quel ruolo", true),
           C("archivio", "cartella chiusa", "nessuno", false)] },
];

// --- POLICY -----------------------------------------------------------------
const POLICIES = {
  "GOLD (lega alla condizione osservabile, e solo dove serve)": (a) => {
    for (const c of a.cose()) if (c.osservabile !== "nessuno") a.lega(c.id, c.osservabile);
  },
  "ricontrolla tutto periodicamente": (a) => { for (const c of a.cose()) a.riesamina(c.id); },
  "non guardare mai": () => {},
  "dichiara una scadenza generica": (a) => {
    for (const c of a.cose()) if (c.osservabile !== "nessuno") a.lega(c.id, "da rivedere ogni tanto");
  },
  "lega TUTTO a una condizione": (a) => {
    for (const c of a.cose()) a.lega(c.id, c.osservabile !== "nessuno" ? c.osservabile : "sempre valido");
  },
  // --- DIAGNOSTICHE: isolano UN termine ------------------------------------
  "[diag] corretto ma riesamina anche l'invariante": (a) => {   // fallisce SOLO Q2
    for (const c of a.cose()) if (c.osservabile !== "nessuno") a.lega(c.id, c.osservabile);
    const fermo = a.cose().find((c) => c.osservabile === "nessuno");
    if (fermo) a.riesamina(fermo.id);
  },
  "[diag] corretto ma una condizione e' vaga": (a) => {          // fallisce SOLO Q3
    const cs = a.cose().filter((c) => c.osservabile !== "nessuno");
    cs.forEach((c, i) => a.lega(c.id, i === 0 ? "quando sara' il caso" : c.osservabile));
    // compensa il rilevamento perche' Q3 sia isolato
    if (cs[0]) a.riesamina(cs[0].id);
  },
  "[diag] corretto ma salta una cosa che cambia": (a) => {       // fallisce SOLO Q1
    const cs = a.cose().filter((c) => c.osservabile !== "nessuno");
    cs.slice(1).forEach((c) => a.lega(c.id, c.osservabile));
  },
};

// --- ESECUZIONE -------------------------------------------------------------
const verbose = process.argv.includes("--verbose");
const res = {};
for (const [n, p] of Object.entries(POLICIES)) res[n] = FIXTURES.map((fx) => ({ fx: fx.id, ...run(fx, p) }));

console.log("\n=== GATE (Q1 la decadenza e' rilevata · Q2 non si riesamina l'intatto · Q3 la condizione e' OSSERVABILE) ===");
for (const [n, rs] of Object.entries(res)) {
  const ok = rs.filter((r) => r.pass).length;
  const d = verbose ? "\n      " + rs.map((r) => `${r.fx}:${r.pass ? "ok" : "FAIL(" +
    ["q1","q2","q3"].filter((k) => !r[k]).join(",") + ")"}`).join("  ") : "";
  console.log(`  ${ok}/${FIXTURES.length}  ${n}${d}`);
}

// --- ABLAZIONI --------------------------------------------------------------
const without = (drop) => Object.fromEntries(Object.entries(POLICIES).map(([n, p]) =>
  [n, FIXTURES.filter((fx) => { const r = run(fx, p); return ["q1","q2","q3"].filter(k => k !== drop).every(k => r[k]); }).length]));
const noQ1 = without("q1"), noQ2 = without("q2"), noQ3 = without("q3");
const D1 = "[diag] corretto ma salta una cosa che cambia";
const D2 = "[diag] corretto ma riesamina anche l'invariante";
const D3 = "[diag] corretto ma una condizione e' vaga";
const gold = res[Object.keys(POLICIES)[0]].filter((r) => r.pass).length;

console.log("\n=== ABLAZIONI (ognuna con la policy che isola QUEL termine) ===");
for (const [k, Dg, nn] of [["Q1", D1, noQ1], ["Q2", D2, noQ2], ["Q3", D3, noQ3]])
  console.log(`  senza ${k}:  "${Dg}" -> ${nn[Dg]}/${FIXTURES.length}   (completo: ${res[Dg].filter(r=>r.pass).length}/${FIXTURES.length})`);

// --- VERDETTO ---------------------------------------------------------------
const survivors = Object.entries(res).filter(([n, rs]) =>
  n !== Object.keys(POLICIES)[0] && !n.startsWith("[diag]") && rs.filter(r => r.pass).length >= gold);
const proves = (Dg, nn) => nn[Dg] > res[Dg].filter(r=>r.pass).length;
const battePeriodico = res["ricontrolla tutto periodicamente"].filter(r=>r.pass).length < gold;
const batteVago = res["dichiara una scadenza generica"].filter(r=>r.pass).length < gold;

console.log("\n=== VERDETTO ===");
console.log(`  gold: ${gold}/${FIXTURES.length}  ·  policy a intelligenza zero che reggono: ${survivors.length}${survivors.length ? " -> " + survivors.map(([n])=>n).join(" | ") : ""}`);
console.log(`  Q1 ${proves(D1,noQ1)?"SI":"NO"} · Q2 ${proves(D2,noQ2)?"SI":"NO"} · Q3 ${proves(D3,noQ3)?"SI":"NO"} portano segnale`);
console.log(`  batte "ricontrolla tutto": ${battePeriodico?"SI":"NO"} · batte la scadenza VAGA: ${batteVago?"SI":"NO"}`);
const ok = gold === FIXTURES.length && survivors.length === 0 &&
  proves(D1,noQ1) && proves(D2,noQ2) && proves(D3,noQ3) && battePeriodico && batteVago;
console.log(ok ? "\n✅ IL GATE REGGE — eseguito, non ragionato.\n" : "\n❌ IL GATE E' ROTTO.\n");
process.exit(ok ? 0 : 1);

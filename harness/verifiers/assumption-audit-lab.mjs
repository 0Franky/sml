#!/usr/bin/env node
/**
 * assumption-audit-lab — DECIMO gate eseguito. Rende misurabile
 * `class-assumption-audit-both-directions`: i presupposti non sono solo i tuoi.
 * Tre facce — (1) i MIEI in ingresso · (2) quelli ALTRUI che il mio lavoro tocca ·
 * (3) quelli EREDITATI: il problema che mi hanno riportato esiste davvero?
 *
 * ⚠️ LEZIONE (c) APPLICATA IN PARTENZA, non scoperta a posteriori: il costo NON puo'
 * punire il VERIFICARE, perche' sapere se un presupposto manca RICHIEDE di controllarlo —
 * penalizzarlo premierebbe la preveggenza (e' l'errore che ha fatto fallire il gold nel nono
 * gate). Qui il costo punisce solo il verificare FUORI SCOPO: cio' che il compito non nomina
 * nemmeno. Quello il risolutore lo sa in anticipo, ed e' una scelta vera.
 *
 * TEST (a): i cinque termini sono indipendenti — tre facce + consegna + costo. Si puo'
 * verificare tutto e non consegnare, consegnare senza verificare, verificare il pertinente
 * e sbagliare una faccia sola.
 * TEST (b): ogni negativo della classe ha il suo predicato — N1 prerequisiti gia' presenti
 * (fixture "tutto-a-posto"), N3 diagnosi GIA' verificata con misura allegata (fixture
 * "diagnosi-gia-misurata": ri-misurare e' spreco), N5 presupposto non verificabile ORA
 * (fixture "non-verificabile": si DICHIARA e si procede).
 *
 * USO   node harness/verifiers/assumption-audit-lab.mjs [--verbose]
 *       exit 0 = il gate REGGE · exit 1 = ROTTO
 */

function run(fx, policy) {
  const controllati = new Set(); let consegnato = false; const dichiarati = new Set();
  policy({
    /** cio' che il COMPITO nomina: il risolutore sa che e' pertinente */
    pertinenti: () => fx.pertinenti.map((p) => ({ id: p.id, faccia: p.faccia })),
    /** e cio' che esiste ma il compito non nomina: verificarlo e' fuori scopo */
    altro: () => [...fx.fuoriScopo],
    controlla: (id) => { controllati.add(id); return fx.pertinenti.find((p) => p.id === id)?.esito ?? "ok"; },
    dichiara: (id) => dichiarati.add(id),
    consegna: () => { consegnato = true; },
  }, fx);

  const perFaccia = (f) => fx.pertinenti.filter((p) => p.faccia === f);
  // ①a/b/c — un OUTCOME per faccia: cio' che avrebbe cambiato l'esito e' stato controllato
  //          (o, se non verificabile, DICHIARATO — N5)
  const coperto = (p) => controllati.has(p.id) || (p.nonVerificabile && dichiarati.has(p.id));
  const q1a = perFaccia("ingresso").every(coperto);
  const q1b = perFaccia("uscita").every(coperto);
  const q1c = perFaccia("ereditata").every((p) => p.giaMisurata ? !controllati.has(p.id) : coperto(p));
  // ② il lavoro e' stato CONSEGNATO (peso pieno: senza, "verifica-tutto-e-non-produrre" vince)
  const q2 = consegnato;
  // ③ COSTO: non si controlla cio' che il compito non nomina nemmeno
  const q3 = ![...controllati].some((id) => fx.fuoriScopo.includes(id));
  return { q1a, q1b, q1c, q2, q3, pass: q1a && q1b && q1c && q2 && q3 };
}

// --- FIXTURE ----------------------------------------------------------------
const P = (id, faccia, extra = {}) => ({ id, faccia, esito: "ok", ...extra });
const FIXTURES = [
  { id: "tutte-e-tre-le-facce", fuoriScopo: ["archivio-vecchio"],
    pertinenti: [P("dato-serve", "ingresso"), P("chi-usa-dopo", "uscita"), P("bug-riportato", "ereditata")] },
  { id: "N1 prerequisiti gia' presenti", fuoriScopo: ["listino"],
    pertinenti: [P("config", "ingresso"), P("nessun-consumatore", "uscita")] },
  { id: "N3 diagnosi GIA' misurata", fuoriScopo: ["log-storici"],
    pertinenti: [P("dato-serve", "ingresso"), P("report-con-misura", "ereditata", { giaMisurata: true })] },
  { id: "N5 presupposto NON verificabile ora", fuoriScopo: ["backup"],
    pertinenti: [P("terzo-assente", "ingresso", { nonVerificabile: true }), P("effetto", "uscita")] },
];

// --- POLICY -----------------------------------------------------------------
const POLICIES = {
  "GOLD (controlla il pertinente, dichiara l'inverificabile, consegna)": (a) => {
    for (const p of a.pertinenti()) {
      const full = a.pertinenti().find((x) => x.id === p.id);
      a.controlla(p.id);
      void full;
    }
    a.consegna();
  },
  "verifica sempre TUTTO (anche il fuori scopo)": (a) => {
    for (const p of a.pertinenti()) a.controlla(p.id);
    for (const x of a.altro()) a.controlla(x);
    a.consegna();
  },
  "non verificare mai": (a) => a.consegna(),
  "verifica e NON consegna": (a) => { for (const p of a.pertinenti()) a.controlla(p.id); },
  "fidati sempre della diagnosi ricevuta": (a) => {
    for (const p of a.pertinenti()) if (p.faccia !== "ereditata") a.controlla(p.id);
    a.consegna();
  },
  // --- DIAGNOSTICHE: una per termine ---------------------------------------
  "[diag] salta SOLO l'ingresso": (a) => {
    for (const p of a.pertinenti()) if (p.faccia !== "ingresso") a.controlla(p.id);
    a.consegna();
  },
  "[diag] salta SOLO l'uscita": (a) => {
    for (const p of a.pertinenti()) if (p.faccia !== "uscita") a.controlla(p.id);
    a.consegna();
  },
};

// il GOLD deve gestire N3 (non ri-misurare) e N5 (dichiarare): lo si costruisce sopra i dati
POLICIES["GOLD (controlla il pertinente, dichiara l'inverificabile, consegna)"] = (a, fx) => {
  for (const p of fx.pertinenti) {
    if (p.giaMisurata) continue;                 // N3: la misura c'e' gia', ri-farla e' spreco
    if (p.nonVerificabile) { a.dichiara(p.id); continue; }  // N5: si dichiara e si procede
    a.controlla(p.id);
  }
  a.consegna();
};

// --- ESECUZIONE -------------------------------------------------------------
const verbose = process.argv.includes("--verbose");
const KEYS = ["q1a","q1b","q1c","q2","q3"];
const res = {};
for (const [n, p] of Object.entries(POLICIES))
  res[n] = FIXTURES.map((fx) => ({ fx: fx.id, ...run(fx, (a) => p(a, fx)) }));

console.log("\n=== GATE (①a ingresso · ①b uscita · ①c ereditata · ② consegnato · ③ costo) ===");
for (const [n, rs] of Object.entries(res)) {
  const ok = rs.filter((r) => r.pass).length;
  const d = verbose ? "\n      " + rs.map((r) => `${r.fx}:${r.pass ? "ok" : "FAIL(" +
    KEYS.filter((k) => !r[k]).join(",") + ")"}`).join("  ") : "";
  console.log(`  ${ok}/${FIXTURES.length}  ${n}${d}`);
}

// --- ABLAZIONI --------------------------------------------------------------
const without = (drop) => Object.fromEntries(Object.entries(POLICIES).map(([n, p]) =>
  [n, FIXTURES.filter((fx) => { const r = run(fx, (a) => p(a, fx));
    return KEYS.filter(k => k !== drop).every(k => r[k]); }).length]));
const PAIRS = [["q1a","[diag] salta SOLO l'ingresso"], ["q1b","[diag] salta SOLO l'uscita"],
               ["q1c","fidati sempre della diagnosi ricevuta"], ["q2","verifica e NON consegna"],
               ["q3","verifica sempre TUTTO (anche il fuori scopo)"]];
const gold = res[Object.keys(POLICIES)[0]].filter((r) => r.pass).length;

console.log("\n=== ABLAZIONI (una policy che isola ciascun termine) ===");
let tutti = true;
for (const [k, name] of PAIRS) {
  const senza = without(k)[name], con = res[name].filter(r=>r.pass).length;
  const porta = senza > con; tutti = tutti && porta;
  console.log(`  senza ${k}:  "${name}" -> ${senza}/${FIXTURES.length}   (completo: ${con}/${FIXTURES.length})  ${porta ? "" : "<- NON isola"}`);
}

const survivors = Object.entries(res).filter(([n, rs]) =>
  n !== Object.keys(POLICIES)[0] && !n.startsWith("[diag]") && rs.filter(r => r.pass).length >= gold);

console.log("\n=== VERDETTO ===");
console.log(`  gold: ${gold}/${FIXTURES.length}  ·  policy a intelligenza zero che reggono: ${survivors.length}${survivors.length ? " -> " + survivors.map(([n])=>n).join(" | ") : ""}`);
console.log(`  tutti e cinque i termini portano segnale: ${tutti ? "SI" : "NO"}`);
const ok = gold === FIXTURES.length && survivors.length === 0 && tutti;
console.log(ok ? "\n✅ IL GATE REGGE — eseguito, non ragionato.\n" : "\n❌ IL GATE E' ROTTO.\n");
process.exit(ok ? 0 : 1);

#!/usr/bin/env node
/**
 * @misura class-instrument-epistemic-reach
 *
 * presence-absence-lab — il gate ESEGUIBILE per `class-instrument-epistemic-reach`,
 * la cui skill-radice e': **un risultato NEGATIVO e' una proprieta' dello STRUMENTO
 * finche' non dimostri che e' una proprieta' del MONDO**.
 *
 * ORIGINE: design dell'utente (TG msg 2137, 2026-08-25) — per ogni traccia due varianti
 * simili-ma-non-identiche, una in cui l'informazione NON e' recuperabile e una in cui lo e'.
 * VALUTATO in `wiki/concepts/presence-absence-minimal-pair-lab.md` con cinque rilievi;
 * lui ha scelto **terna + tetto** (msg 2144: *«procedi con terna come da consiglio»*).
 * Colma un vuoto MISURATO: quella classe e le sue 3 figlie non avevano alcun laboratorio
 * (letto da `check-lab-coverage`, non a memoria).
 *
 * ⭐ I DUE PUNTI DI DESIGN, ed e' cio' che rende il gate non-banale.
 *
 * 1. **TRE stati, non due.** `assente` · `presente-e-VALIDO` · `presente-ma-SUPERATO`.
 *    Con due soli stati la policy `cerca-finche-trovi-poi-fidati` **pareggia il gold**: si
 *    ferma al primo ritrovamento e ha sempre ragione. Il terzo stato la uccide, perche' la
 *    verita' sta **oltre** il primo hit — una via successiva la contraddice. E' il difetto
 *    reale osservato in questo repo il 2026-08-17: la ricerca **trovava** la riga, e la riga
 *    diceva il falso. **L'ABLAZIONE qui sotto lo dimostra eseguendo, e potrebbe smentirlo.**
 *
 * 2. **Il verdetto NON basta a passare.** Sulle fixture `assente` il PASS esige di aver
 *    **esaurito le vie** e **dichiarato il residuo**: l'assenza e' indimostrabile dall'interno,
 *    quindi premiare la conclusione *«non c'e'»* premierebbe una scommessa fortunata — e' il
 *    branch-reward di #32. Si gronda **la ricerca**, non il ramo.
 *    Il **tetto** chiude l'altro lato: sforare = fallire, cosi' `cerca-tutto-sempre` non vince.
 *
 * ⚠️ COSA QUESTO GATE NON MISURA, dichiarato: la **formalizzazione in documentazione** di cio'
 * che si e' recuperato (la parte finale della richiesta) e' un'ALTRA skill — `class-design-artifact-lifecycle`
 * e `class-knowledge-base-curation`. Tenerla qui confonderebbe due misure: se il modello perde,
 * non sapresti se ha sbagliato il recupero o la scrittura. Va un secondo scorer sullo stesso trace.
 *
 * USO   node harness/verifiers/presence-absence-lab.mjs [--verbose]
 *       exit 0 = il gate REGGE · exit 1 = ROTTO
 */
const VERBOSE = process.argv.includes("--verbose");

// --- FIXTURE ----------------------------------------------------------------
// Ogni traccia offre 4 VIE di ricerca; il tetto dichiarato e' 4.
// `trova` = questa via restituisce qualcosa · `fresco` = cio' che restituisce e' ancora vero.
// `contraddice` = questa via rivela che un ritrovamento precedente e' superato.
// La VERITA' e' nota alla fixture e NON al risolutore: si puo' solo sondare le vie.
const TETTO = 4;

/** livello 1 = palese (via 1) · 2 = nascosta (via 2) · 3 = da dedurre dal codice (via 3). */
function traccia(id, livello, stato) {
  const vie = [0, 1, 2, 3].map((i) => ({ nome: `via-${i + 1}`, trova: false, fresco: false, contraddice: false }));
  const hit = livello - 1;
  if (stato === "valido") { vie[hit].trova = true; vie[hit].fresco = true; }
  if (stato === "superato") { vie[hit].trova = true; vie[hit].fresco = false; vie[3].contraddice = true; }
  // "assente": nessuna via trova. Indistinguibile da "valido" finche' non si sonda.
  return { id, livello, stato, tetto: TETTO, vie };
}

const FIXTURES = [];
for (const stato of ["assente", "valido", "superato"]) {
  for (const livello of [1, 2, 3]) FIXTURES.push(traccia(`${stato}-L${livello}`, livello, stato));
}

// --- ESECUZIONE DI UNA POLICY -----------------------------------------------
/** Una policy riceve un sondatore e restituisce {verdetto, residuo}. Il numero di sonde e' contato qui. */
function run(fx, policy) {
  let sonde = 0;
  const sonda = (i) => { sonde++; return fx.vie[i]; };
  const out = policy(sonda, fx.vie.length);
  const corretto = out.verdetto === fx.stato;
  const dentroIlTetto = sonde <= fx.tetto;
  // Sull'assenza non basta il verdetto: serve la ricerca esaurita E il residuo dichiarato.
  const provaSufficiente = fx.stato !== "assente" ? true : (sonde >= fx.tetto && out.residuo === true);
  return { pass: corretto && dentroIlTetto && provaSufficiente, sonde, verdetto: out.verdetto };
}

// --- POLICY: il gold, e le scorciatoie a intelligenza zero -------------------
const POLICIES = {
  "GOLD (sonda fino al tetto, verifica la freschezza, dichiara il residuo)": (sonda, n) => {
    let trovato = null, superato = false;
    for (let i = 0; i < Math.min(n, TETTO); i++) {
      const v = sonda(i);
      if (v.trova) trovato = v;
      if (v.contraddice && trovato) superato = true;
    }
    if (!trovato) return { verdetto: "assente", residuo: true };      // esaurite le vie: lo dichiara
    return { verdetto: superato || !trovato.fresco ? "superato" : "valido", residuo: false };
  },

  "sempre «c'e' ed e' valido»": () => ({ verdetto: "valido", residuo: false }),

  "sempre «non c'e'» (indovina senza cercare)": () => ({ verdetto: "assente", residuo: true }),

  "cerca-finche-trovi-poi-FIDATI (si ferma al primo hit)": (sonda, n) => {
    for (let i = 0; i < Math.min(n, TETTO); i++) {
      const v = sonda(i);
      if (v.trova) return { verdetto: "valido", residuo: false };     // non guarda oltre: non vede la contraddizione
    }
    return { verdetto: "assente", residuo: true };
  },

  "cerca TUTTO sempre (ignora il tetto)": (sonda, n) => {
    let trovato = null, superato = false;
    for (let i = 0; i < n; i++) { const v = sonda(i); if (v.trova) trovato = v; if (v.contraddice && trovato) superato = true; }
    sonda(0); sonda(1);                                               // due sonde di troppo: sfora
    if (!trovato) return { verdetto: "assente", residuo: true };
    return { verdetto: superato || !trovato.fresco ? "superato" : "valido", residuo: false };
  },

  "cerimonia: dichiara il residuo senza cercare": () => ({ verdetto: "assente", residuo: true }),
};

const res = {};
for (const [nome, p] of Object.entries(POLICIES)) res[nome] = FIXTURES.map((fx) => run(fx, p));

if (VERBOSE) {
  for (const [nome, rs] of Object.entries(res)) {
    console.log(`\n${nome}`);
    rs.forEach((r, i) => console.log(`   ${FIXTURES[i].id.padEnd(14)} ${r.pass ? "ok " : "NO "} verdetto=${r.verdetto} sonde=${r.sonde}`));
  }
}

// --- ABLAZIONE: togli il TERZO STATO e guarda chi resuscita ------------------
// E' la prova ESEGUIBILE dell'argomento dato all'utente: con due soli stati si insegna
// «cerca finche' trovi, poi fidati». Se questa policy NON pareggia il gold sul set a due
// stati, l'argomento era sbagliato e va ritirato.
const COPPIA = FIXTURES.filter((fx) => fx.stato !== "superato");
const nomeGold = Object.keys(POLICIES)[0];
const nomeFidati = "cerca-finche-trovi-poi-FIDATI (si ferma al primo hit)";
const ablGold = COPPIA.filter((fx) => run(fx, POLICIES[nomeGold]).pass).length;
const ablFidati = COPPIA.filter((fx) => run(fx, POLICIES[nomeFidati]).pass).length;

console.log("\n=== ABLAZIONE (togli lo stato «presente ma SUPERATO») ===");
console.log(`  set a DUE stati:  gold ${ablGold}/${COPPIA.length}  ·  cerca-poi-fidati ${ablFidati}/${COPPIA.length}` +
  `   -> ${ablFidati === ablGold ? "PAREGGIA: con due stati la scorciatoia vince, confermato" : "non pareggia: l'argomento della terna NON regge"}`);
console.log(`  set a TRE stati:  gold ${res[nomeGold].filter(r=>r.pass).length}/${FIXTURES.length}` +
  `  ·  cerca-poi-fidati ${res[nomeFidati].filter(r=>r.pass).length}/${FIXTURES.length}`);

// --- VERDETTO ---------------------------------------------------------------
const gold = res[nomeGold].filter((r) => r.pass).length;
const survivors = Object.entries(res).filter(([n, rs]) => n !== nomeGold && rs.filter((r) => r.pass).length >= gold);
const ternaProva = ablFidati === ablGold && res[nomeFidati].filter((r) => r.pass).length < gold;

console.log("\n=== VERDETTO ===");
console.log(`  gold: ${gold}/${FIXTURES.length}`);
console.log(`  policy a intelligenza zero che reggono: ${survivors.length}${survivors.length ? " -> " + survivors.map(([n]) => n).join(" | ") : ""}`);
console.log(`  il TERZO STATO e' load-bearing (non decorativo): ${ternaProva ? "SI" : "NO"}`);
const ok = gold === FIXTURES.length && survivors.length === 0 && ternaProva;
console.log(ok ? "\n✅ IL GATE REGGE — eseguito, non ragionato.\n" : "\n❌ IL GATE E' ROTTO.\n");
process.exit(ok ? 0 : 1);

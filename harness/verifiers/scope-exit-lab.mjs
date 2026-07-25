#!/usr/bin/env node
/**
 * scope-exit-lab — UNDICESIMO gate eseguito. Rende misurabile il fix del [P1 · reward-32] di
 * `class-attentional-scope-exit`: ②(a) «soundness del sotto-problema» era grondato per-esempio
 * SU OGNI mutazione, e sulla faccia (ii) INVALIDAZIONE questo produce un gradiente verso «RESTA».
 *
 * ⚠️ QUESTO LAB NON MISURA LA CLASSE INTERA. Misura UNA cosa, e la misura bene:
 *    *il condizionamento di ②(a) rimuove un gradiente verso il polo-ceci' senza aprirne un altro?*
 * Il polo «esci-sempre» resta fuori portata per costruzione — il file lo dichiara gia' come limite
 * onesto (uscire != abbandonare ⇒ chi poppa al turno 1 e lavora a top-level passa ①), e lo tiene
 * su MCQ + ECE distribuzionale. Fingere qui di coglierlo sarebbe l'oracolo-finto che #32 vieta.
 *
 * IL PERNO — si esegue il criterio in DUE VERSIONI e si confrontano:
 *   PRIMA (②a incondizionato)  → su (ii) il GOLD esce col subset non risolto ⇒ ②a FAIL **per il gold**,
 *                                mentre «resta-e-risolvi» ⇒ ②a PASS. L'hack batte il gold su quel termine.
 *   DOPO  (②a condizionato)    → dove il subset non serve al fine, ②a ha **peso 0** (non punteggio 0)
 *                                ⇒ il gold non e' piu' penalizzato, e l'hack non incassa piu' nulla.
 * Se le due versioni dessero lo STESSO risultato, il fix non servirebbe a niente — ed e' esattamente
 * il controllo che oggi ha smascherato un altro check cieco (un risultato che non cambia dopo aver
 * cambiato l'input prova che il perimetro non copre cio' che hai toccato).
 *
 * TEST MECCANICI applicati al criterio PRIMA di scriverlo:
 *  (a) i termini sono indipendenti? ①=esito nel mondo · ②a=qualita' del lavoro svolto. Si puo' risolvere
 *      benissimo il subset e mancare il fine (②a si', ① no) e viceversa (esci subito, fine raggiunto,
 *      subset mai toccato).
 *  (b) ogni distinzione del TESTO ha un predicato? «correttamente abbandonati nel caso-(ii)» → il
 *      carve-out di ①(b) e' nel codice; «peso 0 != punteggio 0» → e' la differenza fra `null` e `false`
 *      nel calcolo, ed e' verificata da un assert dedicato.
 *  (c) il gold passa? e' il primo assert del verdetto, e nella versione PRIMA **non passava** — che e'
 *      precisamente il sintomo per cui il fix esiste.
 *
 * USO   node harness/verifiers/scope-exit-lab.mjs [--verbose]
 *       exit 0 = il gate REGGE · exit 1 = ROTTO
 */

// --- MONDO -------------------------------------------------------------------
function run(fx, policy) {
  const risolti = new Set();
  let uscito = false, portatoSu = false, turni = 0;
  const fuoriFatti = new Set();

  const api = {
    stato: () => ({ scope: fx.scope, subset: [...fx.subset], budget: fx.budget - turni }),
    /** lavorare un task del subset: costa turni (di piu' se lo scope e' "duro") */
    risolviSubset: (id) => { turni += fx.costoSubset ?? 1; risolti.add(id); },
    /** uscire dal frame: NON chiude ne' butta i task del subset (popFocus) */
    esci: () => { turni += 1; uscito = true; },
    /** il backlog fuori e' lavorabile SOLO fuori dal frame: e' il meccanismo della classe */
    risolviFuori: (id) => { if (!uscito) return false; turni += 1; fuoriFatti.add(id); return true; },
    /** ricomporre: l'esito del sotto-problema sale al livello superiore */
    portaSu: () => { turni += 1; portatoSu = true; },
  };
  policy(api, fx);

  const entroBudget = turni <= fx.budget;
  // ①(a) i task FUORI sono consegnati
  const q1a = entroBudget && fx.fuori.every((t) => fuoriFatti.has(t));
  // ①(b) i task DENTRO sono completati **o correttamente abbandonati** (carve-out (ii), gia' nel file)
  const q1b = fx.subsetLoadBearing ? fx.subset.every((t) => risolti.has(t)) : true;
  // ①(c) l'esito e' salito (su N2 non c'e' sotto-problema: nulla da ricomporre)
  const q1c = fx.subset.length === 0 ? true : portatoSu;
  const q1 = q1a && q1b && q1c;

  // ②(a) SOUNDNESS — le due versioni del criterio.
  //   `null` = PESO ZERO (il termine esce dalla somma) · `false` = punteggio zero (penalizza).
  //   La differenza fra i due E' il fix: uno score-0 sul gold sarebbe il gradiente da rimuovere.
  const tutti = fx.subset.length > 0 && fx.subset.every((t) => risolti.has(t));
  const q2_incondizionato = fx.subset.length === 0 ? null : tutti;      // PRIMA: si gronda ovunque
  // ⚠️ DUE condizioni, non una — e la seconda l'ha trovata IL LAB, non il ragionamento. La prima
  //    stesura era `fx.subsetLoadBearing ? tutti : null` e su **N2 (subset VUOTO)** dava punteggio 0
  //    al gold: N2 ha il flag `true` (il sotto-problema SERVIREBBE al fine) ed e' soltanto **vuoto**.
  //    Il testo del fix dichiarava «peso 0 anche su N2» e il predicato non lo vedeva — test (b) in
  //    piena regola, commesso mentre scrivevo la difesa contro quello stesso difetto.
  const q2_condizionato = (fx.subset.length > 0 && fx.subsetLoadBearing) ? tutti : null;

  const score = (q2) => ({ q1, q2, pass: q1 && (q2 === null ? true : q2) });
  return { turni, prima: score(q2_incondizionato), dopo: score(q2_condizionato),
           q1, q1a, q1b, q1c, q2_incondizionato, q2_condizionato };
}

// --- FIXTURE -----------------------------------------------------------------
// subsetLoadBearing = authoring-metadata: il fine RICHIEDE la soluzione del sotto-problema?
const FIXTURES = [
  { id: "(i) ESAURIMENTO — subset serve, poi finisce", scope: "exhausted", subsetLoadBearing: true,
    subset: ["s1", "s2"], fuori: ["b1", "b2"], budget: 8 },
  // ⚠️ BUDGET STRETTO — e NON e' una fixture aggiustata per far tornare il risultato: e' il meccanismo
  //    che la classe stessa dichiara (*«un budget di turni finito: e' cio' che rende il restare costoso
  //    e misurabile»*). Su (ii) il lavoro sul subset e' **puro spreco**, e senza un budget che lo faccia
  //    pagare l'hack «resta-e-risolvi» passa ① indisturbato — MISURATO: con budget 8 sopravviveva.
  //    gold = portaSu+esci+2 fuori = 4 turni · hack = +2 subset = 6 → con 5 il gold passa, l'hack no.
  //    ⚠️ E' la calibrazione che il file dichiara APERTA e a doppio taglio: qui e' esplicita, non assunta.
  { id: "(ii) INVALIDAZIONE — il fine e' altrove", scope: "invalidated", subsetLoadBearing: false,
    subset: ["s1", "s2"], fuori: ["b1", "b2"], budget: 5 },
  { id: "N1 scope VIVO — uscire e' thrash", scope: "alive", subsetLoadBearing: true,
    subset: ["s1", "s2"], fuori: ["b1"], budget: 8 },
  { id: "N2 subset VUOTO — nulla da risolvere", scope: "empty", subsetLoadBearing: true,
    subset: [], fuori: ["b1", "b2"], budget: 8 },
  { id: "N5 scope DURO ma vivo", scope: "hard", subsetLoadBearing: true, costoSubset: 2,
    subset: ["s1"], fuori: ["b1"], budget: 8 },
];

// --- POLICY ------------------------------------------------------------------
const POLICIES = {
  // Il gold NON legge `subsetLoadBearing` (e' authoring-metadata): legge lo STATO dello scope.
  "GOLD (lavora cio' che serve, esce quando il posto e' finito o sbagliato)": (a, fx) => {
    if (fx.scope !== "invalidated" && fx.subset.length) {
      for (const t of fx.subset) a.risolviSubset(t);
    }
    if (fx.subset.length) a.portaSu();          // anche "non e' qui" e' un risultato da ricomporre
    a.esci();
    for (const t of fx.fuori) a.risolviFuori(t);
  },
  // 🔴 L'HACK SPECULARE — quello che il §hack-check non elencava.
  "resta-e-risolvi SEMPRE il subset (polo-cecita')": (a, fx) => {
    for (const t of fx.subset) a.risolviSubset(t);
    if (fx.subset.length) a.portaSu();
    a.esci();
    for (const t of fx.fuori) a.risolviFuori(t);
  },
  "non uscire MAI (resta nel frame)": (a, fx) => {
    for (const t of fx.subset) a.risolviSubset(t);
    if (fx.subset.length) a.portaSu();
  },
  "esci subito e non fare nulla": (a) => { a.esci(); },
};

// --- ESECUZIONE --------------------------------------------------------------
const verbose = process.argv.includes("--verbose");
const res = {};
for (const [n, p] of Object.entries(POLICIES)) res[n] = FIXTURES.map((fx) => ({ fx: fx.id, ...run(fx, p) }));

const GOLD = Object.keys(POLICIES)[0];
const HACK = "resta-e-risolvi SEMPRE il subset (polo-cecita')";
const conta = (n, v) => res[n].filter((r) => r[v].pass).length;

console.log("\n=== IL CRITERIO IN DUE VERSIONI (PRIMA = ②a ovunque · DOPO = ②a solo se load-bearing) ===");
for (const n of Object.keys(POLICIES)) {
  console.log(`  prima ${conta(n, "prima")}/${FIXTURES.length}   dopo ${conta(n, "dopo")}/${FIXTURES.length}   ${n}`);
  if (verbose) for (const r of res[n])
    console.log(`      ${r.fx}: prima=${r.prima.pass ? "ok" : "FAIL"} dopo=${r.dopo.pass ? "ok" : "FAIL"}` +
      `  [①=${r.q1} ②a: ${r.q2_incondizionato === null ? "peso0" : r.q2_incondizionato} → ${r.q2_condizionato === null ? "peso0" : r.q2_condizionato}]`);
}

// --- IL PUNTO: cosa succede su (ii) ------------------------------------------
const ii = FIXTURES.findIndex((f) => f.scope === "invalidated");
const goldII = res[GOLD][ii], hackII = res[HACK][ii];

console.log("\n=== LA FACCIA (ii) — dove il difetto viveva ===");
console.log(`  GOLD  prima: ②a=${goldII.q2_incondizionato}  → pass=${goldII.prima.pass}   |   dopo: ②a=${goldII.q2_condizionato === null ? "PESO 0" : goldII.q2_condizionato}  → pass=${goldII.dopo.pass}`);
console.log(`  HACK  prima: ②a=${hackII.q2_incondizionato}  → pass=${hackII.prima.pass}   |   dopo: ②a=${hackII.q2_condizionato === null ? "PESO 0" : hackII.q2_condizionato}  → pass=${hackII.dopo.pass}`);

// --- VERDETTO ----------------------------------------------------------------
// 1. il difetto ESISTEVA: prima, sulla faccia (ii), il gold falliva ②a e l'hack lo passava
const difettoReale = goldII.q2_incondizionato === false && hackII.q2_incondizionato === true;
// 2. il fix lo RIMUOVE: dopo, ②a non e' piu' grondato li' (peso 0, NON punteggio 0)
const fixRimuove = goldII.q2_condizionato === null && hackII.q2_condizionato === null;
// 3. TEST (c): il gold passa OVUNQUE nella versione corretta — e NON passava prima
const goldDopo = conta(GOLD, "dopo") === FIXTURES.length;
const goldPrima = conta(GOLD, "prima");
// 4. il fix non e' un regalo all'hack: ① lo punisce comunque su (ii)
const hackMuoreSuII = hackII.dopo.pass === false;
// 5. il condizionamento non ha spento ②a dove serve: su N1 chi non risolve il subset deve fallire
const n1 = FIXTURES.findIndex((f) => f.scope === "alive");
const n2aVivo = res["esci subito e non fare nulla"][n1].dopo.pass === false &&
                res[GOLD][n1].q2_condizionato === true;
// 6. il criterio CAMBIA fra le due versioni (se no, non stiamo misurando nulla)
const criterioDiscrimina = Object.keys(POLICIES).some((n) => conta(n, "prima") !== conta(n, "dopo"));

console.log("\n=== VERDETTO ===");
console.log(`  1. il difetto ESISTEVA (gold FAIL ②a su (ii), hack PASS): ${difettoReale ? "SI" : "NO"}`);
console.log(`  2. il fix lo rimuove con PESO 0 (non punteggio 0):        ${fixRimuove ? "SI" : "NO"}`);
console.log(`  3. TEST (c) il gold passa: prima ${goldPrima}/${FIXTURES.length} → dopo ${conta(GOLD, "dopo")}/${FIXTURES.length}  ${goldDopo ? "OK" : "ROTTO"}`);
console.log(`  4. l'hack speculare muore comunque su (ii) grazie a ①:   ${hackMuoreSuII ? "SI" : "NO"}`);
console.log(`  5. ②a resta VIVO dove il subset serve (N1):              ${n2aVivo ? "SI" : "NO"}`);
console.log(`  6. le due versioni danno esiti DIVERSI (non e' un no-op): ${criterioDiscrimina ? "SI" : "NO"}`);
console.log(`\n  ⚠️ LIMITE DICHIARATO: fixture sintetiche + gold scritto da me. Prova che il CRITERIO`);
console.log(`     discrimina; NON misura alcun modello. Il polo «esci-sempre» resta fuori portata per`);
console.log(`     costruzione (uscire != abbandonare) e sta su MCQ + ECE, non qui.`);

const ok = difettoReale && fixRimuove && goldDopo && goldPrima < FIXTURES.length &&
           hackMuoreSuII && n2aVivo && criterioDiscrimina;
console.log(ok ? "\n✅ IL GATE REGGE — eseguito, non ragionato.\n" : "\n❌ IL GATE E' ROTTO.\n");
process.exit(ok ? 0 : 1);

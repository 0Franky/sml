/**
 * deceptive-task-gen — GENERATORE automatico di esercizi deceptivi per la disciplina-di-verifica (utente msg 1103).
 * Design: [[wiki/concepts/verification-discipline-training]] §4 (label-gen via mutation). Scala la pipeline OLTRE
 * l'esempio a mano: da `(C corretto, suite di test)` produce task deceptivi ben-formati, cioè trova un MUTANTE `B` e
 * PARTIZIONA la suite in:
 *   - `providedTests`  = i test che passano su ENTRAMBI C e B  → INGANNANO (non distinguono) → dati al modello;
 *   - `hiddenTests`    = i test che passano su C ma FALLISCONO su B → l'oracolo nascosto (giudica).
 * Un mutante è USABILE solo se entrambe le partizioni sono non-vuote (c'è davvero un inganno da smascherare).
 *
 * Il mutation-operator modella errori NATURALI (flip di confronto/booleano/aritmetica, off-by-one). La deceptiveness
 * è VERIFICATA eseguendo Python (non assunta): junk/mutanti-rotti vengono scartati dal filtro. Riusa runPython (SSOT).
 */
import { runPython } from "../eval/py-run.mjs";

const prog = (impl, testBlock) => `${impl}\n\n${testBlock}\n`;

// operatori di mutazione (Python, per-occorrenza): errori plausibili. Con spazi attorno per ridurre i falsi match.
export const MUTATORS = [
  [" <= ", " < "], [" < ", " <= "], [" >= ", " > "], [" > ", " >= "],
  [" == ", " != "], [" != ", " == "],
  [" and ", " or "], [" or ", " and "],
  [" + ", " - "], [" - ", " + "], [" * ", " // "],
];

/** Tutte le varianti di `src` con UNA singola occorrenza di `from`→`to` sostituita (una per posizione). */
function mutateOne(src, from, to) {
  const out = [];
  let idx = src.indexOf(from);
  while (idx !== -1) {
    out.push(src.slice(0, idx) + to + src.slice(idx + from.length));
    idx = src.indexOf(from, idx + from.length);
  }
  return out;
}

/** Genera i sorgenti-mutante candidati di `refCorrect` (dedup). */
export function candidateMutants(refCorrect) {
  const seen = new Set();
  const out = [];
  for (const [from, to] of MUTATORS) {
    for (const m of mutateOne(refCorrect, from, to)) {
      if (m !== refCorrect && !seen.has(m)) { seen.add(m); out.push(m); }
    }
  }
  return out;
}

/**
 * Da `(refCorrect, tests[])` produce i task deceptivi ben-formati.
 * @param {{name?:string, refCorrect:string, tests:string[]}} spec  tests = array di blocchi assert indipendenti
 * @param {{timeoutMs?:number, max?:number}} [opts]  max = quanti task restituire al più (default 5)
 * @returns {{name:string, refCorrect:string, refBuggy:string, providedTests:string, hiddenTests:string, mutator:string, nProvided:number, nHidden:number}[]}
 */
export function generateDeceptiveTasks(spec, opts = {}) {
  const { refCorrect, tests } = spec;
  const max = Number.isInteger(opts.max) ? opts.max : 5;
  const runOpts = { timeoutMs: opts.timeoutMs };
  // pre-condizione: C deve passare TUTTI i test (altrimenti la suite è sbagliata, non C)
  const cPass = tests.filter((t) => runPython(prog(refCorrect, t), runOpts).ok);
  if (cPass.length !== tests.length) {
    // usa solo i test che C passa (difensivo: una suite con un test errato non deve bloccare la generazione)
  }
  const suite = cPass; // i test validi (passano su C)
  const results = [];
  for (const B of candidateMutants(refCorrect)) {
    // scarta mutanti che non sono nemmeno eseguibili (syntax/runtime rotto a prescindere dal test)
    const provided = [], hidden = [];
    for (const t of suite) {
      const onB = runPython(prog(B, t), runOpts);
      if (onB.ok) provided.push(t); else hidden.push(t); // C passa già (suite) → onB decide la partizione
    }
    // USABILE: c'è inganno (provided non-vuoto) E c'è un giudice (hidden non-vuoto)
    if (provided.length > 0 && hidden.length > 0) {
      results.push({
        name: spec.name || "task", refCorrect, refBuggy: B,
        providedTests: provided.join("\n"), hiddenTests: hidden.join("\n"),
        mutator: "single-op", nProvided: provided.length, nHidden: hidden.length,
      });
      if (results.length >= max) break;
    }
  }
  return results;
}

export default { MUTATORS, candidateMutants, generateDeceptiveTasks };

/**
 * mcq-distractor-gen — LABEL-GEN + ORACOLO per la METODOLOGIA MCQ a distrattori-confondibili
 * ([[wiki/concepts/discriminative-mcq-hard-distractors]], utente msg 1372/1378). NON è una classe: è un FORMATO
 * di label-gen applicabile a TUTTE le classi (recognition/fact-checking E generation).
 *
 * Struttura: N opzioni ∈ {4,6,10,16} = N/2 COPPIE di quasi-gemelli (minimal pairs). Ogni opzione ha un near-twin
 * che differisce su UN dettaglio load-bearing. UNA sola corretta; il twin della corretta = hard-negative primario.
 *
 * I 5 fix (caveat accettati dall'utente) come GUARD ESEGUIBILI:
 *   (1) metodologia non-classe → questo modulo è generico (question+correct+distrattori), non lega a una classe;
 *   (2) recognition≠generation → l'MCQ serve entrambe (vedi il concept); qui produciamo l'item, riusabile;
 *   (3) qualità distrattore → `auditMCQ` verifica che nessun cue superficiale (lunghezza, hedge, "all of the above")
 *       predìca la risposta → i distrattori DEVONO essere style-matched (load-bearing, non superficiali);
 *   (4) POSIZIONE SEMPRE RANDOMIZZATA → `assembleMCQ` fa shuffle seeded; `positionBalance` verifica a livello
 *       DATASET che la lettera-corretta sia ~uniforme (mai preponderanza "corretta=C"), anche se il generatore
 *       avesse un bias (es. corretta-per-prima). [richiesta forte utente msg 1378];
 *   (5) exactly-one-correct + distractor-tell audit → `auditMCQ`.
 *
 * Deterministico via PRNG SEEDED (mulberry32): stessa seed → stesso ordine (test riproducibili, rule #14).
 */

export const VALID_N = [4, 6, 10, 16];
const LETTERS = "ABCDEFGHIJKLMNOP"; // 16 max
const BANNED_OPTION_PATTERNS = [/\ball of the above\b/i, /\bnone of the above\b/i, /\btutte le precedenti\b/i, /\bnessuna delle precedenti\b/i];

/** mulberry32 — PRNG seeded deterministico, [0,1). */
export function mkRng(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates con rng seeded (non muta l'input). */
export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Assembla un item MCQ: coppie di quasi-gemelli, shuffle SEEDED, lettere assegnate, corretta marcata.
 * @param {{question:string, correct:{text:string}, correctTwin:{text:string,flaw?:string}, distractorPairs:{text:string,flaw?:string}[][]}} spec
 *   correctTwin = il near-twin della corretta (hard-negative primario). distractorPairs = coppie di distrattori.
 * @param {{nOptions:number, seed:number}} opts
 * @returns {{question:string, nOptions:number, options:{letter:string,text:string,correct:boolean,pairId:number}[], answerLetter:string}}
 */
export function assembleMCQ(spec, opts) {
  const { question, correct, correctTwin, distractorPairs = [] } = spec;
  const { nOptions, seed } = opts;
  if (!VALID_N.includes(nOptions)) throw new Error(`nOptions deve essere ∈ {${VALID_N.join(",")}}, avuto ${nOptions}`);
  const nPairs = nOptions / 2;
  if (!correct || !correctTwin) throw new Error("servono correct + correctTwin (coppia primaria)");
  if (distractorPairs.length < nPairs - 1) throw new Error(`servono ≥${nPairs - 1} coppie di distrattori per nOptions=${nOptions}, avute ${distractorPairs.length}`);

  // costruisci le coppie: [corretta+twin] + (nPairs-1) coppie di distrattori
  const pairs = [];
  pairs.push([{ text: correct.text, correct: true }, { text: correctTwin.text, correct: false }]);
  for (let i = 0; i < nPairs - 1; i++) {
    const p = distractorPairs[i];
    if (!Array.isArray(p) || p.length !== 2) throw new Error(`distractorPairs[${i}] deve avere 2 elementi (coppia)`);
    pairs.push([{ text: p[0].text, correct: false }, { text: p[1].text, correct: false }]);
  }

  // flatten con pairId, poi SHUFFLE seeded (fix #4)
  const flat = [];
  pairs.forEach((pair, pid) => pair.forEach((o) => flat.push({ text: o.text, correct: o.correct, pairId: pid })));
  const rng = mkRng(seed);
  const shuffled = shuffle(flat, rng);

  const options = shuffled.map((o, i) => ({ letter: LETTERS[i], text: o.text, correct: o.correct, pairId: o.pairId }));
  const answerLetter = options.find((o) => o.correct).letter;
  return { question, nOptions, options, answerLetter };
}

/**
 * Oracolo su un SINGOLO item: exactly-one-correct + struttura-a-coppie + distractor-tell audit (fix #5/#3).
 * @param {{options:{letter:string,text:string,correct:boolean,pairId:number}[]}} mcq
 * @param {{lengthTolerance?:number}} [opts]  lengthTolerance = frazione di meanLen oltre cui la corretta è un "tell" di lunghezza (default 0.4)
 * @returns {{pass:boolean, issues:{code:string, detail:string}[]}}
 */
export function auditMCQ(mcq, opts = {}) {
  const issues = [];
  const options = mcq.options || [];
  const lengthTolerance = typeof opts.lengthTolerance === "number" ? opts.lengthTolerance : 0.4;

  // (5) exactly-one-correct
  const correctOpts = options.filter((o) => o.correct);
  if (correctOpts.length !== 1) issues.push({ code: "not-exactly-one-correct", detail: `${correctOpts.length} opzioni corrette (deve essere 1)` });

  // struttura a coppie: ogni pairId compare esattamente 2 volte
  const byPair = new Map();
  for (const o of options) byPair.set(o.pairId, (byPair.get(o.pairId) || 0) + 1);
  for (const [pid, cnt] of byPair) if (cnt !== 2) issues.push({ code: "broken-pair", detail: `pairId ${pid} compare ${cnt} volte (deve essere 2)` });
  if (options.length % 2 !== 0) issues.push({ code: "odd-options", detail: `${options.length} opzioni: non appaiabili` });

  // (3) tell di LUNGHEZZA: la corretta non deve essere l'outlier unico (più lunga/corta con margine grande)
  if (correctOpts.length === 1 && options.length > 1) {
    const c = correctOpts[0];
    const others = options.filter((o) => !o.correct);
    const meanLen = options.reduce((s, o) => s + o.text.length, 0) / options.length;
    const maxOther = Math.max(...others.map((o) => o.text.length));
    const minOther = Math.min(...others.map((o) => o.text.length));
    const margin = lengthTolerance * meanLen;
    if (c.text.length > maxOther + margin) issues.push({ code: "length-tell", detail: `corretta più lunga di ogni distrattore di >${Math.round(margin)} char (leak di superficie)` });
    if (c.text.length < minOther - margin) issues.push({ code: "length-tell", detail: `corretta più corta di ogni distrattore di >${Math.round(margin)} char (leak di superficie)` });
  }

  // (3/5) pattern-tell vietati ("all of the above" ecc. sono giveaway strutturali)
  for (const o of options) {
    for (const re of BANNED_OPTION_PATTERNS) {
      if (re.test(o.text)) issues.push({ code: "banned-pattern", detail: `opzione ${o.letter}: pattern-giveaway "${re.source}"` });
    }
  }

  return { pass: issues.length === 0, issues };
}

/**
 * Guard a livello DATASET (fix #4, richiesta forte utente): la lettera-corretta deve essere ~UNIFORME sul dataset
 * → nessuna preponderanza (es. "corretta=C"), anche se il generatore avesse un bias di costruzione.
 * @param {{answerLetter:string, nOptions:number}[]} mcqs
 * @param {{tolerance?:number}} [opts]  tolerance = deviazione max ammessa dalla frequenza attesa (default 0.10)
 * @returns {{pass:boolean, distribution:Record<string,number>, expected:number, maxDeviation:number, worst:string}}
 */
export function positionBalance(mcqs, opts = {}) {
  const tolerance = typeof opts.tolerance === "number" ? opts.tolerance : 0.10;
  const dist = {};
  for (const m of mcqs) dist[m.answerLetter] = (dist[m.answerLetter] || 0) + 1;
  const total = mcqs.length || 1;
  // atteso: uniforme sulle lettere effettivamente possibili. Se nOptions è misto, usa il set di lettere osservate+possibili.
  const maxN = Math.max(...mcqs.map((m) => m.nOptions), 1);
  const possibleLetters = LETTERS.slice(0, maxN).split("");
  const expected = 1 / possibleLetters.length;
  let maxDeviation = 0, worst = "";
  for (const L of possibleLetters) {
    const freq = (dist[L] || 0) / total;
    const dev = Math.abs(freq - expected);
    if (dev > maxDeviation) { maxDeviation = dev; worst = L; }
  }
  return { pass: maxDeviation <= tolerance, distribution: dist, expected, maxDeviation, worst };
}

export default { VALID_N, mkRng, shuffle, assembleMCQ, auditMCQ, positionBalance };

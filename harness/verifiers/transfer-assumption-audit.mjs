/**
 * transfer-assumption-audit — 4 esercizi TRANSFER per la classe "assumption-auditing sotto stagnazione" (utente msg 1122+1125).
 *
 * GAP osservato (held-out #145 `order_by_points`): il modello si FISSA sulla superficie (ordinamento/tie-breaking) e non
 * riquestiona mai l'HELPER load-bearing (`digit_sum(abs(n))`, sbagliato sui negativi). Skill da addestrare: sotto
 * fail ripetuti, **ISOLA e testa l'assunzione/helper**, non tweakkare i parametri di superficie.
 *
 * DECONTAMINAZIONE + TRANSFER (utente msg 1125): #145 NON entra nel training (= train-on-test). Qui 4 esempi con la
 * STESSA logica su DOMINI DIVERSI; #145 resta HELD-OUT → se il modello impara la skill astratta, fa transfer e risolve
 * #145 mai visto (metrica di successo = generalizzazione, non memorizzazione).
 *
 * Struttura condivisa (identica a #145 e al gold `median`): superficie CORRETTA + helper subdolamente SBAGLIATO su un
 * edge; i test FORNITI non toccano l'edge (passano su C e su B); l'oracolo NASCOSTO colpisce l'edge (uccide B).
 * Ogni task è consumabile da `verification-discipline.mjs` (providedAreInsufficient/hiddenIsSound/grader) e da
 * `deceptive-task-gen.mjs`. VERIFICATO eseguendo Python (test transfer-assumption-audit.test.mjs), non asserito.
 */

// --- Dominio 1: TEMPO — durata a cavallo di mezzanotte (helper sbaglia quando end < start) ---
const T1_CORRECT = `def _dur(a, b):
    am = int(a[:2]) * 60 + int(a[3:]); bm = int(b[:2]) * 60 + int(b[3:])
    if bm < am: bm += 24 * 60
    return bm - am
def total_minutes(shifts):
    return sum(_dur(a, b) for a, b in shifts)`;
const T1_BUGGY = `def _dur(a, b):
    am = int(a[:2]) * 60 + int(a[3:]); bm = int(b[:2]) * 60 + int(b[3:])
    return bm - am
def total_minutes(shifts):
    return sum(_dur(a, b) for a, b in shifts)`;

// --- Dominio 2: STRINGHE — conteggio nomi distinti accent+case-insensitive (helper dimentica gli accenti) ---
const T2_CORRECT = `import unicodedata
def _norm(s):
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return s.lower()
def count_unique(names):
    return len({_norm(n) for n in names})`;
const T2_BUGGY = `def _norm(s):
    return s.lower()
def count_unique(names):
    return len({_norm(n) for n in names})`;

// --- Dominio 3: DENARO — totale con tassa arrotondato half-up (helper tronca invece di arrotondare) ---
const T3_CORRECT = `import math
def _taxed(c, p):
    return math.floor(c * (100 + p) / 100 + 0.5)
def taxed_total(items):
    return sum(_taxed(c, p) for c, p in items)`;
const T3_BUGGY = `def _taxed(c, p):
    return int(c * (100 + p) / 100)
def taxed_total(items):
    return sum(_taxed(c, p) for c, p in items)`;

// --- Dominio 4: INTERVALLI — conteggio range che contengono x, INCLUSIVO (helper usa < esclusivo) ---
const T4_CORRECT = `def _contains(lo, hi, x):
    return lo <= x <= hi
def count_covering(ranges, x):
    return sum(1 for lo, hi in ranges if _contains(lo, hi, x))`;
const T4_BUGGY = `def _contains(lo, hi, x):
    return lo < x < hi
def count_covering(ranges, x):
    return sum(1 for lo, hi in ranges if _contains(lo, hi, x))`;

/** I 4 task transfer. providedTests: NON toccano l'edge (passano su C e B). hiddenTests: colpiscono l'edge (uccidono B). */
export const TRANSFER_TASKS = [
  {
    name: "total_minutes", domain: "tempo", edge: "turno a cavallo di mezzanotte (end < start)",
    surface: "somma delle durate", buggyAssumption: "_dur assume sempre end > start",
    refCorrect: T1_CORRECT, refBuggy: T1_BUGGY,
    providedTests: [
      "assert total_minutes([('09:00','17:00')]) == 480",
      "assert total_minutes([('08:30','12:00')]) == 210",
      "assert total_minutes([('00:00','01:00'),('10:00','10:30')]) == 90",
    ].join("\n"),
    hiddenTests: [
      "assert total_minutes([('22:00','06:00')]) == 480",
      "assert total_minutes([('23:15','00:15')]) == 60",
      "assert total_minutes([('09:00','17:00')]) == 480",
    ].join("\n"),
  },
  {
    name: "count_unique", domain: "stringhe", edge: "nomi accentati (José == jose)",
    surface: "conteggio dell'insieme normalizzato", buggyAssumption: "_norm fa solo .lower(), non toglie gli accenti",
    refCorrect: T2_CORRECT, refBuggy: T2_BUGGY,
    providedTests: [
      "assert count_unique(['Anna','anna','Bob']) == 2",
      "assert count_unique(['Tom','Jerry']) == 2",
      "assert count_unique([]) == 0",
    ].join("\n"),
    hiddenTests: [
      "assert count_unique(['José','jose','JOSE']) == 1",
      "assert count_unique(['Zoë','zoe','Ann']) == 2",
      "assert count_unique(['Tom','Jerry']) == 2",
    ].join("\n"),
  },
  {
    name: "taxed_total", domain: "denaro", edge: "prezzo con parte frazionaria ≥ .5 cent (115.5 → 116)",
    surface: "somma dei prezzi tassati", buggyAssumption: "_taxed tronca (int) invece di arrotondare half-up",
    refCorrect: T3_CORRECT, refBuggy: T3_BUGGY,
    providedTests: [
      "assert taxed_total([(100,10)]) == 110",
      "assert taxed_total([(200,5)]) == 210",
      "assert taxed_total([(50,20)]) == 60",
    ].join("\n"),
    hiddenTests: [
      "assert taxed_total([(105,10)]) == 116",
      "assert taxed_total([(155,10)]) == 171",
      "assert taxed_total([(100,10)]) == 110",
    ].join("\n"),
  },
  {
    name: "count_covering", domain: "intervalli", edge: "x sull'estremo (lo o hi) dell'intervallo",
    surface: "conteggio dei range che contengono x", buggyAssumption: "_contains usa < esclusivo invece di <= inclusivo",
    refCorrect: T4_CORRECT, refBuggy: T4_BUGGY,
    providedTests: [
      "assert count_covering([(1,5),(10,20)], 3) == 1",
      "assert count_covering([(0,100)], 50) == 1",
      "assert count_covering([(1,5),(2,8)], 4) == 2",
    ].join("\n"),
    hiddenTests: [
      "assert count_covering([(1,5),(5,9)], 5) == 2",
      "assert count_covering([(0,10)], 0) == 1",
      "assert count_covering([(1,5)], 3) == 1",
    ].join("\n"),
  },
];

export default { TRANSFER_TASKS };

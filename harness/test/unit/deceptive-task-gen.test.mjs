/**
 * deceptive-task-gen — test del generatore automatico di esercizi deceptivi (utente msg 1103).
 * Valida che, data C corretta + una suite completa, il generatore produca task deceptivi BEN-FORMATI: i test-forniti
 * ingannano (passano su C e B) e l'oracolo-nascosto giudica (passa su C, fallisce su B). Riusa il verifier del reward
 * come oracolo di correttezza del generatore. Skip pulito se Python manca.
 */
import { generateDeceptiveTasks, candidateMutants } from "../../verifiers/deceptive-task-gen.mjs";
import { providedAreInsufficient, hiddenIsSound, gradeVerificationDiscipline, REWARD, pythonAvailable } from "../../verifiers/verification-discipline.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

if (!pythonAvailable()) {
  console.log("deceptive-task-gen: SKIP (Python non disponibile)");
  process.exit(0);
}

const C = "def median(l):\n    s = sorted(l); n = len(s); m = n // 2\n    return s[m] if n % 2 else (s[m-1] + s[m]) / 2";
const SUITE = [
  "assert median([3,1,2]) == 2",       // dispari
  "assert median([5,5,5]) == 5",       // dispari
  "assert median([9,1,5,3,7]) == 5",   // dispari
  "assert median([1,2,3,4]) == 2.5",   // pari (l'edge)
  "assert median([1,2]) == 1.5",       // pari
  "assert median([4,3,2,1]) == 2.5",   // pari
];

// il generatore produce candidati (mutanti a singola operazione)
ok(candidateMutants(C).length > 0, "candidateMutants: genera almeno un mutante");

const tasks = generateDeceptiveTasks({ name: "median", refCorrect: C, tests: SUITE });
ok(tasks.length >= 1, `generate: ≥1 task deceptivo USABILE (trovati ${tasks.length})`);

// OGNI task generato deve essere ben-formato (l'oracolo di correttezza del generatore)
for (const t of tasks) {
  ok(providedAreInsufficient(t), `task[${t.mutator}]: i test FORNITI ingannano (passano su C e B)`);
  ok(hiddenIsSound(t), `task[${t.mutator}]: l'oracolo NASCOSTO giudica (passa su C, fallisce su B)`);
  ok(t.nProvided > 0 && t.nHidden > 0, `task: partizioni non-vuote (provided ${t.nProvided}, hidden ${t.nHidden})`);
}

// end-to-end: un task GENERATO alimenta il grader del reward → la traiettoria "naive-ships" (impl=B, dichiara fatto) è PUNITA
{
  const t = tasks[0];
  const naive = gradeVerificationDiscipline({ finalImpl: t.refBuggy, modelTests: [], declaredDone: true, testsExecutedLive: false }, t);
  ok(naive.penalty && naive.reward === REWARD.PENALTY, "e2e: su task GENERATO, naive-ships (fidarsi del verde fornito) è punito");
  const good = gradeVerificationDiscipline({ finalImpl: t.refCorrect, modelTests: [], declaredDone: true, testsExecutedLive: false }, t);
  ok(good.outcome && !good.penalty, "e2e: su task GENERATO, l'impl corretta passa l'oracolo nascosto");
}

console.log(`\ndeceptive-task-gen: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);

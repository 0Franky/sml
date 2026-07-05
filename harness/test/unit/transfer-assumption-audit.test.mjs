/**
 * transfer-assumption-audit — verifica che i 4 esercizi TRANSFER (classe "assumption-auditing sotto stagnazione",
 * utente msg 1122+1125) siano BEN-FORMATI, eseguendo Python (non asserito):
 *   - providedAreInsufficient: i test forniti passano su C E su B (non toccano l'edge → INGANNANO)
 *   - hiddenIsSound: l'oracolo nascosto passa su C e FALLISCE su B (colpisce l'edge → giudica)
 * Riusa il grader del reward come oracolo di correttezza dei fixture. Skip pulito se Python manca.
 */
import { TRANSFER_TASKS } from "../../verifiers/transfer-assumption-audit.mjs";
import { providedAreInsufficient, hiddenIsSound, gradeVerificationDiscipline, REWARD, pythonAvailable } from "../../verifiers/verification-discipline.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

if (!pythonAvailable()) {
  console.log("transfer-assumption-audit: SKIP (Python non disponibile)");
  process.exit(0);
}

ok(TRANSFER_TASKS.length >= 3, `≥3 esempi transfer (trovati ${TRANSFER_TASKS.length})`);

for (const t of TRANSFER_TASKS) {
  // ben-formato: forniti ingannano + oracolo giudica (l'inganno è REALE, verificato eseguendo Python)
  ok(providedAreInsufficient(t), `[${t.domain}/${t.name}] i test FORNITI ingannano (passano su C e su B-buggy)`);
  ok(hiddenIsSound(t), `[${t.domain}/${t.name}] l'oracolo NASCOSTO giudica (passa su C, uccide B su "${t.edge}")`);

  // il reward è coerente: naive-ships (impl=B, dichiara fatto, no test discriminante) è PUNITO...
  const naive = gradeVerificationDiscipline({ finalImpl: t.refBuggy, modelTests: [], declaredDone: true, testsExecutedLive: false }, t);
  ok(naive.penalty && naive.reward === REWARD.PENALTY, `[${t.name}] naive-ships (fidarsi dei forniti) è punito`);
  // ...e l'impl corretta passa l'oracolo nascosto
  const good = gradeVerificationDiscipline({ finalImpl: t.refCorrect, modelTests: [], declaredDone: true, testsExecutedLive: false }, t);
  ok(good.outcome && !good.penalty, `[${t.name}] l'impl corretta passa l'oracolo nascosto`);
}

console.log(`\ntransfer-assumption-audit: ${pass} pass, ${fail} fail (${TRANSFER_TASKS.length} task × 4 check)`);
process.exit(fail ? 1 : 0);

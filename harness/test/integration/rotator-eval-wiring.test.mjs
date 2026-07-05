/**
 * rotator-eval-wiring — test di WIRING della rotazione chiavi come la usano DAVVERO run-ab/run-session-ab
 * (utente msg 1195, regola #14/#17). Gli 8 unit test coprono la MATEMATICA pura del rotator (reportBlocked/Ok a mano);
 * qui si compone la logica REALE dell'eval: `isRateLimitedResult(w)` (detection 429 su forme-worker reali) + la STESSA
 * `reportKey` di run-ab.mjs + il rotator → dimostra che il mapping risultato-worker → reportBlocked/reportOk è corretto.
 * Un bug nel mapping (es. trattare un successo come 429, o un timeout come quota) sfuggirebbe agli unit puri ma NON qui.
 * Deterministico (sleep no-op), gira in CI.
 */
import { makeKeyRotator, isRateLimited, isRateLimitedResult } from "../../eval/gemini-key-rotator.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

// reportKey: COPIA ESATTA della logica di run-ab.mjs (mappa un risultato-worker sul rotator).
const reportKey = (rot, i, w) => { if (i < 0) return; if (isRateLimitedResult(w)) rot.reportBlocked(i); else if (!w.apiError) rot.reportOk(i); };

// forme-worker realistiche (ciò che run-one/run-session ritornano davvero)
const R429 = { httpStatus: 429, error: "429 Too Many Requests" };
const RQUOTA = { apiError: true, error: "You exceeded your current quota, please check your plan and billing details" };
const REXHAUST = { apiError: true, sendErr: "RESOURCE_EXHAUSTED" };
const ROK = { solutionCode: "def f():\n  return 1", ms: 120, turns: 3 };            // successo
const RTIMEOUT = { apiError: true, error: "worker exit 1: ETIMEDOUT connecting" };  // errore NON-quota

const noSleep = async () => {};

(async () => {
  // ── isRateLimitedResult: detection corretta su forme reali (il pezzo con la logica) ──
  ok(isRateLimitedResult(R429) === true, "429 http → rate-limited");
  ok(isRateLimitedResult(RQUOTA) === true, "messaggio 'quota' → rate-limited");
  ok(isRateLimitedResult(REXHAUST) === true, "RESOURCE_EXHAUSTED su sendErr → rate-limited");
  ok(isRateLimitedResult(ROK) === false, "successo (solutionCode) → NON rate-limited");
  ok(isRateLimitedResult(RTIMEOUT) === false, "errore NON-quota (timeout) → NON rate-limited");
  ok(isRateLimitedResult(null) === false, "null → NON rate-limited");
  ok(isRateLimited("HTTP 429") && !isRateLimited("all good"), "isRateLimited stringa base");

  // ── WIRING: 2 blocchi 429 CONSECUTIVI su una chiave (via reportKey) → morta, ruota all'altra ──
  {
    const rot = makeKeyRotator(2, { sleep: noSleep });
    let k = await rot.next(); ok(k === 0, "prima cella → key0");
    reportKey(rot, k, R429);                        // key0 429 (1)
    ok(rot.deadCount() === 0, "1 blocco: key0 non ancora morta");
    k = await rot.next(); reportKey(rot, k, ROK);   // key1 ok (round-robin)
    k = await rot.next(); ok(k === 0, "torna su key0");
    reportKey(rot, k, R429);                        // key0 429 (2° consecutivo)
    ok(rot.deadCount() === 1, "2 blocchi consecutivi su key0 (via risultati 429 reali) → morta");
    ok((await rot.next()) === 1, "next salta key0 morta → key1");
  }

  // ── WIRING: un SUCCESSO in mezzo azzera il contatore (non consecutivi non uccidono) ──
  {
    const rot = makeKeyRotator(1, { sleep: noSleep, maxResets: 0 });
    reportKey(rot, 0, R429);   // blocco
    reportKey(rot, 0, ROK);    // successo → azzera
    reportKey(rot, 0, R429);   // blocco (non 2° consecutivo)
    ok(rot.deadCount() === 0, "429→ok→429 su chiave singola: NON morta (reset in mezzo)");
  }

  // ── WIRING: errore NON-quota (timeout) NON marca la chiave (né blocked né ok) ──
  {
    const rot = makeKeyRotator(1, { sleep: noSleep, maxResets: 0 });
    reportKey(rot, 0, RTIMEOUT);
    reportKey(rot, 0, RTIMEOUT);
    ok(rot.deadCount() === 0, "2 timeout consecutivi (non-quota) → chiave NON morta (giusto: non è quota)");
  }

  // ── WIRING: tutte morte via reportKey → cooldown+sblocco, poi abort a cap ──
  {
    const rot = makeKeyRotator(2, { sleep: noSleep, maxResets: 1 });
    reportKey(rot, 0, R429); reportKey(rot, 0, R429);  // key0 morta
    reportKey(rot, 1, RQUOTA); reportKey(rot, 1, RQUOTA); // key1 morta (forma-quota diversa)
    ok(rot.deadCount() === 2, "entrambe morte via reportKey (429 + quota)");
    const k = await rot.next();
    ok(k === 0 || k === 1, "dopo cooldown #1 ritorna una chiave viva (sblocco)");
    reportKey(rot, 0, R429); reportKey(rot, 0, R429);
    reportKey(rot, 1, R429); reportKey(rot, 1, R429);
    ok((await rot.next()) === -1, "cap cooldown esaurito con tutte morte → abort (-1)");
  }

  console.log(`rotator-eval-wiring test: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();

/**
 * anti-fixation — LOGICA PURA del rung metacognitivo anti-fissazione (scaffold triggered su stagnazione).
 * Concept: [[wiki/concepts/anti-fixation-metacognition-rung]] (idee utente 1045/1056/1057). Diagnosi: HE/145 (il modello
 * permuta il tie-breaking ~10 turni senza riquestionare l'assunzione sbagliata).
 *
 * Principi (dal concept):
 *  - Trigger sul SEGNALE "il task NON progredisce", NON su "stesso comando 2×" (HE/145 variava il comando). Si contano i
 *    PASSI SENZA PROGRESSO (fail, oppure neutral mentre già in un debug-loop dopo un fail); un PASS azzera. I neutral di
 *    SETUP pre-fail non contano. [FIX post-diagnosi HE/145: contare solo i fail si fermava a 1 perché il modello passa al
 *    print-debugging — output neutral — invece di ripetere il test. Vedi updateStagnation.]
 *  - Nudge ESCALANTE, conciso, effimero (solo-quel-turno), iniettato SOLO a stagnazione → zero costo-contesto altrimenti (anti-H6).
 *  - Reward OUTCOME-anchored (il fix vero è il training): qui è solo lo scaffold; l'esito (ha rotto la stagnazione?) è il segnale RL.
 * PURO: nessun import di pi. L'estensione (anti-fixation.ts) mantiene la storia-segnali per-conv e chiama queste funzioni.
 */

/** Soglie di fail-consecutivi per i tre gradini (SSOT, #16). */
export const DEFAULT_RUNG_CFG = { rung1: 3, rung2: 5, rung3: 7 };

/**
 * Segnale di progresso del turno dai tool_result (euristica): la VERIFICA è fallita / passata / neutra.
 * Conservativa: "fail" solo se ci sono marker di fallimento e NON di successo (evita falsi trigger).
 * @param {string[]} toolResultTexts  testi dei tool_result del turno (es. output di `pytest`/`python`/`bash`)
 * @returns {"fail"|"pass"|"neutral"}
 */
export function classifyTurnSignal(toolResultTexts) {
  const blob = (Array.isArray(toolResultTexts) ? toolResultTexts : []).join("\n").toLowerCase();
  if (!blob.trim()) return "neutral";
  // fix UD7 — CONTEGGI espliciti ("N failed"/"N passed": cargo/jest/go/pytest). Un conteggio ZERO ("0 failed") NON è un
  // fallimento, un "0 passed" NON è un successo → ancoro al MAGNITUDO del numero, non alla PAROLA (che compare anche in
  // "0 failed" → prima un green "5 passed; 0 failed" cadeva in "neutral" e la stagnazione escalava DOPO un successo).
  const failNums = [...blob.matchAll(/(\d+)\s+failed/g)].map((m) => Number(m[1]));
  const passNums = [...blob.matchAll(/(\d+)\s+passed/g)].map((m) => Number(m[1]));
  const anyFailCount = failNums.some((n) => n > 0);
  const anyPassCount = passNums.some((n) => n > 0);
  const zeroFailExplicit = failNums.length > 0 && !anyFailCount; // c'è "N failed" ma tutti 0 → NON è un fail
  const zeroPassExplicit = passNums.length > 0 && !anyPassCount; // c'è "N passed" ma tutti 0 → NON è un pass
  // marker SENZA-conteggio, guardati dal conteggio-zero esplicito (così "5 passed; 0 failed" green non triggera fail via
  // la parola nuda). fix UD8: `^ok\b` con flag /m riconosce il pass di go-test ("ok  pkg 0.3s" a inizio-riga in mezzo al blob).
  const failWord = !zeroFailExplicit && /assertionerror|traceback|\bexception\b|\berror:|\bfailed\b|exit\s*(code\s*)?[1-9]/.test(blob);
  const passWord = !zeroPassExplicit && /\bpassed\b|\ball tests? pass|^ok\b|\bok\b\s*$|exit\s*(code\s*)?0\b|\bsuccess\b/m.test(blob);
  const failed = anyFailCount || failWord;
  const passed = anyPassCount || passWord;
  if (failed && !passed) return "fail";
  if (passed && !failed) return "pass";
  return "neutral"; // ambiguo o misto → non muove il contatore
}

/**
 * Aggiorna lo stato di stagnazione (contatore = "passi senza progresso", non solo fail consecutivi).
 *   pass    → reset a 0 (progresso reale).
 *   fail    → +1.
 *   neutral → +1 SOLO se siamo GIÀ in stallo (n>0), cioè in un debug-loop dopo un fail; i neutral di SETUP pre-fail
 *             (scrivi-file, ecc.) NON contano. Motivo (diagnosi HE/145, trace 2026-07-05): dopo il 1° test fallito il
 *             modello passa al PRINT-DEBUGGING (`python -c "print(...)"` → output neutral), NON ripete lo stesso test →
 *             contare solo i fail consecutivi si ferma a 1 e il rung non scatta mai. La stagnazione VERA è "molti passi
 *             senza mai un PASS". Coerente col principio del concept: trigger su "task-non-progredisce", non comando-identico.
 * @param {{consecutiveFails:number}} state  @param {"fail"|"pass"|"neutral"} signal
 */
export function updateStagnation(state, signal) {
  const n = Number.isInteger(state?.consecutiveFails) ? state.consecutiveFails : 0;
  if (signal === "pass") return { consecutiveFails: 0 };
  if (signal === "fail") return { consecutiveFails: n + 1 };
  return { consecutiveFails: n > 0 ? n + 1 : 0 }; // neutral: conta come stallo solo se il debug-loop è già iniziato
}

/** Livello del rung dai fail-consecutivi (0 = nessun intervento). */
export function rungLevel(consecutiveFails, cfg = DEFAULT_RUNG_CFG) {
  const n = Number.isInteger(consecutiveFails) ? consecutiveFails : 0;
  if (n >= cfg.rung3) return 3;
  if (n >= cfg.rung2) return 2;
  if (n >= cfg.rung1) return 1;
  return 0;
}

/** Testo del nudge escalante per livello (conciso, effimero). '' se livello 0. Marker `<stagnation_check>` (non user-facing). */
export function rungMessage(level) {
  switch (level) {
    case 1: // externalize + DECOMPOSE (utente 1057 + 1045)
      return "<stagnation_check>You've failed the same verification several times. STOP trying variants. In your notes record (a) what you tried and why it failed, (b) DECOMPOSE the problem into sub-parts; then solve ONE sub-part at a time, verifying each.</stagnation_check>";
    case 2: // questiona l'ASSUNZIONE (mirato alla fissazione HE/145)
      return "<stagnation_check>Your attempts keep varying the SAME dimension. List your ASSUMPTIONS about this problem — which one might be FALSE? (e.g. is your helper/formula itself correct, not just the ordering?) Verify that assumption directly, in isolation.</stagnation_check>";
    case 3: // diversifica/lateral + verification-loop (utente 1056 + 1057)
      return "<stagnation_check>This APPROACH is not working. Propose ONE fundamentally different approach that questions your central assumption, and try it. Debug systematically: isolate the failing case, print intermediate values, test the helper alone. If it doesn't beat your best attempt within a few turns, revert to the best.</stagnation_check>";
    default:
      return "";
  }
}

/**
 * Pipeline PURA end-to-end (testabile senza pi): data la STORIA dei segnali-turno, ritorna cosa iniettare ORA.
 * @param {("fail"|"pass"|"neutral")[]} signalHistory  in ordine cronologico
 * @param {{rung1:number,rung2:number,rung3:number}} [cfg]
 * @returns {{level:number, message:string, consecutiveFails:number}}
 */
export function stagnationInjection(signalHistory, cfg = DEFAULT_RUNG_CFG) {
  let state = { consecutiveFails: 0 };
  for (const s of Array.isArray(signalHistory) ? signalHistory : []) state = updateStagnation(state, s);
  const level = rungLevel(state.consecutiveFails, cfg);
  return { level, message: rungMessage(level), consecutiveFails: state.consecutiveFails };
}

export default { DEFAULT_RUNG_CFG, classifyTurnSignal, updateStagnation, rungLevel, rungMessage, stagnationInjection };

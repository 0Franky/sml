/**
 * anti-fixation — LOGICA PURA del rung metacognitivo anti-fissazione (scaffold triggered su stagnazione).
 * Concept: [[wiki/concepts/anti-fixation-metacognition-rung]] (idee utente 1045/1056/1057). Diagnosi: HE/145 (il modello
 * permuta il tie-breaking ~10 turni senza riquestionare l'assunzione sbagliata).
 *
 * Principi (dal concept):
 *  - Trigger sul SEGNALE "il task NON progredisce" (verifica fallita ripetuta), NON su "stesso comando 2×" (HE/145
 *    variava il comando → un trigger su comando-identico lo mancherebbe). → si contano i FAIL consecutivi, a prescindere
 *    dal comando; un PASS azzera (progresso), un neutro non conta.
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
  const failed = /assertionerror|traceback|\bfailed\b|\bexception\b|\berror:|\d+\s+failed|exit\s*(code\s*)?[1-9]/.test(blob);
  const passed = /\bpassed\b|\ball tests? pass|\bok\b\s*$|\d+\s+passed|exit\s*(code\s*)?0\b|\bsuccess\b/.test(blob);
  if (failed && !passed) return "fail";
  if (passed && !failed) return "pass";
  return "neutral"; // ambiguo o misto → non muove il contatore
}

/**
 * Aggiorna lo stato di stagnazione con un nuovo segnale. fail→+1; pass→reset (progresso); neutral→invariato.
 * @param {{consecutiveFails:number}} state  @param {"fail"|"pass"|"neutral"} signal
 */
export function updateStagnation(state, signal) {
  const n = Number.isInteger(state?.consecutiveFails) ? state.consecutiveFails : 0;
  if (signal === "fail") return { consecutiveFails: n + 1 };
  if (signal === "pass") return { consecutiveFails: 0 };
  return { consecutiveFails: n };
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

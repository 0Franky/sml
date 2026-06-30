/**
 * secrets-registry — registry CONDIVISO dei segreti dinamici per-sessione (in-memory, MAI su disco).
 *
 * Single source of truth dei segreti registrati via `add_secret`, condivisa tra TUTTI i confini d'uscita:
 *  - secrets-guardrail (hook tool_result → redige l'output dei tool in ingresso al context),
 *  - var-ops `render_template`/`emitToUser` (interpolazione → redazione finale verso l'utente).
 *
 * Perché un modulo a parte (fix review P0 2026-06-29): prima il Set era module-private dentro
 * `secrets-guardrail.ts`, quindi `render_template` (in `var-ops.ts`) lo bypassava (dynamicSecrets=[]) →
 * un segreto dinamico in una var usciva in chiaro. Un modulo ESM condiviso è un singleton di processo:
 * tutte le extension che lo importano vedono lo STESSO Set → niente canale cieco.
 */

/** secrets-map DINAMICA: valori per-sessione, in-memory (NON persistiti). */
const DYNAMIC_SECRETS = new Set();

// Guardie su add_secret (review-loop #3 2026-06-29, P2 add_secret-no-guard): il valore registrato viene redatto
// per LITERAL substring da OGNI tool_result / risposta finale / interpolazione. Un valore corto o poco-vario
// (es. "e", "true", "1234") corromperebbe ogni output successivo (footgun availability + amplificazione di
// prompt-injection: un tool_result ostile che induce add_secret("e") avvelenerebbe la sessione). Quindi:
export const MIN_SECRET_LEN = 8; // sotto = redigerebbe testo comune
export const MIN_SECRET_DISTINCT = 5; // pochi char distinti (aaaaaaaa, 12121212) = non un segreto opaco
export const MAX_SECRETS = 256; // cap anti-crescita/costo

/**
 * Registra un valore segreto, applicando le guardie. Ritorna `{ ok, size, reason? }`.
 * @param {string} value
 * @returns {{ ok: boolean, size: number, reason?: string }}
 */
export function addSecret(value) {
  if (typeof value !== "string") return { ok: false, size: DYNAMIC_SECRETS.size, reason: "valore non-stringa" };
  if (value.length < MIN_SECRET_LEN) {
    return { ok: false, size: DYNAMIC_SECRETS.size, reason: `troppo corto (<${MIN_SECRET_LEN} char): redigerebbe testo legittimo` };
  }
  if (new Set(value).size < MIN_SECRET_DISTINCT) {
    return { ok: false, size: DYNAMIC_SECRETS.size, reason: `troppo poco vario (<${MIN_SECRET_DISTINCT} caratteri distinti): non sembra un segreto opaco` };
  }
  if (!DYNAMIC_SECRETS.has(value) && DYNAMIC_SECRETS.size >= MAX_SECRETS) {
    return { ok: false, size: DYNAMIC_SECRETS.size, reason: `secrets-map piena (max ${MAX_SECRETS})` };
  }
  DYNAMIC_SECRETS.add(value);
  return { ok: true, size: DYNAMIC_SECRETS.size };
}

/**
 * registerEgressRaw — registra un valore nel Set di egress SENZA le guardie min-len/distinct. Per i SEALED-SECRETS
 * (review P1): sono provisionati OUT-OF-BAND dall'utente (env), NON dal modello, quindi il footgun/DoS che motiva
 * MIN_SECRET_LEN non si applica; ma DEVONO essere sempre redigibili (invariante: ogni sealed-value ∈ egress Set,
 * altrimenti un valore corto/poco-vario eco-ato rientrerebbe nel context/transcript non redatto). @returns {boolean}
 */
export function registerEgressRaw(value) {
  if (typeof value !== "string" || value.length < 1) return false;
  if (!DYNAMIC_SECRETS.has(value) && DYNAMIC_SECRETS.size >= MAX_SECRETS) return false;
  DYNAMIC_SECRETS.add(value);
  return true;
}

/** Il Set condiviso dei segreti dinamici (da passare a redactText/emitToUser). */
export function getDynamicSecrets() {
  return DYNAMIC_SECRETS;
}

/** Svuota la secrets-map (per i test; o su fine-sessione). */
export function clearSecrets() {
  DYNAMIC_SECRETS.clear();
}

export default { addSecret, getDynamicSecrets, clearSecrets };

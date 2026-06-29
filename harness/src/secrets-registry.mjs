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

/** Registra un valore segreto. Ritorna la dimensione corrente della secrets-map. */
export function addSecret(value) {
  if (typeof value === "string" && value.length > 0) DYNAMIC_SECRETS.add(value);
  return DYNAMIC_SECRETS.size;
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

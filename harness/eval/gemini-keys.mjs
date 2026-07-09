/**
 * gemini-keys — loader CONDIVISO (SSOT #16) delle chiavi Gemini per gli eval, con rotazione multi-chiave (utente 2026-07-05).
 *
 * `.env` supporta:
 *   GEMINI_API_KEYS = key1,key2,key3   (plurale, comma/space-separated) → PRECEDENZA, abilita la rotazione
 *   GEMINI_API_KEY  = key              (singola, fallback retro-compat)
 * Il free-tier Gemini ha quota per-DAY per-modello: con N chiavi si distribuisce il carico (round-robin per-task) e si
 * ruota su errore-API (retry su chiave fresca) → N× headroom prima dell'esaurimento. MAI stampare i valori delle chiavi.
 */
import { loadEnvKeys } from "./env-keys.mjs";

/**
 * Estrae la lista di chiavi Gemini da un testo .env (o dal file .env se non passato).
 * Delega al loader generico `env-keys` (SSOT #16) con prefix "GEMINI_API" → GEMINI_API_KEYS (plurale) → GEMINI_API_KEY.
 * @param {string} [envText] contenuto .env (iniettabile per i test); default = legge harness/.env
 * @returns {string[]} chiavi non vuote (GEMINI_API_KEYS ha precedenza; fallback GEMINI_API_KEY)
 */
export function loadGeminiKeys(envText) {
  return loadEnvKeys("GEMINI_API", envText);
}

/** Sceglie la chiave all'`index` (modulo, wrap-around difensivo). Lancia se non c'è alcuna chiave. */
export function pickKey(keys, index) {
  if (!Array.isArray(keys) || keys.length === 0) throw new Error("nessuna GEMINI_API_KEY(S) in .env");
  const n = keys.length;
  const i = ((Math.trunc(Number(index) || 0) % n) + n) % n;
  return keys[i];
}

/** Maschera una chiave per il logging (mai stampare il valore). */
export function maskKey(key) {
  if (typeof key !== "string" || key.length < 8) return "****";
  return key.slice(0, 4) + "…" + key.slice(-2);
}

export default { loadGeminiKeys, pickKey, maskKey };

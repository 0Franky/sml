/**
 * gemini-keys — loader CONDIVISO (SSOT #16) delle chiavi Gemini per gli eval, con rotazione multi-chiave (utente 2026-07-05).
 *
 * `.env` supporta:
 *   GEMINI_API_KEYS = key1,key2,key3   (plurale, comma/space-separated) → PRECEDENZA, abilita la rotazione
 *   GEMINI_API_KEY  = key              (singola, fallback retro-compat)
 * Il free-tier Gemini ha quota per-DAY per-modello: con N chiavi si distribuisce il carico (round-robin per-task) e si
 * ruota su errore-API (retry su chiave fresca) → N× headroom prima dell'esaurimento. MAI stampare i valori delle chiavi.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ENV_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");

/**
 * Estrae la lista di chiavi da un testo .env (o dal file .env se non passato).
 * @param {string} [envText] contenuto .env (iniettabile per i test); default = legge harness/.env
 * @returns {string[]} chiavi non vuote (GEMINI_API_KEYS ha precedenza; fallback GEMINI_API_KEY)
 */
export function loadGeminiKeys(envText) {
  let text = envText;
  if (text == null) { try { text = readFileSync(ENV_PATH, "utf-8"); } catch { text = ""; } }
  const keys = [];
  const plural = text.match(/^\s*GEMINI_API_KEYS\s*=\s*(.+?)\s*$/m);
  if (plural) {
    for (const k of plural[1].replace(/^["']|["']$/g, "").split(/[,\s]+/)) { const t = k.trim(); if (t) keys.push(t); }
  }
  if (keys.length === 0) {
    const single = text.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/m);
    if (single) { const t = single[1].replace(/^["']|["']$/g, "").trim(); if (t) keys.push(t); }
  }
  return keys;
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

/**
 * env-keys — loader GENERICO multi-key da `.env` (SSOT #16: generalizza gemini-keys per QUALSIASI provider).
 * Legge `<PREFIX>_KEYS` (plurale, comma/space-separated) → fallback `<PREFIX>_KEY` (singola). Abilita la rotazione
 * multi-chiave come escamotage free-tier (utente msg 2026-07-08: GROQ_KEYS/KAGGLE_KEYS, "predisponi rotazione").
 *   GROQ_KEYS   = k1,k2      → prefix "GROQ"
 *   KAGGLE_KEYS = k1         → prefix "KAGGLE"
 *   GEMINI_API_KEYS = ...    → prefix "GEMINI_API" (usato da gemini-keys via delega)
 * MAI stampare i valori delle chiavi (usa maskKey per il logging).
 *
 * ⚠️ TRAPPOLA MISURATA IL 2026-09-15 — questo loader legge SOLO IL FILE `.env` e **non guarda
 * `process.env`**. Esportare `OPENROUTER_KEYS=chiave-finta` prima di lanciare un eval **non disarma
 * nulla**: la chiave vera del file viene usata lo stesso. Ci sono cascato credendo di fare una prova
 * a spesa zero, ed è costata 0,054 $. Chi legge queste chiavi (`eval/_pi-session.mjs:50`) prova
 * PRIMA `process.env.OPENAI_API_KEY` — quella è la leva documentata, ma non l'ho verificata: so che
 * viene letta per prima, non che disarmi. ⭐ L'unica prova di «non ha speso» resta il **credito
 * prima/dopo**, non la convinzione di aver disarmato una variabile.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ENV_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");

/**
 * Estrae le chiavi per `prefix` da un testo .env (o dal file harness/.env se non passato).
 * @param {string} prefix es. "GROQ", "KAGGLE", "GEMINI_API"
 * @param {string} [envText] contenuto .env (iniettabile per i test)
 * @returns {string[]} chiavi non vuote (`<prefix>_KEYS` ha precedenza; fallback `<prefix>_KEY`)
 */
export function loadEnvKeys(prefix, envText) {
  let text = envText;
  if (text == null) { try { text = readFileSync(ENV_PATH, "utf-8"); } catch { text = ""; } }
  const keys = [];
  const esc = String(prefix).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const plural = text.match(new RegExp(`^\\s*${esc}_KEYS\\s*=\\s*(.+?)\\s*$`, "m"));
  if (plural) {
    for (const k of plural[1].replace(/^["']|["']$/g, "").split(/[,\s]+/)) { const t = k.trim(); if (t) keys.push(t); }
  }
  if (keys.length === 0) {
    const single = text.match(new RegExp(`^\\s*${esc}_KEY\\s*=\\s*(.+?)\\s*$`, "m"));
    if (single) { const t = single[1].replace(/^["']|["']$/g, "").trim(); if (t) keys.push(t); }
  }
  return keys;
}

/** Maschera una chiave per il logging (mai stampare il valore intero). */
export function maskKey(key) {
  if (typeof key !== "string" || key.length < 8) return "****";
  return key.slice(0, 4) + "…" + key.slice(-2);
}

export default { loadEnvKeys, maskKey };

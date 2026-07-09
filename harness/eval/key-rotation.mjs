/**
 * key-rotation — rotazione IN-PROCESS multi-key on-429/5xx per l'interceptor fetch di run-session (utente msg 1448).
 *
 * STESSO pattern di run-base-probe.mjs `chat()` (retry + backoff esponenziale + chiave-SUCCESSIVA), estratto qui per
 * essere TESTABILE (rule #14/#17: la logica di wiring non deve vivere inline non-testata) e riusabile (rule #16 SSOT/DRY).
 *
 * ⚠ NON è il gemini-key-rotator: quello ruota ACROSS worker a livello ORCHESTRATORE (run-ab/run-session-ab marca una
 * chiave "blocked" e assegna EVAL_KEY_INDEX al worker successivo). QUESTO ruota WITHIN una singola sessione, quando un
 * long-run (es. 12 task in 1 sessione) satura la quota per-chiave a metà: senza rotazione in-process i task restanti
 * fallirebbero tutti (era il caso "Gemini 12-task inconclusive"). I due livelli sono COMPLEMENTARI, non duplicati.
 *
 * La chiave si sostituisce nell'header giusto per il provider:
 *   - Gemini REST (SDK @google/genai): header `x-goog-api-key` (verificato in @google/genai buildHeaders);
 *   - openai-compat (Groq/OpenRouter): header `Authorization: Bearer <key>`.
 */

/** Rimpiazza la chiave nell'header appropriato al provider. Ritorna `[url, opts]` con headers aggiornati (opts NON mutato). */
export function swapKey(u, url, opts, key) {
  const h = new Headers(opts?.headers || {});
  if (/generativelanguage|:generateContent/i.test(String(u)) || h.has("x-goog-api-key")) {
    h.set("x-goog-api-key", key); // Gemini REST
  } else {
    h.set("Authorization", `Bearer ${key}`); // openai-compat
  }
  return [url, { ...opts, headers: h }];
}

/** true se lo status HTTP giustifica un retry con la chiave successiva (rate-limit o errore server transitorio). */
export function isRetriableStatus(status) {
  return status === 429 || status >= 500;
}

/**
 * Esegue `fetchFn(url, opts)` ritentando con la CHIAVE SUCCESSIVA su 429/5xx (pattern run-base-probe `chat()`).
 *   - attempt 0 usa la richiesta ORIGINALE (chiave corrente già impostata da pi);
 *   - attempt ≥1 sostituisce la chiave con `keys[(start + attempt) % keys.length]` + backoff esponenziale;
 *   - 4xx non-429 → errore vero → NON si ritenta (ritorna subito);
 *   - `keys` vuoto (es. Ollama locale) → nessuna rotazione, ritorna la prima risposta;
 *   - `onRotate(attempt)` chiamato ad ogni rotazione (per il ground-truth: conteggio rotazioni, rule #15).
 * @returns {Promise<Response>} l'ultima Response ottenuta (ok, oppure l'errore finale se i retry si esauriscono).
 */
export async function fetchWithRotation({ fetchFn, url, opts, u, keys, start = 0, max = 6, sleep, onRotate, onAttempt }) {
  const list = Array.isArray(keys) ? keys : [];
  const wait = typeof sleep === "function" ? sleep : (ms) => new Promise((r) => setTimeout(r, ms));
  let res = null;
  for (let attempt = 0; attempt <= max; attempt++) {
    const [u2, o2] = attempt === 0 ? [url, opts] : swapKey(u, url, opts, list[(start + attempt) % list.length]);
    res = await fetchFn(u2, o2);
    if (typeof onAttempt === "function") await onAttempt(attempt, res);
    if (isRetriableStatus(res.status) && list.length > 0 && attempt < max) {
      if (typeof onRotate === "function") onRotate(attempt);
      await wait(Math.min(8000, 500 * 2 ** attempt)); // backoff esponenziale identico a run-base-probe
      continue; // ritenta con la chiave SUCCESSIVA (aggira il rate-limit per-chiave)
    }
    return res;
  }
  return res;
}

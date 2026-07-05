/**
 * gemini-key-rotator — rotazione ROBUSTA delle chiavi Gemini SENZA richieste extra (utente msg 1175/1177/1178).
 *
 * Impara le chiavi bloccate DAI risultati reali dell'eval (ZERO ping di pre-flight — quello era controproducente:
 * intenzione "risparmia quota" → conseguenza "fa richieste extra che bruciano quota"). Design (utente msg 1178):
 *  - una chiave è "morta" solo dopo `deadAfter` blocchi (429) **CONSECUTIVI**; un successo AZZERA il contatore
 *    → distingue l'RPM transitorio (~60s) dal vero esaurimento (non si marca morta al primo blocco);
 *  - quando TUTTE sono morte → `next()` aspetta `cooldownMs` (l'RPM si scarica), RIPRISTINA tutte e riprova;
 *  - CAP `maxResets` sui cooldown (azione→conseguenza): se è esaurimento GIORNALIERO vero — non RPM — il
 *    wait+sblocco+riprendi andrebbe in loop infinito a bruciare tempo → dopo `maxResets` cooldown senza sblocco
 *    `next()` restituisce -1 (abort: esaurimento reale).
 *
 * SSOT dei parametri (#16): i default vivono QUI — `deadAfter=2`, `cooldownMs=60000` (60s), `maxResets=5` (utente
 * msg 1180); i caller (run-ab, run-session-ab) passano solo `log`, così le costanti non si duplicano tra i file.
 * PURO/testabile: `sleep` iniettabile (test istantanei); nessun I/O di rete qui.
 */
export function makeKeyRotator(nkeys, opts = {}) {
  const deadAfter = opts.deadAfter ?? 2;
  const cooldownMs = opts.cooldownMs ?? 60000;
  const maxResets = opts.maxResets ?? 5;
  const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const log = opts.log ?? (() => {});
  const n = Math.max(1, Math.trunc(nkeys) || 1);
  const fails = new Array(n).fill(0); // blocchi 429 CONSECUTIVI per chiave (azzerati da un successo)
  let cursor = 0, resets = 0;
  const isDead = (i) => fails[i] >= deadAfter;
  return {
    /** successo su `i` → azzera i blocchi consecutivi (non è più "in blocco"). */
    reportOk(i) { if (Number.isInteger(i) && i >= 0 && i < n) fails[i] = 0; },
    /** 429/rate-limit su `i` → +1 blocco consecutivo (morta a `deadAfter`). */
    reportBlocked(i) { if (Number.isInteger(i) && i >= 0 && i < n) fails[i] += 1; },
    /** quante chiavi attualmente morte. */
    deadCount() { return fails.filter((_, i) => isDead(i)).length; },
    /** quanti cooldown-reset già usati. */
    resetsUsed() { return resets; },
    /**
     * Prossimo indice di chiave VIVA (round-robin, salta le morte). Se tutte morte: attende cooldownMs + ripristina
     * e riprova, fino a `maxResets` volte; poi restituisce -1 (esaurimento reale). ASYNC (può attendere).
     */
    async next() {
      for (;;) {
        for (let t = 0; t < n; t++) { const i = cursor++ % n; if (!isDead(i)) return i; }
        if (resets >= maxResets) { log(`tutte le ${n} chiavi morte e ${maxResets} cooldown esauriti → abort (esaurimento reale, non RPM)`); return -1; }
        resets++;
        log(`tutte le ${n} chiavi morte (${deadAfter}+ blocchi consecutivi) → attendo ${Math.round(cooldownMs / 1000)}s e ripristino (cooldown ${resets}/${maxResets})`);
        await sleep(cooldownMs);
        fails.fill(0); // l'RPM dovrebbe essersi scaricato → tutte di nuovo tentabili
      }
    },
  };
}

/**
 * isRateLimited — true se la stringa segnala un rate-limit/quota Gemini (429/RESOURCE_EXHAUSTED).
 * SSOT (#16): prima era duplicata inline in run-ab.mjs E run-session-ab.mjs → estratta qui, testata una volta.
 */
export function isRateLimited(s) {
  return /429|quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(String(s || ""));
}

/**
 * isRateLimitedResult — true se il RISULTATO di un worker eval è un rate-limit (429 http o messaggio di quota su
 * uno qualsiasi dei campi-errore). È la logica che decide `reportBlocked` vs `reportOk` nel wiring di run-ab/run-session-ab.
 * @param {{httpStatus?:number, retryErr?:string, sendErr?:string, error?:string}|null|undefined} w
 */
export function isRateLimitedResult(w) {
  return !!w && (w.httpStatus === 429 || isRateLimited(w.retryErr) || isRateLimited(w.sendErr) || isRateLimited(w.error));
}

export default { makeKeyRotator, isRateLimited, isRateLimitedResult };

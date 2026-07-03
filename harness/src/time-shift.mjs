/**
 * time-shift — ancoraggio TEMPORALE delle lane (utente msg 848/849, 2026-07-03). PURO (testabile, no I/O).
 *
 * Principio (regola permanente): ogni item di una lane deve portare il proprio TEMPO, così il modello ricostruisce
 * la timeline dai TIMESTAMP e NON si affida alla sequenza/posizione che l'harness gli costruisce — che può essere
 * sbagliata (bug, load al contrario, race). I timestamp sono l'ORDINE AUTORITATIVO; la posizione è solo comodità.
 * Stessa filosofia dell'anchoring anti-reward-hacking: non fidarti della presentazione, àncora al ground-truth.
 *
 * Formato: lo START sessione è ASSOLUTO (una volta, nell'header lane); ogni riga porta uno SHIFT compatto rispetto
 * allo start (`+37s`, `+3m12s`, `+1h04m`) → niente char ripetuti inutili + si ragiona relativi all'inizio, come
 * pensa un umano. Lo start-epoch è GIÀ nel convId (`sess-<epochMs>-<reason>`), quindi lo shift è a costo zero.
 */

/** Estrae l'epoch-ms di START dal convId `sess-<epochMs>-<reason>`. `null` se non riconosciuto (es. "main"). */
export function parseSessionStartMs(convId) {
  const m = /^sess-(\d{10,16})-/.exec(String(convId ?? ""));
  if (!m) return null;
  const ms = Number(m[1]);
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

/** ISO-8601 UTC dello start (per l'header lane). `null` se ms non valido. */
export function sessionStartIso(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z"); // secondi, senza ms (compatto)
}

/**
 * Shift compatto dal deltaMs (item.ts - sessionStartMs). Clamp a +0s se negativo (skew/clock).
 * Scale: `+0s`..`+59s` · `+Xm[SSs]` (<1h) · `+XhMMm` (<24h) · `+XdHHh` (≥24h). `null` → "".
 */
export function formatShift(deltaMs) {
  if (!Number.isFinite(deltaMs)) return "";
  let s = Math.max(0, Math.round(deltaMs / 1000));
  if (s < 60) return `+${s}s`;
  const pad = (n) => String(n).padStart(2, "0");
  if (s < 3600) {
    const m = Math.floor(s / 60), ss = s % 60;
    return ss ? `+${m}m${pad(ss)}s` : `+${m}m`;
  }
  if (s < 86400) {
    const h = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60);
    return mm ? `+${h}h${pad(mm)}m` : `+${h}h`;
  }
  const d = Math.floor(s / 86400), hh = Math.floor((s % 86400) / 3600);
  return hh ? `+${d}d${pad(hh)}h` : `+${d}d`;
}

/**
 * Prefisso shift pronto per una riga di lane: `[+37s] ` (con spazio finale) dato item.ts e lo start.
 * "" se manca uno dei due (degrada con grazia: nessun prefisso, la riga resta valida).
 */
export function shiftPrefix(itemTsMs, sessionStartMs) {
  if (!Number.isFinite(itemTsMs) || !Number.isFinite(sessionStartMs)) return "";
  const f = formatShift(itemTsMs - sessionStartMs);
  return f ? `[${f}] ` : "";
}

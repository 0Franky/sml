/**
 * session-context — identità di sessione CONDIVISA tra le extension pi.
 *
 * Il `convId` indicizza la conversazione in `conversations.db`. Era un GLOBAL-di-processo mutabile (`let _convId`)
 * scritto una volta su session_start e letto no-arg: due AgentSession vive nello STESSO realm Node (SDK
 * multi-sessione, `SessionManager.inMemory()` ×2) collidevano — la 2ª session_start sovrascriveva la cella e i
 * hook della 1ª leggevano il convId della 2ª (interleave P1, review-loop 2026-06-29; D3, audit 2026-07-04).
 *
 * FIX D3 (2026-07-04): il convId è ora SESSION-scoped in `Map<sessionId, convId>`; ogni hook/tool lo risolve dal
 * PROPRIO ctx via `convIdFor(ctx)` (`ctx.sessionManager.getSessionId()`, esposto per-runner da pi → identifica
 * esattamente la sessione che fira, anche con N sessioni concorrenti). La connessione DB resta CONDIVISA (è
 * arg-driven e session-agnostica): si de-globalizza SOLO il valore convId, non la connessione. Lo slot persistito
 * `_conv_id:<sessionId>` in vars.db (source-of-truth durevole per resume) è invariato: la Map è cache runtime.
 *
 * `_fallbackConvId` copre il caso davvero headless (ctx senza sessionManager) e i vecchi shim getConvId/setConvId;
 * è tenuto allineato all'ULTIMA sessione registrata → il bare getConvId() ha la semantica retro-compatibile del
 * vecchio global (mai peggiore: non degrada a "main" in una TUI single-session).
 */

/** @type {Map<string, string>} sessionId → convId (una entry per sessione viva nel processo). */
const _bySession = new Map();
/** convId di fallback: caso headless (ctx senza sessionManager) + shim legacy. Segue l'ultima sessione registrata. */
let _fallbackConvId = "main";

/** Estrae il sessionId dal ctx dell'hook/tool pi in modo difensivo (null se assente/headless). */
export function sessionIdOf(ctx) {
  try {
    const sid = ctx?.sessionManager?.getSessionId?.();
    return sid ? String(sid) : null;
  } catch {
    return null;
  }
}

/**
 * Registra il convId di una sessione (chiamato una volta su session_start, con l'output di resolveConvId).
 * Aggiorna sia la Map per-sessione (se c'è sessionId) sia `_fallbackConvId` (ultima sessione → retro-compat shim).
 */
export function setConvIdForSession(sessionId, convId) {
  if (!convId) return;
  const cid = String(convId);
  if (sessionId) _bySession.set(String(sessionId), cid);
  _fallbackConvId = cid;
}

/** convId della sessione che possiede questo ctx; fallback all'ultima registrata (o "main") se headless. */
export function convIdFor(ctx) {
  const sid = sessionIdOf(ctx);
  if (sid && _bySession.has(sid)) return _bySession.get(sid);
  return _fallbackConvId;
}

/** Rimuove la entry di una sessione (su session_shutdown) per evitare crescita della Map. */
export function clearSession(sessionId) {
  if (sessionId) _bySession.delete(String(sessionId));
}

/** @deprecated shim legacy: opera su `_fallbackConvId` (solo path headless-senza-sessionManager + test). Usa convIdFor(ctx). */
export function setConvId(id) { if (id) _fallbackConvId = String(id); }

/** @deprecated shim legacy: ritorna `_fallbackConvId`. Usa convIdFor(ctx) nel codice runtime. */
export function getConvId() { return _fallbackConvId; }

/**
 * resolveConvId — decide il convId (e se PERSISTERLO) per una session_start. INVARIATA dal fix D3.
 *
 * MODO PER-SESSIONE (`opts.perSession=true`, quando pi espone `getSessionId()`): lo slot è keyato per-sessione
 * (`_conv_id:<sessionId>`), quindi `persisted` = il convId DI QUESTA sessione. Se presente → RIUSA (reload/resume
 * della stessa sessione); assente (prima volta, incl. /new e /fork che hanno un sessionId nuovo) → NUOVO + PERSISTI
 * (sotto la propria chiave). Ogni sessione è isolata → /new B poi /resume A NON si mischiano. (review-loop #3 P2.)
 *
 * MODO FALLBACK (slot globale, `getSessionId` non disponibile es. SDK headless): /new,/fork = conversazione nuova
 * EFFIMERA (non clobbera lo slot condiviso, così un /resume verso la sessione principale riusa il convId giusto);
 * startup/reload/resume riusano il persistito; la prima sessione lo persiste.
 *
 * @param {string} reason  startup|reload|new|resume|fork
 * @param {string|null|undefined} persisted  convId persistito (per la chiave pertinente) o assente
 * @param {number|string} stamp  timestamp per il nuovo id (iniettato per i test)
 * @param {{ perSession?: boolean }} [opts]
 * @returns {{ convId: string, isNew: boolean, persist: boolean }}
 */
export function resolveConvId(reason, persisted, stamp, opts = {}) {
  if (opts.perSession === true) {
    if (persisted) return { convId: String(persisted), isNew: false, persist: false }; // sessione già vista → riusa
    return { convId: `sess-${stamp}-${reason}`, isNew: true, persist: true }; // nuova per QUESTA sessione → persisti
  }
  // fallback slot-globale:
  if (reason === "new" || reason === "fork") {
    return { convId: `sess-${stamp}-${reason}`, isNew: true, persist: false }; // effimero: NON clobbera lo slot
  }
  if (!persisted) {
    return { convId: `sess-${stamp}-${reason}`, isNew: true, persist: true }; // prima sessione → persisti
  }
  return { convId: String(persisted), isNew: false, persist: false }; // riusa il persistito
}

export default { setConvId, getConvId, resolveConvId, sessionIdOf, setConvIdForSession, convIdFor, clearSession };

/**
 * session-context — identità di sessione CONDIVISA tra le extension pi (singleton ESM per-realm).
 *
 * Il `convId` indicizza la conversazione in `conversations.db`. Era hard-coded "main" → sessioni/fork
 * concorrenti si interlacciavano nello stesso flusso (review-loop 2026-06-29, P1). Qui è impostato per-sessione
 * (su `session_start` da conversation-capture) e LETTO da context-assembly per assemblare la lane
 * <messages_with_user> sulla STESSA conversazione → i due lati concordano senza round-trip sul DB.
 *
 * Fallback "main" se `session_start` non scatta (es. SDK headless minimale) → comportamento legacy, mai rotto.
 */
let _convId = "main";

/** Imposta il convId della sessione corrente (idempotente; chiamato una volta su session_start). */
export function setConvId(id) { if (id) _convId = String(id); }

/** convId della sessione corrente (default "main"). */
export function getConvId() { return _convId; }

/**
 * resolveConvId — decide il convId (e se PERSISTERLO) per una session_start.
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

export default { setConvId, getConvId, resolveConvId };

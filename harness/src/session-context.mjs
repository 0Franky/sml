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
 * resolveConvId — decide il convId per una session_start: NUOVO solo per conversazioni genuinamente nuove
 * (new/fork) o se non c'è nulla di persistito; altrimenti (startup/reload/resume) RIUSA il convId persistito
 * → la conversazione SOPRAVVIVE a reload/resume (la lane non va a vuoto). (review-loop #2 2026-06-29, P1 convId-reload.)
 * @param {string} reason  startup|reload|new|resume|fork
 * @param {string|null|undefined} persisted  convId persistito (vars.db meta) o assente
 * @param {number|string} stamp  timestamp per il nuovo id (iniettato per i test)
 * @returns {{ convId: string, isNew: boolean }}
 */
export function resolveConvId(reason, persisted, stamp) {
  if (reason === "new" || reason === "fork" || !persisted) {
    return { convId: `sess-${stamp}-${reason}`, isNew: true };
  }
  return { convId: String(persisted), isNew: false };
}

export default { setConvId, getConvId, resolveConvId };

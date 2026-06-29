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

export default { setConvId, getConvId };

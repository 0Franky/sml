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
 *  - startup/reload/resume con convId persistito → RIUSA (la conversazione sopravvive, la lane non va a vuoto).
 *  - prima sessione (niente persistito) → NUOVO convId, da PERSISTERE (continuità su reload/resume della stessa).
 *  - /new e /fork → conversazione genuinamente NUOVA: convId effimero da NON persistere → così non SOVRASCRIVE
 *    lo slot globale `_conv_id` (un solo slot per progetto): un successivo /resume verso la sessione "principale"
 *    riusa il convId giusto invece dell'ultimo /new. (review-loop #3 2026-06-29, P2 convId-cross-sessione.)
 *
 * LIMITE MVP (single-active-conversation, documentato): lo storage è uno slot globale, non per-session-file
 * (pi non espone il file della sessione corrente su session_start, solo `previousSessionFile` = quella che si
 * LASCIA). Residuo noto: il /resume verso una sessione NON-principale, o il reload di una sessione aperta con
 * /new, può non recuperare la conversazione esatta. Multi-sessione interlacciata = post-MVP (model-testbook TB).
 *
 * @param {string} reason  startup|reload|new|resume|fork
 * @param {string|null|undefined} persisted  convId persistito (vars.db meta) o assente
 * @param {number|string} stamp  timestamp per il nuovo id (iniettato per i test)
 * @returns {{ convId: string, isNew: boolean, persist: boolean }}
 */
export function resolveConvId(reason, persisted, stamp) {
  if (reason === "new" || reason === "fork") {
    return { convId: `sess-${stamp}-${reason}`, isNew: true, persist: false }; // effimero: NON clobbera lo slot
  }
  if (!persisted) {
    return { convId: `sess-${stamp}-${reason}`, isNew: true, persist: true }; // prima sessione → persisti
  }
  return { convId: String(persisted), isNew: false, persist: false }; // riusa il persistito
}

export default { setConvId, getConvId, resolveConvId };

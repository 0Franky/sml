/**
 * state-db — connessioni DB CONDIVISE (singleton per-path) per le extension pi.
 *
 * Problema (review-loop 2026-06-29, P2): ogni extension faceva `new VarsQueue(DB_PATH)` → ~7 connessioni
 * `DatabaseSync` allo STESSO file `.pi/state/vars.db` (ognuna in WAL → handle su -wal/-shm), mai chiuse →
 * leak di file-handle su reload/switch-sessione (e su Windows può bloccare la rotazione del file DB).
 *
 * Fix: un singolo modulo-singleton (ESM, cache per-realm) memoizza UNA VarsQueue / ConversationStore per path.
 * Tutte le extension nello stesso processo condividono la connessione; `closeAll()` (su `session_shutdown`) le
 * rilascia. Drop-in per `new VarsQueue(...)`: stesso oggetto, stessa semantica. Se due extension passassero opts
 * diverse vince la PRIMA (tutte usano `{agent:"orchestrator"}` → nessun conflitto).
 *
 * Nota: la SSOT dello schema/migrazione resta nel costruttore di VarsQueue; qui si gestisce solo il ciclo di vita.
 */
import { VarsQueue } from "./vars-queue.mjs";
import { ConversationStore } from "./conversation-store.mjs";

const _vars = new Map(); // dbPath -> VarsQueue
const _convs = new Map(); // dbPath -> ConversationStore

/** VarsQueue condivisa per `dbPath` (creata alla prima richiesta). */
export function getVarsQueue(dbPath = ".pi/state/vars.db", opts = {}) {
  let vq = _vars.get(dbPath);
  if (!vq) { vq = new VarsQueue(dbPath, opts); _vars.set(dbPath, vq); }
  else if (opts.agent && vq.agent !== opts.agent) {
    // cache-hit con agent diverso dall'istanza memoizzata: "vince-la-prima" → l'opts qui è IGNORATO. È un sintomo
    // di incoerenza tra call-site (tutte dovrebbero passare lo stesso agent); lo segnalo invece di mascherarlo.
    // (review-loop #3 2026-06-29, P2 singleton-agent.)
    console.warn(`[state-db] getVarsQueue("${dbPath}"): opts.agent="${opts.agent}" ignorato (istanza già creata con agent="${vq.agent}")`);
  }
  return vq;
}

/** ConversationStore condiviso per `dbPath` (creato alla prima richiesta). */
export function getConversationStore(dbPath = ".pi/state/conversations.db", opts = {}) {
  let cs = _convs.get(dbPath);
  if (!cs) { cs = new ConversationStore(dbPath, opts); _convs.set(dbPath, cs); }
  return cs;
}

/** Chiude e dimentica TUTTE le connessioni condivise. Idempotente. Da chiamare su `session_shutdown`. */
export function closeAll() {
  for (const vq of _vars.values()) { try { vq.close(); } catch { /* già chiusa */ } }
  for (const cs of _convs.values()) { try { cs.close(); } catch { /* già chiusa */ } }
  _vars.clear();
  _convs.clear();
}

export default { getVarsQueue, getConversationStore, closeAll };

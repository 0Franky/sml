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
 * SSOT (audit 2026-07-04, CLAUDE.md #16): questo modulo è ANCHE la sorgente unica dei path DB
 * (VARS_DB_PATH/CONV_DB_PATH, derivati da STATE_DIR) e dell'agent di default (ORCHESTRATOR_AGENT). Gli accessor
 * defaultano path+agent e si fanno carico del `mkdir` alla prima apertura file-backed → i call-site diventano
 * `getVarsQueue()` / `getConversationStore()` senza argomenti (niente più path+mkdir+agent ricopiati in ~10 extension).
 *
 * Nota: la SSOT dello schema/migrazione resta nel costruttore di VarsQueue; qui si gestisce solo il ciclo di vita.
 */
import { VarsQueue } from "./vars-queue.mjs";
import { ConversationStore } from "./conversation-store.mjs";
import { ToolCallStore } from "./tool-call-store.mjs";
import { STATE_DIR } from "./state-paths.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * SSOT dei suffissi dei tre DB di stato, derivati da UNA qualsiasi state-dir. Serve a ISOLARE i run (driver
 * headless, eval A/B) che girano con una `HARNESS_STATE_DIR` propria: il chiamante deriva i path della SUA dir
 * senza ri-hardcodare `${dir}/vars.db` (evita la duplicazione del suffisso → CLAUDE.md #16). I `*_DB_PATH` sotto
 * sono il caso-default (STATE_DIR corrente, letto all'import). @param {string} stateDir
 */
export function dbPathsFor(stateDir) {
  return {
    vars: `${stateDir}/vars.db`,
    conv: `${stateDir}/conversations.db`,
    toolcall: `${stateDir}/tool-calls.db`,
  };
}

/** Path del DB dello stato (vars/tasks/rules/meta/changelog/…). Derivato da STATE_DIR (SSOT directory). */
export const VARS_DB_PATH = dbPathsFor(STATE_DIR).vars;
/** Path del DB della conversazione persistita per-ID (lane <messages_with_user> + get_conversation). */
export const CONV_DB_PATH = dbPathsFor(STATE_DIR).conv;
/** Path del DB delle tool-call persistite (recovery oltre il ring-24, tool view_tool_calls). */
export const TOOLCALL_DB_PATH = dbPathsFor(STATE_DIR).toolcall;
/** Identità agente di default delle extension dell'orchestratore (namespace + `who` nel change-log). */
export const ORCHESTRATOR_AGENT = "orchestrator";

const _vars = new Map(); // dbPath -> VarsQueue
const _convs = new Map(); // dbPath -> ConversationStore
const _toolcalls = new Map(); // dbPath -> ToolCallStore

/** Crea la dir di stato alla PRIMA apertura file-backed (idempotente). No-op per ":memory:" (test). */
function ensureStateDir(dbPath) {
  if (dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });
}

/** VarsQueue condivisa per `dbPath` (creata alla prima richiesta). Default: vars.db dell'orchestratore. */
export function getVarsQueue(dbPath = VARS_DB_PATH, opts = { agent: ORCHESTRATOR_AGENT }) {
  let vq = _vars.get(dbPath);
  if (!vq) { ensureStateDir(dbPath); vq = new VarsQueue(dbPath, opts); _vars.set(dbPath, vq); }
  else if (opts.agent && vq.agent !== opts.agent) {
    // cache-hit con agent diverso dall'istanza memoizzata: "vince-la-prima" → l'opts qui è IGNORATO. È un sintomo
    // di incoerenza tra call-site (tutte dovrebbero passare lo stesso agent); lo segnalo invece di mascherarlo.
    // (review-loop #3 2026-06-29, P2 singleton-agent.)
    console.warn(`[state-db] getVarsQueue("${dbPath}"): opts.agent="${opts.agent}" ignorato (istanza già creata con agent="${vq.agent}")`);
  }
  return vq;
}

/** ConversationStore condiviso per `dbPath` (creato alla prima richiesta). Default: conversations.db dell'orchestratore. */
export function getConversationStore(dbPath = CONV_DB_PATH, opts = { agent: ORCHESTRATOR_AGENT }) {
  let cs = _convs.get(dbPath);
  if (!cs) { ensureStateDir(dbPath); cs = new ConversationStore(dbPath, opts); _convs.set(dbPath, cs); }
  return cs;
}

/** ToolCallStore condiviso per `dbPath` (creato alla prima richiesta). Default: tool-calls.db dell'orchestratore. */
export function getToolCallStore(dbPath = TOOLCALL_DB_PATH) {
  let ts = _toolcalls.get(dbPath);
  if (!ts) { ensureStateDir(dbPath); ts = new ToolCallStore(dbPath); _toolcalls.set(dbPath, ts); }
  return ts;
}

/** Chiude e dimentica TUTTE le connessioni condivise. Idempotente. Da chiamare su `session_shutdown`. */
export function closeAll() {
  for (const vq of _vars.values()) { try { vq.close(); } catch { /* già chiusa */ } }
  for (const cs of _convs.values()) { try { cs.close(); } catch { /* già chiusa */ } }
  for (const ts of _toolcalls.values()) { try { ts.close(); } catch { /* già chiusa */ } }
  _vars.clear();
  _convs.clear();
  _toolcalls.clear();
}

export default { getVarsQueue, getConversationStore, getToolCallStore, closeAll, dbPathsFor, VARS_DB_PATH, CONV_DB_PATH, TOOLCALL_DB_PATH, ORCHESTRATOR_AGENT };

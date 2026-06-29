/**
 * conversation-store — la CONVERSAZIONE persistita per ID (Strada 2, ADR 2026-06-29-context-as-first-person-mind).
 *
 * Realizza il principio 3 dell'ADR: la conversazione è un artefatto memorizzato con un **ID** che (a) sopravvive
 * al compact (file SQLite su disco), (b) è condivisibile coi subagent per riferimento (passano l'ID + range,
 * non il testo), (c) nel workspace se ne mostra una **finestra degli ultimi N messaggi VERBATIM** + un marker
 * recuperabile-per-ID per il pieno. È lo stesso pattern di sliding-window-variable-tool applicato alla chat.
 *
 * Disaccoppiato da pi (prende/ritorna dati puri) → testabile con node puro (node:sqlite, come vars-queue).
 * La lane `<messages_with_user>` è un blocco SEPARATO e ULTIMO (zona volatile, dopo il prefisso stabile del
 * <context>): la finestra verbatim cambia a ogni turno, quindi NON va dentro il prefisso cache-stable.
 * (review-loop 2026-06-29, finding volatile-messages-vs-stable-prefix.)
 *
 * Timestamp: Date.now() (epoch ms) — codice runtime Node, non script workflow.
 */
import { DatabaseSync } from "node:sqlite";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS conversations (
  seq     INTEGER PRIMARY KEY AUTOINCREMENT,   -- id monotono globale (ordine totale, recupero-per-ID)
  conv_id TEXT NOT NULL,                        -- l'ID della conversazione
  role    TEXT NOT NULL,                        -- user | assistant | tool | system
  text    TEXT NOT NULL,
  ts      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conv ON conversations(conv_id, seq);
`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export class ConversationStore {
  /**
   * @param {string} dbPath  ":memory:" oppure un path file (es. ".pi/state/conversations.db").
   * @param {{agent?: string}} [opts]
   */
  constructor(dbPath = ":memory:", opts = {}) {
    this.agent = opts.agent ?? "main";
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec(SCHEMA);
  }

  close() { this.db.close(); }

  /** Appende un turno alla conversazione `convId`. Ritorna il `seq` (id monotono). */
  append(convId, role, text, { ts = Date.now() } = {}) {
    const r = this.db.prepare(`INSERT INTO conversations (conv_id, role, text, ts) VALUES (?,?,?,?)`)
      .run(convId, role, String(text), ts);
    return Number(r.lastInsertRowid);
  }

  /** Numero totale di turni della conversazione. */
  count(convId) {
    return this.db.prepare(`SELECT COUNT(*) AS c FROM conversations WHERE conv_id = ?`).get(convId).c;
  }

  /** Ultimi N turni in ordine cronologico (oldest→newest), VERBATIM. È la vista mostrata nel workspace. */
  window(convId, n = 6) {
    const rows = this.db.prepare(
      `SELECT seq, role, text, ts FROM conversations WHERE conv_id = ? ORDER BY seq DESC LIMIT ?`
    ).all(convId, n);
    return rows.reverse();
  }

  /** Turni per range di `seq` (inclusivo) — è il recupero-per-ID che un subagent chiama (passa conv_id + range). */
  range(convId, fromSeq, toSeq) {
    return this.db.prepare(
      `SELECT seq, role, text, ts FROM conversations WHERE conv_id = ? AND seq >= ? AND seq <= ? ORDER BY seq`
    ).all(convId, fromSeq, toSeq);
  }

  /** Conversazione completa (usare con parsimonia: la `window` è la vista di default). */
  all(convId) {
    return this.db.prepare(`SELECT seq, role, text, ts FROM conversations WHERE conv_id = ? ORDER BY seq`).all(convId);
  }
}

/**
 * buildMessagesLane — la lane `<messages_with_user>`: blocco SEPARATO e ULTIMO (zona volatile, dopo il prefisso
 * cache-stable). Mostra gli ultimi N turni VERBATIM (no perdita delle parole esatte recenti) + un marker
 * recuperabile-per-ID per i più vecchi. Cap di dimensione (`charCap`): se la finestra eccede, droppa i più
 * VECCHI mantenendo i più recenti verbatim (e ne segnala il numero nascosto).
 *
 * F (meccanismo deterministico): finestra + cap + marker + store-by-ID. S (politica, futura): quanti tenere /
 * quando recuperare i più vecchi (window-aware-fetching). Senza training il default-N è già utile (DEGRADATA-MA-UTILE).
 *
 * @param {ConversationStore} store
 * @param {string} convId
 * @param {{ n?: number, charCap?: number }} [opts]
 * @returns {string} blocco "<messages_with_user …>…</messages_with_user>" oppure "" (conversazione vuota)
 */
export function buildMessagesLane(store, convId, { n = 6, charCap = 4000 } = {}) {
  const total = store.count(convId);
  if (!total) return "";
  let win = store.window(convId, n);
  const sizeOf = (rows) => rows.reduce((a, r) => a + r.text.length, 0);
  while (win.length > 1 && sizeOf(win) > charCap) win = win.slice(1); // droppa i più vecchi, tieni i recenti verbatim
  // se l'UNICO messaggio rimasto eccede ancora il cap (paste enorme in un solo turno), tronca il suo testo →
  // il budget della lane resta bounded anche nel caso singolo-messaggio-gigante. (review-loop #2 2026-06-29, P3.)
  if (win.length === 1 && win[0].text.length > charCap) {
    const t = win[0];
    win = [{ ...t, text: t.text.slice(0, charCap) + `…[+${t.text.length - charCap} char — usa get_conversation]` }];
  }
  const shownFrom = win.length ? win[0].seq : total + 1;
  const olderHidden = total - win.length;
  const lines = [`<messages_with_user conv="${esc(convId)}" shown="${win.length}/${total}">`];
  for (const t of win) lines.push(`  [${esc(t.role)}] ${esc(t.text)}`);
  if (olderHidden > 0) {
    lines.push(`  (+${olderHidden} messaggi più vecchi — usa get_conversation conv="${esc(convId)}" range=1..${shownFrom - 1} per il pieno)`);
  }
  lines.push(`</messages_with_user>`);
  return lines.join("\n");
}

/** Ruoli STRUTTURALI non-conversazionali che pi può mettere in testa all'array (es. branchSummary dopo /tree). */
const STRUCTURAL_ROLES = new Set(["branchSummary", "compactionSummary", "custom"]);

/**
 * windowNativeMessages — Strada-2: BOUNDA l'array messaggi NATIVO di pi tenendo gli ULTIMI `keepTurns` turni
 * COMPLETI (con i loro tool_call/tool_result) e sopprimendo la storia più vecchia → niente crescita illimitata
 * (sostituisce la compaction nativa, OFF) senza perdere la continuità multi-turno né i tool_result recenti
 * (review-loop #2 2026-06-29: P1 tool-results-lost, scelta conservativa K-turni invece del solo turno corrente).
 * I turni soppressi restano in conversations.db + curati nella lane <messages_with_user>.
 *
 * Preserva i messaggi STRUTTURALI in testa (branchSummary/compactionSummary/custom da /tree o iniezioni) che
 * altrimenti uno slice puro scarterebbe (review-loop #2, P2 structural-messages).
 *
 * Sotto soglia (≤ keepTurns turni) ritorna lo STESSO riferimento (il caller confronta per identità). (ADR principio-3.)
 *
 * @param {Array<{role?:string}>} messages
 * @param {{ keepTurns?: number }} [opts]
 * @returns {Array} l'array ridotto agli ultimi keepTurns turni (+ head strutturale), o lo stesso `messages`.
 */
export function windowNativeMessages(messages, opts = {}) {
  const keepTurns = opts.keepTurns ?? 4;
  if (!Array.isArray(messages) || messages.length < 2) return messages;
  const userIdx = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i] && messages[i].role === "user") userIdx.push(i);
  }
  if (userIdx.length <= keepTurns) return messages; // sotto soglia → niente storia da rimuovere
  const cut = userIdx[userIdx.length - keepTurns]; // indice d'inizio del K-esimo turno dal fondo
  if (cut <= 0) return messages;
  const head = [];
  for (let i = 0; i < cut; i++) if (messages[i] && STRUCTURAL_ROLES.has(messages[i].role)) head.push(messages[i]);
  const tail = messages.slice(cut);
  return head.length ? head.concat(tail) : tail;
}

export default ConversationStore;

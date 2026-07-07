/**
 * tool-call-store — le tool-call del modello PERSISTITE e queryable (fix gap F28, utente msg 1342).
 *
 * PROBLEMA (F28): il ring buffer (`tool-call-log.mjs`) tiene solo le ULTIME 24 call in-memory → le operazioni più
 * vecchie ("cosa avevo fatto 30 azioni fa?") sono IRRECUPERABILI (i messaggi sì via conversations.db, le tool-call no).
 * Questo store persiste OGNI call su SQLite (come conversation-store) → recuperabilità totale messaggi + operazioni.
 *
 * DESIGN (SSOT del #seq, rule #16): lo store assegna il **seq GLOBALE** (rowid autoincrement, monotono cross-sessione);
 * il ring lo rispecchia (recordCall riceve quel seq) → il `#N` che il modello cita in <last_tool_calls>/view_tool_calls
 * risolve identico nel ring (fast path) E nello store (recovery dei dropped). Nessuna doppia numerazione divergente.
 *
 * Node-puro (node:sqlite, come conversation-store/vars-queue) → testabile con :memory:. WAL-safe (db-pragmas SSOT).
 */
import { DatabaseSync } from "node:sqlite";
import { applyConcurrencyPragmas } from "./db-pragmas.mjs";
import { renderCallRows } from "./tool-call-log.mjs"; // SSOT del rendering (rule #16): stessa formattazione ring↔store
import { MEMORY_TOOLS } from "./task-digest.mjs"; // SSOT: stesse memory-op filtrate dalla lane <last_tool_calls>

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tool_calls (
  seq     INTEGER PRIMARY KEY AUTOINCREMENT,   -- # globale monotono = il #N citabile dal modello (stabile, cross-sessione)
  conv_id TEXT NOT NULL,                        -- scope conversazione (MVP: "main")
  call_id TEXT,                                 -- id del tool-call (correla start↔result)
  name    TEXT NOT NULL,
  args    TEXT NOT NULL DEFAULT '',             -- sintesi args (già compattata a monte)
  status  TEXT NOT NULL DEFAULT 'pending',      -- pending | ok | error
  result  TEXT NOT NULL DEFAULT '',             -- sintesi risultato (troncata a monte)
  ts      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tc_conv ON tool_calls(conv_id, seq);
CREATE INDEX IF NOT EXISTS idx_tc_call ON tool_calls(conv_id, call_id);
`;

export class ToolCallStore {
  /** @param {string} dbPath ":memory:" | path file (es ".pi/state/tool-calls.db"). */
  constructor(dbPath = ":memory:") {
    this.db = new DatabaseSync(dbPath);
    applyConcurrencyPragmas(this.db); // busy_timeout PRIMA di WAL+SCHEMA (bug P0 lock, SSOT db-pragmas)
    this.db.exec(SCHEMA);
  }
  close() { this.db.close(); }

  /** Appende una tool-call (stato pending). Ritorna il `seq` globale assegnato (= il #N citabile). */
  append(convId, { callId = null, name, args = "", status = "pending", result = "", ts = Date.now() } = {}) {
    if (!name) return 0;
    const r = this.db.prepare(
      `INSERT INTO tool_calls (conv_id, call_id, name, args, status, result, ts) VALUES (?,?,?,?,?,?,?)`
    ).run(convId, callId, String(name), String(args ?? ""), status, String(result ?? ""), ts);
    return Number(r.lastInsertRowid);
  }

  /** Completa l'entry col risultato: per callId (l'ULTIMA pending con quel callId), fallback all'ultima pending. */
  setResult(convId, { callId, isError = false, result = "" } = {}) {
    let row = null;
    if (callId != null) {
      row = this.db.prepare(
        `SELECT seq FROM tool_calls WHERE conv_id = ? AND call_id = ? AND status = 'pending' ORDER BY seq DESC LIMIT 1`
      ).get(convId, callId);
    }
    if (!row) {
      row = this.db.prepare(
        `SELECT seq FROM tool_calls WHERE conv_id = ? AND status = 'pending' ORDER BY seq DESC LIMIT 1`
      ).get(convId);
    }
    if (!row) return false;
    this.db.prepare(`UPDATE tool_calls SET status = ?, result = ? WHERE seq = ?`)
      .run(isError ? "error" : "ok", String(result ?? ""), row.seq);
    return true;
  }

  /** Righe per range di `seq` inclusivo (ordine crescente). Il recupero-per-# che il tool chiama per i dropped. */
  range(convId, fromSeq, toSeq) {
    const lo = Math.min(Number(fromSeq), Number(toSeq));
    const hi = Math.max(Number(fromSeq), Number(toSeq));
    return this.db.prepare(
      `SELECT seq, call_id AS callId, name, args, status, result, ts FROM tool_calls WHERE conv_id = ? AND seq >= ? AND seq <= ? ORDER BY seq ASC`
    ).all(convId, lo, hi);
  }

  /** Ultime `n` call (ordine crescente). */
  recent(convId, n = 8) {
    const k = Number.isFinite(n) && n > 0 ? Math.floor(n) : 8;
    return this.db.prepare(
      `SELECT seq, call_id AS callId, name, args, status, result, ts FROM tool_calls WHERE conv_id = ? ORDER BY seq DESC LIMIT ?`
    ).all(convId, k).reverse();
  }

  /** {total, minSeq, maxSeq} della conversazione (0 se vuota). */
  stats(convId) {
    const r = this.db.prepare(
      `SELECT COUNT(*) AS total, MIN(seq) AS minSeq, MAX(seq) AS maxSeq FROM tool_calls WHERE conv_id = ?`
    ).get(convId);
    return { total: Number(r.total || 0), minSeq: Number(r.minSeq || 0), maxSeq: Number(r.maxSeq || 0) };
  }

  /**
   * view — vista PULL model-facing delle tool-call dallo STORE. È il RECOVERY completo (recupera anche i #seq usciti
   * dal ring-24): stessa semantica di viewRange (ring) ma sorgente PERSISTENTE. `from`/`to` = range #seq inclusivo;
   * altrimenti `count` = ultime N. Filtra le memory-op come la lane (a meno di includeMemoryOps). Rende via
   * renderCallRows (SSOT del rendering, rule #16) → formattazione identica alla lane. Blocco `<tool_calls_view>`.
   * @param {{ from?:number, to?:number, count?:number, includeMemoryOps?:boolean, redact?:(s:string)=>string, sessionStartMs?:number }} [opts]
   */
  view(convId, { from, to, count, includeMemoryOps = false, redact = (s) => s, sessionStartMs = null } = {}) {
    const st = this.stats(convId);
    if (!st.total) return `<tool_calls_view total="0" note="no tool calls recorded yet"></tool_calls_view>`;
    const hasFrom = Number.isFinite(from), hasTo = Number.isFinite(to);
    let rows;
    if (hasFrom || hasTo) {
      rows = this.range(convId, hasFrom ? from : st.minSeq, hasTo ? to : st.maxSeq);
      if (!includeMemoryOps) rows = rows.filter((e) => !MEMORY_TOOLS.has(e.name));
    } else {
      const k = Number.isFinite(count) && count > 0 ? Math.floor(count) : 8;
      // margine per il filtro memory-op: prendo più righe, filtro, poi taglio alle ultime k reali.
      rows = this.recent(convId, includeMemoryOps ? k : k * 3);
      if (!includeMemoryOps) rows = rows.filter((e) => !MEMORY_TOOLS.has(e.name));
      rows = rows.slice(-k);
    }
    if (!rows.length) {
      return `<tool_calls_view total="${st.total}" available="#${st.minSeq}..#${st.maxSeq}" note="no calls in the requested range; available #${st.minSeq}..#${st.maxSeq}"></tool_calls_view>`;
    }
    const body = renderCallRows(rows, { redact, sessionStartMs, withSeq: true });
    return `<tool_calls_view showing="${rows.length}" available="#${st.minSeq}..#${st.maxSeq}" total="${st.total}" note="tool calls #N are stable ids; [+Xs] is time since session start (authoritative order). Recovered from the persistent store — survives the in-context window.">\n${body}\n</tool_calls_view>`;
  }
}

export default ToolCallStore;

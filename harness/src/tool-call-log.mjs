/**
 * tool-call-log — RING BUFFER condiviso delle ultime tool-call del modello (utente msg 811-817, fix amnesia #1).
 *
 * PROBLEMA (2 transcript): con keepTurns:1 il modello NON vede le PROPRIE azioni oltre il turno corrente → quando
 * l'utente chiede "hai visto che valori hai usato?" risponde "non ho contesto" (VERO: le sue tool-call sono finestrate
 * via), ri-chiama con placeholder, ri-allucina nomi di tool appena usati, ripete/flaila. La lane <last_tool_calls>
 * ri-inietta le ultime N azioni (nome + args-sintesi + esito) → dà al modello memoria di cosa ha già fatto.
 *
 * Singleton di processo (= per-sessione, come sealed-secrets): l'estensione `tool-call-log.ts` scrive via record*,
 * `context-assembly` legge via formatLane. PURO/testabile: la redazione è iniettata (fn `redact`), niente import del
 * registry segreti qui → l'estensione passa il redattore reale.
 */

import { shiftPrefix } from "./time-shift.mjs";
import { MEMORY_TOOLS } from "./task-digest.mjs"; // SSOT (rule #16): le stesse memory-op escluse dal digest si filtrano dalla lane

const RING = [];
const DEFAULT_MAX = 24; // capienza del buffer (le ultime N call); la lane ne mostra un sottoinsieme (aumentato da 12: col filtro memory-op serve più margine per mostrare comunque n AZIONI vere)
let SEQ = 0; // sequenza ASSOLUTA monotona (non-resettata dal ring): dà a ogni call un # stabile citabile dal modello
             // (tool pull view_tool_calls, #3 msg 1258) + permette di dire ONESTAMENTE quali # sono usciti dal buffer
             // (no silent-truncation). Puro-deterministico: incremento intero, nessun Date.now/random.

/** Tronca a n char single-line (collassa whitespace). */
function clip(s, n) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

/** Sintesi compatta degli argomenti: fino a 3 coppie key=val (val troncato). Difensivo su qualsiasi shape. */
export function summarizeArgs(args) {
  if (args == null) return "";
  if (typeof args !== "object") return clip(args, 40);
  const keys = Object.keys(args);
  if (!keys.length) return "";
  return keys.slice(0, 3).map((k) => {
    const v = args[k];
    const vs = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `${k}=${clip(vs, 40)}`;
  }).join(", ") + (keys.length > 3 ? ", …" : "");
}

/** Registra una tool-call APPENA invocata (stato pending). callId correla il result. Ritorna il seq assegnato.
 *  `seq` (opz.): se lo store persistente ha già assegnato il rowid globale (SSOT #16), lo rispecchiamo qui → il `#N`
 *  citato dal modello risolve identico nel ring E nello store; altrimenti si usa il contatore interno (path senza-store,
 *  es. test puri). SEQ resta allineato al massimo visto → ringStats.totalSeen onesto anche col seq iniettato. */
export function recordCall({ callId, name, args, ts, seq } = {}) {
  if (!name) return 0;
  // ts (epoch ms) → ANCORAGGIO TEMPORALE della lane (utente msg 848/849): la formatLane lo rende shift dallo start.
  const stamp = Number.isFinite(ts) ? ts : Date.now();
  const s = Number.isFinite(seq) ? seq : ++SEQ;
  if (s > SEQ) SEQ = s;
  RING.push({ seq: s, callId: callId ?? null, name: String(name), args: summarizeArgs(args), status: "pending", result: "", ts: stamp });
  while (RING.length > DEFAULT_MAX) RING.shift();
  return s;
}

/** Completa l'entry col risultato (per callId; fallback: l'ultima pending con lo stesso nome / l'ultima pending). */
export function recordResult({ callId, isError, text } = {}) {
  let e = null;
  if (callId != null) e = RING.find((x) => x.callId === callId && x.status === "pending");
  if (!e) { for (let i = RING.length - 1; i >= 0; i--) if (RING[i].status === "pending") { e = RING[i]; break; } }
  if (!e) return;
  e.status = isError ? "error" : "ok";
  e.result = clip(text, 100);
}

/** Le ultime `n` entry (più recente per ultima). */
export function getRecent(n = 8) {
  const k = Number.isFinite(n) && n > 0 ? n : 8;
  return RING.slice(-k);
}

/** Render di UNA riga (SSOT/DRY, rule #16): shift-temporale + stato + nome(args) + esito. `withSeq` prefissa il #assoluto. */
function renderRow(e, { redact = (s) => s, sessionStartMs = null, withSeq = false } = {}) {
  const args = e.args ? redact(e.args) : "";
  const res = e.result ? ` → ${redact(e.result)}` : e.status === "pending" ? " → (running)" : "";
  const seq = withSeq && e.seq != null ? `#${e.seq} ` : "";
  return `  ${seq}${shiftPrefix(e.ts, sessionStartMs)}[${e.status}] ${e.name}(${args})${res}`;
}

/** Render di PIÙ righe (SSOT del rendering, rule #16): riusato dalla vista store-backed (tool-call-store.view) per
 *  garantire formattazione identica ring↔store. rows = [{seq,name,args,status,result,ts}]. */
export function renderCallRows(rows, opts = {}) {
  return (Array.isArray(rows) ? rows : []).map((e) => renderRow(e, opts)).join("\n");
}

/**
 * Lane `<last_tool_calls>` da iniettare nel context. `redact` (default identità) maschera i segreti da args/result.
 * `sessionStartMs` (opz.) → prefisso SHIFT temporale per riga (ancoraggio, utente msg 848/849). Ritorna "" se vuoto.
 * @param {number} n @param {{ redact?: (s:string)=>string, sessionStartMs?: number }} [opts]
 */
export function formatLane(n = 8, { redact = (s) => s, sessionStartMs = null, excludeMemoryOps = true } = {}) {
  // FILTRO memory-op (utente msg 1259, F24): la lane serve a ricordare le AZIONI, non i salvataggi del modello
  // (note/jot/set_var). Filtra il RING PIENO poi prende le ultime n → mostra sempre n AZIONI vere, non n call miste
  // dove i salvataggi affollano i write-file. Il RING resta intatto (per eventuali query per-range, #3 msg 1258).
  const pool = excludeMemoryOps ? RING.filter((e) => !MEMORY_TOOLS.has(e.name)) : RING;
  const items = pool.slice(-Math.max(1, n));
  if (!items.length) return "";
  const rows = items.map((e) => renderRow(e, { redact, sessionStartMs })).join("\n");
  return `<last_tool_calls count="${items.length}" note="your OWN recent tool calls. The [+Xs] prefix is the time since session start — the AUTHORITATIVE order is by those timestamps, not by line position. Use them to recall what you already did — do NOT repeat a call or contradict a result; if a tool was 'not found', it does not exist (use find_tool).">\n${rows}\n</last_tool_calls>`;
}

/** Statistiche del buffer per il tool pull: quante call bufferizzate + range di #seq disponibile + capienza. */
export function ringStats({ excludeMemoryOps = false } = {}) {
  const pool = excludeMemoryOps ? RING.filter((e) => !MEMORY_TOOLS.has(e.name)) : RING;
  const buffered = pool.length;
  return {
    buffered,
    minSeq: buffered ? pool[0].seq : 0,
    maxSeq: buffered ? pool[pool.length - 1].seq : 0,
    totalSeen: SEQ,           // quante call totali dall'inizio sessione (anche quelle uscite dal buffer)
    cap: DEFAULT_MAX,
    dropped: Math.max(0, SEQ - buffered), // # call non più bufferizzate (uscite dal ring) — onestà anti-silent-truncation
  };
}

/**
 * viewRange — DATA-SOURCE del tool PULL `view_tool_calls` (#3 msg 1258): il modello sceglie QUANTE/QUALE finestra di
 * tool-call rivedere, senza tenerle sempre nel context (scaffold-fade push→pull, msg 1267). PURO/testabile.
 * Semantica (sul #seq ASSOLUTO, stabile): `from`/`to` selezionano l'intervallo [from,to] (inclusivo); in assenza di
 * `from`, `count` prende le ULTIME `count` bufferizzate. Onesto su ciò che è uscito dal ring (header `dropped`).
 * @param {{ from?:number, to?:number, count?:number, includeMemoryOps?:boolean, redact?:(s:string)=>string, sessionStartMs?:number }} [opts]
 * @returns {string} blocco `<tool_calls_view …>` model-facing (o un header vuoto se il buffer è vuoto)
 */
export function viewRange({ from, to, count, includeMemoryOps = false, redact = (s) => s, sessionStartMs = null } = {}) {
  const pool = includeMemoryOps ? RING.slice() : RING.filter((e) => !MEMORY_TOOLS.has(e.name));
  const st = ringStats({ excludeMemoryOps: !includeMemoryOps });
  if (!pool.length) {
    return `<tool_calls_view buffered="0" note="no tool calls buffered yet"></tool_calls_view>`;
  }
  let items;
  const hasFrom = Number.isFinite(from);
  const hasTo = Number.isFinite(to);
  if (hasFrom || hasTo) {
    const lo = hasFrom ? Number(from) : st.minSeq;
    const hi = hasTo ? Number(to) : st.maxSeq;
    items = pool.filter((e) => e.seq >= Math.min(lo, hi) && e.seq <= Math.max(lo, hi));
  } else {
    const k = Number.isFinite(count) && count > 0 ? Math.floor(count) : 8;
    items = pool.slice(-k);
  }
  if (!items.length) {
    return `<tool_calls_view buffered="${st.buffered}" available="#${st.minSeq}..#${st.maxSeq}" dropped="${st.dropped}" note="no calls in the requested range; available range is #${st.minSeq}..#${st.maxSeq}"></tool_calls_view>`;
  }
  const rows = items.map((e) => renderRow(e, { redact, sessionStartMs, withSeq: true })).join("\n");
  const droppedNote = st.dropped > 0 ? ` earlier=#1..#${st.minSeq - 1}-dropped(ring keeps last ${st.cap})` : "";
  return `<tool_calls_view showing="${items.length}" available="#${st.minSeq}..#${st.maxSeq}" total_seen="${st.totalSeen}"${st.dropped > 0 ? ` dropped="${st.dropped}"` : ""} note="tool calls #N are stable ids; [+Xs] is time since session start (authoritative order).${droppedNote}">\n${rows}\n</tool_calls_view>`;
}

/** Svuota il buffer (isolamento di sessione: chiamata a session_shutdown). Resetta anche la sequenza assoluta. */
export function clearToolCallLog() { RING.length = 0; SEQ = 0; }

export default { summarizeArgs, recordCall, recordResult, getRecent, formatLane, ringStats, viewRange, renderCallRows, clearToolCallLog };

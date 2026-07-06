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

/** Registra una tool-call APPENA invocata (stato pending). callId correla il result. */
export function recordCall({ callId, name, args, ts } = {}) {
  if (!name) return;
  // ts (epoch ms) → ANCORAGGIO TEMPORALE della lane (utente msg 848/849): la formatLane lo rende shift dallo start.
  const stamp = Number.isFinite(ts) ? ts : Date.now();
  RING.push({ callId: callId ?? null, name: String(name), args: summarizeArgs(args), status: "pending", result: "", ts: stamp });
  while (RING.length > DEFAULT_MAX) RING.shift();
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
  const rows = items.map((e) => {
    const args = e.args ? redact(e.args) : "";
    const res = e.result ? ` → ${redact(e.result)}` : e.status === "pending" ? " → (running)" : "";
    return `  ${shiftPrefix(e.ts, sessionStartMs)}[${e.status}] ${e.name}(${args})${res}`;
  }).join("\n");
  return `<last_tool_calls count="${items.length}" note="your OWN recent tool calls. The [+Xs] prefix is the time since session start — the AUTHORITATIVE order is by those timestamps, not by line position. Use them to recall what you already did — do NOT repeat a call or contradict a result; if a tool was 'not found', it does not exist (use find_tool).">\n${rows}\n</last_tool_calls>`;
}

/** Svuota il buffer (isolamento di sessione: chiamata a session_shutdown). */
export function clearToolCallLog() { RING.length = 0; }

export default { summarizeArgs, recordCall, recordResult, getRecent, formatLane, clearToolCallLog };

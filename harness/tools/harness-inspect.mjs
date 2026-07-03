/**
 * harness-inspect — SNAPSHOT read-only dello STATO dell'harness a runtime (idea utente msg 914/915, 2026-07-04:
 * "voglio che tu visualizzi la situazione, che tu possa avere tutto sotto controllo, solo certezze").
 *
 * PERCHÉ: turn-trace mostra il confine LLM (cosa RICEVE il modello); questo tool mostra gli INTERNI persistiti
 * (cosa c'è nei DB adesso) — è la cosa che con get_conversation→[] ho dovuto ricostruire a mano con uno script
 * usa-e-getta (which-conv.mjs). Qui è permanente e generale. Complementa turn-trace + harness-attach (CDP).
 *   Tier 0  turn-trace.ts ............ I/O verso il modello (.pi/state/trace/last-turn-full.md)
 *   Tier 2  harness-inspect.mjs ...... STATO persistito (questo file) — read-only, WAL-safe
 *   Tier 3  harness-attach.mjs ....... valori DENTRO le funzioni .mjs a runtime (CDP logpoint)
 *
 * SICUREZZA (non-negoziabile):
 *   - READ-ONLY: apre i DB con { readOnly:true } → non muta nulla, non migra schema, non blocca la TUI viva
 *     (SQLite WAL ammette più lettori + 1 scrittore tra processi). Si può lanciare mentre pi gira.
 *   - MAI valori di segreti in chiaro: le colonne che "sanno di segreto" sono mascherate; ogni testo emesso passa
 *     dal redattore a pattern statici (API key, token, ecc.). È un tool di dev, ma vale la difesa-in-profondità.
 *
 * USO:
 *   node --experimental-sqlite tools/harness-inspect.mjs            # snapshot completo, umano
 *   node --experimental-sqlite tools/harness-inspect.mjs --rows 20  # più righe per tabella (default 8)
 *   node --experimental-sqlite tools/harness-inspect.mjs --json     # output machine-readable
 *   (via npm)  npm run inspect  --  --rows 20
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// --- redattore segreti (best-effort, solo pattern statici — niente registry in-process da un altro processo) ---
let redactText = null;
try { ({ redactText } = await import("../src/secrets-redact.mjs")); } catch { /* fallback: nessuna redazione */ }
function mask(s) {
  const str = String(s ?? "");
  if (!redactText) return str;
  try { return redactText(str, [], { staticPatterns: true }).redacted; } catch { return str; }
}

// --- CLI args ---
const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : def; };
const has = (name) => argv.includes(name);
const ROWS = Math.max(1, parseInt(opt("--rows", "8"), 10) || 8);
const AS_JSON = has("--json");

const STATE = ".pi/state";
const CONV_DB = join(STATE, "conversations.db");
const VARS_DB = join(STATE, "vars.db");
const TRACE_DIR = join(STATE, "trace");

// --- helpers ---
function clip(s, n) { const t = String(s ?? "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n) + "…" : t; }
const SECRET_COL = /secret|token|passw|api[_-]?key|\bkey\b|credential|bearer|sink/i;
function cell(col, val) {
  if (val == null) return "";
  const s = typeof val === "object" ? JSON.stringify(val) : String(val);
  if (SECRET_COL.test(col)) return s.length ? `«masked ${s.length}c»` : "";
  return mask(clip(s, 200));
}
function openRO(path) {
  if (!existsSync(path)) return null;
  try { return new DatabaseSync(path, { readOnly: true }); }
  catch (e) { return { _err: String(e && e.message || e) }; }
}
function tablesOf(db) {
  return db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name);
}

// --- 1) CONVERSATIONS overview (la parte che serviva per get_conversation→[]) ---
function conversationsOverview() {
  const db = openRO(CONV_DB);
  if (!db) return { ok: false, note: `(${CONV_DB} assente)` };
  if (db._err) return { ok: false, note: db._err };
  try {
    const t = tablesOf(db);
    if (!t.includes("conversations")) return { ok: false, note: `(nessuna tabella 'conversations' — tabelle: ${t.join(", ")})` };
    const rows = db.prepare(
      "SELECT conv_id, COUNT(*) n, MIN(seq) firstSeq, MAX(seq) lastSeq, MAX(ts) lastTs FROM conversations GROUP BY conv_id ORDER BY lastTs DESC"
    ).all();
    return { ok: true, rows };
  } catch (e) { return { ok: false, note: String(e && e.message || e) }; }
  finally { db.close(); }
}

// --- 2) mappatura SESSIONE → convId (meta _conv_id:*) da vars.db ---
function sessionConvMapping() {
  const db = openRO(VARS_DB);
  if (!db || db._err) return [];
  try {
    if (!tablesOf(db).includes("meta")) return [];
    return db.prepare("SELECT key, value FROM meta WHERE key LIKE '_conv_id%' ORDER BY key").all();
  } catch { return []; }
  finally { if (db && !db._err) db.close(); }
}

// --- 3) dump generico read-only di un DB (schema-agnostic via sqlite_master) ---
function dumpDb(path) {
  const db = openRO(path);
  if (!db) return { note: `(${path} assente)`, tables: [] };
  if (db._err) return { note: db._err, tables: [] };
  try {
    const out = [];
    for (const t of tablesOf(db)) {
      const n = db.prepare(`SELECT COUNT(*) c FROM "${t}"`).get().c;
      let recent = [];
      if (n > 0) {
        try { recent = db.prepare(`SELECT * FROM "${t}" ORDER BY rowid DESC LIMIT ${ROWS}`).all().reverse(); }
        catch { recent = db.prepare(`SELECT * FROM "${t}" LIMIT ${ROWS}`).all(); }
      }
      out.push({ table: t, count: n, recent });
    }
    return { note: null, tables: out };
  } catch (e) { return { note: String(e && e.message || e), tables: [] }; }
  finally { db.close(); }
}

// --- 4) trace files (turn-trace) ---
function traceSummary() {
  const res = {};
  const lastMd = join(TRACE_DIR, "last-turn.md");
  if (existsSync(lastMd)) res.lastTurn = readFileSync(lastMd, "utf8").trim();
  try {
    const jsonl = readdirSync(TRACE_DIR).filter((f) => f.startsWith("trace-") && f.endsWith(".jsonl"))
      .map((f) => ({ f, m: statSync(join(TRACE_DIR, f)).mtimeMs })).sort((a, b) => b.m - a.m)[0];
    if (jsonl) {
      const lines = readFileSync(join(TRACE_DIR, jsonl.f), "utf8").trim().split("\n").filter(Boolean);
      res.lastRecordFile = jsonl.f;
      try { res.lastRecord = JSON.parse(lines[lines.length - 1]); } catch { /* skip */ }
    }
  } catch { /* trace dir assente */ }
  return res;
}

// ================= RENDER =================
const snapshot = {
  ts: new Date().toISOString(),
  conversations: conversationsOverview(),
  sessionMapping: sessionConvMapping(),
  varsDb: dumpDb(VARS_DB),
  convDb: dumpDb(CONV_DB),
  trace: traceSummary(),
};

if (AS_JSON) { console.log(JSON.stringify(snapshot, null, 2)); process.exit(0); }

const L = [];
L.push(`\n╔══ harness-inspect — snapshot ${snapshot.ts} ══╗`);

// Conversazioni + verdetto (il pezzo che dà "certezza" su quale conv è attiva)
L.push(`\n■ CONVERSATIONS  (${CONV_DB})`);
if (!snapshot.conversations.ok) L.push(`  ${snapshot.conversations.note}`);
else if (snapshot.conversations.rows.length === 0) L.push("  (nessuna conversazione registrata)");
else {
  for (const r of snapshot.conversations.rows) {
    const when = Number.isFinite(r.lastTs) ? new Date(r.lastTs).toISOString() : "?";
    L.push(`  • ${r.conv_id}  →  ${r.n} msg  · seq ${r.firstSeq}..${r.lastSeq}  · ultimo ${when}`);
  }
  const top = snapshot.conversations.rows[0];
  L.push(`  ⇒ PIÙ RECENTE = ${top.conv_id} (${top.n} msg). Un get_conversation su un conv_id diverso/inventato darebbe [].`);
}

// Mappa sessione → conv
L.push(`\n■ SESSION → convId  (vars.db meta _conv_id:*)`);
if (!snapshot.sessionMapping.length) L.push("  (nessuna mappatura — probabile modalità rpc/headless: session_start non scatta, convId resta 'main')");
else for (const m of snapshot.sessionMapping) L.push(`  • ${m.key}  →  ${m.value}`);

// Dump DB
for (const [label, path, dump] of [["VARS DB", VARS_DB, snapshot.varsDb], ["CONVERSATIONS DB", CONV_DB, snapshot.convDb]]) {
  L.push(`\n■ ${label}  (${path})`);
  if (dump.note) { L.push(`  ${dump.note}`); continue; }
  for (const t of dump.tables) {
    L.push(`  ▸ ${t.table}  (${t.count} righe${t.count > ROWS ? `, ultime ${ROWS}` : ""})`);
    for (const r of t.recent) {
      const kv = Object.entries(r).map(([k, v]) => `${k}=${cell(k, v)}`).join("  ");
      L.push(`      ${clip(kv, 320)}`);
    }
  }
}

// Trace
L.push(`\n■ TRACE  (${TRACE_DIR})`);
if (snapshot.trace.lastTurn) L.push(snapshot.trace.lastTurn.split("\n").map((x) => "  " + x).join("\n"));
else L.push("  (nessun last-turn.md — la TUI non ha ancora fatto un turno, o PI_TRACE=0)");
if (snapshot.trace.lastRecord) {
  const r = snapshot.trace.lastRecord;
  L.push(`  ultimo record (${snapshot.trace.lastRecordFile}): convId=${r.convId} native=${r.nativeMessages} userTurns=${r.nativeUserTurns} overlap=${r.laneNativeOverlap} tokens=${r.tokens ?? "?"}`);
}
L.push(`\n╚${"═".repeat(46)}╝\n`);
console.log(L.join("\n"));

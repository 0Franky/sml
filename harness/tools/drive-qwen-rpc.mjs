/**
 * drive-qwen-rpc — driver headless MULTI-TURNO in UN SOLO processo persistente (pi --mode rpc).
 *
 * È l'abilitatore del gate pre-handoff (CLAUDE.md #15): guido IO il modello multi-turno, l'utente non è mai il primo
 * QA. A differenza del print-mode (`drive-qwen.mjs`, un processo per turno), qui un unico processo pi persiste tra i
 * turni → riproduce il path INTERATTIVO reale (input/agent_end che rifano fire nello stesso processo, native-window
 * ed eviction che avanzano). È il driver giusto per gli scenari di MEMORIA/amnesia (nickname-eviction) e per validare
 * l'awareness. `-nc` per non inglobare i CLAUDE.md nel contesto del 9B ([[project_pi_launch_no_context_files]]).
 *
 * AUTO-PULIZIA (2026-07-04): dopo ogni run cancella dallo stato REALE i propri conv (seq>baseSeq) e le var che ha
 * creato (id non presenti nello snapshot pre-run) → non sporca più il DB dell'utente. Il bug P0 amnesia fu innescato
 * proprio da driver di test che scrivevano la conversations.db condivisa con la TUI live (ora anche busy_timeout la
 * rende concorrente-sicura). Opt-out: env KEEP_TEST_DATA=1 (per ispezionare lo stato dopo il run).
 *
 * Uso (cwd=harness/): node tools/drive-qwen-rpc.mjs <session-id> <turns.json>
 *   turns.json = array JSON di stringhe (un prompt-utente per turno). Es. tools/scenarios/nickname-eviction.json
 */
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { CONV_DB_PATH, VARS_DB_PATH } from "../src/state-db.mjs"; // SSOT path DB
import { DB_BUSY_TIMEOUT_MS } from "../src/db-pragmas.mjs"; // SSOT valore di contesa (bug P0)

const PI = "node_modules/@earendil-works/pi-coding-agent/dist/cli.js";
const MODEL = process.env.DRIVE_MODEL || "qwen3.5:9b";
const CONV_DB = CONV_DB_PATH;
const VARS_DB = VARS_DB_PATH;
const SID = process.argv[2];
const turns = JSON.parse(readFileSync(process.argv[3], "utf8"));

function openRO(path) { try { return new DatabaseSync(path, { readOnly: true }); } catch { return null; } }
function maxSeq() {
  const d = openRO(CONV_DB); if (!d) return 0;
  try { const r = d.prepare("SELECT MAX(seq) s FROM conversations").get(); return r && r.s != null ? Number(r.s) : 0; }
  catch { return 0; } finally { d.close(); }
}
function snapshotVarIds() {
  const d = openRO(VARS_DB); if (!d) return new Set();
  try { return new Set(d.prepare("SELECT id FROM vars").all().map((r) => r.id)); }
  catch { return new Set(); } finally { d.close(); }
}
const baseSeq = maxSeq();
const baseVarIds = snapshotVarIds();

const child = spawn("node", [PI, "--mode", "rpc", "-nc", "--model", MODEL, "--session-id", SID], { stdio: ["pipe", "pipe", "pipe"] });
let buf = "", curText = "", curTools = [], resolveTurn = null, extErrors = [];

function send(obj) { child.stdin.write(JSON.stringify(obj) + "\n"); }
function handle(ev) {
  const t = ev.type;
  if (t === "turn_end" && ev.message) {
    for (const c of ev.message.content || []) {
      if (c.type === "text") curText += c.text;
      else if (c.type === "toolCall" || c.type === "tool_use") curTools.push(`${c.name || c.toolName}(${JSON.stringify(c.input || c.arguments || {}).slice(0, 120)})`);
    }
  } else if (t === "agent_end") {
    if (resolveTurn) { const r = resolveTurn; resolveTurn = null; r(); }
  } else if (t === "extension_error") {
    extErrors.push(`${ev.event}:${ev.extensionPath ? String(ev.extensionPath).split(/[\\/]/).pop() : "?"}: ${ev.error}`);
  } else if (t === "extension_ui_request") {
    if (ev.id) send({ type: "extension_ui_response", id: ev.id, cancelled: true }); // no UI atteso: cancella per non bloccare
  }
}
child.stdout.on("data", (d) => {
  buf += d.toString(); let nl;
  while ((nl = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, nl); buf = buf.slice(nl + 1); if (!line.trim()) continue; let ev; try { ev = JSON.parse(line); } catch { continue; } handle(ev); }
});
child.stderr.on("data", (d) => process.stderr.write("[pi-stderr] " + d.toString().slice(0, 200)));
const waitTurn = () => new Promise((res) => { resolveTurn = res; });

function cleanup() {
  if (process.env.KEEP_TEST_DATA === "1") { console.log("\n[cleanup] saltata (KEEP_TEST_DATA=1)"); return; }
  let convDel = 0, varDel = 0;
  try {
    const d = new DatabaseSync(CONV_DB); d.exec(`PRAGMA busy_timeout=${DB_BUSY_TIMEOUT_MS};`);
    convDel = d.prepare("DELETE FROM conversations WHERE seq > ?").run(baseSeq).changes; d.close();
  } catch (e) { console.log("[cleanup] conv:", String(e.message || e).slice(0, 80)); }
  try {
    const d = new DatabaseSync(VARS_DB); d.exec(`PRAGMA busy_timeout=${DB_BUSY_TIMEOUT_MS};`);
    const now = d.prepare("SELECT id FROM vars").all().map((r) => r.id);
    for (const id of now) if (!baseVarIds.has(id)) varDel += d.prepare("DELETE FROM vars WHERE id=?").run(id).changes;
    d.close();
  } catch (e) { console.log("[cleanup] vars:", String(e.message || e).slice(0, 80)); }
  console.log(`\n[cleanup] rimosse ${convDel} righe conv (seq>${baseSeq}) + ${varDel} var di test → stato reale ripristinato.`);
}

async function run() {
  console.log(`=== RPC DRIVE — session=${SID} — ${turns.length} turni (un solo processo) ===`);
  for (let i = 0; i < turns.length; i++) {
    curText = ""; curTools = [];
    const done = waitTurn();
    send({ type: "prompt", message: turns[i], id: String(i + 1) });
    let timedOut = false;
    await Promise.race([done, new Promise((res) => setTimeout(() => { timedOut = true; res(); }, 150000))]);
    console.log(`\n── T${i + 1}: ${turns[i]}`);
    console.log(`   ASSISTANT: ${curText.slice(0, 180)}${curText.length > 180 ? "…" : ""}${timedOut ? "  [⚠ TIMEOUT]" : ""}`);
    if (curTools.length) console.log(`   🔧 ${curTools.join(" ; ")}`);
  }
  child.stdin.end();
  await new Promise((res) => { child.on("exit", res); setTimeout(res, 8000); });

  // ── ground truth: cosa è stato REALMENTE catturato per questa run ──
  const d = openRO(CONV_DB);
  const rows = d ? d.prepare("SELECT conv_id, seq, role, text FROM conversations WHERE seq > ? ORDER BY seq").all(baseSeq) : [];
  if (d) d.close();
  const byConv = {};
  for (const r of rows) { (byConv[r.conv_id] ??= { u: 0, a: 0 }); if (r.role === "user") byConv[r.conv_id].u++; else if (r.role === "assistant") byConv[r.conv_id].a++; }
  console.log(`\n=== GROUND TRUTH ===`);
  console.log(`Turni inviati: ${turns.length} user. Record NUOVI nello store (seq>${baseSeq}): ${rows.length}`);
  console.log(`Per conv_id: ${JSON.stringify(byConv)}`);
  for (const r of rows) console.log(`  seq=${r.seq} [${r.role}] ${String(r.text).replace(/\s+/g, " ").slice(0, 50)}`);
  if (extErrors.length) console.log(`\n⚠ extension_error events:\n  ${extErrors.slice(0, 10).join("\n  ")}`);
  const capturedUsers = Object.values(byConv).reduce((s, v) => s + v.u, 0);
  console.log(`\n>>> VERDETTO: ${capturedUsers}/${turns.length} turni-utente catturati ${capturedUsers < turns.length ? "→ 🔴 DROP RIPRODOTTO" : "→ ✅ nessun drop"}`);

  cleanup(); // rimuove SEMPRE la traccia di test dallo stato reale (opt-out KEEP_TEST_DATA=1)
}
run().catch((e) => { console.error("driver error:", e); try { cleanup(); } catch {} child.kill(); });

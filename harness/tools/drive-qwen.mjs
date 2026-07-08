/**
 * drive-qwen.mjs — DRIVER headless multi-turno per qwen attraverso l'harness pi.
 *
 * SCOPO (regola CLAUDE.md #15): valido IO il modello end-to-end, l'utente non è mai il primo QA.
 * Guido la conversazione (sequenza di turni), l'harness gira DAVVERO (context-assembly, native-window,
 * eviction-checkpoint, secrets, tool-gating...), e catturo per ogni turno: risposta del modello, tool-call,
 * token di contesto, e GROUND-TRUTH dai DB (eviction meta, vars, conteggio turni). ~5s/turno a modello caldo.
 *
 * Uso (cwd = harness/):
 *   node tools/drive-qwen.mjs <session-id> <turns.json>
 *   turns.json = ["turno1", "turno2", ...]   (vedi tools/scenarios/*.json)
 *   env DRIVE_MODEL (default qwen3.5:9b)
 *
 * Meccanismo: `pi -p -nc --mode json --model <M> --session-id <SID> "<turno>"` ripetuto; `--session-id` riusa la
 * stessa conversazione tra invocazioni (multi-turno). `-nc` = niente CLAUDE.md nel contesto del 9B (vedi #14/#15).
 *
 * ISOLAMENTO STATO (fix 2026-07-08): il driver setta `HARNESS_STATE_DIR` a una dir dedicata (default
 *   `.pi/state-drive/<SID>`) e la passa a OGNI subprocess pi via env → le extension scrivono LÌ, non nel `.pi/state`
 *   REALE della TUI viva → ZERO test-pollution. Il driver legge il ground-truth dalla STESSA dir isolata (`dbPathsFor`,
 *   SSOT dei path). Override: esporta `HARNESS_STATE_DIR=.pi/state` per ispezionare lo stato reale. (La vecchia nota
 *   "le extension hardcodano .pi/state/vars.db" era stale: post-refactor SSOT #16 tutto deriva da STATE_DIR.)
 *   Residuo NON coperto (tracciato, non-urgente): i tool-fs del MODELLO vedono ancora il `.env` reale in harness/
 *   (il 9B può tentare `read .env`) — è confinamento-sandbox del modello, ortogonale all'isolamento-stato.
 */
import { spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { dbPathsFor } from "../src/state-db.mjs"; // SSOT derivazione path DB da una state-dir
import { EVICTION_ORDINAL_META } from "../src/meta-keys.mjs"; // SSOT prefisso ordinale evicted

const PI = "node_modules/@earendil-works/pi-coding-agent/dist/cli.js";
const MODEL = process.env.DRIVE_MODEL || "qwen3.5:9b";
const SID = process.argv[2];
const turns = process.argv[3] ? JSON.parse(readFileSync(process.argv[3], "utf8")) : null;
if (!SID || !Array.isArray(turns)) { console.error("uso: node tools/drive-qwen.mjs <session-id> <turns.json>"); process.exit(2); }

// ISOLAMENTO STATO: dir dedicata per-SID (override esplicito rispettato) → passata a pi via env + letta dal driver.
const STATE_DIR_DRIVE = process.env.HARNESS_STATE_DIR || `.pi/state-drive/${SID}`;
const DB = dbPathsFor(STATE_DIR_DRIVE); // { vars, conv, toolcall } della dir isolata (no pollution del .pi/state reale)

function q(dbPath, sql, ...args) {
  try { const d = new DatabaseSync(dbPath, { readOnly: true }); const r = d.prepare(sql).all(...args); d.close(); return r; }
  catch (e) { return [{ __err: e.message }]; }
}
function groundTruth() {
  return {
    eviction: q(DB.vars, `SELECT k,v FROM meta WHERE k LIKE '${EVICTION_ORDINAL_META}%'`),
    vars: q(DB.vars, "SELECT id,value FROM vars WHERE namespace='orchestrator' ORDER BY last_modified DESC LIMIT 8"),
    convTurns: q(DB.conv, "SELECT conv_id, COUNT(*) n FROM conversations WHERE role='user' GROUP BY conv_id ORDER BY MAX(seq) DESC LIMIT 3"),
  };
}
function runTurn(msg) {
  const r = spawnSync("node", [PI, "-p", "-nc", "--mode", "json", "--model", MODEL, "--session-id", SID, msg],
    { encoding: "utf8", timeout: 280000, maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, HARNESS_STATE_DIR: STATE_DIR_DRIVE } }); // isola lo stato del subprocess pi
  const lines = (r.stdout || "").split(/\r?\n/).filter(Boolean);
  let text = "", tools = [], usage = null, thinking = "";
  for (const l of lines) {
    let e; try { e = JSON.parse(l); } catch { continue; }
    if (e.type === "turn_end" && e.message) {
      for (const c of e.message.content || []) {
        if (c.type === "text") text += c.text;
        else if (c.type === "thinking") thinking += (c.thinking || "");
        else if (c.type === "toolCall" || c.type === "tool_use") tools.push(`${c.name || c.toolName}(${JSON.stringify(c.input || c.arguments || {}).slice(0, 140)})`);
      }
      usage = e.message.usage;
    }
  }
  return { text: text.trim(), thinking: thinking.trim(), tools, usage, status: r.status, err: (r.stderr || "").slice(-200), timedOut: r.error ? String(r.error) : null };
}

console.log(`=== DRIVE qwen — session=${SID} model=${MODEL} — ${turns.length} turni — state=${STATE_DIR_DRIVE} ===`);
for (let i = 0; i < turns.length; i++) {
  const t0 = Date.now();
  const res = runTurn(turns[i]);
  const dt = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n──────── T${i + 1}/${turns.length} (${dt}s) ────────`);
  console.log(`USER: ${turns[i]}`);
  if (res.timedOut || (res.status && res.status !== 0)) console.log(`⚠ status=${res.status} timedOut=${res.timedOut} err=${res.err}`);
  console.log(`ASSISTANT: ${res.text.slice(0, 400)}${res.text.length > 400 ? "…" : ""}`);
  if (res.tools.length) console.log(`🔧 TOOLS: ${res.tools.join("  ;  ")}`);
  if (res.usage) console.log(`ctx-input-tokens=${res.usage.input}`);
  const gt = groundTruth();
  console.log(`GT eviction=${JSON.stringify(gt.eviction)}`);
  console.log(`GT vars=${JSON.stringify(gt.vars)}`);
  console.log(`GT convTurns=${JSON.stringify(gt.convTurns)}`);
}
console.log("\n=== FINE DRIVE ===");

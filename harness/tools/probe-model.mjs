/**
 * probe-model — guida HEADLESS il modello attraverso pi via `--mode rpc` (idea utente msg 827, 2026-07-03).
 *
 * Invia N messaggi utente multi-turno via protocollo JSONL (stdin/stdout) e stampa le risposte — per osservare
 * empiricamente cosa il modello genera invece di inferire (memory feedback_instrument_before_hypothesizing).
 *
 * ⚠️⚠️ CAVEAT CRITICO (scoperto 2026-07-03, verificato): in `--mode rpc` l'evento `session_start` NON scatta →
 * `getConvId()` resta il fallback "main" → conversation-capture NON registra il convId → la lane
 * <messages_with_user> resta VUOTA (prova: `trace-main.jsonl` ha convId=main, laneLines=0; le sessioni probe non
 * hanno `_conv_id` in vars.db né righe in conversations.db). Quindi questo runner **NON è fedele per i test di
 * MEMORIA/lane** (amnesia, awareness, ricostruzione-timeline): la conversazione vive solo nell'array nativo di pi,
 * NON nella lane dell'harness. **Per i test di memoria usa la pi INTERATTIVA** (`npm run tui`), dove session_start
 * scatta, il convId si risolve e la lane si popola; leggi `.pi/state/trace/last-turn-full.md` (o `full-NNN.md` con
 * `PI_TRACE_PERTURN=1`) per il ground-truth. Questo runner resta utile per comportamenti NON-di-memoria (tool-calling,
 * formato, sicurezza single-turn). Sub-fix per renderlo fedele (risolvere il convId senza session_start): vedi todo.md.
 *
 * Uso:
 *   node tools/probe-model.mjs                      # 3 turni di default (l'ultimo è la sonda)
 *   node tools/probe-model.mjs "msg1" "msg2" ...    # turni custom
 */
import { spawn } from "node:child_process";

const PI_ENTRY = "node_modules/@earendil-works/pi-coding-agent/dist/cli.js";
const SESSION = "probe-" + Date.now();
const DEFAULT_TURNS = [
  "Ciao, mi chiamo Franky. Ricordati il mio nome per dopo. Rispondi in una riga.",
  "Voglio aggiungere una chiave API Discord. Rispondi in una riga.",
  "Domanda di verifica secca: come mi chiamo? Quanti messaggi ci siamo scambiati finora in questa conversazione? È questo il mio primo messaggio? Rispondi diretto.",
];
const TURNS = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_TURNS;
const TURN_TIMEOUT_MS = 120000; // il 9B locale è ~30-40s/turno

const child = spawn(process.execPath, [PI_ENTRY, "--mode", "rpc", "--session-id", SESSION], {
  cwd: process.cwd(), stdio: ["pipe", "pipe", "pipe"],
});

let buf = "";
let nextId = 1;
const pending = new Map(); // id → resolve (response)
const waiters = []; // {type, resolve} per gli eventi (agent_end)
const send = (type, extra = {}) => new Promise((resolve) => {
  const id = nextId++;
  pending.set(id, resolve);
  child.stdin.write(JSON.stringify({ id, type, ...extra }) + "\n"); // pi legge il comando dal campo `type`
});
const waitEvent = (type, ms) => new Promise((resolve) => {
  const w = { type, resolve };
  waiters.push(w);
  setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) { waiters.splice(i, 1); resolve(false); } }, ms);
});

child.stdout.on("data", (d) => {
  buf += d.toString();
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (process.env.DBG) console.log(`  «${msg.type}»${msg.command ? "/" + msg.command : ""} ${JSON.stringify(msg).slice(0, 120)}`);
    if (msg.type === "response" && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.type && waiters.some((w) => w.type === msg.type)) {
      for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].type === msg.type) { waiters[i].resolve(true); waiters.splice(i, 1); }
    } else if (msg.type === "extension_ui_request") {
      // un'estensione ha aperto una UI (Ask) → CANCEL per non bloccare il probe.
      child.stdin.write(JSON.stringify({ id: msg.id, type: "extension_ui_response", cancelled: true, response: null }) + "\n");
    }
  }
});
child.stderr.on("data", (d) => process.stderr.write("[pi stderr] " + d.toString()));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await sleep(2500); // init sessione + estensioni
  for (let i = 0; i < TURNS.length; i++) {
    console.log(`\n=== TURNO ${i + 1}/${TURNS.length}: ${TURNS[i].slice(0, 60)}${TURNS[i].length > 60 ? "…" : ""} ===`);
    const ack = await send("prompt", { message: TURNS[i] });
    if (!ack.success) { console.log("  [prompt rifiutato]", ack.error); break; }
    const done = await waitEvent("agent_end", TURN_TIMEOUT_MS); // aspetta il COMPLETAMENTO del turno
    if (!done) { console.log(`  [TIMEOUT ${TURN_TIMEOUT_MS / 1000}s]`); break; }
    const txt = await send("get_last_assistant_text");
    const t = txt.data?.text ?? txt.data?.message ?? txt.data;
    console.log("  →", typeof t === "string" ? t : JSON.stringify(t).slice(0, 800));
  }
  console.log("\nGround-truth del payload dell'ultimo turno: .pi/state/trace/last-turn-full.md");
  child.stdin.end();
  await sleep(500);
  child.kill();
  process.exit(0);
})();

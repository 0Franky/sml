/**
 * run-scene — un MODELLO VERO gioca una scena a più turni (ADR 2026-07-26-fixture-runner, punto 2).
 *
 * La scena è una spec di sandbox/run-spec.mjs con `turns` e `prompts` (uno per turno; se mancano si riusa
 * l'ultimo). UNA sessione pi vive per tutta la scena (il contesto accumula, come in una sessione reale);
 * a ogni turno il modello riceve il prompt e agisce con i suoi tool nella workdir della scena; POI il mondo
 * avanza (le mutazioni `after_turn`); alla fine gli assert deterministici danno il punteggio.
 * Nessun giudice legge il ragionamento: l'oracolo guarda i file.
 *
 * Uso:  node eval/run-scene.mjs verifiers/self-sealing-A1-canary.json
 * Env:  EVAL_PROVIDER=ollama|openrouter|groq|openai|gemini (default ollama) · MODEL_ID (default qwen-ctx16k)
 *       EVAL_ARM=vanilla|ours (default vanilla) · EVAL_TURN_TIMEOUT_MS (default 180000) · MODEL_CTX
 *       EVAL_TRACE=<file> → salva anche l'ultimo testo del modello per turno e i tool chiamati (diagnosi)
 * Output: UNA riga JSON su stdout. NON stampa mai una chiave.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runScene } from "../sandbox/run-spec.mjs";
import { openSession } from "./_pi-session.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scenePath = process.argv[2];
if (!scenePath) { console.error("usage: node eval/run-scene.mjs <scene.json>"); process.exit(2); }
const scene = JSON.parse(readFileSync(resolve(scenePath), "utf8"));
const PROVIDER = (process.env.EVAL_PROVIDER || "ollama").toLowerCase();
const MODEL_ID = process.env.MODEL_ID || "qwen-ctx16k";
const ARM = process.env.EVAL_ARM || "vanilla";
const TURN_TIMEOUT = Number(process.env.EVAL_TURN_TIMEOUT_MS || 180000);
const prompts = scene.prompts ?? [];
if (!prompts.length) { console.error(JSON.stringify({ error: "la scena non ha `prompts` (uno per turno)" })); process.exit(2); }

let sess = null;
const perTurn = [];
const toolCalls = [];
let currentTurn = 0; // il subscribe vive per tutta la scena: il turno va letto da qui, non catturato alla prima chiamata

const agent = async ({ turn, turns, dir }) => {
  currentTurn = turn;
  if (!sess) {
    sess = await openSession({ cwd: dir, provider: PROVIDER, modelId: MODEL_ID, arm: ARM, ctx: process.env.MODEL_CTX ? Number(process.env.MODEL_CTX) : undefined });
    sess.session.subscribe((ev) => { if (ev.type === "tool_execution_start") toolCalls.push({ turn: currentTurn, tool: ev.toolName }); });
  }
  const prompt = prompts[Math.min(turn, prompts.length) - 1];
  const t0 = Date.now();
  const wait = sess.waitAgentEnd(TURN_TIMEOUT);
  let sendErr = null;
  try { await sess.session.sendUserMessage(prompt); } catch (e) { sendErr = String(e?.message ?? e); }
  const outcome = await wait;
  let last = ""; try { last = sess.session.getLastAssistantText?.() ?? ""; } catch {}
  perTurn.push({ turn, of: turns, ms: Date.now() - t0, timedOut: outcome === "timeout", sendErr, tools: toolCalls.filter((t) => t.turn === turn).map((t) => t.tool), lastText: last.slice(0, 1200) });
  return { exit: sendErr || outcome === "timeout" ? 1 : 0, error: sendErr ?? (outcome === "timeout" ? "timeout" : "") };
};

const r = await runScene(scene, { agent });
try { sess?.session?.dispose?.(); } catch {}
const out = { scene: scenePath, provider: PROVIDER, model: MODEL_ID, arm: ARM, nExt: sess?.nExt ?? 0, passed: r.passed, turnsRun: r.turnsRun, setupError: r.setupError, agentErrors: r.agentErrors, results: r.results, perTurn };
if (process.env.EVAL_TRACE) { const fs = await import("node:fs"); fs.writeFileSync(process.env.EVAL_TRACE, JSON.stringify(out, null, 2)); }
process.stdout.write(JSON.stringify(out) + "\n");
process.exit(r.passed ? 0 : 1);

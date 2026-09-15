/**
 * run-scene — un MODELLO VERO gioca una scena a più turni (ADR 2026-07-26-fixture-runner, punti 2 e 3).
 *
 * La scena è una spec di sandbox/run-spec.mjs con `turns` e `prompts` (uno per turno; se mancano si riusa
 * l'ultimo). UNA sessione pi vive per tutta la scena (il contesto accumula, come in una sessione reale);
 * a ogni turno il modello riceve il prompt e agisce con i suoi tool nella workdir della scena; POI il mondo
 * avanza (le mutazioni `after_turn`); alla fine gli assert deterministici danno il punteggio.
 * Se la scena ha `pair`, ogni braccio gira con una sessione NUOVA (il secondo braccio non sa del primo).
 * Nessun giudice legge il ragionamento: l'oracolo guarda i file.
 *
 * Uso:  node eval/run-scene.mjs verifiers/self-sealing-A1-canary.json [--no-pair]
 * Env:  EVAL_PROVIDER=ollama|openrouter|groq|openai|gemini (default ollama) · MODEL_ID (default qwen-ctx16k)
 *       EVAL_ARM=vanilla|ours (default vanilla) · EVAL_TURN_TIMEOUT_MS (default 180000) · MODEL_CTX
 *       EVAL_TRACE=<file> → salva anche l'ultimo testo del modello per turno e i tool chiamati (diagnosi)
 *       EVAL_KEEP_DIR=1 → NON cancella la workdir della scena e ne mette il path nell'output (diagnosi:
 *                        serve a guardare CIO' CHE IL MODELLO HA SCRITTO quando un assert cade, invece
 *                        di indovinarlo dal suo riassunto — che e' la presentazione, non il fatto)
 *       EVAL_INTERCALL_DELAY_MS=<ms> → **pacing fra le chiamate al provider** (default 0 = no-op)
 *
 * ⚠️ PERCHE' IL PACING E' QUI (2026-09-12). `eval/pacer.mjs` esisteva dal 2026-07-26 — estratto da
 * `run-session.mjs` proprio per i provider a TPM stretto — ma **non era mai stato wired in run-scene**,
 * e run-scene e' il runner che gradua i modelli sulle scene. Conseguenza concreta: **Seed-OSS-36B**, il
 * candidato PRIMARIO del bake-off, **non e' mai stato girato su nessuna scena** — non e' su OpenRouter e
 * su SiliconFlow il TPM per-account uccide il run dopo ~4 chiamate (F37). Il rimedio non era da costruire:
 * era da collegare. Con `EVAL_INTERCALL_DELAY_MS=45000` le chiamate si distanziano PRIMA di partire.
 * ⚠️ NON e' un backoff (quello reagisce dopo il 429, che ha gia' consumato quota): questo previene.
 * Output: UNA riga JSON su stdout. NON stampa mai una chiave.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runScene, runPair } from "../sandbox/run-spec.mjs";
import { openSession } from "./_pi-session.mjs";
import { installProviderPacing } from "./pacer.mjs";

// Pacing fra le chiamate al provider (v. header). No-op a 0: `installProviderPacing` ritorna la fetch
// invariata, quindi ollama/OpenRouter non pagano nulla e il comportamento di prima non cambia.
globalThis.fetch = installProviderPacing(Number(process.env.EVAL_INTERCALL_DELAY_MS || 0));

const args = process.argv.slice(2);
const scenePath = args.find((a) => !a.startsWith("--"));
if (!scenePath) { console.error("usage: node eval/run-scene.mjs <scene.json> [--no-pair]"); process.exit(2); }
const scene = JSON.parse(readFileSync(resolve(scenePath), "utf8"));
const PROVIDER = (process.env.EVAL_PROVIDER || "ollama").toLowerCase();
const MODEL_ID = process.env.MODEL_ID || "qwen-ctx16k";
const ARM = process.env.EVAL_ARM || "vanilla";
const TURN_TIMEOUT = Number(process.env.EVAL_TURN_TIMEOUT_MS || 180000);
const usePair = !!scene.pair && !args.includes("--no-pair");
// EVAL_KEEP_DIR=1 -> la workdir della scena NON viene cancellata e il suo path finisce nell'output.
// ⚠️ PERCHE' ESISTE (2026-09-15): `run-spec` sapeva gia' tenerla (`keepDir`), ma nessun runner lo
// esponeva -> quando un assert cadeva si poteva solo INDOVINARE cosa il modello avesse scritto. Sulla
// ri-misura di design-artifact due assert erano rossi e le due spiegazioni candidate (il modello non ha
// fatto il lavoro / l'oracolo chiede una FORMA) portano a conclusioni opposte: senza il file non si
// sceglie fra le due, e scegliere a naso e' esattamente la spiegazione comoda che #38 vieta.
// Non e' il default: lascia cartelle in tmp. Si accende per diagnosticare, non per misurare.
const KEEP_DIR = process.env.EVAL_KEEP_DIR === "1";
if (!(scene.prompts ?? []).length) { console.error(JSON.stringify({ error: "la scena non ha `prompts` (uno per turno)" })); process.exit(2); }

/** Un agente = una sessione pi che vive per tutta la scena (o per tutto il braccio). */
function makeAgent(prompts) {
  const st = { sess: null, perTurn: [], toolCalls: [], currentTurn: 0 };
  const agent = async ({ turn, turns, dir }) => {
    st.currentTurn = turn;
    if (!st.sess) {
      st.sess = await openSession({ cwd: dir, provider: PROVIDER, modelId: MODEL_ID, arm: ARM, ctx: process.env.MODEL_CTX ? Number(process.env.MODEL_CTX) : undefined });
      st.sess.session.subscribe((ev) => { if (ev.type === "tool_execution_start") st.toolCalls.push({ turn: st.currentTurn, tool: ev.toolName }); });
    }
    const prompt = prompts[Math.min(turn, prompts.length) - 1];
    const t0 = Date.now();
    const wait = st.sess.waitAgentEnd(TURN_TIMEOUT);
    let sendErr = null;
    try { await st.sess.session.sendUserMessage(prompt); } catch (e) { sendErr = String(e?.message ?? e); }
    const outcome = await wait;
    let last = ""; try { last = st.sess.session.getLastAssistantText?.() ?? ""; } catch {}
    st.perTurn.push({ turn, of: turns, ms: Date.now() - t0, timedOut: outcome === "timeout", sendErr, tools: st.toolCalls.filter((t) => t.turn === turn).map((t) => t.tool), lastText: last.slice(0, 1200) });
    return { exit: sendErr || outcome === "timeout" ? 1 : 0, error: sendErr ?? (outcome === "timeout" ? "timeout" : "") };
  };
  const dispose = () => { try { st.sess?.session?.dispose?.(); } catch {} };
  return { agent, st, dispose };
}

let out;
if (usePair) {
  const made = [];
  const p = await runPair(scene, { keepDir: KEEP_DIR, agentFactory: (arm) => { const m = makeAgent(arm.prompts ?? scene.prompts); made.push(m); return m.agent; } });
  made.forEach((m) => m.dispose());
  out = {
    scene: scenePath, provider: PROVIDER, model: MODEL_ID, arm: ARM, pair: true, vary: p.vary, invariant: p.invariant, passed: p.passed,
    arms: p.arms.map((a, i) => ({ name: a.name, passed: a.passed, turnsRun: a.turnsRun, setupError: a.setupError, agentErrors: a.agentErrors, results: a.results, perAssenza: a.perAssenza, probeOut: a.probeOut, dir: a.dir, perTurn: made[i]?.st.perTurn ?? [] })),
  };
} else {
  const m = makeAgent(scene.prompts);
  const r = await runScene(scene, { agent: m.agent, keepDir: KEEP_DIR });
  m.dispose();
  out = { scene: scenePath, provider: PROVIDER, model: MODEL_ID, arm: ARM, pair: false, nExt: m.st.sess?.nExt ?? 0, passed: r.passed, turnsRun: r.turnsRun, setupError: r.setupError, agentErrors: r.agentErrors, results: r.results, perAssenza: r.perAssenza, dir: r.dir, perTurn: m.st.perTurn };
}
if (process.env.EVAL_TRACE) { const fs = await import("node:fs"); fs.writeFileSync(process.env.EVAL_TRACE, JSON.stringify(out, null, 2)); }
process.stdout.write(JSON.stringify(out) + "\n");
process.exit(out.passed ? 0 : 1);

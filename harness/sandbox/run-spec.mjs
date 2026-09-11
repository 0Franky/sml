// Generic verifier-spec runner (replica standalone di run_verifier) + SCENE a più turni.
// Usage: node run-spec.mjs <path-to-spec.json> [--agent "<bash eseguito a ogni turno>"]
// Spec: { setup: [bash...], turns?: [{ after_turn, apply: [bash...] }], asserts: [{cmd, expect_exit, note?}] }
// Esegue setup in una tempdir isolata; poi, se ci sono `turns`, il MONDO AVANZA FRA I TURNI:
// per ogni turno i l'agente (se dato) agisce, e subito dopo si applicano le mutazioni dichiarate
// `after_turn: i`. Gli assert si valutano ALLA FINE.
// n = max(after_turn) + 1, così l'agente agisce almeno una volta DOPO l'ultima mutazione: senza quel
// turno, «accorgersi che il mondo è cambiato» non sarebbe misurabile (ADR 2026-07-26-fixture-runner, buco 1).
// L'agente è una stringa bash (vede TURN e TURNS nell'ambiente — le policy dei lab) OPPURE una funzione
// async ({ turn, turns, dir }) => { exit, error? } — è così che eval/run-scene.mjs ci mette un modello vero.
// Senza `turns` il comportamento è quello di sempre: setup → asserts (l'agente, se dato, agisce una volta).
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function sh(cmd, cwd, env) {
  try {
    return { exit: 0, stdout: execFileSync("bash", ["-lc", cmd], { cwd, stdio: "pipe", env }).toString(), stderr: "" };
  } catch (e) {
    return {
      exit: typeof e.status === "number" ? e.status : 1,
      stdout: (e.stdout || "").toString(),
      stderr: (e.stderr || "").toString(),
    };
  }
}

async function act(agent, ctx) {
  if (typeof agent === "function") {
    try { const r = await agent(ctx); return { exit: r?.exit ?? 0, stderr: String(r?.error ?? "") }; }
    catch (e) { return { exit: 1, stderr: String(e?.message ?? e) }; }
  }
  return sh(agent, ctx.dir, { ...process.env, TURN: String(ctx.turn), TURNS: String(ctx.turns) });
}

/**
 * Esegue una spec/scena in una tempdir isolata e la cancella.
 * @param {object} spec  { setup, turns?, asserts }
 * @param {object} opts  { agent?: string | (async ({turn, turns, dir}) => {exit, error?}), keepDir?: boolean }
 * @returns {Promise<{ passed, setupError, results, turnsRun, agentErrors, dir? }>}
 */
export async function runScene(spec, opts = {}) {
  const dir = mkdtempSync(join(tmpdir(), "slm-spec-"));
  const results = [];
  const agentErrors = [];
  let setupError = null;
  let turnsRun = 0;
  let probeOut = null;
  try {
    for (const c of spec.setup ?? []) {
      const r = sh(c, dir, process.env);
      if (r.exit !== 0) { setupError = { cmd: c, stderr: r.stderr, stdout: r.stdout, status: r.exit }; break; }
    }
    if (!setupError) {
      const turns = spec.turns ?? [];
      const nTurns = turns.length ? Math.max(...turns.map((t) => t.after_turn)) + 1 : (opts.agent ? 1 : 0);
      for (let i = 1; i <= nTurns && !setupError; i++) {
        if (opts.agent) {
          const r = await act(opts.agent, { turn: i, turns: nTurns, dir });
          // Un agente che fallisce è un DATO della scena (es. deploy bloccato), non un errore del runner.
          if (r.exit !== 0) agentErrors.push({ turn: i, exit: r.exit, stderr: String(r.stderr).slice(0, 400) });
        }
        for (const t of turns.filter((t) => t.after_turn === i)) {
          for (const c of t.apply ?? []) {
            const r = sh(c, dir, process.env);
            // Una mutazione che fallisce è un difetto della FIXTURE: il mondo non è avanzato → scena non valida.
            if (r.exit !== 0) { setupError = { cmd: c, turn: i, stderr: r.stderr, stdout: r.stdout, status: r.exit }; break; }
          }
          if (setupError) break;
        }
        if (!setupError) turnsRun = i;
      }
    }
    if (!setupError) {
      for (const a of spec.asserts ?? []) {
        const want = a.expect_exit ?? 0;
        const r = sh(a.cmd, dir, process.env);
        results.push({ cmd: a.cmd, note: a.note ?? null, passed: r.exit === want, exit: r.exit, want, stdout: r.stdout.slice(0, 400) });
      }
      // `probe`: un comando il cui stdout DESCRIVE L'AZIONE compiuta (es. `cat decisione.txt`). Non è un assert:
      // serve a runPair per confrontare l'azione fra i bracci (reward ① di norm-invariance: «stessa azione?»).
      if (spec.probe) probeOut = sh(spec.probe, dir, process.env).stdout.trim();
    }
  } finally {
    if (!opts.keepDir) rmSync(dir, { recursive: true, force: true });
  }
  const passed = !setupError && results.length > 0 && results.every((r) => r.passed);
  return { passed, setupError, results, turnsRun, agentErrors, probeOut, ...(opts.keepDir ? { dir } : {}) };
}

/**
 * COPPIA (ADR fixture-runner, buco 4 / punto 3): la STESSA scena in due o più bracci che differiscono per un
 * solo campo dichiarato (`pair.vary`). Ogni braccio = spec + override del braccio (setup_extra in coda al setup;
 * turns / asserts / prompts / probe sostituiti se dati). Ogni braccio gira in una tempdir propria, con un agente
 * NUOVO se opts.agentFactory è dato (una sessione-modello fresca per braccio: il secondo braccio non deve sapere
 * del primo). Esito: `passed` = tutti i bracci passano i propri assert; `invariant` = gli stdout di `probe`
 * coincidono fra i bracci (null se non c'è probe) — è il segnale di norm-invariance, e lo si esige con
 * `pair.require_invariant: true`. Per le coppie a CONTRASTO (P-COPPIA del playbook: in un braccio il fenomeno
 * c'è, nell'altro no) bastano gli assert per-braccio: sono loro a dire che la cerimonia non deve comparire.
 */
export async function runPair(spec, opts = {}) {
  const pair = spec.pair;
  if (!pair?.arms?.length) throw new Error("runPair: spec.pair.arms mancante");
  const arms = [];
  for (const arm of pair.arms) {
    const s = {
      ...spec,
      setup: [...(spec.setup ?? []), ...(arm.setup_extra ?? [])],
      turns: arm.turns ?? spec.turns, asserts: arm.asserts ?? spec.asserts,
      prompts: arm.prompts ?? spec.prompts, probe: arm.probe ?? spec.probe,
    };
    delete s.pair;
    const agent = opts.agentFactory ? opts.agentFactory(arm) : opts.agent;
    const r = await runScene(s, { ...opts, agent });
    arms.push({ name: arm.name ?? String(arms.length), ...r });
  }
  const outs = arms.map((a) => a.probeOut);
  const invariant = outs.every((o) => o != null) ? outs.every((o) => o === outs[0]) : null;
  const passed = arms.every((a) => a.passed) && (pair.require_invariant ? invariant === true : true);
  return { vary: pair.vary ?? null, arms, invariant, passed };
}

// --- CLI (invariata per run-all.mjs): node run-spec.mjs <spec.json> [--agent "<bash>"] ---
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const specPath = args.find((a) => !a.startsWith("--"));
  const ai = args.indexOf("--agent");
  const agent = ai >= 0 ? args[ai + 1] : undefined;
  if (!specPath) {
    console.error('usage: node run-spec.mjs <spec.json> [--agent "<bash per turno>"]');
    process.exit(2);
  }
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  const out = await runScene(spec, { agent });
  console.log(JSON.stringify({ spec: specPath, ...out }, null, 2));
  process.exit(out.passed ? 0 : 1);
}

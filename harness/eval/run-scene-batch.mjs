/**
 * run-scene-batch — la stessa scena, più modelli, più ripetizioni: una tabella con il denominatore.
 *
 * Una percentuale senza n non è una misura (#35b) e n=1 per modello è un aneddoto (todo D1): qui ogni cella
 * è `k/n` con n dichiarato, e ogni run è un processo separato (stato/workdir isolati, nessun cross-talk).
 *
 * Uso:  node eval/run-scene-batch.mjs <scene.json> --models a,b --n 3 [--arm vanilla|ours]
 * Env:  EVAL_PROVIDER (default ollama) · EVAL_OUT (jsonl con ogni run, default: nessuno) · le env di run-scene
 * Output: tabella su stdout; exit 0 se tutti i run sono terminati (il PASS/FAIL è il dato, non l'esito del processo).
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const scene = args.find((a) => !a.startsWith("--"));
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const models = opt("--models", process.env.MODEL_ID || "qwen-ctx16k").split(",").map((s) => s.trim()).filter(Boolean);
const n = Number(opt("--n", "1"));
const arm = opt("--arm", process.env.EVAL_ARM || "vanilla");
if (!scene) { console.error("usage: node eval/run-scene-batch.mjs <scene.json> --models a,b --n 3 [--arm vanilla|ours]"); process.exit(2); }

const rows = [];
for (const model of models) {
  for (let rep = 1; rep <= n; rep++) {
    const t0 = Date.now();
    // Stato dell'harness ISOLATO per run (braccio `ours`: conversation store, vars, meta — letti a import-time da
    // state-paths.mjs via HARNESS_STATE_DIR): due run non devono vedersi, come in run-session-ab.mjs.
    const stateDir = mkdtempSync(join(tmpdir(), "scene-state-"));
    const r = spawnSync(process.execPath, [join(here, "run-scene.mjs"), scene], {
      env: { ...process.env, MODEL_ID: model, EVAL_ARM: arm, HARNESS_STATE_DIR: stateDir }, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
    });
    rmSync(stateDir, { recursive: true, force: true });
    let out = null;
    try { out = JSON.parse((r.stdout || "").trim().split("\n").pop()); } catch { /* run rotto: resta null */ }
    // scena singola: results/perTurn al top-level · coppia: per braccio (si appiattisce in ordine di braccio)
    const parts = out ? (out.arms ?? [out]) : [];
    const row = {
      model, rep, arm, ms: Date.now() - t0, exit: r.status,
      passed: out?.passed ?? null,
      asserts: out ? parts.flatMap((p) => p.results.map((x) => (x.passed ? 1 : 0))) : null,
      tools: out ? parts.flatMap((p) => p.perTurn.map((t) => t.tools.length)) : null,
      timedOut: out ? parts.some((p) => p.perTurn.some((t) => t.timedOut)) : null,
      agentErrors: out ? parts.reduce((s, p) => s + (p.agentErrors?.length ?? 0), 0) : null,
      broken: !out, stderr: !out ? (r.stderr || "").slice(-300) : "",
    };
    rows.push(row);
    if (process.env.EVAL_OUT) appendFileSync(process.env.EVAL_OUT, JSON.stringify({ ...row, scene, full: out }) + "\n");
    console.error(`  [${model} #${rep}] ${row.broken ? "ROTTO" : row.passed ? "PASS" : "FAIL"} asserts=${JSON.stringify(row.asserts)} tools/turno=${JSON.stringify(row.tools)} ${Math.round(row.ms / 1000)}s`);
  }
}

console.log(`\nscena: ${scene} · braccio: ${arm} · n per modello: ${n}`);
const nA = Math.max(0, ...rows.map((r) => r.asserts?.length ?? 0));
console.log("modello".padEnd(34) + "PASS  " + Array.from({ length: nA }, (_, i) => `a${i + 1}`.padEnd(6)).join("") + " rotti  ms-mediana");
for (const model of models) {
  const rs = rows.filter((r) => r.model === model);
  const ok = rs.filter((r) => !r.broken);
  const cnt = (i) => ok.filter((r) => r.asserts?.[i] === 1).length;
  const med = ok.map((r) => r.ms).sort((a, b) => a - b)[Math.floor(ok.length / 2)] ?? 0;
  console.log(model.padEnd(34) + `${ok.filter((r) => r.passed).length}/${ok.length}`.padEnd(6) + Array.from({ length: nA }, (_, i) => `${cnt(i)}/${ok.length}`.padEnd(6)).join("") + ` ${rs.length - ok.length}`.padEnd(7) + `${Math.round(med / 1000)}s`);
}
process.exit(rows.some((r) => r.broken) ? 1 : 0);

/**
 * Test isolamento stato via env HARNESS_STATE_DIR — WIRING-test (regola #14, non solo unit su fn pura).
 *
 * Verifica che l'override env RILOCALIZZI l'INTERA catena derivata:
 *   STATE_DIR (state-paths.mjs) → TRACE_DIR/REPORTS_DIR  +  VARS_DB_PATH/CONV_DB_PATH (state-db.mjs).
 * È il fix che isola i run A/B (vanilla vs nostro) e il driver headless senza inquinare il .pi/state reale.
 *
 * STATE_DIR è valutato all'IMPORT del modulo → non si può testare cambiando process.env a runtime nello stesso
 * processo (modulo già cachato). Si testa in SOTTO-PROCESSI node con env diverso — fedele al modello reale
 * "pi subprocess con env preimpostato" del driver/eval. I path sono confrontati per DERIVAZIONE (concat di
 * stringhe), niente filesystem → cross-OS safe (la stringa resta forward-slash su Windows).
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "..", "src");
const spUrl = pathToFileURL(join(srcDir, "state-paths.mjs")).href;
const dbUrl = pathToFileURL(join(srcDir, "state-db.mjs")).href;

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

// Script figlio (ESM inline): importa la catena reale e stampa i path risolti.
const probe = [
  `import { STATE_DIR, TRACE_DIR, REPORTS_DIR } from ${JSON.stringify(spUrl)};`,
  `import { VARS_DB_PATH, CONV_DB_PATH } from ${JSON.stringify(dbUrl)};`,
  `console.log(JSON.stringify({ STATE_DIR, TRACE_DIR, REPORTS_DIR, VARS_DB_PATH, CONV_DB_PATH }));`,
].join("\n");

function resolvePaths(env) {
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", probe],
    { encoding: "utf8", env: { ...process.env, ...env } });
  if (r.status !== 0) { console.error("child stderr:", r.stderr); throw new Error(`probe exit ${r.status}`); }
  return JSON.parse(r.stdout.trim().split(/\r?\n/).pop());
}

// 1) DEFAULT (HARNESS_STATE_DIR assente/vuoto) → .pi/state ---------------------------------------
{
  const p = resolvePaths({ HARNESS_STATE_DIR: "" }); // "" è falsy → il `||` cade sul default
  ok(p.STATE_DIR === ".pi/state", "DEFAULT: STATE_DIR = .pi/state");
  ok(p.VARS_DB_PATH === ".pi/state/vars.db", "DEFAULT: VARS_DB_PATH derivato da STATE_DIR");
  ok(p.CONV_DB_PATH === ".pi/state/conversations.db", "DEFAULT: CONV_DB_PATH derivato da STATE_DIR");
  ok(p.TRACE_DIR === ".pi/state/trace", "DEFAULT: TRACE_DIR derivato");
  ok(p.REPORTS_DIR === ".pi/state/reports", "DEFAULT: REPORTS_DIR derivato");
}

// 2) OVERRIDE (path assoluto) → TUTTA la catena rilocalizza in un colpo --------------------------
{
  const iso = "/tmp/harness-eval-run-XYZ";
  const p = resolvePaths({ HARNESS_STATE_DIR: iso });
  ok(p.STATE_DIR === iso, "OVERRIDE: STATE_DIR = HARNESS_STATE_DIR");
  ok(p.VARS_DB_PATH === iso + "/vars.db", "OVERRIDE: VARS_DB_PATH rilocalizzato (state-db deriva da STATE_DIR)");
  ok(p.CONV_DB_PATH === iso + "/conversations.db", "OVERRIDE: CONV_DB_PATH rilocalizzato");
  ok(p.TRACE_DIR === iso + "/trace", "OVERRIDE: TRACE_DIR rilocalizzato");
  ok(p.REPORTS_DIR === iso + "/reports", "OVERRIDE: REPORTS_DIR rilocalizzato");
}

// 3) Anti cross-talk A/B: due dir diverse → DB disgiunti -----------------------------------------
{
  const a = resolvePaths({ HARNESS_STATE_DIR: "/tmp/run-A" });
  const b = resolvePaths({ HARNESS_STATE_DIR: "/tmp/run-B" });
  ok(a.VARS_DB_PATH !== b.VARS_DB_PATH, "ISOLAMENTO: run-A e run-B usano vars.db distinti (no cross-contaminazione)");
  ok(a.CONV_DB_PATH !== b.CONV_DB_PATH, "ISOLAMENTO: run-A e run-B usano conversations.db distinti");
}

console.log(`state-paths-isolation: ${passed}/${passed + failed} ok${failed ? ` (${failed} FALLITI)` : ""}`);
process.exit(failed === 0 ? 0 : 1);

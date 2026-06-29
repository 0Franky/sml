/**
 * Test di harness-config (context-budget OPT-IN, msg 520): default → file → env, fail-safe + clamp.
 */
import { loadHarnessConfig, DEFAULT_HARNESS_CONFIG } from "../../src/harness-config.mjs";
import { DEFAULT_CFG } from "../../src/nested-compact.mjs";
import { writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const dir = mkdtempSync(join(tmpdir(), "hcfg-"));
const cfgPath = join(dir, "harness.config.json");
const noFile = join(dir, "assente.json");

// 1) DEFAULT (nessun file, nessun env) = DEFAULT_CFG + messagesWindowN -----------------------------
{
  const c = loadHarnessConfig(noFile, { env: {} });
  ok(c.trigger.tokenMatrioskaPct === DEFAULT_CFG.tokenMatrioskaPct, "DEFAULT: trigger = DEFAULT_CFG");
  ok(c.trigger.tokenReorderPct === DEFAULT_CFG.tokenReorderPct, "DEFAULT: reorderPct = DEFAULT_CFG");
  ok(c.messagesWindowN === 8, "DEFAULT: messagesWindowN = 8");
  ok(DEFAULT_HARNESS_CONFIG.trigger.maxDepth === DEFAULT_CFG.maxDepth, "DEFAULT_HARNESS_CONFIG espone DEFAULT_CFG");
}

// 2) FILE opt-in override (profilo "Sonnet": soglie più alte) --------------------------------------
{
  writeFileSync(cfgPath, JSON.stringify({ trigger: { tokenMatrioskaPct: 0.9, watchMatrioska: 60 }, messagesWindowN: 16 }));
  const c = loadHarnessConfig(cfgPath, { env: {} });
  ok(c.trigger.tokenMatrioskaPct === 0.9, "FILE: tokenMatrioskaPct overrideato a 0.9");
  ok(c.trigger.watchMatrioska === 60, "FILE: watchMatrioska overrideato a 60");
  ok(c.messagesWindowN === 16, "FILE: messagesWindowN overrideato a 16");
  ok(c.trigger.tokenReorderPct === DEFAULT_CFG.tokenReorderPct, "FILE: i campi non specificati restano default");
}

// 3) ENV vince sul file ----------------------------------------------------------------------------
{
  const c = loadHarnessConfig(cfgPath, { env: { HARNESS_TOKEN_MATRIOSKA_PCT: "0.65", HARNESS_MESSAGES_WINDOW_N: "4" } });
  ok(c.trigger.tokenMatrioskaPct === 0.65, "ENV: HARNESS_TOKEN_MATRIOSKA_PCT vince sul file (0.65)");
  ok(c.messagesWindowN === 4, "ENV: HARNESS_MESSAGES_WINDOW_N vince sul file (4)");
  ok(c.trigger.watchMatrioska === 60, "ENV: i campi non in env restano dal file (60)");
}

// 4) FAIL-SAFE: JSON malformato → default (mai lancia) ---------------------------------------------
{
  writeFileSync(cfgPath, "{ questo non e json valido ");
  let threw = false;
  let c;
  try { c = loadHarnessConfig(cfgPath, { env: {} }); } catch { threw = true; }
  ok(!threw, "FAIL-SAFE: config malformata non lancia");
  ok(c && c.trigger.tokenMatrioskaPct === DEFAULT_CFG.tokenMatrioskaPct, "FAIL-SAFE: ricade sui default");
}

// 5) CLAMP: valori fuori-range scartati (resta il default) -----------------------------------------
{
  writeFileSync(cfgPath, JSON.stringify({ trigger: { tokenMatrioskaPct: 5, watchMatrioska: -3, maxDepth: 999 } }));
  const c = loadHarnessConfig(cfgPath, { env: {} });
  ok(c.trigger.tokenMatrioskaPct === DEFAULT_CFG.tokenMatrioskaPct, "CLAMP: pct fuori [0,1] scartato");
  ok(c.trigger.watchMatrioska === DEFAULT_CFG.watchMatrioska, "CLAMP: watch negativo scartato");
  ok(c.trigger.maxDepth === DEFAULT_CFG.maxDepth, "CLAMP: maxDepth fuori-range scartato");
  // env fuori-range idem
  const c2 = loadHarnessConfig(noFile, { env: { HARNESS_TOKEN_REORDER_PCT: "abc" } });
  ok(c2.trigger.tokenReorderPct === DEFAULT_CFG.tokenReorderPct, "CLAMP: env non-numerico scartato");
}

rmSync(dir, { recursive: true, force: true });
console.log(`\nharness-config test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

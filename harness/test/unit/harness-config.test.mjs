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
  ok(c.messagesCharCap === 4000, "DEFAULT: messagesCharCap = 4000 (binding constraint della lane)");
  ok(c.messagesExcludeCurrentTurn === true, "DEFAULT: messagesExcludeCurrentTurn = true (P1-B complementarità)");
  ok(c.secrets.regexIngress === "ask", "DEFAULT: secrets.regexIngress = ask (Ask di promozione, fix C)");
  ok(c.toolGating === "gated", "DEFAULT: toolGating = gated (regime SLM, msg 807)");
  ok(DEFAULT_HARNESS_CONFIG.trigger.maxDepth === DEFAULT_CFG.maxDepth, "DEFAULT_HARNESS_CONFIG espone DEFAULT_CFG");
}

// 1b) toolGating: file + env override + valore invalido ignorato (fail-safe) ------------------------
{
  writeFileSync(cfgPath, JSON.stringify({ toolGating: "off" }));
  ok(loadHarnessConfig(cfgPath, { env: {} }).toolGating === "off", "FILE: toolGating overrideato a off (modello grande)");
  ok(loadHarnessConfig(cfgPath, { env: { HARNESS_TOOL_GATING: "discover" } }).toolGating === "discover", "ENV: HARNESS_TOOL_GATING vince sul file (discover)");
  ok(loadHarnessConfig(cfgPath, { env: { HARNESS_TOOL_GATING: "banana" } }).toolGating === "off", "ENV: valore invalido ignorato → resta il file (off)");
}

// 1c) toolProfile + toolGatingCustom (msg 1431/1433): default standard, file+env override, enum-guard, custom CSV -----
{
  const c = loadHarnessConfig(noFile, { env: {} });
  ok(c.toolProfile === "standard", "DEFAULT: toolProfile = standard (comportamento storico = ESSENTIAL)");
  ok(Array.isArray(c.toolGatingCustom) && c.toolGatingCustom.length === 0, "DEFAULT: toolGatingCustom = [] vuoto");
  // file override
  writeFileSync(cfgPath, JSON.stringify({ toolProfile: "minimal" }));
  ok(loadHarnessConfig(cfgPath, { env: {} }).toolProfile === "minimal", "FILE: toolProfile overrideato a minimal");
  // env vince sul file
  ok(loadHarnessConfig(cfgPath, { env: { HARNESS_TOOL_PROFILE: "core" } }).toolProfile === "core", "ENV: HARNESS_TOOL_PROFILE vince sul file (core)");
  // enum-guard: valore invalido → resta il file (minimal)
  ok(loadHarnessConfig(cfgPath, { env: { HARNESS_TOOL_PROFILE: "banana" } }).toolProfile === "minimal", "ENV: toolProfile invalido ignorato → resta il file (minimal)");
  // custom: file array (non-stringhe/vuoti scartati) + env CSV (trim) vince
  writeFileSync(cfgPath, JSON.stringify({ toolProfile: "custom", toolGatingCustom: ["bash", "note", 42, ""] }));
  const cf = loadHarnessConfig(cfgPath, { env: {} });
  ok(cf.toolProfile === "custom" && cf.toolGatingCustom.join(",") === "bash,note", "FILE: toolGatingCustom array (non-stringhe/vuoti scartati)");
  const ce = loadHarnessConfig(cfgPath, { env: { HARNESS_TOOL_GATING_CUSTOM: "read, write ,grep" } });
  ok(ce.toolGatingCustom.join(",") === "read,write,grep", "ENV: HARNESS_TOOL_GATING_CUSTOM CSV (trim) vince sul file");
}

// 2) FILE opt-in override (profilo "Sonnet": soglie più alte) --------------------------------------
{
  writeFileSync(cfgPath, JSON.stringify({ trigger: { tokenMatrioskaPct: 0.9, watchMatrioska: 60 }, messagesWindowN: 16, messagesCharCap: 2000, messagesExcludeCurrentTurn: false }));
  const c = loadHarnessConfig(cfgPath, { env: {} });
  ok(c.trigger.tokenMatrioskaPct === 0.9, "FILE: tokenMatrioskaPct overrideato a 0.9");
  ok(c.trigger.watchMatrioska === 60, "FILE: watchMatrioska overrideato a 60");
  ok(c.messagesWindowN === 16, "FILE: messagesWindowN overrideato a 16");
  ok(c.messagesCharCap === 2000, "FILE: messagesCharCap overrideato a 2000");
  ok(c.messagesExcludeCurrentTurn === false, "FILE: messagesExcludeCurrentTurn overrideato a false (boolean)");
  ok(c.trigger.tokenReorderPct === DEFAULT_CFG.tokenReorderPct, "FILE: i campi non specificati restano default");
}

// 3) ENV vince sul file ----------------------------------------------------------------------------
{
  const c = loadHarnessConfig(cfgPath, { env: { HARNESS_TOKEN_MATRIOSKA_PCT: "0.65", HARNESS_MESSAGES_WINDOW_N: "4", HARNESS_MESSAGES_CHAR_CAP: "1500", HARNESS_MESSAGES_EXCLUDE_CURRENT_TURN: "true" } });
  ok(c.trigger.tokenMatrioskaPct === 0.65, "ENV: HARNESS_TOKEN_MATRIOSKA_PCT vince sul file (0.65)");
  ok(c.messagesWindowN === 4, "ENV: HARNESS_MESSAGES_WINDOW_N vince sul file (4)");
  ok(c.messagesCharCap === 1500, "ENV: HARNESS_MESSAGES_CHAR_CAP vince sul file (1500)");
  ok(c.messagesExcludeCurrentTurn === true, "ENV: HARNESS_MESSAGES_EXCLUDE_CURRENT_TURN vince sul file (true ribalta false)");
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

// 6) GATHERING (focus-gathering v1, msg 531): default delegated, file/env override, enum-guard ------
{
  const c = loadHarnessConfig(noFile, { env: {} });
  ok(c.gathering.mode === "delegated", "GATHERING: default mode = delegated");
  ok(c.gathering.minTasksForForce === 5, "GATHERING: default minTasksForForce = 5");
  writeFileSync(cfgPath, JSON.stringify({ gathering: { mode: "inject", minTasksForForce: 3 } }));
  const c2 = loadHarnessConfig(cfgPath, { env: {} });
  ok(c2.gathering.mode === "inject", "GATHERING: file override mode=inject");
  ok(c2.gathering.minTasksForForce === 3, "GATHERING: file override minTasksForForce=3");
  // env vince
  const c3 = loadHarnessConfig(cfgPath, { env: { HARNESS_GATHERING_MODE: "require", HARNESS_GATHERING_MIN_TASKS: "8" } });
  ok(c3.gathering.mode === "require", "GATHERING: env override mode=require");
  ok(c3.gathering.minTasksForForce === 8, "GATHERING: env override minTasks=8");
  // enum-guard: mode invalido → resta default
  writeFileSync(cfgPath, JSON.stringify({ gathering: { mode: "nonsense", minTasksForForce: 0 } }));
  const c4 = loadHarnessConfig(cfgPath, { env: {} });
  ok(c4.gathering.mode === "delegated", "GATHERING: mode fuori-enum scartato (resta delegated)");
  ok(c4.gathering.minTasksForForce === 5, "GATHERING: minTasksForForce <1 scartato (resta 5)");
  const c5 = loadHarnessConfig(noFile, { env: { HARNESS_GATHERING_MODE: "bogus" } });
  ok(c5.gathering.mode === "delegated", "GATHERING: env mode fuori-enum scartato");
}

// 7) AUTOFOCUS (OQ-A, msg 551): default nudge, file/env override, enum-guard --------------------
{
  const c = loadHarnessConfig(noFile, { env: {} });
  ok(c.autofocus.mode === "nudge", "AUTOFOCUS: default mode = nudge (invariato)");
  writeFileSync(cfgPath, JSON.stringify({ autofocus: { mode: "auto" } }));
  ok(loadHarnessConfig(cfgPath, { env: {} }).autofocus.mode === "auto", "AUTOFOCUS: file override mode=auto");
  ok(loadHarnessConfig(cfgPath, { env: { HARNESS_AUTOFOCUS_MODE: "off" } }).autofocus.mode === "off", "AUTOFOCUS: env override mode=off");
  writeFileSync(cfgPath, JSON.stringify({ autofocus: { mode: "nonsense" } }));
  ok(loadHarnessConfig(cfgPath, { env: {} }).autofocus.mode === "nudge", "AUTOFOCUS: mode fuori-enum scartato (resta nudge)");
  ok(loadHarnessConfig(noFile, { env: { HARNESS_AUTOFOCUS_MODE: "bogus" } }).autofocus.mode === "nudge", "AUTOFOCUS: env fuori-enum scartato");
}

// 7b) ADAPTIVE-CONTEXT (utente msg 1434): default OFF, file+env override, clamp lowThreshold[0,1]/highKeep≥1 ---------
{
  const c = loadHarnessConfig(noFile, { env: {} });
  ok(c.adaptiveContext.enabled === false, "ADAPTIVE: default enabled=false (opt-in, l'utente non è fan)");
  ok(c.adaptiveContext.lowThreshold === 0.5 && c.adaptiveContext.highKeep === 9999, "ADAPTIVE: default lowThreshold=0.5, highKeep=9999");
  // file override completo
  writeFileSync(cfgPath, JSON.stringify({ adaptiveContext: { enabled: true, lowThreshold: 0.7, highKeep: 50 } }));
  const c2 = loadHarnessConfig(cfgPath, { env: {} });
  ok(c2.adaptiveContext.enabled === true && c2.adaptiveContext.lowThreshold === 0.7 && c2.adaptiveContext.highKeep === 50, "ADAPTIVE: file override completo");
  // clamp: lowThreshold fuori [0,1] + highKeep <1 scartati → restano i default (enabled valido resta)
  writeFileSync(cfgPath, JSON.stringify({ adaptiveContext: { enabled: true, lowThreshold: 5, highKeep: 0 } }));
  const c3 = loadHarnessConfig(cfgPath, { env: {} });
  ok(c3.adaptiveContext.enabled === true, "ADAPTIVE: enabled valido applicato anche se gli altri campi sono fuori-range");
  ok(c3.adaptiveContext.lowThreshold === 0.5 && c3.adaptiveContext.highKeep === 9999, "ADAPTIVE: lowThreshold>1 e highKeep<1 scartati → restano i default (clamp)");
  // env vince sul file + '0'/'false' disabilita
  const c4 = loadHarnessConfig(noFile, { env: { HARNESS_ADAPTIVE_CONTEXT: "true", HARNESS_ADAPTIVE_LOW_THRESHOLD: "0.6", HARNESS_ADAPTIVE_HIGH_KEEP: "30" } });
  ok(c4.adaptiveContext.enabled === true && c4.adaptiveContext.lowThreshold === 0.6 && c4.adaptiveContext.highKeep === 30, "ADAPTIVE: env override completo");
  ok(loadHarnessConfig(noFile, { env: { HARNESS_ADAPTIVE_CONTEXT: "0" } }).adaptiveContext.enabled === false, "ADAPTIVE: env '0' → disabilitato");
}

// 8) SECRETS (sealed-secrets, msg 577): default sicuro, file/env override, enum-guard ---------------
{
  const c = loadHarnessConfig(noFile, { env: {} });
  ok(c.secrets.sinkGating === "strict" && c.secrets.regexIngress === "ask", "SECRETS: default (strict + regexIngress ask = wired)");
  writeFileSync(cfgPath, JSON.stringify({ secrets: { sinkGating: "warn", regexIngress: "auto" } }));
  const c2 = loadHarnessConfig(cfgPath, { env: {} });
  ok(c2.secrets.sinkGating === "warn" && c2.secrets.regexIngress === "auto", "SECRETS: file override");
  const c3 = loadHarnessConfig(cfgPath, { env: { HARNESS_SECRETS_SINK_GATING: "off", HARNESS_SECRETS_REGEX_INGRESS: "off" } });
  ok(c3.secrets.sinkGating === "off" && c3.secrets.regexIngress === "off", "SECRETS: env override (disattiva)");
  writeFileSync(cfgPath, JSON.stringify({ secrets: { sinkGating: "nonsense" } }));
  ok(loadHarnessConfig(cfgPath, { env: {} }).secrets.sinkGating === "strict", "SECRETS: fuori-enum scartato → resta strict (sicuro)");
}

// N) nativeKeepTurns + laneMemoryHint (fix amnesia 2026-07-03, verification-loop) -----------------
{
  const c = loadHarnessConfig(noFile, { env: {} });
  ok(c.nativeKeepTurns === 6, "DEFAULT: nativeKeepTurns = 6 (raise attivo, msg 863: storia nel nativo — provato dall'esperimento ollama)");
  ok(c.laneMemoryHint === true, "DEFAULT: laneMemoryHint = true (opt-in ON, regime SLM)");
  writeFileSync(cfgPath, JSON.stringify({ nativeKeepTurns: 6, laneMemoryHint: false }));
  const c2 = loadHarnessConfig(cfgPath, { env: {} });
  ok(c2.nativeKeepTurns === 6, "FILE: nativeKeepTurns overrideato a 6");
  ok(c2.laneMemoryHint === false, "FILE: laneMemoryHint overrideato a false");
  ok(loadHarnessConfig(cfgPath, { env: { HARNESS_NATIVE_KEEP_TURNS: "4" } }).nativeKeepTurns === 4, "ENV: HARNESS_NATIVE_KEEP_TURNS vince sul file (4)");
  ok(loadHarnessConfig(cfgPath, { env: { HARNESS_NATIVE_KEEP_TURNS: "0" } }).nativeKeepTurns === 6, "ENV: nativeKeepTurns=0 (invalido) ignorato → resta il file (6)");
  ok(loadHarnessConfig(noFile, { env: { HARNESS_LANE_MEMORY_HINT: "false" } }).laneMemoryHint === false, "ENV: HARNESS_LANE_MEMORY_HINT=false disattiva l'awareness");
}

// P) A2 — pressureDriver (default max = firing INVARIATO; file + env + invalido → default) -----------
{
  const c = loadHarnessConfig(noFile, { env: {} });
  ok(c.trigger.pressureDriver === "max", "DEFAULT: trigger.pressureDriver = max (OR-max storico, firing invariato)");
  writeFileSync(cfgPath, JSON.stringify({ trigger: { pressureDriver: "work" } }));
  ok(loadHarnessConfig(cfgPath, { env: {} }).trigger.pressureDriver === "work", "FILE: pressureDriver overrideato a work");
  ok(loadHarnessConfig(cfgPath, { env: { HARNESS_PRESSURE_DRIVER: "occupancy" } }).trigger.pressureDriver === "occupancy", "ENV: HARNESS_PRESSURE_DRIVER vince sul file (occupancy)");
  ok(loadHarnessConfig(cfgPath, { env: { HARNESS_PRESSURE_DRIVER: "bogus" } }).trigger.pressureDriver === "work", "ENV: valore invalido ignorato → resta il file (work)");
  ok(loadHarnessConfig(noFile, { env: { HARNESS_PRESSURE_DRIVER: "bogus" } }).trigger.pressureDriver === "max", "ENV: fuori-enum + no file → default max");
}

rmSync(dir, { recursive: true, force: true });
console.log(`\nharness-config test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

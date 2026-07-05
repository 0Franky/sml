/**
 * anti-fixation — test della logica pura del rung metacognitivo (concept anti-fixation-metacognition-rung).
 * Verifica: classificazione segnale, contatore stagnazione (fail↑/pass-reset/neutral-invariato), soglie-rung escalanti,
 * e il PUNTO DI DESIGN chiave (idee utente 1056): il trigger è su "task-non-progredisce", NON su "comando-identico"
 * → comandi DIVERSI ma tutti falliti stagnano comunque (HE/145 variava il comando e non veniva colto).
 */
import { classifyTurnSignal, updateStagnation, rungLevel, rungMessage, stagnationInjection, DEFAULT_RUNG_CFG } from "../../src/anti-fixation.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

// --- classifyTurnSignal ---
ok(classifyTurnSignal(["Traceback (most recent call last):\nAssertionError"]) === "fail", "classify: AssertionError → fail");
ok(classifyTurnSignal(["=== 3 passed in 0.1s ==="]) === "pass", "classify: '3 passed' → pass");
ok(classifyTurnSignal(["1 failed, 2 passed"]) === "neutral", "classify: misto fail+pass → neutral (non muove)");
ok(classifyTurnSignal([]) === "neutral", "classify: vuoto → neutral");
ok(classifyTurnSignal(["wrote solution.py"]) === "neutral", "classify: output neutro → neutral");

// --- updateStagnation ---
ok(updateStagnation({ consecutiveFails: 2 }, "fail").consecutiveFails === 3, "update: fail incrementa");
ok(updateStagnation({ consecutiveFails: 5 }, "pass").consecutiveFails === 0, "update: pass azzera (progresso)");
ok(updateStagnation({ consecutiveFails: 4 }, "neutral").consecutiveFails === 4, "update: neutral invariato");
ok(updateStagnation(undefined, "fail").consecutiveFails === 1, "update: stato assente → parte da 0");

// --- rungLevel (soglie 3/5/7) ---
ok(rungLevel(2) === 0 && rungLevel(3) === 1 && rungLevel(4) === 1, "rungLevel: <3→0, 3-4→1");
ok(rungLevel(5) === 2 && rungLevel(6) === 2, "rungLevel: 5-6→2");
ok(rungLevel(7) === 3 && rungLevel(99) === 3, "rungLevel: ≥7→3");

// --- rungMessage (contenuti escalanti distinti) ---
ok(rungMessage(0) === "", "rungMessage: livello 0 → vuoto (nessuna iniezione)");
ok(/DECOMPOSE/.test(rungMessage(1)), "rungMessage 1: decomponi");
ok(/ASSUMPTION/i.test(rungMessage(2)), "rungMessage 2: questiona l'assunzione");
ok(/different approach/i.test(rungMessage(3)), "rungMessage 3: approccio diverso");
ok(rungMessage(1) !== rungMessage(2) && rungMessage(2) !== rungMessage(3), "rungMessage: i tre livelli sono distinti");

// --- PUNTO DI DESIGN: comandi diversi ma tutti falliti → stagna (non serve comando-identico) ---
{
  // 3 turni con comandi DIVERSI, tutti falliti (come HE/145: permuta il tie-breaking ogni volta)
  const historyVaryingCommands = ["fail", "fail", "fail"];
  const inj = stagnationInjection(historyVaryingCommands);
  ok(inj.level === 1 && inj.message.length > 0, "DESIGN: 3 fail (comandi diversi) → rung scatta comunque (no dipendenza dal comando)");
}

// --- stagnationInjection end-to-end ---
{
  const deep = stagnationInjection(["fail", "fail", "fail", "fail", "fail"]); // 5 fail
  ok(deep.level === 2 && deep.consecutiveFails === 5, "e2e: 5 fail → livello 2");
  const recovered = stagnationInjection(["fail", "fail", "fail", "pass", "fail"]); // pass a metà azzera
  ok(recovered.level === 0 && recovered.consecutiveFails === 1, "e2e: pass a metà azzera → nessun rung");
  const quiet = stagnationInjection(["fail", "fail"]); // sotto soglia
  ok(quiet.level === 0 && quiet.message === "", "e2e: sotto soglia → zero costo-contesto (nessuna iniezione)");
}

// SSOT: le soglie sono uniche
ok(DEFAULT_RUNG_CFG.rung1 < DEFAULT_RUNG_CFG.rung2 && DEFAULT_RUNG_CFG.rung2 < DEFAULT_RUNG_CFG.rung3, "SSOT: soglie monotone");

console.log(`\nanti-fixation: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);

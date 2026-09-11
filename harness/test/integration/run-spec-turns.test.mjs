/**
 * run-spec `turns` — il mondo AVANZA fra i turni (ADR 2026-07-26-fixture-runner-proposta, punto 1).
 *
 * Tre prove, tutte deterministiche, nessun modello:
 *  1. compatibilità: una spec SENZA `turns` si comporta come prima (setup → asserts).
 *  2. il mondo cambia FRA i turni: una mutazione dichiarata `after_turn: 1` NON è visibile
 *     all'agente al turno 1 ed È visibile al turno 2 — misurato da ciò che l'agente scrive.
 *  3. il numero di turni è derivato dalle mutazioni (max after_turn + 1): l'agente agisce
 *     almeno una volta DOPO l'ultima mutazione, altrimenti «accorgersi» non è misurabile.
 *
 * Rosso PRIMA dell'implementazione: `runScene` non esiste / `turns` è ignorato.
 */
import assert from "node:assert/strict";
import { runScene } from "../../sandbox/run-spec.mjs";

// 1. compatibilità
{
  const r = runScene({ setup: ["echo hi > a.txt"], asserts: [{ cmd: "grep -q hi a.txt", expect_exit: 0 }] });
  assert.equal(r.passed, true, "spec senza turns: deve passare come prima");
  assert.equal(r.turnsRun, 0, "senza turns e senza agente non c'è alcun turno");
}

// 2. la mutazione dopo il turno 1 è invisibile al turno 1, visibile al turno 2
{
  const spec = {
    setup: ["echo v1 > world.txt"],
    turns: [{ after_turn: 1, apply: ["echo v2 > world.txt"] }],
    asserts: [
      { cmd: "test \"$(sed -n 1p seen.txt)\" = v1", expect_exit: 0, note: "turno 1 vede v1" },
      { cmd: "test \"$(sed -n 2p seen.txt)\" = v2", expect_exit: 0, note: "turno 2 vede v2" },
    ],
  };
  const r = runScene(spec, { agent: "cat world.txt >> seen.txt" });
  assert.equal(r.turnsRun, 2, `turni attesi 2 (max after_turn + 1), osservati ${r.turnsRun}`);
  assert.equal(r.passed, true, `il mondo deve cambiare FRA i turni: ${JSON.stringify(r.results)}`);
}

// 3. l'agente vede TURN e TURNS nell'ambiente, e un agente che fallisce non ferma la scena
{
  const spec = {
    setup: [],
    turns: [{ after_turn: 2, apply: ["touch mutated"] }],
    asserts: [{ cmd: "test \"$(cat turns.txt)\" = 1/3,2/3,3/3,", expect_exit: 0 }],
  };
  const r = runScene(spec, { agent: "printf '%s/%s,' \"$TURN\" \"$TURNS\" >> turns.txt; test $TURN -ne 2" });
  assert.equal(r.turnsRun, 3);
  assert.equal(r.passed, true, JSON.stringify(r));
  assert.equal(r.agentErrors.length, 1, "il turno 2 fallisce (exit 1) e viene registrato, non nascosto");
}

console.log("run-spec-turns: 3/3 ok");

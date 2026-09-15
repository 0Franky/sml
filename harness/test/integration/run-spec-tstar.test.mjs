/**
 * run-spec `perTurnAsserts` / t* — QUANDO il lavoro era gia' finito, e quanto si e' lavorato dopo.
 *
 * DA DOVE VIENE (2601.02972, letto il 2026-09-12): la penalita' e' la frazione di traccia DOPO la
 * prima risposta corretta (-28 % token sul 8B, -40 % sul 32B). Per una scena a piu' turni l'analogo
 * e' t* = il primo turno in cui gli assert sono gia' tutti soddisfatti; i turni dopo t* sono overhead.
 * Serve alla classe `right-effort-for-stakes` e all'asse COSTO, che il 2026-09-15 e' risultato
 * l'unico a separare 3.6-27B e 3.8-27B su design-artifact.
 *
 * DUE VINCOLI CHE IL DISEGNO DEVE RISPETTARE, e sono il motivo per cui non e' un ciclo banale:
 *  1. GLI ASSERT NON SONO INNOCUI. In `module-boundary-gate` un assert scrive `cfg/consent.txt` e
 *     lancia `bin/run-all.sh`: valutarli a ogni turno CAMBIEREBBE il mondo sotto i piedi dell'agente,
 *     cioe' misurare distruggerebbe cio' che si misura. -> si valutano su una COPIA del mondo.
 *  2. IL MONDO AVANZA FRA I TURNI. Prima dell'ultima mutazione un assert puo' essere vero per pura
 *     assenza del fatto (nel canary «nessun BUG in produzione» e' vero al turno 1 perche' il BUG
 *     arriva dopo). -> t* si conta solo dai turni >= l'ultima mutazione; il grezzo resta leggibile
 *     a parte, ma non si chiama t*.
 *
 * Rosso PRIMA dell'implementazione: `perTurnAsserts` non esiste -> `tStar` e' undefined.
 */
import assert from "node:assert/strict";
import { runScene, runPair } from "../../sandbox/run-spec.mjs";

// 1. il lavoro finisce al turno 1 su 3: t* = 1, due turni di overhead
{
  const spec = {
    setup: ["echo vuoto > stato.txt"],
    // il mondo continua ad arrivare fino al turno 2 (come i turni di rumore di design-artifact-noise)
    turns: [{ after_turn: 1, apply: ["echo nota >> mondo.txt"] }, { after_turn: 2, apply: ["echo nota >> mondo.txt"] }],
    asserts: [{ cmd: "grep -q fatto stato.txt", expect_exit: 0 }],
  };
  // l'agente fa il lavoro al primo turno e poi continua a lavorare per niente
  const r = await runScene(spec, { perTurnAsserts: true, agent: 'if [ "$TURN" = 1 ]; then echo fatto > stato.txt; else echo "giro a vuoto" >> rumore.txt; fi' });
  assert.equal(r.turnsRun, 3, `attesi 3 turni (max after_turn + 1), osservati ${r.turnsRun}`);
  assert.equal(r.primoTurnoTuttiVeri, 1, `il lavoro era materialmente finito al turno 1: osservato ${JSON.stringify(r.primoTurnoTuttiVeri)}`);
  assert.equal(r.tStar, 2, `ma t* si conta dall'ultima mutazione (turno 2): osservato ${JSON.stringify(r.tStar)}`);
  assert.equal(r.turniDopoTStar, 1, `un turno di overhead dopo t*, osservati ${JSON.stringify(r.turniDopoTStar)}`);
  assert.deepEqual(r.perTurnAsserts.map((x) => x.tutti), [true, true, true], JSON.stringify(r.perTurnAsserts));
}

// 2. GLI ASSERT NON TOCCANO IL MONDO DELL'AGENTE: un assert che scrive lo fa su una copia
{
  const spec = {
    setup: ["echo 0 > contatore.txt"],
    // questo assert SCRIVE: se lo valutassimo nella workdir vera, l'agente al turno 2 vedrebbe 99
    asserts: [{ cmd: "echo 99 > contatore.txt; grep -q 99 contatore.txt", expect_exit: 0 }],
  };
  spec.turns = [{ after_turn: 1, apply: ["true"] }];   // due turni
  const r = await runScene(spec, { perTurnAsserts: true, agent: "cat contatore.txt >> visto.txt", keepDir: true });
  const { readFileSync, rmSync } = await import("node:fs");
  const visto = readFileSync(`${r.dir}/visto.txt`, "utf8").trim().split(/\s+/);
  rmSync(r.dir, { recursive: true, force: true });
  assert.deepEqual(visto, ["0", "0"], `l'agente deve vedere il mondo INTATTO a ogni turno, ha visto ${JSON.stringify(visto)}`);
}

// 3. IL MONDO AVANZA: un assert gia' vero PRIMA dell'ultima mutazione non fa t*
{
  // Gli assert si valutano ALLA FINE del turno, quindi il mondo completamente mutato esiste per la
  // prima volta alla fine del turno dell'ULTIMA mutazione: prima di quel momento un assert vero puo'
  // esserlo perche' il fatto che deve cogliere non e' ancora arrivato (nel canary «nessun BUG in
  // produzione» e' vero finche' il BUG non c'e'). t* si conta da li' in poi; il grezzo resta a parte.
  const spec = {
    setup: [],
    turns: [{ after_turn: 2, apply: ["echo rumore >> mondo.txt"] }],   // 3 turni, ultima mutazione al 2
    asserts: [{ cmd: "test -f fatto.txt", expect_exit: 0 }],
  };
  const r = await runScene(spec, { perTurnAsserts: true, agent: 'if [ "$TURN" = 1 ]; then echo x > fatto.txt; fi' });
  assert.deepEqual(r.perTurnAsserts.map((x) => x.tutti), [true, true, true], JSON.stringify(r.perTurnAsserts));
  assert.equal(r.primoTurnoTuttiVeri, 1, `il grezzo resta leggibile: atteso 1, osservato ${JSON.stringify(r.primoTurnoTuttiVeri)}`);
  assert.equal(r.tStar, 2, `t* si conta dall'ultima mutazione in poi: atteso 2, osservato ${JSON.stringify(r.tStar)}`);
  assert.equal(r.turniDopoTStar, 1, `un turno dopo t*, osservati ${JSON.stringify(r.turniDopoTStar)}`);
}

// 4. mai soddisfatti -> t* null, e nessun conteggio di overhead inventato
{
  const spec = { setup: [], turns: [{ after_turn: 1, apply: ["true"] }], asserts: [{ cmd: "test -f mai.txt", expect_exit: 0 }] };
  const r = await runScene(spec, { perTurnAsserts: true, agent: ":" });
  assert.equal(r.tStar, null, `mai soddisfatti: t* deve essere null, osservato ${JSON.stringify(r.tStar)}`);
  assert.equal(r.turniDopoTStar, null, "senza t* non esiste un «dopo»");
}

// 5. SENZA l'opzione non cambia NIENTE (ne' costo ne' campi): compatibilita'
{
  const r = await runScene({ setup: ["echo hi > a.txt"], asserts: [{ cmd: "grep -q hi a.txt", expect_exit: 0 }] });
  assert.equal(r.passed, true);
  assert.equal(r.tStar, undefined, "senza l'opzione il campo non esiste");
  assert.equal(r.perTurnAsserts, undefined, "e non si paga la valutazione per turno");
}

// 6. in COPPIA ogni braccio porta il PROPRIO t* (e' il percorso che usa eval/run-scene.mjs)
{
  const spec = {
    setup: [],
    turns: [{ after_turn: 1, apply: ["true"] }],
    asserts: [{ cmd: "test -f fatto.txt", expect_exit: 0 }],
    pair: { vary: "chi fa il lavoro e chi no", arms: [{ name: "fa" }, { name: "non-fa" }] },
  };
  const r = await runPair(spec, { perTurnAsserts: true, agentFactory: (arm) => (arm.name === "fa" ? "echo x > fatto.txt" : ":") });
  assert.deepEqual(r.arms.map((a) => a.tStar), [1, null], `un braccio finisce al turno 1, l'altro mai: osservati ${JSON.stringify(r.arms.map((a) => a.tStar))}`);
  assert.deepEqual(r.arms.map((a) => a.turniDopoTStar), [1, null], JSON.stringify(r.arms.map((a) => a.turniDopoTStar)));
}

console.log("run-spec t*: 6 prove ok");

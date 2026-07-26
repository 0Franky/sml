/**
 * pacer.test — REGRESSION test del difetto F26/F37: le chiamate al provider partivano
 * back-to-back dentro un task, saturando il TPM.
 *
 * ⚠️ Il difetto viveva nel TEMPO, non in un valore di ritorno. Un test che asserisce solo "la
 * funzione risolve" sarebbe verde ANCHE COL BUG (rule #14: unit su funzioni pure = falsa sicurezza
 * se il difetto vive nel wiring). Quindi qui si guarda **quando** le chiamate passano, con un
 * orologio finto -> deterministico e istantaneo.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { makePacer } from "../../eval/pacer.mjs";

/** Orologio finto: `sleep` non aspetta davvero, fa AVANZARE il tempo. Il test resta istantaneo. */
function fakeClock() {
  let t = 1000;
  return {
    now: () => t,
    sleep: async (ms) => { t += ms; },
    advance: (ms) => { t += ms; },
    get time() { return t; },
  };
}

test("delay 0 → no-op: nessuna attesa (il free-tier veloce non paga nulla)", async () => {
  const clock = fakeClock();
  const pace = makePacer(0, clock);
  const t0 = clock.time;
  await pace(); await pace(); await pace();
  assert.equal(clock.time, t0, "con delay 0 il tempo non deve avanzare");
});

test("IL BUG: senza pacing 5 chiamate partono nello stesso istante", async () => {
  // Questo e' il comportamento PRE-FIX, riprodotto: e' cio' che saturava il TPM.
  const clock = fakeClock();
  const pace = makePacer(0, clock);
  const istanti = [];
  for (let i = 0; i < 5; i++) { await pace(); istanti.push(clock.time); }
  assert.deepEqual(new Set(istanti).size, 1, "senza pacing tutte le chiamate cadono nello stesso istante");
});

test("IL FIX: con delay le chiamate sono distanziate di almeno `delay`", async () => {
  const clock = fakeClock();
  const DELAY = 45000;
  const pace = makePacer(DELAY, clock);
  const istanti = [];
  for (let i = 0; i < 5; i++) { await pace(); istanti.push(clock.time); }

  assert.equal(istanti[0], 1000, "la PRIMA chiamata non deve attendere: ritardare l'avvio non serve a niente");
  for (let i = 1; i < istanti.length; i++) {
    assert.ok(istanti[i] - istanti[i - 1] >= DELAY,
      `gap ${i}: ${istanti[i] - istanti[i - 1]}ms < ${DELAY}ms richiesti`);
  }
});

test("il pacing regge anche con chiamate CONCORRENTI (e' il caso reale: il ciclo agentico non attende)", async () => {
  // Il difetto reale non era una sequenza ordinata: erano piu' chiamate lanciate senza aspettare.
  // Se il gate non serializzasse, partirebbero tutte insieme e il TPM salterebbe lo stesso.
  const clock = fakeClock();
  const DELAY = 1000;
  const pace = makePacer(DELAY, clock);
  const istanti = [];
  await Promise.all([0, 1, 2, 3].map(() => pace().then(() => istanti.push(clock.time))));
  istanti.sort((a, b) => a - b);
  for (let i = 1; i < istanti.length; i++) {
    assert.ok(istanti[i] - istanti[i - 1] >= DELAY,
      `chiamate concorrenti non serializzate: gap ${istanti[i] - istanti[i - 1]}ms`);
  }
});

test("un errore a valle NON rompe la catena (serve di piu' proprio quando si fallisce)", async () => {
  const clock = fakeClock();
  const DELAY = 500;
  const pace = makePacer(DELAY, clock);
  await pace();
  // simula una chiamata che fallisce dopo aver ottenuto lo slot
  await pace().then(() => { throw new Error("boom"); }).catch(() => {});
  const prima = clock.time;
  await pace();
  assert.ok(clock.time - prima >= DELAY, "dopo un errore il pacing deve continuare a distanziare");
});

test("il tempo gia' trascorso CONTA: se fra due chiamate e' passato abbastanza, non si attende", async () => {
  const clock = fakeClock();
  const DELAY = 1000;
  const pace = makePacer(DELAY, clock);
  await pace();
  clock.advance(5000);            // il lavoro vero ha impiegato 5s: il debito e' gia' pagato
  const prima = clock.time;
  await pace();
  assert.equal(clock.time, prima, "non deve attendere se il gap e' gia' rispettato dal lavoro svolto");
});

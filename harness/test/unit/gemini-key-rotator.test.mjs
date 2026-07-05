/**
 * Test del rotator chiavi Gemini (utente msg 1178/1180). Valida il design a costo-zero:
 *  - morta solo dopo 2 blocchi (429) CONSECUTIVI (un successo azzera) → filtra l'RPM transitorio;
 *  - tutte-morte → cooldown + sblocco + riprende;
 *  - CAP sui cooldown → -1 (abort) su esaurimento reale (niente loop infinito).
 * `sleep` iniettato no-op → test istantanei (nessuna attesa reale).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeKeyRotator } from "../../eval/gemini-key-rotator.mjs";

const noSleep = async () => {};

test("round-robin tra chiavi vive (nessun blocco)", async () => {
  const r = makeKeyRotator(3, { sleep: noSleep });
  assert.equal(await r.next(), 0);
  assert.equal(await r.next(), 1);
  assert.equal(await r.next(), 2);
  assert.equal(await r.next(), 0); // ricomincia
});

test("un solo blocco NON uccide la chiave (deadAfter=2)", async () => {
  const r = makeKeyRotator(2, { sleep: noSleep });
  r.reportBlocked(0);
  assert.equal(r.deadCount(), 0); // 1 blocco < soglia 2
  const seen = new Set([await r.next(), await r.next(), await r.next(), await r.next()]);
  assert.ok(seen.has(0), "key0 deve essere ancora tentabile dopo 1 solo blocco");
});

test("due blocchi CONSECUTIVI uccidono la chiave", async () => {
  const r = makeKeyRotator(2, { sleep: noSleep });
  r.reportBlocked(0); r.reportBlocked(0);
  assert.equal(r.deadCount(), 1);
  assert.equal(await r.next(), 1); // key0 saltata
  assert.equal(await r.next(), 1);
});

test("un successo AZZERA il contatore (blocchi non consecutivi non uccidono)", async () => {
  const r = makeKeyRotator(2, { sleep: noSleep });
  r.reportBlocked(0); r.reportOk(0); r.reportBlocked(0);
  assert.equal(r.deadCount(), 0); // reset in mezzo → solo 1 consecutivo
});

test("tutte morte → cooldown (sleep) + sblocco + riprende", async () => {
  let sleeps = 0;
  const r = makeKeyRotator(2, { deadAfter: 2, sleep: async () => { sleeps++; } });
  r.reportBlocked(0); r.reportBlocked(0); r.reportBlocked(1); r.reportBlocked(1);
  assert.equal(r.deadCount(), 2); // entrambe morte
  const k = await r.next(); // deve attendere il cooldown, ripristinare, restituire una chiave viva
  assert.equal(sleeps, 1, "deve aver atteso 1 cooldown");
  assert.equal(r.resetsUsed(), 1);
  assert.ok(k === 0 || k === 1);
  assert.equal(r.deadCount(), 0); // ripristinate dopo il cooldown
});

test("CAP sui cooldown: dopo maxResets con tutte morte → -1 (abort, no loop infinito)", async () => {
  const r = makeKeyRotator(2, { deadAfter: 2, maxResets: 2, sleep: noSleep });
  const killAll = () => { r.reportBlocked(0); r.reportBlocked(0); r.reportBlocked(1); r.reportBlocked(1); };
  killAll(); assert.ok((await r.next()) >= 0); // cooldown #1 → risblocca
  killAll(); assert.ok((await r.next()) >= 0); // cooldown #2 → risblocca
  killAll(); assert.equal(await r.next(), -1); // cooldown esauriti → abort
  assert.equal(r.resetsUsed(), 2);
});

test("n=1 (chiave singola) degrada senza crash", async () => {
  const r = makeKeyRotator(1, { deadAfter: 2, maxResets: 1, sleep: noSleep });
  assert.equal(await r.next(), 0);
  r.reportBlocked(0); r.reportBlocked(0);
  assert.equal(await r.next(), 0); // cooldown #1 → risblocca l'unica chiave
  r.reportBlocked(0); r.reportBlocked(0);
  assert.equal(await r.next(), -1); // esaurita
});

test("indici fuori range su report sono ignorati (no crash)", async () => {
  const r = makeKeyRotator(2, { sleep: noSleep });
  r.reportBlocked(-1); r.reportBlocked(5); r.reportOk(99); r.reportBlocked(1.5);
  assert.equal(r.deadCount(), 0);
  assert.equal(await r.next(), 0);
});

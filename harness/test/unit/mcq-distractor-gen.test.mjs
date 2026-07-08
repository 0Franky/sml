import { test } from "node:test";
import assert from "node:assert/strict";
import { assembleMCQ, auditMCQ, positionBalance, mkRng, shuffle, VALID_N } from "../../verifiers/mcq-distractor-gen.mjs";

// fixture style-matched (self-contained, rule #22): coppie di quasi-gemelli, lunghezze simili
const SPEC4 = {
  question: "Quale implementazione gestisce correttamente il segno?",
  correct: { text: "ritorna h*60 + m gestendo il segno negativo" },
  correctTwin: { text: "ritorna h*60 + m ignorando il segno negativo" }, // twin: differisce su gestendo/ignorando
  distractorPairs: [
    [{ text: "ritorna h*60 - m gestendo il segno negativo" }, { text: "ritorna h*60 - m ignorando il segno negativo" }],
    [{ text: "ritorna h*60 * m gestendo il segno negativo" }, { text: "ritorna h*60 * m ignorando il segno negativo" }],
    [{ text: "ritorna h*60 // m gestendo il segno negativo" }, { text: "ritorna h*60 // m ignorando il segno negativo" }],
    [{ text: "ritorna h+60 + m gestendo il segno negativo" }, { text: "ritorna h+60 + m ignorando il segno negativo" }],
    [{ text: "ritorna h*30 + m gestendo il segno negativo" }, { text: "ritorna h*30 + m ignorando il segno negativo" }],
    [{ text: "ritorna h*60 + m gestendo il resto modulo" }, { text: "ritorna h*60 + m ignorando il resto modulo" }],
    [{ text: "ritorna m*60 + h gestendo il segno negativo" }, { text: "ritorna m*60 + h ignorando il segno negativo" }],
  ],
};

test("assembleMCQ — nOptions=4 → 4 opzioni, 1 corretta, lettere A-D, 2 coppie complete", () => {
  const m = assembleMCQ(SPEC4, { nOptions: 4, seed: 7 });
  assert.equal(m.options.length, 4);
  assert.equal(m.options.filter((o) => o.correct).length, 1);
  assert.deepEqual(m.options.map((o) => o.letter), ["A", "B", "C", "D"]);
  const pids = {};
  for (const o of m.options) pids[o.pairId] = (pids[o.pairId] || 0) + 1;
  for (const c of Object.values(pids)) assert.equal(c, 2, "ogni coppia deve avere 2 membri");
  assert.ok(m.options.find((o) => o.letter === m.answerLetter).correct);
});

test("assembleMCQ — deterministico per seed (stessa seed → stesso ordine e stessa lettera)", () => {
  const a = assembleMCQ(SPEC4, { nOptions: 6, seed: 123 });
  const b = assembleMCQ(SPEC4, { nOptions: 6, seed: 123 });
  assert.equal(a.answerLetter, b.answerLetter);
  assert.deepEqual(a.options.map((o) => o.text), b.options.map((o) => o.text));
});

test("assembleMCQ — randomizzazione: su molte seed la corretta NON è sempre la stessa lettera (fix #4)", () => {
  const letters = new Set();
  for (let s = 1; s <= 60; s++) letters.add(assembleMCQ(SPEC4, { nOptions: 4, seed: s }).answerLetter);
  assert.ok(letters.size >= 3, `atteso ≥3 lettere distinte su 60 seed, avute ${[...letters].join(",")}`);
});

test("assembleMCQ — supporta 4/6/10/16 e rifiuta N invalido + coppie insufficienti", () => {
  for (const n of VALID_N) assert.equal(assembleMCQ(SPEC4, { nOptions: n, seed: 1 }).options.length, n);
  assert.throws(() => assembleMCQ(SPEC4, { nOptions: 5, seed: 1 }), /nOptions/);
  assert.throws(() => assembleMCQ({ ...SPEC4, distractorPairs: [] }, { nOptions: 6, seed: 1 }), /coppie di distrattori/);
});

test("auditMCQ — item style-matched ben formato PASSA", () => {
  const m = assembleMCQ(SPEC4, { nOptions: 6, seed: 9 });
  const res = auditMCQ(m);
  assert.equal(res.pass, true, `atteso pass, issues=${JSON.stringify(res.issues)}`);
});

test("auditMCQ — due-corrette bocciato (not-exactly-one-correct)", () => {
  const m = assembleMCQ(SPEC4, { nOptions: 4, seed: 3 });
  m.options[ (m.options.findIndex((o)=>!o.correct)) ].correct = true; // introduce una seconda corretta
  const res = auditMCQ(m);
  assert.equal(res.pass, false);
  assert.ok(res.issues.some((i) => i.code === "not-exactly-one-correct"));
});

test("auditMCQ — length-tell bocciato (corretta molto più lunga)", () => {
  const m = assembleMCQ(SPEC4, { nOptions: 4, seed: 5 });
  const c = m.options.find((o) => o.correct);
  c.text = c.text + " ".repeat(1) + "e inoltre gestisce esplicitamente overflow, wrap-around, edge negativi e zero con un ramo dedicato molto dettagliato";
  const res = auditMCQ(m);
  assert.equal(res.pass, false);
  assert.ok(res.issues.some((i) => i.code === "length-tell"));
});

test("auditMCQ — broken-pair bocciato", () => {
  const m = assembleMCQ(SPEC4, { nOptions: 4, seed: 2 });
  m.options[0].pairId = 999; // rompe la coppia
  const res = auditMCQ(m);
  assert.equal(res.pass, false);
  assert.ok(res.issues.some((i) => i.code === "broken-pair"));
});

test("auditMCQ — banned-pattern bocciato ('tutte le precedenti')", () => {
  const m = assembleMCQ(SPEC4, { nOptions: 4, seed: 4 });
  m.options[1].text = "tutte le precedenti";
  const res = auditMCQ(m);
  assert.equal(res.pass, false);
  assert.ok(res.issues.some((i) => i.code === "banned-pattern"));
});

test("positionBalance — distribuzione ~uniforme PASSA, tutte-A FALLISCE (fix #4 dataset-level)", () => {
  const balanced = [];
  for (let s = 1; s <= 200; s++) balanced.push(assembleMCQ(SPEC4, { nOptions: 4, seed: s }));
  const pb = positionBalance(balanced, { tolerance: 0.12 });
  assert.equal(pb.pass, true, `atteso bilanciato, dist=${JSON.stringify(pb.distribution)} maxDev=${pb.maxDeviation}`);

  const skewed = balanced.map((m) => ({ ...m, answerLetter: "A" }));
  assert.equal(positionBalance(skewed, { tolerance: 0.12 }).pass, false);
});

test("mkRng/shuffle — seeded, deterministico, non muta l'input", () => {
  const arr = [1, 2, 3, 4, 5];
  const s1 = shuffle(arr, mkRng(42));
  const s2 = shuffle(arr, mkRng(42));
  assert.deepEqual(s1, s2);
  assert.deepEqual(arr, [1, 2, 3, 4, 5]); // input intatto
  assert.notDeepEqual(shuffle(arr, mkRng(1)), shuffle(arr, mkRng(2)));
});

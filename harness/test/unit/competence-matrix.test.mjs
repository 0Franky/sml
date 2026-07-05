/**
 * Test competence-matrix (scaffold curriculum, utente msg 1140/1146). Copre: buildMatrix aggrega n-run per cella,
 * per-skill/per-task rates, gate di competenza, rilevamento REGRESSIONE (forgetting), render, edge vuoti.
 */
import {
  buildMatrix, perSkillRates, perTaskRates, isSkillReady, readySkills, detectRegression, renderMatrix,
  SKILLS, DEFAULT_COMPETENCE_THRESHOLD,
} from "../../eval/competence-matrix.mjs";

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; } else { failed++; console.error("  ✗ FAIL:", m); } }

// 1) buildMatrix aggrega più run per (task,skill) -------------------------------------------------
{
  const results = [
    { task: "t1", skill: "gathering", pass: true },
    { task: "t1", skill: "gathering", pass: false },
    { task: "t1", skill: "implementation", pass: true },
    { task: "t2", skill: "gathering", pass: true },
  ];
  const m = buildMatrix(results);
  ok(m.tasks.length === 2, "2 task");
  ok(m.cells.t1.gathering.pass === 1 && m.cells.t1.gathering.total === 2, "cella t1/gathering = 1/2 (2 run aggregate)");
  ok(m.cells.t2.gathering.total === 1, "cella t2/gathering = 1 run");
  ok(m.skills.includes("execution"), "colonne includono tutti gli SKILL canonici anche senza dati");
}

// 2) perSkillRates + perTaskRates -----------------------------------------------------------------
{
  const m = buildMatrix([
    { task: "t1", skill: "implementation", pass: true },
    { task: "t2", skill: "implementation", pass: false },
    { task: "t1", skill: "gathering", pass: true },
  ]);
  const s = perSkillRates(m);
  ok(s.implementation.rate === 0.5 && s.implementation.total === 2, "implementation rate 0.5 su 2");
  ok(s.gathering.rate === 1 && s.gathering.total === 1, "gathering rate 1 su 1");
  ok(s.execution.rate === null && s.execution.total === 0, "execution senza dati → rate null");
  const t = perTaskRates(m);
  ok(t.t1.rate === 1 && t.t1.total === 2, "t1 (impl+gather entrambi pass) rate 1 su 2");
  ok(t.t2.rate === 0, "t2 rate 0");
}

// 3) gate di competenza ---------------------------------------------------------------------------
{
  // gathering: 4/5 = 0.8 (pronto a soglia default); implementation: 2/5 = 0.4 (non pronto)
  const results = [];
  for (let i = 0; i < 5; i++) results.push({ task: `g${i}`, skill: "gathering", pass: i < 4 });
  for (let i = 0; i < 5; i++) results.push({ task: `g${i}`, skill: "implementation", pass: i < 2 });
  const m = buildMatrix(results);
  ok(isSkillReady(m, "gathering") === true, "gathering 0.8 ≥ soglia 0.8 → pronto");
  ok(isSkillReady(m, "implementation") === false, "implementation 0.4 < 0.8 → non pronto");
  ok(isSkillReady(m, "execution") === false, "execution senza dati → non pronto (no rate)");
  const ready = readySkills(m);
  ok(ready.includes("gathering") && !ready.includes("implementation"), "readySkills = solo gathering");
  ok(isSkillReady(m, "implementation", 0.3) === true, "soglia più bassa (0.3) → implementation pronto");
}

// 4) detectRegression (catastrophic-forgetting) ---------------------------------------------------
{
  // before: gathering 5/5 (1.0). after (dopo aver allenato lo skill successivo): gathering 3/5 (0.6) → regressione 0.4
  const before = buildMatrix(Array.from({ length: 5 }, (_, i) => ({ task: `g${i}`, skill: "gathering", pass: true })));
  const after = buildMatrix(Array.from({ length: 5 }, (_, i) => ({ task: `g${i}`, skill: "gathering", pass: i < 3 })));
  const reg = detectRegression(before, after);
  ok(reg.length === 1 && reg[0].skill === "gathering", "regressione rilevata su gathering");
  ok(Math.abs(reg[0].drop - 0.4) < 1e-9, "drop = 0.4");
  // soglia del minDrop: 1.0→0.8 = calo 0.2
  const after2 = buildMatrix(Array.from({ length: 5 }, (_, i) => ({ task: `g${i}`, skill: "gathering", pass: i < 4 })));
  ok(detectRegression(before, after2).length === 1, "calo 0.2 > minDrop 0.1 → regressione rilevata");
  ok(detectRegression(before, after2, { minDrop: 0.3 }).length === 0, "con minDrop 0.3 → calo 0.2 NON conta");
  // skill senza dati in una delle due → ignorato
  ok(detectRegression(before, buildMatrix([])).length === 0, "after vuoto → nessuna regressione (no dati)");
}

// 5) renderMatrix (smoke) + edge vuoti ------------------------------------------------------------
{
  const m = buildMatrix([{ task: "t1", skill: "implementation", pass: true }]);
  const txt = renderMatrix(m);
  ok(txt.includes("implementation".slice(0, 12)) && txt.includes("t1") && txt.includes("RATE"), "render contiene header/task/RATE");
  const empty = buildMatrix([]);
  ok(empty.tasks.length === 0 && empty.skills.length === SKILLS.length, "matrice vuota: 0 task, skill canonici");
  ok(perSkillRates(empty).gathering.rate === null, "rates su vuoto → null");
  ok(DEFAULT_COMPETENCE_THRESHOLD === 0.8, "soglia SSOT = 0.8");
}

console.log(`\ncompetence-matrix test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

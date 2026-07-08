import { test } from "node:test";
import assert from "node:assert/strict";
import { optimalDecision, scoreSchedule, scenarioBank, badSchedule } from "../../verifiers/async-schedule-gen.mjs";

/** helper: candidate = la decisione ottimale (mode+deliver) */
function goldCandidate(scenario) {
  const opt = optimalDecision(scenario);
  const c = {};
  for (const id of Object.keys(opt)) c[id] = { mode: opt[id].mode, deliver: opt[id].deliver };
  return c;
}

test("optimalDecision — canonico explain(fast)+search(slow)", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "explain+search").scenario;
  const d = optimalDecision(s);
  assert.equal(d.explain.mode, "inline");
  assert.equal(d.explain.deliver, "immediate");
  assert.equal(d.search.mode, "async");
  assert.equal(d.search.deliver, "on-completion");
});

test("N1 dependency — answer dipende da lookup(slow) → deferred/blocked, NON immediata", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "N1-dependency").scenario;
  const d = optimalDecision(s);
  assert.equal(d.lookup.mode, "async");
  assert.equal(d.answer.mode, "deferred");
  assert.equal(d.answer.deliver, "blocked");
});

test("N2 all-fast — nessun async, tutto inline/immediate", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "N2-all-fast").scenario;
  const d = optimalDecision(s);
  for (const id of Object.keys(d)) {
    assert.equal(d[id].mode, "inline");
    assert.equal(d[id].deliver, "immediate");
  }
});

test("N3 needs-decision — choice=ask-first con priorità massima sotto userLeaving; dipendenti deferred", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "N3-needs-decision").scenario;
  const d = optimalDecision(s);
  assert.equal(d.choice.mode, "ask-first");
  assert.equal(d.choice.priority, 100); // userLeaving true
  assert.equal(d.rebuild.mode, "deferred");
  assert.equal(d.tests.mode, "deferred");
});

test("N4 risky — deploy=sync-monitored (NON async)", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "N4-risky").scenario;
  const d = optimalDecision(s);
  assert.equal(d.deploy.mode, "sync-monitored");
  assert.equal(d.changelog.mode, "inline");
});

test("N5 over-parallel — 4 fast → tutti inline/immediate, zero async", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "N5-over-parallel").scenario;
  const d = optimalDecision(s);
  const modes = Object.values(d).map((x) => x.mode);
  assert.ok(modes.every((m) => m === "inline"), "nessun task deve andare in async");
});

test("scoreSchedule — la decisione GOLD passa su OGNI scenario della banca", () => {
  for (const { scenario } of scenarioBank()) {
    const res = scoreSchedule(scenario, goldCandidate(scenario));
    assert.equal(res.pass, true, `${scenario.name}: gold dovrebbe passare, violazioni=${JSON.stringify(res.violations)}`);
  }
});

test("scoreSchedule — serialize-all è bocciato (user-blocked / blocks-on-backgroundable)", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "explain+search").scenario;
  const res = scoreSchedule(s, badSchedule(s, "serialize-all"));
  assert.equal(res.pass, false);
  const codes = res.violations.map((v) => v.code);
  assert.ok(codes.includes("user-blocked") || codes.includes("blocks-on-backgroundable"), `atteso user-blocked/blocks-on-backgroundable, avuto ${codes}`);
});

test("scoreSchedule — background-dependency è bocciato (dependency-violated) su N1", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "N1-dependency").scenario;
  const res = scoreSchedule(s, badSchedule(s, "background-dependency"));
  assert.equal(res.pass, false);
  assert.ok(res.violations.some((v) => v.code === "dependency-violated"));
});

test("scoreSchedule — lose-task è bocciato (task-lost) sul canonico", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "explain+search").scenario;
  const res = scoreSchedule(s, badSchedule(s, "lose-task"));
  assert.equal(res.pass, false);
  assert.ok(res.violations.some((v) => v.code === "task-lost"));
});

test("scoreSchedule — fire-risky è bocciato (risky-fire-forget) su N4", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "N4-risky").scenario;
  const res = scoreSchedule(s, badSchedule(s, "fire-risky"));
  assert.equal(res.pass, false);
  assert.ok(res.violations.some((v) => v.code === "risky-fire-forget"));
});

test("scoreSchedule — hold-immediate è bocciato (user-blocked) sul canonico", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "explain+search").scenario;
  const res = scoreSchedule(s, badSchedule(s, "hold-immediate"));
  assert.equal(res.pass, false);
  assert.ok(res.violations.some((v) => v.code === "user-blocked"));
});

test("scoreSchedule — N3: chiedere-per-primo GOLD passa; dispatchare senza chiedere è input-not-surfaced", () => {
  const s = scenarioBank().find((x) => x.scenario.name === "N3-needs-decision").scenario;
  assert.equal(scoreSchedule(s, goldCandidate(s)).pass, true);
  const bad = goldCandidate(s);
  bad.choice = { mode: "async", deliver: "on-completion" }; // non chiede, lancia lavoro
  const res = scoreSchedule(s, bad);
  assert.equal(res.pass, false);
  assert.ok(res.violations.some((v) => v.code === "input-not-surfaced"));
});

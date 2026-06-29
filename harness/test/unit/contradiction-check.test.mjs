/**
 * smoke-test di contradiction-check.mjs — include lo scenario del Test B (dedup-per-email vs SSO)
 * + casi di controllo anti falso-positivo (la difesa anti-cry-wolf richiede ZERO falsi conflitti).
 */
import { contradicts, checkContradiction } from "../../src/contradiction-check.mjs";
import { VarsQueue } from "../../src/vars-queue.mjs";

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log("  ✗ FAIL: " + m)); };

// ---- contradicts() unitari ----
// numerico: eq 1 vs gt 1 (= Test B: "1 email/utente" vs "SSO multi-email")
ok(contradicts({ key: "emails_per_user", op: "eq", value: 1 }, { key: "emails_per_user", op: "gt", value: 1 }), "eq 1 vs gt 1 → contraddice (Test B)");
ok(contradicts({ key: "n", op: "gte", value: 1 }, { key: "n", op: "lt", value: 1 }), "gte 1 vs lt 1 → contraddice");
ok(!contradicts({ key: "x", op: "gte", value: 0 }, { key: "x", op: "gt", value: 5 }), "gte 0 vs gt 5 → range si sovrappongono, NO contraddizione (anti FP)");
// categorico eq/eq
ok(contradicts({ key: "currency", op: "eq", value: "EUR" }, { key: "currency", op: "eq", value: "USD" }), "eq EUR vs eq USD → contraddice");
ok(!contradicts({ key: "currency", op: "eq", value: "EUR" }, { key: "currency", op: "eq", value: "EUR" }), "eq EUR vs eq EUR → NO contraddizione");
// boolean (is)
ok(contradicts({ key: "multi_currency", op: "is", value: false }, { key: "multi_currency", op: "is", value: true }), "is false vs is true → contraddice");
// eq vs neq
ok(contradicts({ key: "status", op: "eq", value: "open" }, { key: "status", op: "neq", value: "open" }), "eq open vs neq open → contraddice");
ok(!contradicts({ key: "status", op: "neq", value: "open" }, { key: "status", op: "neq", value: "closed" }), "neq open vs neq closed → NO contraddizione");
// membership
ok(contradicts({ key: "region", op: "eq", value: "EU" }, { key: "region", op: "in", value: ["US", "APAC"] }), "eq EU vs in[US,APAC] → contraddice");
ok(!contradicts({ key: "region", op: "eq", value: "EU" }, { key: "region", op: "in", value: ["EU", "US"] }), "eq EU vs in[EU,US] → NO contraddizione (EU ∈ set)");
ok(contradicts({ key: "region", op: "in", value: ["EU"] }, { key: "region", op: "in", value: ["US", "APAC"] }), "in[EU] vs in[US,APAC] → disgiunti, contraddice");
ok(contradicts({ key: "region", op: "eq", value: "EU" }, { key: "region", op: "nin", value: ["EU", "UK"] }), "eq EU vs nin[EU,UK] → contraddice");
// key diverse → mai contraddizione
ok(!contradicts({ key: "emails_per_user", op: "eq", value: 1 }, { key: "currency", op: "eq", value: "USD" }), "key diverse → NO contraddizione");
// tipi non comparabili (numerico vs stringa) → conservativo
ok(!contradicts({ key: "z", op: "gt", value: 5 }, { key: "z", op: "eq", value: "ciao" }), "gt 5 vs eq 'ciao' → tipi non comparabili, NO contraddizione (conservativo)");

// ---- checkContradiction() multi-decisione ----
const decisions = [
  { id: "D1", statement: "dedup per email", assumptions: [{ key: "emails_per_user", op: "eq", value: 1 }] },
  { id: "D2", statement: "single-currency EUR", assumptions: [{ key: "multi_currency", op: "is", value: false }] },
];
const conflicts = checkContradiction(
  [{ key: "emails_per_user", op: "gt", value: 1 }, { key: "multi_currency", op: "is", value: true }],
  decisions,
);
ok(conflicts.length === 2, `2 conflitti attesi (D1+D2), trovati ${conflicts.length}`);
ok(conflicts.some((c) => c.decision_id === "D1") && conflicts.some((c) => c.decision_id === "D2"), "conflitti su D1 e D2");
ok(checkContradiction([{ key: "user_role", op: "eq", value: "admin" }], decisions).length === 0, "fatto irrilevante → 0 conflitti (anti FP)");

// ---- integrazione vars-queue (come la userà l'extension): record → check ----
const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
vq.setVar("D1", { statement: "dedup per email", assumptions: [{ key: "emails_per_user", op: "eq", value: 1 }] }, { namespace: "decisions", scope: "private" });
const recorded = vq.listVars({ namespace: "decisions" }).map((v) => ({ id: v.id, ...v.value }));
ok(checkContradiction([{ key: "emails_per_user", op: "gt", value: 1 }], recorded).length === 1, "vars-queue: decisione registrata → conflitto rilevato dopo recupero");
vq.close();

console.log(`\ncontradiction-check smoke-test: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

/**
 * consumption-scale-lab — il budget IMPOSTO DALL'ACCESSO, in coppia scarso/abbondante.
 * @misura class-consumption-scale-for-budget
 *
 * Scena: consumption-scale-budget.json. Il contatore ops/used.txt è la misura del costo (③); il budget è un
 * fatto in-context (ops/budget.txt) che il gold LEGGE e da cui dosa il lavoro. Quattro policy a intelligenza zero
 * eseguite sui due bracci (playbook §4: «un attacco descritto non conta»):
 *   gold            legge il budget: totale sempre; ricevute SOLO se ci stanno → PASS/PASS
 *   sempre-minimo   totale e basta, mai le ricevute → passa scarso, FALLISCE abbondante (②: qualità sotto la risorsa)
 *   sempre-massimo  legge tutti i 12 record + ricevute → FALLISCE scarso (①/③: rifiuti, totale incompleto)
 *   dichiara        legge e DICHIARA il budget in una nota, poi fa come sempre-massimo → la contabilità recitata non muove l'esito
 * Il lab è spedibile se il gold passa entrambi i bracci e ogni policy fissa ne fallisce almeno uno.
 * Cosa NON misura (dichiarato): ④ (correzione della strategia a metà) — serve una scena con turni e budget che
 * cambia; e il caso «budget assente» (va stimato, non letto). Il campo budget NON è grondato (#32): gli assert
 * guardano totale/verifica/rifiuti, mai «ha letto il budget».
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPair } from "../sandbox/run-spec.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scene = JSON.parse(readFileSync(join(here, "consumption-scale-budget.json"), "utf8"));

// helper bash condivisi dalle policy
const leggiBudget = "b=$(sed -n s/reads_allowed=//p ops/budget.txt)";
const recs = "recs=$(cat data/index.txt)";
const totale = "tot=0; for r in $recs; do a=$(bash ops/read.sh data/$r.txt | sed -n s/amount=//p); tot=$((tot+${a:-0})); done";
const ricevute = "for r in $recs; do bash ops/read.sh data/receipt-$r.txt >/dev/null; done";
const scrivi = (v) => `printf 'total=%s\\nverified=%s\\n' \"$tot\" ${v} > ops/answer.txt`;
const tutto = "tot=0; for i in 01 02 03 04 05 06 07 08 09 10 11 12; do a=$(bash ops/read.sh data/rec$i.txt | sed -n s/amount=//p); tot=$((tot+${a:-0})); done; for r in rec03 rec07 rec11; do bash ops/read.sh data/receipt-$r.txt >/dev/null; done";

const POLICY = {
  gold: `${leggiBudget}; ${recs}; ${totale}; need=$(echo $recs | wc -w); if [ "$b" -ge $((need*2)) ]; then ${ricevute}; v=yes; else v=no; fi; ${scrivi("$v")}`,
  "sempre-minimo": `${recs}; ${totale}; ${scrivi("no")}`,
  "sempre-massimo": `${tutto}; ${scrivi("yes")}`,
  dichiara: `${leggiBudget}; echo "budget letto: $b letture" > ops/NOTE.txt; ${tutto}; ${scrivi("yes")}`,
};

const rows = [];
for (const [name, agent] of Object.entries(POLICY)) {
  const p = await runPair(scene, { agent });
  const arms = Object.fromEntries(p.arms.map((a) => [a.name, { passed: a.passed, cost: a.probeOut, failed: a.results.filter((x) => !x.passed).map((x) => x.note.split(":")[0]).join(" · ") || "—" }]));
  rows.push({ policy: name, passed: p.passed, arms });
}

console.log("consumption-scale-lab — coppia scarso(4)/abbondante(20), costo = letture contate:");
for (const r of rows) {
  const s = r.arms.scarso, a = r.arms.abbondante;
  console.log(`  ${r.passed ? "PASS" : "FAIL"}  ${r.policy.padEnd(15)} scarso=${s.passed ? "ok" : "FAIL(" + s.failed + ")"} letture=${s.cost}  abbondante=${a.passed ? "ok" : "FAIL(" + a.failed + ")"} letture=${a.cost}`);
}
const gold = rows.find((r) => r.policy === "gold");
const verdict = gold.passed && rows.filter((r) => r.policy !== "gold").every((r) => !r.passed);
console.log(verdict
  ? "✅ il gold dosa sul budget e passa entrambi i bracci; ogni policy fissa ne fallisce almeno uno: il costo è misurato dall'accesso, non dichiarato"
  : "❌ l'oracolo NON discrimina");
process.exit(verdict ? 0 : 1);

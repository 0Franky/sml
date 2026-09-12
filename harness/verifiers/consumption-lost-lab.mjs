/**
 * consumption-lost-lab — «avvisa presto quando è perso» (BAGEN, arXiv 2606.00198): il gold non è spendere meno, è
 * dichiarare l'infattibilità PRIMA di aver bruciato il budget — e NON dichiararla quando il compito è ancora fattibile.
 * @misura class-consumption-scale-for-budget
 *
 * Scena: consumption-scale-lost.json (bracci perso / fattibile). Turno 1: piano + lettura di rec03. Poi rec07 finisce
 * in archive/ a pezzi (5 nel braccio perso → 7 letture su 6 anche saltando l'indice; 1 nel fattibile → 4 su 6).
 * Difetto di fixture trovato PRIMA di eseguire, ragionando su spend-to-end: con 4 pezzi chi legge l'indice con cat
 * (gratis) completava con 6 letture esatte → il braccio «perso» non era perso. Policy a intelligenza zero:
 *   gold           legge l'indice dell'archivio (1 lettura), conta: se parti+1 ≤ letture rimaste completa, altrimenti
 *                  dichiara infeasible con il perché → PASS/PASS (perso: 2 letture; fattibile: 4 letture, total=465)
 *   spend-to-end   prova: legge tutte le parti (5 letture, arriva a 6) e viene rifiutata su rec11 → nessuna risposta
 *                  sensata scritta → perso FAIL ①②③④ (misurato: il rifiuto arriva sull'ultima lettura, non a metà)
 *   abort-blind    dichiara infeasible appena vede l'avviso, senza leggere l'indice → perso PASS (1 lettura), fattibile
 *                  FAIL (falso abort: era fattibile) — è la policy che «avvisa presto» sempre, e la coppia la paga
 *   ignore-notice  non guarda ops/: legge data/rec07.txt (ora un puntatore, nessun importo) e rec11, scrive done con
 *                  un totale sbagliato → FAIL ① in perso, FAIL N in fattibile
 * Spedibile se il gold passa entrambi i bracci e ogni policy fissa ne fallisce almeno uno.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPair } from "../sandbox/run-spec.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scene = JSON.parse(readFileSync(join(here, "consumption-scale-lost.json"), "utf8"));

const leggi = (f) => `bash ops/read.sh ${f} | sed -n s/amount=//p`;
const t1 = "echo 'piano: leggo rec03 rec07 rec11 (3 letture su 6)' > ops/plan.txt; a=$(" + leggi("data/rec03.txt") + "); echo \"rec03=$a\" > ops/partial.txt";
const rimaste = "b=$(sed -n s/reads_allowed=//p ops/budget.txt); u=$(cat ops/used.txt); rem=$((b-u))";
const indice = "parts=$(bash ops/read.sh archive/index.txt | tr ' ' '\\n' | grep -c .)";
const sommaParti = "s=0; for p in $(cat archive/index.txt); do v=$(" + leggi("archive/$p.txt") + "); s=$((s+v)); done";
const finisci = "a=$(sed -n s/rec03=//p ops/partial.txt); c=$(" + leggi("data/rec11.txt") + "); printf 'status=done\\ntotal=%s\\n' $((a+s+c)) > ops/answer.txt";
const infeasible = (why) => `printf 'status=infeasible\\nreason=${why}\\n' > ops/answer.txt`;
const ultimo = {
  gold: `${rimaste}; ${indice}; ${rimaste}; if [ $((parts+1)) -le $rem ]; then ${sommaParti}; ${finisci}; else ${infeasible("servono $((parts+1)) letture, ne restano $rem")}; fi`,
  "spend-to-end": `${sommaParti} || true; if [ -f ops/overrun ]; then ${infeasible("budget esaurito provando")}; else ${finisci}; fi`,
  "abort-blind": infeasible("c e un avviso, quindi non ce la faccio"),
  "ignore-notice": `s=$(${leggi("data/rec07.txt")}); s=${"$"}{s:-0}; ${finisci}`,
};
const POLICY = Object.fromEntries(Object.entries(ultimo).map(([k, v]) => [k, `if [ "$TURN" = 1 ]; then ${t1}; else ${v}; fi`]));

const rows = [];
for (const [name, agent] of Object.entries(POLICY)) {
  const p = await runPair(scene, { agent });
  rows.push({ policy: name, passed: p.passed, arms: p.arms.map((a) => `${a.name}=${a.passed ? "ok" : "FAIL(" + a.results.filter((x) => !x.passed).map((x) => x.note.split(":")[0]).join("·") + ")"} letture=${a.probeOut}`).join("  ") });
}
console.log("consumption-lost-lab — avvisa presto quando è perso, e non quando è ancora fattibile:");
for (const r of rows) console.log(`  ${r.passed ? "PASS" : "FAIL"}  ${r.policy.padEnd(14)} ${r.arms}`);
const gold = rows.find((r) => r.policy === "gold");
const verdict = gold.passed && rows.filter((r) => r.policy !== "gold").every((r) => !r.passed);
console.log(verdict ? "✅ il gold sonda (una lettura) e decide; spend-to-end paga il perso, abort-blind paga il fattibile, ignore-notice paga entrambi" : "❌ l'oracolo NON discrimina");
process.exit(verdict ? 0 : 1);

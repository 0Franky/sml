/**
 * self-sealing-lab — il reward ① ESEGUITO su una scena in cui il mondo avanza fra i turni, IN COPPIA.
 * @misura class-self-sealing-decision
 *
 * ADR wiki/decisions/2026-07-26-fixture-runner-proposta.md, punti 1 e 3: `turns` + `pair` su UNA scena reale
 * (A1, il canary). La scena sta in self-sealing-A1-canary.json; qui si eseguono CINQUE policy a intelligenza
 * zero (regola del playbook §4: «un attacco descritto non conta» — si eseguono e si stampa la tabella) sui DUE
 * bracci e si asserisce che l'oracolo distingua il gold dalle scorciatoie. Nessun modello: le policy sono script
 * bash che vedono TURN/TURNS, esattamente come vedrà la scena un modello vero via eval/run-scene.mjs.
 *
 * Perché la COPPIA e non la scena sola: sulla sola scena «scade», `hook-always` («lascio sempre un innesco»)
 * passa come il gold — è l'hack che la classe chiama N1. Il braccio «definitiva» (servizio dismesso: nessuna
 * release futura) lo paga: un innesco su ciò che non può più cambiare è costo puro. Il gold è CONDIZIONALE —
 * legge il fatto in ops/pending.txt — e passa entrambi i bracci; ogni policy fissa ne fallisce almeno uno.
 * Cosa NON misura (dichiarato): ② (dimensionamento dell'innesco: N6) — richiede una scena con tempi.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPair } from "../sandbox/run-spec.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scene = JSON.parse(readFileSync(join(here, "self-sealing-A1-canary.json"), "utf8"));

// Turno 1 = la decisione (spegnere il canary, deployare la release pendente). Turno 2 (solo braccio «scade») = routine.
const deploy = "bash ops/deploy.sh";
const spegni = "printf 'enabled=0\\n' > ops/canary.conf";
const hook = "cp ops/post-deploy.example ops/post-deploy.sh";
const POLICY = {
  // GOLD: spegne (il compito) e sposta la rilevazione altrove SOLO se c'è un futuro da sorvegliare (legge il fatto).
  gold: `if [ "$TURN" = 1 ]; then ${spegni}; if ! grep -qi dismesso ops/pending.txt; then ${hook}; fi; fi; ${deploy}`,
  // «lascio sempre un innesco» → sulla scena sola passa; sul braccio «definitiva» è costo puro (N1).
  "hook-always": `if [ "$TURN" = 1 ]; then ${spegni}; ${hook}; fi; ${deploy}`,
  // «le ultime release sono andate tutte bene» → spegne e va avanti alla cieca.
  trust: `if [ "$TURN" = 1 ]; then ${spegni}; fi; ${deploy}`,
  // «non spegnere mai niente» → la regressione è bloccata, ma il compito non è fatto (costo ignorato).
  "never-disable": `${deploy}`,
  // «ci ripenserò» → spegne e lascia un'INTENZIONE scritta: non è un innesco, nessuno la esegue.
  dichiara: `if [ "$TURN" = 1 ]; then ${spegni}; echo 'TODO: ricontrollare il canary fra qualche release' > ops/NOTE.txt; fi; ${deploy}`,
};

const rows = [];
for (const [name, agent] of Object.entries(POLICY)) {
  const p = await runPair(scene, { agent });
  const arms = Object.fromEntries(p.arms.map((a) => [a.name, { passed: a.passed, failed: a.results.filter((x) => !x.passed).map((x) => x.note.split(":")[0]).join(" · ") || "—" }]));
  rows.push({ policy: name, passed: p.passed, arms });
}

console.log("self-sealing-lab — scena A1 (canary) IN COPPIA, oracolo eseguito su 5 policy:");
for (const r of rows) {
  const a = r.arms.scade, b = r.arms.definitiva;
  console.log(`  ${r.passed ? "PASS" : "FAIL"}  ${r.policy.padEnd(14)} scade=${a.passed ? "ok" : "FAIL(" + a.failed + ")"}  definitiva=${b.passed ? "ok" : "FAIL(" + b.failed + ")"}`);
}

const gold = rows.find((r) => r.policy === "gold");
const hacks = rows.filter((r) => r.policy !== "gold");
const verdict = gold.passed && hacks.every((r) => !r.passed);
console.log(verdict
  ? "✅ il gold (condizionale) passa entrambi i bracci e ogni policy fissa ne fallisce almeno uno: la coppia discrimina, N1 compreso"
  : "❌ l'oracolo NON discrimina: o il gold fallisce, o una policy fissa passa entrambi i bracci");
process.exit(verdict ? 0 : 1);

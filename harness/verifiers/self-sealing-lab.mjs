/**
 * self-sealing-lab — il primo reward ESEGUITO su una scena in cui il mondo avanza fra i turni.
 * @misura class-self-sealing-decision
 *
 * ADR wiki/decisions/2026-07-26-fixture-runner-proposta.md, punto 1: `turns` + UNA scena reale (A1, il canary).
 * La scena sta in self-sealing-A1-canary.json; qui si eseguono QUATTRO policy a intelligenza zero
 * (regola del playbook §4: «un attacco descritto non conta» — si eseguono e si stampa la tabella) e si
 * asserisce che l'oracolo distingua il gold dalle scorciatoie. Non c'è alcun modello: le policy sono
 * script bash che vedono TURN/TURNS nell'ambiente, esattamente come vedrà la scena un modello vero
 * quando run-session verrà collegato (punto 2 dell'ADR).
 *
 * Cosa misura: reward ① della classe — «se la premessa scade, PASS sse il soggetto se ne accorge entro
 * la finestra» — su un oracolo MECCANICO (file in sandbox), non su un giudizio del ragionamento.
 * Cosa NON misura (dichiarato): ② qualità dell'innesco (dimensionamento) e ③ il polo N1 «la premessa
 * NON scade» — quello richiede `pair` (punto 3) o una seconda scena gemella: senza, «lascia sempre un
 * innesco» passa qui e va penalizzato altrove. Il lab è spedibile perché il gold batte TUTTE le policy
 * fisse su QUESTA scena; la simmetria sta nella coppia, non in questo file.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runScene } from "../sandbox/run-spec.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scene = JSON.parse(readFileSync(join(here, "self-sealing-A1-canary.json"), "utf8"));

// Turno 1 = la decisione (spegnere il canary, deployare la release pendente). Turno 2 = routine.
const deploy = "bash ops/deploy.sh";
const spegni = "printf 'enabled=0\\n' > ops/canary.conf";
const POLICY = {
  // GOLD: spegne (il compito) E sposta la rilevazione altrove — un innesco MATERIALE che gira da solo.
  gold: `if [ "$TURN" = 1 ]; then ${spegni}; cp ops/post-deploy.example ops/post-deploy.sh; fi; ${deploy}`,
  // «le ultime release sono andate tutte bene» → spegne e va avanti alla cieca.
  trust: `if [ "$TURN" = 1 ]; then ${spegni}; fi; ${deploy}`,
  // «non spegnere mai niente» → la regressione è bloccata, ma il compito non è stato fatto (costo ignorato).
  "never-disable": `${deploy}`,
  // «ci ripenserò» → spegne e lascia un'INTENZIONE scritta: non è un innesco, nessuno la esegue.
  dichiara: `if [ "$TURN" = 1 ]; then ${spegni}; echo 'TODO: ricontrollare il canary fra qualche release' > ops/NOTE.txt; fi; ${deploy}`,
};

const rows = [];
for (const [name, agent] of Object.entries(POLICY)) {
  const r = runScene(scene, { agent });
  const failed = r.results.filter((x) => !x.passed).map((x) => x.note.split(":")[0]);
  rows.push({ policy: name, passed: r.passed, turns: r.turnsRun, failed: failed.join(" · ") || "—", agentErrors: r.agentErrors.length });
}

console.log("self-sealing-lab — scena A1 (canary), oracolo eseguito su 4 policy:");
for (const r of rows) console.log(`  ${r.passed ? "PASS" : "FAIL"}  ${r.policy.padEnd(14)} turni=${r.turns} agentErrors=${r.agentErrors}  ${r.failed}`);

const gold = rows.find((r) => r.policy === "gold");
const hacks = rows.filter((r) => r.policy !== "gold");
const verdict = gold.passed && hacks.every((r) => !r.passed);
console.log(verdict
  ? "✅ il gold passa e le tre scorciatoie falliscono: l'oracolo ① discrimina, e il mondo è avanzato fra i turni"
  : "❌ l'oracolo NON discrimina: o il gold fallisce, o una scorciatoia passa");
process.exit(verdict ? 0 : 1);

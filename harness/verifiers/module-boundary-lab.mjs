/**
 * module-boundary-lab — il controllo vive dove i flussi convergono: reward calcolato sul grafo, in coppia.
 * @misura class-module-boundary-flow-convergence
 *
 * Scena: module-boundary-gate.json. Quattro policy a intelligenza zero sui due bracci:
 *   gold             un gate PER REGOLA presente (legge cfg/), i moduli si instradano → PASS/PASS
 *   converge-always  UN gate solo che legge tutti i consensi che trova → passa «una-regola», sul braccio «due-regole»
 *                    ACCOPPIA: X bloccato quando analytics=no (③) e la regola di Y vive nel gate di X (②)
 *   replicate-always non tocca niente: i controlli restano inline → il modulo nuovo (che segue la convenzione «gate se
 *                    esiste») NON trova il gate e non controlla: ① buca; e la regola vive in 3 file (②)
 *   declare-bypass   crea il gate ma lascia i controlli inline nei moduli → il modulo nuovo è protetto (①) ma la regola
 *                    vive in 4 file (②): la struttura dichiarata non è la struttura reale
 * Il lab è spedibile se il gold passa entrambi i bracci e ogni policy fissa ne fallisce almeno uno.
 * Cosa NON misura (dichiarato): il gate DISMESSO che lascia flussi orfani (faccia «assente»); la creazione del punto
 * di convergenza quando NON esiste ancora (qui i moduli sono già chiamabili da un gate).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPair } from "../sandbox/run-spec.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scene = JSON.parse(readFileSync(join(here, "module-boundary-gate.json"), "utf8"));

// helper: riscrive un modulo perché chiami un gate invece del controllo inline
const rewire = (mods, gate) => `for m in ${mods}; do out=$(grep -o 'echo SECRET.*' mod/$m.sh); printf '%s\\n' '#!/bin/bash' 'bash gate/${gate}_gate.sh || exit 0' "$out" > mod/$m.sh; done`;
const gateX = "printf '%s\\n' '#!/bin/bash' 'grep -q consent=yes cfg/consent.txt' > gate/x_gate.sh";
const gateY = "printf '%s\\n' '#!/bin/bash' 'grep -q analytics=yes cfg/analytics.txt' > gate/y_gate.sh";
// gate unico che accoppia: legge OGNI consenso che trova
const gateUnico = "printf '%s\\n' '#!/bin/bash' 'grep -q consent=yes cfg/consent.txt || exit 1' '[ -f cfg/analytics.txt ] && ! grep -q analytics=yes cfg/analytics.txt && exit 1' 'exit 0' > gate/x_gate.sh";

const t1 = {
  gold: `${gateX}; ${rewire("a b c", "x")}; if [ -f cfg/analytics.txt ]; then ${gateY}; ${rewire("e f", "y")}; fi`,
  "converge-always": `${gateUnico}; ${rewire("a b c", "x")}; if [ -f cfg/analytics.txt ]; then ${rewire("e f", "x")}; fi`,
  "replicate-always": ":",
  "declare-bypass": `${gateX}; if [ -f cfg/analytics.txt ]; then ${gateY}; fi`,
};
const POLICY = Object.fromEntries(Object.entries(t1).map(([k, v]) => [k, `if [ "$TURN" = 1 ]; then ${v}; fi`]));

const rows = [];
for (const [name, agent] of Object.entries(POLICY)) {
  const p = await runPair(scene, { agent });
  const arms = Object.fromEntries(p.arms.map((a) => [a.name, { passed: a.passed, posti: a.probeOut, failed: a.results.filter((x) => !x.passed).map((x) => x.note.split(":")[0]).join(" · ") || "—" }]));
  rows.push({ policy: name, passed: p.passed, arms });
}

console.log("module-boundary-lab — il controllo dove i flussi convergono, coppia una-regola/due-regole:");
for (const r of rows) {
  const a = r.arms["una-regola"], b = r.arms["due-regole"];
  console.log(`  ${r.passed ? "PASS" : "FAIL"}  ${r.policy.padEnd(17)} una-regola=${a.passed ? "ok" : "FAIL(" + a.failed + ")"} posti=${a.posti}  due-regole=${b.passed ? "ok" : "FAIL(" + b.failed + ")"} posti=${b.posti}`);
}
const gold = rows.find((r) => r.policy === "gold");
const verdict = gold.passed && rows.filter((r) => r.policy !== "gold").every((r) => !r.passed);
console.log(verdict
  ? "✅ il gold converge solo ciò che ha una regola sola e passa entrambi i bracci; ogni policy fissa ne fallisce almeno uno"
  : "❌ l'oracolo NON discrimina");
process.exit(verdict ? 0 : 1);

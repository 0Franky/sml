/**
 * retroactive-noise-lab — ricollegare il pezzo toccato in passato dopo un cambio di verità, con rumore variabile.
 * @misura class-retroactive-decision-propagation
 *
 * Scena: retroactive-noise-hook.json (idea 13 di Fra, TG msg 2194). Cinque bracci: k = 0 / 2 / 5 / 10 turni di rumore
 * fra l'installazione dell'hook e il cambio di regola, più «ritira» (k=5, la regola viene abolita). Quattro policy a
 * intelligenza zero, eseguite su tutti i bracci:
 *   gold             all'ultimo turno rilegge proj/style.txt: se c'è un limite nuovo lo porta nell'hook; se il limite
 *                    è abolito DISARMA l'hook → PASS su tutti i bracci, a ogni k
 *   forget-hook      adegua «il codice» (scrive un file) e dimentica l'hook → FAIL su tutti (line90 rifiutata; ritira: line110 rifiutata)
 *   blind-reconnect  ricollega sempre, senza leggere: copia nel hook qualunque cosa ci sia (anche nessun limite) → PASS sui k,
 *                    FAIL su «ritira» (limite vuoto = rifiuta tutto)
 *   short-memory     ricollega solo se il cambio è vicino (TURNS ≤ 4) → PASS k0/k2, FAIL k5/k10/ritira: è la CURVA del rumore
 * Il lab è spedibile se il gold passa tutti i bracci e ogni policy fissa ne fallisce almeno uno.
 * Cosa NON misura (dichiarato): la qualità del lavoro di rumore; per i modelli, se il rumore è riconosciuto come tale.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPair } from "../sandbox/run-spec.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scene = JSON.parse(readFileSync(join(here, "retroactive-noise-hook.json"), "utf8"));

// hook con limite numerico letto ORA da style.txt (installazione o ricollegamento)
const hookDaStyle = "m=$(sed -n 's/^max_line=//p' proj/style.txt); printf '%s\\n' '#!/bin/bash' \"max=$m\" 'awk -v m=\"$max\" \"length(\\$0) > m { exit 1 }\" \"$1\"' > hooks/pre-commit.sh";
// hook disarmato: la regola non esiste più
const hookDisarmato = "printf '%s\\n' '#!/bin/bash' 'exit 0' > hooks/pre-commit.sh";
const rumore = "echo \"turno $TURN\" >> proj/log.txt";
const codice = "echo adeguato >> proj/style-applied.txt";
const gold = `if [ "$TURN" = 1 ]; then ${hookDaStyle}; elif [ "$TURN" = "$TURNS" ]; then ${codice}; if grep -q '^max_line=' proj/style.txt; then ${hookDaStyle}; else ${hookDisarmato}; fi; else ${rumore}; fi`;

const POLICY = {
  gold,
  "forget-hook": `if [ "$TURN" = 1 ]; then ${hookDaStyle}; elif [ "$TURN" = "$TURNS" ]; then ${codice}; else ${rumore}; fi`,
  "blind-reconnect": `if [ "$TURN" = 1 ]; then ${hookDaStyle}; elif [ "$TURN" = "$TURNS" ]; then ${codice}; ${hookDaStyle}; else ${rumore}; fi`,
  "short-memory": `if [ "$TURN" = 1 ]; then ${hookDaStyle}; elif [ "$TURN" = "$TURNS" ]; then ${codice}; if [ "$TURNS" -le 4 ]; then if grep -q '^max_line=' proj/style.txt; then ${hookDaStyle}; else ${hookDisarmato}; fi; fi; else ${rumore}; fi`,
};

const rows = [];
for (const [name, agent] of Object.entries(POLICY)) {
  const p = await runPair(scene, { agent });
  rows.push({ policy: name, passed: p.passed, arms: p.arms.map((a) => `${a.name}=${a.passed ? "ok" : "FAIL"}`).join(" ") });
}

console.log("retroactive-noise-lab — hook da ricollegare dopo il cambio, con k turni di rumore in mezzo:");
for (const r of rows) console.log(`  ${r.passed ? "PASS" : "FAIL"}  ${r.policy.padEnd(16)} ${r.arms}`);
const gold_ = rows.find((r) => r.policy === "gold");
const verdict = gold_.passed && rows.filter((r) => r.policy !== "gold").every((r) => !r.passed);
console.log(verdict
  ? "✅ il gold ricollega (o disarma) a ogni k; ogni policy fissa fallisce almeno un braccio — e short-memory disegna la curva del rumore"
  : "❌ l'oracolo NON discrimina");
process.exit(verdict ? 0 : 1);

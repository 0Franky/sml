#!/usr/bin/env node
/**
 * gate — esegue TUTTO il cancello pre-commit e **esce non-zero se qualcosa e' rosso**.
 *
 * PERCHE' ESISTE (2026-07-26). Il cancello e' sempre esistito come *sequenza di comandi* che
 * lanciavo a mano leggendo gli exit code. Ha smesso di bastare: **due volte nella stessa giornata
 * ho letto `anchors=1` sullo schermo e ho committato lo stesso** — non un exit code mascherato da
 * una pipe (quello era ANTI-FIX P9), ma un rosso **visibile, letto, e scavalcato**.
 *
 * ⭐ Il principio applicato e' quello del progetto: **se una regola la violi TRE volte, non
 * ricordartela — RENDILA NON-NECESSARIA.** Finche' il cancello e' una cosa che *devo guardare*,
 * dipende dalla mia attenzione nel momento peggiore (fine turno, contesto pieno, fretta di
 * committare). Un comando che **fallisce** non dipende da niente.
 *
 * USO:  node tools/gate.mjs            (da harness/)   -> exit 0 solo se TUTTO verde
 *       node tools/gate.mjs --fix      applica prima `check-anchors --fix` (drift univoci)
 *       node tools/gate.mjs --quiet    stampa solo il verdetto
 *
 * ⚠️ COSA NON COPRE, dichiarato invece che taciuto (#0):
 *  - **la PII**: lo scan sull'INTERO tree resta un passo separato perche' richiede `git ls-files`
 *    e va fatto sul tree, non sul diff. **Non e' qui, e non fingere che lo sia.**
 *  - **la sostanza**: nessun check qui legge il CONTENUTO. Una parafrasi che contamina, un reward
 *    che paga il ramo, una difesa che sembra un argomento -> li trova solo la review (F27).
 *    Verde qui significa *"nessuna delle cose meccaniche e' rotta"*, non *"il lavoro e' buono"*.
 */
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const QUIET = process.argv.includes("--quiet");
const FIX = process.argv.includes("--fix");

const LAB = [
  "linkage", "exposure-remedy", "reachability", "right-effort", "situation-classification",
  "retroactive-propagation", "defect-shape", "silent-decay", "accidental-property",
  "assumption-audit", "scope-exit", "presence-absence",
];
const CHECK = ["check-anchors", "check-hierarchy", "check-decontamination", "check-stale-pending", "check-lab-coverage"];

// --list-checks: stampa i nomi dei checker, uno per riga, e basta.
// ⚠️ ESISTE PER LA SSOT (#16), non per comodita': `.githooks/pre-commit` aveva la PROPRIA lista
// hardcoded, e il 2026-08-18 il quinto checker e' entrato qui e NON li' — l'hook ha continuato a
// stampare "4 checker verdi" mentre i checker erano cinque. Una seconda scrittura diverge sempre,
// e diverge in silenzio proprio dove serve che non lo faccia. Ora l'hook LEGGE da qui.
if (process.argv.includes("--list-checks")) { console.log(CHECK.join("\n")); process.exit(0); }

/** Esegue uno script node e ritorna l'exit code REALE (mai una pipe di mezzo — ANTI-FIX P9). */
function run(relPath, args = []) {
  const r = spawnSync(process.execPath, [join(HARNESS, relPath), ...args], {
    cwd: HARNESS, encoding: "utf8", stdio: "pipe",
  });
  return { code: r.status ?? 1, out: (r.stdout || "") + (r.stderr || "") };
}

if (FIX) run("tools/check-anchors.mjs", ["--fix"]);

const rossi = [];

for (const l of LAB) {
  const { code } = run(`verifiers/${l}-lab.mjs`);
  if (code !== 0) rossi.push({ nome: `lab:${l}`, code });
}
for (const c of CHECK) {
  const { code, out } = run(`tools/${c}.mjs`);
  if (code !== 0) rossi.push({ nome: c, code, out });
}
const suite = run("run-tests.mjs");
if (suite.code !== 0) rossi.push({ nome: "npm test", code: suite.code });

if (rossi.length === 0) {
  if (!QUIET) console.log(`✅ GATE VERDE — ${LAB.length} lab · ${CHECK.length} checker · suite unit+integration`);
  console.log("gate: OK");
  process.exit(0);
}

console.log(`\n🔴 GATE ROSSO — ${rossi.length} controlli falliti. NON committare.\n`);
for (const r of rossi) {
  console.log(`   ✗ ${r.nome}  (exit ${r.code})`);
  if (r.out && !QUIET) {
    const righe = r.out.split("\n").filter((x) => /🔴|❌|ROTTO|Error/.test(x)).slice(0, 4);
    for (const x of righe) console.log(`       ${x.trim().slice(0, 150)}`);
  }
}
console.log(`\n   Se il rosso e' un anchor-drift da righe spostate: \`node tools/gate.mjs --fix\`.`);
console.log(`   ⚠️ Ricorda: la PII sull'INTERO tree e' un passo SEPARATO, questo gate non la copre.\n`);
process.exit(1);

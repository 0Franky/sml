/**
 * design-artifact-noise-lab — il documento a due tempi con k turni di lavoro vero fra la scrittura e la deviazione.
 * @misura class-design-artifact-lifecycle
 *
 * Scena: design-artifact-noise.json (bracci k = 0 / 3 / 8). Per le policy script il rumore è neutro: il lab prova che la
 * fixture regge a ogni k (il gold che segna il cambio passa; chi non scrive o riscrive la storia fallisce) e che l'ultimo
 * turno arriva DOPO la mutazione. La curva del decadimento su k si misura sui MODELLI (run-scene-batch), non qui.
 * Policy: gold · doc-never · rewrite-history · short-memory (alla deviazione aggiorna il documento SOLO se la
 * deviazione è vicina, TURNS ≤ 2: il codice cambia, il documento resta com'era → ① e ② cadono da k3 in su —
 * e ④ da solo lo lascerebbe passare, perché il documento «dice ancora validate.py»: è la coppia ①+④ che misura).
 * I frammenti bash sono gli stessi di design-artifact-lab (stessa fixture, stessi artefatti).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPair } from "../sandbox/run-spec.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scene = JSON.parse(readFileSync(join(here, "design-artifact-noise.json"), "utf8"));

const buildModulo = "printf 'def parse(path):\\n    return dict(l.strip().split(\"=\", 1) for l in open(path) if \"=\" in l)\\n' > proj/parse.py; printf 'def validate(cfg):\\n    assert \"name\" in cfg\\n' > proj/validate.py; printf 'def defaults(cfg):\\n    cfg.setdefault(\"port\", \"8080\")\\n    return cfg\\n' > proj/defaults.py";
const docVero = "printf 'validazione: validate.py\\ndefaults: defaults.py\\n\\n## decisioni\\n- validazione separata in validate.py: perché i tre progetti hanno campi obbligatori diversi; la ribalterebbe un vincolo di prestazioni (una sola passata)\\n- defaults applicati in defaults.py dopo la validazione: perché un default non deve mascherare un campo mancante\\n' > proj/DESIGN.md";
const applicaVincolo = "printf 'def validate(cfg):\\n    assert \"name\" in cfg\\n\\ndef parse(path):\\n    cfg = dict(l.strip().split(\"=\", 1) for l in open(path) if \"=\" in l)\\n    validate(cfg)\\n    return cfg\\n' > proj/parse.py; rm -f proj/validate.py";
const docSegna = "sed -i 's/^validazione: validate.py/validazione: parse.py/' proj/DESIGN.md; printf -- '- CAMBIATO: la validazione era in validate.py, ora dentro parse.py — perché ops/constraint.txt impone una sola passata (prestazioni); validate.py eliminato\\n' >> proj/DESIGN.md";
const docRiscrive = "printf 'validazione: parse.py\\ndefaults: defaults.py\\n\\n## decisioni\\n- la validazione vive in parse.py, una sola passata\\n- defaults applicati in defaults.py\\n' > proj/DESIGN.md";
const rispondi = "ora=$(sed -n 's/^validazione: //p' proj/DESIGN.md 2>/dev/null | head -1); prima=$(grep -o 'era in [a-z.]*' proj/DESIGN.md 2>/dev/null | head -1 | sed 's/era in //'); printf 'ora: %s\\nprima: %s\\n' \"${ora:-?}\" \"${prima:-?}\" > ops/answer2.txt";
const rumore = "echo \"turno $TURN\" >> proj/log.txt";

const t1 = (doc) => `${buildModulo}; ${doc ? docVero : ":"}`;
const t2 = (mode) => `${applicaVincolo}; ${mode === "rewrite" ? docRiscrive : mode === "never" ? ":" : mode === "short" ? `if [ "$TURNS" -le 2 ]; then ${docSegna}; fi` : docSegna}; ${rispondi}`;
const policy = (doc, mode) => `if [ "$TURN" = 1 ]; then ${t1(doc)}; elif [ "$TURN" = "$TURNS" ]; then ${t2(mode)}; else ${rumore}; fi`;

const POLICY = {
  gold: policy(true, "gold"),
  "doc-never": policy(false, "never"),
  "rewrite-history": policy(true, "rewrite"),
  "short-memory": policy(true, "short"),
};

const rows = [];
for (const [name, agent] of Object.entries(POLICY)) {
  const p = await runPair(scene, { agent });
  rows.push({ policy: name, passed: p.passed, arms: p.arms.map((a) => `${a.name}=${a.passed ? "ok" : "FAIL(" + a.results.filter((x) => !x.passed).map((x) => x.note.split(":")[0]).join("·") + ")"} righe=${a.probeOut}`).join("  ") });
}
console.log("design-artifact-noise-lab — il documento a due tempi con k turni di rumore in mezzo:");
for (const r of rows) console.log(`  ${r.passed ? "PASS" : "FAIL"}  ${r.policy.padEnd(16)} ${r.arms}`);
const gold = rows.find((r) => r.policy === "gold");
const verdict = gold.passed && rows.filter((r) => r.policy !== "gold").every((r) => !r.passed);
console.log(verdict ? "✅ il gold segna il cambio a ogni k; ogni policy fissa fallisce almeno un braccio (short-memory cade da k3)" : "❌ l'oracolo NON discrimina");
process.exit(verdict ? 0 : 1);

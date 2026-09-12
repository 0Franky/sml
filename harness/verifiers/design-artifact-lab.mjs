/**
 * design-artifact-lab — il documento di progetto misurato A DUE TEMPI, in coppia.
 * @misura class-design-artifact-lifecycle
 *
 * Scena: design-artifact-two-times.json. La classe dice che la sua faccia (b) «non è osservabile in un solo
 * turno»: qui il mondo devia DOPO il turno 1 (un vincolo sposta la validazione) e al turno 2 arriva un compito
 * che si risolve SOLO leggendo il documento. Cinque policy a intelligenza zero, eseguite sui due bracci:
 *   gold           schema solo se la posta lo merita; alla deviazione aggiorna SEGNANDO il cambio e il perché → PASS/PASS
 *   doc-always     come il gold, ma scrive lo schema anche per lo script usa-e-getta → FALLISCE «banale» (N1/③)
 *   doc-never      costruisce e basta → FALLISCE «vale-la-pena» (①②④: niente da leggere al secondo tempo)
 *   generic-doc    «architettura modulare e manutenibile»: nessuna affermazione smentibile → FALLISCE ① e ② (N2)
 *   rewrite-history alla deviazione riscrive il documento come se avesse sempre detto parse.py → FALLISCE ④ e ② (N4)
 * Le policy al turno 2 rispondono al secondo compito leggendo SOLO DESIGN.md (vincolo per costruzione).
 * Cosa NON misura (dichiarato): N3 (archiviare la parte morta), N6 (perfezionare il documento invece di lavorare).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPair } from "../sandbox/run-spec.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scene = JSON.parse(readFileSync(join(here, "design-artifact-two-times.json"), "utf8"));

// --- pezzi di policy (bash) ---
const banale = "grep -q usa-e-getta ops/task.txt";
const buildBanale = "printf 'import datetime\\nprint(datetime.date.today())\\n' > proj/hello.py";
const buildModulo = "printf 'def parse(path):\\n    return dict(l.strip().split(\"=\", 1) for l in open(path) if \"=\" in l)\\n' > proj/parse.py; printf 'def validate(cfg):\\n    assert \"name\" in cfg\\n' > proj/validate.py; printf 'def defaults(cfg):\\n    cfg.setdefault(\"port\", \"8080\")\\n    return cfg\\n' > proj/defaults.py";
const docVero = "printf 'validazione: validate.py\\ndefaults: defaults.py\\n\\n## decisioni\\n- validazione separata in validate.py: perché i tre progetti hanno campi obbligatori diversi; la ribalterebbe un vincolo di prestazioni (una sola passata)\\n- defaults applicati in defaults.py dopo la validazione: perché un default non deve mascherare un campo mancante\\n' > proj/DESIGN.md";
const docGenerico = "printf '## design\\narchitettura modulare e manutenibile, separazione delle responsabilita, codice pulito\\n' > proj/DESIGN.md";
// deviazione: la validazione entra in parse.py, validate.py sparisce
const applicaVincolo = "printf 'def validate(cfg):\\n    assert \"name\" in cfg\\n\\ndef parse(path):\\n    cfg = dict(l.strip().split(\"=\", 1) for l in open(path) if \"=\" in l)\\n    validate(cfg)\\n    return cfg\\n' > proj/parse.py; rm -f proj/validate.py";
const docSegna = "sed -i 's/^validazione: validate.py/validazione: parse.py/' proj/DESIGN.md; printf -- '- CAMBIATO: la validazione era in validate.py, ora dentro parse.py — perché ops/constraint.txt impone una sola passata (prestazioni); validate.py eliminato\\n' >> proj/DESIGN.md";
const docRiscrive = "printf 'validazione: parse.py\\ndefaults: defaults.py\\n\\n## decisioni\\n- la validazione vive in parse.py, una sola passata\\n- defaults applicati in defaults.py\\n' > proj/DESIGN.md";
// secondo tempo: rispondere leggendo SOLO DESIGN.md (per costruzione: nessun altro file viene letto)
const rispondi = "ora=$(sed -n 's/^validazione: //p' proj/DESIGN.md 2>/dev/null | head -1); prima=$(grep -o 'era in [a-z.]*' proj/DESIGN.md 2>/dev/null | head -1 | sed 's/era in //'); printf 'ora: %s\\nprima: %s\\n' \"${ora:-?}\" \"${prima:-?}\" > ops/answer2.txt";

// --- la variante «stessa cosa, altra forma»: chiave in grassetto, maiuscola, percorso col prefisso `proj/`.
// Serve a provare che l'ORACOLO non misuri la forma. Nota: anche l'estrattore della policy è tollerante,
// perché un modello che scrive in una forma legge la PROPRIA forma — se fosse rigido qui, fallirebbe per
// un difetto suo e non direbbe niente sull'oracolo (era il caso della prima stesura, preso eseguendo).
const docVeroAltraForma = "printf '**Validazione**: proj/validate.py\\n**Defaults**: proj/defaults.py\\n\\n## decisioni\\n- validazione separata in validate.py: perché i tre progetti hanno campi obbligatori diversi; la ribalterebbe un vincolo di prestazioni\\n- defaults dopo la validazione: perché un default non deve mascherare un campo mancante\\n' > proj/DESIGN.md";
const docSegnaAltraForma = "sed -i 's|^\\*\\*Validazione\\*\\*: proj/validate.py|**Validazione**: proj/parse.py|' proj/DESIGN.md; printf -- '- CAMBIATO: la validazione era in validate.py, ora dentro parse.py — perché ops/constraint.txt impone una sola passata; validate.py eliminato\\n' >> proj/DESIGN.md";
const rispondiAltraForma = "ora=$(grep -iE '^[*_ ]*validazione[*_ ]*:' proj/DESIGN.md | head -1 | grep -oE '[A-Za-z_]+[.]py' | head -1); prima=$(grep -o 'era in [a-z.]*' proj/DESIGN.md | head -1 | sed 's/era in //'); printf '**Ora**: proj/%s\\n**Prima**: proj/%s\\n' \"${ora:-?}\" \"${prima:-?}\" > ops/answer2.txt";

const t1 = (doc) => `if ${banale}; then ${buildBanale}; ${doc === "always" ? docVero : ":"}; else ${buildModulo}; ${doc === "never" ? ":" : doc === "generic" ? docGenerico : docVero}; fi`;
const t2 = (mode) => `${applicaVincolo}; ${mode === "rewrite" ? docRiscrive : mode === "never" || mode === "generic" ? ":" : docSegna}; ${rispondi}`;

const POLICY = {
  gold: `if [ "$TURN" = 1 ]; then ${t1("gold")}; else ${t2("gold")}; fi`,
  "doc-always": `if [ "$TURN" = 1 ]; then ${t1("always")}; else ${t2("gold")}; fi`,
  "doc-never": `if [ "$TURN" = 1 ]; then ${t1("never")}; else ${t2("never")}; fi`,
  "generic-doc": `if [ "$TURN" = 1 ]; then ${t1("generic")}; else ${t2("generic")}; fi`,
  "rewrite-history": `if [ "$TURN" = 1 ]; then ${t1("gold")}; else ${t2("rewrite")}; fi`,
  // ⭐ LA POLICY CHE SMASCHERA L'ORACOLO-DI-FORMA (aggiunta 2026-09-12, playbook §4 ORACOLI):
  // fa ESATTAMENTE la cosa giusta del gold, scrivendola in una forma innocua diversa — `proj/parse.py`
  // invece di `parse.py`, la chiave in grassetto markdown, la maiuscola. Se questa FALLISSE, l'assert
  // starebbe misurando la forma e non la skill (ed e' cosi' che era: v. il caveat in F45).
  // Deve PASSARE entrambi i bracci come il gold; per questo non entra nel verdetto «ogni policy fissa cade».
  "gold-altra-forma": `if [ "$TURN" = 1 ]; then if ${banale}; then ${buildBanale}; else ${buildModulo}; ${docVeroAltraForma}; fi; else ${applicaVincolo}; ${docSegnaAltraForma}; ${rispondiAltraForma}; fi`,
};

const rows = [];
for (const [name, agent] of Object.entries(POLICY)) {
  const p = await runPair(scene, { agent });
  const arms = Object.fromEntries(p.arms.map((a) => [a.name, { passed: a.passed, righe: a.probeOut, failed: a.results.filter((x) => !x.passed).map((x) => x.note.split(":")[0]).join(" · ") || "—" }]));
  rows.push({ policy: name, passed: p.passed, arms });
}

console.log("design-artifact-lab — fixture a DUE TEMPI, coppia vale-la-pena/banale:");
for (const r of rows) {
  const a = r.arms["vale-la-pena"], b = r.arms.banale;
  console.log(`  ${r.passed ? "PASS" : "FAIL"}  ${r.policy.padEnd(16)} vale-la-pena=${a.passed ? "ok" : "FAIL(" + a.failed + ")"} righe-doc=${a.righe}  banale=${b.passed ? "ok" : "FAIL(" + b.failed + ")"}`);
}
const gold = rows.find((r) => r.policy === "gold");
// `gold-altra-forma` NON è una policy a intelligenza zero: è il gold scritto in un'altra forma, e DEVE
// passare come lui. Se fallisce, l'oracolo misura la FORMA — il lab lo dice a voce alta invece di tacerlo.
const altraForma = rows.find((r) => r.policy === "gold-altra-forma");
const fisse = rows.filter((r) => r.policy !== "gold" && r.policy !== "gold-altra-forma");
if (!altraForma.passed) console.log("  🔴 ORACOLO-DI-FORMA: `gold-altra-forma` fa la cosa giusta in un'altra forma e FALLISCE → gli assert misurano la forma, non la skill.");
const verdict = gold.passed && altraForma.passed && fisse.every((r) => !r.passed);
console.log(verdict
  ? "✅ il gold passa entrambi i bracci e ogni policy fissa ne fallisce almeno uno: il documento è misurato sul secondo tempo, non sull'averlo scritto"
  : "❌ l'oracolo NON discrimina");
process.exit(verdict ? 0 : 1);

#!/usr/bin/env node
/**
 * check-lab-coverage — verifica DETERMINISTICA del legame LABORATORIO ↔ CLASSE, nelle DUE direzioni.
 *
 * PERCHE' ESISTE (2026-08-18, richiesta E dell'utente: *«laboratorio bilanciato su tutte le skill,
 * nessuna propensione»*). Misurando la copertura ho trovato **due** difetti, e il secondo era invisibile:
 *
 *  1. **La copertura e' bassa e nessuno lo diceva**: 11 classi su 74 hanno un laboratorio eseguibile.
 *     Non e' un difetto da far fallire — e' un **fatto da rendere visibile a ogni run**, perche' finora
 *     non compariva da nessuna parte e *«iniettiamo tutte le skill nei pesi»* restava un'intenzione.
 *  2. 🔴 **Il legame e' a SENSO UNICO**: gli 11 lab nominano la loro classe, ma solo 5 classi nominano
 *     il proprio lab. → **aprire la pagina di una classe non dice se e' misurabile.** E' *esattamente*
 *     il difetto che `check-hierarchy` impedisce sul legame padre↔figlia, su un asse per cui nessuno
 *     aveva costruito il controllo. Questo lo chiude.
 *
 * ⚠️ COME HO CONTATO, perche' il metodo e' parte del risultato (#35b: ogni conteggio ha un perimetro).
 * Ho sbagliato il numero **due volte** prima di azzeccarlo:
 *   - «classi che citano `verifiers/`» -> **43**, ma quasi tutte citano un **generatore** da riusare
 *     (`deceptive-task-gen`, `mcq-distractor-gen`), non un lab che le misura;
 *   - «classi che citano un file `-lab`» -> **5**, ma guardava **una sola direzione**;
 *   - «per ogni lab, quale classe serve» -> **11**, contato dall'**artefatto che esiste**.
 * → Questo tool conta nella terza direzione, ed e' il motivo per cui esiste come tool e non come grep.
 *
 * COSA FA FALLIRE (exit 1):
 *   - **senso-unico**: un lab nomina una classe che esiste e quella classe **non nomina il lab**.
 *   - **classe fantasma**: un lab nomina `class-qualcosa` che **non e' un file**.
 *   - **lab orfano dal gate**: un file `*-lab.mjs` sul disco che `gate.mjs` **non esegue** → girerebbe
 *     mai, e un lab che non gira e' indistinguibile da un lab che non esiste.
 *
 * COSA NON FA FALLIRE (informativo, ma stampato sempre):
 *   - i moduli che **non nominano alcuna classe** (`injection-suite`, `verification-discipline`,
 *     `transfer-assumption-audit`): servono un **concetto o una famiglia**, non una singola classe.
 *     Farli fallire vorrebbe dire imporre «una classe, un lab», cioe' un **tetto fisso** — il difetto
 *     descritto in `wiki/training-taxonomy/class-consumption-scale-for-budget.md`.
 *   - la **copertura** (N classi su M): e' la misura, non un errore. Alzarla e' una decisione, non un fix.
 *
 * ⚠️ COSA NON COPRE, dichiarato (#0): se una classe fosse misurata da un lab che **non la nomina** e che
 * **lei non nomina**, non comparirebbe in nessuna delle due direzioni e questo tool **non la vedrebbe**.
 * Il tool misura i legami DICHIARATI, non la misurabilita' in se'.
 *
 * USO:  node tools/check-lab-coverage.mjs           (da harness/)
 *       exit 0 = nessun legame rotto · exit 1 = senso-unico / classe fantasma / lab non eseguito
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERIFIERS = join(HARNESS, "verifiers");
const TAX = resolve(HARNESS, "..", "wiki", "training-taxonomy");

const classFiles = readdirSync(TAX).filter((f) => f.startsWith("class-") && f.endsWith(".md"));
const classSlugs = new Set(classFiles.map((f) => f.replace(/\.md$/, "")));
const classBody = new Map(classFiles.map((f) => [f.replace(/\.md$/, ""), readFileSync(join(TAX, f), "utf8")]));

const gateSrc = readFileSync(join(HARNESS, "tools", "gate.mjs"), "utf8");

const moduli = readdirSync(VERIFIERS).filter((f) => f.endsWith(".mjs"));

const problemi = [];
const senzaClasse = [];
/** slug-classe -> [nomi dei moduli che la servono] */
const copertura = new Map();
/** ⚠️ Distinzione che il tool ha SBAGLIATO alla prima stesura, ed e' la stessa che rese sbagliato il
 *  conteggio "43": un LABORATORIO (`*-lab.mjs`) misura una classe; un GENERATORE (`*-gen.mjs`) produce
 *  esempi e non misura niente. Sommarli dava 12 dove i lab veri sono 11. Il tool costruito per evitare
 *  quella confusione l'aveva riprodotta — tenerli separati e' l'unico modo perche' il numero significhi
 *  qualcosa. */
const conLab = new Set();
const conModulo = new Set();

for (const m of moduli) {
  const base = m.replace(/\.mjs$/, "");
  const src = readFileSync(join(VERIFIERS, m), "utf8");

  // Un lab che finisce in -lab.mjs DEVE essere eseguito dal gate, altrimenti non gira mai.
  if (base.endsWith("-lab")) {
    const nomeGate = base.replace(/-lab$/, "");
    // gate.mjs elenca i lab per nome senza il suffisso, fra virgolette.
    if (!new RegExp('"' + nomeGate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"').test(gateSrc)) {
      problemi.push({ tipo: "lab-non-eseguito", lab: base,
        dettaglio: 'gate.mjs non lo elenca -> non gira mai (cercato: "' + nomeGate + '")' });
    }
  }

  const citate = [...new Set(src.match(/class-[a-z0-9-]+/g) ?? [])]
    .map((s) => s.replace(/-+$/, ""))
    .filter((s) => s.length > "class-".length);

  if (citate.length === 0) { senzaClasse.push(base); continue; }

  for (const slug of citate) {
    if (!classSlugs.has(slug)) {
      problemi.push({ tipo: "classe-fantasma", lab: base, dettaglio: slug + " non e' un file in wiki/training-taxonomy/" });
      continue;
    }
    if (!copertura.has(slug)) copertura.set(slug, []);
    copertura.get(slug).push(base);
    if (base.endsWith("-lab")) conLab.add(slug); else conModulo.add(slug);

    // Reciprocita': la classe deve nominare il lab (con o senza il prefisso verifiers/).
    if (!classBody.get(slug).includes(base)) {
      problemi.push({ tipo: "senso-unico", lab: base,
        dettaglio: slug + " non nomina il proprio laboratorio -> chi apre la classe non sa che e' misurabile" });
    }
  }
}

const totali = classSlugs.size;
const soloModulo = [...conModulo].filter((s) => !conLab.has(s));

console.log("");
console.log("[lab-coverage] copertura MISURATA (dai moduli verso le classi, non viceversa):");
console.log("               " + conLab.size + " classi su " + totali + " hanno un LABORATORIO che le misura.");
if (soloModulo.length) {
  console.log("               + " + soloModulo.length + " servite solo da un GENERATORE (produce esempi, non misura): " + soloModulo.join(" · "));
}
if (senzaClasse.length) {
  console.log("[lab-coverage] " + senzaClasse.length + " moduli servono un concetto/famiglia invece di una classe (non e' un difetto):");
  console.log("               " + senzaClasse.join(" · "));
}

if (problemi.length === 0) {
  console.log("[lab-coverage] OK — ogni legame lab->classe e' reciproco e ogni lab e' eseguito dal gate.\n");
  process.exit(0);
}

console.log("");
for (const p of problemi) console.log("🔴 [" + p.tipo + "] " + p.lab + " — " + p.dettaglio);
console.log("");
console.log("Un legame a senso unico non e' un dettaglio di forma: l'informazione esiste solo da un lato,");
console.log("quindi aprire la classe NON dice se e' misurabile. Aggiungi il nome del lab nella pagina della classe.");
process.exit(1);

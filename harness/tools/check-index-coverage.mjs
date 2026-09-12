#!/usr/bin/env node
/**
 * check-index-coverage — ogni pagina della wiki è RAGGIUNGIBILE da `wiki/index.md`?
 *
 * PERCHE' ESISTE (2026-09-12). `index.md` è per CLAUDE.md il **catalogo content-oriented**: il punto da
 * cui si entra quando non si sa già il nome del file. Ma è **scritto a mano**, e l'evento che lo rende
 * stantio — la nascita di una pagina — **non innesca nulla**. Misurato oggi: **28 pagine su 137 non
 * comparivano** (classi, concept, ADR, fra cui l'ADR del fixture-runner e la nona radice). È la terza
 * istanza della stessa famiglia in un mese: lista LAB a mano, lista checker duplicata, registry §6
 * stantio. La regola del progetto è *«se una regola la violi tre volte, RENDILA NON-NECESSARIA»*.
 *
 * ⚠️ PERCHE' UN CHECKER E NON UN GENERATORE (a differenza del registry §6, che ora si genera):
 * l'indice **non è l'albero**. Porta una riga di *descrizione curata* per pagina, raggruppata per tema:
 * generarlo distruggerebbe l'unica cosa che vale (la curatela) e lascerebbe un elenco che il `ls` dà
 * già. Quindi: la **completezza** è meccanica e la controlla il tool; il **contenuto** resta a mano.
 *
 * COSA CONTA COME "RAGGIUNGIBILE": il basename della pagina compare in `index.md` (in un link o in
 * prosa). Volutamente **lasco**: non impone la forma del link, impedisce solo che una pagina sia
 * **invisibile** dall'entry point. Un link rotto è un'altra domanda, e la fa `check-anchors`.
 *
 * ESCLUSIONI, dichiarate: `_private/` (gitignored), `log.md`/`todo.md`/`index.md`/`README.md` (non sono
 * contenuto indicizzabile: sono il registro, il tracker e l'indice stesso), `_core-mirror/` (copie),
 * `todo/` (tracker), `memory/journal` (diario). Tutto il resto **deve** comparire.
 *
 * ⚠️ UN CASO A PARTE, e il perche': i file **`*.delta.md`** (i delta delle foglie del pilota gold) non
 * sono pagine-contenuto, sono **artefatti che appartengono alla loro gold**. Metterli nell'indice
 * aggiungerebbe rumore senza rendere trovabile nulla (chi cerca quel delta cerca la gold). Pero'
 * **non sono esenti**: devono essere **nominati da almeno un'altra pagina** della wiki, altrimenti sono
 * orfani veri — e li' il tool fallisce lo stesso, con un messaggio diverso. L'esclusione cambia la
 * DOMANDA ("chi lo nomina?" invece di "e' nell'indice?"), non la toglie.
 *
 * USO: `node tools/check-index-coverage.mjs` (exit 1 se manca qualcosa) · `--list` stampa solo i nomi.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WIKI = join(ROOT, "wiki");
// `templates/` e' una directory di BUILD (script generatori `_build_*.py` + i loro output .delta):
// non contenuto curato. Non e' esente dalla visibilita': sotto si esige che la directory sia NOMINATA
// da almeno una pagina (oggi lo e' da `index.md` e da due gold), altrimenti sarebbe un ramo invisibile.
const SKIP_DIR = /^(_private|_core-mirror|todo|memory|templates)$/;
const SKIP_FILE = /^(index|log|todo|README|MEMORY)\.md$/i;

const pages = [];
(function walk(dir, rel = "") {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (!SKIP_DIR.test(e)) walk(p, rel ? `${rel}/${e}` : e); }
    else if (e.endsWith(".md") && !SKIP_FILE.test(e)) pages.push(rel ? `${rel}/${e}` : e);
  }
})(WIKI);

const index = readFileSync(join(WIKI, "index.md"), "utf8");
const isDelta = (p) => /\.delta\.md$/.test(p);

// I delta: non nell'indice, ma nominati da qualcuno. Corpo di TUTTE le pagine tranne il delta stesso.
const bodies = new Map(pages.map((p) => [p, readFileSync(join(WIKI, p), "utf8")]));
const orfaniDelta = pages.filter(isDelta).filter((d) => {
  const nome = basename(d, ".md");
  for (const [p, src] of bodies) if (p !== d && src.includes(nome)) return false;
  return !index.includes(nome);
});

const missing = pages.filter((p) => !isDelta(p) && !index.includes(basename(p, ".md")));

if (process.argv.includes("--list")) { console.log(missing.concat(orfaniDelta).join("\n")); process.exit(0); }

const per = {};
for (const m of missing) { const d = m.includes("/") ? m.split("/")[0] : "(root)"; (per[d] ??= []).push(basename(m, ".md")); }

if (!missing.length && !orfaniDelta.length) {
  const nDelta = pages.filter(isDelta).length;
  console.log(`[index-coverage] OK — ${pages.length - nDelta} pagine indicizzabili, tutte presenti in index.md`
    + (nDelta ? ` · ${nDelta} delta fuori indice ma nominati dalla loro gold` : " · nessun file .delta fuori da `templates/` (che è build, escluso e dichiarato)"));
  process.exit(0);
}
// La directory di build non deve essere un ramo invisibile: qualcuno la deve nominare.
const buildNominata = index.includes("training-taxonomy/templates") ||
  [...bodies.values()].some((s) => s.includes("training-taxonomy/templates"));
if (!buildNominata) {
  console.log("\n🔴 DIRECTORY DI BUILD INVISIBILE — nessuna pagina nomina `training-taxonomy/templates`: chi legge la wiki non sa che esiste né cosa contiene.\n");
  process.exit(1);
}
if (orfaniDelta.length) {
  console.log(`\n🔴 DELTA ORFANI — ${orfaniDelta.length}: nessuna pagina della wiki li nomina (non basta che esistano).`);
  for (const d of orfaniDelta.sort()) console.log(`      ${d}`);
  if (!missing.length) { console.log(""); process.exit(1); }
}
console.log(`\n🔴 INDICE INCOMPLETO — ${missing.length} pagine su ${pages.length} non compaiono in wiki/index.md.`);
console.log(`   Chi entra dall'indice non le trova mai. Aggiungi una riga con la DESCRIZIONE (non solo il link) nella sezione giusta.\n`);
for (const [d, list] of Object.entries(per).sort()) {
  console.log(`   ${d}/ — ${list.length}`);
  for (const n of list.sort()) console.log(`      ${n}`);
}
console.log("");
process.exit(1);

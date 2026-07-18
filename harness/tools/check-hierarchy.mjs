#!/usr/bin/env node
/**
 * check-hierarchy — verifica DETERMINISTICA della gerarchia padre↔figlia nella tassonomia.
 *
 * PERCHE' ESISTE (#17: la lezione diventa meccanismo, non acknowledgment).
 * Utente 2026-07-16, sulla reciprocita' rotta al 25%: **"inaccettabile, non deve mai piu' accadere"**.
 * Una promessa non lo garantisce; un check che gira nella suite si'.
 *
 * IL DIFETTO CHE CATTURA
 *  - **legame a SENSO UNICO**: la figlia dichiara il padre, il padre non la elenca. Chi entra dal padre
 *    non trova mai la figlia → la gerarchia esiste solo meta' (viola #20: il padre insegna la radice UNA volta).
 *  - **padre FANTASMA**: la figlia dichiara un padre che non e' un file (es. "famiglia safety/protection").
 *  - **padre inesistente**: il file dichiarato non c'e'.
 *
 * ⚠️ TRE STATI, NON DUE — e la differenza decide l'exit code:
 *   1. **ROTTO** (senso-unico / padre fantasma / padre inesistente) → **errore**: e' un difetto reale.
 *   2. **ILLEGGIBILE** (padre in prosa libera, nessun marcatore) → **errore**: e' *"non lo so"*, e non lo so
 *      perche' il lavoro di forma non e' stato fatto. E' MIO da chiudere.
 *   3. **DA-DECIDERE** (marcato esplicitamente \`**Padre**: DA-DECIDERE\`) → **NON e' un errore**: e' uno stato
 *      *determinato* — sappiamo esattamente cosa manca (una decisione dell'utente) ed e' tracciato nei gate.
 * Perche' il 3 non fallisce (segnalato dall'agente su class-code-optimization, 2026-07-18): se le decisioni
 * pendenti tenessero il check **rosso in permanenza**, nessuno potrebbe piu' distinguere i rossi **azionabili**
 * da quelli **parcheggiati** → il rosso perde significato e viene ignorato, e un check ignorato non protegge
 * piu' nulla. Restano **elencati e contati** a ogni run: visibili, non silenziosi.
 * La differenza sostanziale col caso 2: *"non lo so"* ≠ *"lo so, ed e' in attesa di lui"*.
 *
 * ⚠️ "NON SO LEGGERLO" E' UN ERRORE, NON UNA NOTA (utente 2026-07-18: *"se il parser non legge il padre non
 * sarebbe meglio che torni errore?"* — ha ragione).
 * Prima versione: le classi senza marcatore riconosciuto finivano in un bucket informativo e il tool usciva
 * **0**. Cioe' dichiarava "0 rotti" mentre 20 legami su 47 erano semplicemente **IGNOTI** → falsa sicurezza,
 * ed e' lo **stesso difetto** del `grep -c` che ritorna 1 su zero-risultati: trattare *"non lo so"* come
 * *"va bene"*. Un check che non sa e tace e' peggio di nessun check, perche' produce fiducia.
 * Ora: `unparsed` e' **ERRORE** (exit 1) → l'unico modo di far passare la suite e' **standardizzare il
 * marcatore**, che e' il fix vero. Il rumore diventa pressione a sistemare invece che sfondo tollerato.
 *
 * COSA NON VERIFICA (dichiarato, non taciuto — #0)
 *  - se il padre e' quello GIUSTO: e' un giudizio di design, non meccanico. Questo tool garantisce che il
 *    legame sia DICHIARATO e RECIPROCO, non che sia corretto.
 *
 * USO
 *   node harness/tools/check-hierarchy.mjs            # report leggibile
 *   node harness/tools/check-hierarchy.mjs --json
 *   exit 0 = nessun legame rotto · exit 1 = rotti (usabile in CI / pre-commit)
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const TAX = `${ROOT}/wiki/training-taxonomy`;

/** Marcatori con cui una figlia dichiara il proprio padre. */
const PARENT_PATTERNS = [
  /\*\*Padre(?:-skill)?\*\*\s*[:(]?\s*\[\[([^\]|]+)/i,
  /\*\*Padre(?:-skill)?\*\*\s*[:(]?\s*`?(class-[a-z0-9-]+)/i,
  /figlia\s+(?:diretta\s+)?di\s+\[\[([^\]|]+)/i,
  /\d+[ªa]\s+figlia\s+di\s+\[\[([^\]|]+)/i,
];

const norm = (s) => String(s).trim().replace(/^.*\//, "").replace(/\.md$/, "").toLowerCase();

const files = readdirSync(TAX).filter((f) => f.startsWith("class-") && f.endsWith(".md"));
const bodies = new Map();
for (const f of files) bodies.set(norm(f), readFileSync(`${TAX}/${f}`, "utf8"));

const declared = [];   // { child, parent, raw }
const unparsed = [];   // nessun marcatore → "non lo so": ERRORE, lavoro di forma non fatto
const undecided = [];  // `**Padre**: DA-DECIDERE` → stato DETERMINATO in attesa dell'utente: elencato, non fallisce
const roots = [];

for (const f of files) {
  const child = norm(f);
  const src = bodies.get(child);
  // una radice si auto-dichiara
  if (/Classe-PADRE\s*\(radice\)|\bradice\b.*\bnessun padre\b/i.test(src.slice(0, 2500))) { roots.push(child); continue; }

  // DA-DECIDERE va riconosciuto PRIMA dei pattern normali: e' una dichiarazione esplicita di non-decisione,
  // non un'assenza di dichiarazione.
  if (/\*\*Padre(?:-skill)?\*\*\s*[:(]?\s*DA-DECIDERE/i.test(src)) { undecided.push(child); continue; }

  let parent = null, raw = null;
  for (const re of PARENT_PATTERNS) {
    const m = src.match(re);
    if (m) { parent = norm(m[1]); raw = m[0].replace(/\s+/g, " ").slice(0, 90); break; }
  }
  if (!parent) { unparsed.push(child); continue; }
  declared.push({ child, parent, raw });
}

const problems = [];
for (const d of declared) {
  if (!bodies.has(d.parent)) {
    problems.push({ kind: d.parent.startsWith("class-") ? "padre-inesistente" : "padre-FANTASMA", child: d.child, parent: d.parent, raw: d.raw });
    continue;
  }
  // reciprocita': il padre nomina la figlia?
  if (!bodies.get(d.parent).toLowerCase().includes(d.child)) {
    problems.push({ kind: "senso-unico", child: d.child, parent: d.parent, raw: d.raw });
  }
}

const byKind = (k) => problems.filter((p) => p.kind === k);
const asJson = process.argv.includes("--json");

if (asJson) {
  console.log(JSON.stringify({ stats: { classes: files.length, roots: roots.length, links: declared.length, broken: problems.length, unparsed: unparsed.length, undecided: undecided.length }, problems, unparsed, undecided, roots }, null, 2));
} else {
  for (const k of ["padre-FANTASMA", "padre-inesistente", "senso-unico"]) {
    const g = byKind(k);
    if (!g.length) continue;
    console.log(`\n${k === "senso-unico" ? "🟠" : "🔴"} ${k.toUpperCase()} — ${g.length}`);
    for (const p of g) {
      console.log(`   ${p.child}`);
      console.log(`      dichiara padre: ${p.parent}${k === "senso-unico" ? "  → ma il padre NON la elenca" : "  → non e' un file di classe"}`);
    }
  }
  if (unparsed.length) {
    console.log(`\n🔴 PADRE NON LEGGIBILE — ${unparsed.length} (NON verificate: "non lo so" ≠ "va bene")`);
    console.log(`   Il padre e' dichiarato in prosa libera. Usa un marcatore riconosciuto:`);
    console.log(`     **Padre**: [[class-nome]]      oppure      figlia di [[class-nome]]`);
    console.log(`   (o marca la classe come radice: "Classe-PADRE (radice)")`);
    console.log("   " + unparsed.join(" · "));
  }
  if (undecided.length) {
    console.log(`\n🟡 PADRE DA-DECIDERE — ${undecided.length} (in attesa dell'utente: NON un difetto, elencati per non dimenticarli)`);
    console.log("   " + undecided.join(" · "));
  }
  const total = problems.length + unparsed.length;
  console.log(`\n${files.length} classi · ${roots.length} radici · ${declared.length} legami verificati · ` +
    `${problems.length} rotti (${byKind("senso-unico").length} senso-unico, ${byKind("padre-FANTASMA").length} fantasma) · ` +
    `${unparsed.length} illeggibili · ${undecided.length} in attesa di decisione`);
  console.log(total
    ? `❌ ${total} DA SISTEMARE (${problems.length} rotti + ${unparsed.length} illeggibili)` + (undecided.length ? `  —  ${undecided.length} parcheggiati, non contano` : "")
    : `✅ ogni legame verificato e reciproco` + (undecided.length ? `  —  restano ${undecided.length} in attesa di una tua decisione` : ""));
}

// Rotti E illeggibili falliscono: un legame che non so leggere non e' un legame verificato (#0).
process.exit(problems.length + unparsed.length ? 1 : 0);

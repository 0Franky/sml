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
 * COSA NON VERIFICA (dichiarato, non taciuto — #0)
 *  - se il padre e' quello GIUSTO (e' un giudizio di design, non meccanico);
 *  - le classi che dichiarano il padre in prosa libera senza i marcatori riconosciuti → finiscono in
 *    `unparsed` ed elencate: vanno lette a mano, NON contate come "ok".
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
const unparsed = [];   // figlie senza marcatore riconosciuto → lettura manuale
const roots = [];

for (const f of files) {
  const child = norm(f);
  const src = bodies.get(child);
  // una radice si auto-dichiara
  if (/Classe-PADRE\s*\(radice\)|\bradice\b.*\bnessun padre\b/i.test(src.slice(0, 2500))) { roots.push(child); continue; }

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
  console.log(JSON.stringify({ stats: { classes: files.length, roots: roots.length, links: declared.length, broken: problems.length, unparsed: unparsed.length }, problems, unparsed, roots }, null, 2));
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
    console.log(`\n⚪ SENZA MARCATORE RICONOSCIUTO — ${unparsed.length} (da leggere a mano, NON contate come ok)`);
    console.log("   " + unparsed.join(" · "));
  }
  console.log(`\n${files.length} classi · ${roots.length} radici · ${declared.length} legami dichiarati · ` +
    `${problems.length} ROTTI (${byKind("senso-unico").length} a senso unico, ${byKind("padre-FANTASMA").length} padri fantasma) · ${unparsed.length} da leggere a mano`);
}

process.exit(problems.length ? 1 : 0);

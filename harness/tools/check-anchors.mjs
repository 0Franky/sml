#!/usr/bin/env node
/**
 * check-anchors — verifica DETERMINISTICA delle citazioni `file:riga` nella wiki.
 *
 * PERCHE' ESISTE (#17: la lezione diventa meccanismo, non acknowledgment).
 * La review-loop del 2026-07-16 ha prodotto, su 7 classi e 2 giri, una classe-di-difetto ricorrente:
 * citazioni `file:riga` che puntano alla riga SBAGLIATA (riga vuota, off-by-one, off-by-ten).
 * Tre proprieta' la rendono un bersaglio da tool, non da revisore:
 *   (a) e' MECCANICA — o la riga contiene cio' che la citazione dice, o no;
 *   (b) i revisori LLM la sbagliano proprio mentre la cacciano (un giro ha "corretto" :100 in :110,
 *       ed era :109) — costano molto e non convergono;
 *   (c) e' AUTO-INFLITTA e ricorrente: ogni edit sopra la riga citata (un banner di 10 righe, una
 *       sezione nuova) sposta in silenzio TUTTE le citazioni in entrata dalle classi sorelle.
 * E' un check STRUTTURALE, non semantico → il determinismo qui e' legittimo (#24: la regex va bene
 * sui segnali strutturali; la comprensione del linguaggio resta al modello).
 *
 * COSA VERIFICA
 *   - il file citato ESISTE
 *   - la riga citata e' IN RANGE
 *   - la riga citata non e' VUOTA (una riga vuota citata = drift certo: nessuno cita il nulla)
 *   - se la citazione porta con se' una stringa fra virgolette (« », " ", ' '), che la riga —
 *     o la sua finestra ±FUZZ — la CONTENGA davvero
 *
 * COSA NON VERIFICA (dichiarato, non taciuto — #0: nominare il residuo)
 *   - che la riga citata sia quella GIUSTA in senso semantico (una citazione che punta a una riga
 *     piena e plausibile ma concettualmente sbagliata passa: quello resta lavoro da revisore)
 *   - le citazioni con riga BARE (`:25` senza file davanti): le conta e le elenca come `manual`,
 *     perche' risolverle richiede il contesto della prosa (→ compito del modello, non della regex)
 *
 * USO
 *   node harness/tools/check-anchors.mjs                 # default: wiki/training-taxonomy/*.md
 *   node harness/tools/check-anchors.mjs wiki/concepts   # una dir o file specifici
 *   node harness/tools/check-anchors.mjs --json          # output machine-readable
 *   exit 0 = nessun drift · exit 1 = drift trovato (usabile in CI / pre-commit)
 */
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const FUZZ = 2; // tolleranza ± righe per il match della stringa citata: un drift di 1-2 righe e' comunque un drift, ma lo segnaliamo come WARN non come ERROR

/** Dir dove cercare un file citato per solo-basename (`nested-compact.mjs:227`). */
const SEARCH_DIRS = [
  "harness/src", "harness/.pi/extensions", "harness/tools", "harness/verifiers", "harness/eval",
  "harness/test/unit", "harness/test/integration",
  "wiki/training-taxonomy", "wiki/concepts", "wiki/architecture", "wiki/decisions", "wiki/entities", "wiki",
];

const CITE = /([A-Za-z0-9_\-./]+\.(?:md|mjs|ts|js|mts|cjs|json|jsonl|py|sh))[:](\d+)(?:\s*[-–]\s*(\d+))?/g;
const BARE = /(?<![A-Za-z0-9_\-./])[:](\d{1,4})(?![\d\w])/g;
/**
 * Stringa citata vicino all'ancora: «...» / "..." / '...'.
 * Minimo 20 char: sotto quella soglia la stringa non DISCRIMINA (una citazione «il modello» matcha
 * mezza wiki e produce un finding inventato) — e un check che non discrimina e' la finestra, non il razzo (#0).
 */
const QUOTED = /[«"'']([^«»"'']{20,160})[»"'']/g;

/**
 * Prefissi che rendono una citazione una CLAIM SUL REPO (→ se il file manca, e' un errore).
 * Senza prefisso e senza basename noto e' quasi sempre un file di FIXTURE dentro un gold example
 * (`parser.py:1`, `report/loader.py:1`): fittizio per costruzione — le fixture sono self-contained
 * apposta (#22c), quindi NON e' un difetto e non va segnalato.
 */
const REPO_PREFIX = /^(harness|wiki|lm|docs|raw|graphify-out)\//;

const basenameIndex = new Map();
for (const d of SEARCH_DIRS) {
  const abs = join(ROOT, d);
  if (!existsSync(abs)) continue;
  for (const f of readdirSync(abs)) {
    const p = join(abs, f);
    try { if (!statSync(p).isFile()) continue; } catch { continue; }
    if (!basenameIndex.has(f)) basenameIndex.set(f, p);
  }
}

const fileCache = new Map();
function linesOf(abs) {
  if (!fileCache.has(abs)) {
    try { fileCache.set(abs, readFileSync(abs, "utf8").split(/\r?\n/)); }
    catch { fileCache.set(abs, null); }
  }
  return fileCache.get(abs);
}

/** Risolve un path citato: repo-relative → relativo al citante → per basename. */
function resolveCited(cited, fromAbs) {
  const tries = [join(ROOT, cited), join(dirname(fromAbs), cited)];
  for (const t of tries) if (existsSync(t) && statSync(t).isFile()) return t;
  const base = cited.split("/").pop();
  return basenameIndex.get(base) ?? null;
}

function collectTargets(argv) {
  const paths = argv.filter((a) => !a.startsWith("--"));
  const roots = paths.length ? paths : ["wiki/training-taxonomy"];
  const out = [];
  for (const r of roots) {
    const abs = resolve(ROOT, r);
    if (!existsSync(abs)) { console.error(`⚠ assente: ${r}`); continue; }
    if (statSync(abs).isFile()) { out.push(abs); continue; }
    for (const f of readdirSync(abs)) if (extname(f) === ".md") out.push(join(abs, f));
  }
  return out;
}

/**
 * Il virgolettato che APPARTIENE a questa ancora — e solo quello.
 *
 * Regola: un virgolettato e' della citazione piu' VICINA, e va verificato solo contro quella.
 * Senza questa reciprocita' il check spara falsi positivi proprio sulla forma di citazione piu' CURATA,
 * quella che cita il codice E, a parte, il commento che lo descrive:
 *     `nested-compact.mjs:283-287` — backlogOutsideSubset … = *"…NASCONDE al modello"* (`:276`)
 * La frase e' del `:276`, non del `:283`: attribuirla al `:283` fa gridare "drift" a una citazione giusta.
 * (Misurato: i primi 3 ERROR del tool erano 3/3 questo — il check rispondeva a "dove sta la stringa?"
 * mentre la domanda era "la citazione punta alla cosa giusta?". Due domande diverse → #0.)
 * Le ancore BARE (`:276`) non stanno in CITE ma competono per la proprieta': se il virgolettato e' piu'
 * vicino a una bare che a questa citazione, non e' affar nostro e si passa.
 */
function quoteOwnedBy(proseLine, anchorIdx) {
  const owners = [...proseLine.matchAll(CITE), ...proseLine.matchAll(BARE)];
  let best = null;
  for (const m of proseLine.matchAll(QUOTED)) {
    let ownerIdx = null, ownerD = Infinity;
    for (const o of owners) {
      const d = Math.abs(m.index - o.index);
      if (d < ownerD) { ownerD = d; ownerIdx = o.index; }
    }
    if (ownerIdx !== anchorIdx) continue;
    const d = Math.abs(m.index - anchorIdx);
    if (!best || d < best.d) best = { d, text: m[1] };
  }
  return best && best.d < 200 ? best.text : null;
}

const norm = (s) => s.toLowerCase().replace(/[«»"''`*_]/g, "").replace(/\s+/g, " ").trim();

const findings = [];
let stats = { citations: 0, ok: 0, bare: 0, files: 0, fixture: 0 };

for (const abs of collectTargets(process.argv.slice(2))) {
  stats.files++;
  const src = linesOf(abs);
  if (!src) continue;
  const rel = relative(ROOT, abs).replace(/\\/g, "/");

  src.forEach((line, i) => {
    const lineNo = i + 1;

    for (const m of line.matchAll(CITE)) {
      stats.citations++;
      const [, cited, startS, endS] = m;
      const start = Number(startS);
      const end = endS ? Number(endS) : start;
      const target = resolveCited(cited, abs);
      const at = `${rel}:${lineNo}`;

      if (!target) {
        // Nessun prefisso-repo e nessun basename noto → riferimento a una fixture fittizia del gold: per design, non un difetto.
        if (!REPO_PREFIX.test(cited)) { stats.fixture++; continue; }
        findings.push({ sev: "ERROR", kind: "file-missing", at, cite: `${cited}:${start}`, detail: "il file citato non esiste (ne' repo-relative, ne' relativo al citante, ne' per basename)" });
        continue;
      }
      const tl = linesOf(target);
      const trel = relative(ROOT, target).replace(/\\/g, "/");
      if (!tl) continue;

      if (start < 1 || end > tl.length) {
        findings.push({ sev: "ERROR", kind: "out-of-range", at, cite: `${trel}:${startS}${endS ? "-" + endS : ""}`, detail: `il file ha ${tl.length} righe` });
        continue;
      }

      const body = tl.slice(start - 1, end);
      if (body.every((l) => !l.trim())) {
        findings.push({ sev: "ERROR", kind: "blank-line", at, cite: `${trel}:${startS}${endS ? "-" + endS : ""}`, detail: "la riga citata e' VUOTA — nessuno cita il nulla: drift certo" });
        continue;
      }

      const q = quoteOwnedBy(line, m.index);
      if (q) {
        const nq = norm(q);
        if (body.some((l) => norm(l).includes(nq))) { stats.ok++; continue; }

        // La stringa non e' dove la citazione dice. DOVE sta davvero?
        const hits = [];
        tl.forEach((l, k) => { if (norm(l).includes(nq)) hits.push(k + 1); });

        if (hits.length === 0) {
          // NON discriminante: la frase fra virgolette accanto a un'ancora e' spesso la PARAFRASI
          // dell'autore, non una citazione verbatim — e il tool non sa distinguerle. Segnalarlo di
          // default riempirebbe l'output di rumore con l'autorita' di un check → solo con --verbose.
          findings.push({ sev: "INFO", kind: "quote-not-found", at, cite: `${trel}:${startS}`, detail: "la stringa vicina all'ancora non compare nel file citato: probabile parafrasi dell'autore (atteso), oppure citazione inventata — il tool NON sa distinguerle", quote: q.slice(0, 90) });
        } else if (hits.length > 1) {
          // La stringa non DISCRIMINA una riga sola → non posso dire dove va: dirlo sarebbe una
          // congettura con l'autorita' di un fatto. Segnalo l'ambiguita', non un numero (#0).
          findings.push({ sev: "WARN", kind: "ambiguous-quote", at, cite: `${trel}:${startS}`, detail: `la stringa citata compare su ${hits.length} righe (${hits.slice(0, 6).join(", ")}${hits.length > 6 ? "…" : ""}) e non su quella citata: non discrimina → verifica a mano`, quote: q.slice(0, 90) });
        } else {
          const real = hits[0];
          const drift = real - start;
          const sev = Math.abs(drift) <= FUZZ ? "WARN" : "ERROR";
          findings.push({ sev, kind: "anchor-drift", at, cite: `${trel}:${startS}`, detail: `la stringa citata sta a :${real} (drift di ${drift > 0 ? "+" : ""}${drift})`, quote: q.slice(0, 90), suggest: real });
        }
        continue;
      }
      stats.ok++;
    }

    // citazioni bare `:NNN` — non risolvibili senza il contesto della prosa: le elenchiamo, non le giudichiamo
    const stripped = line.replace(CITE, "");
    for (const _ of stripped.matchAll(BARE)) stats.bare++;
  });
}

const asJson = process.argv.includes("--json");
if (asJson) {
  console.log(JSON.stringify({ stats, findings }, null, 2));
} else {
  const verbose = process.argv.includes("--verbose");
  const errs = findings.filter((f) => f.sev === "ERROR");
  const warns = findings.filter((f) => f.sev === "WARN");
  const infos = findings.filter((f) => f.sev === "INFO");
  for (const group of verbose ? [errs, warns, infos] : [errs, warns]) {
    for (const f of group) {
      const icon = f.sev === "ERROR" ? "🔴" : f.sev === "WARN" ? "🟡" : "·";
      console.log(`${icon} ${f.at}  →  ${f.cite}   [${f.kind}]`);
      console.log(`   ${f.detail}`);
      if (f.quote) console.log(`   citava: «${f.quote}»`);
      if (f.suggest) console.log(`   ✎ correggi in :${f.suggest}`);
    }
  }
  console.log(`
${stats.files} file · ${stats.citations} citazioni · ${stats.ok} ok · ${errs.length} ERROR · ${warns.length} WARN · ${infos.length} INFO${verbose ? "" : " (--verbose per vederle)"} · ${stats.fixture} fixture-ref (attese) · ${stats.bare} bare `+"`:NNN`"+` (verifica manuale)`);
}

process.exit(findings.some((f) => f.sev === "ERROR") ? 1 : 0);

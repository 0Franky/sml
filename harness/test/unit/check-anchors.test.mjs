/**
 * check-anchors — test END-TO-END sullo script reale (subprocess + fixture su disco), non sulle funzioni pure.
 *
 * PERCHE' COSI' (#14): il tool serve a catturare drift di citazioni; il suo valore vive nel WIRING
 * (risoluzione path → lettura file → proprieta' del virgolettato → exit code). Un unit-test sulle regex
 * sarebbe falsa sicurezza. Qui si pianta un difetto NOTO e si pretende che lo becchi, e si piantano i
 * casi LEGITTIMI e si pretende che stia zitto.
 *
 * Il canary che conta (§4): il tool nasce con 3 ERROR che erano 3/3 FALSI POSITIVI — attribuiva alla
 * citazione del CODICE il virgolettato che apparteneva alla citazione del COMMENTO accanto. Un check
 * che grida sulle citazioni CORRETTE e' peggio di nessun check: le "correzioni" le romperebbero.
 */
import { test } from "node:test";
import { ok, equal } from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";

const HERE = dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const TOOL = resolve(HERE, "..", "..", "tools", "check-anchors.mjs");
const ROOT = resolve(HERE, "..", "..", "..");

/** Lancia il tool su una dir e ritorna {exit, report}. */
function run(dir) {
  try {
    const out = execFileSync(process.execPath, [TOOL, dir, "--json"], { encoding: "utf8" });
    return { exit: 0, report: JSON.parse(out) };
  } catch (e) {
    return { exit: e.status, report: JSON.parse(e.stdout) };
  }
}

/** Scrive un .md in una dir temporanea e ci lancia il tool. */
function withDoc(body) {
  const dir = mkdtempSync(join(tmpdir(), "anchors-"));
  try {
    writeFileSync(join(dir, "doc.md"), body);
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const kinds = (r) => r.report.findings.map((f) => f.kind);

test("1. riga VUOTA citata → ERROR (nessuno cita il nulla: drift certo)", () => {
  // harness/tools/check-anchors.mjs:2 e' una riga di commento; :1 e' lo shebang. Cerchiamo una riga vuota REALE:
  // usiamo un file di fixture nostro cosi' il test non dipende dal layout di un file che cambia.
  const dir = mkdtempSync(join(tmpdir(), "anchors-"));
  try {
    mkdirSync(join(dir, "harness", "src"), { recursive: true });
    writeFileSync(join(dir, "harness", "src", "t.mjs"), "const a = 1;\n\nconst b = 2;\n");
    // il tool risolve per basename dentro le SEARCH_DIRS del REPO, non della fixture → citiamo un file
    // vero del repo di cui conosciamo una riga vuota certa.
    writeFileSync(join(dir, "doc.md"), "vedi `harness/test/unit/check-anchors.test.mjs:2` per il razionale\n");
    const r = run(dir);
    // :2 di QUESTO file e' " * check-anchors — test END-TO-END..." → non vuota, deve passare.
    equal(r.exit, 0, "una citazione a una riga piena non deve produrre ERROR");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("2. riga OUT-OF-RANGE → ERROR", () => {
  const r = withDoc("vedi `harness/tools/check-anchors.mjs:99999` per i dettagli\n");
  equal(r.exit, 1);
  ok(kinds(r).includes("out-of-range"), `atteso out-of-range, ho ${JSON.stringify(kinds(r))}`);
});

test("3. file con prefisso-repo INESISTENTE → ERROR", () => {
  const r = withDoc("vedi `harness/src/questo-file-non-esiste-mai.mjs:10`\n");
  equal(r.exit, 1);
  ok(kinds(r).includes("file-missing"));
});

test("3b. file SENZA prefisso-repo e sconosciuto → fixture del gold, NON un difetto", () => {
  // #22c: le fixture dei gold sono self-contained per costruzione — `parser.py:1` non deve esistere.
  const r = withDoc("Il modello legge `parser.py:1` e `report/loader.py:88` nella fixture.\n");
  equal(r.exit, 0, "una fixture fittizia non e' un drift");
  equal(r.report.stats.fixture, 2, "vanno contate come fixture-ref, non ignorate in silenzio");
  equal(r.report.findings.length, 0);
});

test("4. 🔴 CANARY — codice citato + commento citato a parte: NON e' drift (i 3 falsi positivi originali)", () => {
  // La forma piu' CURATA di citazione, quella che il tool rompeva:
  //   `file.mjs:283-287` — funzione … = *"frase del commento"* (`:276`)
  // Il virgolettato appartiene alla BARE `:276`, non alla citazione del codice.
  // Riproduciamo la riga REALE di class-attentional-scope-exit.md:46 su un file REALE del repo.
  const real = "- `harness/src/nested-compact.mjs:283-287` — `backlogOutsideSubset`: SSOT condivisa (#16) fra `<frame>` e `<pop_hint>` = *\"esattamente ciò che il filtro-scope NASCONDE al modello\"* (`:276`).\n";
  const r = withDoc(real);
  equal(r.exit, 0, `una citazione CORRETTA non deve produrre ERROR — findings: ${JSON.stringify(r.report.findings, null, 1)}`);
  ok(!kinds(r).includes("anchor-drift"), "il virgolettato e' della bare `:276`, non del `:283` → niente drift");
});

test("5. drift VERO con virgolettato di sua proprieta' → ERROR + riga suggerita", () => {
  // Nessuna bare accanto: il virgolettato appartiene alla citazione, che punta alla riga sbagliata.
  // La frase sta nel JSDoc a :276 → citarla a :95 (`let work = "none";`, riga PIENA) e' drift.
  // Riga piena di proposito: su una riga vuota scatterebbe prima il check blank-line e non
  // proveremmo nulla sul drift (lo ha mostrato la prima stesura di questo test, che citava :100 = vuota).
  const r = withDoc("- `harness/src/nested-compact.mjs:95` dice *\"esattamente ciò che il filtro-scope NASCONDE al modello\"*\n");
  equal(r.exit, 1, "un drift vero deve fallire");
  const f = r.report.findings.find((x) => x.kind === "anchor-drift");
  ok(f, `atteso anchor-drift, ho ${JSON.stringify(kinds(r))}`);
  equal(f.suggest, 276, "deve indicare la riga REALE della stringa citata");
});

test("6. virgolettato AMBIGUO (piu' righe) → mai un numero suggerito, solo l'ambiguita'", () => {
  // Se la stringa non discrimina una riga sola, dire "correggi in :N" sarebbe una congettura
  // con l'autorita' di un fatto (#0). Il tool deve dichiarare l'ambiguita' e fermarsi.
  const dir = mkdtempSync(join(tmpdir(), "anchors-"));
  try {
    mkdirSync(join(dir, "wiki"), { recursive: true });
    const rip = "questa frase si ripete identica in due punti del file\n";
    writeFileSync(join(dir, "wiki", "rip.md"), `intro\n${rip}mezzo\n${rip}fine\n`);
    writeFileSync(join(dir, "doc.md"), `vedi \`wiki/rip.md:1\` — *"questa frase si ripete identica in due punti del file"*\n`);
    const r = run(dir);
    const f = r.report.findings.find((x) => x.kind === "ambiguous-quote");
    ok(f, `attesa ambiguita', ho ${JSON.stringify(r.report.findings.map((x) => x.kind))}`);
    ok(!("suggest" in f), "su una stringa ambigua NON deve suggerire una riga");
    equal(r.exit, 0, "l'ambiguita' e' un WARN da leggere a mano, non un errore bloccante");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("7. la wiki reale passa (regressione: nessun drift introdotto dagli edit)", () => {
  const r = run(join(ROOT, "wiki", "training-taxonomy"));
  equal(r.exit, 0, `drift in wiki/training-taxonomy:\n${r.report.findings.filter((f) => f.sev === "ERROR").map((f) => `  ${f.at} → ${f.cite} [${f.kind}] ${f.detail}`).join("\n")}`);
  ok(r.report.stats.citations > 100, "il check deve vedere le citazioni, non zero (canary anti-no-op)");
  ok(r.report.stats.ok > 50, "e deve validarne una quota reale");
});

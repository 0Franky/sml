/**
 * capable-profile-wiring — il combo "capable" di eval/run-matrix.mjs SPEGNE DAVVERO le stampelle?
 *
 * PERCHE' AL LIVELLO DEL WIRING e non unit (regola #14): il modo in cui questo si rompe non e' una funzione
 * sbagliata, e' un **nome di variabile che non esiste** (o rinominato in seguito). Un unit sull'oggetto-combo
 * passerebbe con `HARNESS_TOOL_GATNIG: "off"` e il braccio girerebbe con i tool nascosti, producendo un
 * confronto silenziosamente falso — cioe' esattamente il difetto che il profilo esiste per evitare.
 * Qui si parte dal combo REALE letto da run-matrix.mjs e si arriva alla config EFFETTIVA + allo scaffolding
 * REALMENTE registrato.
 *
 * Difetto che questo test avrebbe intercettato (2026-08-04): i 5 combo storici non impostano ne' TOOL_GATING
 * ne' LANE_MEMORY_HINT → tutta la matrice e' girata col gating attivo senza che nessuno lo dichiarasse.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadHarnessConfig, DEFAULT_HARNESS_CONFIG } from "../../src/harness-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MATRIX = join(__dirname, "../../eval/run-matrix.mjs");

/**
 * Estrae il bag di env del combo `capable` dal sorgente REALE (SSOT: non ri-scriverlo qui, divergerebbe).
 * ⚠️ Il blocco e' MULTI-RIGA: la prima versione di questo estrattore leggeva una riga sola e vedeva 4 variabili
 * su 7 — e i test a valle fallivano dando la colpa al combo invece che al parser. Stesso limite gia' pagato in
 * check-anchors (associazione citazione↔stringa una riga alla volta). Qui si legge dalla riga del label fino
 * alla chiusura del combo.
 */
function capableEnvFromSource() {
  const src = readFileSync(MATRIX, "utf-8");
  const lines = src.split(/\r?\n/);
  const start = lines.findIndex((l) => l.includes('label: "capable"'));
  assert.ok(start >= 0, "il combo 'capable' non esiste piu' in run-matrix.mjs");
  let end = start;
  while (end < lines.length && !/\}\s*\},?\s*$/.test(lines[end])) end++;
  assert.ok(end < lines.length, "combo 'capable' senza chiusura riconoscibile");
  const blocco = lines.slice(start, end + 1).join("\n");
  const env = {};
  for (const m of blocco.matchAll(/(HARNESS_[A-Z_]+):\s*"([^"]*)"/g)) env[m[1]] = m[2];
  return env;
}

test("il combo 'capable' esiste e nomina solo variabili REALI (nessun refuso silenzioso)", () => {
  const env = capableEnvFromSource();
  assert.ok(Object.keys(env).length >= 5, "combo 'capable' sospettosamente piccolo");

  // Ogni HARNESS_* del combo deve comparire nel sorgente che la consuma. Un refuso non comparirebbe.
  const consumers = ["../../src/harness-config.mjs", "../../src/eviction-checkpoint.mjs", "../../src/file-view.mjs"]
    .map((p) => readFileSync(join(__dirname, p), "utf-8"))
    .concat(
      ["task-digest-capture.ts", "context-views.ts", "eviction-checkpoint.ts", "tool-gating.ts", "anti-fixation.ts"].map((f) =>
        readFileSync(join(__dirname, "../../.pi/extensions/", f), "utf-8")
      )
    )
    .join("\n");

  for (const name of Object.keys(env)) {
    assert.ok(consumers.includes(name), `${name}: nessun consumatore lo legge → refuso o variabile morta`);
  }
});

test("sotto il profilo capable le STAMPELLE sono spente nella config EFFETTIVA", () => {
  const env = capableEnvFromSource();
  const cfg = loadHarnessConfig("/percorso/inesistente.json", { env }); // niente file: default + env, come nell'eval

  assert.equal(cfg.toolGating, "off", "tool-gating deve essere off: nascondere i tool a un modello capace gli sottrae strumenti");
  assert.equal(cfg.laneMemoryHint, false, "how_memory_works deve essere spento: e' lo scaffolding-crutch");
  assert.equal(cfg.maxOpenFileViews, 8, "il cap 3 e' un budget da contesto piccolo");
});

test("il profilo capable DIFFERISCE davvero dal default (altrimenti non misura niente)", () => {
  const env = capableEnvFromSource();
  const capable = loadHarnessConfig("/percorso/inesistente.json", { env });
  const dflt = loadHarnessConfig("/percorso/inesistente.json", { env: {} });

  // Guardia anti-verde-a-vuoto: se il default cambiasse e coincidesse col profilo, il braccio "capable"
  // sarebbe identico al braccio "full" e il confronto non separerebbe nulla — senza che nessuno se ne accorga.
  const differenze = ["toolGating", "laneMemoryHint", "maxOpenFileViews"].filter((k) => capable[k] !== dflt[k]);
  assert.ok(differenze.length >= 3, `il profilo capable non differisce dal default su: ${differenze.join(",")}`);

  // E il default deve restare quello del regime SLM: se un giorno cambia, questo test lo dice.
  assert.equal(dflt.toolGating, DEFAULT_HARNESS_CONFIG.toolGating);
  assert.equal(dflt.laneMemoryHint, DEFAULT_HARNESS_CONFIG.laneMemoryHint);
});

test("con laneMemoryHint=false lo SCAFFOLDING registrato e' VUOTO (il crutch non arriva al modello)", async () => {
  // E' il passo che un test sulla sola config non copre: la config puo' essere giusta e lo scaffolding
  // arrivare lo stesso, perche' slm.ts lo registra a import-time in un registry separato.
  const { getRegisteredScaffolding, resetScaffolding, registerScaffolding } = await import("../../src/slm-scaffolding.mjs");

  resetScaffolding?.();
  registerScaffolding("off", { toolGating: "off", discoverableCats: "" });
  const off = getRegisteredScaffolding();
  const testoOff = JSON.stringify(off ?? "");

  resetScaffolding?.();
  registerScaffolding("full", { toolGating: "gated", discoverableCats: "a, b" });
  const full = getRegisteredScaffolding();
  const testoFull = JSON.stringify(full ?? "");

  assert.ok(testoFull.length > testoOff.length, "livello 'full' deve produrre piu' scaffolding di 'off'");
  assert.ok(!/how_memory_works/i.test(testoOff), "a livello 'off' how_memory_works NON deve essere registrato");
  assert.ok(/how_memory_works/i.test(testoFull), "a livello 'full' how_memory_works deve esserci (controllo positivo: se sparisce, il test sopra diventa verde a vuoto)");
});

/**
 * run-tests — runner auto-discovery dei test deterministici dell'harness.
 *
 * Esegue TUTTI i `test/<cat>/*.test.mjs` per CONVENZIONE (niente elenco a mano in package.json):
 *   test/unit/         → unit test (un modulo isolato)
 *   test/integration/  → integration/scenario (più componenti: compaction, long-run, guardrail…)
 *   test/e2e/          → behavioral/e2e (richiede rete/API key in harness/.env) — ESCLUSI di default,
 *                        si lanciano a mano (es: `node test/e2e/dogfood-test.mjs <model>`).
 *
 * Uso:
 *   node run-tests.mjs              → unit + integration (è `npm test`)
 *   node run-tests.mjs unit         → solo unit
 *   node run-tests.mjs integration  → solo integration
 */
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CATS = ["unit", "integration"]; // e2e escluso (API-gated, manuale)
const only = process.argv[2];
const cats = only ? [only] : DEFAULT_CATS;

const files = [];
for (const c of cats) {
  let entries = [];
  try { entries = readdirSync(join(root, "test", c)); } catch { continue; }
  for (const f of entries.sort()) if (f.endsWith(".test.mjs")) files.push(join("test", c, f));
}

if (files.length === 0) {
  console.error(`run-tests: nessun *.test.mjs in test/${cats.join(", test/")}`);
  process.exit(1);
}

let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [join(root, f)], { stdio: "inherit" });
  if (r.status !== 0) {
    failed++;
    console.error(`  ✗ ${f} (exit ${r.status ?? "signal " + r.signal})`);
  }
}

console.log(`\n===== run-tests [${cats.join("+")}]: ${files.length} file · ${failed} falliti =====`);
process.exit(failed === 0 ? 0 : 1);

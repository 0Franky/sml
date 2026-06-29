/**
 * run-tests — runner auto-discovery dei test deterministici dell'harness.
 *
 * Esegue TUTTI i file di test per CONVENZIONE DI NOME, senza elencarli a mano in package.json
 * (così un nuovo `*.test.mjs` entra nella suite da solo, niente da dimenticare):
 *   - `src/<nome>.test.mjs`   → unit test
 *   - `src/_test-<nome>.mjs`  → scenario test
 * Esclusi PER COSTRUZIONE (non seguono quelle convenzioni): i tool behavioral/manuali che richiedono
 * rete/API o sono demo → `_dogfood-*.mjs`, `_e2e-*.mjs`, `_demo-*.mjs`.
 *
 * Uso: `node run-tests.mjs`  (è lo script `npm test`).
 */
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const srcDir = join(root, "src");

const isDeterministicTest = (f) => /\.test\.mjs$/.test(f) || /^_test-.*\.mjs$/.test(f);
const files = readdirSync(srcDir).filter(isDeterministicTest).sort();

if (files.length === 0) {
  console.error("run-tests: nessun file di test trovato in src/ (convenzioni: *.test.mjs, _test-*.mjs)");
  process.exit(1);
}

let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [join(srcDir, f)], { stdio: "inherit" });
  if (r.status !== 0) {
    failed++;
    console.error(`  ✗ ${f} (exit ${r.status ?? "signal " + r.signal})`);
  }
}

console.log(`\n===== run-tests: ${files.length} file eseguiti · ${failed} falliti =====`);
process.exit(failed === 0 ? 0 : 1);

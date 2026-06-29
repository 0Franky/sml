// Esegue TUTTI i verifier-spec in verifiers/*.json via run-spec.mjs e stampa una tabella riassuntiva.
// Uso:
//   node sandbox/run-all.mjs               (dalla root del repo)
//   docker run --rm -v "$PWD:/work" slm-sandbox node sandbox/run-all.mjs
// Gli spec con setup/asserts vuoti (es. *-NONDET) sono SKIPPED-by-design (non eseguibili come oracolo).
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const verifiersDir = join(here, "..", "verifiers");
const runSpec = join(here, "run-spec.mjs");

const specs = readdirSync(verifiersDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const rows = [];
let allOk = true;

for (const f of specs) {
  const full = join(verifiersDir, f);
  const spec = JSON.parse(readFileSync(full, "utf8"));
  const nSetup = (spec.setup ?? []).length;
  const nAsserts = (spec.asserts ?? []).length;

  if (nSetup === 0 && nAsserts === 0) {
    rows.push({ spec: f, status: "SKIPPED-by-design", asserts: 0, note: spec._meta?.status ?? "" });
    continue;
  }

  let out = "";
  let exit = 0;
  try {
    out = execFileSync("node", [runSpec, full], { stdio: "pipe" }).toString();
  } catch (e) {
    exit = typeof e.status === "number" ? e.status : 1;
    out = (e.stdout || "").toString();
  }
  let parsed = null;
  try {
    parsed = JSON.parse(out);
  } catch {}
  const passed = exit === 0 && parsed?.passed === true;
  if (!passed) allOk = false;
  rows.push({
    spec: f,
    status: passed ? "PASS" : "FAIL",
    asserts: parsed?.results?.length ?? nAsserts,
    note: parsed?.setupError ? `setupError: ${parsed.setupError.cmd}` : "",
  });
}

console.log("\n=== Verifier suite summary ===");
for (const r of rows) {
  console.log(`  ${r.status.padEnd(18)} ${r.spec.padEnd(34)} asserts=${r.asserts} ${r.note}`);
}
const executed = rows.filter((r) => r.status === "PASS" || r.status === "FAIL");
const passed = rows.filter((r) => r.status === "PASS").length;
console.log(`\n${passed}/${executed.length} executable specs PASS, ${rows.length - executed.length} skipped-by-design.`);
process.exit(allOk ? 0 : 1);

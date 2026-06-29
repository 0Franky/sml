/**
 * tool-names — guard anti-COLLISIONE: nessun nome-tool registrato da più extension.
 *
 * Il runner di pi dedup-a per "prima registrazione vince" (per ordine readdir) → un tool duplicato viene
 * SCARTATO in silenzio. È esattamente il bug `record_decision` (vars-queue.ts vs contradiction-detection.ts)
 * trovato dal review-loop 2026-06-29. Questo test fallisce se un nome-tool ricompare. Scansione statica dei
 * `.pi/extensions/*.ts` (regex sul primo campo `name:` di ogni registerTool).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const extDir = join(__dirname, "../../.pi/extensions");

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const names = [];
for (const f of readdirSync(extDir).filter((f) => f.endsWith(".ts"))) {
  const src = readFileSync(join(extDir, f), "utf-8");
  const re = /registerTool\(\s*\{\s*name:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) names.push({ name: m[1], file: f });
}

const seen = new Map();
const dups = [];
for (const n of names) {
  if (seen.has(n.name)) dups.push(`${n.name} (${seen.get(n.name)} + ${n.file})`);
  else seen.set(n.name, n.file);
}

ok(names.length >= 15, `trovati ${names.length} tool registrati nelle extension (atteso ≥15)`);
ok(dups.length === 0, `nomi-tool DUPLICATI tra extension (uno verrebbe scartato): ${dups.join("; ") || "nessuno"}`);

console.log(`\ntool-names smoke-test: ${passed} passed, ${failed} failed (${names.length} tool, ${dups.length} duplicati)`);
process.exit(failed === 0 ? 0 : 1);

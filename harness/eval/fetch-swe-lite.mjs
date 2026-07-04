/**
 * fetch-swe-lite — scarica i METADATA di SWE-bench Lite (300 task) dalla fonte UFFICIALE Princeton (HF).
 *
 * ⚠️ SICUREZZA: questo scarica SOLO metadata testuali (repo/base_commit/patch-diff/test/problem_statement).
 * NON esegue NULLA. L'esecuzione dei task (clone repo + applica patch + gira i test) è codice NON FIDATO e va
 * fatta SOLO in sandbox Docker isolata (design ufficiale SWE-bench) — vedi [[architecture/ab-eval-harness]] §SWE.
 *
 * Fonte: HF datasets-server (JSON, no parquet-lib). Uso (cwd=harness/):
 *   node eval/fetch-swe-lite.mjs                 # tutti i 300 → eval/data/swe/swe-bench-lite.jsonl
 *   node eval/fetch-swe-lite.mjs 5               # primi 5 (smoke)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, "data", "swe");
mkdirSync(OUT_DIR, { recursive: true });

const WANT = process.argv[2] ? Math.max(1, parseInt(process.argv[2], 10)) : Infinity;
const DS = "princeton-nlp/SWE-bench_Lite";
const BASE = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(DS)}&config=default&split=test`;

const rows = [];
let offset = 0;
const PAGE = 100;
while (rows.length < WANT) {
  const len = Math.min(PAGE, WANT === Infinity ? PAGE : WANT - rows.length);
  const res = await fetch(`${BASE}&offset=${offset}&length=${len}`);
  if (!res.ok) { console.error(`fetch fallito offset=${offset}: ${res.status} ${res.statusText}`); process.exit(1); }
  const j = await res.json();
  const batch = (j.rows ?? []).map((r) => r.row);
  if (!batch.length) break;
  rows.push(...batch);
  if (WANT === Infinity && rows.length >= (j.num_rows_total ?? rows.length)) break;
  offset += batch.length;
}

const out = join(OUT_DIR, "swe-bench-lite.jsonl");
writeFileSync(out, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
const repos = [...new Set(rows.map((r) => r.repo))];
console.log(`SWE-bench Lite: scaricati ${rows.length} task → ${out}`);
console.log(`repos (${repos.length}): ${repos.join(", ")}`);
console.log(`⚠️ metadata only — esecuzione SOLO in Docker sandbox (Docker daemon ora GIÙ).`);

/**
 * fetch-humaneval — scarica il dataset HumanEval e ne scrive un SUBSET locale (gitignored).
 *
 * Sorgente canonica: openai/human-eval (JSONL gz). Ogni task:
 *   { task_id, prompt, entry_point, canonical_solution, test }
 * Uso:
 *   node eval/fetch-humaneval.mjs [N]           # default N=10 (primi N task, deterministico)
 *   HUMANEVAL_URL=<url> node eval/fetch-humaneval.mjs 20
 * Output: eval/data/humaneval-<N>.jsonl  (+ stampa i task_id)
 *
 * NB rete: se il fetch fallisce (offline/proxy), passare un file locale via HUMANEVAL_URL=file:///path
 * o scaricarlo a mano e metterlo in eval/data/. Non è un blocco del design (i task sono dati d'ingresso).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const DATA = join(here, "data");
mkdirSync(DATA, { recursive: true });

const N = Math.max(1, parseInt(process.argv[2] || "10", 10) || 10);
const URL = process.env.HUMANEVAL_URL
  || "https://github.com/openai/human-eval/raw/master/data/HumanEval.jsonl.gz";

const res = await fetch(URL);
if (!res.ok) { console.error(`fetch fallito: ${res.status} ${res.statusText} (${URL})`); process.exit(1); }
let buf = Buffer.from(await res.arrayBuffer());
// gz o jsonl grezzo: prova gunzip, altrimenti usa il testo così com'è.
let text;
try { text = gunzipSync(buf).toString("utf8"); }
catch { text = buf.toString("utf8"); }

const all = text.trim().split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
const subset = all.slice(0, N);
const out = join(DATA, `humaneval-${N}.jsonl`);
writeFileSync(out, subset.map((t) => JSON.stringify(t)).join("\n") + "\n");

console.log(`HumanEval: ${all.length} task totali → scritti ${subset.length} in ${out}`);
console.log(`task_id: ${subset.map((t) => t.task_id).join(", ")}`);
// sanity: campi attesi presenti sul primo
const f = subset[0];
const okFields = ["task_id", "prompt", "entry_point", "test"].every((k) => k in f);
console.log(`campi attesi sul primo task: ${okFields ? "OK" : "MANCANTI"} (${Object.keys(f).join(", ")})`);
process.exit(okFields ? 0 : 2);

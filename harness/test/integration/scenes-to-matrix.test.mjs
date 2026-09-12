/**
 * scenes-to-matrix: dal jsonl di run-scene-batch alla matrice task×competenza. Wiring reale (#14): jsonl su disco,
 * classe letta dal file di scena vero, CLI eseguita con spawnSync. Tre controlli: (1) una riga per braccio e la
 * classe giusta in colonna; (2) le celle contano k/n sui run; (3) --before/--after segnala la classe regredita.
 */
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { loadResults } from "../../eval/scenes-to-matrix.mjs";

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SCENE = "verifiers/self-sealing-A1-canary.json"; // esiste e dichiara _meta.class
let passed = 0, failed = 0;
const ok = (c, m) => { if (c) passed++; else { failed++; console.error("  ✗ FAIL:", m); } };

const run = (scade, definitiva) => JSON.stringify({ model: "m", arm: "vanilla", scene: SCENE, passed: scade && definitiva,
  full: { arms: [{ name: "scade", passed: scade }, { name: "definitiva", passed: definitiva }] } });
const dir = mkdtempSync(join(tmpdir(), "s2m-"));
const before = join(dir, "before.jsonl"), after = join(dir, "after.jsonl");
writeFileSync(before, [run(true, true), run(true, false)].join("\n") + "\n");
writeFileSync(after, [run(false, false), run(false, true)].join("\n") + "\n");

// (1) righe per braccio + classe dalla scena
const g = loadResults([before]);
const rows = g.get("m · vanilla");
ok(rows && rows.length === 4, "4 risultati (2 run × 2 bracci)");
ok(rows.every((r) => r.skill === "class-self-sealing-decision"), "skill = _meta.class della scena");
ok(rows.some((r) => r.task === "self-sealing-A1-canary·scade"), "task = scena·braccio");

// (2) k/n per cella via CLI
const one = spawnSync(process.execPath, [join(HARNESS, "eval/scenes-to-matrix.mjs"), before], { encoding: "utf8" });
ok(one.status === 0, "cli senza confronto esce 0");
ok(/definitiva\s+1\/2/.test(one.stdout), "cella definitiva = 1/2 (un run su due)");
ok(/scade\s+2\/2/.test(one.stdout), "cella scade = 2/2");

// (3) regressione prima→dopo (75% → 25%)
const cmp = spawnSync(process.execPath, [join(HARNESS, "eval/scenes-to-matrix.mjs"), "--before", before, "--after", after], { encoding: "utf8" });
ok(cmp.status === 1, "con una classe regredita esce 1 (blocco)");
ok(/REGREDITI: class-self-sealing-decision 75%→25%/.test(cmp.stdout), "nomina la classe e i due rate");

rmSync(dir, { recursive: true, force: true });
console.log(`scenes-to-matrix test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

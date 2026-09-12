#!/usr/bin/env node
/**
 * scenes-to-matrix — le SCENE come righe della matrice task×competenza (todo 2026-09-11, msg 2210: un gruppo di
 * classi alla volta, matrice PRIMA e DOPO, regressione = blocco).
 *
 * Legge i jsonl prodotti da `eval/run-scene-batch.mjs` (una riga per run: scene, model, arm, full.arms[]) e li
 * traduce in risultati `{task, skill, pass}` per `eval/competence-matrix.mjs` (SSOT dell'aggregazione):
 *   task  = <scena>·<braccio della coppia>   (una riga per braccio: k0, scade, scarso… — è lì che si legge)
 *   skill = la classe che la scena misura (`_meta.class` del file di scena, letto da disco: nessuna copia)
 *   pass  = il braccio ha passato tutti i suoi assert
 *
 * USO:  node eval/scenes-to-matrix.mjs a.jsonl b.jsonl …                    → una matrice per (modello, braccio harness)
 *       node eval/scenes-to-matrix.mjs --before a.jsonl … --after b.jsonl …  → due matrici + skill REGREDITI (forgetting)
 *
 * Limite dichiarato: una scena misura UNA classe → ogni riga ha una sola cella piena; la matrice serve al confronto
 * prima/dopo per classe (colonna), non a leggere composizioni fra classi nella stessa riga.
 */
import { readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildMatrix, detectRegression, renderMatrix } from "./competence-matrix.mjs";

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const classCache = new Map();

/** classe misurata dalla scena (dal suo `_meta.class`); il path nel jsonl è relativo a harness/. */
function sceneClass(scenePath) {
  if (!classCache.has(scenePath)) {
    let cls = "?";
    try { cls = JSON.parse(readFileSync(resolve(HARNESS, scenePath), "utf8"))._meta?.class ?? "?"; } catch { /* scena non trovata: resta "?" */ }
    classCache.set(scenePath, cls);
  }
  return classCache.get(scenePath);
}

/** jsonl → risultati per la matrice, raggruppati per "<modello> · <braccio harness>". */
export function loadResults(files) {
  const groups = new Map();
  for (const f of files) {
    for (const line of readFileSync(f, "utf8").split("\n").filter(Boolean)) {
      const run = JSON.parse(line);
      const key = `${run.model} · ${run.arm}`;
      const skill = sceneClass(run.scene);
      const scene = basename(run.scene, ".json");
      const arms = run.full?.arms ?? [{ name: "-", passed: run.passed }];
      for (const a of arms) (groups.get(key) ?? groups.set(key, []).get(key)).push({ task: `${scene}·${a.name}`, skill, pass: !!a.passed });
    }
  }
  return groups;
}

function matrixOf(results) { return buildMatrix(results, { skills: [] }); }

function main(argv) {
  const before = [], after = [], plain = [];
  let bucket = plain;
  for (const a of argv) {
    if (a === "--before") bucket = before;
    else if (a === "--after") bucket = after;
    else bucket.push(a);
  }
  if (before.length && after.length) {
    const b = [...loadResults(before).values()].flat(), a = [...loadResults(after).values()].flat();
    const mb = matrixOf(b), ma = matrixOf(a);
    console.log("PRIMA\n" + renderMatrix(mb) + "\n\nDOPO\n" + renderMatrix(ma));
    const reg = detectRegression(mb, ma);
    console.log(reg.length ? "\n🔴 REGREDITI: " + reg.map((r) => `${r.skill} ${Math.round(r.before * 100)}%→${Math.round(r.after * 100)}%`).join(" · ") : "\n✅ nessuna classe regredita");
    return reg.length ? 1 : 0;
  }
  const files = plain.length ? plain : before.concat(after);
  if (!files.length) { console.error("uso: scenes-to-matrix <jsonl…> | --before <jsonl…> --after <jsonl…>"); return 2; }
  for (const [key, results] of loadResults(files)) console.log(`\n## ${key}\n` + renderMatrix(matrixOf(results)));
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));

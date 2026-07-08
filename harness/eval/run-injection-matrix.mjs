/**
 * run-injection-matrix — driver del test LIVE di resistenza a prompt-injection (T6, ordine utente msg 1346:
 * "procedi finché le quote gratuite non terminano"). Cicla {kind × modalità} spawnando `run-injection.mjs` per cella
 * (isolamento stato/workdir per cella), con PACING tra le chiamate e STOP automatico a quota esaurita.
 *
 * DISCIPLINA DI VALIDITÀ (rule #14): una cella con apiError/quota/timeout è INVALIDA (valid:false), NON "resistita".
 * Il summary separa valid/invalid e calcola la resistenza SOLO sulle celle valide → nessun falso "100% RESISTED".
 * Onestà anti-silent-truncation: se ci fermiamo per quota, il report dice quante celle sono rimaste non-misurate.
 *
 * Config (env):
 *   MODEL_ID     (default gemini-3.1-flash-lite)   — ordine: flash-lite → flash → gemma-26b → 9b
 *   KINDS        (default "critical" | "all")       — quali kind ciclare
 *   PACE_MS      (default 2500)                      — pausa tra celle (rate-limit friendly)
 *   QUOTA_STOP   (default 10)                         — N apiError CONSECUTIVI ⇒ quota esaurita ⇒ stop
 *   MAX_CELLS    (default 0 = tutte)                  — cap opzionale
 *   OUT          (default scratchpad/injection-matrix-<model>.jsonl)
 *   INJ_TIMEOUT_MS (default 90000)
 *
 * NON stampa MAI key/secret (li gestisce run-injection.mjs). Output: JSONL per-cella + summary finale su stdout.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { INJECTION_KINDS, INJECTION_MODALITIES, criticalKinds } from "../verifiers/injection-suite.mjs";
import { loadGeminiKeys } from "./gemini-keys.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUNNER = join(__dirname, "run-injection.mjs");

const MODEL_ID = process.env.MODEL_ID || "gemini-3.1-flash-lite";
const KINDS_SET = (process.env.KINDS || "critical").toLowerCase() === "all" ? Object.keys(INJECTION_KINDS) : criticalKinds();
const MODALITIES = Object.keys(INJECTION_MODALITIES);
const PACE_MS = Number(process.env.PACE_MS || 2500);
const QUOTA_STOP = Number(process.env.QUOTA_STOP || 10);
const MAX_CELLS = Number(process.env.MAX_CELLS || 0);
const TIMEOUT = Number(process.env.INJ_TIMEOUT_MS || 90000);
const OUT = process.env.OUT || join(process.env.SCRATCH || tmpdir(), `injection-matrix-${MODEL_ID.replace(/[^\w.-]/g, "_")}.jsonl`);

const NKEYS = (() => { try { return loadGeminiKeys().length || 1; } catch { return 1; } })();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Spawna il runner single-cell; ritorna il JSON dell'ultima riga stdout (o un oggetto apiError se il processo fallisce). */
function runCell(kind, modality, keyIndex) {
  return new Promise((resolvePromise) => {
    const workdir = mkdtempSync(join(tmpdir(), "inj-wd-"));
    const stateDir = mkdtempSync(join(tmpdir(), "inj-st-"));
    mkdirSync(workdir, { recursive: true });
    const env = { ...process.env, MODEL_ID, INJ_KIND: kind, INJ_MODALITY: modality,
      EVAL_WORKDIR: workdir, HARNESS_STATE_DIR: stateDir, EVAL_KEY_INDEX: String(keyIndex), INJ_TIMEOUT_MS: String(TIMEOUT) };
    const child = spawn(process.execPath, [RUNNER], { env, cwd: resolve(__dirname, "..") });
    let out = "", err = "";
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { err += d; });
    const killer = setTimeout(() => { try { child.kill("SIGKILL"); } catch {} }, TIMEOUT + 30000);
    child.on("close", (code) => {
      clearTimeout(killer);
      // ultima riga JSON valida dello stdout
      let parsed = null;
      for (const line of out.trim().split(/\r?\n/).reverse()) {
        try { const o = JSON.parse(line); if (o && typeof o === "object") { parsed = o; break; } } catch { /* non-JSON */ }
      }
      if (!parsed) parsed = { mode: "injection", model: MODEL_ID, kind, modality, valid: false, resisted: null,
        apiError: true, error: (err.trim().split(/\r?\n/).pop() || `exit ${code}, no JSON`).slice(0, 200) };
      resolvePromise(parsed);
    });
  });
}

async function main() {
  const cells = [];
  for (const k of KINDS_SET) for (const m of MODALITIES) cells.push({ kind: k, modality: m });
  const total = MAX_CELLS > 0 ? Math.min(MAX_CELLS, cells.length) : cells.length;
  writeFileSync(OUT, ""); // reset
  console.error(`[matrix] model=${MODEL_ID} kinds=${KINDS_SET.length} modalities=${MODALITIES.length} cells=${total} keys=${NKEYS} pace=${PACE_MS}ms out=${OUT}`);

  let valid = 0, invalid = 0, resisted = 0, breached = 0, consecApiErr = 0, done = 0;
  const breaches = [];
  for (let i = 0; i < total; i++) {
    const { kind, modality } = cells[i];
    const res = await runCell(kind, modality, i % NKEYS);
    done++;
    const isApiErr = res.valid === false || res.apiError === true;
    appendFileSync(OUT, JSON.stringify({ i, kind, modality, valid: !isApiErr, resisted: res.resisted ?? null, breaches: res.breaches ?? res.breachReasons ?? null, err: res.error ?? null }) + "\n");
    if (isApiErr) {
      invalid++; consecApiErr++;
      console.error(`[${i + 1}/${total}] ${kind}/${modality} → INVALID (${String(res.error || "apiError").slice(0, 60)}) [consec=${consecApiErr}]`);
      if (consecApiErr >= QUOTA_STOP) { console.error(`[matrix] STOP: ${consecApiErr} apiError consecutivi ⇒ quota verosimilmente esaurita.`); break; }
    } else {
      consecApiErr = 0; valid++;
      if (res.resisted === false) { breached++; breaches.push(`${kind}/${modality}`); console.error(`[${i + 1}/${total}] ${kind}/${modality} → ⚠️ BREACH`); }
      else { resisted++; console.error(`[${i + 1}/${total}] ${kind}/${modality} → resisted`); }
    }
    if (i < total - 1) await sleep(PACE_MS);
  }

  const summary = { mode: "injection-matrix", model: MODEL_ID, cells_planned: total, cells_run: done,
    valid, invalid, resisted, breached, resistance_rate: valid ? +(resisted / valid).toFixed(3) : null,
    not_measured: total - done, breaches, out: OUT, stopped_for_quota: consecApiErr >= QUOTA_STOP };
  console.log(JSON.stringify(summary, null, 2));
  appendFileSync(OUT, JSON.stringify({ summary }) + "\n");
}

main().catch((e) => { console.error(JSON.stringify({ mode: "injection-matrix", error: String(e?.stack ?? e) })); process.exit(1); });

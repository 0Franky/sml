/**
 * harness-config — configurazione OPT-IN del "context-budget" (idea utente TG 2026-06-29 msg 520).
 *
 * Il "context-shift / headroom" (a quale % di riempimento consideri il contesto pieno → compatta/focalizza)
 * e la finestra messaggi sono **parametri configurabili**, così **ognuno li tara per la propria infrastruttura
 * e modello**: un modello a contesto piccolo (es. il nostro SLM 4B) compatta PRIMA (soglie basse) per restare nel
 * regime di qualità alta; un modello a contesto grande (es. Claude Sonnet) può alzare le soglie e compattare DOPO,
 * senza penalizzare le prestazioni. **Opt-in**: senza config si usano i default (comportamento attuale invariato).
 *
 * Fonti, in ordine di precedenza (l'ultima vince):
 *   1. DEFAULT (= DEFAULT_CFG di nested-compact + messagesWindowN) — tarato per il nostro SLM piccolo
 *   2. file `.pi/harness.config.json` (utente, gitignored; vedi `.pi/harness.config.example.json`)
 *   3. variabili d'ambiente `HARNESS_*` (override rapido, es. per A/B)
 *
 * Fail-safe: config malformata / fuori-range → ignorata, si ricade sui default (mai rompere il boot).
 */
import { readFileSync, existsSync } from "node:fs";
import { DEFAULT_CFG } from "./nested-compact.mjs";

/** Config di default = soglie trigger (DEFAULT_CFG) + finestra lane messaggi. */
export const DEFAULT_HARNESS_CONFIG = {
  trigger: { ...DEFAULT_CFG }, // tokenReorderPct, tokenMatrioskaPct, watchReorder, watchMatrioska, maxDepth, focusK
  messagesWindowN: 8, // turni verbatim mostrati nella lane <messages_with_user>
};

const DEFAULT_PATH = ".pi/harness.config.json";

/** Range validi per i campi trigger (fuori-range → scartato, resta il default). */
const TRIGGER_BOUNDS = {
  tokenReorderPct: [0, 1],
  tokenMatrioskaPct: [0, 1],
  watchReorder: [1, 100000],
  watchMatrioska: [1, 100000],
  maxDepth: [1, 16],
  focusK: [1, 1000],
};

/** Ritorna `val` se è un numero finito dentro il range di `key`, altrimenti undefined (→ resta il default). */
function clampField(key, val) {
  const b = TRIGGER_BOUNDS[key];
  if (!b || typeof val !== "number" || !Number.isFinite(val)) return undefined;
  return val < b[0] || val > b[1] ? undefined : val;
}

/** Applica SOLO i campi trigger noti e in-range da `src` su `dst` (in place). */
function applyTrigger(dst, src) {
  if (!src || typeof src !== "object") return;
  for (const key of Object.keys(TRIGGER_BOUNDS)) {
    const v = clampField(key, src[key]);
    if (v !== undefined) dst[key] = v;
  }
}

const ENV_MAP = {
  HARNESS_TOKEN_REORDER_PCT: ["trigger", "tokenReorderPct"],
  HARNESS_TOKEN_MATRIOSKA_PCT: ["trigger", "tokenMatrioskaPct"],
  HARNESS_WATCH_REORDER: ["trigger", "watchReorder"],
  HARNESS_WATCH_MATRIOSKA: ["trigger", "watchMatrioska"],
  HARNESS_MAX_DEPTH: ["trigger", "maxDepth"],
  HARNESS_MESSAGES_WINDOW_N: ["root", "messagesWindowN"],
};

/**
 * Carica la config harness effettiva (default → file opt-in → env). Mai lancia (fail-safe ai default).
 * @param {string} [path] path del file config (default `.pi/harness.config.json`)
 * @param {{ env?: Record<string,string|undefined> }} [opts] env iniettabile per i test
 * @returns {{ trigger: typeof DEFAULT_CFG, messagesWindowN: number }}
 */
export function loadHarnessConfig(path = DEFAULT_PATH, opts = {}) {
  const cfg = { trigger: { ...DEFAULT_HARNESS_CONFIG.trigger }, messagesWindowN: DEFAULT_HARNESS_CONFIG.messagesWindowN };
  // 2) file opt-in
  try {
    if (existsSync(path)) {
      const f = JSON.parse(readFileSync(path, "utf-8"));
      applyTrigger(cfg.trigger, f && f.trigger);
      if (typeof f?.messagesWindowN === "number" && Number.isFinite(f.messagesWindowN) && f.messagesWindowN >= 1) {
        cfg.messagesWindowN = Math.floor(f.messagesWindowN);
      }
    }
  } catch {
    /* config malformata → default (fail-safe) */
  }
  // 3) env override (vince sul file)
  const env = opts.env ?? process.env;
  for (const [envKey, [grp, field]] of Object.entries(ENV_MAP)) {
    const raw = env[envKey];
    if (raw == null || raw === "") continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    if (grp === "trigger") {
      const v = clampField(field, n);
      if (v !== undefined) cfg.trigger[field] = v;
    } else if (field === "messagesWindowN" && n >= 1) {
      cfg.messagesWindowN = Math.floor(n);
    }
  }
  return cfg;
}

export default { loadHarnessConfig, DEFAULT_HARNESS_CONFIG };

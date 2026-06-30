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

/** Modalità di enforcement del gathering pre-focus (msg 528/531). */
export const GATHERING_MODES = ["delegated", "inject", "require"];

/** Modalità di autofocus (OQ-A, msg 551): off=nessun segnale · nudge=focus_hint (default) · auto=auto-enter deterministico. */
export const AUTOFOCUS_MODES = ["off", "nudge", "auto"];

/** Modalità di sink-gating dei sealed-secrets (msg 577): strict=allow-host fail-closed (default) · warn · off. */
export const SINK_GATING_MODES = ["strict", "warn", "off"];
/** Modalità di regex-ingress dei secret (msg 578/579): off · ask=chiedi conferma · auto=sigilla high-confidence. */
export const REGEX_INGRESS_MODES = ["off", "ask", "auto"];

/** Config di default = soglie trigger (DEFAULT_CFG) + finestra lane messaggi + enforcement gathering. */
export const DEFAULT_HARNESS_CONFIG = {
  trigger: { ...DEFAULT_CFG }, // tokenReorderPct, tokenMatrioskaPct, watchReorder, watchMatrioska, maxDepth, focusK
  messagesWindowN: 8, // turni verbatim mostrati nella lane <messages_with_user>
  // gathering (focus-gathering v1): QUANTO è forzato il "guarda l'ordine dei task prima di entrare a fuoco".
  //   delegated = il modello decide (default, lean/anti-cerimonia); inject = l'harness inietta la vista ordinata nel
  //   focus_hint (anti-cecità, low-ceremony); require = enter_focus è bloccato finché non chiami get_execution_order.
  // minTasksForForce = gate proporzionalità: inject/require agiscono SOLO con ≥ N task open (sotto → no-op).
  gathering: { mode: "delegated", minTasksForForce: 5 },
  // autofocus (OQ-A, msg 551): CHI decide di entrare in focus sotto pressione.
  //   off = nessun segnale (il modello fa di testa sua); nudge = l'harness SUGGERISCE col <focus_hint> e decide il
  //   modello (DEFAULT, invariato); auto = l'harness ENTRA in focus DA SOLO (deterministico) sui task ready quando la
  //   pressione è matrioska — rete di sicurezza per un modello che non si auto-organizza (es. SLM piccolo).
  autofocus: { mode: "nudge" },
  // secrets (sealed-secrets, msg 577/578/579): sink-gating dell'uso di `{{secret:NAME}}` + regex-ingress.
  //   sinkGating: strict (allow-host fail-closed, DEFAULT) | warn | off.
  //   regexIngress: off | ask (DEFAULT) | auto — CABLATA all'hook `input` (secrets-guardrail): cattura valori
  //   secret-shaped incollati e li sigilla+trasforma PRIMA che vadano al provider. ask=notifica warning, auto=info.
  //   allowSecretToFile: true (DEFAULT, opt-OUT, utente msg 638) — il modello può iniettare un sealed-secret in un tool
  //   di scrittura-file (.env provisioning locale); false → bloccato (kill-switch per chi teme exfil-via-file).
  secrets: { sinkGating: "strict", regexIngress: "ask", allowSecretToFile: true },
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
  outputReservePct: [0, 0.9], // riserva fisica per output+thinking (msg 518)
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

/** Applica i campi `gathering` validi da `src` su `dst` (in place). mode fuori-enum / minTasks <1 → ignorati. */
function applyGathering(dst, src) {
  if (!src || typeof src !== "object") return;
  if (typeof src.mode === "string" && GATHERING_MODES.includes(src.mode)) dst.mode = src.mode;
  if (typeof src.minTasksForForce === "number" && Number.isFinite(src.minTasksForForce) && src.minTasksForForce >= 1) {
    dst.minTasksForForce = Math.floor(src.minTasksForForce);
  }
}

/** Applica i campi `autofocus` validi da `src` su `dst` (in place). mode fuori-enum → ignorato (resta default). */
function applyAutofocus(dst, src) {
  if (!src || typeof src !== "object") return;
  if (typeof src.mode === "string" && AUTOFOCUS_MODES.includes(src.mode)) dst.mode = src.mode;
}

/** Applica i campi `secrets` validi da `src` su `dst` (in place). mode fuori-enum → ignorato (resta default). */
function applySecrets(dst, src) {
  if (!src || typeof src !== "object") return;
  if (typeof src.sinkGating === "string" && SINK_GATING_MODES.includes(src.sinkGating)) dst.sinkGating = src.sinkGating;
  if (typeof src.regexIngress === "string" && REGEX_INGRESS_MODES.includes(src.regexIngress)) dst.regexIngress = src.regexIngress;
  if (typeof src.allowSecretToFile === "boolean") dst.allowSecretToFile = src.allowSecretToFile;
}

const ENV_MAP = {
  HARNESS_TOKEN_REORDER_PCT: ["trigger", "tokenReorderPct"],
  HARNESS_TOKEN_MATRIOSKA_PCT: ["trigger", "tokenMatrioskaPct"],
  HARNESS_WATCH_REORDER: ["trigger", "watchReorder"],
  HARNESS_WATCH_MATRIOSKA: ["trigger", "watchMatrioska"],
  HARNESS_MAX_DEPTH: ["trigger", "maxDepth"],
  HARNESS_OUTPUT_RESERVE_PCT: ["trigger", "outputReservePct"],
  HARNESS_MESSAGES_WINDOW_N: ["root", "messagesWindowN"],
};

/**
 * Carica la config harness effettiva (default → file opt-in → env). Mai lancia (fail-safe ai default).
 * @param {string} [path] path del file config (default `.pi/harness.config.json`)
 * @param {{ env?: Record<string,string|undefined> }} [opts] env iniettabile per i test
 * @returns {{ trigger: typeof DEFAULT_CFG, messagesWindowN: number }}
 */
export function loadHarnessConfig(path = DEFAULT_PATH, opts = {}) {
  const cfg = {
    trigger: { ...DEFAULT_HARNESS_CONFIG.trigger },
    messagesWindowN: DEFAULT_HARNESS_CONFIG.messagesWindowN,
    gathering: { ...DEFAULT_HARNESS_CONFIG.gathering },
    autofocus: { ...DEFAULT_HARNESS_CONFIG.autofocus },
    secrets: { ...DEFAULT_HARNESS_CONFIG.secrets },
  };
  // 2) file opt-in
  try {
    if (existsSync(path)) {
      const f = JSON.parse(readFileSync(path, "utf-8"));
      applyTrigger(cfg.trigger, f && f.trigger);
      applyGathering(cfg.gathering, f && f.gathering);
      applyAutofocus(cfg.autofocus, f && f.autofocus);
      applySecrets(cfg.secrets, f && f.secrets);
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
  // gathering env (mode = stringa-enum, fuori dallo schema numerico di ENV_MAP)
  if (typeof env.HARNESS_GATHERING_MODE === "string" && GATHERING_MODES.includes(env.HARNESS_GATHERING_MODE)) {
    cfg.gathering.mode = env.HARNESS_GATHERING_MODE;
  }
  const minT = Number(env.HARNESS_GATHERING_MIN_TASKS);
  if (Number.isFinite(minT) && minT >= 1) cfg.gathering.minTasksForForce = Math.floor(minT);
  if (typeof env.HARNESS_AUTOFOCUS_MODE === "string" && AUTOFOCUS_MODES.includes(env.HARNESS_AUTOFOCUS_MODE)) {
    cfg.autofocus.mode = env.HARNESS_AUTOFOCUS_MODE;
  }
  if (typeof env.HARNESS_SECRETS_SINK_GATING === "string" && SINK_GATING_MODES.includes(env.HARNESS_SECRETS_SINK_GATING)) {
    cfg.secrets.sinkGating = env.HARNESS_SECRETS_SINK_GATING;
  }
  if (typeof env.HARNESS_SECRETS_REGEX_INGRESS === "string" && REGEX_INGRESS_MODES.includes(env.HARNESS_SECRETS_REGEX_INGRESS)) {
    cfg.secrets.regexIngress = env.HARNESS_SECRETS_REGEX_INGRESS;
  }
  if (env.HARNESS_SECRETS_ALLOW_FILE != null && env.HARNESS_SECRETS_ALLOW_FILE !== "") {
    cfg.secrets.allowSecretToFile = env.HARNESS_SECRETS_ALLOW_FILE !== "false" && env.HARNESS_SECRETS_ALLOW_FILE !== "0";
  }
  return cfg;
}

export default { loadHarnessConfig, DEFAULT_HARNESS_CONFIG };

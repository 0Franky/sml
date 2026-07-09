/**
 * keepturns — keepTurns EFFETTIVO, model-controlled (utente msg 1062).
 *
 * Il modello può allocarsi più/meno finestra NATIVA a runtime col tool set_keepturns(n): utile su task genuinamente
 * STATEFUL (serve memoria a breve termine cross-turno). ⚠ MA "bloccato → più keepTurns" può essere SBAGLIATO: su una
 * FISSAZIONE più contesto DILUISCE il ragionamento (H6) — la cura è lo STEP-BACK, non più memoria. La DECISIONE (quando
 * alzare/abbassare) è una SKILL da addestrare; qui c'è solo il MECCANISMO (F-harness, classificazione regola #11). Il
 * default vive nella config (SSOT `nativeKeepTurns`); l'override sta in un meta condiviso cross-extension. Cap sul MAX
 * (anti context-bloat se il modello alza e non riabbassa). Vedi wiki/concepts/adaptive-context-injection.md §3b.
 */
import { loadHarnessConfig } from "./harness-config.mjs";

export const KEEPTURNS_MAX = 20;                         // cap sul massimo (SSOT)
export const KEEPTURNS_OVERRIDE_META = "keepturns_override";

/**
 * keepTurns EFFETTIVO = override del modello (valido, clampato [1, MAX]) se presente, altrimenti default config.
 * Fail-safe: qualunque errore/valore-non-valido → default. @param {import("./vars-queue.mjs").VarsQueue} vq
 */
export function getEffectiveKeepTurns(vq, configDefault = null) {
  const def = Number.isInteger(configDefault) ? configDefault : loadHarnessConfig().nativeKeepTurns;
  try {
    const raw = vq?.getMeta?.(KEEPTURNS_OVERRIDE_META);
    if (raw == null || raw === "") return def;
    const n = parseInt(raw, 10);
    if (!Number.isInteger(n) || n < 1) return def;
    return Math.min(n, KEEPTURNS_MAX);
  } catch { return def; }
}

/**
 * keepTurns ADATTIVO alla PRESSIONE (utente msg 1434, opt-in, DEFAULT OFF). Implementazione runtime di F32
 * ("l'harness-memoria paga SOLO in overflow"): finché il contesto è poco pieno (fill < soglia) tieni keepTurns ALTO
 * (`highKeep`, praticamente illimitato) → il modello vede TUTTA la conversazione nell'array nativo = regime VANILLA,
 * nessuna compressione; appena il fill supera la soglia → SCENDI a `lowKeep` (= nativeKeepTurns) = regime harness-
 * compresso, dove le lane (già riempite) subentrano. La CATTURA resta sempre-on (task-digest/note/lane facts sono
 * INDIPENDENTI da keepTurns) → i fatti durevoli sono già persistiti quando si comprime (era la preoccupazione dell'utente).
 * Fail-safe: usage assente / tokens non-finito (primi turni, nessuna richiesta fatturata ancora) → `highKeep` (parti
 * VANILLA, come richiesto). Vedi [[concepts/adaptive-context-injection]] §pressure-adaptive + harness-config.mjs.
 * @param {{tokens?:number|null, contextWindow?:number|null}|undefined} usage  da ctx.getContextUsage()
 * @param {{lowThreshold:number, highKeep:number}} cfg  soglia-fill + keepTurns "vanilla"
 * @param {number} lowKeep  keepTurns del regime compresso (SSOT = nativeKeepTurns)
 * @param {number} [outputReservePct=0]  riserva output (allineato a collectMetrics: percent = tokens/(win*(1-reserve)))
 * @returns {number}  keepTurns effettivo (NON clampato al MAX: highKeep può superare KEEPTURNS_MAX di proposito)
 */
export function adaptiveKeepTurns(usage, cfg, lowKeep, outputReservePct = 0) {
  const tokens = usage?.tokens;
  const win = usage?.contextWindow;
  if (!Number.isFinite(tokens) || !Number.isFinite(win) || win <= 0) return cfg.highKeep; // no misura → vanilla
  const reserve = Number.isFinite(outputReservePct) ? outputReservePct : 0;
  const denom = win * (1 - reserve);
  const pct = denom > 0 ? tokens / denom : 0;
  return pct >= cfg.lowThreshold ? lowKeep : cfg.highKeep;
}

/**
 * Setta l'override del modello. n valido → clampa [1, MAX] e persiste. n null/<1/NaN → RIMUOVE l'override (default).
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @returns {{effective:number, overridden:boolean, def:number}}
 */
export function setKeepTurnsOverride(vq, n) {
  const def = loadHarnessConfig().nativeKeepTurns;
  const parsed = Math.trunc(Number(n));
  if (!Number.isFinite(parsed) || parsed < 1) {
    vq.setMeta(KEEPTURNS_OVERRIDE_META, null);
    return { effective: def, overridden: false, def };
  }
  const clamped = Math.min(Math.max(parsed, 1), KEEPTURNS_MAX);
  vq.setMeta(KEEPTURNS_OVERRIDE_META, clamped);
  return { effective: clamped, overridden: true, def };
}

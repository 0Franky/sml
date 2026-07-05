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

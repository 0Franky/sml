/**
 * scratch.mjs — SCRATCHPAD VOLATILE rolling (namespace 'scratch'), DISTINTO dai <facts> durevoli.
 *
 * Difetto di design risolto (utente msg 1134): `note()` salva un fatto DUREVOLE (lane <facts>, sopravvive a
 * finestra+compact). Mancava il layer VOLATILE che l'utente intende per "note": lo stato dell'indagine in corso
 * ("ho provato X, fallito perché Y") da salvare a fine-turno e che **rolla via** da solo. Questo modulo lo fornisce:
 *   - `jot(text)`     → appende una nota volatile (namespace 'scratch').
 *   - ROLLING          → si mostrano le più RECENTI (cap display) e lo STORE si auto-pota (cap store): le vecchie spariscono.
 *   - `recall_scratch` → l'affordance "allunga la finestra": on-demand ritorna più note senza gonfiare il context.
 *   - `clear_scratch`  → "al più dopo le cancelli".
 * Le note NON sono durevoli come i <facts>: sono un esternalizzatore di working-memory dell'indagine (§3 di
 * ../../wiki/concepts/stuck-state-focus-protocol.md). namespace 'scratch' è SILENT (fuori da <recent_changes>).
 *
 * PURO/testabile: le funzioni prendono `vq` (duck-typed) e chiavi/tempo INIETTATI → deterministiche. La generazione
 * della chiave (Date.now()/rand) vive nell'estensione TS, non qui.
 */

/** Namespace SQLite delle note volatili (deve essere in SILENT_NAMESPACES di vars-queue). */
export const SCRATCH_NS = "scratch";
/** Quante note mostrare nella lane <scratch> (le più recenti). SSOT del display-cap. */
export const DEFAULT_MAX_SCRATCH = 6;
/** Quante note tenere nello store prima di potare le più vecchie (rolling). SSOT dello store-cap. */
export const SCRATCH_STORE_CAP = 30;

/**
 * listScratch — tutte le note volatili, dalla più RECENTE alla più vecchia (ts desc, tiebreak key desc).
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @returns {{key:string, text:string, ts:number}[]}
 */
export function listScratch(vq) {
  return vq.listVars({ namespace: SCRATCH_NS })
    .map((v) => ({
      key: String(v.id).replace(/^scratch:/, ""),
      text: v.value && typeof v.value === "object" ? String(v.value.text ?? "") : String(v.value ?? ""),
      ts: v.value && typeof v.value === "object" && Number.isFinite(v.value.ts) ? Number(v.value.ts) : Number(v.last_modified) || 0,
    }))
    .filter((s) => s.text)
    .sort((a, b) => (b.ts - a.ts) || String(b.key).localeCompare(String(a.key)));
}

/**
 * jotScratch — appende una nota volatile, poi POTA lo store alle `storeCap` più recenti (rolling).
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {string} text
 * @param {{ key: string, now?: number, storeCap?: number }} opts  `key` OBBLIGATORIA (generata dal chiamante = deterministico).
 * @returns {{ key: string, pruned: number }}
 */
export function jotScratch(vq, text, { key, now = Date.now(), storeCap = SCRATCH_STORE_CAP } = {}) {
  const t = String(text ?? "").trim();
  if (!t) throw new Error("jot: empty text");
  if (!key) throw new Error("jotScratch: key required");
  vq.setVar(`scratch:${key}`, { text: t, ts: now }, { namespace: SCRATCH_NS, scope: "private", who: vq.agent });
  const pruned = pruneScratch(vq, { storeCap });
  return { key, pruned };
}

/**
 * pruneScratch — tiene solo le `storeCap` note più recenti, rimuove le più vecchie (semantica rolling-window).
 * @returns {number} quante ne ha rimosse
 */
export function pruneScratch(vq, { storeCap = SCRATCH_STORE_CAP } = {}) {
  const all = listScratch(vq); // recenti prima
  const drop = all.slice(storeCap);
  for (const s of drop) vq.removeVar(`scratch:${s.key}`);
  return drop.length;
}

/**
 * recallScratch — l'affordance "allunga la finestra": ritorna fino a `limit` note (più recenti prima), on-demand.
 * @returns {{key:string, text:string, ts:number}[]}
 */
export function recallScratch(vq, { limit = 20 } = {}) {
  const n = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
  return listScratch(vq).slice(0, n);
}

/** clearScratch — rimuove TUTTE le note volatili. @returns {number} quante ne ha rimosse. */
export function clearScratch(vq) {
  const all = listScratch(vq);
  for (const s of all) vq.removeVar(`scratch:${s.key}`);
  return all.length;
}

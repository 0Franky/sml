/**
 * task-digest — CATTURA DETERMINISTICA della task-history (lane-persistence-redesign, F24 / utente msg 1256).
 *
 * Problema (F23/F24): la memoria-lane dipende dal fatto che il MODELLO salvi con note(), e i modelli capaci NON
 * salvano la task-history (F23) o deflettono (F24: "ho salvato, pronto per il summary" invece di rispondere → recall 0%).
 * Fix: l'HARNESS estrae il digest di ciò che il modello HA FATTO dalla traccia-tool che ha GIÀ OSSERVATO — indipendente
 * dal salvataggio del modello. Questo modulo è la parte PURA (creazione+contenuto); la ritenzione riusa il meccanismo
 * `importance` esistente (context-assembler.mjs, "pinned in cima") scrivendo il digest a importance MAX.
 *
 * PURO + deterministico → unit-testabile senza modello (disciplina #14: pura+test prima del wiring live).
 */

// Memory-op del modello: si ESCLUDONO dal digest (F24: non sono "cosa ha fatto sul task"; e non devono dominare).
export const MEMORY_TOOLS = new Set([
  "note", "jot", "set_var", "get_var", "remove_note", "recall_scratch",
  "record_decision", "get_decisions", "list_secrets", "get_shared_view",
]);
// Tool di sola-lettura/navigazione: non sono OUTCOME di task → esclusi (riducono rumore).
export const READONLY_TOOLS = new Set([
  "find_tool", "open_category", "ls", "read_file", "grep", "glob", "cat",
]);

// Rilevamento file-write AGNOSTICO al nome-tool (robusto a varianti write_file/create_file/apply_patch/editor):
// si basa sulla FORMA degli args (un campo path-like + un campo content-like) invece che su una whitelist di nomi.
const PATH_KEYS = ["path", "file_path", "filename", "target_file", "file"];
const CONTENT_KEYS = ["content", "file_text", "new_str", "text", "body"];
function firstKey(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) if (obj[k] != null) return obj[k];
  return null;
}
export function pathOf(args) { const v = firstKey(args, PATH_KEYS); return v == null ? null : String(v); }
export function contentOf(args) { const v = firstKey(args, CONTENT_KEYS); return v == null ? null : String(v); }

// Estrae i nomi di funzione/definizione dal content (Python def / class; JS function). È il segnale che la probe-recall
// richiede (il NOME esatto, non prosa). Deterministico.
const DEF_RE = /\b(?:def|class)\s+([A-Za-z_]\w*)|\bfunction\s+([A-Za-z_]\w*)|\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_]\w*)\s*=\s*(?:async\s*)?\(/g;
export function extractDefs(content) {
  const names = [];
  if (typeof content !== "string" || !content) return names;
  DEF_RE.lastIndex = 0;
  let m;
  while ((m = DEF_RE.exec(content)) !== null) {
    const name = m[1] || m[2] || m[3];
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

function basename(p) {
  if (!p) return "";
  const parts = String(p).split(/[\\/]/);
  return parts[parts.length - 1] || String(p);
}

/**
 * buildTaskDigest — dalla traccia-tool osservata → righe di digest compatte "file → def NAME[, …] (esito)".
 * @param {Array<{name?:string,args?:object,status?:string,result?:string,ts?:number}>} toolCalls
 * @param {{ maxLines?:number, maxDefsPerFile?:number }} [opts]
 * @returns {string[]} una riga per file-write significativo (ultimo stato per file), cap maxLines (più recenti)
 */
export function buildTaskDigest(toolCalls, { maxLines = 40, maxDefsPerFile = 6 } = {}) {
  if (!Array.isArray(toolCalls)) return [];
  // per-file: tieni l'ULTIMA scrittura (un file riscritto N volte → una riga, lo stato finale)
  const byFile = new Map(); // basename → { line, order }
  let order = 0;
  for (const tc of toolCalls) {
    const name = tc && tc.name ? String(tc.name) : "";
    if (!name || MEMORY_TOOLS.has(name) || READONLY_TOOLS.has(name)) continue;
    const args = tc.args || {};
    const p = pathOf(args);
    const c = contentOf(args);
    if (p == null || c == null) continue; // non è una scrittura-file → skip (v1 focalizzato sull'outcome-file)
    const defs = extractDefs(c).slice(0, maxDefsPerFile);
    const defPart = defs.length ? ` → ${defs.map((d) => "def " + d).join(", ")}` : "";
    const errPart = tc.status === "error" ? " (error)" : "";
    byFile.set(basename(p), { line: `${basename(p)}${defPart}${errPart}`, order: order++ });
  }
  const rows = [...byFile.values()].sort((a, b) => a.order - b.order).map((x) => x.line);
  return rows.slice(-maxLines);
}

export default { buildTaskDigest, extractDefs, pathOf, contentOf, MEMORY_TOOLS, READONLY_TOOLS };

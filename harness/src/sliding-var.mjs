/**
 * sliding-var — read/replace di una VAR per CHAR-RANGE con preview (sliding window).
 *
 * Implementa ../../wiki/concepts/sliding-window-variable-tool.md (idea utente 2026-05-21):
 * edit chirurgici su var grandi senza scaricarle full nel context. Opera sul valore (stringa)
 * di una var del datastore vars-queue. Preview-then-apply (default previewOnly) per safety.
 */

function asString(value) {
  return typeof value === "string" ? value : JSON.stringify(value);
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(n, hi));
}

/**
 * Legge uno slice [start,end) della var + ±contextAround char attorno.
 * @returns {{var_id, requested_range:[number,number], content, context_before, context_after, var_total_length} | {error:string}}
 */
export function slidingRead(vq, varId, start, end, contextAround = 0) {
  const v = vq.getVar(varId);
  if (!v) return { error: `var '${varId}' non trovata` };
  const s = asString(v.value);
  const a = clamp(start, 0, s.length);
  const b = clamp(end, a, s.length);
  const cb = clamp(a - contextAround, 0, s.length);
  const ca = clamp(b + contextAround, 0, s.length);
  return {
    var_id: varId,
    requested_range: [a, b],
    content: s.slice(a, b),
    context_before: s.slice(cb, a),
    context_after: s.slice(b, ca),
    var_total_length: s.length,
  };
}

/**
 * Sostituisce lo slice [start,end) con newContent. Default previewOnly=true (NON applica).
 * Per APPEND: start=end=var_total_length. Per INSERT: start=end=N.
 * @returns {{var_id, preview, diff_summary, applied, new_total_length} | {error:string}}
 */
export function slidingReplace(vq, varId, start, end, newContent, opts = {}) {
  const { contextAround = 0, previewOnly = true, who } = opts;
  const v = vq.getVar(varId);
  if (!v) return { error: `var '${varId}' non trovata` };
  const s = asString(v.value);
  const a = clamp(start, 0, s.length);
  const b = clamp(end, a, s.length);
  const next = s.slice(0, a) + String(newContent ?? "") + s.slice(b);
  const cb = clamp(a - contextAround, 0, next.length);
  const ca = clamp(a + String(newContent ?? "").length + contextAround, 0, next.length);
  let applied = false;
  if (!previewOnly) {
    vq.setVar(varId, next, { scope: v.scope, namespace: v.namespace, who: who ?? vq.agent });
    applied = true;
  }
  return {
    var_id: varId,
    preview: next.slice(cb, ca),
    diff_summary: `[-${b - a} char @${a}..${b}] [+${String(newContent ?? "").length} char]`,
    applied,
    new_total_length: next.length,
  };
}

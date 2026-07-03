/**
 * response-capture — estrazione PURA di un valore dalla risposta HTTP, per il RENEWAL dei sealed-secrets (utente msg 799).
 *
 * Caso d'uso: il modello chiama un endpoint /renew con la vecchia chiave ({{secret:OLD}}); l'API risponde con la chiave
 * AGGIORNATA nel body (o in un header). Qui si ESTRAE quel valore dal body RAW (lato-harness, prima della redazione) così
 * il chiamante (executeHttpRequest) lo ri-sigilla in-place: né la vecchia né la nuova chiave passano MAI dal modello.
 *
 * Spec `from` (una stringa):
 *   - `"$.a.b"` / `"a.b[0]"`  → JSON path sul body (dot + [index]); il `$`/`$.` iniziale è opzionale.
 *   - `"regex:PATTERN"`       → primo match sul body; usa il gruppo 1 se presente, altrimenti il match intero.
 *   - `"header:NAME"`         → header di risposta NAME (case-insensitive). NB: solo gli header in allow-list sono
 *                               disponibili (content-type/location/retry-after/www-authenticate) → per un token in un
 *                               header custom usa il body. Il caso tipico (OAuth) è un campo JSON nel body.
 *
 * Ritorna { ok:true, value } | { ok:false, reason }. NON logga né ritorna MAI il valore in un `reason`.
 */

/** Naviga un path dot/bracket su un oggetto JSON. `a.b[0].c` → parti [a,b,0,c]. Difensivo (null-safe). */
function getJsonPath(obj, path) {
  const parts = String(path)
    .split(/[.[]/)
    .map((p) => p.replace(/]$/, "").trim())
    .filter((p) => p !== "");
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * @param {string} body   body RAW della risposta
 * @param {Record<string,string>} headers  header di risposta (allow-listed, chiavi lowercase)
 * @param {string} from   spec di estrazione (vedi sopra)
 * @returns {{ok:true, value:string} | {ok:false, reason:string}}
 */
export function extractCaptureValue(body, headers, from) {
  const spec = String(from ?? "").trim();
  if (!spec) return { ok: false, reason: "empty capture.from spec" };

  if (spec.startsWith("header:")) {
    const h = spec.slice("header:".length).trim().toLowerCase();
    if (!h) return { ok: false, reason: "empty header name in capture.from" };
    const hobj = headers && typeof headers === "object" ? headers : {};
    const v = hobj[h] ?? hobj[h.toLowerCase()];
    if (v == null || String(v).length === 0) {
      return { ok: false, reason: `response header '${h}' not present (only allow-listed headers are available; use a body path for a custom token)` };
    }
    return { ok: true, value: String(v) };
  }

  if (spec.startsWith("regex:")) {
    const pat = spec.slice("regex:".length);
    if (!pat) return { ok: false, reason: "empty regex in capture.from" };
    let re;
    try { re = new RegExp(pat); } catch (e) { return { ok: false, reason: `invalid regex in capture.from: ${e && e.message ? e.message : "parse error"}` }; }
    const m = String(body ?? "").match(re);
    if (!m) return { ok: false, reason: "capture regex did not match the response body" };
    const val = m[1] != null ? m[1] : m[0];
    return val && val.length ? { ok: true, value: val } : { ok: false, reason: "capture regex matched an empty value" };
  }

  // default: JSON path sul body
  let json;
  try { json = JSON.parse(String(body ?? "")); } catch { return { ok: false, reason: "response body is not valid JSON (use 'regex:...' or 'header:...' for non-JSON responses)" }; }
  const path = spec.replace(/^\$\.?/, ""); // strip $ o $.
  const val = getJsonPath(json, path);
  if (val == null) return { ok: false, reason: `JSON path '${spec}' not found in the response` };
  if (typeof val !== "string") return { ok: false, reason: `JSON path '${spec}' is not a string (got ${Array.isArray(val) ? "array" : typeof val})` };
  return val.length ? { ok: true, value: val } : { ok: false, reason: `JSON path '${spec}' is an empty string` };
}

export default { extractCaptureValue };

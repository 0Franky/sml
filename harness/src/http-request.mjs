/**
 * http-request — executor del canale TIPIZZATO `http_request` (ADR 2026-06-30, arch H2).
 *
 * È il target DUREVOLE per l'uso dei sealed-secrets in rete: una richiesta TIPIZZATA (url/method/headers/body) invece
 * di shell free-form. Il sink-gating avviene sul SOLO host dell'URL (`injectTypedRequest` → `checkSinkTyped` → un
 * `new URL()`): niente shell da disambiguare → si eliminano `hasForeignHostToken`/`hasCommandComposition` per questa via.
 * La via bash con `{{secret:NAME}}` resta INVARIATA (additivo, nessuna regressione).
 *
 * `fetchImpl` è INIETTABILE → testabile con un fetch finto (no rete reale nei test, coerente con la test-policy MockAgent).
 * DIFESE: (a) solo http/https; (b) sink-gating fail-closed (se un secret è bloccato NON si invia nulla);
 * (c) `redirect:"manual"` → un 3xx verso un host diverso NON viene seguito col token (anti exfil-via-redirect);
 * (d) timeout; (e) body di risposta CAP-ato; (f) header di risposta ridotti a un allow-list (no dump di set-cookie).
 * La redazione egress della risposta è garantita a valle dall'hook `tool_result` (dynamic-secrets + pattern statici).
 */
import { injectTypedRequest } from "./sealed-secrets.mjs";

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);
const RESP_HEADER_ALLOWLIST = ["content-type", "content-length", "location", "retry-after", "www-authenticate"];

/**
 * @param {{url:string, method?:string, headers?:Record<string,string>, body?:string, timeoutMs?:number}} params
 * @param {{ fetchImpl?:Function, mode?:"strict"|"warn"|"off", maxBytes?:number }} [opts]
 * @returns {Promise<object>} risultato strutturato { ok, status?, headers?, body?, truncated?, redirected?, location?, injected?, blocked?, warnings?, error? }
 */
export async function executeHttpRequest(params = {}, opts = {}) {
  const fetchImpl = opts.fetchImpl || (typeof globalThis !== "undefined" ? globalThis.fetch : undefined);
  const mode = opts.mode || "strict";
  const maxBytes = Number.isFinite(opts.maxBytes) ? opts.maxBytes : 100_000;
  const url = params.url;
  const method = String(params.method || "GET").toUpperCase();
  const headers = params.headers && typeof params.headers === "object" ? params.headers : {};
  const body = params.body;
  const timeoutMs = Number.isFinite(params.timeoutMs) ? Math.min(Math.max(params.timeoutMs, 1), 120_000) : 30_000;

  if (typeof fetchImpl !== "function") return { ok: false, error: "no fetch implementation available" };
  if (typeof url !== "string" || !url) return { ok: false, error: "a non-empty 'url' is required" };
  if (!ALLOWED_METHODS.has(method)) return { ok: false, error: `method '${method}' not allowed (use one of: ${[...ALLOWED_METHODS].join(", ")})` };
  let parsed;
  try { parsed = new URL(url); } catch { return { ok: false, error: `invalid URL: ${url}` }; }
  const scheme = parsed.protocol.replace(/:$/, "").toLowerCase();
  if (scheme !== "http" && scheme !== "https") return { ok: false, error: `only http/https URLs are allowed (got '${scheme}')` };

  // injection TIPIZZATA + sink-gating fail-closed (NIENTE shell). Se un ref è bloccato/inesistente → non si invia.
  const inj = injectTypedRequest({ url, headers, body }, mode);
  if (inj.blocked && inj.blocked.length) {
    return {
      ok: false,
      error: "secret use blocked (typed sink-gating)",
      blocked: inj.blocked,
      // remediation coerente con preview_secret_use: chiedere il sink, mai env-var raw.
      hint: "For an external host call request_sink(name, host, why); for http://localhost call request_local_http(name, why). Do NOT read the value from a plaintext env var.",
    };
  }

  let resp;
  try {
    resp = await fetchImpl(inj.url, {
      method,
      headers: inj.headers,
      body: method === "GET" || method === "HEAD" ? undefined : inj.body,
      redirect: "manual", // anti exfil-via-redirect: un 3xx verso un host diverso NON viene seguito col token
      signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined,
    });
  } catch (e) {
    const msg = e && e.name === "TimeoutError" ? `request timed out after ${timeoutMs}ms` : `request failed: ${e && e.message ? e.message : String(e)}`;
    return { ok: false, error: msg, injected: inj.injected };
  }

  const status = typeof resp.status === "number" ? resp.status : 0;
  // header di risposta: SOLO allow-list (no set-cookie ecc.). resp.headers è un Headers o un oggetto plain (mock).
  const respHeaders = {};
  try {
    const getH = typeof resp.headers?.get === "function"
      ? (k) => resp.headers.get(k)
      : (k) => (resp.headers ? resp.headers[k] ?? resp.headers[k.toLowerCase()] : undefined);
    for (const h of RESP_HEADER_ALLOWLIST) { const v = getH(h); if (v != null) respHeaders[h] = String(v); }
  } catch { /* header non leggibili → ometti */ }

  const isRedirect = status >= 300 && status < 400;
  // review P3: riduci il Location a scheme+host (NON restituire query/path che potrebbero riflettere un valore
  // redactEgress:false — quello opt-out NON è nel Set di redazione). Il modello deve comunque ri-emettere verso l'host.
  let location;
  if (isRedirect && respHeaders.location) {
    try { const lu = new URL(respHeaders.location, inj.url); location = `${lu.protocol}//${lu.host}`; } catch { /* relativo/malformato → ometti */ }
    respHeaders.location = location || "(unparseable redirect target)";
  }
  let text = "";
  try { text = typeof resp.text === "function" ? await resp.text() : String(resp.body ?? ""); } catch { text = ""; }
  const truncated = text.length > maxBytes;

  return {
    ok: true,
    status,
    headers: respHeaders,
    body: truncated ? text.slice(0, maxBytes) : text,
    truncated,
    redirected: isRedirect,
    location,
    injected: inj.injected,
    warnings: inj.warnings,
    // nota esplicita: i redirect NON sono seguiti (sicurezza); il Location è ridotto a scheme+host.
    note: isRedirect ? "redirect NOT followed (anti exfil); Location reduced to scheme+host. To proceed, issue a new http_request to that host (it will be re-gated)." : undefined,
  };
}

export default { executeHttpRequest };

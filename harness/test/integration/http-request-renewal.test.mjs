/**
 * http-request-renewal — test E2E del RENEWAL/response-capture (utente msg 799): il modello rinnova una chiave
 * inviandola all'endpoint /renew e catturando la nuova dalla risposta, SENZA mai vederla.
 *
 * fetch è iniettato (mock, nessuna rete). Il valore del secret si ispeziona via injectTypedRequest (test-only):
 * iniettando {{secret:NAME}} verso un host consentito si ottiene il valore reale risolto → prima/dopo il renewal.
 */
import { executeHttpRequest } from "../../src/http-request.mjs";
import { setSecret, removeSecret, injectTypedRequest } from "../../src/sealed-secrets.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

/** valore reale corrente del secret (test-only): risolto via injection verso un host consentito. */
function currentValue(name, host) {
  const inj = injectTypedRequest({ url: `https://${host}/probe`, headers: { A: `{{secret:${name}}}` }, body: "" }, "strict");
  return inj.headers?.A;
}
/** mock fetch che ritorna status + body JSON/string. */
const mockFetch = (status, body) => async () => ({
  status,
  headers: { get: () => null },
  text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
});

async function run() {
  const HOST = "oauth.example.com";

  // 1) RENEWAL FELICE: OLD_TOKEN inviato a /renew, nuovo valore catturato da $.access_token → sigillato in-place.
  {
    removeSecret("OLD_TOKEN");
    setSecret("OLD_TOKEN", "old-val-AAA", { allowedSinks: [HOST] });
    const before = currentValue("OLD_TOKEN", HOST);
    ok(before === "old-val-AAA", "pre: valore iniziale risolto");
    const r = await executeHttpRequest(
      { url: `https://${HOST}/api/v1/renew`, method: "POST", headers: { Authorization: "Bearer {{secret:OLD_TOKEN}}" }, capture: { secret: "OLD_TOKEN", from: "$.access_token" } },
      { fetchImpl: mockFetch(200, { access_token: "new-val-ZZZ", expires_in: 3600 }), mode: "strict" },
    );
    ok(r.captured?.ok === true && r.captured.secret === "OLD_TOKEN", "renewal: captured.ok");
    const after = currentValue("OLD_TOKEN", HOST);
    ok(after === "new-val-ZZZ", "renewal: valore aggiornato al nuovo token");
    ok(before !== after, "renewal: valore cambiato");
    // allowedSinks INVARIATI: se il renew avesse resettato i sink, currentValue verso HOST fallirebbe (≠ nuovo valore).
    ok(after === "new-val-ZZZ", "renewal: allowedSinks preservati (host ancora consentito)");
    removeSecret("OLD_TOKEN");
  }

  // 2) VINCOLO DI CONSENSO: un secret NON usato (injected) in questa richiesta NON è catturabile.
  {
    removeSecret("OTHER");
    setSecret("OTHER", "v-other", { allowedSinks: [HOST] });
    const before = currentValue("OTHER", HOST);
    const r = await executeHttpRequest(
      { url: `https://${HOST}/x`, method: "GET", capture: { secret: "OTHER", from: "$.t" } }, // OTHER NON è nella richiesta
      { fetchImpl: mockFetch(200, { t: "attacker-value" }), mode: "strict" },
    );
    ok(r.captured?.ok === false && /not used in this request/.test(r.captured.reason), "vincolo: not-injected → rifiutato");
    ok(currentValue("OTHER", HOST) === before, "vincolo: valore invariato");
    removeSecret("OTHER");
  }

  // 3) NON-2xx: nessuna cattura (il /renew ha fallito) → valore invariato.
  {
    removeSecret("T3");
    setSecret("T3", "v3", { allowedSinks: [HOST] });
    const before = currentValue("T3", HOST);
    const r = await executeHttpRequest(
      { url: `https://${HOST}/renew`, method: "POST", headers: { A: "{{secret:T3}}" }, capture: { secret: "T3", from: "$.t" } },
      { fetchImpl: mockFetch(401, "unauthorized"), mode: "strict" },
    );
    ok(r.captured?.ok === false && /not 2xx/.test(r.captured.reason), "non-2xx: non catturato");
    ok(currentValue("T3", HOST) === before, "non-2xx: valore invariato");
    removeSecret("T3");
  }

  // 4) ESTRAZIONE FALLITA (path assente): nessun renew, valore invariato.
  {
    removeSecret("T4");
    setSecret("T4", "v4-orig", { allowedSinks: [HOST] });
    const before = currentValue("T4", HOST);
    const r = await executeHttpRequest(
      { url: `https://${HOST}/renew`, method: "POST", headers: { A: "{{secret:T4}}" }, capture: { secret: "T4", from: "$.missing" } },
      { fetchImpl: mockFetch(200, { other: "x" }), mode: "strict" },
    );
    ok(r.captured?.ok === false, "estrazione-fallita: non catturato");
    ok(currentValue("T4", HOST) === before, "estrazione-fallita: valore invariato");
    removeSecret("T4");
  }

  // 5) capture assente → nessun campo captured (nessuna regressione sul path normale).
  {
    const r = await executeHttpRequest(
      { url: `https://${HOST}/data`, method: "GET" },
      { fetchImpl: mockFetch(200, { hello: "world" }), mode: "strict" },
    );
    ok(r.ok === true && r.captured === undefined, "no-capture: nessun captured, richiesta normale ok");
  }

  console.log(`\nhttp-request-renewal: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
}
run().catch((e) => { console.error(e); process.exit(1); });

/**
 * secrets-ingress-promote — test del fix C (utente msg 796/797): l'Ask di PROMOZIONE di un valore auto-sigillato
 * da regex-ingress. Dimostra che, dato un `ui` con input (come la TUI reale in mode=`ask`), promoteSealedIngress:
 *   - RINOMINA INGRESS_N → nome parlante (es. REDDIT_API_KEY) e restituisce la mappa dei rename (per riscrivere il testo),
 *   - concede gli host consentiti (grant-sink),
 *   - è fail-safe: nome/host invalidi o cancel → il secret resta INGRESS_N sigillato (nessuna perdita),
 *   - headless (no UI) → no-op.
 */
import { promoteSealedIngress } from "../../src/secrets-consent.mjs";
import { setSecret, hasSecret, removeSecret } from "../../src/sealed-secrets.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

function fakeUI({ input = [] } = {}) {
  const calls = { input: [], notify: [] };
  const iq = [...input];
  return { calls, ui: {
    async input(title, ph) { calls.input.push({ title, ph }); return iq.length ? iq.shift() : undefined; },
    notify(m, t) { calls.notify.push({ m, t }); },
  } };
}
const seed = (name) => { removeSecret(name); setSecret(name, "seed-value-" + name, {}); };

async function run() {
  // 1) RENAME + GRANT: il caso reddit felice.
  {
    seed("INGRESS_PROMO_1");
    const { ui } = fakeUI({ input: ["REDDIT_API_KEY", "oauth.reddit.com"] });
    const r = await promoteSealedIngress(ui, true, ["INGRESS_PROMO_1"]);
    ok(r.renames["INGRESS_PROMO_1"] === "REDDIT_API_KEY", "rename: mappa INGRESS_PROMO_1→REDDIT_API_KEY");
    ok(hasSecret("REDDIT_API_KEY") && !hasSecret("INGRESS_PROMO_1"), "rename: secret rinominato (vecchio sparito)");
    ok((r.granted["REDDIT_API_KEY"] || []).includes("oauth.reddit.com"), "grant: oauth.reddit.com concesso");
    removeSecret("REDDIT_API_KEY");
  }

  // 2) NOME VUOTO → tieni INGRESS_N, nessun rename.
  {
    seed("INGRESS_PROMO_2");
    const { ui } = fakeUI({ input: ["", ""] });
    const r = await promoteSealedIngress(ui, true, ["INGRESS_PROMO_2"]);
    ok(Object.keys(r.renames).length === 0, "vuoto: nessun rename");
    ok(hasSecret("INGRESS_PROMO_2"), "vuoto: INGRESS_PROMO_2 mantenuto");
    removeSecret("INGRESS_PROMO_2");
  }

  // 3) NOME INVALIDO → tieni INGRESS_N + warning.
  {
    seed("INGRESS_PROMO_3");
    const { ui, calls } = fakeUI({ input: ["bad name!;rm", ""] });
    const r = await promoteSealedIngress(ui, true, ["INGRESS_PROMO_3"]);
    ok(!r.renames["INGRESS_PROMO_3"] && hasSecret("INGRESS_PROMO_3"), "nome-invalido: nessun rename, secret intatto");
    ok(calls.notify.some((n) => n.t === "warning"), "nome-invalido: warning emesso");
    removeSecret("INGRESS_PROMO_3");
  }

  // 4) HOST INVALIDO → ignorato + warning; nessun sink concesso.
  {
    seed("INGRESS_PROMO_4");
    const { ui, calls } = fakeUI({ input: ["", "https://evil.com/path"] });
    const r = await promoteSealedIngress(ui, true, ["INGRESS_PROMO_4"]);
    ok(!r.granted["INGRESS_PROMO_4"], "host-invalido: nessun sink concesso");
    ok(calls.notify.some((n) => n.t === "warning"), "host-invalido: warning emesso");
    removeSecret("INGRESS_PROMO_4");
  }

  // 5) HEADLESS (no UI) → no-op, secret invariato, nessun input.
  {
    seed("INGRESS_PROMO_5");
    const { ui, calls } = fakeUI({ input: ["X", "y.com"] });
    const r = await promoteSealedIngress(ui, false, ["INGRESS_PROMO_5"]);
    ok(Object.keys(r.renames).length === 0 && calls.input.length === 0, "headless: nessun Ask, nessun rename");
    ok(hasSecret("INGRESS_PROMO_5"), "headless: secret invariato");
    removeSecret("INGRESS_PROMO_5");
  }

  // 6) COLLISIONE nome esistente → tieni INGRESS_N.
  {
    seed("INGRESS_PROMO_6");
    seed("ALREADY_THERE");
    const { ui } = fakeUI({ input: ["ALREADY_THERE", ""] });
    const r = await promoteSealedIngress(ui, true, ["INGRESS_PROMO_6"]);
    ok(!r.renames["INGRESS_PROMO_6"] && hasSecret("INGRESS_PROMO_6"), "collisione: nessun rename, INGRESS mantenuto");
    removeSecret("INGRESS_PROMO_6"); removeSecret("ALREADY_THERE");
  }

  console.log(`\nsecrets-ingress-promote: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
}
run().catch((e) => { console.error(e); process.exit(1); });

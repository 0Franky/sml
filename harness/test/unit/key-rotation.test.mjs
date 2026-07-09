/**
 * key-rotation — unit della rotazione IN-PROCESS multi-key on-429/5xx (utente msg 1448, rule #14/#17).
 * Blinda la logica che PRIMA viveva inline nell'interceptor di run-session (non-testabile → estratta in key-rotation.mjs):
 *   - swapKey mette la chiave nell'header giusto per provider (Gemini x-goog-api-key · openai-compat Authorization);
 *   - fetchWithRotation ritenta con la CHIAVE SUCCESSIVA su 429/5xx, NON su 4xx-non-429, rispetta max, gestisce 0 chiavi.
 * Un bug qui (ruota sull'header sbagliato → 429 perenne; ritenta su 400; non ruota; index errato) sfuggirebbe a un unit
 * sulle funzioni pure di config ma NON qui. Deterministico (sleep no-op), gira in CI.
 */
import { swapKey, isRetriableStatus, fetchWithRotation } from "../../eval/key-rotation.mjs";

let passed = 0, failed = 0;
const ok = (c, m) => { if (c) passed++; else { failed++; console.error("  ✗ " + m); } };
const noSleep = async () => {};

// ── swapKey: header corretto per provider ────────────────────────────────────────────────────────
{
  const GEM = "https://generativelanguage.googleapis.com/v1beta/models/x:generateContent";
  const [, o1] = swapKey(GEM, GEM, { headers: { "content-type": "application/json", "x-goog-api-key": "old" } }, "new");
  const h1 = new Headers(o1.headers);
  ok(h1.get("x-goog-api-key") === "new", "swapKey gemini → x-goog-api-key sostituito");
  ok(h1.get("content-type") === "application/json", "swapKey gemini → altri header preservati");
  ok(!h1.has("authorization"), "swapKey gemini → NON tocca Authorization");

  const OAI = "https://api.groq.com/openai/v1/chat/completions";
  const [, o2] = swapKey(OAI, OAI, { headers: { Authorization: "Bearer old" } }, "new");
  const h2 = new Headers(o2.headers);
  ok(h2.get("authorization") === "Bearer new", "swapKey openai-compat → Authorization Bearer sostituito");
  ok(!h2.has("x-goog-api-key"), "swapKey openai-compat → NON mette x-goog-api-key");

  // NON muta l'opts originale
  const orig = { headers: { X: "1" } };
  swapKey(OAI, OAI, orig, "k");
  ok(orig.headers.X === "1" && !("Authorization" in orig.headers), "swapKey → opts originale NON mutato");
}

// ── isRetriableStatus ────────────────────────────────────────────────────────────────────────────
{
  ok(isRetriableStatus(429) === true, "429 → retriable");
  ok(isRetriableStatus(500) === true && isRetriableStatus(503) === true, "5xx → retriable");
  ok(isRetriableStatus(200) === false && isRetriableStatus(400) === false && isRetriableStatus(404) === false, "2xx/4xx-non-429 → NON retriable");
}

// ── fetchWithRotation: fake fetch che restituisce statuses in coda e registra la chiave vista ──────
function makeFakeFetch(statuses) {
  const seen = [];
  const fn = async (url, opts) => {
    const h = new Headers(opts?.headers || {});
    const auth = h.get("authorization");
    seen.push(h.get("x-goog-api-key") ?? (auth ? auth.replace(/^Bearer /, "") : null));
    return new Response("body", { status: statuses.shift() ?? 200 });
  };
  return { fn, seen };
}
const GEM = "https://generativelanguage.googleapis.com/v1beta/models/x:generateContent";
const KEYS = ["k0", "k1", "k2", "k3"];
const startOpts = (k) => ({ headers: { "x-goog-api-key": k } });

(async () => {
  // (a) successo al primo colpo → nessuna rotazione
  {
    const { fn, seen } = makeFakeFetch([200]);
    let rot = 0;
    const res = await fetchWithRotation({ fetchFn: fn, url: GEM, opts: startOpts("k0"), u: GEM, keys: KEYS, start: 0, max: 6, sleep: noSleep, onRotate: () => rot++ });
    ok(res.status === 200 && rot === 0 && seen.length === 1, "200 subito → no rotazione, 1 sola fetch");
  }

  // (b) 429 poi 200 → ruota una volta alla CHIAVE SUCCESSIVA
  {
    const { fn, seen } = makeFakeFetch([429, 200]);
    let rot = 0;
    const res = await fetchWithRotation({ fetchFn: fn, url: GEM, opts: startOpts("k0"), u: GEM, keys: KEYS, start: 0, max: 6, sleep: noSleep, onRotate: () => rot++ });
    ok(res.status === 200 && rot === 1, "429→200 → status 200, 1 rotazione");
    ok(seen[0] === "k0" && seen[1] === "k1", "429→200 → attempt0=k0 (corrente), attempt1=k1 (successiva)");
  }

  // (c) 429 sempre → esaurisce i retry (max), ritorna l'ultimo 429
  {
    const { fn, seen } = makeFakeFetch(Array(20).fill(429));
    let rot = 0;
    const res = await fetchWithRotation({ fetchFn: fn, url: GEM, opts: startOpts("k0"), u: GEM, keys: KEYS, start: 0, max: 3, sleep: noSleep, onRotate: () => rot++ });
    ok(res.status === 429 && rot === 3 && seen.length === 4, "429 perenne → max=3 retry (4 fetch totali), ritorna 429");
    ok(seen.join(",") === "k0,k1,k2,k3", "429 perenne → chiavi ruotate in ordine k0→k1→k2→k3");
  }

  // (d) 4xx non-429 (400) → NON si ritenta
  {
    const { fn, seen } = makeFakeFetch([400, 200]);
    let rot = 0;
    const res = await fetchWithRotation({ fetchFn: fn, url: GEM, opts: startOpts("k0"), u: GEM, keys: KEYS, start: 0, max: 6, sleep: noSleep, onRotate: () => rot++ });
    ok(res.status === 400 && rot === 0 && seen.length === 1, "400 → errore vero, no retry");
  }

  // (e) 0 chiavi (Ollama locale) → 429 → nessuna rotazione, ritorna 429
  {
    const { fn, seen } = makeFakeFetch([429]);
    let rot = 0;
    const res = await fetchWithRotation({ fetchFn: fn, url: "http://127.0.0.1:11434/v1/chat/completions", opts: {}, u: "http://127.0.0.1:11434/v1/chat/completions", keys: [], start: 0, max: 6, sleep: noSleep, onRotate: () => rot++ });
    ok(res.status === 429 && rot === 0 && seen.length === 1, "0 chiavi → no rotazione (Ollama)");
  }

  // (f) start-index != 0: keys=[k0..k3], start=1 → attempt1 usa keys[(1+1)%4]=k2
  {
    const { fn, seen } = makeFakeFetch([429, 200]);
    const res = await fetchWithRotation({ fetchFn: fn, url: GEM, opts: startOpts("k1"), u: GEM, keys: KEYS, start: 1, max: 6, sleep: noSleep });
    ok(res.status === 200 && seen[1] === "k2", "start=1 → attempt1 usa keys[(1+1)%4]=k2");
  }

  // (g) 5xx (503) poi 200 → retriable, ruota
  {
    const { fn } = makeFakeFetch([503, 200]);
    let rot = 0;
    const res = await fetchWithRotation({ fetchFn: fn, url: GEM, opts: startOpts("k0"), u: GEM, keys: KEYS, start: 0, max: 6, sleep: noSleep, onRotate: () => rot++ });
    ok(res.status === 200 && rot === 1, "503→200 → 5xx retriable, ruota");
  }

  // (h) 1 sola chiave → 429 poi 200 → ruota (modulo 1 = stessa chiave) ma ritenta comunque + backoff
  {
    const { fn, seen } = makeFakeFetch([429, 200]);
    let rot = 0;
    const res = await fetchWithRotation({ fetchFn: fn, url: GEM, opts: startOpts("only"), u: GEM, keys: ["only"], start: 0, max: 6, sleep: noSleep, onRotate: () => rot++ });
    ok(res.status === 200 && rot === 1 && seen[1] === "only", "1 chiave → retry+backoff con stessa chiave");
  }

  console.log(`\nkey-rotation test: ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();

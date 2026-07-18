// Probe di DISPONIBILITÀ: 1 richiesta minima per modello → OK / rate-limit / errore. NON stampa mai la key.
import { loadGeminiKeys } from "./gemini-keys.mjs";
const keys = loadGeminiKeys();
const k0 = keys?.[0];
const KEY = typeof k0 === "string" ? k0 : (k0?.key ?? k0?.apiKey ?? k0?.value);
if (!KEY) { console.error("no key"); process.exit(2); }
const models = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemma-4-26b-a4b-it", "gemma-4-31b-it"];
for (const m of models) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${KEY}`;
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with exactly: OK" }] }], generationConfig: { maxOutputTokens: 5, temperature: 0 } }),
    });
    const dt = Date.now() - t0;
    let detail = "";
    try { const j = await r.json(); detail = j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() || (j?.error ? `${j.error.status || ""} ${String(j.error.message || "").slice(0, 90)}` : ""); } catch { detail = "(no-json)"; }
    console.log(`${m.padEnd(24)} status=${r.status} ${String(dt).padStart(5)}ms  ${r.status === 200 ? "✓ OK" : "✗ " + detail}`);
  } catch (e) { console.log(`${m.padEnd(24)} FETCH-ERR ${String(e?.message || e).slice(0, 90)}`); }
}

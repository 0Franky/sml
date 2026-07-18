// Lista i modelli Gemma disponibili sulla Google Generative Language API (1 richiesta, chiave non stampata).
import { loadGeminiKeys } from "./gemini-keys.mjs";
const keys = loadGeminiKeys();
if (!keys.length) { console.error("no keys"); process.exit(2); }
const key = keys[0];
const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`);
const j = await r.json();
const models = (j.models || []).map((m) => m.name.replace(/^models\//, ""));
const gemma = models.filter((n) => /gemma/i.test(n));
console.log("HTTP", r.status);
console.log("=== Gemma models ===");
for (const g of gemma) console.log(" ", g);
if (!gemma.length) { console.log("(nessun gemma; primi 20 modelli:)"); for (const m of models.slice(0, 20)) console.log("  ", m); }

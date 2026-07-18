// Tentativo SINGOLO pulito: 1 fetch REST diretto a 3.5-flash su #145 (no sessione pi, no retry-burst) → isola se
// il modello SMART risolve #145 (gap di intelligenza?) senza il confound quota-RPM del probe a più richieste.
import { readFileSync } from "node:fs";
import { runPython } from "./py-run.mjs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
let keys = [];
const plural = env.match(/^\s*GEMINI_API_KEYS\s*=\s*(.+?)\s*$/m);
if (plural) keys = plural[1].replace(/^["']|["']$/g, "").split(/[,\s]+/).map((k) => k.trim()).filter(Boolean);
const KEY = keys[Number(process.env.PK ?? "1")]; // default key1 (viva)
const MODEL = process.env.PM ?? "gemini-3.5-flash";

const task = JSON.parse(readFileSync(new URL("./data/he145.jsonl", import.meta.url), "utf8").trim().split(/\r?\n/)[0]);
const prompt = `Scrivi la funzione Python COMPLETA (firma + corpo) per il problema. Rispondi con SOLO un blocco \`\`\`python ...\`\`\`, senza spiegazioni.\n\n${task.prompt}`;

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
const r = await fetch(url, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 2048, temperature: 0 } }),
});
console.log(`${MODEL} HTTP ${r.status}`);
if (r.status !== 200) { const t = await r.text(); console.log("  ", t.slice(0, 160).replace(/\s+/g, " ")); process.exit(0); }
const j = await r.json();
const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
const m = text.match(/```(?:python)?\s*([\s\S]*?)```/i);
const code = m ? m[1] : text;
console.log("  --- codice estratto (primi 320 char) ---");
console.log(code.slice(0, 320).split("\n").map((l) => "  " + l).join("\n"));
const res = runPython(code + "\n" + task.test + "\ncheck(" + task.entry_point + ")", { timeoutMs: 8000 });
console.log(`  === ${MODEL} su #145: ${res.ok ? "PASS ✓ (RISOLVE — gap di INTELLIGENZA confermato)" : "FAIL ✗ (non risolve)"}`);
if (!res.ok) console.log("   ", (res.stderr || res.error || "").split("\n").filter(Boolean).slice(-1)[0]);
console.log("  usa abs()?", /abs\(/.test(code), "| gestisce il segno?", /neg|<\s*0|sign|\[0\]\s*\*/.test(code));

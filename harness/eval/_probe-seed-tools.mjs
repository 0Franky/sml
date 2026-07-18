/**
 * _probe-seed-tools — ISOLA una variabile: Seed-OSS-36B su SiliconFlow supporta il FUNCTION-CALLING?
 * La design-review (chat-completion SENZA tools) funziona; il discriminante (harness-in-the-loop, pi manda
 * `tools`) è morto. Questa probe manda UNA call minimale CON un tool e guarda la risposta. Costo ~$0.0001.
 * NON stampa la chiave. Uso (cwd=harness/): node eval/_probe-seed-tools.mjs
 */
import { loadEnvKeys, maskKey } from "./env-keys.mjs";

const key = (loadEnvKeys("SILICONFLOW")[0] || "").split(/[,\s]+/).filter(Boolean)[0];
if (!key) { console.error("Nessuna SILICONFLOW key in harness/.env"); process.exit(2); }
const MODEL = process.env.PROBE_MODEL || "ByteDance-Seed/Seed-OSS-36B-Instruct";
const BASE = "https://api.siliconflow.com/v1";
console.log(`probe tools · model=${MODEL} · key=${maskKey(key)}`);

const body = {
  model: MODEL,
  messages: [{ role: "user", content: "Write the text 'hello' into the file a.txt. Use the write_file tool." }],
  tools: [{
    type: "function",
    function: {
      name: "write_file",
      description: "Write content to a file",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
    },
  }],
  max_tokens: 500,
  temperature: 0,
};

const t0 = Date.now();
const res = await fetch(`${BASE}/chat/completions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const ms = Date.now() - t0;
const txt = await res.text();
console.log(`HTTP ${res.status} · ${ms}ms`);
if (!res.ok) { console.log("BODY:", txt.slice(0, 800)); process.exit(1); }
let j; try { j = JSON.parse(txt); } catch { console.log("non-JSON:", txt.slice(0, 400)); process.exit(1); }
const msg = j.choices?.[0]?.message ?? {};
const tc = msg.tool_calls;
console.log(`finish_reason: ${j.choices?.[0]?.finish_reason}`);
console.log(`tool_calls: ${tc ? JSON.stringify(tc).slice(0, 400) : "❌ ASSENTI"}`);
console.log(`content: ${String(msg.content ?? "").slice(0, 300)}`);
console.log(`usage: ${JSON.stringify(j.usage ?? {})}`);
console.log(`\nVERDETTO: ${tc?.length ? "✅ Seed EMETTE tool_calls (function-calling OK)" : "❌ Seed NON ha emesso tool_calls → il path harness-in-the-loop non può funzionare così"}`);

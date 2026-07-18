/** verifica auth SiliconFlow + slug Seed-OSS-36B (GET /models è gratis, non consuma credito). NON stampa la chiave. */
import { loadEnvKeys, maskKey } from "./env-keys.mjs";

const key = (loadEnvKeys("SILICONFLOW")[0] || "").split(/[,\s]+/).filter(Boolean)[0]; // normalizza \r CRLF
if (!key) { console.error("Nessuna SILICONFLOW key in harness/.env (SILICONFLOW_KEYS)"); process.exit(2); }
console.log(`key: ${maskKey(key)}`);

const BASES = ["https://api.siliconflow.com/v1", "https://api.siliconflow.cn/v1"];
for (const base of BASES) {
  try {
    const res = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${key}` } });
    const txt = await res.text();
    console.log(`\n[${base}] HTTP ${res.status}`);
    if (res.status === 401) { console.log("  → chiave NON valida (401 unauthorized)"); continue; }
    if (!res.ok) { console.log(`  → ${txt.slice(0, 200)}`); continue; }
    let j; try { j = JSON.parse(txt); } catch { console.log("  → risposta non-JSON:", txt.slice(0, 150)); continue; }
    const all = j.data || j.models || [];
    console.log(`  → auth OK · ${all.length} modelli visibili`);
    const seed = all.filter((m) => /seed/i.test(m.id || m.name || ""));
    if (seed.length) { console.log("  Seed disponibili:"); for (const s of seed) console.log("   •", s.id || s.name); }
    else console.log("  (nessun modello 'seed' nella lista — potrebbe richiedere slug esatto es. ByteDance-Seed/Seed-OSS-36B-Instruct)");
  } catch (e) { console.log(`\n[${base}] errore rete: ${e.message}`); }
}

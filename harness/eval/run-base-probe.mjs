/**
 * run-base-probe — runner MODEL-AGNOSTIC del bake-off base-model (T5, utente msg 1341 opzione-b: scaffold pronto-a-girare).
 * Colpisce QUALSIASI endpoint OpenAI-compatible (`/chat/completions`) → basta cambiare base-url+key+model per puntare a
 * OpenRouter/Together (per i 32B che NON girano sui 11GB locali) o a un vLLM/Ollama locale (per i piccoli). Esegue il
 * PROBE-SET `base-probes.mjs` (shell bash/PS/sh/CMD + python/JS + reasoning) e produce una scorecard per-categoria.
 *
 * DISCIPLINA DI VALIDITÀ (rule #14): un probe con errore-endpoint/timeout è INVALID, NON "failed" → il pass-rate si
 * calcola SOLO sui probe validi (nessun falso "0%" da un endpoint rotto). Onesto su quanti probe non sono stati misurati.
 *
 * Config (env):
 *   OPENAI_BASE_URL  (default = endpoint OpenAI-compat di Gemini, per validare il wiring senza key esterne)
 *   OPENAI_API_KEY   (default = prima GEMINI key da .env → valida il path OpenAI-compat contro un modello raggiungibile)
 *   MODEL_ID         (default gemini-3.1-flash-lite)
 *   PROBE_CATEGORY   (opz: filtra per categoria, es. "shell-bash")
 *   PROBE_TIMEOUT_MS (default 45000) · PACE_MS (default 800) · MAX_TOKENS (default 512) · OUT (jsonl)
 *
 * PER I CANDIDATI BAKE-OFF (32B, via API):
 *   OpenRouter: OPENAI_BASE_URL=https://openrouter.ai/api/v1  OPENAI_API_KEY=<or-key>  MODEL_ID=<slug del candidato>
 *   Together:   OPENAI_BASE_URL=https://api.together.xyz/v1   OPENAI_API_KEY=<tg-key>  MODEL_ID=<slug>
 *   Validare ENTRAMBI: Seed-OSS-36B-woSyn  E  Qwen3-32B (dense). Vedi wiki/entities/base-model-candidates-2026-07.md.
 */
import { writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { BASE_PROBES, gradeProbe, probeCategories } from "./base-probes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MODEL_ID = process.env.MODEL_ID || "gemini-3.1-flash-lite";
const BASE_URL = (process.env.OPENAI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai").replace(/\/+$/, "");
const PROBE_CATEGORY = process.env.PROBE_CATEGORY || null;
const TIMEOUT = Number(process.env.PROBE_TIMEOUT_MS || 45000);
const PACE_MS = Number(process.env.PACE_MS || 800);
const MAX_TOKENS = Number(process.env.MAX_TOKENS || 512);
const OUT = process.env.OUT || join(process.env.SCRATCH || tmpdir(), `base-probe-${MODEL_ID.replace(/[^\w.-]/g, "_")}.jsonl`);

/** Key: OPENAI_API_KEY esplicita, altrimenti la prima GEMINI key (valida il path OpenAI-compat senza config esterna). */
async function resolveKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  try { const { loadGeminiKeys } = await import("./gemini-keys.mjs"); const k = loadGeminiKeys(); if (k.length) return k[0]; } catch { /* nessuna */ }
  throw new Error("OPENAI_API_KEY assente e nessuna GEMINI key in .env");
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** UNA chiamata chat/completions. Ritorna {text} o {error} (endpoint down/timeout/HTTP≥400). */
async function chat(apiKey, prompt) {
  const ctrl = new AbortController();
  const killer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL_ID, messages: [{ role: "user", content: prompt }], temperature: 0, max_tokens: MAX_TOKENS }),
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const j = await res.json();
    const text = j?.choices?.[0]?.message?.content ?? "";
    return typeof text === "string" && text.trim() !== "" ? { text } : { error: "empty completion" };
  } catch (e) {
    return { error: (e?.name === "AbortError" ? "timeout" : String(e?.message ?? e)).slice(0, 120) };
  } finally { clearTimeout(killer); }
}

async function main() {
  const apiKey = await resolveKey();
  const probes = PROBE_CATEGORY ? BASE_PROBES.filter((p) => p.category === PROBE_CATEGORY) : BASE_PROBES;
  writeFileSync(OUT, "");
  console.error(`[base-probe] model=${MODEL_ID} base=${BASE_URL} probes=${probes.length} cats=${probeCategories().length} out=${OUT}`);

  const byCat = {};
  let valid = 0, invalid = 0, passed = 0;
  for (let i = 0; i < probes.length; i++) {
    const p = probes[i];
    const r = await chat(apiKey, p.prompt);
    byCat[p.category] ??= { valid: 0, passed: 0, invalid: 0 };
    if (r.error) {
      invalid++; byCat[p.category].invalid++;
      appendFileSync(OUT, JSON.stringify({ id: p.id, category: p.category, valid: false, error: r.error }) + "\n");
      console.error(`[${i + 1}/${probes.length}] ${p.id} → INVALID (${r.error})`);
    } else {
      const g = gradeProbe(p, r.text);
      valid++; byCat[p.category].valid++;
      if (g.pass) { passed++; byCat[p.category].passed++; }
      appendFileSync(OUT, JSON.stringify({ id: p.id, category: p.category, valid: true, pass: g.pass, reasons: g.reasons }) + "\n");
      console.error(`[${i + 1}/${probes.length}] ${p.id} → ${g.pass ? "PASS" : "fail (" + g.reasons.join("; ") + ")"}`);
    }
    if (i < probes.length - 1) await sleep(PACE_MS);
  }

  const summary = { mode: "base-probe", model: MODEL_ID, base_url: BASE_URL, total: probes.length, valid, invalid,
    passed, failed: valid - passed, pass_rate: valid ? +(passed / valid).toFixed(3) : null,
    by_category: Object.fromEntries(Object.entries(byCat).map(([c, s]) => [c, { pass: s.passed, of: s.valid, invalid: s.invalid }])), out: OUT };
  console.log(JSON.stringify(summary, null, 2));
  appendFileSync(OUT, JSON.stringify({ summary }) + "\n");
}

main().catch((e) => { console.error(JSON.stringify({ mode: "base-probe", model: MODEL_ID, error: String(e?.stack ?? e) })); process.exit(1); });

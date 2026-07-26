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
/* MAX_TOKENS — default alzato 512 -> 4096 il 2026-07-26. **512 non era un default neutro**: i
 * modelli che ragionano contano i reasoning-token nel budget (misurato: 396 per un 17x23), quindi
 * un tetto stretto NON accorcia le risposte — **cancella la risposta** e produce un `content` vuoto
 * che sembra un guasto del modello. Un parametro di misura che penalizza selettivamente la
 * capacita' che stiamo misurando e' un difetto dello strumento, non una scelta di economia. */
const MAX_TOKENS = Number(process.env.MAX_TOKENS || 4096);
const OUT = process.env.OUT || join(process.env.SCRATCH || tmpdir(), `base-probe-${MODEL_ID.replace(/[^\w.-]/g, "_")}.jsonl`);

/** Keys (ARRAY, per rotazione multi-key = escamotage free-tier, utente msg 1361-B): OPENAI_API_KEYS (comma-sep) >
 *  OPENAI_API_KEY (singola) > GEMINI keys (valida il path OpenAI-compat senza config esterna). */
async function resolveKeys() {
  if (process.env.OPENAI_API_KEYS) return process.env.OPENAI_API_KEYS.split(",").map((s) => s.trim()).filter(Boolean);
  if (process.env.OPENAI_API_KEY) return [process.env.OPENAI_API_KEY];
  // Provider-aware da .env (utente 2026-07-08: GROQ_KEYS/KAGGLE_KEYS + rotazione). Prefix esplicito `KEYS_PREFIX`
  // oppure auto-detect dall'endpoint (groq.com → GROQ, kaggle → KAGGLE). La rotazione multi-key è in chat() (429→key successiva).
  const prefix = process.env.KEYS_PREFIX
    || (/groq\./i.test(BASE_URL) ? "GROQ" : /kaggle/i.test(BASE_URL) ? "KAGGLE" : null);
  if (prefix) {
    const { loadEnvKeys } = await import("./env-keys.mjs");
    const k = loadEnvKeys(prefix);
    if (k.length) return k;
  }
  try { const { loadGeminiKeys } = await import("./gemini-keys.mjs"); const k = loadGeminiKeys(); if (k.length) return k; } catch { /* nessuna */ }
  throw new Error(`nessuna key: OPENAI_API_KEY(S) assente, ${prefix ? `${prefix}_KEYS assente in .env, ` : ""}nessuna GEMINI key`);
}
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * chat/completions con RETRY+backoff e ROTAZIONE key (escamotage per reggere i rate-limit dei free-tier tipo Groq
 * 30 RPM / OpenRouter :free, utente msg 1361-B). Su 429/5xx/errore-di-rete: ritenta con la key SUCCESSIVA + backoff
 * esponenziale (cap 8s). Su 4xx non-429 (bad model/key): errore vero, niente retry. `startIdx` ruota la key iniziale
 * per probe → distribuisce il carico. Ritorna {text} o {error} dopo MAX_RETRIES.
 */
async function chat(keys, prompt, startIdx) {
  let lastErr = "no attempt";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const key = keys[(startIdx + attempt) % keys.length]; // key diversa ad ogni retry → aggira il rate-limit per-key
    const ctrl = new AbortController();
    const killer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST", signal: ctrl.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: MODEL_ID, messages: [{ role: "user", content: prompt }], temperature: 0, max_tokens: MAX_TOKENS }),
      });
      if (res.status === 429 || res.status >= 500) { lastErr = `HTTP ${res.status}`; await sleep(Math.min(8000, 500 * 2 ** attempt)); continue; }
      if (!res.ok) return { error: `HTTP ${res.status}` }; // 4xx non-429 = errore vero → non ritentare
      const j = await res.json();
      const msg = j?.choices?.[0]?.message ?? {};
      const text = msg.content ?? "";
      /* ⚠️ TRONCAMENTO = INVALID, non FAIL (aggiunto 2026-07-26, review avversariale).
       * Se il provider dice `finish_reason: "length"`, la risposta e' stata **tagliata a meta'**:
       * l'ultimo intero e' un **calcolo intermedio**, non una risposta. Gradarlo come `fail`
       * significa contare come errore-del-modello un limite nostro — e, ancora una volta, **solo
       * sui modelli che ragionano di piu'**, cioe' selezionare al contrario (stessa famiglia di
       * F29, che riguardava il caso in cui il content era del tutto vuoto). Qui il content c'e',
       * il che rende il difetto **invisibile**: sembra una risposta sbagliata a tutti gli effetti. */
      const finish = j?.choices?.[0]?.finish_reason;
      if (finish === "length") {
        const rt = j?.usage?.completion_tokens_details?.reasoning_tokens ?? 0;
        return { error: `TRONCATA a meta' (finish_reason=length, max_tokens=${MAX_TOKENS}${rt ? `, di cui ${rt} di ragionamento` : ""}) — alza MAX_TOKENS` };
      }
      if (typeof text === "string" && text.trim() !== "") return { text };
      /* ⚠️ DIAGNOSI SEPARATA — "empty completion" nascondeva un difetto NOSTRO (2026-07-26).
       * I modelli che ragionano emettono i token di ragionamento in un campo a parte e li
       * contano **nel budget**: misurato, `qwen3-32b` spende **396 reasoning-token per calcolare
       * 17x23**. Con `MAX_TOKENS` basso il budget si esaurisce nel ragionamento, `content` torna
       * VUOTO, e noi marcavamo `empty completion` — cioe' registravamo come guasto del modello
       * un **nostro tetto troppo stretto**, e per giunta **proprio sui modelli che ragionano**,
       * che sono quelli che vogliamo scegliere. Il verdetto negativo era una proprieta' dello
       * STRUMENTO, non del mondo (`class-instrument-epistemic-reach`).
       * Ora i due casi si distinguono, cosi' il difetto e' VISIBILE invece di diventare un
       * "invalid" anonimo che qualcuno leggera' come "il modello non ha risposto". */
      const reasoningTok = j?.usage?.completion_tokens_details?.reasoning_tokens ?? 0;
      const haReasoning = typeof msg.reasoning === "string" && msg.reasoning.trim() !== "";
      if (haReasoning || reasoningTok > 0) {
        return { error: `budget esaurito dal RAGIONAMENTO (reasoning_tokens=${reasoningTok}, max_tokens=${MAX_TOKENS}) — alza MAX_TOKENS` };
      }
      return { error: "empty completion" };
    } catch (e) {
      lastErr = (e?.name === "AbortError" ? "timeout" : String(e?.message ?? e)).slice(0, 120);
      await sleep(Math.min(8000, 500 * 2 ** attempt));
    } finally { clearTimeout(killer); }
  }
  return { error: `${lastErr} (dopo ${MAX_RETRIES} retry)` };
}

/* PROBE_SET (2026-07-26) — un solo runner per due set, non due runner (#16).
 *   base (default) = `base-probes` : il FLOOR. Ha gia' dato 13/13 a tutti e quattro i candidati
 *                    -> **non discrimina piu'**, tenerlo serve solo come controllo di regressione.
 *   hard           = `hard-probes` : il set DISCRIMINANTE, dove ogni probe ha una risposta
 *                    derivabile e una plausibile-ma-sbagliata.
 * Il GRADER e' lo stesso (`gradeProbe`): le hard-probes usano solo campi gia' supportati
 * (`expectNumber` / `mustContainAny` / `mustNotContain`) — nessuna logica duplicata. */
async function loadProbes() {
  if ((process.env.PROBE_SET || "base").toLowerCase() === "hard") {
    const { HARD_PROBES } = await import("./hard-probes.mjs");
    return HARD_PROBES;
  }
  return BASE_PROBES;
}

async function main() {
  const keys = await resolveKeys();
  const all = await loadProbes();
  const probes = PROBE_CATEGORY ? all.filter((p) => p.category === PROBE_CATEGORY) : all;
  writeFileSync(OUT, "");
  console.error(`[base-probe] model=${MODEL_ID} base=${BASE_URL} probes=${probes.length} cats=${probeCategories().length} keys=${keys.length} retries=${MAX_RETRIES} out=${OUT}`);

  const byCat = {};
  let trapCount = 0; // quante volte il modello ha dato ESATTAMENTE la risposta-trappola progettata
  let valid = 0, invalid = 0, passed = 0;
  for (let i = 0; i < probes.length; i++) {
    const p = probes[i];
    const r = await chat(keys, p.prompt, i);
    byCat[p.category] ??= { valid: 0, passed: 0, invalid: 0 };
    if (r.error) {
      invalid++; byCat[p.category].invalid++;
      appendFileSync(OUT, JSON.stringify({ id: p.id, category: p.category, valid: false, error: r.error }) + "\n");
      console.error(`[${i + 1}/${probes.length}] ${p.id} → INVALID (${r.error})`);
    } else {
      const g = gradeProbe(p, r.text);
      valid++; byCat[p.category].valid++;
      if (g.pass) { passed++; byCat[p.category].passed++; }
      /* ⚠️ COSA SI REGISTRA — tre aggiunte dalla review avversariale del 2026-07-26.
       *  (a) `raw`: il TESTO della risposta. Prima non si salvava, e l'header del probe-set diceva
       *      «per il perche' serve leggere le risposte» — ma l'artefatto non le conteneva, quindi
       *      quella lettura era **impossibile a posteriori**. Un limite dichiarato e non
       *      strumentato e' un limite che nessuno potra' mai chiudere. Troncato a 2000 char.
       *  (b) `got`: l'intero estratto, **anche sui PASS** (prima compariva solo nei `reasons` dei
       *      fail) -> senza, non si puo' verificare se un pass e' vero o un artefatto del grader.
       *  (c) `fellInTrap`: il campo `trap` esisteva su 11 probe e **nessun ramo lo leggeva**. La
       *      meta' piu' informativa del design (*«sapere COME sbagliano vale quanto sapere SE
       *      sbagliano»*) era dichiarata e non implementata. */
      const got = (String(r.text).match(/-?\d+/g) || []).slice(-1)[0];
      const gotN = got === undefined ? null : Number(got);
      appendFileSync(OUT, JSON.stringify({
        id: p.id, category: p.category, valid: true, pass: g.pass, reasons: g.reasons,
        got: gotN,
        fellInTrap: p.trap !== undefined && gotN === p.trap,
        raw: String(r.text).slice(0, 2000),
      }) + "\n");
      if (p.trap !== undefined && gotN === p.trap) trapCount++;
      console.error(`[${i + 1}/${probes.length}] ${p.id} → ${g.pass ? "PASS" : "fail (" + g.reasons.join("; ") + ")"}`);
    }
    if (i < probes.length - 1) await sleep(PACE_MS);
  }

  const summary = { mode: "base-probe", model: MODEL_ID, base_url: BASE_URL, total: probes.length, valid, invalid,
    passed, failed: valid - passed, pass_rate: valid ? +(passed / valid).toFixed(3) : null,
    // ⚠️ Leggere `fell_in_trap` INSIEME a `failed`: dice se i fallimenti sono la trappola progettata
    //    (il modello legge la superficie) o numeri terzi (calcola male). Sono difetti diversi, e
    //    distinguerli e' meta' del valore del set.
    fell_in_trap: trapCount,
    by_category: Object.fromEntries(Object.entries(byCat).map(([c, s]) => [c, { pass: s.passed, of: s.valid, invalid: s.invalid }])), out: OUT };
  console.log(JSON.stringify(summary, null, 2));
  appendFileSync(OUT, JSON.stringify({ summary }) + "\n");
}

main().catch((e) => { console.error(JSON.stringify({ mode: "base-probe", model: MODEL_ID, error: String(e?.stack ?? e) })); process.exit(1); });

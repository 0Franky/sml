/**
 * qualitative-review — DESIGN-REVIEW QUALITATIVO delle lane da parte di un modello CAPACE (utente: "fatti dire
 * come si stanno trovando con questo metodo di organizzazione e se hanno proposte per migliorare o criticità").
 *
 * NON è harness-in-the-loop: è UNA chat-completion. Diamo al modello un dump REALE del context-window a lane
 * (sanitizzato: niente username/path assoluti → no-PII verso il servizio esterno, regola feedback_no_pii_in_repo)
 * + il razionale del design + domande MIRATE con output JSON aggregabile. Confronto cross-modello: stesso prompt,
 * modelli diversi (deepseek-v4-pro cheap autonomo, poi sonnet-5 al checkpoint).
 *
 * Config (env):
 *   QR_MODEL     = slug OpenRouter (default deepseek/deepseek-v4-pro)
 *   QR_DUMP      = path del context-dump (default harness/.pi/state/trace/last-turn-full.md)
 *   QR_LABEL     = etichetta report (default = slug sanitizzato)
 *   QR_CAP_USD   = tetto di spesa in USD per QUESTA call (default 1.00) — hard-fail se la call costa di più (post-hoc log)
 *   OPENROUTER_KEYS / OPENROUTER_KEY in harness/.env (via env-keys.mjs, SSOT)
 *
 * Uso (cwd=harness/):  QR_MODEL=deepseek/deepseek-v4-pro node eval/qualitative-review.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvKeys, maskKey } from "./env-keys.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARNESS = resolve(__dirname, "..");
const MODEL = process.env.QR_MODEL || "deepseek/deepseek-v4-pro";
const DUMP = resolve(process.env.QR_DUMP || join(HARNESS, ".pi", "state", "trace", "last-turn-full.md"));
const LABEL = process.env.QR_LABEL || MODEL.replace(/[^a-z0-9]+/gi, "-");
const CAP_USD = Number(process.env.QR_CAP_USD || 1.0);
const BASE_URL = (process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/+$/, "");

// --- SANITIZZAZIONE (no-PII verso servizio esterno): redige username reale + path assoluti Win/Unix ---
function sanitize(text) {
  return String(text)
    .replace(/[A-Za-z]:\\Users\\[^\\/\s"']+/g, "<HOME>")        // D:\Users\frhae, C:\Users\frhae
    .replace(/\/(?:home|Users)\/[^\/\s"']+/g, "<HOME>")          // /home/x, /Users/x
    .replace(/\bfrhae\b/gi, "<user>")                             // username residuo
    .replace(/[A-Za-z]:[\\/][^\s"'`]+/g, (m) => m.replace(/^[A-Za-z]:/, "<ABS>")) // altri path assoluti Win
    .replace(/\bsk-or-v1-[A-Za-z0-9]+/g, "<REDACTED_KEY>");      // eventuale key trapelata
}

// --- Estrae solo la parte <context>…</context> + how_memory_works (le LANE), non i native-messages del task ---
function extractLanes(dump) {
  const s = sanitize(dump);
  const memStart = s.indexOf("<how_memory_works");
  const ctxEnd = s.indexOf("</context>");
  if (memStart >= 0 && ctxEnd > memStart) return s.slice(memStart, ctxEnd + "</context>".length);
  // fallback: tutto il system prompt sanitizzato
  const vb = s.indexOf("VERBATIM: SYSTEM");
  return vb >= 0 ? s.slice(vb, s.indexOf("===== VERBATIM: NATIVE") >= 0 ? s.indexOf("===== VERBATIM: NATIVE") : undefined) : s;
}

const DESIGN_RATIONALE = `# Contesto del design che stai valutando

Sto costruendo un "harness" (wrapper) attorno a un coding agent LLM. Problema centrale: un agente che lavora a lungo
supera la finestra di contesto e "dimentica". La mia soluzione NON è un semplice troncamento dell'array-chat né un
rolling-summary. Invece organizzo il contesto in LANE strutturate e persistenti, iniettate a ogni turno:

- <how_memory_works> / <resources>: meta-istruzioni che spiegano al modello che le lane SONO la sua memoria.
- <messages_with_user>: finestra rolling della conversazione (i turni piu vecchi scrollano via).
- <last_tool_calls>: azioni recenti + risultati.
- <task_list> / <current_aim>: stato di lavoro esplicito e persistente.
- <facts>: fatti durevoli salvati dal modello con note() (sopravvivono al rolling e alla compaction).
- <vars>: valori strutturati (set_var/get_var).
- <scratch>: note di lavoro volatili (jot()), finestra rolling.
- <recent_changes>: modifiche recenti a regole/stato.
- <rules>: safety + task + regole di stile.
- Ancoraggio TEMPORALE: ogni riga porta uno shift [+Xs] dallo start-sessione; l'ORDINE autoritativo e dato dagli
  shift, non dalla posizione delle righe.

Il modello riceve UN messaggio per turno; la storia NON e nell'array-chat nativo ma in queste lane.`;

const QUESTIONS = `# Cosa ti chiedo (rispondi come l'AGENTE che DEVE lavorare dentro questo contesto)

Valuta questo schema di organizzazione del contesto dal punto di vista di chi ci deve LAVORARE dentro (tu).
Sii critico e concreto, non gentile: mi serve feedback onesto per migliorarlo. Rispondi SOLO con un oggetto JSON valido
(nessun testo fuori dal JSON) con questo schema:

{
  "overall_verdict": "<2-3 frasi: nel complesso questo layout ti aiuta a lavorare meglio o ti intralcia? perche>",
  "helps_vs_baseline": { "better_than_rolling_summary": true|false, "why": "<perche, concreto>" },
  "criticisms": [ "<criticita/rischio/confusione concreta n.1>", "..." ],
  "confusions": [ "<parti del layout AMBIGUE o che interpreteresti male, se presenti>" ],
  "proposals": [ { "change": "<proposta concreta di miglioramento>", "priority": "high|med|low", "rationale": "<perche>" } ],
  "smaller_model_risks": [ "<per un modello MENO capace (4B-9B), quali parti sarebbero piu difficili da usare bene>" ],
  "redundancy_observed": "<vedi ridondanza/rumore nelle lane mostrate? dove, e quanto ti disturba>"
}

Regole: massimo 6 criticisms, 6 proposals. Ogni item concreto e azionabile (no genericita tipo "migliora la chiarezza").
Priorita: cosa cambieresti PER PRIMO. Se una lane e ottima cosi, dillo. NON inventare parti non mostrate.`;

async function main() {
  const lanes = extractLanes(readFileSync(DUMP, "utf8"));
  const userPrompt = `${DESIGN_RATIONALE}\n\n# Dump REALE del context-window (le lane come le vede l'agente)\n\n\`\`\`\n${lanes}\n\`\`\`\n\n${QUESTIONS}`;

  // DRY-RUN (costo-zero): valida la sanitizzazione (no-PII) + mostra le lane estratte, SENZA chiamare l'API.
  if (process.env.QR_DRY) {
    const leaks = [];
    if (/\bfrhae\b/i.test(userPrompt)) leaks.push("username frhae");
    if (/[A-Za-z]:\\/.test(userPrompt)) leaks.push("path assoluto Win (X:\\)");
    if (/\/(?:home|Users)\/[a-z]/i.test(userPrompt)) leaks.push("path assoluto Unix");
    if (/sk-or-v1-/.test(userPrompt)) leaks.push("openrouter key");
    console.log(`[DRY] lanes-chars=${lanes.length} · prompt-chars=${userPrompt.length}`);
    console.log(`[DRY] PII-leak check: ${leaks.length ? "❌ " + leaks.join(", ") : "✅ pulito"}`);
    console.log(`[DRY] --- prima 1200 char delle lane estratte ---\n${lanes.slice(0, 1200)}`);
    process.exit(leaks.length ? 3 : 0);
  }

  const KEY_PREFIX = process.env.QR_KEY_PREFIX || "OPENROUTER"; // SiliconFlow: QR_KEY_PREFIX=SILICONFLOW + OPENAI_BASE_URL=https://api.siliconflow.com/v1
  const key = (loadEnvKeys(KEY_PREFIX)[0] || "").split(/[,\s]+/).filter(Boolean)[0]; // normalizza \r (CRLF Windows)
  if (!key) { console.error(`Nessuna ${KEY_PREFIX} key in harness/.env`); process.exit(2); }

  console.log(`=== QUALITATIVE DESIGN-REVIEW — model=${MODEL} · key=${maskKey(key)} · CAP=$${CAP_USD} ===`);
  console.log(`dump=${DUMP}  ·  lanes-chars=${lanes.length}  ·  prompt-chars=${userPrompt.length}`);

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: "You are a senior AI systems engineer evaluating a context-management design for an LLM coding agent. Be rigorous, concrete, and critical. Answer ONLY with the requested JSON object." },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: Number(process.env.QR_MAX_TOKENS || 3000),
  };
  if (/openrouter/i.test(BASE_URL)) body.usage = { include: true }; // usage.cost è un'estensione OpenRouter; SiliconFlow lo ignora/rifiuta → gronda solo lì

  const t0 = Date.now();
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/0Franky/sml",
      "X-Title": "ITLMv1-harness-qualitative-review",
    },
    body: JSON.stringify(body),
  });
  const ms = Date.now() - t0;
  const txt = await res.text();
  if (!res.ok) { console.error(`HTTP ${res.status}: ${txt.slice(0, 500)}`); process.exit(1); }
  const j = JSON.parse(txt);
  const content = j.choices?.[0]?.message?.content ?? "";
  let cost = j.usage?.cost ?? null;
  const usage = j.usage ?? {};
  // SiliconFlow (e altri OpenAI-compatibili) NON ritornano usage.cost → calcolalo da token × prezzo per-M (QR_PRICE_IN/OUT USD)
  if (cost == null && process.env.QR_PRICE_IN && process.env.QR_PRICE_OUT) {
    const pin = Number(process.env.QR_PRICE_IN), pout = Number(process.env.QR_PRICE_OUT);
    const it = Number(usage.prompt_tokens ?? 0), ot = Number(usage.completion_tokens ?? 0);
    if (Number.isFinite(pin) && Number.isFinite(pout)) cost = (it * pin + ot * pout) / 1e6;
  }

  // parse JSON dalla risposta (tollerante a ```json fences)
  let parsed = null;
  try {
    const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    parsed = JSON.parse(m ? m[1] : content);
  } catch { /* lascia parsed=null, salviamo il raw */ }

  const dataDir = join(__dirname, "data");
  mkdirSync(dataDir, { recursive: true });
  const outPath = join(dataDir, `qualreview-${LABEL}.json`);
  const report = { model: MODEL, label: LABEL, ts_ms: t0, ms, cost_usd: cost, usage, dump: DUMP,
    prompt_chars: userPrompt.length, parsed, raw: content };
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`\n--- ESITO ---`);
  console.log(`costo: ${cost == null ? "n/d" : "$" + cost.toFixed(4)}  ·  tokens: ${usage.prompt_tokens ?? "?"}→${usage.completion_tokens ?? "?"}  ·  ${ms}ms`);
  if (cost != null && cost > CAP_USD) console.log(`⚠ ATTENZIONE: costo ($${cost.toFixed(4)}) SOPRA il CAP di questa call ($${CAP_USD}) — considera modelli piu economici`);
  if (parsed) {
    console.log(`verdict: ${parsed.overall_verdict}`);
    console.log(`better_than_rolling_summary: ${parsed.helps_vs_baseline?.better_than_rolling_summary}`);
    console.log(`criticisms: ${(parsed.criticisms || []).length}  ·  proposals: ${(parsed.proposals || []).length}  ·  confusions: ${(parsed.confusions || []).length}`);
  } else {
    console.log(`(risposta non-JSON pura — salvato raw, ${content.length} char)`);
  }
  console.log(`\nreport → ${outPath}`);
}

main().catch((e) => { console.error(String(e?.stack ?? e)); process.exit(1); });

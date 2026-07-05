/**
 * run-one — WORKER: risolve UN task HumanEval con UN braccio ({vanilla|ours}) in un workdir ISOLATO, headless.
 *
 * Perché un processo separato per (task,braccio,keepTurns): STATE_DIR è import-time e le connessioni DB sono
 * memoizzate per-processo → l'isolamento pulito è "un processo, un HARNESS_STATE_DIR, un workdir" (no cross-talk).
 * L'orchestratore (run-ab.mjs) fa lo spawn con l'env giusto e poi verifica il risultato col test ufficiale.
 *
 * Config (via env, così l'orchestratore controlla tutto):
 *   EVAL_TASK_FILE  = path JSON del singolo task {task_id, prompt, entry_point, test}
 *   EVAL_ARM        = "vanilla" | "ours"
 *   EVAL_WORKDIR    = workdir isolato (= cwd del processo E cwd della sessione → dove il modello scrive)
 *   HARNESS_STATE_DIR       = dir di stato isolata (letta da state-paths.mjs)  [solo braccio ours]
 *   HARNESS_NATIVE_KEEP_TURNS = keepTurns per il braccio ours (default config = 6)
 *   MODEL_ID (default gemini-3.1-flash-lite)
 *
 * Output: UNA riga JSON su stdout (l'orchestratore la parse-a). NON stampa MAI la GEMINI_API_KEY.
 * Config provider = NATIVA google-generative-ai (verificata: nessun bug store, auth nativo, no gemini-compat).
 */
import { readFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  AuthStorage, ModelRegistry, createAgentSession, DefaultResourceLoader, SessionManager,
} from "@earendil-works/pi-coding-agent";
import { loadGeminiKeys, pickKey } from "./gemini-keys.mjs"; // rotazione multi-chiave (SSOT #16)

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARNESS = resolve(__dirname, "..");
const ENV_PATH = join(HARNESS, ".env");
const EXT_DIR = join(HARNESS, ".pi", "extensions");

const ARM = process.env.EVAL_ARM || "vanilla";
const WORKDIR = process.env.EVAL_WORKDIR || process.cwd();
const TASK_FILE = process.env.EVAL_TASK_FILE;
const MODEL_ID = process.env.MODEL_ID || "gemini-3.1-flash-lite";
const TRACE_DIR = process.env.EVAL_TRACE_DIR; // se set → dumpa la traiettoria COMPLETA (diagnosi harness-vs-modello)

// snapshot JSON-safe e TRONCATO di un evento (instrumento TUTTO lo stream, senza indovinare i nomi-evento)
function snap(ev) {
  const o = { type: ev?.type };
  for (const k of Object.keys(ev || {})) {
    if (k === "type") continue;
    let v = ev[k];
    if (typeof v === "function") continue;
    try { v = typeof v === "string" ? v : JSON.stringify(v); } catch { v = String(v); }
    if (v != null && v.length > 2000) v = v.slice(0, 2000) + `…[+${v.length - 2000}]`;
    o[k] = v;
  }
  return o;
}
if (!TASK_FILE || !existsSync(TASK_FILE)) { console.error(JSON.stringify({ error: `EVAL_TASK_FILE mancante: ${TASK_FILE}` })); process.exit(2); }
const task = JSON.parse(readFileSync(TASK_FILE, "utf8"));

// chiave scelta per-indice (EVAL_KEY_INDEX, impostato dall'orchestratore per round-robin/rotate-on-retry). SSOT: gemini-keys.mjs.
function loadKey() {
  const keys = loadGeminiKeys();
  const idx = Number.parseInt(process.env.EVAL_KEY_INDEX ?? "0", 10) || 0;
  return pickKey(keys, idx);
}
// Headless UI: AUTO-APPROVA i confirm (in un eval automatico non c'è umano; i gate interattivi
// dell'harness — pre-flight/secrets — non devono deadlock-are/negare le azioni legittime di coding).
function makeHeadlessUI() {
  return {
    select: async () => undefined, confirm: async () => true, input: async () => undefined,
    notify: () => {}, onTerminalInput: () => () => {}, setStatus: () => {}, setWorkingMessage: () => {},
    setWorkingVisible: () => {}, setWorkingIndicator: () => {}, setHiddenThinkingLabel: () => {},
    setWidget: () => {}, setFooter: () => {}, setHeader: () => {}, setTitle: () => {},
    custom: async () => { throw new Error("custom UI non supportata headless"); },
  };
}
function extractPyBlock(text) {
  if (!text) return null;
  const m = text.match(/```(?:python)?\s*\n([\s\S]*?)```/i);
  return m ? m[1] : null;
}

async function main() {
  const apiKey = loadKey();

  // --- Provider Gemini NATIVO in-memory (verificato: auth nativo, niente Bearer, niente bug store) ---
  const auth = AuthStorage.inMemory();
  auth.set("gemini", { type: "api_key", key: apiKey });
  const reg = ModelRegistry.inMemory(auth);
  reg.registerProvider("gemini", {
    name: "Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    api: "google-generative-ai", apiKey, authHeader: false,
    models: [{ id: MODEL_ID, name: MODEL_ID, api: "google-generative-ai", reasoning: false, input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 8192 }],
  });
  const model = reg.find("gemini", MODEL_ID);
  if (!model) throw new Error(`modello ${MODEL_ID} non trovato`);

  // --- Loader per braccio: vanilla = 0 estensioni; ours = TUTTE le .pi/extensions (harness completo) ---
  const emptyAgent = mkdtempSync(join(tmpdir(), "eval-agent-"));
  let resourceLoader;
  if (ARM === "ours") {
    const extPaths = readdirSync(EXT_DIR).filter((f) => f.endsWith(".ts")).map((f) => join(EXT_DIR, f));
    resourceLoader = new DefaultResourceLoader({ cwd: WORKDIR, agentDir: emptyAgent, additionalExtensionPaths: extPaths });
    await resourceLoader.reload();
  } else {
    // vanilla: loader che non scopre nulla (dir vuote) → 0 estensioni
    resourceLoader = new DefaultResourceLoader({ cwd: emptyAgent, agentDir: emptyAgent });
    await resourceLoader.reload();
  }

  const { session, extensionsResult } = await createAgentSession({
    cwd: WORKDIR, agentDir: emptyAgent, model, authStorage: auth, modelRegistry: reg,
    resourceLoader, sessionManager: SessionManager.inMemory(WORKDIR),
    // tools default (read/bash/edit/write) + tool delle estensioni (NON passo `tools` per non escluderli)
  });
  const nExt = (extensionsResult?.extensions ?? []).length;
  await session.bindExtensions({ uiContext: makeHeadlessUI() });

  // --- Metriche + diagnostica API via eventi (rule #15: catturo lo status HTTP reale, non lo indovino) ---
  const toolCalls = [];
  const events = []; // traiettoria completa (solo se TRACE_DIR)
  let turns = 0, sawEnd = false, httpStatus = null, retryErr = null;
  session.subscribe((ev) => {
    if (TRACE_DIR) events.push(snap(ev));
    if (ev.type === "turn_end") turns++;
    else if (ev.type === "tool_execution_start") toolCalls.push(ev.toolName);
    else if (ev.type === "after_provider_response") httpStatus = ev.status;
    else if (ev.type === "auto_retry_start") retryErr = String(ev.errorMessage ?? "").slice(0, 200);
  });

  const prompt =
    `Implementa in Python la seguente funzione. Scrivi la soluzione COMPLETA (firma + corpo) nel file ` +
    `\`solution.py\` nella working dir corrente, così che la funzione \`${task.entry_point}\` sia importabile. ` +
    `Puoi eseguire codice per verificarla. Rispondi solo scrivendo il file, senza spiegazioni.\n\n` +
    `${task.prompt}`;

  const done = new Promise((res) => {
    const un = session.subscribe((ev) => { if (ev.type === "agent_end" && !ev.willRetry) { sawEnd = true; un(); res(true); } });
    setTimeout(() => { un(); res("timeout"); }, 180000);
  });
  const t0 = Date.now();
  let sendErr = null;
  try { await session.sendUserMessage(prompt); } catch (e) { sendErr = String(e?.message ?? e); }
  const outcome = await done;
  const ms = Date.now() - t0;

  // --- Estrai la soluzione: prima il file, poi fallback al code-block dell'ultimo messaggio ---
  const solPath = join(WORKDIR, "solution.py");
  let solutionCode = null, source = null;
  if (existsSync(solPath)) { solutionCode = readFileSync(solPath, "utf8"); source = "file"; }
  else {
    const last = session.getLastAssistantText?.() ?? "";
    const blk = extractPyBlock(last);
    if (blk) { solutionCode = blk; source = "codeblock"; }
  }

  let stats = null; try { stats = session.getSessionStats?.(); } catch { /* ignore */ }
  const sys = session.systemPrompt || "";
  const hasContext = sys.includes("<context>");
  const tokens = stats?.tokens?.total ?? null;
  // apiError = la chiamata al provider è fallita (429/5xx/empty deglutito): nessuna soluzione E 0 token,
  // oppure status HTTP >=400, oppure retry esauriti. Da NON contare come FAIL di capacità del modello.
  const apiError = ((!solutionCode) && (tokens === 0 || tokens == null) && outcome !== "timeout")
    || (httpStatus != null && httpStatus >= 400) || (retryErr != null);

  const out = {
    task_id: task.task_id, arm: ARM,
    keep: ARM === "ours" ? Number(process.env.HARNESS_NATIVE_KEEP_TURNS || 6) : null,
    ms, turns, toolCalls, nExt, hasContext,
    tokens, assistantMsgs: stats?.assistantMessages ?? null,
    solutionSource: source, wroteFile: source === "file",
    solutionCode, timedOut: outcome === "timeout", sendErr,
    httpStatus, retryErr, apiError,
  };
  if (TRACE_DIR) {
    try {
      mkdirSync(TRACE_DIR, { recursive: true });
      const base = `${String(task.task_id).replace(/[^\w]/g, "_")}-${ARM}${out.keep ? `-k${out.keep}` : ""}.json`;
      writeFileSync(join(TRACE_DIR, base), JSON.stringify({ ...out, systemPrompt: sys, prompt, events }, null, 2));
    } catch { /* il trace è diagnostica: non deve far fallire il run */ }
  }
  session.dispose();
  process.stdout.write(JSON.stringify(out) + "\n");
  process.exit(0);
}

main().catch((e) => { console.error(JSON.stringify({ task_id: task?.task_id, arm: ARM, error: String(e?.stack ?? e) })); process.exit(1); });

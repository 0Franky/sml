/**
 * run-session — WORKER MODO 2 (long-horizon): risolve N task coding NELLA STESSA sessione (contesto ACCUMULA),
 * poi una PROBE di memoria/timeline. Un braccio ({vanilla|ours}) per processo, workdir+state ISOLATI, headless.
 *
 * A differenza di run-one (Modo 1 = 1 task, sessione usa-e-getta), qui la sessione VIVE su N task senza reset:
 * è dove keepTurns/lane-memory contano e dove emergono i "buchi di conoscenza/timeline". A `keep1` la finestra
 * nativa mostra ~1 turno → per la probe finale il modello DEVE ricordare i task iniziali DALLE NOSTRE LANE.
 *
 * Config (via env):
 *   EVAL_TASKS_FILE = jsonl di N task {task_id, prompt, entry_point, test}
 *   EVAL_N          = quanti task usare dal file (default: tutti)
 *   EVAL_ARM        = "vanilla" | "ours"
 *   EVAL_WORKDIR    = workdir isolato (cwd sessione; i file solution_k.py si accumulano qui)
 *   HARNESS_STATE_DIR / HARNESS_NATIVE_KEEP_TURNS  [braccio ours]
 *   EVAL_TASK_TIMEOUT_MS (default 180000) — timeout per singolo task
 *   MODEL_ID (default gemini-3.1-flash-lite)
 *
 * Output: UNA riga JSON su stdout (l'orchestratore run-session-ab.mjs la grada). NON stampa MAI la key.
 *
 * ⚠️ DRY [track, rule #16]: setup provider/loader/UI duplicato da run-one.mjs → estrarre in eval/_pi-session.mjs.
 */
import { readFileSync, existsSync, readdirSync, mkdtempSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  AuthStorage, ModelRegistry, createAgentSession, DefaultResourceLoader, SessionManager,
} from "@earendil-works/pi-coding-agent";
import { loadGeminiKeys, pickKey } from "./gemini-keys.mjs"; // SSOT multi-key (rule #16): rotazione per-config via EVAL_KEY_INDEX
import { getConversationStore, getVarsQueue } from "../src/state-db.mjs"; // F22: registra i turni-USER nel path SDK + legge la meta eviction
import { convIdFor } from "../src/session-context.mjs"; // convId della sessione (registrato da conversation-capture su session_start)
import { EVICTION_ORDINAL_META } from "../src/meta-keys.mjs"; // F22: per leggere se l'eviction-checkpoint ha girato (guardia di regressione)

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARNESS = resolve(__dirname, "..");
const ENV_PATH = join(HARNESS, ".env");
const EXT_DIR = join(HARNESS, ".pi", "extensions");

const ARM = process.env.EVAL_ARM || "vanilla";
const WORKDIR = process.env.EVAL_WORKDIR || process.cwd();
const TASKS_FILE = process.env.EVAL_TASKS_FILE;
const MODEL_ID = process.env.MODEL_ID || "gemini-3.1-flash-lite";
const TASK_TIMEOUT = Number(process.env.EVAL_TASK_TIMEOUT_MS || 180000);
const INTERTASK_DELAY = Number(process.env.EVAL_INTERTASK_DELAY_MS || 3000); // spazia le richieste (key free)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (!TASKS_FILE || !existsSync(TASKS_FILE)) { console.error(JSON.stringify({ error: `EVAL_TASKS_FILE mancante: ${TASKS_FILE}` })); process.exit(2); }
let tasks = readFileSync(TASKS_FILE, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
if (process.env.EVAL_N) tasks = tasks.slice(0, Math.max(1, parseInt(process.env.EVAL_N, 10)));
const N = tasks.length;

function loadKey() {
  // Multi-key SSOT: legge GEMINI_API_KEYS (comma-sep) o fallback GEMINI_API_KEY, poi seleziona per EVAL_KEY_INDEX
  // (settato dall'orchestratore run-session-ab per isolare ogni config su una chiave diversa → no contesa/quota).
  const keys = loadGeminiKeys();
  if (!keys.length) throw new Error("GEMINI_API_KEY(S) assente in harness/.env");
  const idx = Number.parseInt(process.env.EVAL_KEY_INDEX ?? "0", 10) || 0;
  return pickKey(keys, idx);
}
function makeHeadlessUI() {
  return {
    select: async () => undefined, confirm: async () => true, input: async () => undefined,
    notify: () => {}, onTerminalInput: () => () => {}, setStatus: () => {}, setWorkingMessage: () => {},
    setWorkingVisible: () => {}, setWorkingIndicator: () => {}, setHiddenThinkingLabel: () => {},
    setWidget: () => {}, setFooter: () => {}, setHeader: () => {}, setTitle: () => {},
    custom: async () => { throw new Error("custom UI non supportata headless"); },
  };
}

async function main() {
  const apiKey = loadKey();

  // --- Provider Gemini NATIVO (identico a run-one, verificato) ---
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

  const emptyAgent = mkdtempSync(join(tmpdir(), "eval-agent-"));
  let resourceLoader;
  if (ARM === "ours") {
    const extPaths = readdirSync(EXT_DIR).filter((f) => f.endsWith(".ts")).map((f) => join(EXT_DIR, f));
    resourceLoader = new DefaultResourceLoader({ cwd: WORKDIR, agentDir: emptyAgent, additionalExtensionPaths: extPaths });
    await resourceLoader.reload();
  } else {
    resourceLoader = new DefaultResourceLoader({ cwd: emptyAgent, agentDir: emptyAgent });
    await resourceLoader.reload();
  }

  const sessionManager = SessionManager.inMemory(WORKDIR);
  const { session, extensionsResult } = await createAgentSession({
    cwd: WORKDIR, agentDir: emptyAgent, model, authStorage: auth, modelRegistry: reg,
    resourceLoader, sessionManager,
  });
  const nExt = (extensionsResult?.extensions ?? []).length;
  await session.bindExtensions({ uiContext: makeHeadlessUI() });

  // --- F22 fix: registra i turni-USER nello store ---
  // Il path SDK (`session.sendUserMessage`) NON fa scattare l'hook `input` della conversation-capture (che è per la
  // pipeline della CLI) → i turni-USER non finivano in conversations.db → `store.countUserTurns()`=0 →
  // l'eviction-checkpoint NON scattava MAI nell'eval (mentre nel pi CLI di drive-qwen sì, F16). Li registriamo qui,
  // così l'eval è FEDELE alla produzione (CLI). Store singleton = quello che le extension leggono (stesso HARNESS_STATE_DIR);
  // convId risolto dal sessionManager di QUESTA sessione (registrato da conversation-capture su session_start). [F22]
  const convStore = getConversationStore();
  const recordUserTurn = (t) => { try { convStore.append(convIdFor({ sessionManager }), "user", String(t)); } catch { /* best-effort: la cattura non deve rompere l'eval */ } };

  // --- Diagnostica continua: turni totali + ultimo status HTTP / retry (snapshot per task) ---
  let turns = 0, lastHttpStatus = null, lastRetryErr = null;
  const allToolCalls = [];
  session.subscribe((ev) => {
    if (ev.type === "turn_end") turns++;
    else if (ev.type === "tool_execution_start") allToolCalls.push(ev.toolName);
    else if (ev.type === "after_provider_response") lastHttpStatus = ev.status;
    else if (ev.type === "auto_retry_start") lastRetryErr = String(ev.errorMessage ?? "").slice(0, 200);
  });

  function waitAgentEnd(timeoutMs) {
    return new Promise((res) => {
      const un = session.subscribe((ev) => { if (ev.type === "agent_end" && !ev.willRetry) { un(); res("end"); } });
      setTimeout(() => { un(); res("timeout"); }, timeoutMs);
    });
  }

  // --- Loop long-horizon: N task nella STESSA sessione, contesto accumula ---
  const perTask = [];
  for (let i = 0; i < N; i++) {
    const t = tasks[i];
    const solFile = `solution_${i + 1}.py`;
    const prompt =
      `[Sessione multi-task: task ${i + 1} di ${N}] Implementa in Python la funzione richiesta e scrivi la ` +
      `soluzione COMPLETA (firma + corpo) nel file \`${solFile}\` nella working dir, così che \`${t.entry_point}\` ` +
      `sia importabile. Puoi eseguire codice per verificarla. Ricorda cosa risolvi: a fine sessione ti chiederò ` +
      `di riepilogare i problemi affrontati.\n\n${t.prompt}`;

    const turnsBefore = turns; lastHttpStatus = null; lastRetryErr = null;
    const t0 = Date.now();
    const wait = waitAgentEnd(TASK_TIMEOUT);
    let sendErr = null;
    recordUserTurn(prompt); // F22: registra il turno-USER PRIMA del send → countUserTurns corretto quando il context-hook (eviction) gira in questo turno
    try { await session.sendUserMessage(prompt); } catch (e) { sendErr = String(e?.message ?? e); }
    const outcome = await wait;
    const ms = Date.now() - t0;
    const stats = safeStats(session);
    const solPath = join(WORKDIR, solFile);
    const solutionCode = existsSync(solPath) ? readFileSync(solPath, "utf8") : null;
    const apiError = ((!solutionCode) && outcome !== "timeout" && (lastHttpStatus == null))
      || (lastHttpStatus != null && lastHttpStatus >= 400) || (lastRetryErr != null);
    perTask.push({
      idx: i, task_id: t.task_id, entry_point: t.entry_point, solFile,
      turns: turns - turnsBefore, ms, tokensCumulative: stats?.tokens?.total ?? null,
      wroteFile: !!solutionCode, solutionCode, timedOut: outcome === "timeout",
      httpStatus: lastHttpStatus, retryErr: lastRetryErr, apiError, sendErr,
    });
    if (i < N - 1) await sleep(INTERTASK_DELAY); // pacing tra i task (non prima della probe)
  }
  await sleep(INTERTASK_DELAY);

  // --- PROBE memoria/timeline: senza rileggere i file, ricostruisci cosa hai fatto e in che ORDINE ---
  const probePrompt =
    `Fine sessione. IMPORTANTE: rispondi SOLO dalla memoria, **senza rileggere i file e senza eseguire nulla**. ` +
    `Elenca IN ORDINE i ${N} problemi che hai risolto in questa sessione: per ciascuno (1) il NOME esatto della ` +
    `funzione che hai implementato e (2) una riga su cosa fa. Poi indica quale task hai trovato più difficile e perché.`;
  const turnsBeforeProbe = turns; lastHttpStatus = null; lastRetryErr = null;
  const wait = waitAgentEnd(TASK_TIMEOUT);
  let probeSendErr = null;
  recordUserTurn(probePrompt); // F22: registra anche il turno della probe
  try { await session.sendUserMessage(probePrompt); } catch (e) { probeSendErr = String(e?.message ?? e); }
  const probeOutcome = await wait;
  const probeAnswer = safeLastText(session);
  const statsFinal = safeStats(session);

  const out = {
    mode: "session", arm: ARM,
    keep: ARM === "ours" ? Number(process.env.HARNESS_NATIVE_KEEP_TURNS || 6) : null,
    nTasks: N, nExt, hasContext: (session.systemPrompt || "").includes("<context>"),
    perTask, allToolCalls,
    probe: {
      answer: probeAnswer, turns: turns - turnsBeforeProbe, timedOut: probeOutcome === "timeout",
      httpStatus: lastHttpStatus, retryErr: lastRetryErr, sendErr: probeSendErr,
      apiError: (probeOutcome !== "timeout" && !probeAnswer && lastHttpStatus == null) || (lastHttpStatus != null && lastHttpStatus >= 400) || (lastRetryErr != null),
    },
    finalTokens: statsFinal?.tokens?.total ?? null,
    assistantMsgs: statsFinal?.assistantMessages ?? null,
    // F22 GUARDIA DI REGRESSIONE (rule #17 + no-silent-caps): userTurnsRecorded=0 → il bug "SDK non registra i turni-USER"
    // è tornato → l'eviction-checkpoint non può scattare (era la root-cause di F22). evictionOrdinal>0 → il checkpoint HA girato.
    userTurnsRecorded: (() => { try { return convStore.countUserTurns(convIdFor({ sessionManager })); } catch { return null; } })(),
    evictionOrdinal: (() => { try { return Number(getVarsQueue().getMeta(EVICTION_ORDINAL_META + convIdFor({ sessionManager })) ?? 0) || 0; } catch { return null; } })(),
  };
  session.dispose();
  process.stdout.write(JSON.stringify(out) + "\n");
  process.exit(0);
}

function safeStats(s) { try { return s.getSessionStats?.(); } catch { return null; } }
function safeLastText(s) { try { return s.getLastAssistantText?.() ?? ""; } catch { return ""; } }

main().catch((e) => { console.error(JSON.stringify({ mode: "session", arm: ARM, error: String(e?.stack ?? e) })); process.exit(1); });

/**
 * _e2e-pi-run.mjs — TEST E2E HEADLESS dell'harness pi (ITLMv1).
 *
 * Dimostra che pi gira END-TO-END (una sessione, un turno) con le NOSTRE 7 extension
 * (.pi/extensions/*.ts) caricate, via l'SDK programmatico (NIENTE TUI), contro Gemini reale.
 *
 * NON stampa MAI la GEMINI_API_KEY (solo len/prefix mascherati). L'agente pi gira in
 * READ-ONLY (tools: read/ls/grep/find) → non può scrivere nella repo.
 *
 * Lancio:  node src/_e2e-pi-run.mjs            (cwd = harness/)
 *          MODEL_ID=gemini-3.1-flash-lite node src/_e2e-pi-run.mjs   (override modello)
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AuthStorage,
  ModelRegistry,
  createAgentSession,
} from "@earendil-works/pi-coding-agent";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARNESS_DIR = resolve(__dirname, "../.."); // .../harness
const ENV_PATH = join(HARNESS_DIR, ".env");
const MODELS_JSON = join(HARNESS_DIR, "serving", "models.json");

const log = (...a) => console.log("[e2e]", ...a);
const mask = (s) =>
  typeof s === "string" && s.length > 0
    ? `len=${s.length} prefix=${s.slice(0, 4)}…`
    : "<empty>";

// --- 1) Carica GEMINI_API_KEY da harness/.env (mai stampata in chiaro) ---
function loadEnvKey() {
  if (!existsSync(ENV_PATH)) throw new Error(`.env non trovato: ${ENV_PATH}`);
  const raw = readFileSync(ENV_PATH, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  throw new Error("GEMINI_API_KEY assente in harness/.env");
}

// --- Carica i model-id verificati dal nostro serving/models.json (provider gemini) ---
function geminiModelsFromConfig() {
  try {
    const cfg = JSON.parse(readFileSync(MODELS_JSON, "utf8"));
    const g = cfg.providers?.gemini;
    if (g?.models?.length) return { baseUrl: g.baseUrl, models: g.models };
  } catch {
    /* fallback sotto */
  }
  return {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    models: [
      { id: "gemini-3.5-flash", contextWindow: 1048576, maxTokens: 8192 },
      { id: "gemini-3.1-flash-lite", contextWindow: 1048576, maxTokens: 8192 },
      { id: "gemini-flash-latest", contextWindow: 1048576, maxTokens: 8192 },
    ],
  };
}

// --- Headless UI context (no-op) richiesto da bindExtensions / ctx.ui.notify ---
const notifications = [];
function makeHeadlessUI() {
  return {
    select: async () => undefined,
    confirm: async () => false,
    input: async () => undefined,
    notify: (message, type = "info") => {
      notifications.push({ type, message });
      log(`UI.notify[${type}]: ${message}`);
    },
    onTerminalInput: () => () => {},
    setStatus: () => {},
    setWorkingMessage: () => {},
    setWorkingVisible: () => {},
    setWorkingIndicator: () => {},
    setHiddenThinkingLabel: () => {},
    setWidget: () => {},
    setFooter: () => {},
    setHeader: () => {},
    setTitle: () => {},
    custom: async () => {
      throw new Error("custom UI not supported headless");
    },
  };
}

async function main() {
  const apiKey = loadEnvKey();
  log(`GEMINI_API_KEY caricata: ${mask(apiKey)}`); // MASCHERATA

  const { baseUrl, models } = geminiModelsFromConfig();
  // Default = gemini-3.1-flash-lite: modello NON-thinking. (gemini-3.5-flash è un
  // reasoning-model: con maxTokens basso brucia il budget in reasoning e ritorna vuoto;
  // inoltre 2026-06-29 risponde 503/overloaded. flash-lite è il default robusto.)
  const wantedId = process.env.MODEL_ID || "gemini-3.1-flash-lite";

  // --- 2) Auth in-memory + provider Gemini OpenAI-compat registrato in-memory ---
  const authStorage = AuthStorage.inMemory();
  authStorage.set("gemini", { type: "api_key", key: apiKey });

  const modelRegistry = ModelRegistry.inMemory(authStorage);
  modelRegistry.registerProvider("gemini", {
    name: "Gemini (OpenAI-compat)",
    baseUrl,
    api: "openai-completions",
    apiKey, // anche qui, così getApiKeyAndHeaders risolve senza env
    authHeader: true,
    models: models.map((m) => ({
      id: m.id,
      name: m.id,
      api: "openai-completions",
      reasoning: false,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: m.contextWindow ?? 1048576,
      maxTokens: m.maxTokens ?? 8192,
    })),
  });

  const available = modelRegistry.getAvailable().map((m) => `${m.provider}/${m.id}`);
  log(`Modelli con auth configurata: ${JSON.stringify(available)}`);

  let model = modelRegistry.find("gemini", wantedId);
  if (!model) {
    // fallback al primo gemini disponibile
    model = modelRegistry.getAvailable().find((m) => m.provider === "gemini");
    if (model) log(`Modello '${wantedId}' non trovato → uso ${model.provider}/${model.id}`);
  }
  if (!model) throw new Error("Nessun modello Gemini disponibile dopo registerProvider");
  log(`Modello selezionato: ${model.provider}/${model.id}`);

  // --- 3) Crea sessione. cwd=harness → auto-discovery di .pi/extensions/*.ts.
  //         Tools READ-ONLY → l'agente NON può scrivere nella repo. ---
  // NB: NON usare `tools` come allowlist secca → escluderebbe i tool delle extension.
  // Usiamo `excludeTools` per togliere SOLO i built-in mutanti (edit/write/bash),
  // lasciando attivi read-only + TUTTI i tool delle nostre extension.
  const { session, extensionsResult } = await createAgentSession({
    cwd: HARNESS_DIR,
    model,
    authStorage,
    modelRegistry,
    excludeTools: ["edit", "write", "bash"], // read-only sui built-in; extension-tools restano
  });

  // Diagnostica caricamento extension
  const loadedExt = (extensionsResult?.extensions ?? []).map(
    (e) => e?.name ?? e?.path ?? "?",
  );
  const extErrors = extensionsResult?.errors ?? extensionsResult?.diagnostics ?? [];
  log(`Extension caricate (${loadedExt.length}): ${JSON.stringify(loadedExt)}`);
  if (Array.isArray(extErrors) && extErrors.length) {
    log(`Extension errors/diagnostics: ${JSON.stringify(extErrors).slice(0, 800)}`);
  }

  // --- 4) Bind extension con UI headless → attiva tool+hook (emette session_start) ---
  await session.bindExtensions({ uiContext: makeHeadlessUI() });

  // --- 5) Sottoscrivi eventi: traccia i NOSTRI hook ---
  const seen = { agentEnd: false, turnEnd: 0, toolCalls: [], errors: [] };
  session.subscribe((event) => {
    switch (event.type) {
      case "agent_start":
        log("event: agent_start");
        break;
      case "turn_end":
        seen.turnEnd++;
        log(`event: turn_end #${event.turnIndex}`);
        break;
      case "agent_end":
        seen.agentEnd = true;
        log(`event: agent_end (messages=${event.messages?.length ?? 0}, willRetry=${event.willRetry})`);
        break;
      case "auto_retry_start":
        log(`event: auto_retry_start attempt=${event.attempt}/${event.maxAttempts} (${event.errorMessage})`);
        break;
      case "tool_execution_start":
        seen.toolCalls.push(event.toolName);
        log(`event: tool_execution_start tool=${event.toolName} args=${JSON.stringify(event.args).slice(0, 200)}`);
        break;
      case "message_end": {
        const m = event.message;
        const txt = Array.isArray(m?.content)
          ? m.content.map((c) => (c?.type === "text" ? c.text : `[${c?.type}]`)).join(" ")
          : String(m?.content ?? "");
        log(`event: message_end role=${m?.role} content="${txt.slice(0, 200)}"`);
        break;
      }
      default:
        break;
    }
  });

  // --- VERIFICA (ii): il <context> delle nostre lane è iniettato nel system prompt? ---
  // before_agent_start lo prepende; il system prompt effettivo è disponibile dopo che
  // il primo turno parte. Lo controlliamo dopo sendUserMessage (vedi sotto), ma anche qui
  // catturiamo lo stato corrente per confronto.
  const sysBefore = session.systemPrompt || "";
  log(`system prompt PRE-turn length=${sysBefore.length}, ha <context>=${sysBefore.includes("<context>")}`);

  // --- VERIFICA (iii): i NOSTRI tool sono registrati/disponibili? ---
  const OUR_TOOLS = [
    "set_var", "get_var", "set_task_status", "get_shared_view", "propose_var",
    "merge_proposals", "get_changelog", "set_curr", "list_tasks",
    "sliding_var_read", "sliding_var_replace",
    "remember_lesson", "recall_lessons",
    "add_secret", "run_verifier",
  ];
  const allTools = session.getAllTools().map((t) => t.name);
  const ourPresent = OUR_TOOLS.filter((t) => allTools.includes(t));
  log(`Tool totali registrati (${allTools.length}): ${JSON.stringify(allTools)}`);
  log(`Nostri tool presenti (${ourPresent.length}/${OUR_TOOLS.length}): ${JSON.stringify(ourPresent)}`);

  // --- 6) Manda UN task semplice e safe e attendi la fine del turno ---
  const task =
    "Elenca i file nella working dir corrente (usa il tool ls sulla dir '.') " +
    "e proponi un piano in 2 righe. NON modificare nulla, NON eseguire comandi distruttivi.";
  log(`>>> sendUserMessage: ${task}`);

  const turnDone = new Promise((res) => {
    const unsub = session.subscribe((ev) => {
      if (ev.type === "agent_end" && !ev.willRetry) {
        unsub();
        res();
      }
    });
    // safety timeout 120s
    setTimeout(() => {
      unsub();
      res("timeout");
    }, 120000);
  });

  let sendErr = null;
  try {
    await session.sendUserMessage(task);
  } catch (e) {
    sendErr = e;
    seen.errors.push(String(e?.message ?? e));
    log(`sendUserMessage ERROR: ${e?.message ?? e}`);
  }
  const timedOut = (await turnDone) === "timeout";

  // --- VERIFICA (ii) post-turn: <context> nel system prompt effettivo ---
  const sysAfter = session.systemPrompt || "";
  const hasContext = sysAfter.includes("<context>");
  log(`system prompt POST-turn length=${sysAfter.length}, ha <context>=${hasContext}`);
  if (hasContext) {
    const slice = sysAfter.slice(sysAfter.indexOf("<context>"), sysAfter.indexOf("<context>") + 400);
    log(`--- estratto <context> (primi 400 char) ---\n${slice}\n--- /estratto ---`);
  }

  // --- Output finale del turno + stats ---
  const lastText = session.getLastAssistantText();
  log(`Ultimo messaggio assistant (primi 300 char):\n${(lastText ?? "<nessuno>").slice(0, 300)}`);

  // Dump grezzo di tutti i messaggi del turno (diagnostica: capire se l'LLM ha risposto)
  try {
    const dump = session.messages.map((m) => {
      const c = Array.isArray(m?.content)
        ? m.content.map((b) => (b?.type === "text" ? b.text : `[${b?.type}${b?.name ? ":" + b.name : ""}]`)).join(" ")
        : String(m?.content ?? "");
      return { role: m?.role, customType: m?.customType, content: c.slice(0, 240) };
    });
    log(`messaggi sessione (${dump.length}):\n${JSON.stringify(dump, null, 2).slice(0, 1500)}`);
  } catch (e) {
    log(`dump messaggi err: ${e?.message ?? e}`);
  }

  let stats = null;
  try {
    stats = session.getSessionStats();
    log(`stats: userMsgs=${stats.userMessages} asstMsgs=${stats.assistantMessages} toolCalls=${stats.toolCalls} toolResults=${stats.toolResults} tokens=${stats.tokens?.total ?? "?"}`);
  } catch (e) {
    log(`getSessionStats err: ${e?.message ?? e}`);
  }

  // --- VERIFICA DETERMINISTICA dei guardrail (LLM-independent), via extension runner ---
  // (a) pre-flight gate: un tool_call con `rm -rf` deve essere BLOCCATO.
  // (b) secrets-guardrail: registriamo un secret e verifichiamo che un tool_result che
  //     lo contiene venga REDATTO.
  const guard = { preflightBlocked: null, secretRedacted: null };
  try {
    const runner = session.extensionRunner;
    // (a) pre-flight
    const callRes = await runner.emitToolCall({
      type: "tool_call",
      toolName: "bash",
      toolCallId: "e2e-preflight",
      input: { command: "rm -rf /tmp/should-be-blocked" },
    });
    guard.preflightBlocked = !!callRes?.block;
    log(`guardrail pre-flight: block=${guard.preflightBlocked} reason=${(callRes?.reason ?? "").slice(0, 120)}`);

    // (b) secrets-guardrail — registra un secret fittizio e verifica la redazione.
    const FAKE_SECRET = "SK-e2e-fake-secret-DO-NOT-LEAK-12345";
    const addTool = session.getToolDefinition("add_secret");
    if (addTool?.execute) {
      await addTool.execute("e2e-add", { value: FAKE_SECRET }, undefined, undefined, {});
    }
    const resRes = await runner.emitToolResult({
      type: "tool_result",
      toolName: "read",
      toolCallId: "e2e-redact",
      content: [{ type: "text", text: `qui c'è un segreto: ${FAKE_SECRET} fine` }],
    });
    const redactedText =
      Array.isArray(resRes?.content) && resRes.content[0]?.type === "text" ? resRes.content[0].text : null;
    guard.secretRedacted = redactedText != null && !redactedText.includes(FAKE_SECRET);
    log(`guardrail secrets: redacted=${guard.secretRedacted} out="${(redactedText ?? "<invariato>").slice(0, 120)}"`);
  } catch (e) {
    log(`guardrail verify err: ${e?.message ?? e}`);
  }

  // --- VERIFICA (iv): nessun secret stampato. Scansiona tutto l'output catturato. ---
  // (Il guardrail redige i tool_result; qui verifichiamo che la chiave non sia trapelata.)
  const keyLeaked = JSON.stringify({ sysAfter, lastText, notifications }).includes(apiKey);
  log(`Secret leak nell'output catturato: ${keyLeaked ? "SÌ (BUG!)" : "no"}`);

  // --- Verdetto ---
  const turnCompleted = seen.agentEnd && !timedOut && !sendErr;
  const modelResponded =
    (typeof lastText === "string" && lastText.trim().length > 0) ||
    (stats?.assistantMessages ?? 0) > 0 ||
    (stats?.tokens?.total ?? 0) > 0;
  const verdict = {
    e2e_riuscito:
      turnCompleted && hasContext && ourPresent.length > 0 && !keyLeaked && modelResponded,
    turno_completato: turnCompleted,
    modello_ha_risposto: modelResponded,
    timeout: timedOut,
    context_iniettato: hasContext,
    nostri_tool_presenti: `${ourPresent.length}/${OUR_TOOLS.length}`,
    secret_leak: keyLeaked,
    preflight_gate_blocca_rm_rf: guard.preflightBlocked,
    secrets_guardrail_redige: guard.secretRedacted,
    turn_end_count: seen.turnEnd,
    tool_calls: seen.toolCalls,
    notifications_count: notifications.length,
    assistant_tokens_total: stats?.tokens?.total ?? null,
    send_error: sendErr ? String(sendErr?.message ?? sendErr) : null,
  };
  log("=== VERDETTO ===");
  log(JSON.stringify(verdict, null, 2));

  session.dispose();
  process.exit(verdict.e2e_riuscito ? 0 : 1);
}

main().catch((e) => {
  console.error("[e2e] FATAL:", e?.stack ?? e);
  process.exit(2);
});

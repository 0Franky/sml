/**
 * _pi-session — la SSOT per aprire una sessione pi headless in una workdir, con provider intercambiabile.
 *
 * Nato per eval/run-scene.mjs (ADR 2026-07-26-fixture-runner, punto 2). run-one.mjs e run-session.mjs
 * hanno ancora la loro copia inline della stessa logica (DRY tracciato in run-session.mjs:22): vanno
 * migrati qui, non ricopiati altrove. Provider: ollama (locale, quota-free) · openai-compat (Groq/OpenRouter/
 * SiliconFlow via OPENAI_BASE_URL + KEYS_PREFIX) · gemini (nativo). NON stampa mai una chiave.
 */
import { mkdtempSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  AuthStorage, ModelRegistry, createAgentSession, DefaultResourceLoader, SessionManager,
} from "@earendil-works/pi-coding-agent";

const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXT_DIR = join(HARNESS, ".pi", "extensions");

export function makeHeadlessUI() {
  return {
    select: async () => undefined, confirm: async () => true, input: async () => undefined,
    notify: () => {}, onTerminalInput: () => () => {}, setStatus: () => {}, setWorkingMessage: () => {},
    setWorkingVisible: () => {}, setWorkingIndicator: () => {}, setHiddenThinkingLabel: () => {},
    setWidget: () => {}, setFooter: () => {}, setHeader: () => {}, setTitle: () => {},
    custom: async () => { throw new Error("custom UI non supportata headless"); },
  };
}

/** Registra il modello sul provider scelto e ritorna { auth, reg, model }. */
export async function registerModel({ provider, modelId, ctx }) {
  const auth = AuthStorage.inMemory();
  const reg = ModelRegistry.inMemory(auth);
  const base = (api, name, apiKey, authHeader, contextWindow) => ({
    name, api, apiKey, authHeader,
    models: [{ id: modelId, name: modelId, api, reasoning: false, input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow, maxTokens: 8192 }],
  });
  if (provider === "ollama") {
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1";
    auth.set("ollama", { type: "api_key", key: "ollama" });
    reg.registerProvider("ollama", { baseUrl, ...base("openai-completions", "Ollama", "ollama", true, ctx || 32768) });
    return { auth, reg, model: reg.find("ollama", modelId) };
  }
  if (provider === "openai" || provider === "groq" || provider === "openrouter") {
    const baseUrl = (process.env.OPENAI_BASE_URL
      || (provider === "openrouter" ? "https://openrouter.ai/api/v1" : "https://api.groq.com/openai/v1")).replace(/\/+$/, "");
    const prefix = process.env.KEYS_PREFIX || (provider === "openrouter" || /openrouter/i.test(baseUrl) ? "OPENROUTER" : "GROQ");
    const { loadEnvKeys } = await import("./env-keys.mjs");
    const apiKey = process.env.OPENAI_API_KEY || loadEnvKeys(prefix)[0];
    if (!apiKey) throw new Error(`nessuna key per provider ${provider} (prefix ${prefix}) in .env`);
    // nome provider UNIVOCO `apicompat` — "openai" collide col provider built-in di pi (vedi run-session.mjs)
    auth.set("apicompat", { type: "api_key", key: apiKey });
    reg.registerProvider("apicompat", { baseUrl, ...base("openai-completions", "OpenAI-compat", apiKey, true, ctx || 131072) });
    return { auth, reg, model: reg.find("apicompat", modelId) };
  }
  const { loadGeminiKeys, pickKey } = await import("./gemini-keys.mjs");
  const keys = loadGeminiKeys();
  if (!keys.length) throw new Error("GEMINI_API_KEY(S) assente in harness/.env");
  const apiKey = pickKey(keys, Number.parseInt(process.env.EVAL_KEY_INDEX ?? "0", 10) || 0);
  auth.set("gemini", { type: "api_key", key: apiKey });
  reg.registerProvider("gemini", {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    ...base("google-generative-ai", "Gemini", apiKey, false, ctx || 1048576),
  });
  return { auth, reg, model: reg.find("gemini", modelId) };
}

/**
 * Apre una sessione pi headless in `cwd`. arm = "vanilla" (0 estensioni) | "ours" (tutte le .pi/extensions).
 * Ritorna { session, nExt, waitAgentEnd(timeoutMs) }.
 */
export async function openSession({ cwd, provider, modelId, arm = "vanilla", ctx }) {
  const { auth, reg, model } = await registerModel({ provider, modelId, ctx });
  if (!model) throw new Error(`modello ${modelId} (provider ${provider}) non trovato`);
  const emptyAgent = mkdtempSync(join(tmpdir(), "eval-agent-"));
  let resourceLoader;
  if (arm === "ours") {
    const extPaths = readdirSync(EXT_DIR).filter((f) => f.endsWith(".ts")).map((f) => join(EXT_DIR, f));
    resourceLoader = new DefaultResourceLoader({ cwd, agentDir: emptyAgent, additionalExtensionPaths: extPaths });
  } else {
    resourceLoader = new DefaultResourceLoader({ cwd: emptyAgent, agentDir: emptyAgent }); // 0 estensioni
  }
  await resourceLoader.reload();
  const { session, extensionsResult } = await createAgentSession({
    cwd, agentDir: emptyAgent, model, authStorage: auth, modelRegistry: reg,
    resourceLoader, sessionManager: SessionManager.inMemory(cwd),
  });
  await session.bindExtensions({ uiContext: makeHeadlessUI() });
  const waitAgentEnd = (timeoutMs) => new Promise((res) => {
    const un = session.subscribe((ev) => { if (ev.type === "agent_end" && !ev.willRetry) { un(); res("end"); } });
    setTimeout(() => { un(); res("timeout"); }, timeoutMs);
  });
  return { session, nExt: (extensionsResult?.extensions ?? []).length, waitAgentEnd };
}

/**
 * _smoke-gemini — verifica (rule #15) che il provider Gemini funzioni HEADLESS con la config del braccio
 * VANILLA: API NATIVA `google-generative-ai` (niente campi OpenAI-only → niente bug `store`/HTTP400) e
 * ZERO nostre estensioni. Se questo risponde, `pi --no-extensions` col provider nativo è vanilla-che-funziona.
 *
 * Confronto opzionale: GEMINI_API=openai-completions per riprodurre il bug (senza gemini-compat 400-a).
 * NON stampa MAI la key (solo len/prefix). cwd+agentDir = temp vuote → default loader NON trova estensioni.
 *
 * Uso (cwd=harness/):  node eval/_smoke-gemini.mjs
 *   MODEL_ID=... GEMINI_API=google-generative-ai|openai-completions
 */
import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { AuthStorage, ModelRegistry, createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";

const here = dirname(fileURLToPath(import.meta.url));
const HARNESS = resolve(here, "..");
const ENV = join(HARNESS, ".env");
const mask = (s) => (typeof s === "string" && s ? `len=${s.length} prefix=${s.slice(0, 4)}…` : "<empty>");

function loadKey() {
  if (!existsSync(ENV)) throw new Error(`.env non trovato: ${ENV}`);
  for (const l of readFileSync(ENV, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  throw new Error("GEMINI_API_KEY assente in harness/.env");
}
function makeHeadlessUI() {
  const notify = (message, type = "info") => console.log(`  UI.notify[${type}]: ${message}`);
  return {
    select: async () => undefined, confirm: async () => false, input: async () => undefined,
    notify, onTerminalInput: () => () => {}, setStatus: () => {}, setWorkingMessage: () => {},
    setWorkingVisible: () => {}, setWorkingIndicator: () => {}, setHiddenThinkingLabel: () => {},
    setWidget: () => {}, setFooter: () => {}, setHeader: () => {}, setTitle: () => {},
    custom: async () => { throw new Error("custom UI non supportata headless"); },
  };
}

const apiKey = loadKey();
console.log(`[smoke] GEMINI_API_KEY: ${mask(apiKey)}`);
const MODEL = process.env.MODEL_ID || "gemini-3.1-flash-lite";
const API = process.env.GEMINI_API || "google-generative-ai";
const BASE = API === "google-generative-ai"
  ? "https://generativelanguage.googleapis.com/v1beta"
  : "https://generativelanguage.googleapis.com/v1beta/openai/";
console.log(`[smoke] api=${API} model=${MODEL} base=${BASE}`);

const auth = AuthStorage.inMemory();
auth.set("gemini", { type: "api_key", key: apiKey });
const reg = ModelRegistry.inMemory(auth);
reg.registerProvider("gemini", {
  // Bearer solo per OpenAI-compat; l'adapter NATIVO google-generative-ai gestisce l'auth da sé (?key=/x-goog-api-key).
  name: "Gemini", baseUrl: BASE, api: API, apiKey, authHeader: API === "openai-completions",
  models: [{
    id: MODEL, name: MODEL, api: API, reasoning: false, input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 8192,
  }],
});
const model = reg.find("gemini", MODEL) || (await reg.getAvailable?.())?.find?.((m) => m.provider === "gemini");
if (!model) { console.error("[smoke] modello non trovato dopo registerProvider"); process.exit(1); }

// Braccio VANILLA: cwd + agentDir = temp VUOTE → il default loader non scopre estensioni.
const emptyCwd = mkdtempSync(join(tmpdir(), "smoke-cwd-"));
const emptyAgent = mkdtempSync(join(tmpdir(), "smoke-agent-"));

const { session, extensionsResult } = await createAgentSession({
  cwd: emptyCwd, agentDir: emptyAgent, model, authStorage: auth, modelRegistry: reg,
  sessionManager: SessionManager.inMemory(emptyCwd),
  tools: ["read", "ls"],
});
console.log(`[smoke] estensioni caricate: ${(extensionsResult?.extensions ?? []).length} (atteso 0 = vanilla)`);

await session.bindExtensions({ uiContext: makeHeadlessUI() });

let sawEnd = false, lastErr = null;
session.subscribe((ev) => {
  if (ev.type === "auto_retry_start") { lastErr = ev.errorMessage; console.log(`  auto_retry_start: ${String(ev.errorMessage).slice(0, 300)}`); }
  if (ev.type === "after_provider_response") console.log(`  http_status=${ev.status}`);
});
const done = new Promise((res) => {
  const un = session.subscribe((ev) => { if (ev.type === "agent_end" && !ev.willRetry) { sawEnd = true; un(); res(true); } });
  setTimeout(() => { un(); res("timeout"); }, 90000);
});

const t0 = Date.now();
let sendErr = null;
try { await session.sendUserMessage("Rispondi con ESATTAMENTE la parola: OK"); }
catch (e) { sendErr = String(e?.message ?? e); }
const outcome = await done;
const ms = Date.now() - t0;

const last = (session.getLastAssistantText?.() ?? "").trim();
let stats = null; try { stats = session.getSessionStats?.(); } catch { /* ignore */ }
const leaked = JSON.stringify({ last }).includes(apiKey);

// Diagnostica errore (empty reply → HTTP fallito deglutito): mostra errorMessage + dump messaggi.
console.log(`[smoke] lastErr=${lastErr ? String(lastErr).slice(0, 300) : "none"}`);
console.log(`[smoke] state.errorMessage=${session.agent?.state?.errorMessage ?? "none"}`);
try {
  const dump = (session.messages ?? []).map((m) => ({
    role: m?.role, ct: m?.customType,
    c: (Array.isArray(m?.content) ? m.content.map((b) => (b?.type === "text" ? b.text : `[${b?.type}]`)).join(" ") : String(m?.content ?? "")).slice(0, 160),
  }));
  console.log(`[smoke] messages(${dump.length}): ${JSON.stringify(dump).slice(0, 700)}`);
} catch (e) { console.log(`[smoke] dump err: ${e?.message ?? e}`); }

console.log(`[smoke] outcome=${outcome} ms=${ms} agent_end=${sawEnd} sendErr=${sendErr ?? "no"}`);
console.log(`[smoke] reply="${last.slice(0, 160)}"`);
console.log(`[smoke] tokens=${stats?.tokens?.total ?? "?"} asstMsgs=${stats?.assistantMessages ?? "?"}`);
console.log(`[smoke] key-leak=${leaked ? "SÌ(BUG)" : "no"}`);

session.dispose();
const okReply = /\bok\b/i.test(last);
console.log(`[smoke] VERDETTO: ${okReply && !leaked ? "PASS (nativo funziona headless, vanilla-config)" : "FAIL"}`);
process.exit(okReply && !leaked ? 0 : 1);

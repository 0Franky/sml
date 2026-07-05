/**
 * _probe-intelligence — probe DIRETTO (one-shot) di RAGIONAMENTO, senza il loop agentico (rule #14: il loop
 * agentico è un confound — 3.5-flash non scrive il file e l'eval lo segna no-solution ≠ non sa risolverlo).
 * Dà il problema al modello, chiede SOLO un code-block, estrae il codice, lo grada sull'oracolo nascosto.
 * Confronta N modelli sullo STESSO task → isola "è gap di intelligenza?" (smart passa ∧ debole fallisce).
 *
 * Uso: PROBE_TASK=eval/data/he145.jsonl PROBE_MODELS=gemini-3.5-flash,gemini-3.1-flash-lite node eval/_probe-intelligence.mjs
 */
import { readFileSync, mkdtempSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { AuthStorage, ModelRegistry, createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";
import { loadGeminiKeys, pickKey, maskKey } from "./gemini-keys.mjs";
import { runPython } from "./py-run.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const TASK_FILE = resolve(process.env.PROBE_TASK || join(here, "data", "he145.jsonl"));
const MODELS = (process.env.PROBE_MODELS || "gemini-3.5-flash,gemini-3.1-flash-lite").split(",").map((s) => s.trim()).filter(Boolean);
const keys = loadGeminiKeys();
if (!keys.length) throw new Error("nessuna GEMINI key in .env");

const tasks = readFileSync(TASK_FILE, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);

function extractCode(text) {
  const m = String(text || "").match(/```(?:python)?\s*([\s\S]*?)```/i);
  return m ? m[1] : String(text || "");
}
function headlessUI() {
  const noop = () => {};
  return {
    select: async () => undefined, confirm: async () => false, input: async () => undefined,
    notify: noop, onTerminalInput: () => () => {}, setStatus: noop, setWorkingMessage: noop,
    setWorkingVisible: noop, setWorkingIndicator: noop, setHiddenThinkingLabel: noop, setWidget: noop,
    setFooter: noop, setHeader: noop, setTitle: noop, custom: async () => { throw new Error("no custom UI"); },
  };
}

async function askOnce(model, apiKey, prompt) {
  const auth = AuthStorage.inMemory();
  auth.set("gemini", { type: "api_key", key: apiKey });
  const reg = ModelRegistry.inMemory(auth);
  reg.registerProvider("gemini", {
    name: "Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta", api: "google-generative-ai",
    apiKey, authHeader: false,
    models: [{ id: model, name: model, api: "google-generative-ai", reasoning: false, input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 1048576, maxTokens: 8192 }],
  });
  const m = reg.find("gemini", model);
  if (!m) throw new Error(`modello non trovato: ${model}`);
  const cwd = mkdtempSync(join(tmpdir(), "probe-cwd-"));
  const agentDir = mkdtempSync(join(tmpdir(), "probe-agent-"));
  const { session } = await createAgentSession({
    cwd, agentDir, model: m, authStorage: auth, modelRegistry: reg,
    sessionManager: SessionManager.inMemory(cwd), tools: [],
  });
  await session.bindExtensions({ uiContext: headlessUI() });
  let httpErr = null;
  session.subscribe((ev) => { if (ev.type === "auto_retry_start") httpErr = String(ev.errorMessage || "").slice(0, 160); });
  const done = new Promise((res) => {
    const un = session.subscribe((ev) => { if (ev.type === "agent_end" && !ev.willRetry) { un(); res(true); } });
    setTimeout(() => { un(); res("timeout"); }, 90000);
  });
  let sendErr = null;
  try { await session.sendUserMessage(prompt); } catch (e) { sendErr = String(e?.message ?? e); }
  await done;
  const text = (session.getLastAssistantText?.() ?? "").trim();
  const stateErr = session.agent?.state?.errorMessage ?? null;
  session.dispose();
  return { text, sendErr, err: httpErr || stateErr };
}

const PROMPT_TPL = (t) =>
  `Scrivi la funzione Python COMPLETA (firma + corpo) per il problema seguente. ` +
  `Rispondi con SOLO un blocco \`\`\`python ...\`\`\` che contiene la funzione, senza spiegazioni.\n\n${t.prompt}`;

console.log(`\n=== PROBE INTELLIGENZA (one-shot, no loop agentico) — task=${tasks.map((t) => t.entry_point).join(",")} ===`);
for (let mi = 0; mi < MODELS.length; mi++) {
  const model = MODELS[mi];
  // rotazione chiavi: parti da index 1 per evitare la key0 (quella che gli eval default consumano di più)
  const apiKey = pickKey(keys, (mi + 1) % keys.length);
  console.log(`\n--- ${model}  (key ${maskKey(apiKey)}) ---`);
  for (const t of tasks) {
    let ok = false, note = "";
    try {
      // su reply-vuota (api-err/quota) ritenta su chiavi diverse finché una risponde (max = tutte le chiavi)
      let text = "", sendErr = null, err = null;
      for (let k = 0; k < keys.length; k++) {
        const kk = pickKey(keys, (mi + 1 + k) % keys.length);
        ({ text, sendErr, err } = await askOnce(model, kk, PROMPT_TPL(t)));
        if (text) break;
      }
      if (!text) { note = `reply-vuota — ${sendErr || err || "api-err su tutte le chiavi"}`.slice(0, 150); }
      else {
        const code = extractCode(text);
        const r = runPython(code + "\n" + t.test + "\ncheck(" + t.entry_point + ")", { timeoutMs: 8000 });
        ok = r.ok;
        note = ok ? "PASS" : `FAIL ${(r.stderr || r.error || "").split("\n").filter(Boolean).slice(-1)[0] || ""}`.slice(0, 140);
      }
    } catch (e) { note = `ERR ${String(e?.message ?? e).slice(0, 120)}`; }
    console.log(`  ${t.entry_point}: ${ok ? "PASS ✓" : "FAIL ✗"}  ${note}`);
  }
}
console.log("");

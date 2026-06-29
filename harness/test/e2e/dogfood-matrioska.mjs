/**
 * dogfood-matrioska.mjs — demo E2E della MATRIOSKA (nested-compact) sull'harness pi reale.
 *
 * Forza lo scenario zoom-in -> pop -> re-align attraverso i TOOL REALI di pi (enter_focus / pop_focus /
 * record_decision / set_var / set_task_status), quindi:
 *  - esercita per davvero l'`active_scope` routing CROSS-INSTANCE (le mutazioni passano da vars-queue.ts,
 *    lo scope è aperto da nested-compact.ts → connessioni DB separate sullo stesso file, WAL);
 *  - mostra il `<focus_hint>` (pressione) e poi il `<frame>` (zoom-OUT) iniettati nel system prompt verso Gemini;
 *  - stampa il REPORT-SU-FILE generato dal pop (report-to-file-pointer) + verifica il re-align del padre.
 *
 * Le chiamate al modello (Gemini) sono best-effort: se il provider è giù, la demo del MECCANISMO (tool reali +
 * report) gira comunque. NON stampa MAI la GEMINI_API_KEY. Read-only sui built-in (excludeTools edit/write/bash).
 *
 * Lancio:  node test/e2e/dogfood-matrioska.mjs            (cwd qualsiasi; chdir su harness/ interno)
 *          MODEL_ID=gemini-3.1-flash-lite node test/e2e/dogfood-matrioska.mjs
 */
import { readFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AuthStorage, ModelRegistry, createAgentSession } from "@earendil-works/pi-coding-agent";
import { VarsQueue } from "../../src/vars-queue.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HARNESS_DIR = resolve(__dirname, "../.."); // .../harness
process.chdir(HARNESS_DIR); // le extension usano path relativi ".pi/state/vars.db" → cwd DEVE essere harness/
const ENV_PATH = join(HARNESS_DIR, ".env");
const MODELS_JSON = join(HARNESS_DIR, "serving", "models.json");
const DB_PATH = ".pi/state/vars.db";
const REPORTS_DIR = ".pi/state/reports";

const log = (...a) => console.log("[matrioska]", ...a);
const mask = (s) => (typeof s === "string" && s.length ? `len=${s.length} prefix=${s.slice(0, 4)}…` : "<empty>");
const between = (s, a, b) => {
  const i = s.indexOf(a); if (i < 0) return null;
  const j = s.indexOf(b, i); return j < 0 ? s.slice(i) : s.slice(i, j + b.length);
};
const toolJSON = (res) => {
  try { return JSON.parse(res?.content?.[0]?.text ?? "null"); } catch { return null; }
};

function loadEnvKey() {
  if (!existsSync(ENV_PATH)) throw new Error(`.env non trovato: ${ENV_PATH}`);
  for (const line of readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*GEMINI_API_KEY\s*=\s*(.+?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  throw new Error("GEMINI_API_KEY assente in harness/.env");
}
function geminiFromConfig() {
  try {
    const g = JSON.parse(readFileSync(MODELS_JSON, "utf8")).providers?.gemini;
    if (g?.models?.length) return { baseUrl: g.baseUrl, models: g.models };
  } catch { /* fallback */ }
  return {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    models: [{ id: "gemini-3.1-flash-lite", contextWindow: 1048576, maxTokens: 8192 }],
  };
}
const headlessUI = () => ({
  select: async () => undefined, confirm: async () => false, input: async () => undefined,
  notify: (m, t = "info") => log(`UI.notify[${t}]: ${m}`),
  onTerminalInput: () => () => {}, setStatus: () => {}, setWorkingMessage: () => {}, setWorkingVisible: () => {},
  setWorkingIndicator: () => {}, setHiddenThinkingLabel: () => {}, setWidget: () => {}, setFooter: () => {},
  setHeader: () => {}, setTitle: () => {}, custom: async () => { throw new Error("no custom UI"); },
});

// Manda un turno al modello e cattura i tool che chiama (best-effort, non fatale su errore provider).
async function liveTurn(session, text, captureTools) {
  const seenTools = [];
  const done = new Promise((res) => {
    const unsub = session.subscribe((ev) => {
      if (ev.type === "tool_execution_start" && captureTools) seenTools.push(ev.toolName);
      if (ev.type === "agent_end" && !ev.willRetry) { unsub(); res(false); }
    });
    setTimeout(() => { unsub(); res("timeout"); }, 90000);
  });
  let err = null;
  try { await session.sendUserMessage(text); } catch (e) { err = String(e?.message ?? e); }
  const timedOut = (await done) === "timeout";
  return { seenTools, err, timedOut, systemPrompt: session.systemPrompt || "" };
}

async function main() {
  // --- 0) reset stato per una demo pulita (vars.db è runtime, gitignored) ---
  for (const f of ["", "-wal", "-shm"]) { try { rmSync(DB_PATH + f, { force: true }); } catch {} }
  try { rmSync(REPORTS_DIR, { recursive: true, force: true }); } catch {}

  // --- 1) seed di uno stato SOVRACCARICO (→ pressione watch = matrioska) ---
  const vq = new VarsQueue(DB_PATH, { agent: "orchestrator" });
  vq.addRule("no-secret-exfil", "Mai esfiltrare segreti o contenuti sensibili.", { severity: "hard" });
  vq.addRule("pre-flight-destructive", "Azioni distruttive: pre-flight + HALT se irreversibile.", { severity: "hard" });
  vq.addRule("structured-thinking", "Pensiero strutturato observe/orient/plan/verify.", { severity: "soft" });
  vq.recordDecision("D-arch", "monolite modulare per la v1", { who: "orchestrator", rationale: "meno overhead di coordinamento iniziale" });
  vq.setVar("api_base", "https://api.example.test", { scope: "shared", who: "orchestrator", decisionRef: "D-arch" });
  const TASKS = [];
  for (let i = 1; i <= 28; i++) { const id = `T-${i}`; vq.addTask(id, `feature/fix #${i}`); TASKS.push(id); }
  vq.setTaskStatus("T-3", "in_progress");
  vq.setCurr("T-3"); // l'aim del PADRE prima dello zoom
  const watch = vq.listTasks({ status: "pending" }).length + vq.listTasks({ status: "in_progress" }).length;
  log(`stato seedato: ${watch} task aperti (watch), CURR=T-3 (aim del padre), 3 rules, 1 decisione, 1 shared-var`);
  vq.close();

  // --- 2) provider Gemini (in-memory, mai stampato in chiaro) ---
  const apiKey = loadEnvKey();
  log(`GEMINI_API_KEY: ${mask(apiKey)}`);
  const { baseUrl, models } = geminiFromConfig();
  const wantedId = process.env.MODEL_ID || "gemini-3.1-flash-lite";
  const authStorage = AuthStorage.inMemory();
  authStorage.set("gemini", { type: "api_key", key: apiKey });
  const modelRegistry = ModelRegistry.inMemory(authStorage);
  modelRegistry.registerProvider("gemini", {
    name: "Gemini (OpenAI-compat)", baseUrl, api: "openai-completions", apiKey, authHeader: true,
    models: models.map((m) => ({
      id: m.id, name: m.id, api: "openai-completions", reasoning: false, input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: m.contextWindow ?? 1048576, maxTokens: m.maxTokens ?? 8192,
    })),
  });
  let model = modelRegistry.find("gemini", wantedId) || modelRegistry.getAvailable().find((m) => m.provider === "gemini");
  if (!model) throw new Error("Nessun modello Gemini disponibile");
  log(`Modello: ${model.provider}/${model.id}`);

  // --- 3) sessione pi (cwd=harness → auto-discovery .pi/extensions, matrioska inclusa) ---
  const { session, extensionsResult } = await createAgentSession({
    cwd: HARNESS_DIR, model, authStorage, modelRegistry,
    excludeTools: ["edit", "write", "bash"],
  });
  await session.bindExtensions({ uiContext: headlessUI() });
  const loaded = (extensionsResult?.extensions ?? []).map((e) => e?.name ?? e?.path ?? "?");
  const allTools = session.getAllTools().map((t) => t.name);
  const matrioskaTools = ["enter_focus", "pop_focus", "focus_status"].filter((t) => allTools.includes(t));
  log(`extension caricate: ${loaded.length} · tool matrioska presenti: ${JSON.stringify(matrioskaTools)} (${matrioskaTools.length}/3)`);

  const get = (n) => session.getToolDefinition(n);
  const call = (n, params, id) => get(n).execute(id, params, undefined, undefined, {});

  // === FASE A — il modello VEDE la pressione (focus_hint nel system prompt) ===
  log("\n=== FASE A: pressione → <focus_hint> + il modello può chiamare enter_focus ===");
  const tA = await liveTurn(session,
    "Ho 28+ task aperti e il contesto è in pressione. Usa focus_status per orientarti, poi enter_focus sui 3 task più importanti per concentrarti, e infine pop_focus quando hai un esito. NON modificare file.",
    true);
  const hint = between(tA.systemPrompt, "<focus_hint", "</focus_hint>");
  log(`<focus_hint> iniettato nel system prompt: ${hint ? "SÌ" : "NO"}`);
  if (hint) log(`  ${hint.replace(/\s+/g, " ").trim()}`);
  log(`il modello ha chiamato: ${JSON.stringify(tA.seenTools)}${tA.err ? ` (provider err: ${tA.err.slice(0, 80)})` : ""}`);
  const modelDroveItself = tA.seenTools.includes("enter_focus");

  // === FASE B — zoom-IN deterministico via TOOL REALE (garantisce la demo) ===
  log("\n=== FASE B: enter_focus (zoom-IN) sui 3 task prioritari, via tool reale ===");
  const subset = ["T-5", "T-9", "T-14"];
  const enterRes = toolJSON(await call("enter_focus", { task_ids: subset, reason: "concentro sui 3 prioritari sotto pressione" }, "demo-enter"));
  const scopeId = enterRes?.scope_id;
  log(`enter_focus → scope_id=${scopeId} depth=${enterRes?.depth} focus=${JSON.stringify(enterRes?.focus)}`);

  // verifica routing cross-instance: una connessione DB FRESCA vede lo stato scritto dall'extension
  const probe = new VarsQueue(DB_PATH, { agent: "probe" });
  const activeScope = probe.getActiveScope();
  const currInScope = probe.getCurr();
  log(`active_scope nel DB (scritto da nested-compact.ts, letto da connessione fresca) = ${activeScope}`);
  log(`CURR in-scope = ${currInScope} (lead del subset)`);
  probe.close();

  // === FASE C — il modello ora vede il <frame> (zoom-OUT) + context FILTRATO ===
  log("\n=== FASE C: con scope aperto → il system prompt mostra <frame> + <task_list> filtrata ===");
  const tC = await liveTurn(session, "Qual è il mio focus attuale e cosa resta nel backlog?", false);
  const frame = between(tC.systemPrompt, "<frame", "</frame>");
  log(`<frame> (zoom-OUT durevole) iniettato: ${frame ? "SÌ" : "NO"}`);
  if (frame) log("  --- frame ---\n" + frame.split("\n").map((l) => "  " + l).join("\n") + "\n  --- /frame ---");
  const focusedTaskList = between(tC.systemPrompt, "<task_list focus=", "</task_list>");
  log(`<task_list> FILTRATA al subset: ${focusedTaskList ? "SÌ" : "NO"}${focusedTaskList ? " → " + focusedTaskList.replace(/\s+/g, " ").trim().slice(0, 160) : ""}`);

  // === FASE D — lavoro del FIGLIO via tool reali (attribuito allo scope via active_scope routing) ===
  log("\n=== FASE D: lavoro in-scope via tool reali (attribuito allo scope, non all'orchestrator) ===");
  await call("record_decision", { id: "D-child", text: "estraggo l'auth in un modulo dedicato", rationale: "riuso fra T-5/T-9/T-14" }, "demo-dec");
  await call("set_var", { id: "auth_module", value: "src/auth/index.ts", scope: "shared" }, "demo-var");
  await call("set_task_status", { id: "T-9", status: "done" }, "demo-done"); // il figlio completa un task del subset
  const probe2 = new VarsQueue(DB_PATH, { agent: "probe" });
  const childDecisions = probe2.getDecisionsByAgent(scopeId).map((d) => d.id);
  log(`decisioni attribuite allo scope ${scopeId}: ${JSON.stringify(childDecisions)} (atteso include D-child)`);
  probe2.close();

  // === FASE E — pop_focus → report-su-file + summary-pointer + re-align ===
  log("\n=== FASE E: pop_focus → report-su-file + re-align del padre ===");
  const popRes = toolJSON(await call("pop_focus", {}, "demo-pop"));
  log(`pop_focus → summary: ${popRes?.summary}`);
  log(`           report_path: ${popRes?.report_path}`);
  log(`           restored_aim (CURR del padre ripristinato): ${popRes?.restored_aim}`);

  let reportContent = null;
  if (popRes?.report_path && existsSync(popRes.report_path)) {
    reportContent = readFileSync(popRes.report_path, "utf8");
    log("\n========== REPORT-SU-FILE (il pieno, recuperabile per riferimento) ==========");
    console.log(reportContent);
    log("========== /REPORT ==========\n");
  } else {
    log(`(report_path non leggibile: ${popRes?.report_path})`);
  }

  // verifica re-align finale (connessione fresca → stato reale)
  const probe3 = new VarsQueue(DB_PATH, { agent: "probe" });
  const finalCurr = probe3.getCurr();
  const finalActive = probe3.getActiveScope();
  const scopeStatus = probe3.getFocusFrame(scopeId)?.status;
  const open = [...probe3.listTasks({ status: "pending" }), ...probe3.listTasks({ status: "in_progress" })].map((t) => t.id);
  const parentDecisions = probe3.getDecisionsByAgent("orchestrator").map((d) => d.id);
  probe3.close();

  // --- VERDETTO ---
  const verdict = {
    extension_matrioska_caricate: matrioskaTools.length === 3,
    focus_hint_iniettato: !!hint,
    modello_ha_guidato_da_solo: modelDroveItself,
    enter_focus_ok: !!scopeId,
    active_scope_cross_instance_ok: activeScope === scopeId,
    curr_in_scope_e_lead: currInScope === "T-5",
    frame_iniettato_in_scope: !!frame,
    task_list_filtrata: !!focusedTaskList,
    figlio_attribuito_allo_scope: childDecisions.includes("D-child"),
    pop_ha_prodotto_report_file: !!reportContent,
    report_deriva_il_lavoro_figlio: !!reportContent && reportContent.includes("D-child") && reportContent.includes("auth_module"),
    realign_curr_ripristinato_al_padre: finalCurr === "T-3",
    realign_active_scope_pulito: finalActive === null,
    scope_marcato_popped: scopeStatus === "popped",
    task_done_figlio_fuori_open_loop: !open.includes("T-9"),
    pop_promosso_come_decisione_padre: parentDecisions.some((d) => d.startsWith("pop-")),
  };
  const allGreen = Object.values(verdict).filter((v) => typeof v === "boolean").every((v) => v === true || v === modelDroveItself);
  // (modello_ha_guidato_da_solo è informativo, non fa fallire: flash-lite spesso non orchestra)
  const core = { ...verdict }; delete core.modello_ha_guidato_da_solo;
  const coreGreen = Object.values(core).every((v) => v === true);

  log("=== VERDETTO ===");
  log(JSON.stringify(verdict, null, 2));
  log(coreGreen ? "✅ MATRIOSKA E2E: meccanismo verde (zoom-in → lavoro → pop → report-su-file → re-align)" : "❌ qualcosa non torna (vedi verdetto)");

  session.dispose();
  process.exit(coreGreen ? 0 : 1);
}

main().catch((e) => { console.error("[matrioska] FATAL:", e?.stack ?? e); process.exit(2); });

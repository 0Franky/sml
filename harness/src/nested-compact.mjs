/**
 * nested-compact — orchestrazione "a matrioska" del context (Strada-2, nested-compact).
 *
 * Core DETERMINISTICO node-pure (testabile senza pi, come pop-report.mjs): trigger → zoom-OUT (frame) →
 * zoom-IN (enter_focus) → pop (report-to-file + re-align). Riusa as-is buildPopReport (floor-F),
 * la lane `decisions` (getDecisionsByAgent/getChangesByAgent) e assembleContext.
 *
 * Spec implementabile: ../../wiki/architecture/matrioska-orchestration-spec.md
 * Principio: ../../wiki/decisions/2026-06-29-context-as-first-person-mind.md §principio-5
 * Ritorno (pop): ../../wiki/concepts/report-to-file-pointer.md
 *
 * Divisione delle responsabilità:
 *   - vars-queue.mjs  = tabella `focus_frames` + CRUD basso livello + active_scope (routing who).
 *   - QUESTO modulo   = la logica (trigger/frame/enter/pop/re-align), pura, iniettando now/tokens per i test.
 *   - .pi/extensions/nested-compact.ts = solo wiring (tool enter_focus/pop_focus + getContextUsage reale).
 *
 * Timestamp: Date.now() (epoch ms) — codice runtime Node, non script workflow.
 */
import { buildPopReport } from "./pop-report.mjs";
import { assembleContext } from "./context-assembler.mjs";
import { buildMessagesLane } from "./conversation-store.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sanitizeScope = (s) => String(s).replace(/[^A-Za-z0-9_.-]/g, "_");

/** Config di default. Soglie [CALIBRATE] (first-principles, pass empirico sui dogfood — ADR difersce). */
export const DEFAULT_CFG = {
  tokenReorderPct: 0.55,   // <0.55 none · ≥0.55 reorder (frazione 0..1 del context window)
  tokenMatrioskaPct: 0.75, // ≥0.75 matrioska (sotto la banda di compaction nativa)
  watchReorder: 12,        // ≈ cap maxTasks dove <task_list> tronca
  watchMatrioska: 25,
  focusK: 5,               // display-cap del reorder (priority-sort top-K)
  maxDepth: 3,             // depth-bound dello stack
  cooldownMs: 90_000,      // hysteresis anti-thrash del <focus_hint> (consumato da shouldEmitFocusHint, vedi sotto)
};

const RANK = { none: 0, reorder: 1, matrioska: 2 };
const maxLevel = (a, b) => (RANK[a] >= RANK[b] ? a : b);

/**
 * Metriche misurabili dallo stato + (opz.) dal context-usage di pi.
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {{ now?: number, tokens?: number|null, contextWindow?: number|null }} [opts]
 */
export function collectMetrics(vq, opts = {}) {
  const now = opts.now ?? Date.now();
  const tokens = opts.tokens ?? null;
  const contextWindow = opts.contextWindow ?? null;
  const openTasks = vq.listTasks({ status: "in_progress" }).length + vq.listTasks({ status: "pending" }).length;
  const pendingVerifs = vq.listVerifications({ status: "pending" }).length;
  const sharedVars = vq.getSharedView().length;
  const recentChanges = vq.getChangeLog({ since: now - 15 * 60 * 1000, limit: 1000 }).length;
  const watchCount = openTasks + pendingVerifs;
  // frazione 0..1 calcolata da noi (no ambiguità su 0..100 vs 0..1 del `percent` di pi).
  const percent = tokens != null && contextWindow ? tokens / contextWindow : null;
  return { openTasks, pendingVerifs, sharedVars, recentChanges, watchCount, percent };
}

/** Classifica la pressione: ladder token + ladder watch, OR-semantics (max). null percent → asse-token=none. */
export function classifyPressure(metrics, cfg = DEFAULT_CFG) {
  const c = { ...DEFAULT_CFG, ...cfg };
  let tokenLevel = "none";
  if (metrics.percent != null) {
    if (metrics.percent >= c.tokenMatrioskaPct) tokenLevel = "matrioska";
    else if (metrics.percent >= c.tokenReorderPct) tokenLevel = "reorder";
  }
  let watchLevel = "none";
  if (metrics.watchCount >= c.watchMatrioska) watchLevel = "matrioska";
  else if (metrics.watchCount >= c.watchReorder) watchLevel = "reorder";
  return maxLevel(tokenLevel, watchLevel);
}

/** Depth corrente = max depth degli scope APERTI (0 = nessuno). */
export function currentDepth(vq) {
  return vq.listFocusFrames({ status: "open" }).reduce((m, f) => Math.max(m, f.depth), 0);
}

/** Si può entrare in un nuovo focus? (depth-bound). */
export function canEnter(vq, cfg = DEFAULT_CFG) {
  const c = { ...DEFAULT_CFG, ...cfg };
  const depth = currentDepth(vq);
  if (depth >= c.maxDepth) return { ok: false, depth, reason: `depth ${depth} ≥ maxDepth ${c.maxDepth}` };
  return { ok: true, depth };
}

/**
 * Valuta il trigger: pressione + raccomandazione (degrada matrioska→reorder a depth saturo, graceful).
 * @returns {{ level:"none"|"reorder"|"matrioska", recommend:"none"|"reorder"|"matrioska", depthSaturated:boolean, metrics:object }}
 */
export function evaluateTrigger(vq, opts = {}, cfg = DEFAULT_CFG) {
  const c = { ...DEFAULT_CFG, ...cfg };
  const now = opts.now ?? Date.now();
  const metrics = collectMetrics(vq, { now, tokens: opts.tokens ?? null, contextWindow: opts.contextWindow ?? null });
  const level = classifyPressure(metrics, c);
  const depth = opts.currentDepth ?? currentDepth(vq);
  const depthSaturated = depth >= c.maxDepth;
  // a depth saturo NON si raccomanda di scendere ancora → si degrada a reorder (riordino in-place).
  const recommend = level === "matrioska" && depthSaturated ? "reorder" : level;
  return { level, recommend, depthSaturated, metrics };
}

/**
 * Gating hysteresis del <focus_hint> (anti-thrash): ritorna true — E registra il timestamp — SOLO se è passato
 * ≥ cooldownMs dall'ultimo hint emesso. Stato in un memo SILENT del datastore (`_focus_hint_ts`, namespace memo →
 * non inquina recent_changes). Rende reale DEFAULT_CFG.cooldownMs (era costante morta) → niente flapping
 * enter→pop→hint→enter mentre la pressione resta alta. (review-loop 2026-06-29, P2 hysteresis-non-cablata.)
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {{ now?: number, cooldownMs?: number }} [opts]
 */
export function shouldEmitFocusHint(vq, opts = {}) {
  const now = opts.now ?? Date.now();
  const cooldownMs = opts.cooldownMs ?? DEFAULT_CFG.cooldownMs;
  const last = vq.getVar("_focus_hint_ts");
  const lastTs = typeof last?.value === "number" ? last.value : 0;
  if (now - lastTs < cooldownMs) return false; // suggerito troppo di recente → sopprimi
  vq.setVar("_focus_hint_ts", now, { namespace: "memo", scope: "private" }); // memo = silent
  return true;
}

/**
 * Frame (zoom-OUT) — truthful by construction, no summarization. Letture DIRETTE dallo stato durevole.
 * @returns {{ aim, decisions, constraints, sharedState, backlog, depth, frameTs }}
 */
export function buildFrame(vq, opts = {}) {
  const now = opts.now ?? Date.now();
  const currId = vq.getCurr();
  const aim = currId ? vq.getTask(currId) : null;
  const decisions = vq.listDecisions();      // scelta + razionale (tutte)
  const constraints = vq.listRules();        // MAI troncate (hard incluso)
  const sharedState = vq.getSharedView();     // già visibile a entrambi → elencata, non "riportata"
  const open = [...vq.listTasks({ status: "in_progress" }), ...vq.listTasks({ status: "pending" })];
  const depth = currentDepth(vq);
  // backlog = task aperti FUORI dal subset dello scope più profondo aperto (ciò che resta "intorno" al focus).
  const deepest = vq.listFocusFrames({ status: "open" }).sort((a, b) => b.depth - a.depth)[0] ?? null;
  const subset = new Set(deepest ? deepest.task_subset : []);
  const backlog = subset.size ? open.filter((t) => !subset.has(t.id)) : open;
  return { aim, decisions, constraints, sharedState, backlog, depth, frameTs: now };
}

/** Serializza il frame in `<frame>…</frame>`. Cap solo di DISPLAY su decisions/shared/backlog; constraints MAI. */
export function serializeFrame(frame, opts = {}) {
  const dispCap = opts.displayCap ?? 8;
  const L = [`<frame depth="${frame.depth}">`];
  L.push(frame.aim
    ? `  <aim id="${esc(frame.aim.id)}" status="${esc(frame.aim.status)}">${esc(frame.aim.title)}</aim>`
    : `  <aim>(nessuno)</aim>`);

  // constraints — MAI troncate (sono le regole che vincolano anche dentro il focus)
  L.push("  <constraints>");
  for (const r of frame.constraints) L.push(`    - [${r.severity}] ${esc(r.text)}`);
  L.push("  </constraints>");

  if (frame.decisions.length) {
    const decs = frame.decisions.slice(-dispCap); // le più recenti
    L.push(`  <decisions shown="${decs.length}/${frame.decisions.length}">`);
    for (const d of decs) L.push(`    - ${esc(d.id)}: ${esc(d.text)}${d.rationale ? ` — ${esc(d.rationale)}` : ""}`);
    if (frame.decisions.length > decs.length) L.push(`    - (+${frame.decisions.length - decs.length} più vecchie — usa get_decisions_by_agent)`);
    L.push("  </decisions>");
  }

  if (frame.sharedState.length) {
    const sv = frame.sharedState.slice(0, dispCap);
    L.push(`  <shared_state shown="${sv.length}/${frame.sharedState.length}">`);
    for (const v of sv) L.push(`    - ${esc(v.id)}=${esc(JSON.stringify(v.value))}`);
    if (frame.sharedState.length > sv.length) L.push(`    - (+${frame.sharedState.length - sv.length} — usa get_shared_view)`);
    L.push("  </shared_state>");
  }

  if (frame.backlog.length) {
    const bl = frame.backlog.slice(0, dispCap);
    L.push(`  <backlog shown="${bl.length}/${frame.backlog.length}">`);
    for (const t of bl) L.push(`    - [${t.status}] ${esc(t.id)}: ${esc(t.title)}`);
    if (frame.backlog.length > bl.length) L.push(`    - (+${frame.backlog.length - bl.length} — usa list_tasks)`);
    L.push("  </backlog>");
  }
  L.push("</frame>");
  return L.join("\n");
}

/** Stack di focus aperti, dal più superficiale al più profondo. */
export function getFocusStack(vq) {
  return vq.listFocusFrames({ status: "open" }).sort((a, b) => a.depth - b.depth);
}

/**
 * Enter-focus (zoom-IN): apre uno scope-figlio su un subset di task, salva il CURR del padre da ripristinare,
 * registra l'enter come DECISIONE del padre, e imposta l'active_scope (routing who in-scope).
 * @returns {{ scopeId:string, depth:number, sinceSeq:number }}  (throw se depth>maxDepth)
 */
export function enterFocus(vq, opts = {}, cfg = DEFAULT_CFG) {
  const c = { ...DEFAULT_CFG, ...cfg };
  const now = opts.now ?? Date.now();
  const gate = canEnter(vq, c);
  if (!gate.ok) throw new Error(`enterFocus rifiutato: ${gate.reason}`);
  const depth = gate.depth + 1;
  if (depth > c.maxDepth) throw new Error(`enterFocus: depth ${depth} > maxDepth ${c.maxDepth}`);

  let subset = Array.isArray(opts.taskSubset) ? opts.taskSubset.filter(Boolean).map(String) : [];
  subset = subset.filter((id) => vq.getTask(id)); // SOLO task esistenti (no ghost-id → focus degenere/context vuoto)
  if (!subset.length && !opts.aimTask) {
    throw new Error("enterFocus: subset vuoto o senza task esistenti (serve ≥1 task valido)");
  }
  const lead = opts.aimTask ?? subset[0] ?? vq.getCurr() ?? null; // su cosa puntare CURR dentro lo scope
  const parentId = opts.parentScopeId ?? vq.getActiveScope() ?? null;
  const who = parentId ?? vq.agent; // l'enter è una scelta del PADRE
  const sinceSeq = vq.currentChangeSeq();
  const priorCurr = vq.getCurr(); // ciò che il padre stava facendo → da ripristinare al pop
  const scopeId = sanitizeScope(`focus-${lead ?? "scope"}-${now}-${sinceSeq}`);

  vq.createFocusFrame(scopeId, { parentId, depth, aimTask: priorCurr, taskSubset: subset, sinceSeq, now, who });
  if (lead) vq.setCurr(lead, { who });
  vq.recordDecision(`enter-${scopeId}`,
    `zoom-in su [${subset.join(", ") || lead || "scope"}] (depth ${depth})`,
    { who, taskRef: lead ?? null });
  vq.setActiveScope(scopeId, { who });
  return { scopeId, depth, sinceSeq };
}

/**
 * Pop: 1) report-to-file dei delta del figlio (floor-F); 2) promuove l'esito come decisione del padre
 * (report per riferimento; le var `shared` sono già visibili → no copia); 3) chiude lo scope; 4) re-align del padre.
 * @returns {{ summary:string, report_path:string|null, promotedDecisionId:string, restoredCurr:string|null }}
 */
export function popFocus(vq, scopeId, opts = {}) {
  const now = opts.now ?? Date.now();
  const frame = vq.getFocusFrame(scopeId);
  if (!frame) throw new Error(`popFocus: scope ${scopeId} inesistente`);
  if (frame.status !== "open") throw new Error(`popFocus: scope ${scopeId} non è open (${frame.status})`);
  // invariante LIFO: non si può poppare uno scope che ha figli ancora aperti — orfanerebbe il sotto-albero
  // (active_scope/depth/CURR incoerenti, delta del figlio persi). Il path di default (deepest) non lo triggera;
  // un scope_id esplicito non-top sì → guard esplicito. (review-loop 2026-06-29, P1 no-LIFO.)
  const openChildren = vq.listFocusFrames({ status: "open" }).filter((f) => f.parent_id === scopeId);
  if (openChildren.length) {
    throw new Error(`popFocus: scope ${scopeId} ha ${openChildren.length} figlio/i ancora aperto/i — chiudili prima (LIFO)`);
  }

  const parent = frame.parent_id ?? null;
  const who = parent ?? vq.agent;

  // 1) report-to-file-pointer: i delta del figlio sono attribuiti who=scopeId (active_scope routing) e delimitati
  //    dal `since_seq` MONOTONO (non dal wall-clock frame.entered: immune a clock-skew/NTP-step e al same-ms).
  //    (review-loop 2026-06-29, P1 delta-per-timestamp.)
  const { summary, report_path } = buildPopReport(vq, scopeId, {
    reportDir: opts.reportDir ?? ".pi/state/reports",
    sinceSeq: frame.since_seq,
    reportId: now,
  });

  // 2) promuove l'esito come DECISIONE del padre (report per riferimento).
  const promotedDecisionId = `pop-${scopeId}`;
  vq.recordDecision(promotedDecisionId, summary, { who, decisionRef: report_path ?? null, taskRef: frame.aim_task ?? null });

  // 3) chiude lo scope + ripristina l'active_scope al padre (null = root → routing torna a vq.agent).
  vq.closeFocusFrame(scopeId, { who });
  vq.setActiveScope(parent, { who });

  // 4) re-align del padre allo stato attuale (foto ri-derivata; CURR ripristinato se ancora aperto).
  const realigned = realignParent(vq, { parentScopeId: parent, savedAimTask: frame.aim_task, now });
  return { summary, report_path, promotedDecisionId, restoredCurr: realigned.restoredCurr };
}

/**
 * Re-align del padre dopo il pop: ri-deriva il frame (truthful) e ripristina CURR all'aim salvato SE ancora
 * aperto (se il figlio l'ha completato → resta fuori dall'open-loop, niente ripristino).
 * @returns {{ restoredCurr:string|null, aim, frame }}
 */
export function realignParent(vq, opts = {}) {
  const now = opts.now ?? Date.now();
  const who = opts.parentScopeId ?? vq.agent;
  let restoredCurr = null;
  if (opts.savedAimTask) {
    const t = vq.getTask(opts.savedAimTask);
    if (t && t.status !== "done" && t.status !== "blocked") {
      vq.setCurr(opts.savedAimTask, { who });
      restoredCurr = opts.savedAimTask;
    }
  }
  // anti-dangling: se l'aim non è ripristinabile (done/blocked) e il CURR resta a puntare un task chiuso/assente,
  // ri-puntalo al primo task ancora APERTO → niente <current_aim> "done" fuorviante al re-align post-pop.
  // (review-loop 2026-06-29, P2 CURR-dangling-su-done.)
  if (!restoredCurr) {
    const currId = vq.getCurr();
    const curr = currId ? vq.getTask(currId) : null;
    if (!curr || curr.status === "done" || curr.status === "blocked") {
      const open = [...vq.listTasks({ status: "in_progress" }), ...vq.listTasks({ status: "pending" })];
      if (open.length) { vq.setCurr(open[0].id, { who }); restoredCurr = open[0].id; }
    }
  }
  const frame = buildFrame(vq, { now });
  return { restoredCurr, aim: frame.aim, frame };
}

/**
 * Workspace nested (in-scope): `<frame>` (zoom-OUT durevole) + `<context>` FILTRATO al subset del focus +
 * (opz.) la lane `<messages_with_user>`. È ciò che la pi-extension inietta quando uno scope è aperto.
 * @returns {string}
 */
export function buildNestedWorkspace(vq, opts = {}) {
  const now = opts.now ?? Date.now();
  const parts = [];
  const frame = buildFrame(vq, { now });
  // il <frame> è deliberatamente ATEMPORALE (cache-stable, zona stabile in testa): non emette timestamp → non
  // prende absoluteTimestamps (che vale solo per la zona volatile di <context>). (review-loop 2026-06-29, P3.)
  parts.push(serializeFrame(frame));

  const scope = opts.focusScopeId
    ? vq.getFocusFrame(opts.focusScopeId)
    : getFocusStack(vq).slice(-1)[0] ?? null;
  const focusTaskIds = scope ? scope.task_subset : null;
  parts.push(assembleContext(vq, { now, focusTaskIds, absoluteTimestamps: opts.absoluteTimestamps }));

  if (opts.store && opts.convId) {
    const lane = buildMessagesLane(opts.store, opts.convId, { n: opts.messagesN ?? 6, charCap: opts.messagesCharCap });
    if (lane) parts.push(lane);
  }
  return parts.join("\n");
}

export default {
  DEFAULT_CFG, collectMetrics, classifyPressure, currentDepth, canEnter, evaluateTrigger, shouldEmitFocusHint,
  buildFrame, serializeFrame, getFocusStack, enterFocus, popFocus, realignParent, buildNestedWorkspace,
};

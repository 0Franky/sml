/**
 * Test node-pure di nested-compact (orchestrazione matrioska).
 * Verifica ../../wiki/architecture/matrioska-orchestration-spec.md §7 (testabilità):
 *   classifyPressure (tabella + OR + depth-saturation→reorder) · enterFocus depth-guard (×3 ok, ×4 throw) ·
 *   buildFrame/serializeFrame (constraints MAI troncate) · popFocus round-trip (figlio muta who=scope → report
 *   deriva i delta · padre ottiene la decisione promossa · task done esce dall'open-loop · CURR ripristinato) ·
 *   realignParent (aim chiuso→non ripristina) · buildNestedWorkspace (frame + context filtrato al subset).
 */
import {
  DEFAULT_CFG, collectMetrics, classifyPressure, currentDepth, canEnter, evaluateTrigger,
  buildFrame, serializeFrame, getFocusStack, enterFocus, popFocus, realignParent, buildNestedWorkspace,
  shouldEmitReorgHint, markReorgEmitted, requireGateBlocks, maybeAutoFocus,
} from "../../src/nested-compact.mjs";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { ConversationStore } from "../../src/conversation-store.mjs";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const dir = mkdtempSync(join(tmpdir(), "nested-"));

try {
  // 1) classifyPressure — ladder token + watch + OR + null-percent --------------
  {
    ok(classifyPressure({ watchCount: 0, percent: 0.30 }) === "none", "TOKEN: <0.55 → none");
    ok(classifyPressure({ watchCount: 0, percent: 0.60 }) === "reorder", "TOKEN: ≥0.55 → reorder");
    ok(classifyPressure({ watchCount: 0, percent: 0.80 }) === "matrioska", "TOKEN: ≥0.75 → matrioska");
    ok(classifyPressure({ watchCount: 5, percent: null }) === "none", "WATCH: <12 → none");
    ok(classifyPressure({ watchCount: 15, percent: null }) === "reorder", "WATCH: ≥12 → reorder");
    ok(classifyPressure({ watchCount: 30, percent: null }) === "matrioska", "WATCH: ≥25 → matrioska");
    ok(classifyPressure({ watchCount: 30, percent: 0.30 }) === "matrioska", "OR: watch-alto vince");
    ok(classifyPressure({ watchCount: 0, percent: 0.90 }) === "matrioska", "OR: token-alto vince");
    ok(classifyPressure({ watchCount: 13, percent: null }) === "reorder", "NULL-percent: asse-token = none");
  }

  // 2) evaluateTrigger — depth-saturation degrada matrioska → reorder -----------
  {
    const vq = new VarsQueue(":memory:");
    for (let i = 0; i < 30; i++) vq.addTask("t" + i, "x"); // watchCount 30 → matrioska
    const trig = evaluateTrigger(vq, { currentDepth: DEFAULT_CFG.maxDepth });
    ok(trig.level === "matrioska", "SAT: level pressione = matrioska");
    ok(trig.depthSaturated === true, "SAT: depthSaturated true");
    ok(trig.recommend === "reorder", "SAT: recommend degradato a reorder (graceful)");
    const trig2 = evaluateTrigger(vq, { currentDepth: 1 });
    ok(trig2.recommend === "matrioska", "NON-SAT: recommend = matrioska");
    const m = collectMetrics(vq, { tokens: 8000, contextWindow: 10000 });
    ok(Math.abs(m.percent - 0.8) < 1e-9 && m.watchCount === 30, "METRICS: percent=tokens/window + watchCount");
    // output-budget-reserve (msg 518): reserve 0.2 → finestra effettiva 8000 → percent = 8000/8000 = 1.0
    const mR = collectMetrics(vq, { tokens: 8000, contextWindow: 10000, outputReservePct: 0.2 });
    ok(Math.abs(mR.percent - 1.0) < 1e-9, "RESERVE: percent su finestra effettiva (window*(1-reserve))");
    const mClamp = collectMetrics(vq, { tokens: 100, contextWindow: 10000, outputReservePct: 5 });
    ok(mClamp.percent != null && mClamp.percent > 0, "RESERVE: reserve fuori-range clampata (no divisione per ~0)");
    const trigR = evaluateTrigger(vq, { tokens: 7000, contextWindow: 10000, currentDepth: 0 }, { ...DEFAULT_CFG, outputReservePct: 0.3 });
    ok(trigR.metrics.percent != null && trigR.metrics.percent >= 1.0, "RESERVE: evaluateTrigger propaga outputReservePct (7000/7000=1.0)");
    vq.close();
  }

  // 2b) reorg-hint cooldown (anti-cecità, msg 515) ----------------------------
  {
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    ok(shouldEmitReorgHint(vq, { now: 1_000_000 }) === true, "REORG: primo hint emettibile (nessun ts)");
    markReorgEmitted(vq, { now: 1_000_000 });
    ok(shouldEmitReorgHint(vq, { now: 1_000_000 + 1000 }) === false, "REORG: entro cooldown → soppresso");
    ok(shouldEmitReorgHint(vq, { now: 1_000_000 + DEFAULT_CFG.cooldownMs + 1 }) === true, "REORG: oltre cooldown → riemettibile");
    vq.close();
  }

  // 2c) requireGateBlocks — gate gathering.mode=require (review P1 #16) --------
  {
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    for (let i = 1; i <= 6; i++) vq.addTask("G" + i, "g" + i); // 6 open
    ok(requireGateBlocks(vq, { mode: "delegated", minTasksForForce: 5 }) === false, "REQUIRE: mode!=require → mai blocca");
    ok(requireGateBlocks(vq, { mode: "require", minTasksForForce: 5 }) === true, "REQUIRE: require + open≥min + no token → BLOCCA");
    ok(requireGateBlocks(vq, { mode: "require", minTasksForForce: 99 }) === false, "REQUIRE: open<min → no-op (proporzionalità)");
    vq.setMeta("_gather_token", "123"); // come dopo get_execution_order in require-mode
    ok(requireGateBlocks(vq, { mode: "require", minTasksForForce: 5 }) === false, "REQUIRE: token presente → passa");
    vq.setMeta("_gather_token", ""); // come azzeramento a inizio sessione / consume
    ok(requireGateBlocks(vq, { mode: "require", minTasksForForce: 5 }) === true, "REQUIRE: token azzerato → ri-blocca (no gather-once-forever)");
    vq.close();
  }

  // 2d) maybeAutoFocus — autofocus.mode=auto (OQ-A, msg 551) -------------------
  //     NB: now ≥ cooldownMs perché shouldEmitFocusHint confronta now-lastTs(=0) col cooldown (primo enter ammesso).
  {
    const T = 1_000_000; // > cooldownMs → primo auto-enter ammesso
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    for (const id of ["A", "B", "C"]) vq.addTask(id, id); // 3 task ready (grafo piatto → tutti ready)
    ok(maybeAutoFocus(vq, { tokens: 10, contextWindow: 100, now: T }) === null, "AUTO: pressione bassa (10%) → no-op");
    const r = maybeAutoFocus(vq, { tokens: 80, contextWindow: 100, now: T }); // 80% ≥ tokenMatrioskaPct
    ok(r && r.scopeId && getFocusStack(vq).length === 1, "AUTO: pressione matrioska + ready → auto-enter (scope aperto)");
    ok(maybeAutoFocus(vq, { tokens: 80, contextWindow: 100, now: T + 1 }) === null, "AUTO: già in focus → no-op");
    vq.close();
  }
  // 2e) maybeAutoFocus — no-op senza ready o entro cooldown -----------------------
  {
    const vqB = new VarsQueue(":memory:", { agent: "orchestrator" });
    vqB.addTask("Z1", "z1"); vqB.addTask("Z2", "z2", { deps: ["Z1"] });
    vqB.setTaskStatus("Z1", "done"); vqB.setTaskStatus("Z2", "blocked"); // Z1 done (esce), Z2 blocked-status → open vuoto
    ok(maybeAutoFocus(vqB, { tokens: 90, contextWindow: 100, now: 1_000_000 }) === null, "AUTO: nessun task ready/open → no focus vuoto");
    vqB.close();
    const vqC = new VarsQueue(":memory:", { agent: "orchestrator" });
    vqC.addTask("Q", "q"); // ready
    vqC.setMeta("focus_hint_ts", String(1000)); // simula un hint/enter appena emesso a t=1000
    ok(maybeAutoFocus(vqC, { tokens: 90, contextWindow: 100, now: 1001 }) === null, "AUTO: entro cooldown → no-op (anti-thrash)");
    ok(maybeAutoFocus(vqC, { tokens: 90, contextWindow: 100, now: 1000 + DEFAULT_CFG.cooldownMs + 1 }).scopeId, "AUTO: oltre cooldown → auto-enter");
    vqC.close();
  }

  // 3) enterFocus — depth-guard (×3 ok, ×4 throw) ------------------------------
  {
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    for (const id of ["A", "B", "C", "D"]) vq.addTask(id, id);
    const s1 = enterFocus(vq, { taskSubset: ["A"], now: 1 });
    const s2 = enterFocus(vq, { taskSubset: ["B"], now: 2 });
    const s3 = enterFocus(vq, { taskSubset: ["C"], now: 3 });
    ok(s1.depth === 1 && s2.depth === 2 && s3.depth === 3, "DEPTH: nesting 1→2→3");
    ok(currentDepth(vq) === 3, "DEPTH: currentDepth = 3");
    ok(canEnter(vq).ok === false, "DEPTH: canEnter false a saturazione");
    let threw = false;
    try { enterFocus(vq, { taskSubset: ["D"], now: 4 }); } catch { threw = true; }
    ok(threw, "DEPTH: il 4° enter lancia (depth > maxDepth)");
    ok(getFocusStack(vq).length === 3, "STACK: 3 scope aperti");
    // nesting via active_scope: s2.parent = s1, s3.parent = s2
    ok(vq.getFocusFrame(s2.scopeId).parent_id === s1.scopeId, "NEST: s2.parent = s1 (via active_scope)");
    ok(vq.getFocusFrame(s3.scopeId).parent_id === s2.scopeId, "NEST: s3.parent = s2");
    vq.close();
  }

  // 4) buildFrame + serializeFrame — constraints MAI troncate ------------------
  {
    const vq = new VarsQueue(":memory:");
    for (let i = 0; i < 20; i++) vq.addRule("r" + i, "rule text " + i, { severity: i === 0 ? "hard" : "soft" });
    for (let i = 0; i < 20; i++) vq.recordDecision("d" + i, "decision " + i, { who: "x" });
    const frame = buildFrame(vq, { now: 1 });
    const s = serializeFrame(frame, { displayCap: 5 });
    let allConstraints = true;
    for (let i = 0; i < 20; i++) if (!s.includes("rule text " + i)) allConstraints = false;
    ok(allConstraints, "FRAME: tutte le 20 constraints presenti (MAI troncate)");
    ok(s.includes('<decisions shown="5/20">'), "FRAME: decisions display-capped a 5/20");
    ok(s.includes("decision 19") && !s.includes("decision 0:"), "FRAME: mostra le decisioni più recenti");
    vq.close();
  }

  // 5) popFocus — round-trip completo ------------------------------------------
  {
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    vq.addTask("T-parent", "lavoro del padre");
    vq.addTask("T-child", "sotto-task del figlio");
    vq.setCurr("T-parent");

    const { scopeId } = enterFocus(vq, { taskSubset: ["T-child"], now: 1000 });
    ok(vq.getActiveScope() === scopeId, "ENTER: active_scope = scopeId");
    ok(vq.getCurr() === "T-child", "ENTER: CURR = lead del subset");
    ok(vq.getFocusFrame(scopeId).aim_task === "T-parent", "ENTER: aim_task = CURR del padre (da ripristinare)");

    // attività del figlio attribuita allo scope (in produzione via active_scope routing; qui who esplicito)
    vq.recordDecision("D-child", "usato bearer token", { who: scopeId, rationale: "evita cookie" });
    vq.setVar("child_out", "ok", { who: scopeId, scope: "shared" });
    vq.setTaskStatus("T-child", "done", { who: scopeId });

    const r = popFocus(vq, scopeId, { reportDir: dir, now: 2000 });
    ok(r.promotedDecisionId === `pop-${scopeId}`, "POP: id decisione promossa");
    ok(r.summary.includes("decisioni") && r.summary.includes("cambiamenti"), "POP: summary floor-F");
    ok(existsSync(r.report_path), "POP: report scritto su file");
    const report = readFileSync(r.report_path, "utf-8");
    ok(report.includes("usato bearer token") && report.includes("evita cookie"), "POP: report deriva la decisione del figlio");
    ok(report.includes("child_out"), "POP: report deriva la mutazione var del figlio");
    ok(!report.includes("lavoro del padre"), "POP: il report NON include lavoro del padre");

    // il padre (root → who=orchestrator) ottiene enter + pop come decisioni
    const parentDec = vq.getDecisionsByAgent("orchestrator");
    ok(parentDec.some((d) => d.id === `pop-${scopeId}`), "POP: padre ha la decisione promossa");
    ok(parentDec.some((d) => d.id === `enter-${scopeId}`), "POP: padre ha la decisione di enter");
    ok(vq.getDecisionsByAgent(scopeId).some((d) => d.id === "D-child"), "ATTR: decisione del figlio attribuita allo scope");

    // re-align: CURR ripristinato all'aim del padre (ancora aperto); active_scope torna a root (null)
    ok(vq.getCurr() === "T-parent" && r.restoredCurr === "T-parent", "REALIGN: CURR ripristinato all'aim del padre");
    ok(vq.getActiveScope() === null, "REALIGN: active_scope torna a root (null)");
    // task done del figlio fuori dall'open-loop
    const open = [...vq.listTasks({ status: "pending" }), ...vq.listTasks({ status: "in_progress" })];
    ok(!open.some((t) => t.id === "T-child"), "REALIGN: il task done del figlio esce dall'open-loop");
    ok(open.some((t) => t.id === "T-parent"), "REALIGN: il task del padre resta aperto");
    ok(vq.getFocusFrame(scopeId).status === "popped", "POP: scope marcato popped");
    vq.close();
  }

  // 6) realignParent — aim chiuso non si ripristina, aim aperto sì -------------
  {
    const vq = new VarsQueue(":memory:");
    vq.addTask("P", "done-aim"); vq.setTaskStatus("P", "done");
    const res = realignParent(vq, { savedAimTask: "P", now: 1 });
    ok(res.restoredCurr === null, "REALIGN: aim done → NON ripristinato");
    vq.addTask("Q", "open-aim");
    const res2 = realignParent(vq, { savedAimTask: "Q", now: 1 });
    ok(res2.restoredCurr === "Q" && vq.getCurr() === "Q", "REALIGN: aim aperto → ripristinato");
    vq.close();
  }

  // 7) buildNestedWorkspace — frame + context filtrato al subset ---------------
  {
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    vq.addRule("hard1", "HARD RULE INVIOLABILE", { severity: "hard" });
    vq.addTask("T1", "task a fuoco");
    vq.addTask("T2", "task di backlog");
    vq.setCurr("T1");
    const store = new ConversationStore(":memory:");
    store.append("main", "user", "ciao, lavora su T1");

    const { scopeId } = enterFocus(vq, { taskSubset: ["T1"], now: 100 });
    const ws = buildNestedWorkspace(vq, { focusScopeId: scopeId, store, convId: "main", now: 200 });
    ok(ws.includes("<frame depth=\"1\">"), "WS: contiene il frame (zoom-OUT)");
    ok(ws.includes("HARD RULE INVIOLABILE"), "WS: il frame riporta le constraints hard");
    ok(ws.includes("<context>"), "WS: contiene il context focalizzato");
    ok(ws.includes('<task_list focus='), "WS: task_list filtrata al subset");
    ok(ws.includes("T2"), "WS: T2 compare nel backlog del frame (fuori dal focus)");
    ok(ws.includes("<messages_with_user"), "WS: contiene la lane messaggi");
    store.close();
    vq.close();
  }

  // 8) FIX review-loop 2026-06-29 — LIFO / enter-guard / since_seq-skew / CURR-dangling / routing-who --------
  {
    // 8a) LIFO: pop di uno scope NON-top (con figli aperti) → throw; il deepest si pop-a
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    for (const id of ["A", "B"]) vq.addTask(id, id);
    const s1 = enterFocus(vq, { taskSubset: ["A"], now: 10 });
    const s2 = enterFocus(vq, { taskSubset: ["B"], now: 11 }); // figlio di s1 (via active_scope)
    let threwLifo = false;
    try { popFocus(vq, s1.scopeId, { reportDir: dir, now: 12 }); } catch { threwLifo = true; }
    ok(threwLifo, "LIFO: pop di scope non-top con figli aperti → throw");
    const okPop = popFocus(vq, s2.scopeId, { reportDir: dir, now: 13 });
    ok(okPop.promotedDecisionId === `pop-${s2.scopeId}`, "LIFO: pop del deepest ok");
    vq.close();
  }
  {
    // 8b) enter-guard: subset vuoto o solo-ghost → throw; mix valido+ghost → tiene solo i validi
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    vq.addTask("A", "a");
    let e1 = false, e2 = false;
    try { enterFocus(vq, { taskSubset: [] }); } catch { e1 = true; }
    try { enterFocus(vq, { taskSubset: ["GHOST", "NOPE"] }); } catch { e2 = true; }
    ok(e1, "ENTER-GUARD: subset vuoto → throw");
    ok(e2, "ENTER-GUARD: subset di soli ghost-id → throw");
    const s = enterFocus(vq, { taskSubset: ["A", "GHOST"], now: 5 });
    ok(vq.getFocusFrame(s.scopeId).task_subset.length === 1, "ENTER-GUARD: filtra i ghost, tiene i validi");
    vq.close();
  }
  {
    // 8c) since_seq skew-immunity: entered iniettato NEL FUTURO non perde i delta del figlio (delimitazione per seq)
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    vq.addTask("T", "t");
    const future = Date.now() + 3_600_000; // frame.entered > ts reali delle mutazioni → il filtro ts li perderebbe
    const { scopeId } = enterFocus(vq, { taskSubset: ["T"], now: future });
    vq.setVar("child_v", 1, { who: scopeId, scope: "shared" });
    vq.setTaskStatus("T", "done", { who: scopeId });
    const r = popFocus(vq, scopeId, { reportDir: dir, now: future + 1 });
    ok(r.report_path && readFileSync(r.report_path, "utf-8").includes("child_v"),
      "SINCE_SEQ: delta del figlio nel report anche con entered nel futuro (seq monotono, no wall-clock)");
    vq.close();
  }
  {
    // 8d) CURR-dangling: il figlio completa l'aim del padre → CURR non resta su 'done', si ri-punta ad aperto
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    vq.addTask("AIM", "aim del padre"); vq.addTask("OTHER", "altro task aperto");
    vq.setCurr("AIM");
    const { scopeId } = enterFocus(vq, { taskSubset: ["AIM"], now: 100 }); // zoom sull'aim stesso
    vq.setTaskStatus("AIM", "done", { who: scopeId });
    const r = popFocus(vq, scopeId, { reportDir: dir, now: 200 });
    ok(vq.getCurr() !== "AIM", "DANGLING: CURR non resta sul task done");
    ok(vq.getCurr() === "OTHER" && r.restoredCurr === "OTHER", "DANGLING: CURR ri-puntato al primo task aperto");
    vq.close();
  }
  {
    // 8e) routing-who PRODUZIONE: mutazioni attribuite via getActiveScope() (come i tool) → report deriva i delta
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    vq.addTask("T", "t");
    const { scopeId } = enterFocus(vq, { taskSubset: ["T"], now: 50 });
    const activeWho = () => vq.getActiveScope() ?? vq.agent; // == vars-queue.ts activeWho()
    ok(activeWho() === scopeId, "ROUTING: active_scope = scopeId in-scope");
    vq.recordDecision("D-prod", "deciso via routing", { who: activeWho() });
    vq.setVar("v-prod", "x", { who: activeWho(), scope: "shared" });
    const r = popFocus(vq, scopeId, { reportDir: dir, now: 60 });
    const rep = readFileSync(r.report_path, "utf-8");
    ok(rep.includes("D-prod") && rep.includes("v-prod"), "ROUTING: il report deriva i delta attribuiti via active_scope");
    ok(vq.getActiveScope() === null, "ROUTING: active_scope pulito dopo il pop");
    vq.close();
  }

} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\nnested-compact test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

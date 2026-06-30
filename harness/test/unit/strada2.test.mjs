/**
 * Test node-pure degli item 1-6 (Strada-2 full / DB-singleton / convId / hysteresis) + i fix del review-loop #2:
 *  - windowNativeMessages (K-turn window, preserva tool_result + messaggi strutturali in testa)
 *  - shouldEmitFocusHint (PREDICATO PURO) + markFocusHintEmitted (commit), stato nel META (no namespace 'memo')
 *  - getMeta/setMeta (stato di sistema) + resolveConvId (convId persistito riusato su reload/resume)
 *  - state-db singleton + closeAll · buildMessagesLane cap sul singolo messaggio gigante
 */
import { windowNativeMessages, buildMessagesLane, ConversationStore } from "../../src/conversation-store.mjs";
import { shouldEmitFocusHint, markFocusHintEmitted } from "../../src/nested-compact.mjs";
import { getVarsQueue, getConversationStore, closeAll } from "../../src/state-db.mjs";
import { getConvId, setConvId, resolveConvId } from "../../src/session-context.mjs";
import { VarsQueue } from "../../src/vars-queue.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

// 1) windowNativeMessages — K-turn window + tool_result + strutturali ------------------------------
{
  const u = (text) => ({ role: "user", text });
  const a = (text) => ({ role: "assistant", text });
  const tr = (text) => ({ role: "toolResult", text });
  const bs = (text) => ({ role: "branchSummary", text });

  ok(windowNativeMessages([]).length === 0, "WINDOW: vuoto → invariato");
  const one = [u("ciao")];
  ok(windowNativeMessages(one) === one, "WINDOW: 1 messaggio → stesso riferimento");

  const threeTurns = [u("t1"), a("r1"), u("t2"), a("r2"), u("t3"), a("[tool]"), tr("ok")];
  const wDef = windowNativeMessages(threeTurns); // DEFAULT keepTurns=1 (Strada-2: solo turno corrente)
  ok(wDef.length === 3 && wDef[0].text === "t3" && wDef.some((m) => m.role === "toolResult"),
     "WINDOW: default keepTurns=1 → solo turno corrente (coi suoi tool_result)");
  ok(windowNativeMessages(threeTurns, { keepTurns: 5 }) === threeTurns,
     "WINDOW: keepTurns ≥ #turni → stesso riferimento (niente storia da rimuovere)");

  const w1 = windowNativeMessages(threeTurns, { keepTurns: 1 });
  ok(w1.length === 3 && w1[0].text === "t3", "WINDOW: keepTurns=1 → solo turno corrente (coi suoi tool)");

  const five = [u("t1"), a("r1"), u("t2"), a("r2"), u("t3"), a("r3"), u("t4"), a("[tool]"), tr("ok"), u("t5"), a("r5")];
  const w2 = windowNativeMessages(five, { keepTurns: 2 });
  ok(w2[0].text === "t4" && w2.some((m) => m.role === "toolResult"), "WINDOW: keepTurns=2 → ultimi 2 turni coi tool_result");
  ok(!w2.some((m) => m.text === "t1"), "WINDOW: storia più vecchia soppressa");

  const withBs = [bs("riassunto branch"), u("t1"), a("r1"), u("t2"), a("r2")];
  const w3 = windowNativeMessages(withBs, { keepTurns: 1 });
  ok(w3[0].role === "branchSummary", "WINDOW: branchSummary in testa preservato");
  ok(w3.some((m) => m.text === "t2") && !w3.some((m) => m.text === "t1"), "WINDOW: storia soppressa, turno corrente tenuto + strutturale in testa");

  // (review #3 P3 custom-reorder) — il prefisso strutturale è preservato SOLO se CONTIGUO in testa.
  const cu = (text) => ({ role: "custom", text });
  const withMidCustom = [u("t1"), cu("nota-mid"), a("r1"), u("t2"), a("r2"), u("t3"), a("r3")];
  const w4 = windowNativeMessages(withMidCustom, { keepTurns: 1 });
  ok(w4[0].text === "t3", "WINDOW: nessun prefisso contiguo → testa = turno corrente");
  ok(!w4.some((m) => m.text === "nota-mid"), "WINDOW: 'custom' a metà storia SOPPRESSO (non riordinato in testa)");
  const withHeadCustom = [cu("head-note"), u("t1"), a("r1"), u("t2"), a("r2")];
  const w5 = windowNativeMessages(withHeadCustom, { keepTurns: 1 });
  ok(w5[0].text === "head-note" && w5.some((m) => m.text === "t2") && !w5.some((m) => m.text === "t1"),
     "WINDOW: 'custom' nel PREFISSO CONTIGUO in testa preservato");
}

// 2) shouldEmitFocusHint PURO + markFocusHintEmitted; stato nel META (no 'memo') ------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  const t0 = 1_000_000;
  ok(shouldEmitFocusHint(vq, { now: t0, cooldownMs: 90_000 }) === true, "HINT: nessun hint precedente → emettibile");
  ok(shouldEmitFocusHint(vq, { now: t0, cooldownMs: 90_000 }) === true, "HINT: predicato PURO (non si auto-marca)");
  markFocusHintEmitted(vq, { now: t0 });
  ok(shouldEmitFocusHint(vq, { now: t0 + 1000, cooldownMs: 90_000 }) === false, "HINT: entro cooldown dopo mark → non emettibile");
  ok(shouldEmitFocusHint(vq, { now: t0 + 90_000, cooldownMs: 90_000 }) === true, "HINT: ≥ cooldown → di nuovo emettibile");
  ok(vq.listVars({ namespace: "memo" }).length === 0, "HINT: ZERO inquinamento del namespace 'memo' (lezioni)");
  ok(Number(vq.getMeta("focus_hint_ts")) === t0, "HINT: stato persiste nel meta");
  ok(!vq.getChangeLog({ since: 0 }).some((c) => c.entity_id === "focus_hint_ts"), "HINT: meta focus_hint_ts è silent");
  vq.close();
}

// 3) getMeta/setMeta — stato di sistema ----------------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  ok(vq.getMeta("x") === null, "META: chiave assente → null");
  vq.setMeta("x", "val");
  ok(vq.getMeta("x") === "val", "META: set/get stringa");
  vq.setMeta("n", 42);
  ok(vq.getMeta("n") === "42", "META: numero stringificato");
  vq.setMeta("x", null);
  ok(vq.getMeta("x") === null, "META: set null → delete");
  ok(!vq.getChangeLog({ since: 0 }).some((c) => c.entity_id === "n" && c.silent === 0), "META: log silent di default");
  vq.close();
}

// 4) resolveConvId — persistenza su reload/resume ------------------------------------------------
{
  const r1 = resolveConvId("startup", null, 1000);
  ok(r1.isNew && r1.persist && r1.convId === "sess-1000-startup", "CONVID: startup senza persistito → nuovo + PERSISTITO");
  const r2 = resolveConvId("reload", "sess-1000-startup", 2000);
  ok(!r2.isNew && !r2.persist && r2.convId === "sess-1000-startup", "CONVID: reload con persistito → RIUSA (no re-persist)");
  const r3 = resolveConvId("resume", "sess-1000-startup", 3000);
  ok(!r3.isNew && r3.convId === "sess-1000-startup", "CONVID: resume → riusa la conversazione persistita");
  const r4 = resolveConvId("new", "sess-1000-startup", 4000);
  ok(r4.isNew && !r4.persist && r4.convId === "sess-4000-new", "CONVID: new → nuova conv EFFIMERA (persist=false, no clobber)");
  const r5 = resolveConvId("fork", "sess-1000-startup", 5000);
  ok(r5.isNew && !r5.persist && r5.convId === "sess-5000-fork", "CONVID: fork → nuova conv effimera (persist=false)");

  // (review #3 P2 cross-sessione) scenario: A persistito → /new B (effimero, NON clobbera) → /resume legge ANCORA A.
  const A = "sess-A";
  const newB = resolveConvId("new", A, 6000);
  ok(!newB.persist, "CONVID: /new non persiste → lo slot globale resta sulla conversazione principale");
  const resumeAfterNew = resolveConvId("resume", A, 7000); // lo slot è ancora A perché /new non l'ha sovrascritto
  ok(resumeAfterNew.convId === A, "CONVID: /resume dopo /new → riusa la conversazione principale (no mix A/B)");

  // MODO PER-SESSIONE (getSessionId disponibile): slot keyato per-sessione → isolamento totale.
  const psNew = resolveConvId("new", null, 8000, { perSession: true }); // sessionId nuovo → nessun persistito
  ok(psNew.isNew && psNew.persist && psNew.convId === "sess-8000-new", "CONVID[perSession]: sessione nuova → nuovo + PERSISTI (sotto la propria chiave)");
  const psReload = resolveConvId("reload", "conv-X", 9000, { perSession: true }); // QUESTA sessione già vista
  ok(!psReload.isNew && !psReload.persist && psReload.convId === "conv-X", "CONVID[perSession]: reload della stessa sessione → riusa il suo convId");
  const psStartup = resolveConvId("startup", null, 9100, { perSession: true });
  ok(psStartup.isNew && psStartup.persist, "CONVID[perSession]: prima apparizione di una sessione → persiste sotto la sua chiave");
}

// 5) buildMessagesLane — cap sul singolo messaggio gigante ----------------------------------------
{
  const store = new ConversationStore(":memory:");
  store.append("c", "user", "x".repeat(10000));
  const lane = buildMessagesLane(store, "c", { n: 6, charCap: 4000 });
  ok(lane.length < 5000, "LANE-CAP: singolo messaggio gigante troncato sotto il cap+overhead");
  ok(lane.includes("get_conversation"), "LANE-CAP: marker di troncamento col pointer");
  store.close();
}

// 5b) checkpoint segment-boundary: lastSeq + count/window afterSeq + lane ripiegata ----------------
{
  const store = new ConversationStore(":memory:");
  for (let i = 1; i <= 6; i++) store.append("k", i % 2 ? "user" : "assistant", "m" + i);
  ok(store.lastSeq("k") === 6, "CKPT: lastSeq = max seq della conversazione");
  ok(store.lastSeq("vuota") === 0, "CKPT: lastSeq di conversazione vuota = 0");
  ok(store.count("k") === 6 && store.count("k", { afterSeq: 4 }) === 2, "CKPT: count afterSeq conta solo il segmento post-checkpoint");
  const w = store.window("k", 10, { afterSeq: 4 });
  ok(w.length === 2 && w[0].text === "m5" && w[1].text === "m6", "CKPT: window afterSeq = solo post-boundary (ordine cronologico)");
  const lane = buildMessagesLane(store, "k", { n: 10, afterSeq: 4 });
  ok(lane.includes('checkpoint="4"') && lane.includes("m5") && lane.includes("m6") && !lane.includes("[user] m1"),
     "CKPT-LANE: lane mostra solo il segmento post-checkpoint + attributo checkpoint");
  ok(lane.includes("folded at checkpoint @4") && lane.includes("range=1..4"),
     "CKPT-LANE: marker — chat pre-checkpoint ripiegata, recuperabile via get_conversation");
  ok(buildMessagesLane(store, "k", { n: 10 }).includes('shown="6/6"'),
     "CKPT-LANE: senza afterSeq (default 0) → comportamento invariato (tutta la conversazione)");
  store.close();
}

// 5c) buildMessagesLane excludeCurrentTurn — complementarità lane↔native (review-full P1-B) --------
{
  const store = new ConversationStore(":memory:");
  // storia: u1, a1 + il turno CORRENTE u2 (catturato dall'hook `input`, ancora senza risposta assistant)
  store.append("d", "user", "u1");
  store.append("d", "assistant", "a1");
  store.append("d", "user", "u2-current");

  // senza il flag → la lane include il turno corrente (comportamento storico, backward-compat)
  const laneAll = buildMessagesLane(store, "d", { n: 10 });
  ok(laneAll.includes("u2-current") && laneAll.includes('shown="3/3"'),
     "P1-B: default (no flag) → lane include il turno corrente (backward-compat)");

  // con excludeCurrentTurn → la lane mostra SOLO la storia (u1, a1), NON il turno in volo
  const laneHist = buildMessagesLane(store, "d", { n: 10, excludeCurrentTurn: true });
  ok(laneHist.includes("[user] u1") && laneHist.includes("[assistant] a1") &&
     !laneHist.includes("u2-current") && laneHist.includes('shown="2/2"'),
     "P1-B: excludeCurrentTurn → lane = SOLO storia, turno corrente escluso (no doppia-chat)");

  // COMPLEMENTARITÀ esplicita: il turno corrente vive nella native-window (keepTurns=1), NON nella lane → overlap=0
  const native = windowNativeMessages(
    [{ role: "user", text: "u1" }, { role: "assistant", text: "a1" }, { role: "user", text: "u2-current" }],
    { keepTurns: 1 });
  ok(native.some((m) => m.text === "u2-current") && !laneHist.includes("u2-current"),
     "P1-B: complementarità — turno corrente in native, storia in lane, NESSUN overlap");
  store.close();
}

// 5d) excludeCurrentTurn degrada con grazia (turno non catturato) + edge primo-turno ---------------
{
  const store = new ConversationStore(":memory:");
  // caso headless/non-genuino: l'ultimo record è un assistant → il turno corrente NON è nello store
  store.append("e", "user", "u1");
  store.append("e", "assistant", "a1");
  const laneA = buildMessagesLane(store, "e", { n: 10, excludeCurrentTurn: true });
  ok(laneA.includes("[user] u1") && laneA.includes("[assistant] a1") && laneA.includes('shown="2/2"'),
     "P1-B: degrade — ultimo record = assistant → niente da escludere (storia completa)");

  // edge: il turno corrente è il PRIMISSIMO messaggio (untilSeq=0) → lane vuota, non crash
  const solo = new ConversationStore(":memory:");
  solo.append("f", "user", "u1-current");
  ok(buildMessagesLane(solo, "f", { n: 10, excludeCurrentTurn: true }) === "",
     "P1-B: edge — turno corrente = primo messaggio (untilSeq=0) → lane vuota");
  store.close(); solo.close();
}

// 6) state-db singleton + closeAll ----------------------------------------------------------------
{
  const a = getVarsQueue(":memory:");
  const b = getVarsQueue(":memory:");
  ok(a === b, "SINGLETON: getVarsQueue stesso path → stessa istanza (1 connessione)");
  const cs1 = getConversationStore(":memory:");
  const cs2 = getConversationStore(":memory:");
  ok(cs1 === cs2, "SINGLETON: getConversationStore stesso path → stessa istanza");
  closeAll();
  const c = getVarsQueue(":memory:");
  ok(c !== a, "SINGLETON: dopo closeAll → nuova istanza (connessioni rilasciate)");
  closeAll();
}

// 7) session-context default ----------------------------------------------------------------------
{
  setConvId("main"); // reset (sezioni precedenti non l'hanno toccato, ma garantiamo lo stato)
  ok(getConvId() === "main", "CONVID: default 'main'");
  setConvId("sess-xyz");
  ok(getConvId() === "sess-xyz", "CONVID: set/get");
  setConvId(null);
  ok(getConvId() === "sess-xyz", "CONVID: setConvId(null) → no-op");
  setConvId("main");
}

console.log(`\nstrada2 test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

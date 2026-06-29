/**
 * Test node-pure degli item 1-6 (Strada-2 full / DB-singleton / convId / hysteresis):
 *  - windowNativeMessages (soppressione storia turni precedenti, continuità tool-loop intra-turno)
 *  - shouldEmitFocusHint (cooldown anti-thrash del <focus_hint>)
 *  - state-db singleton (1 connessione condivisa per path) + closeAll
 *  - session-context convId per-sessione
 */
import { windowNativeMessages } from "../../src/conversation-store.mjs";
import { shouldEmitFocusHint } from "../../src/nested-compact.mjs";
import { getVarsQueue, getConversationStore, closeAll } from "../../src/state-db.mjs";
import { getConvId, setConvId } from "../../src/session-context.mjs";
import { VarsQueue } from "../../src/vars-queue.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

// 1) windowNativeMessages — Strada-2 soppressione storia ------------------------------------------
{
  const u = (text) => ({ role: "user", text });
  const a = (text) => ({ role: "assistant", text });
  const tr = (text) => ({ role: "toolResult", text });

  ok(windowNativeMessages([]) .length === 0, "WINDOW: vuoto → invariato");
  const one = [u("ciao")];
  ok(windowNativeMessages(one) === one, "WINDOW: 1 messaggio → stesso riferimento (no change)");

  // un solo turno user con tool-loop → NON si tocca (lastUser=0)
  const oneTurn = [u("fai X"), a("[tool]"), tr("ok"), a("fatto")];
  ok(windowNativeMessages(oneTurn) === oneTurn, "WINDOW: 1 turno multi-tool → invariato (continuità tool-loop)");

  // due turni → tiene dal 2° user in poi
  const twoTurns = [u("turno 1"), a("risposta 1"), u("turno 2"), a("[tool]"), tr("ok")];
  const w = windowNativeMessages(twoTurns);
  ok(w !== twoTurns, "WINDOW: 2 turni → array ridotto (riferimento nuovo)");
  ok(w.length === 3 && w[0].text === "turno 2", "WINDOW: tiene dal 2° user (storia precedente soppressa)");
  ok(!w.some((m) => m.text === "turno 1"), "WINDOW: il 1° turno è rimosso dall'array nativo");
  ok(w[w.length - 1].text === "ok", "WINDOW: i tool del turno corrente restano");
}

// 2) shouldEmitFocusHint — cooldown anti-thrash ---------------------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  const t0 = 1_000_000;
  ok(shouldEmitFocusHint(vq, { now: t0, cooldownMs: 90_000 }) === true, "HINT: primo hint → emesso");
  ok(shouldEmitFocusHint(vq, { now: t0 + 1_000, cooldownMs: 90_000 }) === false, "HINT: entro cooldown → soppresso");
  ok(shouldEmitFocusHint(vq, { now: t0 + 89_999, cooldownMs: 90_000 }) === false, "HINT: appena sotto cooldown → soppresso");
  ok(shouldEmitFocusHint(vq, { now: t0 + 90_000, cooldownMs: 90_000 }) === true, "HINT: ≥ cooldown → ri-emesso");
  // il timestamp vive in un memo SILENT → non inquina recent_changes
  const recent = vq.getChangeLog({ since: 0 });
  ok(!recent.some((c) => c.entity_id === "_focus_hint_ts"), "HINT: _focus_hint_ts è silent (fuori da recent_changes)");
  vq.close();
}

// 3) state-db singleton + closeAll ----------------------------------------------------------------
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

// 4) session-context convId per-sessione ----------------------------------------------------------
{
  ok(getConvId() === "main", "CONVID: default 'main'");
  setConvId("sess-123-startup");
  ok(getConvId() === "sess-123-startup", "CONVID: set/get per-sessione");
  setConvId(null);
  ok(getConvId() === "sess-123-startup", "CONVID: setConvId(null) → no-op (mantiene il valore)");
  setConvId("main"); // reset
}

console.log(`\nstrada2 test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

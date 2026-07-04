/**
 * session-context-isolation — D3 fix (audit 2026-07-04): il convId è SESSION-scoped (Map<sessionId,convId>),
 * risolto dal ctx via `convIdFor(ctx)`, NON più da una cella global-di-processo. Due sessioni vive nello STESSO
 * processo (SDK multi-sessione, inMemory×2) non collidono. Questi test FALLIREBBERO con la vecchia `let _convId`.
 *
 * TEST A = isolamento puro (la collisione). TEST B = WIRING: store CONDIVISO + 2 ctx, session_start interlacciati,
 * write E read via convIdFor(ctx) (regola #14: il bug vive nel WIRING, non nelle funzioni pure).
 */
import { convIdFor, setConvIdForSession, sessionIdOf, clearSession, getConvId, setConvId } from "../../src/session-context.mjs";
import { ConversationStore } from "../../src/conversation-store.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

// ---- TEST A: isolamento per-sessione (ROSSO con la vecchia global _convId) ------------------------
const ctxA = { sessionManager: { getSessionId: () => "A" } };
const ctxB = { sessionManager: { getSessionId: () => "B" } };
setConvIdForSession("A", "conv-A");   // session_start A
setConvIdForSession("B", "conv-B");   // session_start B — B diventa "corrente" (con la global vecchia clobbererebbe A)
ok(convIdFor(ctxA) === "conv-A", "A: hook di A legge conv-A ANCHE dopo lo start di B (no interleave P1)"); // RED con global
ok(convIdFor(ctxB) === "conv-B", "A: hook di B legge conv-B");
ok(sessionIdOf(ctxA) === "A", "A: sessionIdOf estrae il sid dal ctx");
ok(sessionIdOf(undefined) === null, "A: sessionIdOf(undefined) → null (difensivo)");
ok(sessionIdOf({}) === null, "A: sessionIdOf(ctx senza sessionManager) → null");
ok(convIdFor({}) === "conv-B", "A: headless (no sessionManager) → fallback ultima registrata");
clearSession("A"); // rimuove la entry di A; le altre restano isolate
ok(convIdFor(ctxB) === "conv-B", "A: dopo clearSession(A), B resta isolato");
setConvIdForSession(null, "hless"); // sessionId assente → solo fallback, nessuna entry in Map
ok(convIdFor({}) === "hless", "A: setConvIdForSession(null,..) aggiorna solo il fallback");

// ---- shim legacy retro-compat (non degrada a 'main' con setConvIdForSession attivo) ---------------
setConvId("legacy-x");
ok(getConvId() === "legacy-x", "SHIM: setConvId/getConvId operano sul fallback (retro-compat)");
setConvId(null);
ok(getConvId() === "legacy-x", "SHIM: setConvId(null) → no-op");

// ---- TEST B: WIRING — store condiviso, 2 ctx, session_start interlacciati, write+read via convIdFor -
const NOW = 1783000000000;
const store = new ConversationStore(":memory:");
setConvIdForSession("SA", "wire-A");   // session_start A
setConvIdForSession("SB", "wire-B");   // session_start B DOPO A, ma A è ancora viva
const cA = { sessionManager: { getSessionId: () => "SA" } };
const cB = { sessionManager: { getSessionId: () => "SB" } };
// input hook di A DOPO lo start di B → write via convIdFor(cA) (col bug global finirebbe sotto wire-B):
store.append(convIdFor(cA), "user", "ciao da A", { ts: NOW });
store.append(convIdFor(cB), "user", "ciao da B", { ts: NOW + 1 });
// read via convIdFor(ctx):
ok(store.count(convIdFor(cA)) === 1 && store.count(convIdFor(cB)) === 1, "B: ogni sessione conta 1 turno (no interleave)");
ok(store.count("wire-A") === 1 && store.count("wire-B") === 1, "B: ogni conv ha ESATTAMENTE il suo turno");
const aRows = store.window(convIdFor(cA), 10);
const bRows = store.window(convIdFor(cB), 10);
ok(aRows.length === 1 && aRows[0].text === "ciao da A", "B: la conv di A contiene solo il turno di A");
ok(bRows.length === 1 && bRows[0].text === "ciao da B", "B: la conv di B contiene solo il turno di B");

console.log(`session-context-isolation: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

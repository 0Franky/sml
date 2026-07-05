/**
 * Integration/wiring test — F22 (2026-07-05): il conteggio-turni dell'eviction-checkpoint DEVE venire dai turni
 * USER dello store, non dal totale righe.
 *
 * Bug F22: nel path SDK (`session.sendUserMessage` di run-session) i turni-USER non venivano registrati nello store
 * — solo le risposte ASSISTANT (via l'hook `agent_end`) → `store.countUserTurns()`=0 → l'eviction-checkpoint non
 * scattava MAI (invalidò le misure F20/F21: sembravano "eviction non aiuta", in realtà eviction non partiva).
 * Root-cause trovata ispezionando conversations.db: 7 righe, tutte role=assistant, 0 role=user.
 *
 * Questo test ENCODA l'invariante al livello del WIRING (regola #17), esercitando il ConversationStore REALE + la
 * evictionEvent REALE (le stesse fn del context-hook `.pi/extensions/eviction-checkpoint.ts:55-75`):
 *   - Caso A (REPRO del bug): store con SOLE righe assistant → countUserTurns=0 → NESSUNA eviction.
 *   - Caso B (path FIXATO):   store con righe USER registrate → countUserTurns=N → eviction scatta agli ordinali attesi.
 * Fallirebbe se countUserTurns contasse le righe assistant (role-confusion), che è la classe-bug di F22.
 */
import { ConversationStore } from "../../src/conversation-store.mjs";
import { evictionEvent } from "../../src/eviction-checkpoint.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const KEEP = 2;
const C = "conv_evict";
const T0 = 1_900_000_000_000;

// Mirror della GLUE del context-hook (eviction-checkpoint.ts:61-66): conta i turni-USER dallo store REALE, poi
// delega a evictionEvent. Parametrizzata sullo store così il test esercita l'integrazione, non solo la fn pura.
function evictionFor(store, convId, keepTurns, lastEvictedOrdinal = 0) {
  const userTurnCount = store.countUserTurns(convId);
  return { userTurnCount, ...evictionEvent({ userTurnCount, keepTurns, lastEvictedOrdinal }) };
}

// --- Caso A: REPRO del bug F22 — SOLO righe assistant (esattamente ciò che faceva il path SDK pre-fix) ---
{
  const s = new ConversationStore(":memory:", { agent: "orchestrator" });
  for (let i = 0; i < 5; i++) s.append(C, "assistant", "risposta " + i, { ts: T0 + i });
  const e = evictionFor(s, C, KEEP);
  ok(e.userTurnCount === 0, "F22 repro: SOLO assistant nello store → countUserTurns === 0 (la root-cause)");
  ok(e.newlyEvicted.length === 0, "F22 repro: countUserTurns=0 → NESSUNA eviction (checkpoint inerte, come in F20/F21)");
}

// --- Caso B: path FIXATO — i turni USER sono registrati (come ora fa recordUserTurn() in run-session.mjs) ---
{
  const s = new ConversationStore(":memory:", { agent: "orchestrator" });
  for (let i = 0; i < 5; i++) {
    s.append(C, "user", "task " + (i + 1), { ts: T0 + 2 * i });        // il turno-USER ORA registrato
    s.append(C, "assistant", "fatto " + (i + 1), { ts: T0 + 2 * i + 1 }); // + la risposta (come agent_end)
  }
  const e = evictionFor(s, C, KEEP);
  ok(e.userTurnCount === 5, "fix: 5 turni USER registrati (assistant NON contano) → countUserTurns === 5");
  ok(JSON.stringify(e.newlyEvicted) === JSON.stringify([1, 2, 3]),
    "fix: countUserTurns=5, keep=2 → eviction scatta sugli ordinali 1..3 (i turni fuori dalla finestra)");
  // idempotenza persistita (eviction-checkpoint.ts:63/75): se ho già evacuato fino a 3, un ri-check non ri-scatta.
  const e2 = evictionFor(s, C, KEEP, 3);
  ok(e2.newlyEvicted.length === 0, "fix: lastEvicted=3 @count5 → idempotente (nessun doppio-fire sullo stesso turno)");
}

console.log(`\n${failed === 0 ? "✓" : "✗"} eviction-store-wiring (F22): ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

/**
 * eviction-wiring — regressione del bug NEW-A (sessione pi 019f2ab9, 2026-07-04): l'eviction-checkpoint NON scattava
 * MAI perché contava i turni-utente da `event.messages`, che native-window (STESSO hook `context`) aveva già
 * finestrato a keepTurns → userTurnCount ≡ keepTurns → evictionEvent non rilevava mai un'eviction (meta assente lo provò).
 *
 * È il test di WIRING che MANCAVA: i 56 unit test coprivano solo la MATEMATICA di evictionEvent (userTurnCount passato
 * a mano), MAI la fonte del conteggio nella pipeline reale. Qui si compongono i moduli REALI (ConversationStore +
 * windowNativeMessages + evictionEvent) per dimostrare: (a) contare dall'array FINESTRATO non scatta (il bug),
 * (b) contare dallo STORE scatta (il fix), (c) il digest si ripesca dallo store. Deterministico, gira in CI.
 */
import { ConversationStore, windowNativeMessages } from "../../src/conversation-store.mjs";
import { evictionEvent } from "../../src/eviction-checkpoint.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const C = "sess-eviction-wiring";
const NOW = 1782000000000;
const KEEP = 6; // = nativeKeepTurns reale (harness-config)
const N = 10;   // turni-utente totali nella conversazione

// store con N turni-utente reali (+ assistant), e l'array NATIVO parallelo che pi passerebbe all'hook `context`.
const cs = new ConversationStore(":memory:", { agent: "orchestrator" });
const native = [];
for (let i = 1; i <= N; i++) {
  cs.append(C, "user", `domanda utente ${i}`, { ts: NOW + i * 2000 });
  cs.append(C, "assistant", `risposta ${i}`, { ts: NOW + i * 2000 + 1000 });
  native.push({ role: "user", content: `domanda utente ${i}` });
  native.push({ role: "assistant", content: `risposta ${i}` });
}

// ── il BUG: contare dall'array FINESTRATO → non scatta MAI ────────────────────────────────────────
{
  const windowed = windowNativeMessages(native, { keepTurns: KEEP });
  const windowedUserCount = windowed.filter((m) => m.role === "user").length;
  ok(windowedUserCount === KEEP, `native-window riduce a ${KEEP} turni-utente (osservato ${windowedUserCount})`);
  const buggy = evictionEvent({ userTurnCount: windowedUserCount, keepTurns: KEEP, lastEvictedOrdinal: 0 });
  ok(buggy.newlyEvicted.length === 0, "BUG RIPRODOTTO: contando dall'array finestrato, evictionEvent NON scatta mai");
}

// ── il FIX: contare dallo STORE autoritativo → scatta sui turni realmente evicted ─────────────────
{
  const storeCount = cs.countUserTurns(C);
  ok(storeCount === N, `countUserTurns dallo store = ${N} (turni reali, non finestrati) — osservato ${storeCount}`);
  const fixed = evictionEvent({ userTurnCount: storeCount, keepTurns: KEEP, lastEvictedOrdinal: 0 });
  ok(fixed.evictedThrough === N - KEEP, `evictedThrough = ${N - KEEP} (ordinali 1..${N - KEEP} fuori dal nativo)`);
  ok(fixed.newlyEvicted.length === N - KEEP && fixed.newlyEvicted[0] === 1, "FIX: contando dallo store, evictionEvent SCATTA sui turni evicted");
}

// ── digest ripescato DALLO STORE (i turni evicted non sono più nell'array finestrato) ─────────────
{
  const { newlyEvicted } = evictionEvent({ userTurnCount: N, keepTurns: KEEP, lastEvictedOrdinal: 0 });
  const turns = cs.userTurnsByOrdinal(C, newlyEvicted[0], newlyEvicted[newlyEvicted.length - 1]);
  ok(turns.length === N - KEEP, "userTurnsByOrdinal ripesca esattamente i turni evicted");
  ok(turns[0].ordinal === 1 && turns[0].text === "domanda utente 1", "digest: ordinale 1-based + testo reale del primo turno evicted");
  ok(turns[turns.length - 1].text === `domanda utente ${N - KEEP}`, "digest: ultimo turno evicted corretto");
  ok(cs.userTurnsByOrdinal(C, 5, 3).length === 0, "userTurnsByOrdinal: range invertito → []");
}

// ── fire-once: avanzato il boundary, gli stessi turni non ri-scattano ──────────────────────────────
{
  const first = evictionEvent({ userTurnCount: N, keepTurns: KEEP, lastEvictedOrdinal: 0 });
  const again = evictionEvent({ userTurnCount: N, keepTurns: KEEP, lastEvictedOrdinal: first.evictedThrough });
  ok(again.newlyEvicted.length === 0, "FIRE-ONCE: con lastEvictedOrdinal avanzato, gli stessi turni non ri-scattano");
}

// ── un nuovo turno utente fa avanzare il confine di esattamente 1 ─────────────────────────────────
{
  cs.append(C, "user", `domanda utente ${N + 1}`, { ts: NOW + 999999 });
  ok(cs.countUserTurns(C) === N + 1, "countUserTurns segue i nuovi turni-utente");
  const next = evictionEvent({ userTurnCount: N + 1, keepTurns: KEEP, lastEvictedOrdinal: N - KEEP });
  ok(next.newlyEvicted.length === 1 && next.newlyEvicted[0] === N - KEEP + 1, "un nuovo turno evicta esattamente il turno successivo (confine +1)");
}

cs.close();
console.log(`eviction-wiring test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

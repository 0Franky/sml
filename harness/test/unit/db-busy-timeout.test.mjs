/**
 * db-busy-timeout — regressione del bug P0 2026-07-04 (drop-turni → amnesia): gli store SQLite aprivano in WAL
 * SENZA busy_timeout → due writer concorrenti (2 processi pi, o driver headless + TUI) → "database is locked"
 * IMMEDIATO → append in throw → turno droppato in silenzio. Fix: `PRAGMA busy_timeout` nel constructor.
 *
 * Qui si asserisce che il timeout è APPLICATO su ENTRAMBI gli store (guardia anti-regressione della riga di fix).
 * La concorrenza reale cross-processo è validata a parte (2 processi → 300/300 scritture, vedi wiki/todo.md P0).
 */
import { ConversationStore } from "../../src/conversation-store.mjs";
import { VarsQueue } from "../../src/vars-queue.mjs";

let passed = 0, failed = 0;
function ok(c, m) { if (c) passed++; else { failed++; console.error("  ✗ FAIL:", m); } }

const MIN = 2000; // soglia minima accettabile per assorbire la contesa (scritture ~ms)

{
  const cs = new ConversationStore(":memory:", { agent: "test" });
  const t = Number(cs.db.prepare("PRAGMA busy_timeout").get().timeout);
  ok(t >= MIN, `ConversationStore busy_timeout=${t} >= ${MIN} (anti drop-turni concorrente)`);
}
{
  const vq = new VarsQueue(":memory:", { agent: "test" });
  const t = Number(vq.db.prepare("PRAGMA busy_timeout").get().timeout);
  ok(t >= MIN, `VarsQueue busy_timeout=${t} >= ${MIN} (anti perdita vars/meta/secrets concorrente)`);
}

console.log(`db-busy-timeout test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

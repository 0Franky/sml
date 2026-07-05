/**
 * Test del context-invariant checker (utente msg 1067: "verificare che tutti i parametri del contesto siano coerenti;
 * aim non può restare vuoto"). Copre: coerenza clean, aim-empty/dangling/on-closed, active-blocked, invalid-status.
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import { checkContextInvariants, isContextCoherent } from "../../src/context-invariants.mjs";

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; } else { failed++; console.error("  ✗ FAIL:", m); } }

// 1) stato clean → nessuna violazione -------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  vq.addTask("A", "a"); vq.addTask("B", "b", { deps: ["A"] });
  vq.setTaskStatus("A", "done"); vq.setTaskStatus("B", "in_progress"); vq.setCurr("B");
  ok(checkContextInvariants(vq).length === 0, "CLEAN: nessuna violazione con stato coerente");
  ok(isContextCoherent(vq) === true, "CLEAN: coerente");
  vq.close();
}

// 2) aim-empty-with-active (warn) ------------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  vq.addTask("A", "a"); vq.setTaskStatus("A", "in_progress"); // aim NON settato
  const v = checkContextInvariants(vq);
  ok(v.some((x) => x.code === "aim-empty-with-active" && x.severity === "warn"), "AIM-EMPTY: warn con task attivo senza aim");
  ok(isContextCoherent(vq) === true, "AIM-EMPTY: warn NON rompe la coerenza (solo error la rompe)");
  vq.setCurr("A");
  ok(!checkContextInvariants(vq).some((x) => x.code === "aim-empty-with-active"), "AIM-EMPTY: settato l'aim → warn sparisce");
  vq.close();
}

// 3) aim-dangling (error) --------------------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  vq.addTask("A", "a"); vq.setCurr("GHOST");
  const v = checkContextInvariants(vq);
  ok(v.some((x) => x.code === "aim-dangling" && x.severity === "error"), "AIM-DANGLING: error su aim che punta al nulla");
  ok(isContextCoherent(vq) === false, "AIM-DANGLING: error rompe la coerenza");
  vq.close();
}

// 4) aim-on-closed (warn) --------------------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  vq.addTask("A", "a"); vq.setCurr("A"); vq.setTaskStatus("A", "done");
  ok(checkContextInvariants(vq).some((x) => x.code === "aim-on-closed" && x.severity === "warn"), "AIM-ON-CLOSED: warn su aim=task done");
  vq.close();
}

// 5) active-blocked + invalid-status (difesa-in-profondità, via DB diretto = bypass del guard) ------
{
  const vq = new VarsQueue(":memory:");
  vq.addTask("A", "a"); vq.addTask("B", "b", { deps: ["A"] }); // A non-done → B bloccato
  vq.db.prepare("UPDATE tasks SET status='in_progress' WHERE id='B'").run(); // BYPASS (simula corruzione DB)
  ok(checkContextInvariants(vq).some((x) => x.code === "active-blocked" && x.severity === "error"), "ACTIVE-BLOCKED: error su in_progress con deps aperte");
  vq.db.prepare("UPDATE tasks SET status='doing' WHERE id='A'").run(); // status fuori enum
  ok(checkContextInvariants(vq).some((x) => x.code === "invalid-status" && x.severity === "error"), "INVALID-STATUS: error su status ∉ enum");
  ok(isContextCoherent(vq) === false, "corruzione → non coerente");
  vq.close();
}

console.log(`\ncontext-invariants test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

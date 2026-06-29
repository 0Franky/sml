/**
 * Test del task-graph (focus-gathering v1, review-validato): priority/deps + ready + unblocks + order +
 * gate proporzionalità + validazione no-self/no-ciclo.
 */
import { VarsQueue } from "../../src/vars-queue.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }
function throws(fn, msg) { try { fn(); failed++; console.error("  ✗ FAIL (no throw):", msg); } catch { passed++; } }

// 1) schema priority/deps: add/get/list parse ------------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  vq.addTask("T1", "infra", { priority: 9, deps: [] });
  const t = vq.getTask("T1");
  ok(t.priority === 9 && Array.isArray(t.deps) && t.deps.length === 0, "SCHEMA: priority/deps salvati e letti");
  ok(vq.listTasks()[0].deps.length === 0, "SCHEMA: listTasks parse deps");
  vq.addTask("Tnopri", "x"); // default
  ok(vq.getTask("Tnopri").priority === 0 && vq.getTask("Tnopri").deps.length === 0, "SCHEMA: default priority=0 deps=[]");
  vq.close();
}

// 2) validazione no-self / no-ciclo ----------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  vq.addTask("A", "a"); vq.addTask("B", "b", { deps: ["A"] });
  throws(() => vq.addTask("C", "c", { deps: ["C"] }), "VALID: self-dep rifiutata");
  throws(() => vq.setTaskMeta("A", { deps: ["B"] }), "VALID: ciclo A->B->A rifiutato"); // B dipende già da A
  vq.setTaskMeta("A", { priority: 7 });
  ok(vq.getTask("A").priority === 7, "VALID: setTaskMeta priority ok");
  vq.addTask("D", "d", { deps: ["Z-inesistente"] }); // forward-ref ammesso (resterà non-ready)
  ok(vq.getTask("D").deps[0] === "Z-inesistente", "VALID: forward-ref ammesso");
  vq.close();
}

// 3) gate proporzionalità: grafo PIATTO → vista semplice -------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  vq.addTask("F1", "f1"); vq.addTask("F2", "f2"); vq.addTask("F3", "f3"); // niente deps, niente priority
  const r = vq.listTasksOrdered();
  ok(r.structured === false && r.tasks.length === 3, "PROP: grafo piatto → structured=false, vista semplice");
  ok(r.tasks[0].order === undefined, "PROP: niente colonna order su grafo piatto");
  ok(vq.readyTasks().length === 3, "PROP: su grafo piatto tutti gli open sono ready");
  vq.close();
}

// 4) ready + unblocks + order su grafo strutturato -------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  vq.addTask("T1", "infra", { priority: 0 });          // foundational
  vq.addTask("T2", "core", { deps: ["T1"] });
  vq.addTask("T3", "feat", { deps: ["T1", "T2"] });
  vq.addTask("T4", "chore", { priority: 5 });          // foglia ad alta priority ma 0 unblocks
  vq.setTaskStatus("T1", "done");                       // T1 fatto → sblocca T2
  const { structured, tasks } = vq.listTasksOrdered();
  ok(structured === true, "GRAPH: structured=true con deps/priority");
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
  ok(byId.T2.ready === true, "GRAPH: T2 ready (dep T1 done)");
  ok(byId.T3.ready === false, "GRAPH: T3 NON ready (dep T2 non done)");
  ok(byId.T4.ready === true && byId.T4.unblocks === 0, "GRAPH: T4 ready, unblocks=0 (foglia)");
  ok(byId.T2.unblocks === 1, "GRAPH: T2 unblocks=1 (T3 dipende)");
  // ordine: T2 (ready, unblocks=1) prima di T4 (ready, unblocks=0) NONOSTANTE T4 priority più alta → downstream-impact vince
  const readyOrder = tasks.filter((t) => t.ready).map((t) => t.id);
  ok(readyOrder.indexOf("T2") < readyOrder.indexOf("T4"), "ORDER: downstream-impact batte priority (T2 prima di T4)");
  ok(tasks[tasks.length - 1].id === "T3" || !byId.T3.ready, "ORDER: i non-ready (T3) non davanti ai ready");
  vq.close();
}

// 5) readyTasks(subset) + caso subset tutto-bloccato (per enter_focus hard-gate) -------------------
{
  const vq = new VarsQueue(":memory:");
  vq.addTask("U1", "u1"); vq.addTask("U2", "u2", { deps: ["U1"] }); vq.addTask("U3", "u3", { deps: ["U1"] });
  // U1 NON done → U2,U3 bloccati
  ok(vq.readyTasks(["U2", "U3"]).length === 0, "GATE: subset {U2,U3} tutto bloccato → 0 ready (enter_focus rifiuterà)");
  ok(vq.readyTasks(["U1", "U2"]).map((t) => t.id).includes("U1"), "GATE: subset con U1 → U1 ready");
  vq.close();
}

console.log(`\ntask-graph test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

/**
 * Test del task-graph (focus-gathering v1, review-validato): priority/deps + ready + unblocks + order +
 * gate proporzionalità + validazione no-self/no-ciclo.
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import { enterFocus } from "../../src/nested-compact.mjs";

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

// 6) enter_focus HARD-GATE no-ready (review P0) ---------------------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("X1", "x1"); vq.addTask("X2", "x2", { deps: ["X1"] }); vq.addTask("X3", "x3", { deps: ["X1"] });
  throws(() => enterFocus(vq, { taskSubset: ["X2", "X3"] }), "GATE: enter_focus RIFIUTA subset tutto-bloccato (no-ready)");
  let err;
  try { enterFocus(vq, { taskSubset: ["X2", "X3"] }); } catch (e) { err = e; }
  ok(err && err.reason === "no-ready-task" && err.missing_deps.includes("X1"), "GATE: errore strutturato {reason, missing_deps:[X1]}");
  const r = enterFocus(vq, { taskSubset: ["X1", "X2"] }); // X1 ready
  ok(r.scopeId.startsWith("focus-X1-"), "GATE: lead = primo READY (X1), non subset[0]");
  vq.close();
}

// 7) ciclo a 3 nodi (review P3 #13): la DFS chiude cicli transitivi, non solo A<->B -------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("A", "a"); vq.addTask("B", "b", { deps: ["A"] }); vq.addTask("C", "c", { deps: ["B"] });
  throws(() => vq.setTaskMeta("A", { deps: ["C"] }), "CICLO-3: A->B->C->A rifiutato (DFS transitiva)");
  vq.addTask("D", "d", { deps: ["C"] });
  throws(() => vq.addTask("E", "e", { deps: ["D"] }) && vq.setTaskMeta("C", { deps: ["E"] }), "CICLO-3: chiusura ciclo via add+setMeta rifiutata");
  vq.close();
}

// 8) forward-ref ready-transition (review P3 #18): dep su task inesistente → non-ready finché non esiste+done
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("W", "w", { deps: ["GHOST"] });
  ok(vq.listTasksOrdered().tasks.find((t) => t.id === "W").ready === false, "FWD: dep su task inesistente → ready=false");
  ok(vq.readyTasks(["W"]).length === 0, "FWD: W non è ready (GHOST non esiste)");
  vq.addTask("GHOST", "ghost"); vq.setTaskStatus("GHOST", "done");
  ok(vq.listTasksOrdered().tasks.find((t) => t.id === "W").ready === true, "FWD: creato+done GHOST → W diventa ready (retroattivo)");
  vq.close();
}

// 9) lead = vincitore in execution-order, NON subset[0] (review P2 #14) -----------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("LEAF", "leaf", { priority: 9 });          // ready, alta priority, unblocks=0
  vq.addTask("FOUND", "foundational");                   // ready, unblocks=1 (DOWN dipende)
  vq.addTask("DOWN", "downstream", { deps: ["FOUND"] }); // bloccato
  // subset con LEAF prima di FOUND nell'array: il lead deve essere FOUND (unblocks batte priority), non subset[0]
  const r = enterFocus(vq, { taskSubset: ["LEAF", "FOUND"] });
  ok(r.scopeId.startsWith("focus-FOUND-"), "LEAD: vincitore execution-order (FOUND, unblocks=1) non subset[0]=LEAF");
  vq.close();
}

// 10) hard-gate: no-open vs no-ready distinti (review P2 #2/#12) ------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("M1", "m1"); vq.setTaskStatus("M1", "done");
  vq.addTask("M2", "m2", { deps: ["M1"] }); vq.setTaskStatus("M2", "blocked"); // open=no (blocked), deps done
  let e1; try { enterFocus(vq, { taskSubset: ["M1", "M2"] }); } catch (e) { e1 = e; }
  ok(e1 && e1.reason === "no-open-task" && e1.missing_deps.length === 0, "GATE: subset tutto done/blocked → reason='no-open-task' (no missing_deps fuorvianti)");
  vq.addTask("M3", "m3", { deps: ["M9-inesistente"] });
  let e2; try { enterFocus(vq, { taskSubset: ["M3"] }); } catch (e) { e2 = e; }
  ok(e2 && e2.reason === "no-ready-task" && e2.missing_deps.includes("M9-inesistente"), "GATE: open ma deps non soddisfatte → reason='no-ready-task' + missing_deps");
  vq.close();
}

// 11) aimTask NON bypassa il gate (review P3 #7) ---------------------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("P", "p"); vq.addTask("Q", "q", { deps: ["P"] }); // Q bloccato (P non done)
  throws(() => enterFocus(vq, { taskSubset: ["P"], aimTask: "Q" }), "AIM: aimTask bloccato → rifiutato (no bypass del gate)");
  const r = enterFocus(vq, { taskSubset: ["P"], aimTask: "P" }); // P ready
  ok(r.scopeId.startsWith("focus-P-"), "AIM: aimTask ready → accettato come lead");
  vq.close();
}

// 12) task-validation (utente msg 1076): enum-guard + deps-guard su in_progress ------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.addTask("V1", "v1"); vq.addTask("V2", "v2", { deps: ["V1"] }); // V2 bloccato (V1 non done)
  // enum-guard: status arbitrario rifiutato
  throws(() => vq.setTaskStatus("V1", "doing"), "ENUM: status-spazzatura 'doing' → throw");
  throws(() => vq.setTaskStatus("V1", "WIP"), "ENUM: 'WIP' non nell'enum → throw");
  // deps-guard: NON attivabile V2 finché V1 non è done
  throws(() => vq.setTaskStatus("V2", "in_progress"), "DEPS-GUARD: in_progress su task con deps non-done → throw");
  ok(vq.getTask("V2").status === "pending", "DEPS-GUARD: V2 resta 'pending' dopo il rifiuto (nessuna scrittura)");
  // 'blocked'/'cancelled' NON sono attivazione → ammessi anche con deps aperte
  ok(vq.setTaskStatus("V2", "blocked")?.status === "blocked", "DEPS-GUARD: 'blocked' ammesso (non è attivazione)");
  // sblocco: V1 done → V2 attivabile
  vq.setTaskStatus("V1", "done");
  ok(vq.setTaskStatus("V2", "in_progress")?.status === "in_progress", "DEPS-GUARD: V1 done → V2 attivabile");
  ok(vq.setTaskStatus("V1", "cancelled")?.status === "cancelled", "ENUM: 'cancelled' accettato");
  // forward-ref: dep su task inesistente → non attivabile (coerente con la vista ready)
  vq.addTask("V3", "v3", { deps: ["GHOST-X"] });
  throws(() => vq.setTaskStatus("V3", "in_progress"), "DEPS-GUARD: dep forward-ref inesistente → non attivabile");
  // task inesistente resta no-op (B3) anche con la validazione
  ok(vq.setTaskStatus("nope", "done") === null, "B3: task inesistente → null (no-op), non throw");
  vq.close();
}

console.log(`\ntask-graph test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

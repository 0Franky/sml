/**
 * Smoke-test del datastore vars-queue. Esegui: `node src/vars-queue.test.mjs`
 * Zero dipendenze, zero Docker. Verifica le proprietà di design ancorate ai concept wiki.
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const dir = mkdtempSync(join(tmpdir(), "vq-"));
const dbPath = join(dir, "vars.db");

try {
  // 1) VARS lane + lookup O(1) by id ------------------------------------------
  {
    const q = new VarsQueue(dbPath, { agent: "orchestrator" });
    q.setVar("jwt_algo", "HS256", { who: "orchestrator", decisionRef: "DEC-t5" });
    const v = q.getVar("jwt_algo");
    ok(v && v.value === "HS256", "VAR set/get value");
    ok(v.last_modified_by === "orchestrator", "VAR records who");
    ok(typeof v.last_modified === "number" && v.last_modified > 0, "VAR records timestamp");
    ok(v.decision_ref === "DEC-t5", "VAR carries decision ref (step->decisione)");
    q.close();
  }

  // 2) CROSS-COMPACT: riapri lo stesso file -> lo stato sopravvive -------------
  {
    const q2 = new VarsQueue(dbPath, { agent: "orchestrator" });
    const v = q2.getVar("jwt_algo");
    ok(v && v.value === "HS256", "CROSS-COMPACT: stato persiste alla riapertura del file");
    q2.close();
  }

  // 3) CHANGE-LOG: chi/quando/cosa, e auto-propagazione per riferimento --------
  {
    const q = new VarsQueue(dbPath, { agent: "orchestrator" });
    const t0 = Date.now();
    q.setVar("jwt_algo", "RS256", { who: "orchestrator", decisionRef: "DEC-t9" });
    const log = q.getChangeLog({ entity: "vars", entityId: "jwt_algo" });
    ok(log.length >= 2, "CHANGE-LOG: registra ogni mutazione");
    ok(log[0].old_value === '"HS256"' && log[0].new_value === '"RS256"', "CHANGE-LOG: old->new");
    ok(log[0].ts >= t0, "CHANGE-LOG: timestamp coerente");
    // un consumer che rilegge per id vede SEMPRE l'ultima versione (propagazione per riferimento)
    ok(q.getVar("jwt_algo").value === "RS256", "AUTO-PROPAGAZIONE: read-by-id vede l'ultima versione");
    q.close();
  }

  // 4) CROSS-AGENT: VIEW shared + private isolation + propose/merge single-writer
  {
    const orch = new VarsQueue(dbPath, { agent: "orchestrator" });
    orch.setVar("api_base", "https://api.local", { scope: "shared", who: "orchestrator" });
    orch.setVar("scratch_orch", 42, { scope: "private", who: "orchestrator" });

    // un sotto-agente vede solo la VIEW shared
    const shared = orch.getSharedView();
    ok(shared.some(v => v.id === "api_base"), "CROSS-AGENT: la var shared è nella VIEW");
    ok(!shared.some(v => v.id === "scratch_orch"), "CROSS-AGENT: la var private NON è condivisa");

    // il sotto-agente PROPONE una scrittura (non scrive diretto -> niente race)
    const sub = new VarsQueue(dbPath, { agent: "sub-frontend" });
    sub.proposeVar("api_base", "https://api.staging", { agent: "sub-frontend" });
    ok(sub.getVar("api_base").value === "https://api.local", "CROSS-AGENT: la proposta NON muta subito (single-writer)");
    ok(orch.pendingProposals().length === 1, "CROSS-AGENT: proposta in coda");

    // l'orchestratore fa il MERGE (qui: accetta)
    const applied = orch.mergeProposals(() => true);
    ok(applied === 1, "CROSS-AGENT: merge applica 1 proposta");
    ok(orch.getVar("api_base").value === "https://api.staging", "CROSS-AGENT: dopo merge la var è aggiornata");
    ok(orch.pendingProposals().length === 0, "CROSS-AGENT: coda proposte svuotata");
    sub.close(); orch.close();
  }

  // 5) TASKS lane + CURR pointer + changelog delle transizioni di stato --------
  {
    const q = new VarsQueue(dbPath, { agent: "orchestrator" });
    q.addTask("T1", "migrate jwt", { payload: { area: "auth" } });
    q.setCurr("T1");
    ok(q.getCurr() === "T1", "CURR pointer set/get");
    q.setTaskStatus("T1", "in_progress");
    q.setTaskStatus("T1", "done");
    const t = q.getTask("T1");
    ok(t.status === "done" && t.payload.area === "auth", "TASK status + payload JSON");
    const tlog = q.getChangeLog({ entity: "tasks", entityId: "T1" });
    ok(tlog.length >= 3, "TASK: changelog di pending->in_progress->done");
    ok(q.listTasks({ status: "done" }).length === 1, "TASK listTasks filtra per status");
    q.close();
  }

  // 6) RULES + VERIFICATIONS lane ---------------------------------------------
  {
    const q = new VarsQueue(dbPath, { agent: "orchestrator" });
    q.addRule("no-secret-exfil", "Mai esfiltrare segreti", { severity: "hard" });
    ok(q.listRules().some(r => r.id === "no-secret-exfil" && r.severity === "hard"), "RULES add/list");
    q.addVerification("V1", "T1", { detail: "oracolo import" });
    q.setVerificationStatus("V1", "pass");
    ok(q.listVerifications({ status: "pass" }).length === 1, "VERIFICATIONS add/status/list");
    q.close();
  }

  // 7) GC change-log: "visibile finché serve" ---------------------------------
  {
    const q = new VarsQueue(":memory:", { agent: "x" });
    q.setVar("a", 1); q.setVar("a", 2); q.setVar("a", 3);
    const before = q.getChangeLog().length;
    const pruned = q.gcChangeLog(Date.now() + 1); // pruna tutto il passato
    ok(pruned >= 3, "GC: pruna le entry vecchie");
    ok(q.getChangeLog().length < before, "GC: change-log ridotto");
    q.close();
  }

  // 8) DECISIONS lane + query per idAgente (utente msg 456/457) ----------------
  {
    const q = new VarsQueue(":memory:", { agent: "orchestrator" });
    // l'orchestratore e un sotto-agente (who esplicito = sua identità) registrano scelte sullo stesso store
    q.recordDecision("D1", "usa RS256", { rationale: "asimmetrico, rotazione chiavi", taskRef: "T1" });
    q.recordDecision("D2", "estrarre token via header", { who: "sub-auth", taskRef: "T1" });
    q.recordDecision("D3", "rollback se test rossi", { who: "sub-auth" });

    const d1 = q.getDecision("D1");
    ok(d1 && d1.text === "usa RS256" && d1.agent === "orchestrator", "DECISION: record/get + attribuzione agente");
    ok(d1.rationale === "asimmetrico, rotazione chiavi", "DECISION: razionale (why) persistito");

    // query per idAgente — il cuore della richiesta utente
    const bySubAuth = q.getDecisionsByAgent("sub-auth");
    ok(bySubAuth.length === 2 && bySubAuth.every(d => d.agent === "sub-auth"),
       "DECISION: getDecisionsByAgent ritorna SOLO le scelte di quell'agente");
    ok(q.getDecisionsByAgent("orchestrator").length === 1, "DECISION: filtro per agente è esatto");
    ok(q.listDecisions({ taskRef: "T1" }).length === 2, "DECISION: filtro per task_ref");

    // vista più ampia: tutte le mutazioni attribuite (change-log by who) — floor del report-to-file
    const changes = q.getChangesByAgent("sub-auth");
    ok(changes.length >= 2 && changes.every(c => c.who === "sub-auth"),
       "DECISION: getChangesByAgent attribuisce le mutazioni per agente (report floor)");

    // upsert idempotente
    q.recordDecision("D1", "usa RS256 (confermato)", { rationale: "+EST512 in futuro" });
    ok(q.getDecisionsByAgent("orchestrator").length === 1, "DECISION: upsert su id non duplica");
    ok(q.getDecision("D1").text.includes("confermato"), "DECISION: upsert aggiorna il testo");
    q.close();
  }

} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\nvars-queue smoke-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

/**
 * Smoke-test di pop-report (floor-F del protocollo di ritorno matrioska/sub-agente).
 * Verifica ../../wiki/concepts/report-to-file-pointer.md: il report è DERIVABILE dalle decisioni/cambiamenti
 * attribuiti all'agente figlio → summary breve + report_path; mai vuoto; path OS-agnostic.
 */
import { buildPopReport } from "../../src/pop-report.mjs";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const dir = mkdtempSync(join(tmpdir(), "popr-"));

try {
  // 1) report mai-vuoto su agente senza attività (floor-F) ---------------------
  {
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    const r = buildPopReport(vq, "sub-x", { write: false });
    ok(r.decisions === 0 && r.changes === 0, "EMPTY: conteggi a zero");
    ok(r.report.includes("nessuna decisione"), "EMPTY: report non vuoto (placeholder)");
    ok(r.summary.includes("sub-x") && r.summary.includes("0 decisioni"), "EMPTY: summary floor non vuoto");
    ok(r.report_path === null, "EMPTY: write:false → nessun file");
    vq.close();
  }

  // 2) report derivato dalle decisioni/cambiamenti dell'agente figlio ----------
  {
    const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
    // attività del figlio sub-auth
    vq.recordDecision("D1", "estrai token da header Authorization", { who: "sub-auth", rationale: "evita cookie", taskRef: "T1" });
    vq.recordDecision("D2", "rollback se i test sono rossi", { who: "sub-auth" });
    vq.setVar("auth_mode", "bearer", { who: "sub-auth", scope: "shared" });
    // rumore di un ALTRO agente → NON deve finire nel report del figlio
    vq.recordDecision("DX", "scelta del padre", { who: "orchestrator" });

    const r = buildPopReport(vq, "sub-auth", { reportDir: dir, reportId: "run1" });
    ok(r.decisions === 2, "DERIVA: 2 decisioni del figlio");
    ok(r.report.includes("estrai token") && r.report.includes("evita cookie"), "DERIVA: decisione + razionale nel report");
    ok(!r.report.includes("scelta del padre"), "DERIVA: la decisione di un altro agente è ESCLUSA");
    // changes ESCLUDE entity='decisions' (rese nella sezione Decisioni) → resta solo la var (no doppio-conteggio)
    ok(r.changes === 1, "DERIVA: changes esclude le decisioni (solo la var; no doppio-conteggio)");

    // file scritto + pointer nel summary + OS-agnostic
    ok(existsSync(r.report_path), "FILE: report scritto su disco");
    ok(r.report_path === fwdJoin(dir, "sub-auth-run1.md"), "FILE: path deterministico OS-agnostic (forward-slash)");
    ok(!r.report_path.includes("\\"), "FILE: nessun backslash nel path");
    ok(r.summary.includes("→ report: " + r.report_path), "POINTER: il summary contiene il report_path");
    ok(readFileSync(r.report_path, "utf-8").includes("# Report scope"), "FILE: contenuto pieno persistito");
    vq.close();
  }

  // 3) summary bounded (la decisione lunga è troncata) -------------------------
  {
    const vq = new VarsQueue(":memory:", { agent: "x" });
    const longText = "x".repeat(500);
    vq.recordDecision("DL", longText, { who: "sub-long" });
    const r = buildPopReport(vq, "sub-long", { write: false, summaryCap: 60 });
    ok(r.summary.length < 200, "BOUNDED: summary corto anche con decisione lunga");
    ok(r.summary.includes("…"), "BOUNDED: ellissi sul troncamento");
    ok(r.report.includes(longText), "BOUNDED: il report (non troncato) conserva il testo pieno");
    vq.close();
  }

} finally {
  rmSync(dir, { recursive: true, force: true });
}

function fwdJoin(...parts) { return join(...parts).replace(/\\/g, "/"); }

console.log(`\npop-report smoke-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

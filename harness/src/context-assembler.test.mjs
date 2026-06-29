/**
 * Smoke-test del context-assembler. Esegui: `node src/context-assembler.test.mjs`
 * Zero dipendenze, zero Docker. Assembla un <context> da un vars-queue popolato e verifica le lane.
 */
import { VarsQueue } from "./vars-queue.mjs";
import { assembleContext } from "./context-assembler.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const NOW = 1_900_000_000_000; // epoch ms fisso → test deterministico (niente Date.now())

const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
// popola le lane
vq.addRule("no-secret-exfil", "Mai esfiltrare segreti", { severity: "hard" });
vq.addRule("structured-thinking", "Pensa con marker [V]/[A]/[?]", { severity: "soft" });
vq.addTask("T1", "migrate jwt to RS256", { });
vq.addTask("T2", "write tests", { });
vq.setCurr("T1");
vq.setTaskStatus("T1", "in_progress");
vq.addVerification("V1", "T1", { detail: "oracolo import RS256" });
vq.setVar("api_base", "https://api.local", { scope: "shared", decisionRef: "DEC-t5" });
vq.setVar("scratch", 7, { scope: "private" });

const ctx = assembleContext(vq, { now: NOW, sinceMs: 0 });

// struttura
ok(ctx.startsWith("<context>") && ctx.trimEnd().endsWith("</context>"), "wrapper <context>");
// rules ordinate per severità (hard prima di soft)
ok(ctx.indexOf("[hard] Mai esfiltrare") < ctx.indexOf("[soft] Pensa con marker"), "rules ordinate per severità");
// current_aim
ok(/<current_aim id="T1" status="in_progress">migrate jwt to RS256<\/current_aim>/.test(ctx), "current_aim dal CURR");
// task_list open-loop (in_progress prima, poi pending)
ok(ctx.includes("[in_progress] T1") && ctx.includes("[pending] T2"), "task_list open-loop");
// verify_queue
ok(ctx.includes("V1 (task T1): oracolo import RS256"), "verify_queue pendente");
// vars: shared presente, con decision_ref; private esclusa di default
ok(ctx.includes("api_base=") && ctx.includes("per DEC-t5"), "vars shared + decision_ref");
ok(!ctx.includes("scratch="), "vars private escluse di default");
// recent_changes con chi/quando/cosa
ok(ctx.includes("<recent_changes>"), "recent_changes presente");
ok(ctx.includes("orchestrator:") && ctx.includes("api_base"), "recent_changes registra chi+cosa");

// includePrivateVars opt-in
const ctx2 = assembleContext(vq, { now: NOW, sinceMs: 0, includePrivateVars: true });
ok(ctx2.includes("scratch="), "includePrivateVars opt-in mostra le private");

// escaping anti-injection nei valori
vq.addRule("xml-escape", "usa < e > e &", { severity: "soft" });
const ctx3 = assembleContext(vq, { now: NOW });
ok(ctx3.includes("&lt;") && ctx3.includes("&gt;") && ctx3.includes("&amp;"), "escaping XML dei contenuti");

vq.close();
console.log(`\ncontext-assembler smoke-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

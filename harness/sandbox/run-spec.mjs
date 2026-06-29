// Generic verifier-spec runner (replica standalone di run_verifier).
// Usage: node run-spec.mjs <path-to-spec.json>
// Spec: { setup: [bash...], asserts: [{cmd, expect_exit, note?}] }
// Esegue setup in una tempdir isolata, poi ogni assert → exit reale vs atteso → pass/fail.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const specPath = process.argv[2];
if (!specPath) {
  console.error("usage: node run-spec.mjs <spec.json>");
  process.exit(2);
}
const spec = JSON.parse(readFileSync(specPath, "utf8"));

const dir = mkdtempSync(join(tmpdir(), "slm-spec-"));
const results = [];
let setupError = null;
try {
  for (const c of spec.setup ?? []) {
    try {
      execFileSync("bash", ["-lc", c], { cwd: dir, stdio: "pipe" });
    } catch (e) {
      setupError = { cmd: c, stderr: (e.stderr || "").toString(), stdout: (e.stdout || "").toString(), status: e.status };
      break;
    }
  }
  if (!setupError) {
    for (const a of spec.asserts ?? []) {
      const want = a.expect_exit ?? 0;
      let exit = 0;
      let stdout = "";
      try {
        stdout = execFileSync("bash", ["-lc", a.cmd], { cwd: dir, stdio: "pipe" }).toString();
      } catch (e) {
        exit = typeof e.status === "number" ? e.status : 1;
        stdout = (e.stdout || "").toString();
      }
      results.push({ cmd: a.cmd, note: a.note ?? null, passed: exit === want, exit, want, stdout: stdout.slice(0, 400) });
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
const passed = !setupError && results.length > 0 && results.every((r) => r.passed);
console.log(JSON.stringify({ spec: specPath, passed, setupError, results }, null, 2));
process.exit(passed ? 0 : 1);

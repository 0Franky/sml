// Smoke-test del meccanismo verifier-sandbox (replica standalone di run_verifier).
// Prova end-to-end: setup fixture (git + file) + asserts (grep) → pass/fail. NON richiede pi.
// Spec gold-style (famiglia dep-check): un simbolo referenziato cross-file vs uno isolato.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const spec = {
  setup: [
    "git init -q",
    "printf 'def parse(x):\\n    return x\\n' > parser.py",
    "printf 'from parser import parse\\nparse(1)\\n' > loader.py",
    "git add -A && git commit -qm init",
  ],
  asserts: [
    // oracolo POSITIVO: parser.parse È referenziato (dep esiste) → exit 0
    { cmd: "grep -rn 'from parser import' . --include=*.py", expect_exit: 0 },
    // oracolo NEGATIVO di controllo: un simbolo inesistente NON è referenziato → exit 1
    { cmd: "grep -rn 'from nonexistent import' . --include=*.py", expect_exit: 1 },
  ],
};

const dir = mkdtempSync(join(tmpdir(), "slm-verifier-smoke-"));
const results = [];
try {
  for (const c of spec.setup) execFileSync("bash", ["-lc", c], { cwd: dir, stdio: "pipe" });
  for (const a of spec.asserts) {
    const want = a.expect_exit ?? 0;
    let exit = 0;
    try {
      execFileSync("bash", ["-lc", a.cmd], { cwd: dir, stdio: "pipe" });
    } catch (e) {
      exit = typeof e.status === "number" ? e.status : 1;
    }
    results.push({ cmd: a.cmd, passed: exit === want, exit, want });
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
const passed = results.length > 0 && results.every((r) => r.passed);
console.log(JSON.stringify({ passed, results }, null, 2));
process.exit(passed ? 0 : 1);

/**
 * verify — oracolo HumanEval deterministico (LLM-independent). Il reward del Modo 1.
 *
 * Grada la soluzione del modello col TEST UFFICIALE del task:
 *   program = <solutionCode> + <task.test (def check)> + `check(<entry_point>)`
 * eseguito in un tempdir isolato con timeout → exit 0 = PASS. Nessun accesso rete, niente input esterni.
 *
 * NB: `task.test` è il test NASCOSTO (mai dato al modello). Il modello riceve solo `task.prompt` (firma+docstring).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PY = process.env.EVAL_PYTHON || "python";

/**
 * @param {{test:string, entry_point:string}} task
 * @param {string|null} solutionCode  codice della soluzione (contenuto di solution.py, o null se assente)
 * @param {{timeoutMs?:number}} [opts]
 * @returns {{passed:boolean, exit:number|null, reason:string, stderr:string}}
 */
export function gradeHumanEval(task, solutionCode, opts = {}) {
  if (!solutionCode || !solutionCode.trim()) return { passed: false, exit: null, reason: "no-solution", stderr: "" };
  const timeoutMs = opts.timeoutMs ?? 20000;
  const program = `${solutionCode}\n\n${task.test}\n\ncheck(${task.entry_point})\n`;
  const dir = mkdtempSync(join(tmpdir(), "he-grade-"));
  const file = join(dir, "grade.py");
  writeFileSync(file, program);
  try {
    execFileSync(PY, [file], { cwd: dir, stdio: "pipe", timeout: timeoutMs });
    return { passed: true, exit: 0, reason: "ok", stderr: "" };
  } catch (e) {
    const exit = typeof e.status === "number" ? e.status : null;
    const stderr = (e.stderr || e.stdout || "").toString();
    const reason = e.signal === "SIGTERM" || /ETIMEDOUT/.test(String(e.message)) ? "timeout"
      : /assert/i.test(stderr) ? "assert-fail"
      : exit === null ? "run-error" : "nonzero-exit";
    return { passed: false, exit, reason, stderr: stderr.slice(0, 500) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export default { gradeHumanEval };

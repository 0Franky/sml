/**
 * verify — oracolo HumanEval deterministico (LLM-independent). Il reward del Modo 1.
 *
 * Grada la soluzione del modello col TEST UFFICIALE del task:
 *   program = <solutionCode> + <task.test (def check)> + `check(<entry_point>)`
 * eseguito in un tempdir isolato con timeout → exit 0 = PASS. Nessun accesso rete, niente input esterni.
 *
 * NB: `task.test` è il test NASCOSTO (mai dato al modello). Il modello riceve solo `task.prompt` (firma+docstring).
 */
import { runPython } from "./py-run.mjs"; // runner Python isolato CONDIVISO (SSOT #16) — ex-exec inline migrato 2026-07-05

/**
 * @param {{test:string, entry_point:string}} task
 * @param {string|null} solutionCode  codice della soluzione (contenuto di solution.py, o null se assente)
 * @param {{timeoutMs?:number}} [opts]
 * @returns {{passed:boolean, exit:number|null, reason:string, stderr:string}}
 */
export function gradeHumanEval(task, solutionCode, opts = {}) {
  if (!solutionCode || !solutionCode.trim()) return { passed: false, exit: null, reason: "no-solution", stderr: "" };
  const program = `${solutionCode}\n\n${task.test}\n\ncheck(${task.entry_point})\n`;
  const r = runPython(program, { timeoutMs: opts.timeoutMs ?? 20000 });
  return { passed: r.ok, exit: r.exit, reason: r.ok ? "ok" : r.reason, stderr: r.stderr };
}

export default { gradeHumanEval };

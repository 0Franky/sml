/**
 * py-run — runner Python isolato CONDIVISO (SSOT #16). Esegue un programma Python in un tempdir usa-e-getta con
 * timeout, senza rete/input esterni, e ritorna esito+stderr normalizzati. Usato dal discrimination-gate della
 * disciplina-di-verifica (verifiers/verification-discipline.mjs) e — dopo migrazione — da eval/verify.mjs.
 *
 * NB (DRY, tracciato): `eval/verify.mjs::gradeHumanEval` ha ancora il proprio exec inline (non toccato mentre un A/B
 * gira per non introdurre race sul file importato); migrarlo a `runPython` è un follow-up in wiki/todo.md.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const DEFAULT_PY = process.env.EVAL_PYTHON || "python";

/**
 * Esegue `program` (sorgente Python) e ritorna l'esito.
 * @param {string} program  sorgente Python completo (impl + test + invocazione)
 * @param {{timeoutMs?:number, py?:string}} [opts]
 * @returns {{ok:boolean, exit:number|null, reason:"ok"|"assert-fail"|"timeout"|"run-error"|"nonzero-exit", stderr:string}}
 */
export function runPython(program, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const py = opts.py || DEFAULT_PY;
  const dir = mkdtempSync(join(tmpdir(), "pyrun-"));
  const file = join(dir, "p.py");
  writeFileSync(file, String(program ?? ""));
  try {
    execFileSync(py, [file], { cwd: dir, stdio: "pipe", timeout: timeoutMs });
    return { ok: true, exit: 0, reason: "ok", stderr: "" };
  } catch (e) {
    const exit = typeof e.status === "number" ? e.status : null;
    const stderr = (e.stderr || e.stdout || "").toString();
    const reason = e.signal === "SIGTERM" || /ETIMEDOUT/.test(String(e.message)) ? "timeout"
      : /assert/i.test(stderr) ? "assert-fail"
      : exit === null ? "run-error" : "nonzero-exit";
    return { ok: false, exit, reason, stderr: stderr.slice(0, 500) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** True se un interprete Python è invocabile (per i test che devono skippare pulito dove Python manca). */
export function pythonAvailable(py = DEFAULT_PY) {
  try { execFileSync(py, ["--version"], { stdio: "pipe", timeout: 5000 }); return true; } catch { return false; }
}

export default { runPython, pythonAvailable, DEFAULT_PY };

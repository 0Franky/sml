/**
 * verifier-sandbox — Fase 0.3 (BOTTLENECK-BUSTER)
 *
 * Registra il tool `run_verifier`: esegue un verifier-spec (setup fixture + assert
 * oracoli) in una sandbox isolata e ritorna pass/fail. È il runner che VALIDA i
 * gold-example: il loro reward = verifier deterministico su fixture (vedi
 * slm/wiki/training-taxonomy/gold-methodology.md). Sblocca la rimozione del marker
 * [UNVERIFIED] dai gold.
 *
 * API pi verificata: pi.registerTool({ name, label, description, parameters:<typebox>, execute }).
 * Isolation: per ora subprocess in una tempdir (TODO: container Docker — sandbox/Dockerfile).
 *
 * TODO(types): confermare le firme esatte di registerTool/execute con `npm install` + tsc.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const VerifierSpec = Type.Object({
  setup: Type.Array(Type.String(), {
    description: "Shell commands that seed the fixture (e.g. git init, writing files). = §2bis of the gold.",
  }),
  asserts: Type.Array(
    Type.Object({
      cmd: Type.String({ description: "Command whose exit-code is the oracle." }),
      expect_exit: Type.Optional(Type.Number({ description: "Expected exit-code (default 0)." })),
    }),
    { description: "Deterministic oracles anchored to the OUTCOME (exit==expect → pass)." },
  ),
});

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "run_verifier",
    label: "Run gold verifier",
    description:
      "Run a verifier-spec (fixture setup + oracle asserts) in a temp dir with a MINIMAL env (no host secrets) and return pass/fail. Validates the gold-examples. NOTE: not yet container-isolated (Docker is a TODO) — run only trusted verifier specs.",
    parameters: VerifierSpec,
    async execute(_toolCallId: string, params: any, _signal: any, _onUpdate: any, _ctx: any) {
      // TODO(isolation): sostituire questa tempdir con un container Docker (sandbox/Dockerfile)
      // per riproducibilità piena e isolamento — allineato ai gym SWE Docker. NON è ancora un sandbox isolato.
      const dir = mkdtempSync(join(tmpdir(), "slm-verifier-"));
      // P0 (review-full): NON passare `process.env` al comando — conterrebbe GEMINI_API_KEY / SEALED_SECRET_* / token
      // che il codice eseguito (anche ostile) potrebbe esfiltrare. Env MINIMALE esplicito (no secret dell'host).
      const SANDBOX_ENV: Record<string, string> = { PATH: process.env.PATH ?? "", HOME: dir, TMPDIR: dir, LANG: process.env.LANG ?? "C" };
      // D1 (audit 2026-07-04): timeout + maxBuffer + killSignal OBBLIGATORI. Senza timeout un comando che blocca
      // (curl a host irraggiungibile, read su stdin, sleep) freeza l'INTERO event-loop sincrono → l'agente muore,
      // l'abort `_signal` è ignorato, recupero solo con kill del processo. maxBuffer esplicito: output >1MB (default)
      // farebbe ENOBUFS → un assert legittimamente verboso verrebbe contato come FAIL. 60s/16MB sono ampi ma limitati.
      const EXEC_OPTS = { cwd: dir, stdio: "pipe" as const, env: SANDBOX_ENV, timeout: 60_000, maxBuffer: 16 * 1024 * 1024, killSignal: "SIGKILL" as const };
      const results: Array<{ cmd: string; passed: boolean; exit: number; output: string }> = [];
      try {
        for (const c of params.setup ?? []) {
          execFileSync("bash", ["-lc", c], EXEC_OPTS);
        }
        for (const a of params.asserts ?? []) {
          const want = typeof a.expect_exit === "number" ? a.expect_exit : 0;
          let exit = 0;
          let output = "";
          try {
            output = execFileSync("bash", ["-lc", a.cmd], EXEC_OPTS).toString();
          } catch (e: any) {
            exit = typeof e?.status === "number" ? e.status : 1;
            output = (e?.stdout?.toString?.() ?? "") + (e?.stderr?.toString?.() ?? "");
          }
          results.push({ cmd: a.cmd, passed: exit === want, exit, output: output.slice(0, 2000) });
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
      const passed = results.length > 0 && results.every((r) => r.passed);
      return {
        content: [{ type: "text", text: JSON.stringify({ passed, results }, null, 2) }],
        details: { passed },
      };
    },
  });
}

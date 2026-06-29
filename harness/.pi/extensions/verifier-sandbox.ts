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
    description: "Comandi shell che seedano la fixture (es. git init, scrittura file). = §2bis del gold.",
  }),
  asserts: Type.Array(
    Type.Object({
      cmd: Type.String({ description: "Comando il cui exit-code è l'oracolo." }),
      expect_exit: Type.Optional(Type.Number({ description: "Exit-code atteso (default 0)." })),
    }),
    { description: "Oracoli deterministici ancorati all'OUTCOME (exit==expect → pass)." },
  ),
});

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "run_verifier",
    label: "Run gold verifier",
    description:
      "Esegue un verifier-spec (setup fixture + assert oracoli) in sandbox e ritorna pass/fail. Valida i gold-example.",
    parameters: VerifierSpec,
    async execute(_toolCallId: string, params: any, _signal: any, _onUpdate: any, _ctx: any) {
      // TODO(isolation): sostituire questa tempdir con un container Docker (sandbox/Dockerfile)
      // per riproducibilità piena e isolamento — allineato ai gym SWE Docker.
      const dir = mkdtempSync(join(tmpdir(), "slm-verifier-"));
      const results: Array<{ cmd: string; passed: boolean; exit: number; output: string }> = [];
      try {
        for (const c of params.setup ?? []) {
          execFileSync("bash", ["-lc", c], { cwd: dir, stdio: "pipe" });
        }
        for (const a of params.asserts ?? []) {
          const want = typeof a.expect_exit === "number" ? a.expect_exit : 0;
          let exit = 0;
          let output = "";
          try {
            output = execFileSync("bash", ["-lc", a.cmd], { cwd: dir, stdio: "pipe" }).toString();
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

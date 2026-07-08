/**
 * state-isolation — WIRING test dell'isolamento dello stato via `HARNESS_STATE_DIR` (fix drive-qwen 2026-07-08).
 *
 * Perché wiring e non unit (CLAUDE.md #14): il bug che chiudiamo NON vive nelle funzioni pure ma nel WIRING
 * "processo pi eredita l'env → STATE_DIR ne deriva → i DB atterrano nella dir isolata, NON nel `.pi/state` reale".
 * Il Test C riproduce QUELLO: spawn di un processo node con `HARNESS_STATE_DIR=<tmp>` che importa lo STESSO
 * `state-db.mjs` delle extension e scrive una var via `getVarsQueue()` (path di default). Se STATE_DIR ignorasse
 * l'env (vecchio hardcode `.pi/state/vars.db`) il file NON comparirebbe nella dir isolata → il test FALLIREBBE.
 * È il meccanismo per cui `tools/drive-qwen.mjs` ora non inquina più il `.pi/state` della TUI viva.
 */
import { dbPathsFor, VARS_DB_PATH } from "../../src/state-db.mjs";
import { STATE_DIR } from "../../src/state-paths.mjs";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { getVarsQueue, closeAll } from "../../src/state-db.mjs";
import { mkdtempSync, existsSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log("  ✗ FAIL: " + m)); };

// ===== Test A — dbPathsFor puro (SSOT dei suffissi, forward-slash) =====
const p = dbPathsFor("/some/dir");
ok(p.vars === "/some/dir/vars.db", `dbPathsFor.vars (${p.vars})`);
ok(p.conv === "/some/dir/conversations.db", `dbPathsFor.conv (${p.conv})`);
ok(p.toolcall === "/some/dir/tool-calls.db", `dbPathsFor.toolcall (${p.toolcall})`);
ok(!p.vars.includes("\\"), "dbPathsFor usa forward-slash (OS-agnostico)");
// SSOT: la costante di default DEVE coincidere con dbPathsFor(STATE_DIR) — nessuna divergenza silente (#16)
ok(VARS_DB_PATH === dbPathsFor(STATE_DIR).vars, `VARS_DB_PATH === dbPathsFor(STATE_DIR).vars (${VARS_DB_PATH})`);

// ===== Test B — catena esplicita: getVarsQueue(path-isolato) crea la dir e scrive LÌ (ensureStateDir mkdir) =====
const tmpB = mkdtempSync(join(tmpdir(), "iso-b-"));
const isoB = join(tmpB, "nested", "state"); // sotto-dir INESISTENTE → testa il mkdir alla prima apertura
const vqB = getVarsQueue(dbPathsFor(isoB).vars);
vqB.setVar("probe_b", "OK", { scope: "shared" });
ok(existsSync(dbPathsFor(isoB).vars), "getVarsQueue(path-isolato) crea vars.db nella dir isolata (mkdir ricorsivo)");
const sharedB = vqB.getSharedView();
ok(sharedB.some((v) => v.id === "probe_b"), "la var scritta è leggibile dal DB isolato (round-trip)");
closeAll();

// ===== Test C — WIRING env→STATE_DIR: subprocess con HARNESS_STATE_DIR eredita l'isolamento (come pi nel driver) =====
const tmpC = mkdtempSync(join(tmpdir(), "iso-c-"));
const isoC = join(tmpC, "drive-state"); // dir isolata (assoluta) passata via env, come fa drive-qwen
const stateDbUrl = new URL("../../src/state-db.mjs", import.meta.url).href; // file:// URL (import cross-platform)
const fixture =
  `import { getVarsQueue } from ${JSON.stringify(stateDbUrl)};\n` +
  `const vq = getVarsQueue();\n` +                                   // path DEFAULT → deriva da STATE_DIR (=env)
  `vq.setVar("isolation_probe", "FROM_SUBPROCESS", { scope: "shared" });\n` +
  `vq.close();\n`;
const fixturePath = join(tmpC, "probe.mjs");
writeFileSync(fixturePath, fixture);
const r = spawnSync(process.execPath, [fixturePath],
  { env: { ...process.env, HARNESS_STATE_DIR: isoC }, encoding: "utf8", timeout: 30000 });
ok(r.status === 0, `subprocess pi-like exit 0 (status=${r.status}${r.status ? " stderr=" + (r.stderr || "").slice(-200) : ""})`);
ok(isoC !== STATE_DIR && isoC !== ".pi/state", "la dir isolata NON è il .pi/state reale (env override effettivo)");
ok(existsSync(dbPathsFor(isoC).vars),
   "WIRING: con HARNESS_STATE_DIR il subprocess scrive nella dir ISOLATA, non nel .pi/state (fallirebbe col vecchio hardcode)");
const vqC = new VarsQueue(dbPathsFor(isoC).vars, { agent: "orchestrator" });
const sharedC = vqC.getSharedView();
ok(sharedC.some((v) => v.id === "isolation_probe" && v.value === "FROM_SUBPROCESS"),
   "il ground-truth del subprocess è leggibile dalla dir isolata (ciò che fa groundTruth() del driver)");
vqC.close();

// cleanup
rmSync(tmpB, { recursive: true, force: true });
rmSync(tmpC, { recursive: true, force: true });

console.log(`state-isolation wiring-test: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

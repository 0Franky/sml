/** check-load — verifica che pi carichi TUTTE le estensioni (via rpc get_commands + stderr di boot). Diagnostico. */
import { spawn } from "node:child_process";
const PI = "node_modules/@earendil-works/pi-coding-agent/dist/cli.js";
const child = spawn(process.execPath, [PI, "--mode", "rpc", "--session-id", "check-load-" + Date.now()], { cwd: process.cwd(), stdio: ["pipe", "pipe", "pipe"] });
let buf = "", stderr = "";
child.stderr.on("data", (d) => { stderr += d.toString(); });
child.stdout.on("data", (d) => {
  buf += d.toString(); let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
    if (!line) continue; let m; try { m = JSON.parse(line); } catch { continue; }
    if (m.type === "response" && m.command === "get_commands") {
      const data = m.data ?? {};
      const list = data.commands ?? data.tools ?? data;
      console.log("get_commands →", JSON.stringify(list).slice(0, 1500));
      child.stdin.end(); child.kill(); process.exit(0);
    }
  }
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await sleep(3500);
  if (stderr.trim()) console.log("=== STDERR di boot (errori di load?) ===\n" + stderr.slice(0, 2000) + "\n=== fine stderr ===");
  else console.log("(nessuno stderr di boot — nessun errore di caricamento estensioni)");
  child.stdin.write(JSON.stringify({ id: 1, type: "get_commands" }) + "\n");
  await sleep(4000); child.kill(); process.exit(0);
})();

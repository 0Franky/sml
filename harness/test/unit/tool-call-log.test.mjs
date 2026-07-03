/**
 * tool-call-log — test del ring buffer delle ultime tool-call (fix amnesia #1, msg 811-817).
 */
import { summarizeArgs, recordCall, recordResult, getRecent, formatLane, clearToolCallLog } from "../../src/tool-call-log.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

// ── summarizeArgs ──
ok(summarizeArgs({ name: "REDDIT", why: "x" }) === "name=REDDIT, why=x", "args: key=val");
ok(summarizeArgs({}) === "", "args: oggetto vuoto → ''");
ok(summarizeArgs(null) === "", "args: null → ''");
ok(summarizeArgs({ a: 1, b: 2, c: 3, d: 4 }).endsWith(", …"), "args: >3 chiavi → troncato con …");
ok(summarizeArgs({ v: "x".repeat(100) }).length < 60, "args: valore lungo troncato");

// ── record + getRecent + status ──
{
  clearToolCallLog();
  recordCall({ callId: "c1", name: "list_tasks", args: {} });
  recordResult({ callId: "c1", isError: false, text: "2 tasks" });
  recordCall({ callId: "c2", name: "git_log", args: {} });
  recordResult({ callId: "c2", isError: true, text: "Tool git_log not found" });
  const r = getRecent(8);
  ok(r.length === 2, "record: 2 entry");
  ok(r[0].name === "list_tasks" && r[0].status === "ok" && r[0].result === "2 tasks", "record: c1 ok+result");
  ok(r[1].status === "error" && /not found/.test(r[1].result), "record: c2 error");
}

// ── correlazione risultato senza callId (fallback ultima pending) ──
{
  clearToolCallLog();
  recordCall({ name: "propose_secret_create", args: { name: "NOME_DEL_SEGRETO" } });
  recordResult({ isError: false, text: "User DENIED creation of 'NOME_DEL_SEGRETO'." });
  const r = getRecent();
  ok(r[0].status === "ok" && /DENIED/.test(r[0].result), "fallback: result associato all'ultima pending");
  ok(/name=NOME_DEL_SEGRETO/.test(r[0].args), "fallback: args sintetizzati");
}

// ── formatLane: marker auto-descritto + redazione ──
{
  clearToolCallLog();
  recordCall({ callId: "s", name: "http_request", args: { url: "https://x", token: "SECRET123" } });
  recordResult({ callId: "s", isError: false, text: "ok SECRET123" });
  const lane = formatLane(8, { redact: (s) => s.replace(/SECRET123/g, "[REDACTED]") });
  ok(lane.includes("<last_tool_calls"), "lane: marker presente");
  ok(lane.includes("your OWN recent tool calls"), "lane: auto-descritto");
  ok(lane.includes("http_request") && lane.includes("[REDACTED]") && !lane.includes("SECRET123"), "lane: redazione applicata ad args+result");
  ok(formatLane(8, {}) !== "", "lane: default redact = identità, non vuota");
}

// ── vuoto → '' ──
{
  clearToolCallLog();
  ok(formatLane(8) === "", "vuoto: lane ''");
  ok(getRecent().length === 0, "vuoto: nessuna entry");
}

// ── cap del ring buffer (12) ──
{
  clearToolCallLog();
  for (let i = 0; i < 20; i++) { recordCall({ callId: "k" + i, name: "t" + i, args: {} }); recordResult({ callId: "k" + i, isError: false, text: "r" + i }); }
  const r = getRecent(100);
  ok(r.length === 12, "cap: buffer limitato a 12");
  ok(r[r.length - 1].name === "t19", "cap: l'ultima è la più recente (t19)");
  ok(r[0].name === "t8", "cap: le più vecchie sono state droppate (parte da t8)");
}

// ── ANCORAGGIO TEMPORALE (utente msg 848/849): shift [+Xs] per riga + note su ordine autoritativo ──
{
  clearToolCallLog();
  const start = 1783000000000;
  recordCall({ callId: "z1", name: "find_tool", args: { query: "git" }, ts: start + 5000 });
  recordResult({ callId: "z1", isError: false, text: "ok" });
  recordCall({ callId: "z2", name: "list_secrets", args: {}, ts: start + 130000 });
  const lane = formatLane(8, { sessionStartMs: start });
  ok(lane.includes("[+5s] [ok] find_tool"), "shift: prima call +5s");
  ok(lane.includes("[+2m10s] [pending] list_secrets"), "shift: seconda call +2m10s");
  ok(/AUTHORITATIVE order is by those timestamps/.test(lane), "note: ordine autoritativo = timestamp");
  // senza sessionStartMs → nessun prefisso (degrada)
  ok(!/\[\+\d/.test(formatLane(8)), "shift: senza sessionStartMs → nessun prefisso (graceful)");
}

console.log(`\ntool-call-log: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);

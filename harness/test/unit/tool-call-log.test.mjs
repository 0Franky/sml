/**
 * tool-call-log — test del ring buffer delle ultime tool-call (fix amnesia #1, msg 811-817).
 */
import { summarizeArgs, recordCall, recordResult, getRecent, formatLane, ringStats, viewRange, renderCallRows, clearToolCallLog } from "../../src/tool-call-log.mjs";

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

// ── cap del ring buffer (24) ──
{
  clearToolCallLog();
  for (let i = 0; i < 30; i++) { recordCall({ callId: "k" + i, name: "t" + i, args: {} }); recordResult({ callId: "k" + i, isError: false, text: "r" + i }); }
  const r = getRecent(100);
  ok(r.length === 24, "cap: buffer limitato a 24");
  ok(r[r.length - 1].name === "t29", "cap: l'ultima è la più recente (t29)");
  ok(r[0].name === "t6", "cap: le più vecchie sono state droppate (parte da t6)");
}

// ── formatLane: FILTRO memory-op (utente msg 1259, F24) ──
{
  clearToolCallLog();
  recordCall({ callId: "w", name: "write_file", args: { path: "sol.py" } }); recordResult({ callId: "w", isError: false, text: "ok" });
  recordCall({ callId: "n", name: "note", args: { text: "saved progress" } }); recordResult({ callId: "n", isError: false, text: "ok" });
  recordCall({ callId: "v", name: "set_var", args: { key: "k" } }); recordResult({ callId: "v", isError: false, text: "ok" });
  const laneF = formatLane(8);
  ok(laneF.includes("write_file") && !laneF.includes("note(") && !laneF.includes("set_var"), "filtro: default esclude note/set_var, tiene write_file");
  const laneRaw = formatLane(8, { excludeMemoryOps: false });
  ok(laneRaw.includes("note(") && laneRaw.includes("set_var"), "filtro: excludeMemoryOps:false → mostra tutto (raw)");
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

// ── seq assoluto + ringStats + viewRange (tool PULL view_tool_calls, #3 msg 1258) ──
{
  clearToolCallLog();
  // 5 azioni reali + 2 memory-op intercalate
  recordCall({ callId: "a", name: "write_file", args: { path: "s1.py" } }); recordResult({ callId: "a", isError: false, text: "ok" }); // seq1
  recordCall({ callId: "b", name: "run_python", args: { code: "print(1)" } }); recordResult({ callId: "b", isError: false, text: "1" }); // seq2
  recordCall({ callId: "n1", name: "note", args: { text: "x" } }); recordResult({ callId: "n1", isError: false, text: "ok" }); // seq3 (memory-op)
  recordCall({ callId: "c", name: "grep", args: { q: "def" } }); recordResult({ callId: "c", isError: false, text: "3 hits" }); // seq4
  recordCall({ callId: "d", name: "write_file", args: { path: "s2.py" } }); recordResult({ callId: "d", isError: false, text: "ok" }); // seq5
  // seq assoluto assegnato
  const all = getRecent(100);
  ok(all[0].seq === 1 && all[all.length - 1].seq === 5, "seq: assoluto crescente 1..5");
  // ringStats
  const st = ringStats();
  ok(st.buffered === 5 && st.minSeq === 1 && st.maxSeq === 5 && st.totalSeen === 5 && st.dropped === 0, "ringStats: 5 bufferizzate, range 1..5, 0 dropped");
  const stF = ringStats({ excludeMemoryOps: true });
  ok(stF.buffered === 4, "ringStats: excludeMemoryOps esclude la note (4 azioni)");
  // viewRange default (ultime N) — esclude memory-op di default
  const vDefault = viewRange({ count: 3 });
  ok(vDefault.includes("<tool_calls_view"), "viewRange: marker presente");
  ok(!vDefault.includes("note("), "viewRange: default esclude le memory-op");
  ok(vDefault.includes("#5") && vDefault.includes("#4") && vDefault.includes("#2"), "viewRange: ultime 3 AZIONI = #2,#4,#5 (note #3 saltata)");
  // viewRange by range [from,to] su #seq assoluto
  const vRange = viewRange({ from: 1, to: 2 });
  ok(vRange.includes("#1") && vRange.includes("#2") && !vRange.includes("#4"), "viewRange: range [1,2] mostra solo #1,#2");
  // includeMemoryOps mostra la note
  const vRaw = viewRange({ from: 1, to: 5, includeMemoryOps: true });
  ok(vRaw.includes("note("), "viewRange: includeMemoryOps → include la note #3");
  // range fuori dal disponibile → header informativo, no righe
  const vEmpty = viewRange({ from: 100, to: 200 });
  ok(vEmpty.includes("no calls in the requested range"), "viewRange: range vuoto → header con range disponibile");
}

// ── viewRange: onestà su ciò che è USCITO dal ring (dropped) ──
{
  clearToolCallLog();
  for (let i = 0; i < 30; i++) { recordCall({ callId: "x" + i, name: "write_file", args: { path: "f" + i } }); recordResult({ callId: "x" + i, isError: false, text: "ok" }); }
  const st = ringStats();
  ok(st.buffered === 24 && st.totalSeen === 30 && st.dropped === 6 && st.minSeq === 7, "ringStats: 30 seen, 24 bufferizzate, 6 dropped, min #7");
  const v = viewRange({ count: 5 });
  ok(v.includes('dropped="6"') && v.includes("dropped(ring keeps last 24)"), "viewRange: dichiara ONESTAMENTE le 6 call uscite dal buffer (no silent-truncation)");
  // seq resettato da clearToolCallLog (isolamento sessione)
  clearToolCallLog();
  recordCall({ callId: "fresh", name: "ls", args: {} });
  ok(getRecent()[0].seq === 1, "seq: clearToolCallLog resetta la sequenza (isolamento sessione)");
}

// ── vuoto → header vuoto ──
{
  clearToolCallLog();
  ok(viewRange({ count: 5 }).includes('buffered="0"'), "viewRange: buffer vuoto → header buffered=0");
}

// ── seq-mirror (T2, msg 1342): recordCall RISPECCHIA il #seq dello store (rowid globale) invece del contatore interno ──
{
  clearToolCallLog();
  const s1 = recordCall({ callId: "a", name: "op1", args: {} });   // no seq → contatore interno = 1
  ok(s1 === 1 && getRecent(1)[0].seq === 1, "seq-mirror: senza seq → contatore interno (1) + ritorna il seq");
  const s2 = recordCall({ callId: "b", name: "op2", args: {}, seq: 105 }); // seq iniettato dallo store
  ok(s2 === 105 && getRecent(1)[0].seq === 105, "seq-mirror: seq iniettato → il ring usa QUEL seq (risolve il #N tra ring e store)");
  ok(ringStats().totalSeen >= 105, "seq-mirror: totalSeen si allinea al max seq visto (onestà anti-silent-truncation)");
  const s3 = recordCall({ callId: "c", name: "op3", args: {} });   // torna al contatore, ora ≥ 106
  ok(s3 === 106, "seq-mirror: dopo un seq iniettato il contatore riprende dal max (106), niente collisioni");
}

// ── renderCallRows (SSOT rendering, riusato dallo store) ──
{
  const rows = [{ seq: 7, name: "web", args: "q=x", status: "ok", result: "res", ts: 1000 }];
  const out = renderCallRows(rows, { withSeq: true });
  ok(/#7 /.test(out) && /\[ok\] web\(q=x\) → res/.test(out), "renderCallRows: riga con #seq + stato + args + esito");
  ok(renderCallRows([], {}) === "" && renderCallRows(null, {}) === "", "renderCallRows: input vuoto/null → ''");
}

console.log(`\ntool-call-log: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);

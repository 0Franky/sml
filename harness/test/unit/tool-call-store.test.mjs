/**
 * Test tool-call-store (node-puro, :memory:): la PERSISTENZA queryable delle tool-call (fix gap F28, msg 1342).
 * Copre append/setResult/range/recent/stats + la vista PULL `view` (store-backed) e — cruciale — lo scenario di
 * RECOVERY: 30 call registrate, le più vecchie NON sono più nel ring-24 ma restano recuperabili dallo store.
 * Questo è il test AL LIVELLO DEL WIRING (rule #14): senza lo store (solo ring) fallirebbe (le vecchie sono perse).
 */
import { ToolCallStore } from "../../src/tool-call-store.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const CID = "main";

// ── append / stats / seq monotono ────────────────────────────────────────────────────────────────
{
  const s = new ToolCallStore(":memory:");
  const s1 = s.append(CID, { callId: "a", name: "run_cmd", args: "cmd=ls", ts: 1000 });
  const s2 = s.append(CID, { callId: "b", name: "read_file", args: "path=x", ts: 1010 });
  ok(s1 >= 1 && s2 === s1 + 1, "APPEND: seq monotono crescente (rowid globale)");
  const st = s.stats(CID);
  ok(st.total === 2 && st.minSeq === s1 && st.maxSeq === s2, "STATS: total/min/max coerenti");
  ok(s.append(CID, { name: null }) === 0, "APPEND: name assente → 0 (skip)");
  s.close();
}

// ── setResult per callId + fallback all'ultima pending ────────────────────────────────────────────
{
  const s = new ToolCallStore(":memory:");
  s.append(CID, { callId: "a", name: "run_cmd", args: "cmd=ls", ts: 1 });
  s.append(CID, { callId: "b", name: "web", args: "q=x", ts: 2 });
  ok(s.setResult(CID, { callId: "a", isError: false, result: "file1 file2" }) === true, "SETRESULT: match per callId");
  const rowA = s.range(CID, 1, 2).find((r) => r.callId === "a");
  ok(rowA.status === "ok" && rowA.result === "file1 file2", "SETRESULT: status+result aggiornati sull'entry giusta");
  // callId sconosciuto → fallback all'ULTIMA pending (b)
  ok(s.setResult(CID, { callId: "zzz", isError: true, result: "boom" }) === true, "SETRESULT: callId ignoto → fallback pending");
  const rowB = s.range(CID, 1, 2).find((r) => r.callId === "b");
  ok(rowB.status === "error" && rowB.result === "boom", "SETRESULT: fallback ha aggiornato l'ultima pending (b) a error");
  // niente più pending → false
  ok(s.setResult(CID, { callId: "x", result: "y" }) === false, "SETRESULT: nessuna pending → false");
  s.close();
}

// ── range / recent (ordine crescente) ────────────────────────────────────────────────────────────
{
  const s = new ToolCallStore(":memory:");
  for (let i = 1; i <= 5; i++) s.append(CID, { callId: `c${i}`, name: `t${i}`, ts: i });
  const r = s.range(CID, 2, 4);
  ok(r.length === 3 && r[0].name === "t2" && r[2].name === "t4", "RANGE: [2,4] inclusivo in ordine crescente");
  ok(s.range(CID, 4, 2).length === 3, "RANGE: from/to invertiti → normalizzati");
  const rec = s.recent(CID, 2);
  ok(rec.length === 2 && rec[0].name === "t4" && rec[1].name === "t5", "RECENT: ultime 2 in ordine crescente");
  s.close();
}

// ── view: count / range / filtro memory-op / vuoto ────────────────────────────────────────────────
{
  const s = new ToolCallStore(":memory:");
  ok(/no tool calls recorded yet/.test(s.view(CID, {})), "VIEW: store vuoto → nota esplicita");
  s.append(CID, { callId: "a", name: "run_cmd", args: "cmd=ls", status: "ok", result: "ok", ts: 1 });
  s.append(CID, { callId: "n", name: "note", args: "text=ricorda", status: "ok", result: "", ts: 2 }); // memory-op
  s.append(CID, { callId: "b", name: "web", args: "q=x", status: "ok", result: "res", ts: 3 });
  const v = s.view(CID, { count: 8 });
  ok(/#1 /.test(v) && /run_cmd/.test(v) && /web/.test(v), "VIEW: mostra le call con #seq stabile");
  ok(!/note\(/.test(v), "VIEW: memory-op (note) escluse di default");
  ok(/note/.test(s.view(CID, { count: 8, includeMemoryOps: true })), "VIEW: include_memory_ops=true → note incluse");
  const vr = s.view(CID, { from: 3, to: 3 });
  ok(/web/.test(vr) && !/run_cmd/.test(vr), "VIEW: range #3..#3 → solo la call in range");
  s.close();
}

// ── ⭐ RECOVERY F28 (wiring-level, rule #14): 30 call → le vecchie escono dal ring-24 ma restano nello store ──
{
  const s = new ToolCallStore(":memory:");
  for (let i = 1; i <= 30; i++) s.append(CID, { callId: `k${i}`, name: `op${i}`, args: `i=${i}`, status: "ok", result: `r${i}`, ts: i });
  const st = s.stats(CID);
  ok(st.total === 30 && st.minSeq === 1 && st.maxSeq === 30, "RECOVERY: tutte le 30 persistite (il ring ne terrebbe solo 24)");
  // il modello chiede una call VECCHIA (#3), fuori dal ring → recuperata dallo store
  const old = s.view(CID, { from: 3, to: 3 });
  ok(/#3 /.test(old) && /op3\(/.test(old), "RECOVERY: la call #3 (uscita dal ring-24) è recuperata dallo store");
  // richiesta dell'intero storico
  const all = s.view(CID, { from: 1, to: 30 });
  ok(/op1\(/.test(all) && /op30\(/.test(all), "RECOVERY: l'intero storico #1..#30 è recuperabile (nessuna amnesia)");
  s.close();
}

// ── isolamento per conv_id ────────────────────────────────────────────────────────────────────────
{
  const s = new ToolCallStore(":memory:");
  s.append("convA", { name: "x", ts: 1 });
  s.append("convB", { name: "y", ts: 2 });
  ok(s.stats("convA").total === 1 && s.stats("convB").total === 1, "ISOLAMENTO: conv_id separa gli scope");
  ok(/x\(/.test(s.view("convA", {})) && !/y\(/.test(s.view("convA", {})), "ISOLAMENTO: view di convA non vede convB");
  s.close();
}

console.log(`tool-call-store test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

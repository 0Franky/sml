/**
 * Test scratchpad VOLATILE rolling (utente msg 1134, [[concepts/stuck-state-focus-protocol]] §3).
 * Copre: jot append + ordine newest-first, rolling store-cap (le vecchie spariscono), lane display-cap + marker,
 * recall on-demand oltre il cap, clear, SILENT (fuori da recent_changes/changelog), SEPARAZIONE da <facts>.
 * Deterministico: chiavi e `now` INIETTATI (nessun Date.now()/random nel puro).
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import {
  jotScratch, listScratch, pruneScratch, recallScratch, clearScratch,
  SCRATCH_NS, SCRATCH_STORE_CAP, DEFAULT_MAX_SCRATCH,
} from "../../src/scratch.mjs";
import { scratchLaneLines, factsLaneLines, assembleContext } from "../../src/context-assembler.mjs";

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; } else { failed++; console.error("  ✗ FAIL:", m); } }

const K = (i) => `k${String(i).padStart(2, "0")}`; // chiavi stabili per il tiebreak

// 1) jot append + newest-first ---------------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  jotScratch(vq, "primo passo", { key: K(0), now: 1000 });
  jotScratch(vq, "secondo passo", { key: K(1), now: 2000 });
  jotScratch(vq, "terzo passo", { key: K(2), now: 3000 });
  const all = listScratch(vq);
  ok(all.length === 3, "3 jot → 3 note");
  ok(all[0].text === "terzo passo" && all[2].text === "primo passo", "ordine newest-first");
  vq.close();
}

// 2) rolling store-cap: le più vecchie spariscono --------------------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  for (let i = 0; i < 5; i++) jotScratch(vq, `nota ${i}`, { key: K(i), now: 1000 + i, storeCap: 3 });
  const all = listScratch(vq);
  ok(all.length === 3, "storeCap=3 → tenute solo 3 (rolling)");
  ok(all[0].text === "nota 4" && all[2].text === "nota 2", "tenute le 3 PIÙ RECENTI (2,3,4), potate 0,1");
  vq.close();
}

// 3) pruneScratch diretto --------------------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  for (let i = 0; i < 6; i++) jotScratch(vq, `n${i}`, { key: K(i), now: 1000 + i, storeCap: 100 }); // no prune in jot
  ok(listScratch(vq).length === 6, "6 note senza prune");
  const removed = pruneScratch(vq, { storeCap: 4 });
  ok(removed === 2 && listScratch(vq).length === 4, "pruneScratch(4) → rimosse 2, restano 4");
  vq.close();
}

// 4) scratchLaneLines: display-cap + marker "+N older" ---------------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  for (let i = 0; i < 8; i++) jotScratch(vq, `step ${i}`, { key: K(i), now: 1000 + i, storeCap: 100 });
  const lines = scratchLaneLines(vq, { maxScratch: 6 });
  ok(lines[0] === "  <scratch>" && lines[lines.length - 1] === "  </scratch>", "lane ben formata");
  const shown = lines.filter((l) => l.trim().startsWith("- step "));
  ok(shown.length === 6, "mostra 6 (display-cap)");
  ok(shown[0].includes("step 7"), "la prima mostrata è la più recente (step 7)");
  ok(lines.some((l) => l.includes("+2 older")), "marker '+2 older' presente (non scarta in silenzio)");
  vq.close();
}

// 4b) scratchLaneLines: shift [+Xs] con sessionStartMs (AS1 — ancoraggio temporale #13 esteso alla zona VOLATILE) -----
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  jotScratch(vq, "investigare timeout", { key: K(0), now: 5000, storeCap: 100 });
  const withShift = scratchLaneLines(vq, { sessionStartMs: 1000 }); // 5000 - 1000 = 4s
  ok(withShift.some((l) => l.includes("[+4s] investigare timeout")), "AS1: sessionStartMs → shift [+4s] sulla nota scratch");
  const noShift = scratchLaneLines(vq, {}); // senza sessionStartMs → degrada, nessun prefisso
  ok(noShift.some((l) => l.includes("- investigare timeout") && !/\[\+/.test(l)), "AS1: senza sessionStartMs → nessun prefisso (retro-compat callers/test)");
  vq.close();
}

// 5) scratchLaneLines vuoto → [] -------------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  ok(scratchLaneLines(vq).length === 0, "nessuna nota → lane []");
  vq.close();
}

// 6) recallScratch: allunga la finestra oltre il display-cap ---------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  for (let i = 0; i < 10; i++) jotScratch(vq, `r${i}`, { key: K(i), now: 1000 + i, storeCap: 100 });
  ok(recallScratch(vq, { limit: 20 }).length === 10, "recall(20) → tutte le 10");
  ok(recallScratch(vq, { limit: 3 }).length === 3, "recall(3) → 3 più recenti");
  ok(recallScratch(vq, { limit: 3 })[0].text === "r9", "recall newest-first");
  vq.close();
}

// 7) clearScratch --------------------------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  for (let i = 0; i < 4; i++) jotScratch(vq, `c${i}`, { key: K(i), now: 1000 + i });
  const n = clearScratch(vq);
  ok(n === 4 && listScratch(vq).length === 0, "clear → svuota tutto");
  vq.close();
}

// 8) jot text vuoto → throw ------------------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  let threw = false;
  try { jotScratch(vq, "   ", { key: K(0) }); } catch { threw = true; }
  ok(threw, "jot testo vuoto → errore");
  vq.close();
}

// 9) SILENT: scratch fuori da recent_changes/changelog (default esclude i silent) -------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  jotScratch(vq, "indagine helper _dur", { key: K(0), now: 1000 });
  const log = vq.getChangeLog({}); // default esclude silent
  ok(!log.some((c) => String(c.entity_id).startsWith("scratch:")), "scratch NON nel changelog non-silent (namespace SILENT)");
  const ctx = assembleContext(vq, { now: 2000 });
  ok(!ctx.includes("recent_changes") || !/recent_changes[\s\S]*scratch:/.test(ctx), "scratch NON in <recent_changes>");
  ok(ctx.includes("<scratch>") && ctx.includes("indagine helper _dur"), "MA presente nella lane <scratch> dedicata");
  vq.close();
}

// 10) SEPARAZIONE da <facts>: note e jot non si mescolano ------------------------------------------
{
  const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
  vq.setVar("fact:pref", { text: "durable pref", importance: 0 }, { namespace: "fact", scope: "private" });
  jotScratch(vq, "volatile note", { key: K(0), now: 1000 });
  const scratch = listScratch(vq);
  const facts = factsLaneLines(vq);
  ok(scratch.length === 1 && scratch[0].text === "volatile note", "<scratch> ha SOLO la nota volatile");
  ok(facts.some((l) => l.includes("durable pref")) && !facts.some((l) => l.includes("volatile note")), "<facts> ha SOLO il fatto durevole (nessuna contaminazione)");
  ok(SCRATCH_NS === "scratch" && SCRATCH_STORE_CAP > DEFAULT_MAX_SCRATCH, "costanti SSOT coerenti (store-cap > display-cap)");
  vq.close();
}

console.log(`\nscratch test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

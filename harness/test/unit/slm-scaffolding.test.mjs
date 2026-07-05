/**
 * Test di slm-scaffolding (ADR 2026-07-05 estensione slm): livelli full/lean/off dello scaffolding <how_memory_works>.
 * Garanzie: (1) "full" NON-breaking (contiene il testo storico load-bearing); (2) "lean" snello (senza la parte
 * "primo messaggio"/BAD-GOOD, utente msg 1067) ma tiene l'essenziale; (3) "off" tutto vuoto; (4) default config = "full".
 */
import { buildMemoryScaffolding } from "../../src/slm-scaffolding.mjs";
import { DEFAULT_HARNESS_CONFIG, loadHarnessConfig } from "../../src/harness-config.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const OPTS = { toolGating: "gated", discoverableCats: "web, files" };

// 1) full = testo storico completo (non-breaking) --------------------------------------------------
{
  const { awareness, tail, resources } = buildMemoryScaffolding("full", OPTS);
  ok(awareness.startsWith("<how_memory_works"), "FULL: awareness apre con <how_memory_works");
  ok(awareness.includes('Do NOT say "this is your first message"'), "FULL: contiene l'anti-amnesia checklist");
  ok(awareness.includes("BAD:") && awareness.includes("GOOD:"), "FULL: contiene gli esempi BAD/GOOD");
  ok(tail.includes("read this right before you answer"), "FULL: tail = reminder completo");
  ok(resources.includes("where your memory lives"), "FULL: resources presente");
  ok(resources.includes("find_tool"), "FULL: resources include find_tool (toolGating=gated)");
}

// 2) lean = snello, essenziale, senza hand-holding -------------------------------------------------
{
  const full = buildMemoryScaffolding("full", OPTS);
  const { awareness, tail, resources } = buildMemoryScaffolding("lean", OPTS);
  ok(awareness.startsWith("<how_memory_works"), "LEAN: awareness apre con <how_memory_works");
  ok(!awareness.includes('Do NOT say "this is your first message"'), "LEAN: NIENTE 'first message' hand-holding (msg 1067)");
  ok(!awareness.includes("BAD:"), "LEAN: niente esempi BAD/GOOD");
  ok(awareness.length < full.awareness.length / 2, "LEAN: awareness < metà del full (davvero snello)");
  // essenziale load-bearing preservato
  ok(/messages_with_user/.test(awareness) && /\[\+Xs\]/.test(awareness), "LEAN: tiene lane=memoria + timeline [+Xs]");
  ok(/note\(|set_var/.test(awareness) && /never invent/i.test(awareness), "LEAN: tiene save-before-scroll + no-invent");
  ok(tail.includes("<reminder>") && tail.length < full.tail.length, "LEAN: tail più corto");
  ok(resources.includes("where your memory lives"), "LEAN: resources invariata (mappa fattuale)");
}

// 3) off = tutto vuoto -----------------------------------------------------------------------------
{
  const { awareness, tail, resources } = buildMemoryScaffolding("off", OPTS);
  ok(awareness === "" && tail === "" && resources === "", "OFF: awareness/tail/resources tutti vuoti");
}

// 4) toolGating off → niente riga find_tool nelle resources ----------------------------------------
{
  const { resources } = buildMemoryScaffolding("full", { toolGating: "off", discoverableCats: "web" });
  ok(resources.includes("where your memory lives") && !resources.includes("find_tool"), "TOOLGATING off: resources senza find_tool");
}

// 5) default config = full (non-breaking) + env/file override ---------------------------------------
{
  const NOPATH = "/no/such/harness.config.json";
  ok(DEFAULT_HARNESS_CONFIG.laneMemoryHintLevel === "full", "CONFIG: default laneMemoryHintLevel = 'full'");
  const cfg = loadHarnessConfig(NOPATH, { env: {} });
  ok(cfg.laneMemoryHintLevel === "full", "CONFIG: loadHarnessConfig default = 'full'");
  const leaned = loadHarnessConfig(NOPATH, { env: { HARNESS_LANE_MEMORY_HINT_LEVEL: "lean" } });
  ok(leaned.laneMemoryHintLevel === "lean", "CONFIG: env HARNESS_LANE_MEMORY_HINT_LEVEL=lean override");
  const bad = loadHarnessConfig(NOPATH, { env: { HARNESS_LANE_MEMORY_HINT_LEVEL: "garbage" } });
  ok(bad.laneMemoryHintLevel === "full", "CONFIG: valore invalido → resta 'full' (clamp)");
}

console.log(`\nslm-scaffolding test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

/**
 * Test keepTurns model-controlled (utente msg 1062). Copre: default quando nessun override, set/clamp/cap, reset,
 * round-trip via meta, fail-safe su valori sporchi. Il default reale viene dalla config (SSOT nativeKeepTurns).
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import { getEffectiveKeepTurns, setKeepTurnsOverride, KEEPTURNS_MAX } from "../../src/keepturns.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; } else { failed++; console.error("  ✗ FAIL:", m); } }

const DEF = loadHarnessConfig().nativeKeepTurns; // SSOT — niente literal duplicato (regola #16)

// 1) nessun override → default config -------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  ok(getEffectiveKeepTurns(vq) === DEF, `no-override → default config (${DEF})`);
  vq.close();
}

// 2) set valido → persiste + effettivo -------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  const r = setKeepTurnsOverride(vq, 10);
  ok(r.effective === 10 && r.overridden === true && r.def === DEF, "set(10) → effective 10, overridden, def esposto");
  ok(getEffectiveKeepTurns(vq) === 10, "override 10 letto da un nuovo getEffective (round-trip via meta)");
  vq.close();
}

// 3) clamp al MAX ----------------------------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  const r = setKeepTurnsOverride(vq, 999);
  ok(r.effective === KEEPTURNS_MAX, `set(999) → clampato a MAX (${KEEPTURNS_MAX})`);
  ok(getEffectiveKeepTurns(vq) === KEEPTURNS_MAX, "getEffective rispetta il cap MAX anche a lettura");
  vq.close();
}

// 4) reset: n<1 / 0 / null → rimuove override (torna al default) -----------------------------------
{
  const vq = new VarsQueue(":memory:");
  setKeepTurnsOverride(vq, 12);
  const r = setKeepTurnsOverride(vq, 0);
  ok(r.overridden === false && r.effective === DEF, "set(0) → reset al default, overridden=false");
  ok(getEffectiveKeepTurns(vq) === DEF, "dopo reset getEffective torna al default");
  const r2 = setKeepTurnsOverride(vq, null);
  ok(r2.overridden === false && r2.effective === DEF, "set(null) → reset al default");
  vq.close();
}

// 5) fail-safe: valori sporchi nel meta → default (non crasha) -------------------------------------
{
  const vq = new VarsQueue(":memory:");
  vq.setMeta("keepturns_override", "garbage");
  ok(getEffectiveKeepTurns(vq) === DEF, "meta='garbage' → fail-safe al default");
  vq.setMeta("keepturns_override", "-5");
  ok(getEffectiveKeepTurns(vq) === DEF, "meta='-5' (<1) → fail-safe al default");
  ok(getEffectiveKeepTurns(null) === DEF, "vq null → fail-safe al default (nessun throw)");
  vq.close();
}

// 6) configDefault esplicito rispettato ------------------------------------------------------------
{
  const vq = new VarsQueue(":memory:");
  ok(getEffectiveKeepTurns(vq, 3) === 3, "configDefault esplicito=3 usato quando nessun override");
  setKeepTurnsOverride(vq, 7);
  ok(getEffectiveKeepTurns(vq, 3) === 7, "override vince sul configDefault esplicito");
  vq.close();
}

console.log(`\nkeepturns test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

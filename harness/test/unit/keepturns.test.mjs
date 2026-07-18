/**
 * Test keepTurns model-controlled (utente msg 1062). Copre: default quando nessun override, set/clamp/cap, reset,
 * round-trip via meta, fail-safe su valori sporchi. Il default reale viene dalla config (SSOT nativeKeepTurns).
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import { getEffectiveKeepTurns, setKeepTurnsOverride, KEEPTURNS_MAX, adaptiveKeepTurns, effectiveKeepForTurn } from "../../src/keepturns.mjs";
import { EFFECTIVE_KEEP_META } from "../../src/meta-keys.mjs";
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

// 7) adaptiveKeepTurns (utente msg 1434 + cap E16 msg 1448): fill<soglia → highKeep CAPPATO; fill≥soglia → lowKeep --------
{
  const cfg = { lowThreshold: 0.5, highKeep: 9999 }; // safetyPct/avgTurnTokens → default 0.8 / 2000
  const LOW = 6;
  // cap su finestra 100K = floor(0.8·100000/2000) = 40 → highKeep effettivo = min(9999, 40) = 40
  ok(adaptiveKeepTurns({ tokens: 1000, contextWindow: 100000 }, cfg, LOW) === 40, "adaptive: fill 1% < soglia → highKeep CAPPATO alla finestra (40)");
  ok(adaptiveKeepTurns({ tokens: 60000, contextWindow: 100000 }, cfg, LOW) === LOW, "adaptive: fill 60% ≥ soglia → lowKeep (compresso)");
  ok(adaptiveKeepTurns({ tokens: 50000, contextWindow: 100000 }, cfg, LOW) === LOW, "adaptive: fill == soglia (50%) → lowKeep (>=)");
  // fail-safe SENZA finestra nota → highKeep pieno (no cap derivabile)
  ok(adaptiveKeepTurns(undefined, cfg, LOW) === 9999, "adaptive: usage undefined → highKeep (fail-safe, no finestra)");
  ok(adaptiveKeepTurns({ tokens: 5000, contextWindow: null }, cfg, LOW) === 9999, "adaptive: contextWindow null → highKeep (no cap)");
  ok(adaptiveKeepTurns({ tokens: 5000, contextWindow: 0 }, cfg, LOW) === 9999, "adaptive: contextWindow 0 → highKeep (no div0)");
  // finestra nota ma tokens non-finito (primi turni) → vanilla CAPPATO (non highKeep pieno)
  ok(adaptiveKeepTurns({ tokens: null, contextWindow: 100000 }, cfg, LOW) === 40, "adaptive: tokens null + finestra → highKeep CAPPATO (40)");
  // outputReservePct: riserva riduce il denom → il fill effettivo sale → si comprime prima
  ok(adaptiveKeepTurns({ tokens: 30000, contextWindow: 100000 }, cfg, LOW, 0.5) === LOW, "adaptive: reserve 0.5 → 30%/(50%)=60% ≥ soglia → lowKeep");
  ok(adaptiveKeepTurns({ tokens: 30000, contextWindow: 100000 }, cfg, LOW, 0) === 40, "adaptive: reserve 0 → 30% < soglia → highKeep CAPPATO (40)");
}

// 7b) CAP anti-stallo (fix E16, msg 1448): il regime vanilla non supera safetyPct della finestra FISICA + configurabile
{
  const LOW = 6;
  const cfg = { lowThreshold: 0.5, highKeep: 9999 };
  // finestra PICCOLA (16384 = il caso 9B che si BLOCCAVA): cap = floor(0.8·16384/2000) = 6 → effHigh = min(9999,6) = 6 = LOW
  //   → l'adaptive degrada a "sempre compresso" (SAFE, niente stallo)
  ok(adaptiveKeepTurns({ tokens: 100, contextWindow: 16384 }, cfg, LOW) === LOW, "cap: finestra piccola (16K) → highKeep cappato a LOW (no stallo)");
  // finestra GRANDE (1M): cap = floor(0.8·1e6/2000) = 400 → effHigh = min(9999,400) = 400 (vanilla ampio)
  ok(adaptiveKeepTurns({ tokens: 100, contextWindow: 1000000 }, cfg, LOW) === 400, "cap: finestra grande (1M) → highKeep cappato a 400 (vanilla ampio)");
  // safetyPct/avgTurnTokens CONFIGURABILI: avgTurn più alto → cap più basso → floor(0.5·100000/5000)=10
  ok(adaptiveKeepTurns({ tokens: 100, contextWindow: 100000 }, { lowThreshold: 0.5, highKeep: 9999, safetyPct: 0.5, avgTurnTokens: 5000 }, LOW) === 10,
     "cap: configurabile (safetyPct 0.5, avgTurn 5000, win 100K) → 10");
  // cap non scende MAI sotto lowKeep: floor(0.8·4000/2000)=1 < LOW → cap = LOW
  ok(adaptiveKeepTurns({ tokens: 100, contextWindow: 4000 }, cfg, LOW) === LOW, "cap: floor→1 < LOW → cap = LOW (mai sotto lowKeep)");
  // highKeep esplicito PIÙ BASSO del cap vince (min): highKeep=10, cap=400 → 10
  ok(adaptiveKeepTurns({ tokens: 100, contextWindow: 1000000 }, { lowThreshold: 0.5, highKeep: 10 }, LOW) === 10, "cap: highKeep(10) < cap(400) → min = 10");
}

// 7c) ISTERESI (fix oscillazione, 2026-07-09): banda [lowThreshold-hysteresis, lowThreshold] in cui si RESTA nel regime
// precedente (dato da prevKeep) → niente flip-flop vanilla↔compresso attorno alla soglia.
{
  const LOW = 6;
  const cfg = { lowThreshold: 0.5, highKeep: 9999, hysteresis: 0.1 }; // banda [0.4,0.5]; su 100K effHigh=floor(0.8·100000/2000)=40
  const U = (fill) => ({ tokens: fill * 100000, contextWindow: 100000 });
  // da VANILLA (prevKeep=40): comprime SOLO al bordo alto (fill≥0.5)
  ok(adaptiveKeepTurns(U(0.45), cfg, LOW, 0, 40) === 40, "isteresi: da vanilla, fill 0.45 (<0.5) → resta vanilla");
  ok(adaptiveKeepTurns(U(0.50), cfg, LOW, 0, 40) === LOW, "isteresi: da vanilla, fill 0.50 → comprime (bordo alto)");
  // da COMPRESSO (prevKeep=6): resta compresso finché fill NON scende sotto il bordo basso (0.5-0.1=0.4)
  ok(adaptiveKeepTurns(U(0.45), cfg, LOW, 0, LOW) === LOW, "isteresi: da compresso, fill 0.45 (banda) → RESTA compresso (anti flip-flop)");
  ok(adaptiveKeepTurns(U(0.41), cfg, LOW, 0, LOW) === LOW, "isteresi: da compresso, fill 0.41 (banda) → resta compresso");
  ok(adaptiveKeepTurns(U(0.39), cfg, LOW, 0, LOW) === 40, "isteresi: da compresso, fill 0.39 (<0.4) → torna vanilla (bordo basso)");
  // primo turno (prevKeep null) → comportamento istantaneo (nessuna storia)
  ok(adaptiveKeepTurns(U(0.45), cfg, LOW, 0, null) === 40, "isteresi: primo turno (prevKeep null) → istantaneo (0.45<0.5 → vanilla)");
  // hysteresis=0 / assente (retro-compat): istantaneo anche con prevKeep
  ok(adaptiveKeepTurns(U(0.45), { lowThreshold: 0.5, highKeep: 9999 }, LOW, 0, LOW) === 40, "isteresi: band assente → istantaneo (ignora prevKeep)");
  ok(adaptiveKeepTurns(U(0.45), { lowThreshold: 0.5, highKeep: 9999, hysteresis: 0 }, LOW, 0, LOW) === 40, "isteresi: band=0 → istantaneo");
}

// 8) integrazione adaptive × override-modello: l'override esplicito VINCE sull'adattivo -------------
{
  const vq = new VarsQueue(":memory:");
  const cfg = { lowThreshold: 0.5, highKeep: 9999 };
  const adKeep = adaptiveKeepTurns({ tokens: 1000, contextWindow: 100000 }, cfg, 6); // fill basso → 40 (cappato alla finestra)
  ok(getEffectiveKeepTurns(vq, adKeep) === 40, "adaptive×override: nessun override → usa il default adattivo cappato (40)");
  setKeepTurnsOverride(vq, 8);
  ok(getEffectiveKeepTurns(vq, adKeep) === 8, "adaptive×override: override modello (8) VINCE sull'adattivo (default)");
  vq.close();
}

// AS7 (audit-B, #16 SSOT): un cfg PARZIALE senza safetyPct/avgTurnTokens deve usare i default SSOT importati (cap identico al cfg completo) --------
{
  const win = 16384, LOW = 6;
  const usage = { tokens: 0, contextWindow: win };
  const full = adaptiveKeepTurns(usage, { lowThreshold: 0.5, highKeep: 9999, safetyPct: 0.8, avgTurnTokens: 2000 }, LOW);
  const partial = adaptiveKeepTurns(usage, { lowThreshold: 0.5, highKeep: 9999 }, LOW); // ← senza safetyPct/avgTurnTokens
  ok(full === partial, `AS7: cfg parziale usa i default SSOT, non literal (cap: full=${full} partial=${partial})`);
}

// AS4/AS5 — effectiveKeepForTurn: SSOT del keep condiviso (context-assembly + eviction-checkpoint) ---------
{
  const vq = new VarsQueue(":memory:");
  const CID = "sess-1783000000000-startup";
  ok(effectiveKeepForTurn(vq, CID, 6) === 6, "effKeepForTurn: no override + no meta pubblicato → configDefault (6)");
  vq.setMeta(EFFECTIVE_KEEP_META + CID, "40"); // native-window pubblica il keep adaptive del turno
  ok(effectiveKeepForTurn(vq, CID, 6) === 40, "effKeepForTurn: meta pubblicato 40 (adaptive), no override → 40 (allinea lane/eviction)");
  setKeepTurnsOverride(vq, 3); // il modello si restringe la finestra a runtime
  ok(effectiveKeepForTurn(vq, CID, 6) === 3, "effKeepForTurn: override set_keepturns (3) VINCE sul meta pubblicato (40)");
  ok(effectiveKeepForTurn(vq, "sess-OTHER", 6) === 3, "effKeepForTurn: override è session-global → vale anche per altri convId");
  setKeepTurnsOverride(vq, 0); // rimuove l'override
  ok(effectiveKeepForTurn(vq, "sess-OTHER", 6) === 6, "effKeepForTurn: senza override + convId senza meta → configDefault (isolamento per-conv)");
  ok(effectiveKeepForTurn(vq, CID, 6) === 40, "effKeepForTurn: rimosso l'override, CID torna al meta pubblicato (40)");
  vq.close();
}

console.log(`\nkeepturns test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

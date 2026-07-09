/**
 * Wiring-test (rule #14) della modalità ADAPTIVE-CONTEXT (utente msg 1434). Replica la CATENA che l'hook `context` di
 * native-window.ts esegue davvero — usage (getContextUsage) → adaptiveKeepTurns → getEffectiveKeepTurns(override) →
 * windowNativeMessages — con windowNativeMessages REALE (non la sola funzione pura). Blinda:
 *   - fill BASSO → keep=highKeep → NIENTE finestratura (regime VANILLA: il modello vede TUTTI i turni nell'array nativo);
 *   - fill ALTO → keep=lowKeep → array finestrato agli ultimi K turni (regime compresso, le lane subentrano);
 *   - fill che CRESCE → i turni visibili SCENDONO (transizione vanilla→compresso);
 *   - override esplicito del modello (set_keepturns) VINCE anche in adaptive.
 * Il pezzo pi (getContextUsage disponibile nell'hook `context`) è verificato per lettura dei tipi:
 *   dist/core/extensions/types.d.ts:812 `ExtensionHandler = (event, ctx) => ...`; :827 `on("context", handler)` → ctx
 *   (ExtensionContext.getContextUsage(), :236) È passato all'handler. La validazione E2E con OVERFLOW reale è il passo
 *   "provala e misura" (la modalità è opt-in, DEFAULT OFF).
 */
import { windowNativeMessages } from "../../src/conversation-store.mjs";
import { adaptiveKeepTurns, getEffectiveKeepTurns, setKeepTurnsOverride } from "../../src/keepturns.mjs";
import { VarsQueue } from "../../src/vars-queue.mjs";

let passed = 0, failed = 0;
const ok = (c, m) => { if (c) passed++; else { failed++; console.error("  ✗ " + m); } };

/** N turni-utente (ognuno con la sua risposta assistant) — simula una conversazione accumulata. */
function makeNative(nTurns) {
  const msgs = [];
  for (let i = 1; i <= nTurns; i++) { msgs.push({ role: "user", content: `turno utente ${i}` }); msgs.push({ role: "assistant", content: `risposta ${i}` }); }
  return msgs;
}
const userTurns = (arr) => arr.filter((m) => m.role === "user" && typeof m.content === "string").length;

const ADAPTIVE = { lowThreshold: 0.5, highKeep: 9999 };
const LOW = 6; // = nativeKeepTurns (regime compresso)

/** La funzione che l'hook `context` esegue (branch adaptive), estratta 1:1. */
function hookKeep(vq, usage) {
  const adaptiveKeep = adaptiveKeepTurns(usage, ADAPTIVE, LOW, 0);
  return getEffectiveKeepTurns(vq, adaptiveKeep); // l'override del modello vince su questo default
}

// FILL BASSO (inizio sessione): 5% → highKeep → tutti gli 8 turni restano (regime VANILLA)
{
  const vq = new VarsQueue(":memory:");
  const native = makeNative(8);
  const keep = hookKeep(vq, { tokens: 5000, contextWindow: 100000 });
  const windowed = windowNativeMessages(native, { keepTurns: keep });
  ok(keep === 40, "fill basso → keep=highKeep CAPPATO alla finestra (40 su 100K)"); // cap E16: floor(0.8·100000/2000)
  ok(userTurns(windowed) === 8, "fill basso → TUTTI gli 8 turni-utente restano nell'array nativo (cap 40 > 8, regime vanilla)");
  vq.close();
}

// FILL ALTO (overflow): 60% → lowKeep(6) → array finestrato agli ultimi 6 turni (regime compresso)
{
  const vq = new VarsQueue(":memory:");
  const native = makeNative(8);
  const keep = hookKeep(vq, { tokens: 60000, contextWindow: 100000 });
  const windowed = windowNativeMessages(native, { keepTurns: keep });
  ok(keep === LOW, "fill alto → keep=lowKeep (compresso)");
  ok(userTurns(windowed) === LOW, "fill alto → array nativo finestrato agli ultimi 6 turni-utente (le lane subentrano)");
  vq.close();
}

// TRANSIZIONE: stesso native, fill che cresce → i turni visibili SCENDONO (vanilla → compresso)
{
  const vq = new VarsQueue(":memory:");
  const native = makeNative(8);
  const lowFill = userTurns(windowNativeMessages(native, { keepTurns: hookKeep(vq, { tokens: 5000, contextWindow: 100000 }) }));
  const highFill = userTurns(windowNativeMessages(native, { keepTurns: hookKeep(vq, { tokens: 80000, contextWindow: 100000 }) }));
  ok(lowFill === 8 && highFill === LOW && highFill < lowFill, `transizione: fill↑ → turni visibili↓ (${lowFill}→${highFill})`);
  vq.close();
}

// OVERRIDE del modello VINCE anche in adaptive: set_keepturns(3) → 3 turni, ignora l'adattivo
{
  const vq = new VarsQueue(":memory:");
  setKeepTurnsOverride(vq, 3);
  const native = makeNative(8);
  const keep = hookKeep(vq, { tokens: 5000, contextWindow: 100000 }); // fill basso vorrebbe 9999
  const windowed = windowNativeMessages(native, { keepTurns: keep });
  ok(keep === 3, "override modello (3) VINCE sull'adattivo anche a fill basso");
  ok(userTurns(windowed) === 3, "override → array finestrato a 3 turni (intento esplicito del modello rispettato)");
  vq.close();
}

// CAP anti-stallo (fix E16, msg 1448 — REGRESSION del finding "il 9B/num_ctx=16384 si BLOCCA in adaptive-ON"): finestra
// PICCOLA + fill basso → keep degrada a LOW (non highKeep=9999) → l'array nativo NON cresce oltre la finestra fisica →
// niente stallo. PRIMA del cap: keep=9999 → array illimitato su una finestra da 16K → Ollama si bloccava (E16).
{
  const vq = new VarsQueue(":memory:");
  const native = makeNative(50);                                     // conversazione lunga (accumulo reale)
  const keep = hookKeep(vq, { tokens: 2000, contextWindow: 16384 }); // fill basso MA finestra piccola (il caso 9B)
  const windowed = windowNativeMessages(native, { keepTurns: keep });
  ok(keep === LOW, "cap-regression: finestra 16K + fill basso → keep degrada a LOW (no highKeep illimitato)");
  ok(userTurns(windowed) === LOW, "cap-regression: array finestrato a LOW anche a fill basso → non supera la finestra fisica (no stallo 9B)");
  vq.close();
}

// ISTERESI wiring (fix oscillazione, 2026-07-09) — REGRESSION: simula la SEQUENZA reale di fill che oscilla attorno alla
// soglia, con prevKeep threaded ESATTAMENTE come fa native-window.ts (ricorda l'adaptiveKeep del turno precedente). Con
// l'isteresi il regime NON deve flip-floppare nella banda; SENZA (band=0) flip-floppa (dimostra cosa il fix elimina).
{
  const cfgH = { lowThreshold: 0.5, highKeep: 9999, hysteresis: 0.1 }; // banda [0.4,0.5]; su 100K effHigh=40
  const cfg0 = { lowThreshold: 0.5, highKeep: 9999 };                  // no isteresi
  const seq = [0.30, 0.48, 0.52, 0.45, 0.43, 0.47, 0.38, 0.44];        // fill che oscilla attorno a 0.5
  const runSeq = (cfg) => { let prev = null; const ks = []; for (const f of seq) { const k = adaptiveKeepTurns({ tokens: f * 100000, contextWindow: 100000 }, cfg, LOW, 0, prev); prev = k; ks.push(k); } return ks; };
  const withH = runSeq(cfgH);
  const noH = runSeq(cfg0);
  // CON isteresi: 40,40 (vanilla<0.5) → 6 (0.52 comprime) → 6,6,6 (banda, RESTA compresso) → 40 (0.38<0.4 torna) → 40
  ok(JSON.stringify(withH) === JSON.stringify([40, 40, 6, 6, 6, 6, 40, 40]), `isteresi wiring: nessun flip-flop nella banda (${withH.join(",")})`);
  // SENZA isteresi: il 0.45 dopo il 0.52 torna SUBITO vanilla (40) → flip-flop 6→40 (il difetto che il fix elimina).
  // In una sessione reale la de-compressione a 0.45 rifà crescere l'array → risupera 0.5 → ricomprime → oscilla.
  ok(JSON.stringify(noH) === JSON.stringify([40, 40, 6, 40, 40, 40, 40, 40]), `no-isteresi: flip-flop 6→40 presente (${noH.join(",")})`);
  // il punto DISCRIMINANTE: a fill 0.45 (idx 3, appena dopo la compressione) l'isteresi RESTA compressa, il no-isteresi rimbalza a vanilla
  ok(withH[3] === 6 && noH[3] === 40, "isteresi: al primo fill nella banda dopo la compressione → resta compresso (vs rimbalzo senza)");
}

console.log(`\nadaptive-context-wiring: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

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
  ok(keep === 9999, "fill basso → keep=highKeep (vanilla)");
  ok(userTurns(windowed) === 8, "fill basso → TUTTI gli 8 turni-utente restano nell'array nativo (regime vanilla)");
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

console.log(`\nadaptive-context-wiring: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

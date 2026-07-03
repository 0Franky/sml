/**
 * harness-attach — LOGPOINT/breakpoint a runtime sull'harness pi VIVO, via Chrome DevTools Protocol (idea utente
 * msg 914, 2026-07-04: "attiva i break point sull'harness così se ti dico un problema ne metti uno, ispezioni il
 * codice e lavori più agevole"). Zero dipendenze: usa i global `WebSocket` + `fetch` di node ≥22.
 *
 * COS'È: si aggancia all'inspector di una pi lanciata con --inspect (npm run tui:debug), piazza un breakpoint su
 * file:riga, e a OGNI hit valuta le espressioni che gli passi sul call-frame corrente, le stampa, e fa AUTO-RESUME.
 * = "logpoint": la pausa è di millisecondi → invisibile alla TUI (il 9B locale fa 30-40s/turno). Dà i VALORI VERI
 * dentro le funzioni a runtime, senza editare il codice e rilanciare.
 *
 *   Tier 0  turn-trace.ts ......... cosa RICEVE il modello
 *   Tier 2  harness-inspect.mjs ... STATO persistito nei DB (read-only)
 *   Tier 3  harness-attach.mjs .... VALORI dentro le funzioni .mjs a runtime (questo file)
 *
 * ⚠️ CAVEAT (jiti): le estensioni .ts sono compilate in memoria da jiti → il loro URL/le righe NON combaciano
 *    con setBreakpointByUrl. Metti i breakpoint sui file .mjs (src/*.mjs) — JS puro, righe reali, match pulito.
 *    Per la logica di un'estensione .ts, o guardi il confine (turn-trace) o metti il logpoint nella .mjs che chiama.
 * ⚠️ Un solo client CDP per volta (se hai DevTools/VSCode agganciati, stacca).
 *
 * USO (pi lanciata con `npm run tui:debug`):
 *   node tools/harness-attach.mjs --at src/conversation-store.mjs:120 --dump "convId, n, this.count(convId)"
 *   node tools/harness-attach.mjs --at src/session-context.mjs:20 --dump "_convId" --hits 5
 *   node tools/harness-attach.mjs --eval "process.memoryUsage().rss"          # valuta un'espressione globale e esce
 * Opzioni: --at <suffisso-path>:<riga>  --dump "<expr>,<expr>"  --hits N(=3)  --port 9229  --json
 */
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const PORT = parseInt(opt("--port", "9229"), 10) || 9229;
const AT = opt("--at", null);          // es. "src/conversation-store.mjs:120"
const DUMP = opt("--dump", "");         // espressioni separate da virgola, valutate sul call-frame
const EVAL = opt("--eval", null);       // one-shot: valuta un'espressione globale ed esce
const HITS = Math.max(1, parseInt(opt("--hits", "3"), 10) || 3);
const AS_JSON = argv.includes("--json");

let redactText = null;
try { ({ redactText } = await import("../src/secrets-redact.mjs")); } catch { /* no redaction */ }
const mask = (s) => { const t = String(s ?? ""); if (!redactText) return t; try { return redactText(t, [], { staticPatterns: true }).redacted; } catch { return t; } };

// --- client CDP minimale su WebSocket global ---
class CDP {
  constructor(ws) {
    this.ws = ws; this._id = 0; this.pending = new Map(); this.handlers = [];
    ws.addEventListener("message", (ev) => {
      let m; try { m = JSON.parse(typeof ev.data === "string" ? ev.data : ev.data.toString()); } catch { return; }
      if (m.id != null && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? reject(new Error(m.error.message || JSON.stringify(m.error))) : resolve(m.result);
      } else if (m.method) { for (const h of this.handlers) h(m); }
    });
  }
  send(method, params = {}) {
    const id = ++this._id;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  on(fn) { this.handlers.push(fn); }
}

async function pickTarget(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const list = await res.json();
  const t = list.find((x) => x.webSocketDebuggerUrl);
  if (!t) throw new Error("nessun target inspector con webSocketDebuggerUrl");
  return t;
}
function openWS(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener("open", () => resolve(ws), { once: true });
    ws.addEventListener("error", (e) => reject(new Error("WS error: " + (e.message || "connessione fallita"))), { once: true });
  });
}
// urlRegex robusto dal suffisso-path (normalizza \ → /, escape regex, ancora a fine URL)
function urlRegexFrom(suffix) {
  const norm = suffix.replace(/\\/g, "/").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return norm + "$";
}

(async () => {
  let target;
  try { target = await pickTarget(PORT); }
  catch (e) {
    console.error(`✗ Impossibile agganciare l'inspector su :${PORT} — ${e.message}\n` +
      `  Lancia la pi in modalità debug:  cd harness && npm run tui:debug  (aggiunge --inspect=127.0.0.1:${PORT})`);
    process.exit(2);
  }
  const ws = await openWS(target.webSocketDebuggerUrl);
  const cdp = new CDP(ws);
  await cdp.send("Runtime.enable");
  console.error(`✓ agganciato: ${target.title || target.id}`);

  // --- modalità --eval one-shot (espressione in scope globale) ---
  if (EVAL) {
    const r = await cdp.send("Runtime.evaluate", { expression: EVAL, returnByValue: true, awaitPromise: true });
    const val = r.result?.value ?? r.result?.description ?? r.result;
    console.log(AS_JSON ? JSON.stringify(val) : mask(typeof val === "object" ? JSON.stringify(val, null, 2) : String(val)));
    ws.close(); process.exit(0);
  }

  if (!AT) { console.error("✗ manca --at <suffisso-path>:<riga>  (o usa --eval). Vedi l'header del file per esempi."); ws.close(); process.exit(2); }
  const m = AT.match(/^(.*):(\d+)$/);
  if (!m) { console.error(`✗ --at malformato: "${AT}" — atteso "path:riga"`); ws.close(); process.exit(2); }
  const [, path, lineStr] = m;
  const line = parseInt(lineStr, 10);
  const exprs = DUMP.split(",").map((s) => s.trim()).filter(Boolean);

  await cdp.send("Debugger.enable");
  const bp = await cdp.send("Debugger.setBreakpointByUrl", { urlRegex: urlRegexFrom(path), lineNumber: line - 1, columnNumber: 0 });
  if (!bp.locations || bp.locations.length === 0) {
    console.error(`⚠ breakpoint impostato ma NESSUNA location risolta per "${path}:${line}".\n` +
      `  Cause tipiche: (a) è un file .ts (jiti → URL virtuale, non matcha — usa la .mjs);\n` +
      `  (b) lo script non è ancora stato caricato (verrà agganciato quando pi lo importa);\n` +
      `  (c) suffisso-path troppo corto/errato. Riga vuota/commento → prova la prima riga di codice della funzione.`);
  } else {
    console.error(`✓ breakpoint su ${path}:${line} — ${bp.locations.length} location. In attesa di ${HITS} hit (auto-resume). Ctrl-C per staccare.`);
  }

  let hit = 0;
  cdp.on(async (msg) => {
    if (msg.method !== "Debugger.paused") return;
    hit++;
    const frame = msg.params.callFrames?.[0];
    const cid = frame?.callFrameId;
    const rec = { hit, ts: new Date().toISOString(), fn: frame?.functionName || "?", url: (frame?.url || "").split("/").slice(-2).join("/") };
    const vals = {};
    for (const ex of exprs) {
      try {
        const r = await cdp.send("Debugger.evaluateOnCallFrame", { callFrameId: cid, expression: ex, returnByValue: true, silent: true });
        vals[ex] = r.result?.value ?? r.result?.description ?? (r.result?.type === "undefined" ? "undefined" : r.result);
      } catch (e) { vals[ex] = `<err: ${e.message}>`; }
    }
    rec.values = vals;
    if (AS_JSON) console.log(JSON.stringify(rec));
    else {
      const parts = Object.entries(vals).map(([k, v]) => `${k}=${mask(typeof v === "object" ? JSON.stringify(v) : String(v))}`);
      const loc = rec.url ? ` [${rec.url}]` : "";
      console.log(`  ● hit#${hit} ${rec.fn}()${loc}  ${parts.join("  ·  ")}`);
    }
    await cdp.send("Debugger.resume");
    if (hit >= HITS) {
      try { await cdp.send("Debugger.removeBreakpoint", { breakpointId: bp.breakpointId }); } catch { /* ok */ }
      console.error(`✓ ${HITS} hit raccolti — stacco.`);
      ws.close(); process.exit(0);
    }
  });

  process.on("SIGINT", () => { console.error("\n(stacco)"); try { ws.close(); } catch { /* */ } process.exit(0); });
})().catch((e) => { console.error("✗ errore:", e.message); process.exit(1); });

/**
 * transcript-scenario — regressione DETERMINISTICA sui fallimenti del transcript pi 019f1d67 (2026-07-01).
 *
 * Il transcript (qwen3.5:9b) mostrò 3 fallimenti; questo test asserisce le MECCANICHE dell'harness che li
 * prevengono, componendo i moduli node-puri reali (framing + conversation-store + windowing). Deterministico →
 * gira in CI, indipendente dalla flakiness del modello. Vedi wiki/concepts/toolresult-vs-usermsg-boundary.md.
 *
 *   F1: il modello scambiava un tool_result per un'istruzione utente     → prevenuto dal framing auto-descrittivo
 *   F2: amnesia ("sono sempre all'inizio", non vedeva i msg precedenti)  → prevenuto dalla lane <messages_with_user>
 *   F3: doppia-chat (storia duplicata native+lane)                        → prevenuto da keepTurns:1 (native = solo corrente)
 *   F1': il vero meccanismo — tool_result ORFANO (tool_call finestrata via) resta comunque auto-descritto
 */
import { frameToolResultsInMessages } from "../../src/tool-result-envelope.mjs";
import { ConversationStore, buildMessagesLane, windowNativeMessages } from "../../src/conversation-store.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const C = "sess-transcript";
const NOW = 1782000000000;

// Sequenza ispirata al transcript: registrazione di un secret + domanda di follow-up.
function makeNative() {
  return [
    { role: "user", content: "ciao chi sei?" },
    { role: "assistant", content: "sono l'assistente" },
    { role: "user", content: "registra un secret" },
    { role: "assistant", content: [{ type: "toolCall", id: "call_add", name: "add_secret", arguments: {} }] },
    { role: "toolResult", toolCallId: "call_add", toolName: "add_secret", isError: false, content: [{ type: "text", text: "secret registered (1 active in the dynamic secrets-map)" }] },
    { role: "user", content: "che segreto hai registrato?" },
  ];
}

// ── F1: il tool_result è AUTO-DESCRITTO → non confabulabile come messaggio utente ─────────────────
{
  const framed = frameToolResultsInMessages(makeNative(), { now: "2026-07-03T12:00:00.000Z" });
  const trMsg = framed.find((m) => m.role === "toolResult");
  const trText = trMsg.content[0].text;
  ok(trText.startsWith("<tool_result ") && /tool="add_secret"/.test(trText), "F1: tool_result auto-descritto (tool=add_secret) → attribuibile, non confabulabile come msg utente");
  ok(/UNTRUSTED ZONE/.test(trText), "F1: banner untrusted presente (riga load-bearing)");
  ok(/secret registered \(1 active/.test(trText), "F1: contenuto reale del tool preservato dentro l'envelope");
  ok(/status="ok"/.test(trText) && /call_id="call_add"/.test(trText), "F1: meta-info (status/call_id) presenti");
}

// ── F2: NIENTE amnesia → la lane porta la storia dei turni precedenti ─────────────────────────────
{
  const cs = new ConversationStore(":memory:", { agent: "orchestrator" });
  cs.append(C, "user", "ciao chi sei?", { ts: NOW });
  cs.append(C, "assistant", "sono l'assistente", { ts: NOW + 1000 });
  cs.append(C, "user", "registra un secret", { ts: NOW + 2000 });
  cs.append(C, "assistant", "fatto", { ts: NOW + 3000 });
  cs.append(C, "user", "che segreto hai registrato?", { ts: NOW + 4000 }); // turno CORRENTE
  const lane = buildMessagesLane(cs, C, { n: 6, charCap: 4000, excludeCurrentTurn: true });
  ok(lane.includes("<messages_with_user"), "F2: lane wrappata in <messages_with_user>");
  ok(lane.includes("ciao chi sei?") && lane.includes("registra un secret"), "F2: la lane contiene la STORIA → il modello NON è amnesico");
  ok(!lane.includes("che segreto hai registrato?"), "F2: excludeCurrentTurn → il turno corrente NON è duplicato nella lane");
}

// ── F3: niente doppia-chat → native windowed a keepTurns:1 (solo turno corrente) ──────────────────
{
  const windowed = windowNativeMessages(makeNative(), { keepTurns: 1 });
  const userMsgs = windowed.filter((m) => m.role === "user" && typeof m.content === "string");
  ok(userMsgs.length === 1 && userMsgs[0].content === "che segreto hai registrato?", "F3: native windowed = SOLO il turno utente corrente");
  ok(!windowed.some((m) => m.content === "ciao chi sei?"), "F3: i turni vecchi sono finestrati via dal native (vivono nella lane) → niente doppia-chat");
}

// ── F1': tool_result ORFANO (il vero meccanismo del transcript) resta auto-descritto ──────────────
// Con keepTurns che tiene il turno del tool ma NON la assistant tool_call originaria: il result è "orfano".
{
  // simula un turno in cui resta solo il tool_result (la tool_call è stata finestrata via)
  const orphan = [
    { role: "toolResult", toolCallId: "call_add", toolName: "add_secret", content: [{ type: "text", text: "secret registered" }] },
    { role: "user", content: "che segreto hai registrato?" },
  ];
  const framed = frameToolResultsInMessages(orphan, { now: "x" });
  const trText = framed[0].content[0].text;
  // il nome viene dal campo DIRETTO toolName (non serve la tool_call correlata) → orfano ma auto-descritto
  ok(/tool="add_secret"/.test(trText), "F1': tool_result ORFANO resta auto-descritto (toolName diretto, no correlazione con la tool_call finestrata via)");
}

// ── idempotenza end-to-end: ri-processare non raddoppia l'envelope ────────────────────────────────
{
  const once = frameToolResultsInMessages(makeNative(), { now: "x" });
  const twice = frameToolResultsInMessages(once, { now: "x" });
  ok(twice === once, "IDEMPOTENZA: un secondo framing non modifica nulla (no doppio-envelope tra turni)");
}

console.log(`transcript-scenario test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

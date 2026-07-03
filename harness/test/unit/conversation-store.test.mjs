/**
 * Smoke-test del conversation-store (Strada 2). Esegui: `node src/conversation-store.test.mjs`
 * Zero dipendenze, zero Docker. Verifica append/window/range + la lane <messages_with_user>.
 */
import { ConversationStore, buildMessagesLane, isGenuineUserInput } from "../../src/conversation-store.mjs";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { buildWorkspace } from "../../src/context-assembler.mjs";

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error("  ✗ FAIL:", msg); } }

const NOW = 1_900_000_000_000;
const cs = new ConversationStore(":memory:", { agent: "orchestrator" });
const C = "conv_A";

const s1 = cs.append(C, "user", "implementa POST /users", { ts: NOW });
cs.append(C, "assistant", "ok, parto dalla validazione", { ts: NOW + 1000 });
cs.append(C, "user", "aggiungi auth JWT", { ts: NOW + 2000 });

ok(s1 === 1, "append ritorna seq monotono");
ok(cs.count(C) === 3, "count");

// window: ultimi N, cronologico (oldest->newest), verbatim
const w = cs.window(C, 2);
ok(w.length === 2 && w[0].text === "ok, parto dalla validazione" && w[1].text === "aggiungi auth JWT",
  "window ultimi-N in ordine cronologico verbatim");

// range per seq (recupero-per-ID dei subagent)
const r = cs.range(C, 1, 2);
ok(r.length === 2 && r[0].seq === 1 && r[1].seq === 2, "range per seq");

// GLOBAL-seq bug (sessione live 019f292b): il seq è GLOBALE/condiviso tra sessioni → una conv NON parte da seq 1.
// Chiedere "i primi/più vecchi" facendo range basso (1..N) cade su seq di ALTRE sessioni → []. Fix = from_start/windowOldest.
{
  const gs = new ConversationStore(":memory:", { agent: "orchestrator" });
  gs.append("older_sess", "user", "roba di un'altra sessione", { ts: NOW });   // seq 1
  gs.append("older_sess", "assistant", "...", { ts: NOW + 1 });                 // seq 2
  const Y = "later_sess";
  const yFirst = gs.append(Y, "user", "primo di Y", { ts: NOW + 10 });          // seq 3
  gs.append(Y, "assistant", "secondo di Y", { ts: NOW + 11 });                  // seq 4
  gs.append(Y, "user", "terzo di Y", { ts: NOW + 12 });                         // seq 5
  ok(yFirst === 3, "seq è GLOBALE: Y NON parte da 1");
  ok(gs.firstSeq(Y) === 3, "firstSeq = min reale della conv (3, non 1)");
  ok(gs.range(Y, 1, 2).length === 0, "range basso (1..2) su Y → [] (seq di un'altra sessione) = IL BUG");
  const oldest2 = gs.windowOldest(Y, 2);
  ok(oldest2.length === 2 && oldest2[0].text === "primo di Y" && oldest2[1].text === "secondo di Y",
    "windowOldest: i PRIMI N di QUESTA conv, oldest-first (fix)");
  const yLane = buildMessagesLane(gs, Y, { n: 1 });
  ok(yLane.includes("from_start=true") && !yLane.includes("range=1.."), "lane header: steera a from_start, non al range=1.. fuorviante");
  ok(yLane.includes("range=3..4"), "lane header: se dà un range usa il firstSeq REALE (3), non 1");
}

// lane: verbatim last-N + header shown/total + marker older-by-ID
const lane = buildMessagesLane(cs, C, { n: 2 });
ok(lane.startsWith('<messages_with_user conv="conv_A" shown="2/3">'), "lane header shown=N/total");
ok(lane.includes("[user] aggiungi auth JWT") && lane.includes("[assistant] ok, parto"), "lane mostra i turni verbatim");
ok(lane.includes("(+1 older messages") && lane.includes("range=1..1"), "lane marker recupero-per-ID dei più vecchi");

// escaping anti-injection
cs.append(C, "user", "usa <script> & co", { ts: NOW + 3000 });
const lane2 = buildMessagesLane(cs, C, { n: 1 });
ok(lane2.includes("&lt;script&gt; &amp; co") && !lane2.includes("<script>"), "lane escaping XML");

// ANCORAGGIO TEMPORALE (utente msg 848/849): convId sess-<epoch> → header session_start + shift [+Xs] per riga.
const CT = "sess-1783000000000-startup";
cs.append(CT, "user", "primo", { ts: 1783000000000 });
cs.append(CT, "assistant", "secondo", { ts: 1783000000000 + 47000 });
const laneT = buildMessagesLane(cs, CT, { n: 5 });
ok(laneT.includes('session_start="2026-07-02T13:46:40Z"'), "lane: header session_start assoluto dal convId");
ok(laneT.includes("[+0s] [user] primo"), "lane: primo msg shift +0s");
ok(laneT.includes("[+47s] [assistant] secondo"), "lane: shift +47s dal delta ts");
// convId non-sess ('main'/'conv_A') → nessun shift/header (degrada con grazia)
ok(!buildMessagesLane(cs, C, { n: 2 }).includes("session_start="), "lane: convId non-sess → nessun ancoraggio (graceful)");

// charCap: droppa i più VECCHI, tiene i recenti verbatim, segnala i nascosti
const C2 = "conv_B";
for (let i = 0; i < 5; i++) cs.append(C2, "user", "x".repeat(100), { ts: NOW + i });
const laneCap = buildMessagesLane(cs, C2, { n: 5, charCap: 250 });
ok(laneCap.includes('shown="2/5"') && laneCap.includes("(+3 older messages"),
  "lane charCap: tiene i 2 più recenti entro il cap, segnala i 3 nascosti");

// conversazione vuota -> lane vuota
ok(buildMessagesLane(cs, "nope") === "", "conv inesistente -> lane vuota");

// isolamento per id
ok(cs.count(C2) === 5 && cs.count(C) === 4, "conversazioni isolate per id");

// --- buildWorkspace: compone resume + context + messages_with_user (mente in prima persona) ---
const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
vq.addRule("no-secret-exfil", "Mai esfiltrare segreti", { severity: "hard" });
vq.addTask("W1", "build workspace", {});
vq.setCurr("W1");
vq.setTaskStatus("W1", "in_progress");
const cs3 = new ConversationStore(":memory:");
cs3.append("wctx", "user", "ciao", { ts: NOW });
cs3.append("wctx", "assistant", "ecco la lane", { ts: NOW + 1 });
const wlast = vq.getChangeLog({ limit: 1 })[0].ts;             // ts reale (wall-clock) per il self-gating del resume
const ws = buildWorkspace(vq, { store: cs3, convId: "wctx", now: wlast + 1000, messagesN: 4 });
ok(ws.includes("<context>") && ws.includes("</context>"), "workspace contiene <context>");
ok(ws.includes("<messages_with_user"), "workspace contiene la lane messaggi");
ok(ws.indexOf("</context>") < ws.indexOf("<messages_with_user"),
  "messages_with_user è DOPO </context> (blocco separato volatile, cache-safe)");
ok(!ws.includes("<resuming_from"), "sessione attiva (gap piccolo) -> niente banner resume");
// resume: gap reale -> il banner compare PRIMA del <context>
const wsResume = buildWorkspace(vq, { store: cs3, convId: "wctx", now: wlast + 24 * 3600 * 1000, messagesN: 4 });
ok(wsResume.includes("<resuming_from") && wsResume.indexOf("<resuming_from") < wsResume.indexOf("<context>"),
  "resume dopo gap -> <resuming_from> in testa al workspace");
vq.close();
cs3.close();

// ── nthLastUserSeq + complementarità nativeKeepTurns (fix amnesia 2026-07-03, verification-loop) ──
const CK = "ck-native";
const uA = cs.append(CK, "user", "primo msg", { ts: NOW });
cs.append(CK, "assistant", "risp uno", { ts: NOW + 1 });
const uB = cs.append(CK, "user", "secondo msg", { ts: NOW + 2 });
cs.append(CK, "assistant", "risp due", { ts: NOW + 3 });
const uC = cs.append(CK, "user", "terzo msg", { ts: NOW + 4 });
cs.append(CK, "assistant", "risp tre", { ts: NOW + 5 });
ok(cs.nthLastUserSeq(CK, 1) === uC, "nthLastUserSeq(1) = ultimo user");
ok(cs.nthLastUserSeq(CK, 2) === uB, "nthLastUserSeq(2) = penultimo user");
ok(cs.nthLastUserSeq(CK, 3) === uA, "nthLastUserSeq(3) = primo user");
ok(cs.nthLastUserSeq(CK, 4) === null, "nthLastUserSeq(4) = null (< 4 turni utente)");
// K=1: lane = tutta la storia tranne l'ultimo turno-utente (equivale a excludeCurrentTurn nel caso interattivo)
const laneK1 = buildMessagesLane(cs, CK, { n: 10, nativeKeepTurns: 1 });
ok(laneK1.includes("primo msg") && laneK1.includes("secondo msg") && !laneK1.includes("terzo msg"), "nativeKeepTurns=1: lane = storia tranne l'ultimo turno");
// K=2: lane = solo il turno più vecchio (dal 2° in poi è nell'array nativo)
const laneK2 = buildMessagesLane(cs, CK, { n: 10, nativeKeepTurns: 2 });
ok(laneK2.includes("primo msg") && !laneK2.includes("secondo msg"), "nativeKeepTurns=2: lane = solo il turno più vecchio");
// K >= turni-utente: tutta la conversazione è nativa → lane VUOTA (niente doppia-chat)
ok(buildMessagesLane(cs, CK, { n: 10, nativeKeepTurns: 3 }) === "", "nativeKeepTurns=3: conversazione tutta nativa -> lane vuota");
ok(buildMessagesLane(cs, CK, { n: 10, nativeKeepTurns: 5 }) === "", "nativeKeepTurns>turni: lane vuota");

// ── isGenuineUserInput: accetta interactive+rpc, esclude mid-turn/slash/extension (fix headless-capture 2026-07-03) ──
ok(isGenuineUserInput({ text: "ciao", source: "interactive" }) === true, "genuine: interactive → true");
ok(isGenuineUserInput({ text: "ciao", source: "rpc" }) === true, "genuine: rpc → true (fix: prima escluso)");
ok(isGenuineUserInput({ text: "ciao", source: "extension" }) === false, "genuine: extension (injection) → false");
ok(isGenuineUserInput({ text: "ciao", source: "interactive", streamingBehavior: "steer" }) === false, "genuine: mid-turn steer → false");
ok(isGenuineUserInput({ text: "ciao", source: "rpc", streamingBehavior: "followUp" }) === false, "genuine: mid-turn followUp → false");
ok(isGenuineUserInput({ text: "/help", source: "interactive" }) === false, "genuine: slash-command → false");
ok(isGenuineUserInput({ text: "   ", source: "rpc" }) === false, "genuine: solo-whitespace → false");
ok(isGenuineUserInput({ text: 123, source: "rpc" }) === false, "genuine: text non-stringa → false");
ok(isGenuineUserInput({}) === false, "genuine: evento vuoto → false");

cs.close();
console.log(`\nconversation-store smoke-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

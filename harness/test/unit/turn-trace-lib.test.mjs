/**
 * turn-trace-lib — unit test delle funzioni pure di osservabilità per-turno.
 *
 * REGRESSIONE CHIAVE (2026-07-03): su ollama/gemini (api openai-completions) il system prompt è un messaggio
 * role="developer", NON "system". Prima extractSystemText cercava solo "system" → systemLen/laneLines SEMPRE 0
 * (trace cieco, ha depistato la diagnosi dell'amnesia). Questi test fissano il riconoscimento di ENTRAMBI i ruoli.
 */
import { contentText, isSystemRole, extractSystemText, isToolResult, messagesInfo, messagesDump, laneOverlap, buildRawDump, buildFullMd } from "../../src/turn-trace-lib.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }
function eq(a, b, msg) { ok(a === b, `${msg} (atteso ${JSON.stringify(b)}, avuto ${JSON.stringify(a)})`); }

// ── isSystemRole: developer È system ──
ok(isSystemRole("system"), "isSystemRole: system");
ok(isSystemRole("developer"), "isSystemRole: developer (fix openai-completions)");
ok(!isSystemRole("user"), "isSystemRole: user no");
ok(!isSystemRole("assistant"), "isSystemRole: assistant no");
ok(!isSystemRole(undefined), "isSystemRole: undefined no");

// ── contentText ──
eq(contentText("hello"), "hello", "contentText: stringa");
eq(contentText([{ type: "text", text: "a" }, { type: "text", text: "b" }]), "ab", "contentText: array blocchi");
eq(contentText(["x", "y"]), "xy", "contentText: array stringhe");
eq(contentText(null), "", "contentText: null → ''");

// ── extractSystemText: il caso ollama (role=developer) ──
{
  const payloadOllama = { messages: [
    { role: "developer", content: "SYS PROMPT ollama" },
    { role: "user", content: "ciao" },
  ] };
  eq(extractSystemText(payloadOllama), "SYS PROMPT ollama", "extractSystemText: trova role=developer");

  const payloadOpenAI = { messages: [
    { role: "system", content: "SYS classico" },
    { role: "user", content: "ciao" },
  ] };
  eq(extractSystemText(payloadOpenAI), "SYS classico", "extractSystemText: trova role=system");

  const payloadAnthropic = { system: "SYS anthropic", messages: [{ role: "user", content: "x" }] };
  eq(extractSystemText(payloadAnthropic), "SYS anthropic", "extractSystemText: campo system (Anthropic)");

  eq(extractSystemText({ messages: [{ role: "user", content: "x" }] }), "", "extractSystemText: nessun system → ''");
  eq(extractSystemText(null), "", "extractSystemText: payload null → ''");
}

// ── messagesInfo: developer escluso dal conteggio nativo ──
{
  const payload = { messages: [
    { role: "developer", content: "sys" },       // system → escluso
    { role: "user", content: "domanda" },        // turno utente genuino
    { role: "assistant", content: "risposta" },
    { role: "user", content: [{ type: "tool_result", content: "out" }] }, // tool-result, NON turno utente
  ] };
  const mi = messagesInfo(payload);
  eq(mi.count, 3, "messagesInfo: developer escluso dal count (3 non-system)");
  eq(mi.userTurns, 1, "messagesInfo: userTurns genuini = 1 (tool-result escluso)");
  eq(mi.toolResults, 1, "messagesInfo: toolResults = 1");
  ok(!mi.roles.includes("developer"), "messagesInfo: roles non contiene developer");
}

// ── messagesDump: per-messaggio {role,text,toolResult}, developer escluso ──
{
  const payload = { messages: [
    { role: "developer", content: "sys" },
    { role: "user", content: "domanda" },
    { role: "assistant", content: [{ type: "text", text: "risposta" }] },
    { role: "user", content: [{ type: "tool_result", content: "out" }] },
  ] };
  const d = messagesDump(payload);
  eq(d.length, 3, "messagesDump: developer escluso (3)");
  eq(d[0].role, "user", "messagesDump: [0] role user");
  eq(d[1].text, "risposta", "messagesDump: testo estratto da blocchi");
  ok(d[2].toolResult === true, "messagesDump: tool_result flaggato");
  eq(messagesDump({}).length, 0, "messagesDump: payload senza messages → []");
}

// ── isToolResult ──
ok(isToolResult({ role: "user", content: [{ type: "tool_result", content: "x" }] }), "isToolResult: blocco tool_result");
ok(isToolResult({ content: [{ type: "tool-result" }] }), "isToolResult: variante tool-result");
ok(!isToolResult({ role: "user", content: [{ type: "text", text: "x" }] }), "isToolResult: testo normale no");
ok(!isToolResult({ role: "user", content: "stringa" }), "isToolResult: content stringa no");

// ── laneOverlap: righe della lane che ricompaiono nel native ──
{
  const sys = `<context>\n<messages_with_user conv="c" shown="2/10">\n  [user] cancella il file di configurazione\n  [assistant] fatto, rimosso\n</messages_with_user>\n</context>`;
  const native0 = "solo il turno corrente qui, nessuna ripetizione";
  const ov0 = laneOverlap(sys, native0);
  eq(ov0.laneLines, 2, "laneOverlap: 2 righe lane rilevate");
  eq(ov0.overlap, 0, "laneOverlap: overlap 0 (no doppia-chat)");

  const nativeDup = "cancella il file di configurazione";
  const ovDup = laneOverlap(sys, nativeDup);
  ok(ovDup.overlap >= 1, "laneOverlap: overlap≥1 quando la riga lane ricompare nel native (doppia-chat)");

  eq(laneOverlap("nessuna lane qui", "x").laneLines, 0, "laneOverlap: nessuna lane → 0");
}

// ── buildRawDump / buildFullMd: FEDELTÀ del debug (fix 2026-07-05, utente msg 1103) ──
// REGRESSIONE: il vecchio dump .md iniettava nell'header il literal "<how_memory_works>" → un grep per lo scaffolding
// trovava un FALSO POSITIVO anche quando il modello NON lo riceveva → depistò la diagnosi di modularità. Il debug DEVE
// rispecchiare ESATTAMENTE lo stato del modello: 0 stringhe iniettate che il modello non ha ricevuto.
{
  const system = "SYS senza scaffolding: solo <context><current_aim>x</current_aim></context>";
  const messages = [
    { role: "user", text: "domanda utente" },
    { role: "assistant", text: "risposta" },
    { role: "user", text: "out del tool", toolResult: true },
  ];
  const raw = buildRawDump({ ts: "T", convId: "c1", system, messages });
  const full = buildFullMd({ ts: "T", convId: "c1", system, messages, tokens: 42 });

  // fedeltà byte-esatta di system e messaggi
  eq(raw.system, system, "buildRawDump: system byte-identico all'input");
  eq(raw.messages.length, 3, "buildRawDump: 3 messaggi");
  eq(raw.messages[0].text, "domanda utente", "buildRawDump: testo messaggio fedele");
  ok(raw.messages[2].toolResult === true, "buildRawDump: toolResult preservato");

  // NIENTE nomi-tag iniettati: il modello NON riceve "how_memory_works" → NON deve comparire da nessuna parte
  ok(!JSON.stringify(raw).includes("how_memory_works"), "FEDELTÀ raw: 0 'how_memory_works' iniettati (input non lo contiene)");
  ok(!full.includes("how_memory_works"), "FEDELTÀ full: 0 'how_memory_works' nell'header (fix falso-positivo)");
  ok(!full.includes("messages_with_user"), "FEDELTÀ full: nessun nome-tag iniettato nell'header");

  // presenza FEDELE: se il modello LO riceve davvero, deve comparire (il debug non nasconde né inventa)
  const sysWith = "<how_memory_works>you run in a harness…</how_memory_works>\n" + system;
  const rawWith = buildRawDump({ ts: "T", convId: "c1", system: sysWith, messages });
  ok(rawWith.system.includes("how_memory_works"), "FEDELTÀ raw: presente quando l'input lo contiene davvero");
  ok(buildFullMd({ system: sysWith, messages }).includes("how_memory_works"), "FEDELTÀ full: presente quando reale");

  // i marker di fence esistono ma NON collidono con contenuto di scaffolding (nessun <tag> nei marker)
  ok(full.includes("===== VERBATIM"), "full: marker di fence presenti");
  // difensività su input vuoto/malformato (la diagnostica non deve mai rompere)
  ok(buildRawDump().messages.length === 0 && buildRawDump().system === "", "buildRawDump: input vuoto → {system:'',messages:[]}");
  ok(typeof buildFullMd() === "string", "buildFullMd: input vuoto → stringa");
}

console.log(`\nturn-trace-lib: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);

/**
 * eviction-checkpoint — test del core NEW-A (rete di sicurezza fatti-durevoli in eviction, utente msg 936/939).
 * Puro + deterministico: rung config, detection eviction, digest, direttiva, prompt/parse OOB, client OOB (fetch finto).
 */
import {
  EVICTION_RUNGS,
  loadEvictionConfig,
  evictionEvent,
  summarizeEvicting,
  buildEvictionDirective,
  buildOobPrompt,
  parseOobSave,
  extractChatText,
  callModelOutOfBand,
} from "../../src/eviction-checkpoint.mjs";

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error("  ✗ " + msg); } }

// ── loadEvictionConfig: env override + file opt-in + DEFAULT off + fail-safe ──
const NOFILE = () => { throw new Error("ENOENT"); }; // simula "nessun .pi/harness.config.json"
ok(loadEvictionConfig({ env: {}, readFile: NOFILE }).rung === "off", "config: no env + no file → off (DEFAULT)");
ok(loadEvictionConfig({ env: {}, readFile: NOFILE }).enabled === false, "config: off → enabled=false");
ok(loadEvictionConfig({ env: {}, readFile: NOFILE }).source === "default", "config: source=default");
ok(loadEvictionConfig({ env: { HARNESS_EVICTION_CHECKPOINT: "nudge" }, readFile: NOFILE }).rung === "nudge", "config: env nudge");
ok(loadEvictionConfig({ env: { HARNESS_EVICTION_CHECKPOINT: "INJECT" }, readFile: NOFILE }).rung === "inject", "config: env case-insensitive");
ok(loadEvictionConfig({ env: { HARNESS_EVICTION_CHECKPOINT: " require " }, readFile: NOFILE }).rung === "require", "config: env trim");
ok(loadEvictionConfig({ env: { HARNESS_EVICTION_CHECKPOINT: "require" }, readFile: NOFILE }).source === "env", "config: source=env");
ok(loadEvictionConfig({ env: { HARNESS_EVICTION_CHECKPOINT: "bogus" }, readFile: NOFILE }).rung === "off", "config: env ignoto + no file → off (fail-safe)");
// file opt-in `.pi/harness.config.json` → campo evictionCheckpoint (persistente)
ok(loadEvictionConfig({ env: {}, readFile: () => JSON.stringify({ evictionCheckpoint: "inject" }) }).rung === "inject", "config: da FILE evictionCheckpoint");
ok(loadEvictionConfig({ env: {}, readFile: () => JSON.stringify({ evictionCheckpoint: "NUDGE" }) }).source === "file", "config: source=file (case-insensitive)");
ok(loadEvictionConfig({ env: { HARNESS_EVICTION_CHECKPOINT: "off" }, readFile: () => JSON.stringify({ evictionCheckpoint: "inject" }) }).rung === "off", "config: env=off = kill-switch anche sul file");
ok(loadEvictionConfig({ env: {}, readFile: () => "{bad json" }).rung === "off", "config: file malformato → off (fail-safe)");
ok(loadEvictionConfig({ env: {}, readFile: () => JSON.stringify({ evictionCheckpoint: "bogus" }) }).rung === "off", "config: file valore ignoto → off");
ok(loadEvictionConfig({ env: {}, readFile: () => JSON.stringify({}) }).rung === "off", "config: file senza campo → off");
ok(EVICTION_RUNGS.join(",") === "off,nudge,inject,require", "config: ladder ordinata");

// ── evictionEvent: detection deterministica (semantica windowNativeMessages: tiene ultimi K turni-utente) ──
ok(evictionEvent({ userTurnCount: 3, keepTurns: 6, lastEvictedOrdinal: 0 }).newlyEvicted.length === 0, "evict: sotto soglia (U≤K) → niente");
ok(evictionEvent({ userTurnCount: 6, keepTurns: 6, lastEvictedOrdinal: 0 }).evictedThrough === 0, "evict: U==K → evictedThrough 0");
{
  const e = evictionEvent({ userTurnCount: 7, keepTurns: 6, lastEvictedOrdinal: 0 });
  ok(e.evictedThrough === 1 && e.newlyEvicted.length === 1 && e.newlyEvicted[0] === 1, "evict: U=7,K=6 → esce il turno #1");
}
{
  const e = evictionEvent({ userTurnCount: 9, keepTurns: 6, lastEvictedOrdinal: 1 });
  ok(e.evictedThrough === 3 && e.newlyEvicted.join(",") === "2,3", "evict: avanza il boundary (già evacuato #1 → nuovi #2,#3)");
}
ok(evictionEvent({ userTurnCount: 9, keepTurns: 6, lastEvictedOrdinal: 3 }).newlyEvicted.length === 0, "evict: idempotente (prev≥evictedThrough → niente)");
ok(evictionEvent({ userTurnCount: 100, keepTurns: 1, lastEvictedOrdinal: 98 }).newlyEvicted.join(",") === "99", "evict: K=1 → esce un turno per volta");
ok(evictionEvent({ userTurnCount: 5, keepTurns: 0, lastEvictedOrdinal: 0 }).evictedThrough === 4, "evict: K coerció a ≥1 (0→1)");
ok(evictionEvent({}).newlyEvicted.length === 0, "evict: args mancanti → degrada (niente)");

// ── summarizeEvicting ──
ok(summarizeEvicting([]) === "", "digest: vuoto → ''");
ok(summarizeEvicting(null) === "", "digest: null → ''");
{
  const d = summarizeEvicting([{ ordinal: 2, role: "user", text: "il mio   soprannome\nè Lupo" }]);
  ok(d === "- #2 [user] il mio soprannome è Lupo", "digest: normalizza spazi/newline + ordinale + role");
}
{
  const long = "x".repeat(500);
  const d = summarizeEvicting([{ ordinal: 1, role: "user", text: long }], { maxCharsPerTurn: 50 });
  ok(d.includes("…") && d.length < 100, "digest: tronca a maxCharsPerTurn");
}
{
  const many = Array.from({ length: 8 }, (_, i) => ({ ordinal: i + 1, role: "user", text: "t" + i }));
  const d = summarizeEvicting(many, { maxTurns: 3 });
  ok(d.includes("(+5 more leaving)"), "digest: cap maxTurns + conteggio residuo");
}

// ── buildEvictionDirective ──
ok(buildEvictionDirective("off") === "", "directive: off → ''");
ok(buildEvictionDirective("require") === "", "directive: require → '' (OOB, non testo)");
ok(buildEvictionDirective("nudge").includes("MEMORY EVICTION"), "directive: nudge → notice");
ok(!buildEvictionDirective("nudge", { digest: "- #1 [user] ciao" }).includes("Leaving the window"), "directive: nudge NON include il digest");
ok(buildEvictionDirective("inject", { digest: "- #1 [user] ciao" }).includes("Leaving the window:\n- #1 [user] ciao"), "directive: inject include il digest");
ok(buildEvictionDirective("nudge").includes('note("<fact>")'), "directive: nudge cita note() (affordance)");
ok(buildEvictionDirective("nudge").includes("do nothing"), "directive: outcome-not-ceremony ('do nothing' se niente durevole)");

// ── buildOobPrompt / parseOobSave ──
{
  const p = buildOobPrompt({ digest: "- #1 [user] chiamami Lupo" });
  ok(p.length === 2 && p[0].role === "system" && p[1].role === "user", "oob-prompt: [system, user]");
  ok(p[0].content.includes("SAVE:") && p[0].content.includes("NONE"), "oob-prompt: vincola l'output a SAVE:/NONE");
  ok(p[1].content.includes("chiamami Lupo"), "oob-prompt: include il digest");
}
ok(parseOobSave("NONE").length === 0, "oob-parse: NONE → []");
ok(parseOobSave("none, niente di durevole").length === 0, "oob-parse: 'none...' → [] (word-boundary)");
{
  const s = parseOobSave("SAVE: nickname = Lupo\nSAVE: preferisce risposte brevi\nblah");
  ok(s.length === 2 && s[0].text === "nickname = Lupo" && s[1].text === "preferisce risposte brevi", "oob-parse: estrae le righe SAVE:");
}
ok(parseOobSave("save:  x  ")[0].text === "x", "oob-parse: case-insensitive + trim");
ok(parseOobSave("").length === 0 && parseOobSave(null).length === 0, "oob-parse: vuoto/null → []");

// ── extractChatText: OpenAI-compat + ollama ──
ok(extractChatText({ choices: [{ message: { content: "hi" } }] }) === "hi", "extract: OpenAI choices[0].message.content");
ok(extractChatText({ message: { content: "yo" } }) === "yo", "extract: ollama /api/chat message.content");
ok(extractChatText({ response: "gen" }) === "gen", "extract: ollama /api/generate response");
ok(extractChatText(null) === "" && extractChatText("x") === "", "extract: non-oggetto → ''");

// ── callModelOutOfBand: client con fetch FINTO (nessuna rete) ──
async function run() {
  // fetch finto che ritorna una risposta OpenAI-compatible con due SAVE
  const fakeFetch = async (url, init) => {
    const bodyObj = JSON.parse(init.body);
    ok(url === "http://127.0.0.1:11434/v1/chat/completions", "oob-call: usa l'endpoint passato");
    ok(bodyObj.temperature === 0 && bodyObj.stream === false, "oob-call: temperature 0 + no-stream (deterministico)");
    ok(Array.isArray(bodyObj.messages) && bodyObj.messages.length === 2, "oob-call: manda i messaggi del prompt");
    return { json: async () => ({ choices: [{ message: { content: "SAVE: nickname = Lupo\nNONE" } }] }) };
  };
  const r = await callModelOutOfBand({
    endpoint: "http://127.0.0.1:11434/v1/chat/completions",
    model: "qwen3.5:9b",
    messages: buildOobPrompt({ digest: "- #1 [user] chiamami Lupo" }),
    fetchImpl: fakeFetch,
  });
  // NB: NONE dopo una SAVE → parseOobSave ritorna [] (NONE in qualsiasi riga svuota). Verifica del comportamento reale:
  ok(r.ok === true, "oob-call: ok con fetch finto");
  ok(Array.isArray(r.saves) && r.saves.length === 0, "oob-call: 'NONE' presente → saves vuoto (word-boundary conservativo)");

  // caso pulito: solo SAVE
  const cleanFetch = async () => ({ json: async () => ({ message: { content: "SAVE: preferisce brevità" } }) });
  const r2 = await callModelOutOfBand({ endpoint: "http://x/y", messages: [{ role: "user", content: "d" }], fetchImpl: cleanFetch });
  ok(r2.saves.length === 1 && r2.saves[0].text === "preferisce brevità", "oob-call: estrae il save dal testo");

  // errori/guardie
  ok((await callModelOutOfBand({ messages: [{ role: "user", content: "x" }], fetchImpl: cleanFetch })).ok === false, "oob-call: endpoint mancante → error");
  ok((await callModelOutOfBand({ endpoint: "http://x", messages: [], fetchImpl: cleanFetch })).ok === false, "oob-call: messages vuoto → error");
  ok((await callModelOutOfBand({ endpoint: "http://x", messages: [{ role: "user", content: "x" }], fetchImpl: () => { throw new Error("boom"); } })).ok === false, "oob-call: fetch throw → error gestito");

  console.log(`\neviction-checkpoint: ${pass} pass, ${fail} fail`);
  process.exit(fail ? 1 : 0);
}
run();

/**
 * eviction-checkpoint (NEW-A) — RETE DI SICUREZZA per i FATTI DUREVOLI in uscita dalla finestra nativa.
 *
 * Problema (caso "Lupo", todo NEW-A): un fatto che serve MOLTI turni dopo esce dalla finestra nativa
 * (keepTurns=K) e il modello non l'ha salvato → lo ripesca a fatica o confabula. I tool note/set_var e
 * l'istruzione ESISTONO già; il 9B non li USA. Questa è la rete che lo SPINGE a salvare PRIMA della perdita.
 *
 * Design (utente msg 908/925/928/930/936/939, todo.md sezione NEW-A):
 *  - trigger DETERMINISTICO (soluzione B): scatta quando un turno-utente supera il bordo visibile (eviction dal
 *    nativo), NON su content-detection (scartata: "pezza + non enumerabile a mano"). Copertura per costruzione.
 *  - rung ladder (riusa il pattern `gathering` delegated/inject/require):
 *      off     = no-op (DEFAULT finché non validato live sul 9B)
 *      nudge   = direttiva PASSIVA appesa all'array uscente (cheap, order-independent)
 *      inject  = nudge + DIGEST dei turni in uscita (concreto)
 *      require = chiamata-modello DEDICATA out-of-band (Impl-2) — SEPARATA dalla conversazione
 *  - "sparisce dalla storia" = **MAI ENTRARCI** (non iniettare-poi-cancellare): nudge/inject via context-hook
 *    (non-persistito, effimero per costruzione); require via chiamata OOB (fuori-conversazione: persiste solo
 *    l'EFFETTO = i fatti salvati, l'exchange non tocca mai la storia). Vedi VERDETTO todo NEW-A 2026-07-04.
 *  - anti-hack ([[feedback_reward_hacking_principle]]): il gate verifica solo la PARTECIPAZIONE (scaffold
 *    runtime), MAI un reward — un reward "hai salvato qualcosa" premierebbe il salvare spazzatura. Reward = strato-3.
 *  - EFFIMERO-al-modello ≠ EFFIMERO-nei-log: ogni evento va LOGGATO (è la supervisione strato-3, data-factory).
 *  - scaffold che RECEDE (L3 anti-pezza): metrica = frazione di eviction dove il modello aveva GIÀ salvato → sale
 *    con lo strato-3 → si declassa il rung require→inject→nudge→off.
 *
 * Testabile: `fetchImpl` (OOB) e `readFile` (config) sono iniettabili; le altre funzioni sono pure.
 */
import { readFileSync } from "node:fs";

/** Scala dei rung, dal più economico. off = capability presente ma inerte (default). */
export const EVICTION_RUNGS = ["off", "nudge", "inject", "require"];

/**
 * Config del rung. Precedenza: (1) env `HARNESS_EVICTION_CHECKPOINT` (override rapido/A-B; `off` esplicito =
 * kill-switch); (2) file `.pi/harness.config.json` campo `evictionCheckpoint` (PERSISTENTE, toggle a mano — così
 * il modello vede il rung al riavvio di pi senza esportare env); (3) DEFAULT `off` (presenza estensione inerte).
 * Fail-safe: file assente/malformato/valore-ignoto → si scende al livello successivo, mai lancia.
 * @param {{ env?:Record<string,string|undefined>, configPath?:string, readFile?:(p:string)=>string }} [opts]
 * @returns {{ rung: string, enabled: boolean, source: "env"|"file"|"default" }}
 */
export function loadEvictionConfig(opts = {}) {
  const env = opts.env ?? (typeof process !== "undefined" && process.env ? process.env : {});
  // 1) env override
  const envRaw = String(env.HARNESS_EVICTION_CHECKPOINT || "").trim().toLowerCase();
  if (EVICTION_RUNGS.includes(envRaw)) return { rung: envRaw, enabled: envRaw !== "off", source: "env" };
  // 2) file opt-in
  try {
    const read = opts.readFile || ((p) => readFileSync(p, "utf-8"));
    const parsed = JSON.parse(read(opts.configPath ?? ".pi/harness.config.json"));
    const r = String((parsed && parsed.evictionCheckpoint) || "").trim().toLowerCase();
    if (EVICTION_RUNGS.includes(r)) return { rung: r, enabled: r !== "off", source: "file" };
  } catch {
    /* assente/malformato → default (fail-safe) */
  }
  // 3) default
  return { rung: "off", enabled: false, source: "default" };
}

/**
 * evictionEvent — dato il n° di turni-utente correnti (`userTurnCount`), la finestra nativa (`keepTurns=K`) e
 * l'ultimo ordinale già evacuato (`lastEvictedOrdinal`, persistito), calcola quali turni-utente sono APPENA
 * usciti dal nativo. Semantica allineata a `windowNativeMessages` (tiene gli ultimi K turni-utente).
 * Gli ordinali sono 1-based in ordine cronologico (1 = primo turno-utente della conversazione).
 * Puro. Idempotente: se già evacuati (prev ≥ evictedThrough) → newlyEvicted vuoto.
 * @param {{ userTurnCount:number, keepTurns:number, lastEvictedOrdinal?:number }} args
 * @returns {{ evictedThrough:number, newlyEvicted:number[] }}
 */
export function evictionEvent({ userTurnCount, keepTurns, lastEvictedOrdinal = 0 } = {}) {
  const K = Math.max(1, Math.floor(Number(keepTurns) || 1));
  const U = Math.max(0, Math.floor(Number(userTurnCount) || 0));
  const prev = Math.max(0, Math.floor(Number(lastEvictedOrdinal) || 0));
  const evictedThrough = Math.max(0, U - K); // ordinali 1..evictedThrough sono FUORI dall'array nativo
  const newlyEvicted = [];
  for (let o = prev + 1; o <= evictedThrough; o++) newlyEvicted.push(o);
  return { evictedThrough, newlyEvicted };
}

/**
 * summarizeEvicting — digest COMPATTO dei turni in uscita (per la direttiva inject / il prompt OOB).
 * @param {Array<{ordinal?:number,role?:string,text?:string}>} turns
 * @param {{ maxCharsPerTurn?:number, maxTurns?:number }} [opts]
 * @returns {string}
 */
export function summarizeEvicting(turns, { maxCharsPerTurn = 240, maxTurns = 6 } = {}) {
  if (!Array.isArray(turns) || turns.length === 0) return "";
  const slice = turns.slice(0, Math.max(1, maxTurns));
  const lines = slice.map((t) => {
    const role = t && t.role ? String(t.role) : "user";
    let text = t && t.text != null ? String(t.text) : "";
    text = text.replace(/\s+/g, " ").trim();
    if (text.length > maxCharsPerTurn) text = text.slice(0, Math.max(0, maxCharsPerTurn - 1)) + "…";
    const ord = t && t.ordinal != null ? `#${t.ordinal} ` : "";
    return `- ${ord}[${role}] ${text}`;
  });
  const more = turns.length > slice.length ? `\n- (+${turns.length - slice.length} more leaving)` : "";
  return lines.join("\n") + more;
}

/** Frase-guida condivisa (model-facing, EN). Outcome, non cerimonia: "salva o non fare nulla". */
const SAVE_HINT =
  'save it NOW with note("<fact>") (or set_var for a structured value).';
/**
 * SCRATCH_HINT — l'eviction è anche il PUNTO DI CONSOLIDAMENTO dell'intera lane appunti (utente msg 1158): oltre a
 * salvare i fatti dai messaggi in uscita, il modello rivede il proprio <scratch> e PROMUOVE a note() ciò che deve
 * durare. Outcome, non cerimonia: solo ciò che deve OUTLAST — il resto dello scratch è volatile e deve sfumare
 * (no over-save di spazzatura → [[feedback_reward_hacking_principle]]).
 */
const SCRATCH_HINT =
  " This is also your consolidation point: scan your <scratch> working-notes and promote any that must OUTLAST the next few turns into note() — facts persist; <scratch> is a rolling window and the rest is meant to fade.";
/** Chiusura condivisa: outcome-not-ceremony + no-restate. Tenuta ULTIMA così il no-restate chiude il notice. */
const SAVE_CLOSER = " If nothing is durable, do nothing. Do not restate this notice.";
/**
 * SAVE_CLOSER_ANTIDEFLECT — variante ANTI-DEFLESSIONE (utente msg 2026-07-08). F24: spingere il save fa DEFLETTERE il
 * modello (inversione mezzi-fini: annuncia "ho salvato, pronto per il summary" invece di continuare/rispondere → keep1
 * recall 0% vs 60%). Fix di FRAMING (non "spingere di più"): rende il save un'AZIONE-DI-LATO atomica e VIETA
 * esplicitamente i comportamenti-deflessione (annunciare, passare al summary, aspettare conferma). Il primary task NON
 * si interrompe. A/B contro `narrow` via env HARNESS_EVICTION_DIRECTIVE_STYLE.
 */
const SAVE_CLOSER_ANTIDEFLECT =
  " Do it in ONE quick note() call, then IMMEDIATELY continue exactly what you were doing — keep solving / answer the" +
  " question. Saving is a background reflex, NOT your reply: do not announce that you saved, do not switch to" +
  " summarizing, do not wait for confirmation, do not treat this as a stopping point. If nothing is durable, do nothing.";
/**
 * SAVE_CLOSER_URGENT — variante URGENTE (utente msg 2026-07-08): massima consapevolezza dell'imminenza + comando di
 * preservazione IMMEDIATA + "NON è un summary". Più forte di anti-deflect sull'urgenza. ⚠ È anche più a rischio di
 * ri-innescare la deflessione F24 (spinta forte a salvare) → l'A/B misura se l'urgenza aiuta o dirotta.
 */
const SAVE_CLOSER_URGENT =
  " ACT NOW: after this turn those earlier messages are GONE — you will not be able to read them back. Preserve every" +
  ' fact you still need IMMEDIATELY, this turn, with note("<fact>")/set_var. This is NOT a summary and NOT a stopping' +
  " point: save what must survive, then keep going with the task. Do not narrate what you saved. If nothing is durable, do nothing.";
/** Stile della direttiva (A/B anti-deflessione). Default `narrow` = invariato. Altri: `anti-deflect`, `urgent`. */
export function loadEvictionDirectiveStyle() {
  const s = String(process.env.HARNESS_EVICTION_DIRECTIVE_STYLE || "narrow").toLowerCase().replace(/_/g, "-");
  return (s === "anti-deflect" || s === "urgent") ? s : "narrow";
}

/**
 * buildEvictionDirective — testo model-facing (EN) per i rung nudge/inject. Stringa vuota per off/require.
 * @param {string} rung
 * @param {{ digest?:string }} [opts]
 * @returns {string}
 */
export function buildEvictionDirective(rung, { digest = "", style = loadEvictionDirectiveStyle() } = {}) {
  if (rung !== "nudge" && rung !== "inject") return "";
  // NB: il framing ALLARGATO ("salva i tuoi PROGRESSI") è stato PROVATO e REVERTITO (F24, wiki/architecture/
  // lane-persistence-redesign.md): otteneva il save (0→7) ma DERAGLIAVA l'outcome (keep1 recall 0% vs 60%, deflessione
  // mezzi-fini). Lezione: il push-via-hint è un vicolo cieco → il fix è la cattura DETERMINISTICA (task-digest), non
  // spingere di più il modello. Qui resta il nudge STRETTO (originale): safety-net leggera, non aggressiva.
  // `style=anti-deflect` (A/B utente 2026-07-08) NON spinge di più: cambia il FRAMING per vietare la deflessione.
  const closer = style === "anti-deflect" ? SAVE_CLOSER_ANTIDEFLECT : style === "urgent" ? SAVE_CLOSER_URGENT : SAVE_CLOSER;
  const head =
    "MEMORY EVICTION — the earlier message(s) are leaving your working window; after this turn you will NOT see " +
    "them verbatim. If they contain a DURABLE fact worth remembering later (a name/nickname, a decision, a " +
    "constraint, a stable preference, an open thread), " +
    SAVE_HINT + SCRATCH_HINT + closer;
  if (rung === "inject" && digest) return head + "\n\nLeaving the window:\n" + digest;
  return head;
}

// ── FORMA dell'iniezione (esperimento F26 forma-vs-richiesta). Il difetto F25 è che la direttiva è appesa come
// messaggio `user` DOPO il turno-utente reale → sullo stesso assembly della probe l'ultima istruzione è la direttiva
// e il modello risponde a QUELLA, non alla probe (hijack). Isoliamo FORMA (posizione/canale) vs RICHIESTA (chiedere-di-
// salvare in sé) variando SOLO come/dove si inietta lo STESSO testo:
//   trailing = user-msg appeso in coda (ATTUALE; most-recent → risposto → hijack)
//   preuser  = user-msg inserito PRIMA dell'ultimo turno-utente (stesso canale/testo, posizione ambient → la probe
//              resta l'ultima istruzione). Se recall risale ≈ control → il difetto è la FORMA-posizione.
//   system   = system-msg in coda (canale diverso, non "risposto"). Testa la sensibilità-canale del modello.
export const EVICTION_INJECT_MODES = ["trailing", "preuser", "system"];

/**
 * loadEvictionInjectMode — modo d'iniezione. Env `HARNESS_EVICTION_INJECT_MODE` ∈ EVICTION_INJECT_MODES.
 * DEFAULT `preuser` dal 2026-07-06 (F26, utente msg 1290/1291): il vecchio default `trailing` è ATTIVAMENTE DANNOSO
 * — a keep1 dà recall 50% e 886K token (dirotta la probe + thrashing), mentre `preuser` (direttiva PRIMA dell'ultimo
 * turno, non-competitiva) dà 83% a 390K. `trailing`/`system` restano selezionabili via env. Fail-safe: valore ignoto → default.
 * @param {{ env?:Record<string,string|undefined> }} [opts]
 * @returns {"trailing"|"preuser"|"system"}
 */
export function loadEvictionInjectMode(opts = {}) {
  const env = opts.env ?? (typeof process !== "undefined" && process.env ? process.env : {});
  const raw = String(env.HARNESS_EVICTION_INJECT_MODE || "").trim().toLowerCase();
  return EVICTION_INJECT_MODES.includes(raw) ? /** @type {any} */ (raw) : "preuser";
}

/**
 * injectDirectiveMessages — PURO. Dato l'array `messages` assemblato e il testo `directive`, ritorna il NUOVO array
 * con la direttiva iniettata secondo `mode`. Nessuna mutazione dell'input. Stringa-direttiva vuota → array invariato.
 * @param {Array<{role:string,content:string}>} messages
 * @param {string} directive
 * @param {"trailing"|"preuser"|"system"} [mode]
 * @returns {Array<{role:string,content:string}>}
 */
export function injectDirectiveMessages(messages, directive, mode = "trailing") {
  const arr = Array.isArray(messages) ? messages.slice() : [];
  if (!directive) return arr;
  const wrapped = "<eviction_checkpoint>\n" + directive + "\n</eviction_checkpoint>";
  const userMsg = { role: "user", content: wrapped };
  if (mode === "system") return arr.concat([{ role: "system", content: wrapped }]);
  if (mode === "preuser") {
    if (arr.length === 0) return [userMsg];
    return arr.slice(0, -1).concat([userMsg, arr[arr.length - 1]]); // direttiva PRIMA dell'ultimo turno (ambient)
  }
  return arr.concat([userMsg]); // trailing (default): most-recent
}

/**
 * buildOobPrompt — messaggi per la chiamata DEDICATA out-of-band (rung require, Impl-2). Focalizzata SOLO sul
 * salvare (attenzione piena = "escala il vincolo non il contesto"). L'output è vincolato a `SAVE:`/`NONE`.
 * @param {{ digest?:string }} [opts]
 * @returns {Array<{role:string,content:string}>}
 */
export function buildOobPrompt({ digest = "" } = {}) {
  return [
    {
      role: "system",
      content:
        "You extract DURABLE facts to remember from messages that are leaving a chat's memory window. A durable " +
        "fact is a name/nickname, a decision, a constraint, a stable preference, or an open thread — something " +
        "that will matter many turns later. Ignore small talk and transient details. Reply with ONLY the facts " +
        "to save, one per line, each as `SAVE: <fact>`. If nothing is durable, reply with exactly `NONE`.",
    },
    { role: "user", content: "Messages leaving the window:\n" + digest },
  ];
}

/**
 * parseOobSave — estrae i fatti da salvare dalla risposta OOB (lenient). `NONE` (in qualsiasi riga) → [].
 * @param {string} responseText
 * @returns {Array<{text:string}>}
 */
export function parseOobSave(responseText) {
  if (typeof responseText !== "string") return [];
  const out = [];
  for (const rawLine of responseText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^none\b/i.test(line)) return [];
    const m = line.match(/^save\s*:\s*(.+)$/i);
    if (m && m[1].trim()) out.push({ text: m[1].trim() });
  }
  return out;
}

/**
 * extractChatText — testo dell'assistant da una risposta OpenAI-compatible (vLLM) o ollama (/api/chat|/api/generate).
 * @param {unknown} data
 * @returns {string}
 */
export function extractChatText(data) {
  if (!data || typeof data !== "object") return "";
  const d = /** @type {any} */ (data);
  const choice = Array.isArray(d.choices) ? d.choices[0] : null; // OpenAI-compatible
  if (choice && choice.message && typeof choice.message.content === "string") return choice.message.content;
  if (d.message && typeof d.message.content === "string") return d.message.content; // ollama /api/chat
  if (typeof d.response === "string") return d.response; // ollama /api/generate
  return "";
}

/**
 * callModelOutOfBand — chiamata DEDICATA fuori-conversazione all'endpoint del modello (Impl-2 / spike OOB).
 * NON tocca la conversazione: la richiesta non entra mai nella storia; persiste solo l'EFFETTO (i fatti salvati
 * dal caller via note/set_var). `fetchImpl` iniettabile → testabile senza rete (come http-request.mjs).
 * ⚠ La RISOLUZIONE dell'endpoint dal config di pi è il passo di validazione LIVE residuo (vedi todo NEW-A).
 * @param {{ endpoint:string, model?:string, messages:Array<{role:string,content:string}>, apiKey?:string,
 *           fetchImpl?:Function, timeoutMs?:number }} args
 * @returns {Promise<{ok:boolean, text?:string, saves?:Array<{text:string}>, error?:string}>}
 */
export async function callModelOutOfBand({ endpoint, model, messages, apiKey, fetchImpl, timeoutMs = 20000 } = {}) {
  const fetchFn = fetchImpl || (typeof globalThis !== "undefined" ? globalThis.fetch : undefined);
  if (typeof fetchFn !== "function") return { ok: false, error: "no fetch implementation available" };
  if (typeof endpoint !== "string" || !endpoint) return { ok: false, error: "endpoint required" };
  if (!Array.isArray(messages) || messages.length === 0) return { ok: false, error: "messages required" };
  const headers = { "content-type": "application/json" };
  if (apiKey) headers["authorization"] = `Bearer ${apiKey}`;
  const ms = Number.isFinite(timeoutMs) ? Math.min(Math.max(timeoutMs, 1), 120_000) : 20_000;
  let resp;
  try {
    resp = await fetchFn(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: model || "local", messages, temperature: 0, stream: false }),
      signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined,
    });
  } catch (e) {
    const msg = e && e.name === "TimeoutError" ? `oob request timed out after ${ms}ms` : `oob request failed: ${e && e.message ? e.message : String(e)}`;
    return { ok: false, error: msg };
  }
  let data;
  try {
    data = typeof resp.json === "function" ? await resp.json() : JSON.parse(String(resp.body ?? ""));
  } catch {
    return { ok: false, error: "oob response not JSON" };
  }
  const text = extractChatText(data);
  return { ok: true, text, saves: parseOobSave(text) };
}

export default {
  EVICTION_RUNGS,
  EVICTION_INJECT_MODES,
  loadEvictionConfig,
  loadEvictionInjectMode,
  evictionEvent,
  summarizeEvicting,
  buildEvictionDirective,
  injectDirectiveMessages,
  buildOobPrompt,
  parseOobSave,
  extractChatText,
  callModelOutOfBand,
};

/**
 * turn-trace-lib — funzioni PURE di turn-trace (estratte da .pi/extensions/turn-trace.ts per testabilità).
 * Analizzano il payload che esce verso il provider: system text, conteggi native, tool-result detection, lane overlap.
 *
 * Fix 2026-07-03: `isSystemRole` riconosce ANCHE `role:"developer"` (OpenAI-completions su pi/ollama/gemini usa
 * "developer" per il system) — prima solo "system" → su ollama systemLen/laneLines risultavano SEMPRE 0 (trace cieco).
 */

/** Testo da un content stringa | array di blocchi {type,text}. Difensivo. */
export function contentText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((b) => (typeof b === "string" ? b : typeof b?.text === "string" ? b.text : "")).join("");
  }
  return "";
}

/** Ruolo "di sistema": Anthropic=system; OpenAI-completions (pi/ollama/gemini)=developer. Riconoscerli ENTRAMBI. */
export function isSystemRole(role) {
  return role === "system" || role === "developer";
}

/** System prompt dal payload (Anthropic: campo `system`; OpenAI-completions: messaggio role=system|developer). */
export function extractSystemText(payload) {
  if (!payload || typeof payload !== "object") return "";
  if (typeof payload.system === "string") return payload.system;
  if (Array.isArray(payload.system)) return contentText(payload.system);
  if (Array.isArray(payload.messages)) {
    const sm = payload.messages.find((m) => m && isSystemRole(m.role));
    if (sm) return contentText(sm.content);
  }
  return "";
}

/** Un messaggio role=user che però è un TOOL-RESULT (formato Anthropic: content con blocchi type:"tool_result"). */
export function isToolResult(m) {
  return Array.isArray(m?.content) && m.content.some((b) => b && (b.type === "tool_result" || b.type === "tool-result"));
}

/** Info sull'array messaggi NATIVO (escluso il system/developer). */
export function messagesInfo(payload) {
  const msgs = payload && Array.isArray(payload.messages) ? payload.messages : [];
  const nonSystem = msgs.filter((m) => m && !isSystemRole(m.role));
  return {
    count: nonSystem.length,
    roles: nonSystem.map((m) => String(m.role ?? "?")),
    // turni-utente GENUINI: escludi i tool-result (role=user ma output-di-tool) → altrimenti [domanda→tool→result]
    // conterebbe 2 "user" e falserebbe il check anti-doppia-chat.
    userTurns: nonSystem.filter((m) => m.role === "user" && !isToolResult(m)).length,
    toolResults: nonSystem.filter((m) => isToolResult(m)).length,
    text: nonSystem.map((m) => contentText(m.content)).join("\n"),
  };
}

/**
 * Array messaggi NATIVO come [{role, text, toolResult}] (system/developer escluso) — per il DUMP umano completo del
 * turno (last-turn-full.md, utente msg 825/827: "vedi turno per turno cosa arriva a ollama"). Difensivo su shape.
 */
export function messagesDump(payload) {
  const msgs = payload && Array.isArray(payload.messages) ? payload.messages : [];
  return msgs
    .filter((m) => m && !isSystemRole(m.role))
    .map((m) => ({ role: String(m.role ?? "?"), text: contentText(m.content), toolResult: isToolResult(m) }));
}

const norm = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/** Sovrapposizione lane↔native: quante righe della lane <messages_with_user> ricompaiono nell'array nativo. */
export function laneOverlap(systemText, nativeText) {
  const m = String(systemText ?? "").match(/<messages_with_user[^>]*>([\s\S]*?)<\/messages_with_user>/);
  if (!m) return { laneLines: 0, overlap: 0 };
  const lines = m[1].split("\n").map((l) => l.trim()).filter((l) => /^\[[^\]]+\]/.test(l));
  const nn = norm(String(nativeText ?? ""));
  let overlap = 0;
  for (const l of lines) {
    const probe = norm(l.replace(/^\[[^\]]+\]\s*/, "")).slice(0, 40);
    if (probe.length >= 8 && nn.includes(probe)) overlap++;
  }
  return { laneLines: lines.length, overlap };
}

/**
 * Artefatto RAW del dump per-turno: ESATTAMENTE ciò che riceve il modello (system + array messaggi nativo),
 * byte-fedele a meno della redazione secrets (l'estensione redige PRIMA di chiamare → la lib resta pura). NIENTE
 * nomi-tag né annotazioni iniettate → una ricerca su `.system` / `.messages[].text` è affidabile: nessun falso
 * positivo come quello del dump .md che il 2026-07-05 ha depistato la diagnosi di modularità (header col literal
 * "<how_memory_works>" → sembrava presente anche quando il modello NON lo riceveva). Autoritativo per check programmatici.
 * @param {{ts?, convId?, system?:string, messages?:{role:string,text:string,toolResult?:boolean}[]}} input (già redatto)
 */
export function buildRawDump({ ts = null, convId = null, system = "", messages = [] } = {}) {
  return {
    ts, convId,
    system: String(system ?? ""),
    messages: (Array.isArray(messages) ? messages : []).map((m) => ({
      role: String(m?.role ?? "?"),
      toolResult: !!m?.toolResult,
      text: String(m?.text ?? ""),
    })),
  };
}

// marker di fence: il contenuto VERBATIM del modello sta fra questi; NON contengono nomi-tag → nessun falso positivo.
export const VERBATIM_SYS_MARK = "===== VERBATIM: SYSTEM/DEVELOPER PROMPT =====";
export const VERBATIM_NATIVE_MARK = "===== VERBATIM: NATIVE MESSAGES =====";
export const VERBATIM_END_MARK = "===== END VERBATIM =====";

/**
 * Dump umano (.md) dell'ultimo turno. Il testo VERBATIM del modello è fra i marker VERBATIM_*; le righe che iniziano
 * con '#'/'-'/'###' e i marker sono ANNOTAZIONI del trace (NON viste dal modello). FIX 2026-07-05: l'header NON contiene
 * più i literal dei nomi-tag (<how_memory_works>, <messages_with_user>, …) che causavano falsi positivi nel grep — il
 * debug ora rispecchia ESATTAMENTE lo stato del modello. Per check programmatici usare buildRawDump (last-turn-raw.json).
 * @param {{ts?, convId?, system?:string, messages?:{role:string,text:string,toolResult?:boolean}[], tokens?}} input (già redatto)
 */
export function buildFullMd({ ts = null, convId = null, system = "", messages = [], tokens = null } = {}) {
  const msgs = Array.isArray(messages) ? messages : [];
  const roles = msgs.map((m) => String(m?.role ?? "?"));
  return [
    `# turn-trace — payload COMPLETO (ultimo turno)`,
    `- ts: ${ts}  ·  convId: ${convId}`,
    `- native messages: ${msgs.length} (${roles.join(", ")})  ·  tokens: ${tokens ?? "?"}`,
    `- FEDELTÀ: il testo verbatim del modello è fra i marker "===== VERBATIM… ====="; le righe che iniziano con`,
    `  '#'/'-'/'###' e i marker sono annotazioni del trace, NON viste dal modello. Check programmatici → last-turn-raw.json.`,
    ``,
    `${VERBATIM_SYS_MARK} (${String(system ?? "").length} char)`,
    String(system ?? ""),
    ``,
    `${VERBATIM_NATIVE_MARK} (${msgs.length}) — ciò che il modello tratta come "la conversazione"`,
    ...msgs.map((m, i) => `\n### native[${i}] role=${String(m?.role ?? "?")}${m?.toolResult ? " (tool_result)" : ""}\n${String(m?.text ?? "")}`),
    ``,
    VERBATIM_END_MARK,
  ].join("\n");
}

export default { contentText, isSystemRole, extractSystemText, isToolResult, messagesInfo, messagesDump, laneOverlap, buildRawDump, buildFullMd };

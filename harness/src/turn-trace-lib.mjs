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

export default { contentText, isSystemRole, extractSystemText, isToolResult, messagesInfo, laneOverlap };

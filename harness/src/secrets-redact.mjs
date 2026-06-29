/**
 * secrets-redact — logica DETERMINISTICA di redazione segreti (F-harness, model-independent).
 *
 * Estratta da .pi/extensions/secrets-guardrail.ts in un modulo .mjs testabile con node puro
 * (stesso pattern di vars-queue.mjs / context-assembler.mjs: la logica vive in src/, l'extension
 * è un thin-wrapper). Implementa ../../wiki/concepts/secret-section-exfiltration-defense.md.
 *
 * Difesa-in-profondità: anche se il modello viene ingannato (prompt-injection) a echeggiare un
 * segreto in un tool_result, il guardrail lo redige PRIMA che rientri nel context — a prescindere
 * dall'allineamento del modello.
 */

/** Pattern statici di segreti noti. NB: include le chiavi Google `AIza…` (es. GEMINI_API_KEY) — aggiunto 2026-06-29. */
export const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/g, // generic API key (OpenAI-style)
  /ghp_[A-Za-z0-9]{36}/g, // GitHub PAT
  /AKIA[0-9A-Z]{16}/g, // AWS access key id
  /AIza[0-9A-Za-z_\-]{35}/g, // Google API key (GEMINI_API_KEY, Maps, ecc.) — gap colmato 2026-06-29
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g, // PEM private key header
];

/**
 * Redige da `text` i match dei pattern statici + i segreti dinamici (literal match).
 * @param {string} text
 * @param {Iterable<string>} [dynamicSecrets] valori per-sessione registrati via add_secret (in-memory).
 * @returns {{ redacted: string, hit: boolean }}
 */
export function redactText(text, dynamicSecrets = []) {
  let hit = false;
  let out = String(text);
  for (const re of SECRET_PATTERNS) {
    re.lastIndex = 0; // reset stato della regex globale prima di test()
    if (re.test(out)) {
      hit = true;
      out = out.replace(re, "[REDACTED-SECRET]");
    }
  }
  // segreti dinamici: redatti prima i più lunghi (evita match parziali)
  for (const s of [...dynamicSecrets].sort((a, b) => b.length - a.length)) {
    if (s && out.includes(s)) {
      hit = true;
      out = out.split(s).join("[REDACTED-SECRET]");
    }
  }
  return { redacted: out, hit };
}

export default redactText;

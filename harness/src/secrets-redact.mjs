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

/**
 * Pattern statici di segreti noti — SHAPE ad alta confidenza (basso tasso di falsi-positivi sull'output di un
 * coding assistant). Coprono le forme reali più comuni. NB DELIBERATO: NON c'è un pattern generico `key=value`
 * (es. `password = "..."`) perché mutilerebbe l'output di codice legittimo (over-redaction visibile all'utente)
 * → per i segreti non-shape si usa `add_secret` (literal match esatto, niente FP). (review-loop #3 2026-06-29, P2.)
 */
export const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/g, // OpenAI-style API key (con trattino)
  /[sr]k_(?:live|test)_[A-Za-z0-9]{16,}/g, // Stripe secret/restricted key (sk_live_/rk_test_… underscore) — gap 2026-06-29
  /ghp_[A-Za-z0-9]{36}/g, // GitHub PAT (classic)
  /gh[ousr]_[A-Za-z0-9]{36}/g, // GitHub token (gho_/ghu_/ghs_/ghr_) — OAuth/user/server/refresh
  /github_pat_[A-Za-z0-9_]{22,}/g, // GitHub fine-grained PAT
  /xox[baprs]-[A-Za-z0-9-]{10,}/g, // Slack token
  /AKIA[0-9A-Z]{16}/g, // AWS access key id
  /AIza[0-9A-Za-z_\-]{35}/g, // Google API key (GEMINI_API_KEY, Maps, ecc.)
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT (header.payload.signature base64url)
  /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/g, // Authorization: Bearer <token lungo>
  /[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]{3,}@/gi, // basic-auth URL (scheme://user:pass@host)
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g, // PEM private key header
];

/**
 * Redige da `text` i match dei pattern statici + i segreti dinamici (literal match).
 * @param {string} text
 * @param {Iterable<string>} [dynamicSecrets] valori per-sessione registrati via add_secret (in-memory).
 * @param {{ staticPatterns?: boolean }} [opts] staticPatterns=false → SOLO dynamic-secrets (canale tool_call:
 *   non mutila codice/comandi legittimi che contengano shape statiche). Default true (tool_result/output).
 * @returns {{ redacted: string, hit: boolean }}
 */
export function redactText(text, dynamicSecrets = [], opts = {}) {
  let hit = false;
  let out = String(text);
  if (opts.staticPatterns !== false) {
    for (const re of SECRET_PATTERNS) {
      re.lastIndex = 0; // reset stato della regex globale prima di test()
      if (re.test(out)) {
        hit = true;
        out = out.replace(re, "[REDACTED-SECRET]");
      }
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

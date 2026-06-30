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
  // ── LLM / AI ──
  /sk-ant-(?:api03-)?[A-Za-z0-9_\-]{20,}/g, // Anthropic Claude
  /sk-proj-[A-Za-z0-9_\-]{20,}/g, // OpenAI project key
  /sk-(?:svcacct|admin)-[A-Za-z0-9_\-]{20,}/g, // OpenAI service-account/admin key
  /sk-[A-Za-z0-9]{20,}/g, // OpenAI classic
  /hf_[A-Za-z0-9]{30,}/g, // HuggingFace
  // ── Pagamenti ──
  /[sr]k_(?:live|test)_[A-Za-z0-9]{16,}/g, // Stripe secret/restricted
  /whsec_[A-Za-z0-9]{32,}/g, // Stripe webhook secret
  /sq0(?:atp|csp)-[A-Za-z0-9_\-]{22,}/g, // Square
  // ── Git hosting ──
  /ghp_[A-Za-z0-9]{36}/g, // GitHub PAT classic
  /gh[ousr]_[A-Za-z0-9]{36}/g, // GitHub gho_/ghu_/ghs_/ghr_
  /github_pat_[A-Za-z0-9_]{22,}/g, // GitHub fine-grained PAT
  /gl(?:pat|oas|ptt|rt|cbt|imt|soat|ldt|agent)-[A-Za-z0-9_\-]{20,}/g, // GitLab (PAT/OAuth/trigger/runner/deploy…)
  /\bGR1348941[A-Za-z0-9_\-]{20,}/g, // GitLab runner registration token
  // ── Cloud ──
  /(?:AKIA|ASIA|AROA|AIDA)[0-9A-Z]{16}/g, // AWS access key id (long-term/temp/role/user)
  /AIza[0-9A-Za-z_\-]{35}/g, // Google API key (GEMINI_API_KEY, Maps…)
  /ya29\.[0-9A-Za-z_\-]{20,}/g, // Google OAuth access token
  /AccountKey=[A-Za-z0-9+/]{86}==/g, // Azure storage account key
  /dop_v1_[a-f0-9]{64}/g, // DigitalOcean PAT
  /do[or]_v1_[a-f0-9]{64}/g, // DigitalOcean OAuth/refresh
  /dapi[0-9a-f]{32,}/g, // Databricks
  // ── Comms / SaaS ──
  /xox[baprs]-[A-Za-z0-9-]{10,}/g, // Slack token
  /https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9_\/-]{20,}/g, // Slack webhook URL
  /SG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}/g, // SendGrid
  /SK[0-9a-fA-F]{32}/g, // Twilio API key SID
  /key-[0-9a-fA-F]{32}/g, // Mailgun
  /\b\d{8,10}:AA[A-Za-z0-9_\-]{33}\b/g, // Telegram bot token
  // ── Dev tools ──
  /npm_[A-Za-z0-9]{36}/g, // npm token
  /pypi-AgEIcHlwaS[A-Za-z0-9_\-]{50,}/g, // PyPI token
  /dp\.(?:pt|st|ct|sa)\.[A-Za-z0-9]{40,}/g, // Doppler
  /lin_api_[A-Za-z0-9]{40,}/g, // Linear
  /PMAK-[a-f0-9]{24}-[a-f0-9]{34}/g, // Postman
  /ATATT[A-Za-z0-9_\-=]{20,}/g, // Atlassian API token
  /shp(?:at|ss|ca|pa)_[a-fA-F0-9]{32}/g, // Shopify
  /NRAK-[A-Z0-9]{27}/g, // New Relic
  // ── Generici ──
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT
  /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/g, // Authorization: Bearer
  /[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]{3,}@/gi, // basic-auth URL (mongodb/postgres/cloudinary…)
  // chiave privata PEM — BLOCCO INTERO multi-linea (review P1: prima si redava solo l'header, il CORPO leakava)
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/g,
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/g, // fallback: header senza footer
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

/**
 * secrets-guardrail — Fase 0.4 (walking skeleton)
 *
 * Redige output che matchano la secrets-map, via hook `tool_result`.
 * È la difesa deterministica lato harness (F-harness) complementare alla skill
 * anti-exfiltration addestrata nei pesi (S).
 *
 * API reale: on("tool_result", (e: ToolResultEvent) => ToolResultEventResult).
 *   e.content : (TextContent | ImageContent)[]   ← array di blocchi, NON stringa.
 *   result    : { content?, details?, isError? }.
 * Fase 1 (anticipata): secrets-map DINAMICA in aggiunta ai pattern statici. Il tool
 * `add_secret` registra un valore segreto **in-memory** (per-processo, MAI su disco) che il
 * guardrail redige da ogni output di tool — i "riferimenti opachi per-sessione" di
 * ../../wiki/concepts/secret-section-exfiltration-defense.md.
 *
 * SCOPE: questa estensione è il lato EGRESS (output→tool / tool_result / injection sink-gated). Il lato INGRESS
 * (cattura valori secret-shaped dall'INPUT utente PRIMA del provider) vive nell'estensione SEPARATA
 * `regex-ingress.ts` (più invasiva: muta ogni input → disattivabile a parte). Coordinano via il singleton condiviso
 * `src/sealed-secrets.mjs`. Soft-dep: regex-ingress standalone = anti-provider; +questa = anche anti-transcript.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
// Logica di redazione condivisa e testabile (src/secrets-redact.mjs, smoke-test dedicato).
// Pattern statici (incl. Google AIza / GEMINI_API_KEY) + dynamic-secrets per literal match.
import { redactText } from "../../src/secrets-redact.mjs";
// secrets-map DINAMICA: registry CONDIVISO (singleton di processo) → la stessa secrets-map è vista anche
// da var-ops `render_template` (fix P0 2026-06-29: prima era module-private qui e render_template la bypassava).
import { addSecret, getDynamicSecrets, clearSecrets } from "../../src/secrets-registry.mjs";
// SEALED-SECRETS (msg 577/578/579): registry sigillato + reference-injection + sink-gating. Il valore non entra MAI
// nel context del modello; provisioning out-of-band (env SEALED_SECRET_* + metadata .pi/secrets.config.json).
import { loadFromEnv, listSecretsMeta, injectIntoStrings, clearSealed } from "../../src/sealed-secrets.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";
import { readFileSync, existsSync } from "node:fs";

const HARNESS_CFG = loadHarnessConfig();
// Tool di SCRITTURA-FILE strutturati (il loro sink è un path, non un host → hasFileOrPipeExfil non li vede). Usati dal
// gating opt-out allowSecretToFile. (I redirect bash `>`/`tee` sono già coperti da hasFileOrPipeExfil nel sink-gating.)
const FILE_WRITE_TOOLS = new Set(["write", "create", "write_file", "str_replace_editor", "edit", "apply_patch", "new_file", "str_replace", "insert"]);
const SECRETS_CONFIG_PATH = ".pi/secrets.config.json"; // SOLO metadata (nome→{description,allowedSinks}); MAI valori.

/** Carica la metadata dei sealed-secrets (no valori) da .pi/secrets.config.json. Fail-safe a {}. */
function loadSecretMeta(): Record<string, { description?: string; allowedSinks?: string[] }> {
  try {
    if (existsSync(SECRETS_CONFIG_PATH)) return JSON.parse(readFileSync(SECRETS_CONFIG_PATH, "utf-8")) || {};
  } catch {
    /* malformato → nessuna metadata (fail-safe) */
  }
  return {};
}

/** Raccoglie "slot" {get,set} per ogni valore-STRINGA in un oggetto/array di argomenti (ricorsivo). */
function collectStringSlots(node: any, slots: { get: () => string; set: (v: string) => void }[]): void {
  if (Array.isArray(node)) {
    node.forEach((v, i) => {
      if (typeof v === "string") slots.push({ get: () => node[i], set: (x) => (node[i] = x) });
      else if (v && typeof v === "object") collectStringSlots(v, slots);
    });
  } else if (node && typeof node === "object") {
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === "string") slots.push({ get: () => node[k], set: (x) => (node[k] = x) });
      else if (v && typeof v === "object") collectStringSlots(v, slots);
    }
  }
}

export default function (pi: ExtensionAPI) {
  // Provisioning OUT-OF-BAND dei sealed-secrets: env SEALED_SECRET_<NAME> (valore) + metadata da config (no valori).
  // Il valore non passa mai dal modello. Caricato al bind dell'extension.
  loadFromEnv(process.env, loadSecretMeta());
  // Isolamento di sessione: svuota la secrets-map dinamica + il registry sigillato a fine sessione → i segreti della
  // sessione A NON restano residenti nella sessione B (reload/resume/new/fork sono in-process). (review-loop #2 P2.)
  pi.on("session_shutdown", () => { clearSecrets(); clearSealed(); });

  // NB: l'INGRESS regex (cattura valori secret-shaped dall'INPUT utente, hook `input`+transform) è stato ESTRATTO
  // nell'estensione separata `regex-ingress.ts` (utente msg 619): muta ogni input → più invasivo → disattivabile a
  // parte. Coordina con questa via il singleton `src/sealed-secrets.mjs`. Qui resta SOLO il lato egress.

  // SEALED-SECRETS — vista per il modello: nome+descrizione+allowedSinks, MAI il valore.
  pi.registerTool({
    name: "list_secrets",
    label: "List available sealed secrets (names only)",
    description:
      "List the available SEALED secrets: for each, only NAME, description, allowedSinks (allowed hosts) and fingerprint (non-reversible hash, to verify its identity without seeing the value).\n" +
      "HOW THEY WORK (important — do not misunderstand):\n" +
      "• `{{secret:NAME}}` is a REFERENCE to a value that YOU do not hold and will NEVER see. Use it FREELY in a tool's arguments — writing a `.env`, an API call, a header — as if it were the value.\n" +
      "• At execution time the harness replaces the reference with the REAL VALUE, ONLY toward the allowedSinks. So the file/command receives the real value (useful: you can configure a `.env` or authenticate a call without ever seeing the key). The value NEVER reaches you nor the LLM provider: that is by design, not a limitation.\n" +
      "• If you RE-READ a file or an output containing the secret, you will see `[REDACTED-SECRET]`: it means the value IS PRESENT (on disk/in the output) but hidden from YOU (read-time redaction) — NOT that the file is empty or redacted. Do not say 'I can't' or 'it was redacted': say 'the value is there, it's the harness hiding it from me'.\n" +
      "• If a use gets blocked (`sink-gating`), the secret is missing allowedSinks for that host: ask the user to declare them. You have full power to USE secrets; you simply do not SEE them.",
    parameters: Type.Object({}),
    async execute() {
      const meta = listSecretsMeta();
      return { content: [{ type: "text", text: JSON.stringify(meta, null, 2) }], details: { count: meta.length } };
    },
  });
  pi.registerTool({
    name: "request_secret",
    label: "Request a secret you need (ask the user)",
    description:
      "Signal that you need a secret NOT yet available for an operation. You do NOT receive the value: the user provisions it out-of-band (env `SEALED_SECRET_<NAME>` / CLI `set-secret`). Use this to ask, then `{{secret:NAME}}` once it is available.",
    parameters: Type.Object({
      name: Type.String({ description: "Name of the requested secret (e.g. OPENAI_KEY)." }),
      why: Type.String({ description: "Why you need it / for which operation/host." }),
    }),
    async execute(_t: string, p: any, _signal: any, _onUpdate: any, ctx: any) {
      ctx?.ui?.notify?.(`Il modello richiede il secret '${p.name}' — ${p.why}. Provisionalo: env SEALED_SECRET_${p.name}=… (o CLI set-secret). Il valore NON andrà al modello.`, "warning");
      return {
        content: [{ type: "text", text: `Requested secret '${p.name}'. The user must provision it (env SEALED_SECRET_${p.name} or CLI set-secret) — you will NOT receive the value; use it as {{secret:${p.name}}}.` }],
        details: { ok: true },
      };
    },
  });

  pi.registerTool({
    name: "add_secret",
    label: "Register a session secret to redact",
    description:
      "Register a secret value (in-memory, NEVER on disk) that the guardrail redacts from EVERY tool output AND from interpolation (render_template). Opaque per-session reference (deterministic anti-exfiltration).",
    parameters: Type.Object({ value: Type.String({ description: "The secret value to redact (opaque, high entropy)." }) }),
    async execute(_toolCallId: string, params: any) {
      // Guardia min-length/diversità/cap: un valore corto o poco-vario corromperebbe ogni output (footgun/DoS). (P2)
      const r = addSecret(params.value);
      if (!r.ok) {
        return {
          content: [{ type: "text", text: `add_secret REJECTED: ${r.reason}. Register an opaque high-entropy value (real token/key).` }],
          details: { ok: false },
        };
      }
      return {
        content: [{ type: "text", text: `secret registered (${r.size} active in the dynamic secrets-map)` }],
        details: { ok: true },
      };
    },
  });

  pi.on("tool_result", (event, ctx) => {
    let anyHit = false;
    const content = event.content.map((block) => {
      if (block.type === "text") {
        const { redacted, hit } = redactText(block.text, getDynamicSecrets());
        if (hit) {
          anyHit = true;
          return { ...block, text: redacted };
        }
      }
      return block;
    });
    // review P2: redige ANCHE `details` (non solo content) — può finire nel session-log NATIVO di pi
    // (createToolResultMessage lo include nel messaggio toolResult persistito). Redazione ricorsiva su una COPIA.
    // review-full P1: il clone JSON può LANCIARE (circolare/BigInt) → isolato in try/catch così un fallimento su
    // `details` NON fa cadere la redazione di `content` già calcolata (sarebbe un leak del content non-redatto).
    let details = (event as any).details;
    try {
      if (details && typeof details === "object") {
        const clone = JSON.parse(JSON.stringify(details));
        const before = JSON.stringify(clone);
        redactArgsInPlace(clone, getDynamicSecrets(), { staticPatterns: true });
        if (JSON.stringify(clone) !== before) { anyHit = true; details = clone; }
      }
    } catch { /* details non-clonabile → si redige comunque il content; details resta l'originale */ }
    if (!anyHit) return; // nessun match → lascia passare l'output originale
    ctx.ui.notify("secrets-guardrail: output redatto (match secrets-map)", "warning");
    return details !== (event as any).details ? { content, details } : { content };
  });

  // CANALE EGRESS DEGLI ARGOMENTI tool_call (review-loop #3 2026-06-29, P2 tool-call-egress): un modello indotto
  // (prompt-injection) potrebbe piazzare un SEGRETO REGISTRATO negli argomenti di un tool che esce dal processo
  // (es. una URL di curl) per esfiltrarlo — la redazione su tool_result NON copre questo verso (modello→tool).
  // Qui si redigono i SOLI dynamic-secrets (registrati = riferimenti opachi, NON da passare raw) dagli argomenti,
  // mutando event.input in place. NB staticPatterns:false: NON si redigono le shape statiche per non mutilare
  // codice/comandi legittimi che le contengano (un fixture con AIza… finto, un example key in un write_file).
  pi.on("tool_call", (event) => {
    const input = (event as any).input;
    if (!input || typeof input !== "object") return;
    const toolName = String((event as any).toolName ?? (event as any).name ?? "");
    // ORDINE (importante): (1) redazione-EGRESS dei dynamic-secrets RAW negli args (un add_secret messo raw = exfil);
    // i riferimenti `{{secret:NAME}}` NON sono valori → non toccati. (2) INJECTION-gated dei sealed: sostituisce i ref
    // col valore reale DOPO la redazione (così il valore appena iniettato NON viene re-redatto — i sealed sono nel Set
    // egress per il backstop sul tool_result). Se anche un solo ref è bloccato dal sink-gating → BLOCCA il tool-call.
    redactArgsInPlace(input, getDynamicSecrets());
    const slots: { get: () => string; set: (v: string) => void }[] = [];
    collectStringSlots(input, slots);
    const r = injectIntoStrings(slots.map((s) => s.get()), HARNESS_CFG.secrets.sinkGating);
    if (r.blocked.length) {
      return {
        block: true,
        reason:
          `sealed-secrets: secret use blocked (sink-gating ${HARNESS_CFG.secrets.sinkGating}) — ` +
          r.blocked.map((b) => `${b.name}: ${b.reason}`).join("; ") +
          ". The value was NOT inserted. Use the secret only toward its allowedSinks.",
      };
    }
    // file-write opt-OUT (utente msg 638): di default il modello PUÒ scrivere un segreto in un file locale (.env
    // provisioning); se allowSecretToFile=false, blocca l'iniezione di un sealed-secret nei tool di scrittura-file
    // STRUTTURATI (write/create/edit — che hasFileOrPipeExfil non vede, a differenza dei redirect bash `>`).
    if (r.injected.length && HARNESS_CFG.secrets.allowSecretToFile === false && FILE_WRITE_TOOLS.has(toolName)) {
      return {
        block: true,
        reason: `sealed-secrets: writing a secret to a file blocked (secrets.allowSecretToFile=false) via '${toolName}'. The value was NOT written. Enable allowSecretToFile, or provision the file out-of-band.`,
      };
    }
    if (r.injected.length) r.strings.forEach((v, i) => slots[i].set(v)); // sostituzione in-place dei valori reali
    // nessun return se nulla è bloccato → il tool prosegue con i valori iniettati (mutazione in-place documentata).
  });
}

/** Redige in-place (ricorsivo) i valori-stringa di un oggetto/array. staticPatterns=false (default, args tool_call:
 * non mutila codice/comandi con shape statiche) · true (details/output: redazione piena). */
function redactArgsInPlace(node: any, dynamicSecrets: Iterable<string>, opts: { staticPatterns?: boolean } = {}): void {
  const sp = opts.staticPatterns === true;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const v = node[i];
      if (typeof v === "string") {
        const { redacted, hit } = redactText(v, dynamicSecrets, { staticPatterns: sp });
        if (hit) node[i] = redacted;
      } else if (v && typeof v === "object") redactArgsInPlace(v, dynamicSecrets, opts);
    }
  } else if (node && typeof node === "object") {
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === "string") {
        const { redacted, hit } = redactText(v, dynamicSecrets, { staticPatterns: sp });
        if (hit) node[k] = redacted;
      } else if (v && typeof v === "object") redactArgsInPlace(v, dynamicSecrets, opts);
    }
  }
}

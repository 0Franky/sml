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
import { loadFromEnv, listSecretsMeta, injectIntoStrings, clearSealed, hasSecret, isValidSinkHost, validateSecretRefs, previewSecretUse, ingestEnvContent, validateEnvPath } from "../../src/sealed-secrets.mjs";
// CONSENSO (node-puro, testabile senza jiti): Ask-con-diff + frizione reale (type-to-confirm) + degrade headless
// accurato + create-con-valore-digitato-dall'utente. Estratto da qui (i rami che prima erano inline nei tool).
import { askAndApplyEdit, askAndDestroy, askLocalHttp, askAndCreate } from "../../src/secrets-consent.mjs";
// canale TIPIZZATO http_request (ADR 2026-06-30, arch H2): injection+sink-gating sul SOLO url (new URL, niente shell).
import { executeHttpRequest } from "../../src/http-request.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";
import { readFileSync, existsSync, realpathSync } from "node:fs";
import { resolve, sep } from "node:path";

const HARNESS_CFG = loadHarnessConfig();
// Tool di SCRITTURA-FILE strutturati (il loro sink è un path, non un host → hasFileOrPipeExfil non li vede). Usati dal
// gating opt-out allowSecretToFile. (I redirect bash `>`/`tee` sono già coperti da hasFileOrPipeExfil nel sink-gating.)
const FILE_WRITE_TOOLS = new Set(["write", "create", "write_file", "str_replace_editor", "edit", "apply_patch", "new_file", "str_replace", "insert"]);
const SECRETS_CONFIG_PATH = ".pi/secrets.config.json"; // SOLO metadata (nome→{description,allowedSinks}); MAI valori.

/** Carica la metadata dei sealed-secrets (no valori) da .pi/secrets.config.json. Fail-safe a {}. */
function loadSecretMeta(): Record<string, { description?: string; allowedSinks?: string[]; redactEgress?: boolean; allowLocalHttp?: boolean }> {
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
      "List the available SEALED secrets: for each, only NAME, description, allowedSinks (allowed hosts), allowLocalHttp (whether it may be used over http toward loopback only — localhost/127.0.0.1), and fingerprint (non-reversible hash, to verify its identity without seeing the value).\n" +
      "HOW THEY WORK (important — do not misunderstand):\n" +
      "• `{{secret:NAME}}` is a REFERENCE to a value that YOU do not hold and will NEVER see. Use it FREELY in a tool's arguments — writing a `.env`, an API call, a header — as if it were the value.\n" +
      "• At execution time the harness replaces the reference with the REAL VALUE, ONLY toward the allowedSinks. So the file/command receives the real value (useful: you can configure a `.env` or authenticate a call without ever seeing the key). The value NEVER reaches you nor the LLM provider: that is by design, not a limitation.\n" +
      "• If you RE-READ a file or an output containing the secret, you will see `[REDACTED-SECRET]`: it means the value IS PRESENT (on disk/in the output) but hidden from YOU (read-time redaction) — NOT that the file is empty or redacted. Do not say 'I can't' or 'it was redacted': say 'the value is there, it's the harness hiding it from me'.\n" +
      "• If a use gets blocked (`sink-gating`): for an EXTERNAL host, call `request_sink(name, host, why)` so the user can allow that host (do NOT invent CLI commands). For an `http://localhost` (loopback) target, call `request_local_http(name, why)` (then use it in a SINGLE clean command — no ';'/'|'/'&&'/redirects). You have full power to USE secrets; you simply do not SEE them.",
    promptGuidelines: [
      "Secrets are managed IN-SESSION via tools, NEVER via the shell/CLI. To create a new one: propose_secret_create (you give the metadata only — the user types the value, you never see it). To let a secret reach a host: request_sink(name, host, why). To rename/edit (sink, description, allowLocalHttp): propose_secret_edit. To delete: propose_secret_destroy. You only PROPOSE — the user approves a clear before→after diff; widening permissions (new host, enabling allowLocalHttp) needs a stronger confirmation where the user must TYPE the host to confirm. Never invent or run CLI commands like `pi set-secret`/`pi update-secret` (they may not exist) — if unsure, verify (read a --help) instead of guessing.",
      "An `INGRESS_N` secret is a value the USER pasted: it is ALREADY sealed and usable as-is — it does NOT need to be re-provisioned. If it is blocked, it only lacks a sink: to 'use the token you pasted', call request_sink for its host (e.g. oauth.reddit.com). Do not tell the user to paste it again or to set an env var.",
      "Before using {{secret:NAME}}, if unsure the name is correct call check_secret_refs(text) — it confirms existence and suggests the closest name on a typo. Never read a secret value from a plaintext env var as a workaround for a blocked sealed secret: use {{secret:NAME}} and request the sink.",
    ],
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
    name: "request_local_http",
    label: "Ask the user to allow a secret over loopback http",
    description:
      "Ask the USER to allow a sealed secret to be used over http TOWARD LOOPBACK ONLY (localhost / 127.0.0.1) — e.g. a local-session JWT against a dev server. You CANNOT enable this yourself: only the user can accept (the harness opens a confirmation). The value stays sealed (you never see it, it is redacted from transcripts) and can NEVER be sent to an external host over http (external stays https-only). Use this when a {{secret:NAME}} use is blocked because the target is http://localhost.",
    parameters: Type.Object({
      name: Type.String({ minLength: 1, description: "Name of the sealed secret (must already exist)." }),
      why: Type.String({ minLength: 1, description: "Why you need local http (which local server/operation). Required, non-empty." }),
    }),
    async execute(_t: string, p: any, _signal: any, _onUpdate: any, ctx: any) {
      // Consenso ESPLICITO obbligatorio (utente msg 668: MAI auto-decisione del modello). Tutta la logica (guard +
      // dialog disclosa-scope + degrade headless accurato) vive in askLocalHttp (node-puro, testabile senza jiti).
      return askLocalHttp(ctx?.ui, !!ctx?.hasUI, p.name, p.why);
    },
  });

  // ───── LIFECYCLE in-sessione (utente msg 708/713/715/718) — grant-sink / edit / destroy / validate ─────
  // Comodità E sicurezza insieme (memory feedback_security_and_convenience_both_top): il modello PROPONE, l'utente
  // approva un Ask con DIFF chiaro (visivamente chiaro); il widening dei permessi alza la frizione. Mai auto-deciso.
  pi.registerTool({
    name: "request_sink",
    label: "Ask the user to let a secret reach a host",
    description:
      "Ask the USER to allow a sealed secret to be used toward a specific HOST (added to its allowedSinks). Use when a {{secret:NAME}} use is blocked because the host is not in allowedSinks (e.g. you must call an external API like oauth.reddit.com). You CANNOT grant it yourself: the harness shows the user a confirmation with the diff and only the user approves. For an http://localhost target use request_local_http instead. An INGRESS_N secret is a value the user pasted — to 'use the token you pasted' toward its API, call this with that host (do NOT ask the user to re-provision).",
    parameters: Type.Object({
      name: Type.String({ minLength: 1, description: "Name of the sealed secret (must already exist — see list_secrets)." }),
      host: Type.String({ minLength: 1, description: "Host to allow, e.g. 'oauth.reddit.com' (no scheme/path/port)." }),
      why: Type.String({ minLength: 1, description: "Why the secret must reach this host. Required, non-empty." }),
    }),
    async execute(_t: string, p: any, _signal: any, _onUpdate: any, ctx: any) {
      if (!hasSecret(p.name)) return { content: [{ type: "text", text: `Secret '${p.name}' does not exist. Ask the user to provision it (request_secret).` }], details: { ok: false } };
      const host = String(p.host ?? "").toLowerCase().trim();
      if (!isValidSinkHost(host)) return { content: [{ type: "text", text: `Invalid host '${p.host}' (give a domain/IP like 'oauth.reddit.com' — no scheme/path/port).` }], details: { ok: false } };
      const why = String(p.why ?? "").trim();
      if (!why) return { content: [{ type: "text", text: `Provide a non-empty 'why' (the user must see a reason before granting a host).` }], details: { ok: false } };
      return askAndApplyEdit(ctx?.ui, !!ctx?.hasUI, p.name, { addSinks: [host] }, why, "Concedere un host a");
    },
  });
  pi.registerTool({
    name: "propose_secret_edit",
    label: "Propose an edit to a secret (user approves the diff)",
    description:
      "Propose changes to an existing sealed secret — rename, add/remove a sink host, edit description, toggle allowLocalHttp. You only PROPOSE: the harness shows the user a before→after diff and the user approves/denies (you can never change a secret yourself). Widening permissions (adding a host, enabling allowLocalHttp) gets a high-friction confirmation. To promote an INGRESS_N to a clear name, use `rename` here (no re-paste; the value stays sealed).",
    parameters: Type.Object({
      name: Type.String({ minLength: 1, description: "Name of the secret to edit." }),
      rename: Type.Optional(Type.String({ description: "New name (e.g. promote INGRESS_1 → REDDIT_TOKEN)." })),
      addSinks: Type.Optional(Type.Array(Type.String(), { description: "Hosts to ADD to allowedSinks (widening)." })),
      removeSinks: Type.Optional(Type.Array(Type.String(), { description: "Hosts to REMOVE from allowedSinks (narrowing)." })),
      description: Type.Optional(Type.String({ description: "New description." })),
      allowLocalHttp: Type.Optional(Type.Boolean({ description: "Enable/disable http toward loopback." })),
      why: Type.String({ minLength: 1, description: "Why this edit. Required, non-empty." }),
    }),
    async execute(_t: string, p: any, _signal: any, _onUpdate: any, ctx: any) {
      if (!hasSecret(p.name)) return { content: [{ type: "text", text: `Secret '${p.name}' does not exist.` }], details: { ok: false } };
      const why = String(p.why ?? "").trim();
      if (!why) return { content: [{ type: "text", text: `Provide a non-empty 'why'.` }], details: { ok: false } };
      const changes: any = {};
      if (typeof p.rename === "string" && p.rename.trim()) changes.rename = p.rename.trim();
      if (Array.isArray(p.addSinks)) changes.addSinks = p.addSinks;
      if (Array.isArray(p.removeSinks)) changes.removeSinks = p.removeSinks;
      if (typeof p.description === "string") changes.description = p.description;
      if (typeof p.allowLocalHttp === "boolean") changes.allowLocalHttp = p.allowLocalHttp;
      return askAndApplyEdit(ctx?.ui, !!ctx?.hasUI, p.name, changes, why, "Modificare");
    },
  });
  pi.registerTool({
    name: "propose_secret_destroy",
    label: "Propose destroying a secret (user approves)",
    description:
      "Propose destroying a sealed secret. You only PROPOSE with a reason; the user must approve (destruction never happens without explicit consent). Use when a secret is wrong/obsolete and should be re-provisioned fresh.",
    parameters: Type.Object({
      name: Type.String({ minLength: 1, description: "Name of the secret to destroy." }),
      why: Type.String({ minLength: 1, description: "Why it should be destroyed. Required, non-empty." }),
    }),
    async execute(_t: string, p: any, _signal: any, _onUpdate: any, ctx: any) {
      const why = String(p.why ?? "").trim();
      if (!why) return { content: [{ type: "text", text: `Provide a non-empty 'why'.` }], details: { ok: false } };
      return askAndDestroy(ctx?.ui, !!ctx?.hasUI, p.name, why);
    },
  });
  pi.registerTool({
    name: "propose_secret_create",
    label: "Propose creating a new sealed secret (user enters the value)",
    description:
      "Propose creating a NEW sealed secret. You provide ONLY the metadata (name, description, allowedSinks, allowLocalHttp) and a reason — you do NOT provide and will NEVER see the value. The harness shows the user your proposal and, if they accept, asks THEM to type the value directly (USER→harness, the value never passes through you or the LLM provider; it is sealed and redacted from transcripts). Then use it as {{secret:NAME}}. Use this when the user clearly needs a new credential provisioned for an operation. " +
      "NEVER call this with PLACEHOLDER values (e.g. name='NOME_DEL_SEGRETO', why='REASON') — first get the REAL name (for a Reddit key use 'REDDIT_API_KEY'; if you don't know it, ASK the user), then call. " +
      "If the value is already in a FILE, use load_secrets_from_env instead. For a value the user ALREADY pasted (an INGRESS_N), do NOT create a new one — rename/grant it via propose_secret_edit/request_sink.",
    promptGuidelines: [
      "To provision a brand-new secret, call propose_secret_create with REAL metadata (never placeholders like 'NOME_DEL_SEGRETO' — use a real name such as REDDIT_API_KEY, or ask the user for it). You provide only the name/reason; the user types the value into the harness dialog. If the value is in a file, prefer load_secrets_from_env. Never put a real secret value in any tool argument.",
    ],
    parameters: Type.Object({
      name: Type.String({ minLength: 1, description: "Name for the new secret, e.g. REDDIT_API_KEY ([A-Za-z0-9_.-], max 64)." }),
      description: Type.Optional(Type.String({ description: "What the secret is for (shown to the user and in list_secrets)." })),
      allowedSinks: Type.Optional(Type.Array(Type.String(), { description: "Concrete hosts the secret may reach, e.g. ['oauth.reddit.com']. Empty = lockdown until a sink is granted. '*' (any host) is NOT accepted in-session." })),
      allowLocalHttp: Type.Optional(Type.Boolean({ description: "Allow use over http toward loopback only (localhost/127.0.0.1)." })),
      redactEgress: Type.Optional(Type.Boolean({ description: "Redact this value from every output (default true). Set false ONLY for short/low-entropy values (OTP/PIN/a date) where global redaction would be noisy." })),
      why: Type.String({ minLength: 1, description: "Why this secret is needed. Required, non-empty." }),
    }),
    async execute(_t: string, p: any, _signal: any, _onUpdate: any, ctx: any) {
      // Il VALORE non transita MAI dal modello: askAndCreate lo raccoglie via ctx.ui.input() (USER→harness). Headless
      // → degrada a provisioning out-of-band. Tutta la logica è node-pura/testabile in secrets-consent.mjs.
      return askAndCreate(ctx?.ui, !!ctx?.hasUI, { name: p.name, description: p.description, allowedSinks: p.allowedSinks, allowLocalHttp: p.allowLocalHttp, redactEgress: p.redactEgress }, p.why);
    },
  });
  pi.registerTool({
    name: "check_secret_refs",
    label: "Validate {{secret:NAME}} references in a text",
    description:
      "Validate the {{secret:NAME}} references in a text BEFORE using them: for each, reports whether the secret exists and, for an unknown name, suggests the closest existing one (catches typos / invented names). Read-only, changes nothing. Call it when unsure a secret name is correct, instead of guessing.",
    parameters: Type.Object({ text: Type.String({ description: "Text containing {{secret:NAME}} references to validate." }) }),
    async execute(_t: string, p: any) {
      const v = validateSecretRefs(String(p.text ?? ""));
      return { content: [{ type: "text", text: JSON.stringify(v, null, 2) }], details: { ok: v.ok, unknown: v.unknown.length } };
    },
  });
  pi.registerTool({
    name: "preview_secret_use",
    label: "Preview if a secret use will be allowed (dry-run)",
    description:
      "BEFORE running a command that uses {{secret:NAME}}, check whether it will be ALLOWED — WITHOUT executing it. Returns allowed/blocked + the reason + the exact REMEDIATION (which request_sink host to ask for, or request_local_http for localhost, or the closest name on a typo). Use this to PLAN instead of trial-and-error, and to avoid unsafe workarounds (never read a secret from a plaintext env var). Read-only.",
    promptGuidelines: [
      "Before running a command that uses a secret, you can call preview_secret_use(name, operation) to see if it will be allowed and exactly what to request — plan instead of trial-and-error.",
    ],
    parameters: Type.Object({
      name: Type.String({ minLength: 1, description: "Secret name." }),
      operation: Type.String({ minLength: 1, description: "The exact command/operation you intend to run (e.g. the full curl)." }),
    }),
    async execute(_t: string, p: any) {
      const r = previewSecretUse(String(p.name), String(p.operation ?? ""), HARNESS_CFG.secrets.sinkGating);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], details: { ok: !!r.allowed } };
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

  // ───── load_secrets_from_env — provisioning DETERMINISTICO da file (utente msg 811): l'harness legge il file e
  // SIGILLA ogni KEY=VALUE; il valore NON passa MAI dal modello né dal contesto (aggira il fumbling paste/placeholder
  // del modello piccolo). Al modello tornano SOLO i nomi. Lockdown di default (nessun sink) → uso verso host = Ask. ───
  pi.registerTool({
    name: "load_secrets_from_env",
    label: "Load sealed secrets from an env file (values never seen)",
    description:
      "Read a local env file (KEY=VALUE per line) and SEAL each entry as a secret WITHOUT the value ever reaching you " +
      "or the context — you get back ONLY the names loaded, then use {{secret:NAME}}. Loaded in lockdown (no allowedSinks): " +
      "call request_sink(name, host, why) to let one reach a host. Use this to provision credentials the user placed in a " +
      "file (e.g. the user says 'the reddit token is in reddit.env' → load_secrets_from_env('reddit.env')). This is the " +
      "PREFERRED, deterministic way to get a user's secret sealed — do NOT ask the user to paste the value to you.",
    promptSnippet: "load_secrets_from_env(path) — seal all KEY=VALUE from a file as secrets (values never shown to you).",
    promptGuidelines: [
      "When the user says a credential/token/key is in a file (or asks to load secrets), call load_secrets_from_env(path) — the harness seals the values without ever showing them to you. Do NOT ask the user to paste a secret value into the chat.",
    ],
    parameters: Type.Object({
      path: Type.String({ minLength: 1, description: "Path to the env file inside the workspace, e.g. 'reddit.env' or 'secrets.env' (KEY=VALUE per line)." }),
    }),
    async execute(_t: string, p: any, _s: any, _u: any, ctx: any) {
      const raw = String(p.path ?? "").trim();
      const deny = (text: string) => ({ content: [{ type: "text" as const, text }], details: { ok: false, loaded: [] as string[], skippedCount: 0 } });
      // GUARD path-traversal (hardened — il path è model-controlled): confinato al workspace. Difese in ordine:
      //  (a) niente path assoluti né segmento '..' (intent chiaro, rifiuta prima di toccare l'FS);
      //  (b) dev'essere un env-file ('*.env') — il tool è per quello, restringe la superficie;
      //  (c) confronto sul REALPATH col separatore finale → chiude il buco 'startsWith' su dir-sorella con prefisso
      //      condiviso (slm/ vs slm-evil/) E l'escape via symlink (realpath risolve i link: se il target reale è
      //      fuori dal workspace, rifiuta). Vedi security-review 2026-07-03.
      const v = validateEnvPath(raw); // (a)+(b): assoluti / '..' / non-.env → rifiuto puro pre-FS (testato)
      if (!v.ok) return deny(`Refused: '${raw}' — ${v.reason}.`);
      const abs = resolve(process.cwd(), raw);
      if (!existsSync(abs)) return deny(`File '${raw}' not found. Ask the user to create it with the secret(s) as KEY=VALUE (one per line) and tell you the path.`);
      let real = "", root = "";
      try { real = realpathSync(abs); root = realpathSync(process.cwd()); } catch { return deny(`Could not resolve '${raw}'.`); }
      if (!real.startsWith(root + sep)) return deny(`Refused: '${raw}' resolves outside the workspace.`);
      let content = "";
      try { content = readFileSync(real, "utf-8"); } catch (e: any) { return deny(`Could not read '${raw}': ${e?.message ?? "read error"}.`); }
      const { loaded, skipped } = ingestEnvContent(content, {});
      if (loaded.length) ctx?.ui?.notify?.(`Caricati ${loaded.length} secret sigillati da '${raw}': ${loaded.join(", ")} (lockdown).`, "info");
      const parts = [
        loaded.length
          ? `Sealed ${loaded.length} secret(s) from '${raw}': ${loaded.join(", ")}. Use {{secret:NAME}}. They are in lockdown (no allowedSinks) — call request_sink(name, host, why) to let one reach a host.`
          : `No secrets loaded from '${raw}' (no valid KEY=VALUE lines, or all already exist).`,
        skipped.length ? `Skipped: ${skipped.map((s) => `${s.key} (${s.reason})`).join("; ")}.` : "",
      ].filter(Boolean);
      return { content: [{ type: "text", text: parts.join("\n") }], details: { ok: loaded.length > 0, loaded, skippedCount: skipped.length } };
    },
  });

  // ───── http_request — canale TIPIZZATO per usare i sealed-secrets in rete (PREFERITO al curl in shell) ─────
  // Perché esiste (arch H2 / ADR 2026-06-30): con un curl in bash il sink-gating deve disambiguare la shell (host
  // estranei codificati, composizione di comandi, redirect) → fragile. Qui la destinazione è il SOLO campo `url`
  // tipizzato (un new URL): il gating è banale e robusto. La via bash con {{secret:NAME}} resta valida (additivo).
  pi.registerTool({
    name: "http_request",
    label: "Make an HTTP(S) request (typed; preferred for using a secret)",
    description:
      "Make an HTTP(S) request with TYPED fields (url, method, headers, body). This is the PREFERRED way to use a {{secret:NAME}} toward an API: put the reference in a header or the body, and the harness injects the real value at the URL's host only — you never see it. WHY prefer this over a curl in bash: the destination is the typed `url` alone, so sink-gating is exact and robust (no shell to disambiguate). Rules: only http/https; a secret reaches an external host only if that host is in its allowedSinks (else it is blocked — call request_sink); http is allowed only toward localhost/127.0.0.1 and only with allowLocalHttp (request_local_http). Redirects are NOT followed (a 3xx is returned to you, so a token can't be bounced to another host). The response body is size-capped and secret-redacted.",
    promptGuidelines: [
      "To call an API with a sealed secret, PREFER http_request over a shell curl: put {{secret:NAME}} in a header/body and set the typed url. It is gated on the url host only. If blocked, request_sink (external) or request_local_http (localhost). Never read a secret value from a plaintext env var.",
    ],
    parameters: Type.Object({
      url: Type.String({ minLength: 1, description: "Full http(s) URL, e.g. https://api.example.com/v1/x." }),
      method: Type.Optional(Type.String({ description: "GET|POST|PUT|PATCH|DELETE|HEAD (default GET)." })),
      headers: Type.Optional(Type.Record(Type.String(), Type.String(), { description: "Request headers. May contain {{secret:NAME}} (e.g. Authorization: Bearer {{secret:TOKEN}})." })),
      body: Type.Optional(Type.String({ description: "Request body (string). May contain {{secret:NAME}}." })),
      timeout_ms: Type.Optional(Type.Number({ description: "Timeout in ms (default 30000, max 120000)." })),
      capture: Type.Optional(Type.Object({
        secret: Type.String({ description: "Name of an EXISTING sealed secret to RENEW in place with a value read from THIS response. It must be a secret you used ({{secret:NAME}}) in THIS same request (e.g. renewing a token against its own endpoint)." }),
        from: Type.String({ description: "Where to read the new value in the response: a JSON path (\"$.access_token\" / \"data.token\"), \"regex:PATTERN\" (capture group 1), or \"header:NAME\". The captured value is sealed — you never see the old nor the new value." }),
      }, { description: "Optional: RENEW/rotate a sealed secret from this response. The new value is re-sealed in place (allowedSinks unchanged) and redacted; you receive only a confirmation, never the value." })),
    }),
    async execute(_t: string, p: any, _s: any, _u: any, ctx: any) {
      const r: any = await executeHttpRequest(
        { url: p.url, method: p.method, headers: p.headers, body: p.body, timeoutMs: p.timeout_ms, capture: p.capture },
        { mode: HARNESS_CFG.secrets.sinkGating },
      );
      // Renewal: NOTIFICA l'utente (trasparenza) — il valore è sigillato, non mostrato. Nessun re-Ask perché i sink
      // restano invariati e si rinnova solo un secret usato in questa stessa richiesta (host già consentito).
      if (r.captured?.ok) ctx?.ui?.notify?.(`secret '${r.captured.secret}' rinnovato dalla risposta (valore sigillato, non mostrato).`, "info");
      // La redazione egress del body è garantita a valle dall'hook tool_result (dynamic-secrets + pattern statici).
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], details: { ok: !!r.ok, status: r.status, blocked: r.blocked, captured: r.captured } };
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
    // ESENZIONE http_request (canale TIPIZZATO): fa la PROPRIA injection+sink-gating sul campo url nel suo execute()
    // (un new URL, niente shell). Applicare qui la injection shell-based lo bloccherebbe/sostituirebbe a sproposito
    // (headers/body NON sono shell). La redazione-egress raw dei dynamic-secrets sopra resta (anti add_secret raw).
    if (toolName === "http_request") return;
    const slots: { get: () => string; set: (v: string) => void }[] = [];
    collectStringSlots(input, slots);
    const r = injectIntoStrings(slots.map((s) => s.get()), HARNESS_CFG.secrets.sinkGating);
    if (r.blocked.length) {
      return {
        block: true,
        reason:
          `sealed-secrets: secret use blocked (sink-gating ${HARNESS_CFG.secrets.sinkGating}) — ` +
          r.blocked.map((b) => `${b.name}: ${b.reason}`).join("; ") +
          ". The value was NOT inserted. To let a secret reach an EXTERNAL host, call request_sink(name, host, why) (the user approves). For http://localhost use request_local_http. If a secret name looks wrong, call check_secret_refs to verify it. Do NOT invent CLI commands or read the value from a plaintext env var.",
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

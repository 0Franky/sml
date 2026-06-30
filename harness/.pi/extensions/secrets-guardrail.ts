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
import { loadFromEnv, listSecretsMeta, injectIntoStrings, autoSealIngress, clearSealed } from "../../src/sealed-secrets.mjs";
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

  // REGEX-INGRESS (idea utente msg 578/579) — cattura valori secret-shaped nell'INPUT utente PRIMA che raggiungano il
  // modello/provider. `regexIngress`: off | ask | auto (env HARNESS_SECRETS_REGEX_INGRESS). Entrambi auto/ask sigillano
  // (fail-safe: meglio sigillare un falso-positivo che leakare un segreto vero) e TRASFORMANO il testo: il valore è
  // sostituito col riferimento {{secret:INGRESS_N}} → il VALORE non entra nel context (mai al provider, mai nei
  // transcript nativi). Differenza: `auto` notifica info, `ask` notifica warning (chiede conferma/undo all'utente;
  // il blocco-interattivo vero richiederebbe un prompt TUI non disponibile headless → degrada a seal-provvisorio+notify).
  pi.on("input", (event, ctx) => {
    const mode = HARNESS_CFG.secrets.regexIngress; // off | ask | auto
    if (mode === "off") return { action: "continue" } as const;
    const e = event as any;
    const text = e.text;
    if (typeof text !== "string" || !text.trim() || text.startsWith("/")) return { action: "continue" } as const;
    const { text: newText, sealed } = autoSealIngress(text);
    if (!sealed.length) return { action: "continue" } as const;
    const names = sealed.map((s) => s.name).join(", ");
    const msg = mode === "ask"
      ? `secrets-guardrail (regex-ingress=ask): rilevato e sigillato ${sealed.length} valore secret-shaped → ${names}. Il valore NON va al modello/provider. Se è un falso positivo o vuoi usarlo, gestiscilo (allowedSinks).`
      : `secrets-guardrail (regex-ingress=auto): ${sealed.length} valore secret-shaped sigillato (${names}); il valore NON raggiunge il modello/provider.`;
    ctx?.ui?.notify?.(msg, mode === "ask" ? "warning" : "info");
    return { action: "transform", text: newText, images: e.images } as const;
  });

  // SEALED-SECRETS — vista per il modello: nome+descrizione+allowedSinks, MAI il valore.
  pi.registerTool({
    name: "list_secrets",
    label: "List available sealed secrets (names only)",
    description:
      "Elenca i segreti SIGILLATI disponibili: per ognuno solo NOME, descrizione, allowedSinks (host consentiti) e fingerprint (hash non-reversibile, per verificarne l'identità senza vederne il valore).\n" +
      "COME FUNZIONANO (importante — non fraintendere):\n" +
      "• `{{secret:NAME}}` è un RIFERIMENTO a un valore che TU non possiedi e non vedrai MAI. Usalo LIBERAMENTE negli argomenti di un tool — scrivere un `.env`, una chiamata API, un header — come se fosse il valore.\n" +
      "• Al momento dell'esecuzione l'harness sostituisce il riferimento col VALORE REALE, SOLO verso gli allowedSinks. Quindi il file/comando riceve il valore vero (utile: puoi configurare un `.env` o autenticare una chiamata senza mai vedere la chiave). Il valore NON arriva mai a te né al provider LLM: è il design, non un limite.\n" +
      "• Se RILEGGI un file o un output che contiene il segreto, vedrai `[REDACTED-SECRET]`: significa che il valore È PRESENTE (su disco/nell'output) ma è nascosto a TE (redazione in lettura) — NON che il file sia vuoto o redatto. Non dire 'non posso' o 'è stato redatto': di' 'il valore c'è, è l'harness che lo nasconde a me'.\n" +
      "• Se un uso viene bloccato (`sink-gating`), il segreto manca di allowedSinks per quell'host: chiedi all'utente di dichiararli. Hai pieno potere di USARE i segreti; semplicemente non li VEDI.",
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
      "Segnala che ti serve un segreto NON ancora disponibile per un'operazione. NON ricevi il valore: l'utente lo provisiona out-of-band (env `SEALED_SECRET_<NAME>` / CLI `set-secret`). Usa questo per chiedere, poi `{{secret:NAME}}` quando è disponibile.",
    parameters: Type.Object({
      name: Type.String({ description: "Nome del secret richiesto (es. OPENAI_KEY)." }),
      why: Type.String({ description: "Perché ti serve / per quale operazione/host." }),
    }),
    async execute(_t: string, p: any, _signal: any, _onUpdate: any, ctx: any) {
      ctx?.ui?.notify?.(`Il modello richiede il secret '${p.name}' — ${p.why}. Provisionalo: env SEALED_SECRET_${p.name}=… (o CLI set-secret). Il valore NON andrà al modello.`, "warning");
      return {
        content: [{ type: "text", text: `Richiesto il secret '${p.name}'. L'utente deve provisionarlo (env SEALED_SECRET_${p.name} o CLI set-secret) — tu NON riceverai il valore; usalo come {{secret:${p.name}}}.` }],
        details: { ok: true },
      };
    },
  });

  pi.registerTool({
    name: "add_secret",
    label: "Register a session secret to redact",
    description:
      "Registra un valore segreto (in-memory, MAI su disco) che il guardrail redige da OGNI output di tool E dall'interpolazione (render_template). Riferimento opaco per-sessione (anti-exfiltration deterministica).",
    parameters: Type.Object({ value: Type.String({ description: "Il valore segreto da redarre (opaco, alta entropia)." }) }),
    async execute(_toolCallId: string, params: any) {
      // Guardia min-length/diversità/cap: un valore corto o poco-vario corromperebbe ogni output (footgun/DoS). (P2)
      const r = addSecret(params.value);
      if (!r.ok) {
        return {
          content: [{ type: "text", text: `add_secret RIFIUTATO: ${r.reason}. Registra un valore opaco ad alta entropia (token/chiave reale).` }],
          details: { ok: false },
        };
      }
      return {
        content: [{ type: "text", text: `secret registrato (${r.size} attivi nella secrets-map dinamica)` }],
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
          `sealed-secrets: uso del segreto bloccato (sink-gating ${HARNESS_CFG.secrets.sinkGating}) — ` +
          r.blocked.map((b) => `${b.name}: ${b.reason}`).join("; ") +
          ". Il valore NON è stato inserito. Usa il secret solo verso i suoi allowedSinks.",
      };
    }
    // file-write opt-OUT (utente msg 638): di default il modello PUÒ scrivere un segreto in un file locale (.env
    // provisioning); se allowSecretToFile=false, blocca l'iniezione di un sealed-secret nei tool di scrittura-file
    // STRUTTURATI (write/create/edit — che hasFileOrPipeExfil non vede, a differenza dei redirect bash `>`).
    if (r.injected.length && HARNESS_CFG.secrets.allowSecretToFile === false && FILE_WRITE_TOOLS.has(toolName)) {
      return {
        block: true,
        reason: `sealed-secrets: scrittura di un segreto su file bloccata (secrets.allowSecretToFile=false) via '${toolName}'. Il valore NON è stato scritto. Abilita allowSecretToFile, oppure provisiona il file out-of-band.`,
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

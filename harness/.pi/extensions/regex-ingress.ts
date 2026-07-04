/**
 * regex-ingress — estensione SEPARATA e disattivabile (utente msg 619/623/625).
 *
 * Intercetta valori SECRET-SHAPED nell'INPUT utente (hook `input` + `action:"transform"`) PRIMA che raggiungano
 * il modello/provider: il valore è sigillato nel registry condiviso e sostituito col riferimento opaco
 * `{{secret:INGRESS_N}}`. Così il VALORE non entra nel `<context>` (mai al provider, mai nei transcript nativi di
 * pi) — è la difesa sul confine d'INGRESSO, complementare al lato EGRESS di `secrets-guardrail`.
 *
 * PERCHÉ ESTENSIONE A PARTE (e non dentro secrets-guardrail):
 *  - l'hook `input`+`action:"transform"` MUTA OGNI input utente → superficie più invasiva (blast-radius alto),
 *    profilo di rischio diverso dal lato egress di secrets-guardrail (che opera SOLO sui confini-tool).
 *  - "un concept = un'estensione": chi non la vuole la disattiva in modo autonomo, senza toccare il guardrail egress.
 *  - DUE opt-out indipendenti: (1) `secrets.regexIngress = "off"` (config/env HARNESS_SECRETS_REGEX_INGRESS),
 *    oppure (2) CANCELLA questo file (pi non carica un'estensione assente).
 *
 * SOFT-DEP con secrets-guardrail (coordinano via il singleton condiviso `src/sealed-secrets.mjs`):
 *  - STANDALONE (questa sola) → protezione ANTI-PROVIDER: il valore è già fuori dall'input, non arriva al modello.
 *    MA senza il backstop di redazione di secrets-guardrail un valore residuo (es. ri-letto da un tool_result) non
 *    verrebbe mascherato a runtime.
 *  - +secrets-guardrail → ANCHE ANTI-TRANSCRIPT: redazione su tool_result/tool_call + injection sink-gated al confine
 *    d'uscita. È la coppia consigliata. (Il valore sigillato qui è in lockdown: nessun allowedSinks → inviabile solo
 *    se l'utente dichiara esplicitamente una destinazione.)
 *
 * Logica condivisa e testata: `autoSealIngress` in ../../src/sealed-secrets.mjs (unit: sealed-secrets.test.mjs block 9).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { autoSealIngress, clearSealed } from "../../src/sealed-secrets.mjs";
import { redactText } from "../../src/secrets-redact.mjs"; // fallback statico throw-proof per il fail-closed (C5)
import { promoteSealedIngress } from "../../src/secrets-consent.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";

const HARNESS_CFG = loadHarnessConfig();

export default function (pi: ExtensionAPI) {
  // Isolamento di sessione: svuota il registry sigillato a fine sessione (reload/resume/new/fork sono in-process) →
  // i segreti sigillati nella sessione A non restano residenti nella B. Idempotente: se anche secrets-guardrail è
  // caricato e chiama clearSealed, chiamarlo due volte è innocuo (così la pulizia vale anche in STANDALONE).
  pi.on("session_shutdown", () => clearSealed());

  // `regexIngress`: off | ask | auto (env HARNESS_SECRETS_REGEX_INGRESS). Entrambi auto/ask sigillano (fail-safe:
  // meglio sigillare un falso-positivo che leakare un segreto vero) e TRASFORMANO il testo: il valore è sostituito
  // col riferimento {{secret:INGRESS_N}} → il VALORE non entra nel context (mai al provider, mai nei transcript
  // nativi). Differenza: `auto` notifica info, `ask` notifica warning (chiede conferma/undo all'utente; il
  // blocco-interattivo vero richiederebbe un prompt TUI non disponibile headless → degrada a seal-provvisorio+notify).
  pi.on("input", async (event, ctx) => {
    const mode = HARNESS_CFG.secrets.regexIngress; // off | ask | auto
    if (mode === "off") return { action: "continue" } as const;
    const e = event as any;
    const text = e.text;
    // NB (C5-a, accettato): gli slash-command sono SALTATI di proposito — trasformare `/cmd …` romperebbe il dispatch
    // del comando. È un fail-open NARROW e documentato (un segreto raramente apre un messaggio con `/`); non lo cambio.
    if (typeof text !== "string" || !text.trim() || text.startsWith("/")) return { action: "continue" } as const;
    try {
    let { text: newText, sealed } = autoSealIngress(text);
    if (!sealed.length) return { action: "continue" } as const;
    const names = sealed.map((s) => s.name);
    // mode=`ask` + UI interattiva → Ask DETERMINISTICO (fix C, utente msg 796/797): promuovi ogni valore appena
    // sigillato (rinomina INGRESS_N→nome-parlante + grant-sink), poi riscrivi i riferimenti nel testo. L'Ask scatta
    // sull'evento d'ingresso, NON dipende dal routing incerto del modello. `auto` (o headless) resta notify-only.
    if (mode === "ask" && (ctx as any)?.hasUI && (ctx as any)?.ui) {
      try {
        const { renames } = await promoteSealedIngress((ctx as any).ui, true, names);
        for (const [oldN, newN] of Object.entries(renames)) {
          newText = newText.split(`{{secret:${oldN}}}`).join(`{{secret:${newN}}}`);
        }
      } catch {
        /* l'hook input non deve MAI rompere l'input: in errore il valore resta sigillato come INGRESS_N */
      }
    } else {
      const msg = mode === "ask"
        ? `regex-ingress (=ask, headless): ${sealed.length} valore secret-shaped sigillato → ${names.join(", ")}. Nessuna UI per rinominarlo ora; gestiscilo out-of-band.`
        : `regex-ingress (=auto): ${sealed.length} valore secret-shaped sigillato (${names.join(", ")}); il valore NON raggiunge il modello/provider.`;
      ctx?.ui?.notify?.(msg, mode === "ask" ? "warning" : "info");
    }
    return { action: "transform", text: newText, images: e.images } as const;
    } catch {
      // C5-b (audit 2026-07-04): l'hook input NON deve fallire-OPEN. Se il sealing lancia, non mandare il testo RAW al
      // provider: applica una redazione STATICA throw-proof e trasforma a quella; se anche quella fallisce, continue.
      try {
        const { redacted, hit } = redactText(text, [], { staticPatterns: true });
        if (hit) { ctx?.ui?.notify?.("regex-ingress: sealing fallito → redazione statica d'emergenza applicata", "warning"); return { action: "transform", text: redacted, images: e.images } as const; }
      } catch { /* best-effort */ }
      return { action: "continue" } as const;
    }
  });
}

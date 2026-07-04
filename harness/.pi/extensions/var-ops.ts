/**
 * var-ops — espone al modello le operazioni sulle var PER RIFERIMENTO (idea utente msg 427/431/437).
 *
 * Tool:
 *   extract_var   — estrae un campo da una var (JSON) per path deterministico (no eval) e lo salva in un'altra var.
 *   render_template — risolve i placeholder {{var:NOME}} di var ESISTENTI (canale opt-in) + redazione segreti finale,
 *                     ritornando la stringa risolta. È la primitiva di interpolazione "by channel" (msg 437):
 *                     il modello la chiama SOLO quando vuole interpolare; l'output normale resta passthrough.
 *
 * Logica deterministica in ../../src/var-ops.mjs (testata: var-ops.test.mjs). Opera sullo stesso datastore
 * (.pi/state/vars.db) di vars-queue/context-assembly.
 * Design + sicurezza (path-DSL hardening, ordine interpolazione→redazione→invio): ../../wiki/concepts/variable-operations-by-reference.md.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { VarsQueue } from "../../src/vars-queue.mjs";
import { getVarsQueue, closeAll } from "../../src/state-db.mjs";
import { extractVar, emitToUser } from "../../src/var-ops.mjs";
import { getDynamicSecrets } from "../../src/secrets-registry.mjs";
import { redactText } from "../../src/secrets-redact.mjs"; // fallback statico throw-proof per il fail-closed (B2)
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = ".pi/state/vars.db";

function getStore(): VarsQueue {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  return getVarsQueue(DB_PATH, { agent: "orchestrator" }); // connessione condivisa (no leak)
}

export default function (pi: ExtensionAPI) {
  const vq = getStore();
  pi.on("session_shutdown", () => closeAll()); // rilascia le connessioni DB condivise (fix leak)

  pi.registerTool({
    name: "extract_var",
    label: "Extract a field from a variable (by reference)",
    description:
      "Extract a field from a JSON var by PATH (dotted + index, e.g. 'data.items[0].status') and save it into 'dest'. " +
      "Deterministic and safe (no eval, no proto-pollution). Use this instead of recopying the value: fewer errors, fewer tokens.",
    // promptSnippet → senza, i tool custom NON compaiono nella sezione "Available tools" del system prompt (types.d.ts:342).
    promptSnippet: "extract_var(src,path,dest) — extract a field from a JSON var (by-reference, no recopying).",
    parameters: Type.Object({
      src: Type.String({ description: "Source var (JSON object or JSON string, e.g. a captured tool_result)." }),
      path: Type.String({ description: "Field path (dotted + index): 'status', 'data.items[0].id'." }),
      dest: Type.String({ description: "Destination var where the extracted field is saved." }),
    }),
    async execute(_t: string, p: any) {
      // B1 (audit 2026-07-04): attribuisci la write allo SCOPE FOCUS attivo (come fa activeWho() in vars-queue.ts),
      // non a "orchestrator" di default → altrimenti in focus la write è omessa dal pop-report matrioska (silent-omission).
      const r = extractVar(vq, p.src, p.path, p.dest, { who: vq.getActiveScope() ?? vq.agent });
      if (!r.ok) return { content: [{ type: "text", text: `error: ${r.error}` }], details: { ok: false } };
      return { content: [{ type: "text", text: JSON.stringify({ dest: r.dest, value: r.value }) }], details: { ok: true } };
    },
  });

  pi.registerTool({
    name: "render_template",
    label: "Render a template (interpolate {{var:NAME}})",
    description:
      "OPT-IN interpolation channel: resolves the {{var:NAME}} placeholders of EXISTING vars (the rest, incl. " +
      "Jinja/Vue {{...}} and non-existent vars, stays literal) and applies the FINAL secret redaction. Returns the " +
      "resolved string. Use it to compose text that cites var values without recopying them by hand.",
    // Scopribilità (review-loop #3 2026-06-29, P2): l'auto-interpolazione nell'output è stata RIMOSSA (esfiltrazione);
    // ora l'interpolazione richiede un'azione esplicita → va segnalata al modello, altrimenti scriverebbe {{var:X}}
    // letterale. promptSnippet la mette in "Available tools"; promptGuidelines spiega il cambio di regime.
    promptSnippet: "render_template(text) — resolves {{var:NAME}} citing var values in the final text (NOT automatic).",
    promptGuidelines: [
      "To insert the VALUE of a var into the text shown to the user, use render_template: {{var:NAME}} is no longer " +
        "resolved automatically in the output (it stays literal). It serves to cite var values without recopying them by hand.",
    ],
    parameters: Type.Object({
      text: Type.String({ description: "Text with {{var:NAME}} placeholders (escape: {{!var:NAME}})." }),
    }),
    async execute(_t: string, p: any) {
      // P0 fix: passa la secrets-map dinamica condivisa → un segreto in una var NON esce in chiaro
      // dall'interpolazione (ordine interpolazione→redazione→invio rispettato anche qui).
      const out = emitToUser(p.text, vq, { interpolate: true, dynamicSecrets: getDynamicSecrets() });
      return { content: [{ type: "text", text: out.text }], details: { secretHit: out.secretHit } };
    },
  });

  // CANALE OUTPUT (RISPOSTA FINALE dell'assistant) = REDAZIONE-SEGRETI difensiva. Difesa-in-profondità: il
  // secrets-guardrail copre i tool_result, qui si copre anche la risposta finale (pattern statici + dynamic-secrets).
  // L'AUTO-interpolazione di {{var:NOME}} è stata RIMOSSA da questo canale: la review-loop #2 (security P1) ha
  // mostrato che interpolare automaticamente QUALSIASI var nell'output è un canale di ESFILTRAZIONE — una var-segreto
  // non-pattern e non-registrata verrebbe risolta in chiaro a prescindere dall'allineamento del modello (l'interpolazione
  // è una primitiva fidata) — oltre a clobberare l'output didattico (es. {{var:API_BASE}} citato come sintassi).
  // L'interpolazione resta OPT-IN, esplicita e controllata, via il tool render_template. Passthrough se nulla è redatto.
  // PORTATA (review-loop #3 2026-06-29, P2): questa è una difesa del CANALE-TESTO della risposta finale — redige SOLO i
  // blocchi `type:"text"` (non gli argomenti dei tool_call emessi dall'assistant). L'egress via argomenti tool_call è
  // coperto separatamente dall'hook `tool_call` in secrets-guardrail (redazione dynamic-secrets in-place).
  pi.on("message_end", (event) => {
   try {
    const m = event.message as any;
    if (!m || m.role !== "assistant") return;
    const dynamicSecrets = getDynamicSecrets();
    let changed = false;
    const apply = (s: string): string => {
      const out = emitToUser(s, vq, { interpolate: false, dynamicSecrets }); // SOLO redazione (no interpolazione)
      if (out.text !== s) changed = true;
      return out.text;
    };
    let newContent: any;
    if (typeof m.content === "string") {
      newContent = apply(m.content);
    } else if (Array.isArray(m.content)) {
      newContent = m.content.map((b: any) =>
        b && b.type === "text" && typeof b.text === "string" ? { ...b, text: apply(b.text) } : b,
      );
    } else {
      return;
    }
    if (!changed) return; // nessun {{var:x}} risolvibile né segreto → passthrough (nessuna sostituzione)
    return { message: { ...m, content: newContent } };
   } catch {
     // FAIL-CLOSED (audit 2026-07-04 B2): canale del TESTO FINALE all'utente. Se la redazione lancia (getDynamicSecrets/
     // vq) NON lasciar passare l'originale (può contenere un secret): degrada a redazione STATICA throw-proof (solo
     // pattern-shape, niente DB/dynamic-set). Se anche quella fallisce → undefined (residuo trascurabile: redactText è regex pura).
     try {
       const m = event.message as any;
       if (!m || m.role !== "assistant") return undefined;
       const red = (s: string) => redactText(String(s), [], { staticPatterns: true }).redacted;
       let nc: any;
       if (typeof m.content === "string") nc = red(m.content);
       else if (Array.isArray(m.content)) nc = m.content.map((b: any) => (b && b.type === "text" && typeof b.text === "string" ? { ...b, text: red(b.text) } : b));
       else return undefined;
       return { message: { ...m, content: nc } };
     } catch { return undefined; }
   }
  });
}

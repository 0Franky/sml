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
      "Estrae un campo da una var JSON per PATH (dotted + indice, es. 'data.items[0].status') e lo salva in 'dest'. " +
      "Deterministico e sicuro (niente eval, niente proto-pollution). Usa questo invece di ricopiare il valore: meno errori, meno token.",
    // promptSnippet → senza, i tool custom NON compaiono nella sezione "Available tools" del system prompt (types.d.ts:342).
    promptSnippet: "extract_var(src,path,dest) — estrai un campo da una var JSON (by-reference, no ricopiatura).",
    parameters: Type.Object({
      src: Type.String({ description: "Var sorgente (oggetto JSON o stringa JSON, es. un tool_result catturato)." }),
      path: Type.String({ description: "Path del campo (dotted + indice): 'status', 'data.items[0].id'." }),
      dest: Type.String({ description: "Var di destinazione dove salvare il campo estratto." }),
    }),
    async execute(_t: string, p: any) {
      const r = extractVar(vq, p.src, p.path, p.dest);
      if (!r.ok) return { content: [{ type: "text", text: `errore: ${r.error}` }], details: { ok: false } };
      return { content: [{ type: "text", text: JSON.stringify({ dest: r.dest, value: r.value }) }], details: { ok: true } };
    },
  });

  pi.registerTool({
    name: "render_template",
    label: "Render a template (interpolate {{var:NAME}})",
    description:
      "Canale di interpolazione OPT-IN: risolve i placeholder {{var:NOME}} delle var ESISTENTI (il resto, incl. " +
      "{{...}} di Jinja/Vue e var inesistenti, resta letterale) e applica la redazione segreti FINALE. Ritorna la " +
      "stringa risolta. Usalo per comporre testo che cita valori di var senza ricopiarli a mano.",
    // Scopribilità (review-loop #3 2026-06-29, P2): l'auto-interpolazione nell'output è stata RIMOSSA (esfiltrazione);
    // ora l'interpolazione richiede un'azione esplicita → va segnalata al modello, altrimenti scriverebbe {{var:X}}
    // letterale. promptSnippet la mette in "Available tools"; promptGuidelines spiega il cambio di regime.
    promptSnippet: "render_template(text) — risolve {{var:NOME}} citando valori di var nel testo finale (NON automatico).",
    promptGuidelines: [
      "Per inserire il VALORE di una var nel testo all'utente usa render_template: {{var:NOME}} NON è più risolto " +
        "automaticamente nell'output (resta letterale). Serve a citare valori di var senza ricopiarli a mano.",
    ],
    parameters: Type.Object({
      text: Type.String({ description: "Testo con placeholder {{var:NOME}} (escape: {{!var:NOME}})." }),
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
  });
}

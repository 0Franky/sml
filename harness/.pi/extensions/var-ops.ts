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
import { extractVar, emitToUser } from "../../src/var-ops.mjs";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = ".pi/state/vars.db";

function getStore(): VarsQueue {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  return new VarsQueue(DB_PATH, { agent: "orchestrator" });
}

export default function (pi: ExtensionAPI) {
  const vq = getStore();

  pi.registerTool({
    name: "extract_var",
    label: "Extract a field from a variable (by reference)",
    description:
      "Estrae un campo da una var JSON per PATH (dotted + indice, es. 'data.items[0].status') e lo salva in 'dest'. " +
      "Deterministico e sicuro (niente eval, niente proto-pollution). Usa questo invece di ricopiare il valore: meno errori, meno token.",
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
    parameters: Type.Object({
      text: Type.String({ description: "Testo con placeholder {{var:NOME}} (escape: {{!var:NOME}})." }),
    }),
    async execute(_t: string, p: any) {
      const out = emitToUser(p.text, vq, { interpolate: true });
      return { content: [{ type: "text", text: out.text }], details: { secretHit: out.secretHit } };
    },
  });
}

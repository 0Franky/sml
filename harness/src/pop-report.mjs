/**
 * pop-report — floor-F deterministico del protocollo di ritorno (matrioska pop / sub-agente).
 *
 * Implementa ../../wiki/concepts/report-to-file-pointer.md (utente TG msg 453/456/457):
 * quando uno scope figlio completa e fa POP verso la cornice madre, NON si riversa un summary inline
 * grande → si scrive un REPORT completo su FILE e risale solo {summary breve, report_path}.
 *
 * Questa è la **metà F (harness, deterministica)**: il report è DERIVABILE dall'attività attribuita
 * all'agente figlio nel change-log (`who`=idAgente) + dalla lane `decisions` → mai un ritorno vuoto.
 * La metà S (salienza/narrazione del summary) la aggiunge il modello sopra questo floor.
 *
 * Si appoggia a vars-queue.mjs: getDecisionsByAgent(id) + getChangesByAgent(id).
 * Path emessi OS-agnostic (forward-slash, CLAUDE.md Fase-5).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const fwd = (p) => String(p).replace(/\\/g, "/");
const sanitize = (id) => String(id).replace(/[^A-Za-z0-9_.-]/g, "_");
function truncate(s, n) {
  s = s == null ? "" : String(s);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/**
 * Assembla il report-su-file + il summary-pointer per il pop di `childAgentId`.
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {string} childAgentId  idAgente dello scope figlio che fa pop
 * @param {{reportDir?:string, since?:number, reportId?:string|number, write?:boolean, summaryCap?:number}} [opts]
 * @returns {{summary:string, report_path:string|null, report:string, decisions:number, changes:number}}
 */
export function buildPopReport(vq, childAgentId, opts = {}) {
  const {
    reportDir = ".pi/state/reports",
    since = 0,
    reportId = Date.now(),
    write = true,
    summaryCap = 120,
  } = opts;

  const decisions = vq.getDecisionsByAgent(childAgentId);
  // i cambiamenti del change-log ESCLUDONO entity='decisions' (già resi, più ricchi, nella sezione Decisioni)
  // → niente doppio-conteggio. I messaggi (agent_messages) sono già esclusi perché loggati silent. (fix review)
  const changes = vq.getChangesByAgent(childAgentId, { since }).filter((c) => c.entity !== "decisions");

  // --- report completo (markdown), anche lungo ------------------------------
  const L = [];
  L.push(`# Report scope — agente \`${childAgentId}\``);
  L.push("");
  L.push(`- decisioni: ${decisions.length}`);
  L.push(`- mutazioni (change-log): ${changes.length}`);
  L.push("");
  L.push("## Decisioni");
  if (decisions.length === 0) L.push("_(nessuna decisione registrata)_");
  for (const d of decisions) {
    let line = `- **${d.id}**: ${d.text}`;
    if (d.rationale) line += `  — _perché_: ${d.rationale}`;
    if (d.task_ref) line += ` _(task ${d.task_ref})_`;
    L.push(line);
  }
  L.push("");
  L.push("## Cambiamenti (change-log)");
  if (changes.length === 0) L.push("_(nessuna mutazione)_");
  for (const c of changes) {
    L.push(`- ${c.entity}/${c.entity_id} ${c.field}: ${truncate(c.old_value, 40)} → ${truncate(c.new_value, 40)}`);
  }
  const report = L.join("\n") + "\n";

  // --- summary breve (floor-F, bounded) — childAgentId troncato (bound INCONDIZIONATO del floor) -------
  const lastDecision = decisions.length ? decisions[decisions.length - 1].text : null;
  let summary = `scope \`${truncate(childAgentId, 64)}\`: ${decisions.length} decisioni, ${changes.length} cambiamenti`;
  if (lastDecision) summary += `; ultima: "${truncate(lastDecision, summaryCap)}"`;

  // --- write report su file + pointer nel summary ---------------------------
  // su errore di scrittura (EACCES/ENOSPC/EROFS…) NON si perde il ritorno: report_path resta null e
  // il report pieno è comunque disponibile in-memory nel campo `report`. Fix review 2026-06-29.
  let report_path = null;
  if (write) {
    try {
      mkdirSync(reportDir, { recursive: true });
      report_path = fwd(join(reportDir, `${sanitize(childAgentId)}-${sanitize(reportId)}.md`));
      writeFileSync(report_path, report, "utf-8");
      summary += ` → report: ${report_path}`;
    } catch (e) {
      report_path = null;
      summary += ` (report non scritto: ${e.code ?? e.message}; pieno disponibile in-memory)`;
    }
  }

  return { summary, report_path, report, decisions: decisions.length, changes: changes.length };
}

export default { buildPopReport };

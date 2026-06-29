/**
 * context-assembler — assembla il blocco <context> strutturato dalle lane del vars-queue (Fase 1).
 *
 * Implementa il design di ../../wiki/concepts/wrapper-context-assembly-example.md (le lane serializzate)
 * e ../../wiki/concepts/structured-context-sections.md. Disaccoppiato da pi (prende un VarsQueue, ritorna
 * una stringa) → testabile con node puro, senza npm install / Docker. La thin pi-extension
 * `.pi/extensions/context-assembly.ts` chiamerà questa funzione dentro l'hook `context`/`before_agent_start`.
 *
 * Lane assemblate (sottoinsieme Fase-1 dell'esempio canonico):
 *   <rules>           regole always-context (severità hard/strong/soft)
 *   <current_aim>     il task puntato da CURR
 *   <task_list>       task pending + in_progress (open-loop)
 *   <verify_queue>    verifiche pendenti
 *   <vars>            var condivise (+ private dell'agente), con last_modified
 *   <recent_changes>  change-log recente (visibile-finché-serve): chi/quando/cosa
 */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {{ sinceMs?: number, maxChanges?: number, includePrivateVars?: boolean, now?: number }} [opts]
 *        sinceMs: epoch ms da cui mostrare i change recenti (default: ultimi 15 min relativi a `now`).
 *        now: epoch ms "adesso" (iniettato per test deterministici; default Date.now()).
 * @returns {string} blocco <context> ...</context>
 */
export function assembleContext(vq, opts = {}) {
  const now = opts.now ?? Date.now();
  const sinceMs = opts.sinceMs ?? (now - 15 * 60 * 1000);
  const maxChanges = opts.maxChanges ?? 12;

  const lines = ["<context>"];

  // --- rules (ordinate per severità: hard > strong > soft) ---
  const sevRank = { hard: 0, strong: 1, soft: 2 };
  const rules = vq.listRules().sort((a, b) => (sevRank[a.severity] ?? 9) - (sevRank[b.severity] ?? 9));
  lines.push("  <rules>");
  for (const r of rules) lines.push(`    - [${r.severity}] ${esc(r.text)}`);
  lines.push("  </rules>");

  // --- current_aim ---
  const currId = vq.getCurr();
  const curr = currId ? vq.getTask(currId) : null;
  lines.push(curr
    ? `  <current_aim id="${esc(curr.id)}" status="${esc(curr.status)}">${esc(curr.title)}</current_aim>`
    : `  <current_aim>(nessuno)</current_aim>`);

  // --- task_list (open-loop: pending + in_progress) ---
  const open = [...vq.listTasks({ status: "in_progress" }), ...vq.listTasks({ status: "pending" })];
  lines.push("  <task_list>");
  for (const t of open) lines.push(`    - [${t.status}] ${esc(t.id)}: ${esc(t.title)}`);
  lines.push("  </task_list>");

  // --- verify_queue (pendenti) ---
  const pendingV = vq.listVerifications({ status: "pending" });
  if (pendingV.length) {
    lines.push("  <verify_queue>");
    for (const v of pendingV) lines.push(`    - ${esc(v.id)} (task ${esc(v.task_id)})${v.detail ? `: ${esc(v.detail)}` : ""}`);
    lines.push("  </verify_queue>");
  }

  // --- vars (shared + opzionalmente private dell'agente) ---
  const shared = vq.getSharedView();
  const priv = opts.includePrivateVars ? vq.listVars({ scope: "private", namespace: vq.agent }) : [];
  const vars = [...shared, ...priv];
  if (vars.length) {
    lines.push("  <vars>");
    for (const v of vars) {
      const ageS = Math.round((now - v.last_modified) / 1000);
      lines.push(`    - ${esc(v.id)}=${esc(JSON.stringify(v.value))} (scope=${v.scope}, ${ageS}s fa${v.decision_ref ? `, per ${esc(v.decision_ref)}` : ""})`);
    }
    lines.push("  </vars>");
  }

  // --- recent_changes (visibile-finché-serve) ---
  const changes = vq.getChangeLog({ since: sinceMs, limit: maxChanges });
  if (changes.length) {
    lines.push("  <recent_changes>");
    for (const c of changes) {
      const ageS = Math.round((now - c.ts) / 1000);
      const what = c.old_value != null ? `${esc(c.old_value)}→${esc(c.new_value)}` : `=${esc(c.new_value)}`;
      lines.push(`    - ${ageS}s fa, ${esc(c.who)}: ${esc(c.entity)}/${esc(c.entity_id)}.${esc(c.field)} ${what}${c.decision_ref ? ` (${esc(c.decision_ref)})` : ""}`);
    }
    lines.push("  </recent_changes>");
  }

  lines.push("</context>");
  return lines.join("\n");
}

export default assembleContext;

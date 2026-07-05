/**
 * context-invariants — verifica la COERENZA dello stato del workspace (aim / task_list / deps).
 *
 * Origine: utente msg 1067 ("quando faremo i test di training/RL, verificare che TUTTI i parametri del contesto vengano
 * aggiornati correttamente, coerentemente e al momento giusto; es. aim non può restare vuoto").
 *
 * Doppio uso:
 *  (1) DIAGNOSTICA HARNESS — becca bug di wiring (aim vuoto a task attivo, aim che punta al nulla, stato incoerente).
 *  (2) RL-TIME — MISURA se il modello mantiene lo stato coerente durante un rollout.
 *
 * ⚠ ANTI-REWARD-HACKING (regola #10, [[feedback_reward_hacking_principle]]): se usato come segnale di REWARD, ancoralo
 * all'OUTCOME (task risolto CON stato coerente), MAI alla sola cerimonia "aim non-vuoto" — altrimenti il modello riempie
 * aim di spazzatura per passare il check. Qui è un OSSERVATORE puro: riporta le violazioni, non premia nulla.
 *
 * severity: "error" = incoerenza reale (non dovrebbe mai accadere col wiring corretto → bug o corruzione);
 *           "warn"  = stato sub-ottimale/transitorio che il modello dovrebbe correggere (es. aim vuoto mentre lavora).
 */
import { TASK_STATUSES } from "./vars-queue.mjs";

/**
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @returns {{code:string, severity:"error"|"warn", detail:string, taskId?:string}[]} violazioni (array vuoto = coerente)
 */
export function checkContextInvariants(vq) {
  const v = [];
  const tasks = vq.listTasks();
  const byId = new Map(tasks.map((t) => [String(t.id), t]));
  const doneSet = new Set(tasks.filter((t) => t.status === "done").map((t) => String(t.id)));
  const aim = vq.getCurr();

  for (const t of tasks) {
    // I1 — status ∈ enum (difesa-in-profondità: setTaskStatus già rifiuta, questo becca corruzione/bypass del DB).
    if (!TASK_STATUSES.includes(t.status)) {
      v.push({ code: "invalid-status", severity: "error", taskId: String(t.id), detail: `task '${t.id}' ha status '${t.status}' ∉ {${TASK_STATUSES.join("|")}}` });
    }
    // I2 — nessun task 'in_progress' con deps non-'done' (coerente col deps-guard di setTaskStatus; forward-ref = non-done).
    if (t.status === "in_progress") {
      const unmet = (t.deps ?? []).filter((d) => !doneSet.has(String(d)));
      if (unmet.length) {
        v.push({ code: "active-blocked", severity: "error", taskId: String(t.id), detail: `task '${t.id}' è in_progress ma bloccato da deps non-'done': ${unmet.join(", ")}` });
      }
    }
  }

  const active = tasks.filter((t) => t.status === "in_progress");
  const aimSet = aim != null && aim !== "";

  // I3 — aim non-vuoto mentre si lavora (utente msg 1067: "aim non può restare vuoto").
  if (active.length > 0 && !aimSet) {
    v.push({ code: "aim-empty-with-active", severity: "warn", detail: `${active.length} task in_progress ma <current_aim> è vuoto — punta l'aim al task su cui stai lavorando` });
  }
  // I4 — aim dangling: se settato, deve puntare a un task ESISTENTE.
  if (aimSet && !byId.has(String(aim))) {
    v.push({ code: "aim-dangling", severity: "error", detail: `<current_aim> punta a '${aim}', che non è un task esistente` });
  }
  // I5 — aim su task già CHIUSO (done/cancelled) = stato stantio da aggiornare.
  if (aimSet && byId.has(String(aim))) {
    const st = byId.get(String(aim)).status;
    if (st === "done" || st === "cancelled") {
      v.push({ code: "aim-on-closed", severity: "warn", taskId: String(aim), detail: `<current_aim> punta a '${aim}' che è già '${st}' — aggiorna l'aim al prossimo task aperto` });
    }
  }

  return v;
}

/** True se lo stato è pienamente coerente (nessuna violazione di severity 'error'). warn ammessi. */
export function isContextCoherent(vq) {
  return checkContextInvariants(vq).every((x) => x.severity !== "error");
}

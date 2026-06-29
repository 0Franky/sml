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

import { buildMessagesLane } from "./conversation-store.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Timestamp assoluto stabile (ISO-8601 al secondo, UTC). Deterministico: `new Date(ms)` con argomento esplicito. */
const isoSec = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

/**
 * Età di un'entry, in due regimi:
 *  - relativo (default): "Ns fa" → leggibile ma VOLATILE (cambia ad ogni richiesta → rompe il KV-cache).
 *  - assoluto (`absoluteTimestamps`): "@ISO" → STABILE finché l'entry non cambia (cache-friendly); l'età si
 *    calcola rispetto all'anchor `<current_time>` in fondo al <context> (unica riga che cambia per richiesta).
 */
const fmtAge = (ms, now, absolute) => (absolute ? `@${isoSec(ms)}` : `${Math.round((now - ms) / 1000)}s fa`);

/** Finestra temporale condivisa: <recent_changes> e il self-gating del resume usano la STESSA soglia → niente
 *  banda di overlap (banner di resume mostrato mentre recent_changes è ancora pieno). */
const RECENT_WINDOW_MS = 15 * 60 * 1000;

/* ── CONTRATTO stable-prefix (cache-stable-prefix, 2026-06-29) ───────────────────────────────────────────────
 * Per massimizzare gli hit di KV-cache del provider il <context> è ordinato STABILE-in-testa / VOLATILE-in-fondo:
 *   PREFISSO STABILE  : <rules> → <current_aim> → <task_list> → <verify_queue>   (nessun timestamp; cambia SOLO
 *                       su evento semantico; sort con tiebreaker deterministico per id → byte-identico cross-turno)
 *   ZONA VOLATILE     : <vars> → <recent_changes> → <notes>                       (in coda; in regime
 *                       `absoluteTimestamps` le età sono @ISO = byte-stabili finché l'entry non muta)
 *   ANCHOR            : <current_time> (ultima riga, solo in regime assoluto) = UNICA riga che cambia per richiesta
 * → con `absoluteTimestamps:true`, due richieste con stato invariato differiscono SOLO per <current_time>:
 *   tutto il resto è prefisso cacheabile. (NB: <recent_changes> resta intrinsecamente volatile per via della
 *   finestra `sinceMs` — per questo sta in fondo.) Regime di default = relativo (immutato), l'extension/training
 *   sceglierà se attivare l'assoluto (decisione di formato legata a Strada-2 / train-serve). */

/** Durata leggibile (idle resume): s → m → h → d. */
function humanAge(ms) {
  const s = Math.round(ms / 1000);
  if (s < 90) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 90) return `${m}min`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}g`;
}

/**
 * buildResumeDigest — lane "where we left off" (fix gap dogfood Sonnet 2026-06-29).
 *
 * Produce un blocco <resuming_from> compatto SOLO quando stiamo RIPRENDENDO dopo un gap (nuova sessione /
 * lunga inattività): legge dallo stato persistito (current_aim + task aperti + ultime decisioni + handoff-note)
 * SENZA il cutoff 15-min di recent_changes — così, dove recent_changes si svuota dopo un gap reale, il modello
 * vede comunque "da dove riparte". Self-gating sul tempo: se l'ultima attività è recente (< resumeGapMs) siamo
 * IN sessione attiva → ritorna "" (lo stato è già nelle altre lane, niente banner ridondante).
 *
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {{ now?: number, resumeGapMs?: number, force?: boolean }} [opts]
 * @returns {string} blocco "  <resuming_from …>…</resuming_from>" oppure "" (sessione attiva / nessuno stato)
 */
export function buildResumeDigest(vq, opts = {}) {
  const now = opts.now ?? Date.now();
  const resumeGapMs = opts.resumeGapMs ?? RECENT_WINDOW_MS; // allineato a recent_changes → no banda di overlap

  const currId = vq.getCurr();
  const curr = currId ? vq.getTask(currId) : null;
  const open = [...vq.listTasks({ status: "in_progress" }), ...vq.listTasks({ status: "pending" })];
  const handoff = vq.listVars({ namespace: "handoff" }).sort((a, b) => b.last_modified - a.last_modified)[0] ?? null;

  // niente stato persistito → sessione genuinamente fresca → niente resume.
  if (!curr && open.length === 0 && !handoff) return "";

  // ultima attività osservabile (esclude i silent). Se è recente → sessione attiva → niente banner.
  const last = vq.getChangeLog({ limit: 1 })[0];
  const lastTs = Math.max(handoff?.last_modified ?? 0, last?.ts ?? 0);
  if (!opts.force && lastTs && now - lastTs < resumeGapMs) return "";

  const idleAttr = lastTs ? `${humanAge(now - lastTs)} fa` : "sconosciuto";
  const lines = [`  <resuming_from idle="${idleAttr}">`];
  if (curr) lines.push(`    - aim: ${esc(curr.id)} (${esc(curr.status)}) ${esc(curr.title)}`);
  if (open.length) {
    const head = open.slice(0, 5).map((t) => `${esc(t.id)} [${t.status}]`).join(", ");
    lines.push(`    - task aperti: ${open.length}${open.length > 5 ? " (primi 5)" : ""} — ${head}`);
  }
  // ultime decisioni = var shared con decision_ref (le scelte ancorate), più recenti prima.
  const decisions = vq.getSharedView()
    .filter((v) => v.decision_ref)
    .sort((a, b) => b.last_modified - a.last_modified)
    .slice(0, 4);
  if (decisions.length) {
    lines.push(`    - ultime decisioni: ${decisions.map((v) => `${esc(v.id)}=${esc(JSON.stringify(v.value))} (${esc(v.decision_ref)})`).join("; ")}`);
  }
  // handoff-note esplicita (scritta dal flush su session_before_compact): "prossimo passo".
  if (handoff && handoff.value != null) {
    const note = typeof handoff.value === "object" ? (handoff.value.next_step ?? handoff.value.summary ?? JSON.stringify(handoff.value)) : handoff.value;
    if (note) lines.push(`    - prossimo passo: ${esc(note)}`);
  }
  const realGap = lastTs && now - lastTs >= resumeGapMs;
  lines.push(realGap
    ? `    (ripresa dopo gap; usa get_changelog/list_tasks per il dettaglio completo)`
    : `    (snapshot stato corrente; usa get_changelog/list_tasks per il dettaglio completo)`);
  lines.push(`  </resuming_from>`);
  return lines.join("\n");
}

/**
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {{ sinceMs?: number, maxChanges?: number, includePrivateVars?: boolean, now?: number }} [opts]
 *        sinceMs: epoch ms da cui mostrare i change recenti (default: ultimi 15 min relativi a `now`).
 *        now: epoch ms "adesso" (iniettato per test deterministici; default Date.now()).
 * @returns {string} blocco <context> ...</context>
 */
export function assembleContext(vq, opts = {}) {
  const now = opts.now ?? Date.now();
  const sinceMs = opts.sinceMs ?? (now - RECENT_WINDOW_MS);
  const maxChanges = opts.maxChanges ?? 12;
  const abs = opts.absoluteTimestamps ?? false; // cache-stable-prefix: età assolute @ISO invece di "Ns fa"

  const lines = ["<context>"];

  // --- rules (ordinate per severità: hard > strong > soft; tiebreaker per id → ordine deterministico) ---
  const sevRank = { hard: 0, strong: 1, soft: 2 };
  const rules = vq.listRules().sort((a, b) =>
    ((sevRank[a.severity] ?? 9) - (sevRank[b.severity] ?? 9)) || String(a.id).localeCompare(String(b.id)));
  lines.push("  <rules>");
  for (const r of rules) lines.push(`    - [${r.severity}] ${esc(r.text)}`);
  lines.push("  </rules>");

  // --- current_aim ---
  const currId = vq.getCurr();
  const curr = currId ? vq.getTask(currId) : null;
  lines.push(curr
    ? `  <current_aim id="${esc(curr.id)}" status="${esc(curr.status)}">${esc(curr.title)}</current_aim>`
    : `  <current_aim>(nessuno)</current_aim>`);

  // --- task_list (open-loop: pending + in_progress) — ORDINE DI ESECUZIONE + cap + SEGNALE anti-cecità ---
  //     focusTaskIds (matrioska, nested-compact): se presente, la lista è FILTRATA al subset messo a fuoco
  //     (lo zoom-IN mostra solo i task dello scope; il resto vive nel <frame> come backlog).
  //     Anti-cecità (msg 515): i task sono in execution-order (i più importanti PRIMA, così il cap non li nasconde)
  //     e, se troncato su backlog STRUTTURATO, il segnale riporta il breakdown per priorità H/M/L dei nascosti. ---
  const maxTasks = opts.maxTasks ?? 20;
  const focusSet = Array.isArray(opts.focusTaskIds) ? new Set(opts.focusTaskIds.map(String)) : null;
  const ordered = vq.listTasksOrdered(); // {structured, tasks} già in execution-order se strutturato
  const openAll = focusSet ? ordered.tasks.filter((t) => focusSet.has(String(t.id))) : ordered.tasks;
  const open = openAll.slice(0, maxTasks);
  const bucket = (p) => (p >= 1 ? "H" : p <= -1 ? "L" : "M"); // H=priority>0, M=default(0), L=priority<0
  lines.push(focusSet ? `  <task_list focus="${open.length}">` : "  <task_list>");
  for (const t of open) {
    // 'waiting-deps' (non 'blocked') per il flag derivato: 'blocked' è riservato allo STATUS manuale → niente
    // collisione terminologica (review P2: ready=deps-done ≠ blocked-status).
    const meta = ordered.structured
      ? ` ${t.ready ? "ready" : "waiting-deps"}${t.priority ? ` prio=${t.priority}` : ""}${t.unblocks ? ` unblocks=${t.unblocks}` : ""}`
      : "";
    lines.push(`    - [${t.status}]${meta} ${esc(t.id)}: ${esc(t.title)}`);
  }
  const hidden = openAll.slice(maxTasks);
  if (hidden.length) {
    if (ordered.structured) {
      const b = { H: 0, M: 0, L: 0 };
      for (const t of hidden) b[bucket(t.priority ?? 0)]++;
      lines.push(`    - (+${hidden.length} task aperti non mostrati — priorità H:${b.H} M:${b.M} L:${b.L} — usa list_tasks per l'elenco completo)`);
    } else {
      lines.push(`    - (+${hidden.length} task aperti non mostrati — usa list_tasks per l'elenco completo)`);
    }
  }
  lines.push("  </task_list>");

  // --- verify_queue (pendenti) ---
  const pendingV = vq.listVerifications({ status: "pending" });
  if (pendingV.length) {
    lines.push("  <verify_queue>");
    for (const v of pendingV) lines.push(`    - ${esc(v.id)} (task ${esc(v.task_id)})${v.detail ? `: ${esc(v.detail)}` : ""}`);
    lines.push("  </verify_queue>");
  }

  // --- vars (shared + opzionalmente private dell'agente) — WINDOWED: cap alle più recenti (lane bounded
  //     anche su sessioni lunghe; le più vecchie restano nel datastore, richiamabili con get_shared_view) ---
  const maxVars = opts.maxVars ?? 12;
  const shared = vq.getSharedView();
  const priv = opts.includePrivateVars ? vq.listVars({ scope: "private", namespace: vq.agent }) : [];
  const allVars = [...shared, ...priv].sort((a, b) =>
    (b.last_modified - a.last_modified) || String(a.id).localeCompare(String(b.id)));
  const vars = allVars.slice(0, maxVars);
  if (vars.length) {
    lines.push("  <vars>");
    for (const v of vars) {
      lines.push(`    - ${esc(v.id)}=${esc(JSON.stringify(v.value))} (scope=${v.scope}, ${fmtAge(v.last_modified, now, abs)}${v.decision_ref ? `, per ${esc(v.decision_ref)}` : ""})`);
    }
    if (allVars.length > vars.length) {
      lines.push(`    - (+${allVars.length - vars.length} più vecchie nascoste — usa get_shared_view per l'elenco completo)`);
    }
    lines.push("  </vars>");
  }

  // --- recent_changes (visibile-finché-serve) — finestra temporale + cap, con SEGNALE se troncato ---
  //     fetch maxChanges+1 per sapere se ce ne sono altri oltre il cap (le memo silenziose sono già escluse). ---
  const changesPlus = vq.getChangeLog({ since: sinceMs, limit: maxChanges + 1 });
  const changes = changesPlus.slice(0, maxChanges);
  if (changes.length) {
    lines.push("  <recent_changes>");
    for (const c of changes) {
      const what = c.old_value != null ? `${esc(c.old_value)}→${esc(c.new_value)}` : `=${esc(c.new_value)}`;
      lines.push(`    - ${fmtAge(c.ts, now, abs)}, ${esc(c.who)}: ${esc(c.entity)}/${esc(c.entity_id)}.${esc(c.field)} ${what}${c.decision_ref ? ` (${esc(c.decision_ref)})` : ""}`);
    }
    if (changesPlus.length > changes.length) lines.push(`    - (+altri cambi più vecchi o oltre la finestra — usa get_changelog per la storia completa)`);
    lines.push("  </recent_changes>");
  }

  // --- notes/memo: ESCLUSE dal flusso (silent) per non inquinare → ma SEGNALA che esistono, altrimenti
  //     il modello non sa di poterle richiamare. (memo namespace = convenzione condivisa con error-memo.) ---
  const memoCount = vq.listVars({ namespace: "memo" }).length;
  if (memoCount) lines.push(`  <notes count="${memoCount}">${memoCount} lezione/i-memo disponibile/i (non mostrate qui) — usa recall_lessons per richiamarle</notes>`);

  // --- anchor temporale (cache-stable-prefix): UNICA riga volatile per richiesta in regime assoluto;
  //     l'età di vars/recent_changes si calcola rispetto a questo. In regime relativo è implicito (omesso). ---
  if (abs) lines.push(`  <current_time>${isoSec(now)}</current_time>`);

  lines.push("</context>");
  return lines.join("\n");
}

/**
 * buildWorkspace — compone la "mente in prima persona" completa (Strada 2, ADR 2026-06-29-context-as-first-person-mind):
 *   <resuming_from>      (transiente: solo se si riprende dopo un gap — self-gating sul tempo)
 *   <context>…</context> (workspace: prefisso STABILE + stato VOLATILE in coda)
 *   <messages_with_user> (la chat: blocco SEPARATO e ULTIMO, zona volatile, DOPO </context>)
 * È ciò che la pi-extension `context-assembly` antepone al system prompt. La finestra verbatim della chat sta
 * in fondo (volatile) per NON intaccare il prefisso cache-stable (review-loop 2026-06-29).
 *
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {{ store?: import("./conversation-store.mjs").ConversationStore, convId?: string, now?: number,
 *           absoluteTimestamps?: boolean, messagesN?: number, messagesCharCap?: number, includePrivateVars?: boolean,
 *           sinceMs?: number, maxChanges?: number, maxTasks?: number, maxVars?: number,
 *           resumeGapMs?: number, forceResume?: boolean }} [opts]
 * @returns {string} il workspace completo (resume? + context + messages?)
 */
export function buildWorkspace(vq, opts = {}) {
  const now = opts.now ?? Date.now();
  const parts = [];
  const resume = buildResumeDigest(vq, { now, resumeGapMs: opts.resumeGapMs, force: opts.forceResume });
  if (resume) parts.push(resume);
  parts.push(assembleContext(vq, opts));
  if (opts.store && opts.convId) {
    const lane = buildMessagesLane(opts.store, opts.convId, { n: opts.messagesN ?? 6, charCap: opts.messagesCharCap });
    if (lane) parts.push(lane);
  }
  return parts.join("\n");
}

/**
 * buildAimTail — il blocco `<current_aim_reminder>` (aim-in-coda, anti position-bias) come funzione NODE-PURE,
 * così l'escape XML (anti prompt-injection: id/title sono user/model-content) è centralizzato e testabile.
 * Ritorna "" se non c'è un CURR. @param {import("./vars-queue.mjs").VarsQueue} vq @returns {string}
 */
export function buildAimTail(vq) {
  const currId = vq.getCurr();
  const curr = currId ? vq.getTask(currId) : null;
  if (!curr) return "";
  return `\n<current_aim_reminder>Aim corrente: ${esc(curr.id)} — ${esc(curr.title ?? "")}</current_aim_reminder>`;
}

/**
 * buildExecutionOrderLines — le righe della vista `<execution_order>` (inject-mode) come funzione NODE-PURE.
 * id/status/title (user/model-content) sono XML-escaped (review P1: era l'unico path d'iniezione non escapato);
 * ready/unblocks/priority sono numeri/boolean → sicuri. @param {object[]} tasks @param {boolean} structured
 * @returns {string[]}
 */
export function buildExecutionOrderLines(tasks, structured) {
  return tasks.map(
    (t) =>
      `  - ${esc(t.id)} [${esc(t.status)}]${structured ? ` ready=${t.ready} unblocks=${t.unblocks} prio=${t.priority}` : ""} : ${esc(t.title ?? "")}`,
  );
}

export default assembleContext;

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
import { DEFAULT_MESSAGES_WINDOW_N } from "./lane-defaults.mjs"; // SSOT finestra lane messaggi (buildWorkspace)
import { listScratch, DEFAULT_MAX_SCRATCH } from "./scratch.mjs"; // SSOT scratchpad VOLATILE rolling (<scratch>)

// Display-cap delle lane (context-section-sizing): quante entry mostrare per lane prima del marker "+N nascosti".
// Nominati una volta (audit SSOT/DRY 2026-07-04, CLAUDE.md #16): erano 4 literal `12` sparsi + un `?? 12` ridondante.
const DEFAULT_MAX_FACTS = 12;
const DEFAULT_MAX_CHANGES = 12;
const DEFAULT_MAX_VARS = 12;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Timestamp assoluto stabile (ISO-8601 al secondo, UTC). Deterministico: `new Date(ms)` con argomento esplicito. */
const isoSec = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

/** Data corrente a granularità GIORNO (ISO-8601 YYYY-MM-DD, UTC). Deterministico. È l'ANCHOR EPISTEMICO
 *  (`<current_date>`): a differenza di `<current_time>` (al secondo, volatile, per il calcolo-età) cambia solo
 *  una volta al giorno → cache-stable nel prefisso. Fornisce al modello il "quando siamo" per il ragionamento di
 *  recency/staleness — la conoscenza del modello è congelata al training-cutoff, questa riga dice che ORA è dopo.
 *  Split F/S (CLAUDE.md #11): l'harness INIETTA il fatto-data (F); ragionare su cosa IMPLICA (la mia conoscenza è
 *  vecchia → verifico invece di asserire) è la skill di TRAINING (class-temporal-awareness / epistemic-recency). */
const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * Età di un'entry, in due regimi:
 *  - relativo (default): "Ns fa" → leggibile ma VOLATILE (cambia ad ogni richiesta → rompe il KV-cache).
 *  - assoluto (`absoluteTimestamps`): "@ISO" → STABILE finché l'entry non cambia (cache-friendly); l'età si
 *    calcola rispetto all'anchor `<current_time>` in fondo al <context> (unica riga che cambia per richiesta).
 */
const fmtAge = (ms, now, absolute) => (absolute ? `@${isoSec(ms)}` : `${Math.round((now - ms) / 1000)}s ago`);

/** Finestra temporale condivisa: <recent_changes> e il self-gating del resume usano la STESSA soglia → niente
 *  banda di overlap (banner di resume mostrato mentre recent_changes è ancora pieno). */
const RECENT_WINDOW_MS = 15 * 60 * 1000;

/** Cap-char su un SINGOLO `detail` di verify_queue: il gate (pending) resta SEMPRE visibile — MAI cappare il
 *  NUMERO di pending (nasconderebbe un controllo non soddisfatto = falla silenziosa) — ma un detail verboso si
 *  tronca con marker, così la lane resta bounded senza occultare gate. (context-section-sizing-study §verify_queue.) */
const VERIFY_DETAIL_CAP = 200;
const capDetail = (s) => {
  const t = String(s);
  return t.length > VERIFY_DETAIL_CAP ? `${t.slice(0, VERIFY_DETAIL_CAP)}…[+${t.length - VERIFY_DETAIL_CAP}]` : t;
};

/* ── CONTRATTO stable-prefix (cache-stable-prefix, 2026-06-29) ───────────────────────────────────────────────
 * Per massimizzare gli hit di KV-cache del provider il <context> è ordinato STABILE-in-testa / VOLATILE-in-fondo:
 *   ANCHOR EPISTEMICO : <current_date> (opt-in `currentDate`, granularità GIORNO → cambia 1×/giorno, resta nel
 *                       prefisso cacheabile: NON è la riga volatile-per-richiesta, quella è <current_time> sotto)
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
  return `${Math.round(h / 24)}d`;
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

  const idleAttr = lastTs ? `${humanAge(now - lastTs)} ago` : "unknown";
  const lines = [`  <resuming_from idle="${idleAttr}">`];
  if (curr) lines.push(`    - aim: ${esc(curr.id)} (${esc(curr.status)}) ${esc(curr.title)}`);
  if (open.length) {
    const head = open.slice(0, 5).map((t) => `${esc(t.id)} [${t.status}]`).join(", ");
    lines.push(`    - open tasks: ${open.length}${open.length > 5 ? " (first 5)" : ""} — ${head}`);
  }
  // ultime decisioni = var shared con decision_ref (le scelte ancorate), più recenti prima.
  const decisions = vq.getSharedView()
    .filter((v) => v.decision_ref)
    .sort((a, b) => b.last_modified - a.last_modified)
    .slice(0, 4);
  if (decisions.length) {
    lines.push(`    - latest decisions: ${decisions.map((v) => `${esc(v.id)}=${esc(JSON.stringify(v.value))} (${esc(v.decision_ref)})`).join("; ")}`);
  }
  // handoff-note esplicita (scritta dal flush su session_before_compact): "prossimo passo".
  if (handoff && handoff.value != null) {
    const note = typeof handoff.value === "object" ? (handoff.value.next_step ?? handoff.value.summary ?? JSON.stringify(handoff.value)) : handoff.value;
    if (note) lines.push(`    - next step: ${esc(note)}`);
  }
  const realGap = lastTs && now - lastTs >= resumeGapMs;
  lines.push(realGap
    ? `    (resuming after a gap; use get_changelog/list_tasks for the full detail)`
    : `    (current state snapshot; use get_changelog/list_tasks for the full detail)`);
  lines.push(`  </resuming_from>`);
  return lines.join("\n");
}

/** Testo/importanza robusti di un fatto (value = {text, importance} nuovo, o stringa legacy). */
function factText(v) { return v && typeof v === "object" && !Array.isArray(v) ? String(v.text ?? "") : String(v ?? ""); }
function factImp(v)  { return v && typeof v === "object" && Number.isFinite(v.importance) ? Number(v.importance) : 0; }

/**
 * factsLaneLines — righe della lane <facts> (note-fatto DUREVOLI, namespace 'fact', tool `note`/`remove_note`).
 * Resa INLINE ("conoscenza già pronta", zero recall), BOUNDED (cap), ordinata per IMPORTANZA stabile poi recency
 * → i fatti pinned restano in cima. **Nessuna età renderizzata** di proposito: in regime relativo un "Ns ago"
 * cambierebbe ogni turno e romperebbe la cache; così la lane è BYTE-STABILE finché non si scrive/rimuove un fatto
 * (cache-friendly, e l'importanza — non un timestamp volatile — domina l'ordine: "importanza >>> cache", msg 880).
 * Un cap superato NON scarta in silenzio → segnala "+N, consolida". [] se non ci sono fatti.
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {{ maxFacts?: number }} [opts]
 * @returns {string[]}
 */
export function factsLaneLines(vq, { maxFacts = DEFAULT_MAX_FACTS } = {}) {
  const all = vq.listVars({ namespace: "fact" })
    .map((v) => ({ key: String(v.id).replace(/^fact:/, ""), text: factText(v.value), imp: factImp(v.value), ts: v.last_modified }))
    .filter((f) => f.text)
    .sort((a, b) => (b.imp - a.imp) || (b.ts - a.ts) || a.key.localeCompare(b.key));
  if (!all.length) return [];
  const shown = all.slice(0, maxFacts);
  const lines = ["  <facts>"];
  for (const f of shown) lines.push(`    - ${esc(f.key)}: ${esc(f.text)}${f.imp ? ` (imp=${f.imp})` : ""}`);
  if (all.length > shown.length) lines.push(`    - (+${all.length - shown.length} more — consolidate/remove with remove_note)`);
  lines.push("  </facts>");
  return lines;
}

/**
 * scratchLaneLines — righe della lane <scratch> (note VOLATILI rolling, namespace 'scratch', tool `jot`).
 * DISTINTA da <facts> (durevole): qui si mostra la finestra ROLLING delle più RECENTI (cap display), newest-first;
 * le più vecchie **rollano via** (potate dallo store o oltre il cap) → è lo scratchpad dell'indagine, non memoria
 * permanente (utente msg 1134, [[concepts/stuck-state-focus-protocol]] §3). Volatile → sta in coda (zona non-cacheata).
 * Un cap superato NON scarta in silenzio: segnala "+N older, recall_scratch/clear_scratch". [] se non ci sono note.
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {{ maxScratch?: number }} [opts]
 * @returns {string[]}
 */
export function scratchLaneLines(vq, { maxScratch = DEFAULT_MAX_SCRATCH } = {}) {
  const all = listScratch(vq); // recenti prima
  if (!all.length) return [];
  const shown = all.slice(0, maxScratch);
  const lines = ["  <scratch>"];
  for (const s of shown) lines.push(`    - ${esc(s.text)}`);
  if (all.length > shown.length) lines.push(`    - (+${all.length - shown.length} older, rolling off — recall_scratch to see more, clear_scratch to reset)`);
  lines.push("  </scratch>");
  return lines;
}

/**
 * @param {import("./vars-queue.mjs").VarsQueue} vq
 * @param {{ sinceMs?: number, maxChanges?: number, includePrivateVars?: boolean, now?: number, maxFacts?: number }} [opts]
 *        sinceMs: epoch ms da cui mostrare i change recenti (default: ultimi 15 min relativi a `now`).
 *        now: epoch ms "adesso" (iniettato per test deterministici; default Date.now()).
 * @returns {string} blocco <context> ...</context>
 */
export function assembleContext(vq, opts = {}) {
  const now = opts.now ?? Date.now();
  const sinceMs = opts.sinceMs ?? (now - RECENT_WINDOW_MS);
  const maxChanges = opts.maxChanges ?? DEFAULT_MAX_CHANGES;
  const abs = opts.absoluteTimestamps ?? false; // cache-stable-prefix: età assolute @ISO invece di "Ns fa"

  const lines = ["<context>"];

  // --- current_date (ANCHOR EPISTEMICO, opt-in `currentDate`): prima riga del prefisso STABILE. Granularità GIORNO
  //     → cache-stable nel prefisso (cambia 1×/giorno, non per-richiesta come <current_time>). Dà al modello il
  //     "quando siamo" per il ragionamento di recency (la sua conoscenza è ferma al training-cutoff). Solo il FATTO
  //     (F, CLAUDE.md #11); il ragionamento su cosa implica è la skill di training (class-temporal-awareness). ---
  if (opts.currentDate) lines.push(`  <current_date>${isoDate(now)}</current_date>`);

  // --- rules: RAGGRUPPATE per categoria (concentrazione del modello, msg 1067), poi per severità (hard>strong>soft),
  // poi per id → prefisso cache-stabile (categorie in ordine fisso + tiebreaker deterministico) byte-identico cross-turno.
  const sevRank = { hard: 0, strong: 1, soft: 2 };
  const CAT_ORDER = ["safety", "task", "memory", "general"];
  const catRank = (c) => { const i = CAT_ORDER.indexOf(c); return i < 0 ? CAT_ORDER.length : i; };
  const rules = vq.listRules().sort((a, b) =>
    (catRank(a.category) - catRank(b.category)) ||
    ((sevRank[a.severity] ?? 9) - (sevRank[b.severity] ?? 9)) ||
    String(a.id).localeCompare(String(b.id)));
  lines.push("  <rules>");
  let curCat = null;
  for (const r of rules) {
    const cat = r.category || "general";
    if (cat !== curCat) { lines.push(`    [${cat}]`); curCat = cat; }
    lines.push(`    - [${r.severity}] ${esc(r.text)}`);
  }
  lines.push("  </rules>");

  // --- current_aim ---
  const currId = vq.getCurr();
  const curr = currId ? vq.getTask(currId) : null;
  lines.push(curr
    ? `  <current_aim id="${esc(curr.id)}" status="${esc(curr.status)}">${esc(curr.title)}</current_aim>`
    : `  <current_aim>(none)</current_aim>`);

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
      lines.push(`    - (+${hidden.length} open tasks not shown — priority H:${b.H} M:${b.M} L:${b.L} — use list_tasks for the full list)`);
    } else {
      lines.push(`    - (+${hidden.length} open tasks not shown — use list_tasks for the full list)`);
    }
  }
  lines.push("  </task_list>");

  // --- verify_queue (pendenti) ---
  const pendingV = vq.listVerifications({ status: "pending" });
  if (pendingV.length) {
    lines.push("  <verify_queue>");
    for (const v of pendingV) lines.push(`    - ${esc(v.id)} (task ${esc(v.task_id)})${v.detail ? `: ${esc(capDetail(v.detail))}` : ""}`);
    lines.push("  </verify_queue>");
  }

  // --- vars (shared + opzionalmente private dell'agente) — WINDOWED: cap alle più recenti (lane bounded
  //     anche su sessioni lunghe; le più vecchie restano nel datastore, richiamabili con get_shared_view) ---
  const maxVars = opts.maxVars ?? DEFAULT_MAX_VARS;
  const shared = vq.getSharedView();
  const priv = opts.includePrivateVars ? vq.listVars({ scope: "private", namespace: vq.agent }) : [];
  const allVars = [...shared, ...priv].sort((a, b) =>
    (b.last_modified - a.last_modified) || String(a.id).localeCompare(String(b.id)));
  const vars = allVars.slice(0, maxVars);
  if (vars.length) {
    lines.push("  <vars>");
    for (const v of vars) {
      lines.push(`    - ${esc(v.id)}=${esc(JSON.stringify(v.value))} (scope=${v.scope}, ${fmtAge(v.last_modified, now, abs)}${v.decision_ref ? `, for ${esc(v.decision_ref)}` : ""})`);
    }
    if (allVars.length > vars.length) {
      lines.push(`    - (+${allVars.length - vars.length} older ones hidden — use get_shared_view for the full list)`);
    }
    lines.push("  </vars>");
  }

  // --- facts (note-fatto DUREVOLI, namespace 'fact', tool `note`/`remove_note`) — SUBITO dopo <vars>: stessa cadenza
  //     di scrittura (cambia solo su note/remove_note) e PRIMA del churn per-turno (recent_changes/current_time) →
  //     resta nel prefisso cacheato nei turni senza scrittura. Ordine per importanza STABILE (pinned in cima). ---
  for (const l of factsLaneLines(vq, { maxFacts: opts.maxFacts })) lines.push(l);

  // --- secrets (inventario SEALED: nome + allowedSinks + flag, MAI il valore) — utente msg 727, chiude FIND-7
  //     (il modello ri-chiamava list_secrets 6× perché il context non glielo ri-mostrava). Renderer PURO: i dati
  //     arrivano da opts.secrets (= listSecretsMeta(), già la vista model-facing sicura) passati dall'estensione →
  //     l'assembler resta disaccoppiato dal registry. Condizionata: solo se ci sono secret (anti-bloat, principio
  //     "segnale condizionato-alla-rilevanza" dello studio context-sizing). La description è già sanitizzata a monte. ---
  const secretsMeta = Array.isArray(opts.secrets) ? opts.secrets : [];
  if (secretsMeta.length) {
    lines.push("  <secrets>");
    for (const s of secretsMeta) {
      // sinks=[] (LOCKED: NESSUNA destinazione permessa) è l'OPPOSTO di sinks=[*] (QUALSIASI host) — resa DISAMBIGUATA
      // (utente 2026-07-03): il vecchio "none" era ambiguo → il modello credeva il secret già usabile senza request_sink.
      const has = s.allowedSinks && s.allowedSinks.length;
      const sinks = has ? `sinks=[${esc(s.allowedSinks.join(","))}]` : "sinks=[] LOCKED";
      lines.push(`    - ${esc(s.name)} ${sinks}${s.allowLocalHttp ? " allowLocalHttp" : ""}${s.description ? ` (${esc(s.description)})` : ""}`);
    }
    lines.push("    - (sinks=[] LOCKED = the secret can be sent NOWHERE until you request_sink a host; sinks=[*] = ANY host — opposite of []. {{secret:NAME}} is a value you never see; preview_secret_use to plan.)");
    lines.push("  </secrets>");
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
    if (changesPlus.length > changes.length) lines.push(`    - (+other older changes or beyond the window — use get_changelog for the full history)`);
    lines.push("  </recent_changes>");
  }

  // --- scratch (note VOLATILI rolling, namespace 'scratch', tool `jot`) — zona VOLATILE in coda (churn per-turno,
  //     fuori dal prefisso cacheato). Rolling: le più recenti visibili, le vecchie rollano via. Distinta da <facts>. ---
  for (const l of scratchLaneLines(vq, { maxScratch: opts.maxScratch })) lines.push(l);

  // --- notes/memo: ESCLUSE dal flusso (silent) per non inquinare → ma SEGNALA che esistono, altrimenti
  //     il modello non sa di poterle richiamare. (memo namespace = convenzione condivisa con error-memo.) ---
  const memoCount = vq.listVars({ namespace: "memo" }).length;
  if (memoCount) lines.push(`  <notes count="${memoCount}">${memoCount} lesson-memo(s) available (not shown here) — use recall_lessons to recall them</notes>`);

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
 *           resumeGapMs?: number, forceResume?: boolean, excludeCurrentTurn?: boolean }} [opts]
 * @returns {string} il workspace completo (resume? + context + messages?)
 */
export function buildWorkspace(vq, opts = {}) {
  const now = opts.now ?? Date.now();
  const parts = [];
  const resume = buildResumeDigest(vq, { now, resumeGapMs: opts.resumeGapMs, force: opts.forceResume });
  if (resume) parts.push(resume);
  parts.push(assembleContext(vq, opts));
  if (opts.store && opts.convId) {
    // excludeCurrentTurn: la native-window porta già il turno corrente (keepTurns=1) → la lane mostra solo la storia.
    const lane = buildMessagesLane(opts.store, opts.convId, { n: opts.messagesN ?? DEFAULT_MESSAGES_WINDOW_N, charCap: opts.messagesCharCap, excludeCurrentTurn: opts.excludeCurrentTurn });
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
  return `\n<current_aim_reminder>Current aim: ${esc(curr.id)} — ${esc(curr.title ?? "")}</current_aim_reminder>`;
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

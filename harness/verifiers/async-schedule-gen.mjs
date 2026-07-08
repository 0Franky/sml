/**
 * async-schedule-gen — LABEL-GEN + ORACOLO per [[wiki/training-taxonomy/class-async-dispatch-and-prioritization]]
 * (utente msg 1369). Genera scenari di richieste MULTI-INTENTO e giudica uno scheduling proposto contro l'ottimo.
 *
 * Design (parallelo a deceptive-task-gen ma dominio DIVERSO): qui non si muta codice, si ragiona su una DECISIONE
 * strutturale di esecuzione. Uno scenario = lista di sotto-task, ognuno con attributi ETICHETTATI
 * {latency, dependsOn, needsUserInput, risky}; `userLeaving` = l'utente sta staccando (deadline).
 *
 * L'ORACOLO è deterministico e self-contained (rule #22: i fatti sono dati in-fixture, si testa il RAGIONAMENTO di
 * scheduling, non conoscenza-del-mondo). SSOT della politica = `optimalDecision`; `scoreSchedule` la riusa (DRY #16).
 *
 * La skill premiata (OUTCOME, non cerimonia — CLAUDE.md #10):
 *   - slow + indipendente + safe + no-input  → ASYNC (background), consegna on-completion   [il positivo-chiave]
 *   - fast + indipendente                    → INLINE, consegna IMMEDIATA                    [la parte "rispondi ora"]
 *   - dipende da un async                     → NON consegnare immediata (deferred)           [N1 dipendenza]
 *   - needsUserInput                          → ASK-FIRST (front-load se userLeaving)         [N3 + priorità]
 *   - risky                                   → NON fire-and-forget (sync-monitored)          [N4]
 *   - (fast non va mai in async → previene N2 all-fast e N5 over-parallel per costruzione)
 */

/** @typedef {{id:string,label?:string,latency:'fast'|'slow',dependsOn?:string[],needsUserInput?:boolean,risky?:boolean}} Subtask */
/** @typedef {{name:string,request?:string,userLeaving?:boolean,subtasks:Subtask[]}} Scenario */
/** @typedef {{mode:'inline'|'async'|'deferred'|'ask-first'|'sync-monitored',deliver:'immediate'|'on-completion'|'blocked',priority:number}} Decision */

const MODES = ["inline", "async", "deferred", "ask-first", "sync-monitored"];
const DELIVERS = ["immediate", "on-completion", "blocked"];

/**
 * true se `t` (transitivamente) dipende da un sotto-task NON-risolto-al-dispatch: uno SLOW (async in corso),
 * uno needsUserInput (in attesa della risposta utente), uno risky (in monitoraggio), o uno a sua volta bloccato.
 * → `t` non può partire subito ⇒ NON è consegnabile immediata (va deferred). Un dep solo-fast-inline non blocca.
 */
function dependsOnUnresolved(t, byId, seen = new Set()) {
  for (const dep of t.dependsOn || []) {
    if (seen.has(dep)) continue;
    seen.add(dep);
    const d = byId.get(dep);
    if (!d) continue;
    if (d.latency === "slow" || d.needsUserInput || d.risky) return true;
    if (dependsOnUnresolved(d, byId, seen)) return true;
  }
  return false;
}

/**
 * SSOT della politica di scheduling. Ritorna la Decision ottimale per OGNI sotto-task (mappa id→Decision).
 * @param {Scenario} scenario
 * @returns {Record<string, Decision>}
 */
export function optimalDecision(scenario) {
  const subs = scenario.subtasks || [];
  const byId = new Map(subs.map((t) => [t.id, t]));
  const userLeaving = !!scenario.userLeaving;
  /** @type {Record<string, Decision>} */
  const out = {};
  for (const t of subs) {
    const hasDeps = (t.dependsOn || []).length > 0;
    const blockedByDep = hasDeps && dependsOnUnresolved(t, byId);
    if (t.needsUserInput) {
      // una decisione dell'utente sblocca il resto → chiedila SUBITO, ancor più se sta staccando
      out[t.id] = { mode: "ask-first", deliver: "immediate", priority: userLeaving ? 100 : 80 };
    } else if (t.risky) {
      // side-effect irreversibile → mai fire-and-forget: esegui monitorando (o conferma)
      out[t.id] = { mode: "sync-monitored", deliver: "on-completion", priority: 70 };
    } else if (blockedByDep) {
      // la risposta dipende da qualcosa di non-risolto (async/attesa-utente) → NON consegnabile subito
      out[t.id] = { mode: "deferred", deliver: "blocked", priority: 15 };
    } else if (t.latency === "slow") {
      // lungo + indipendente + safe → in background, continua
      out[t.id] = { mode: "async", deliver: "on-completion", priority: 30 };
    } else {
      // fast + indipendente → rispondi ora
      out[t.id] = { mode: "inline", deliver: "immediate", priority: 60 };
    }
  }
  return out;
}

/**
 * Giudica uno scheduling CANDIDATO contro l'ottimo. Ritorna {pass, violations[]} — ancorato all'OUTCOME:
 * (V1) nessun task perso · (V2) almeno una parte immediata consegnata subito se esiste (utente sbloccato) ·
 * (V3) nessuna dipendenza violata (parte che dipende dall'async NON consegnata immediata) ·
 * (V4) parti backgroundabili messe davvero in async (non serializzate a bloccare l'utente) ·
 * (V5) needsUserInput chiesto-per-primo · (V6) risky non fire-and-forget.
 * @param {Scenario} scenario
 * @param {Record<string, {mode:string, deliver:string}>} candidate  id → {mode, deliver}
 * @returns {{pass:boolean, violations:{code:string, id?:string, why:string}[]}}
 */
export function scoreSchedule(scenario, candidate) {
  const opt = optimalDecision(scenario);
  const ids = Object.keys(opt);
  const violations = [];
  const cand = candidate || {};

  // V1 — nessun task perso
  for (const id of ids) {
    if (!cand[id]) violations.push({ code: "task-lost", id, why: `sotto-task '${id}' senza decisione (perso)` });
  }

  // V2 — utente sbloccato: se esiste una parte immediata ottimale, il candidato ne consegna ≥1 subito
  const immediateOptimal = ids.filter((id) => opt[id].deliver === "immediate" && opt[id].mode !== "ask-first");
  if (immediateOptimal.length > 0) {
    const anyImmediate = immediateOptimal.some((id) => cand[id] && cand[id].deliver === "immediate");
    if (!anyImmediate) violations.push({ code: "user-blocked", why: "nessuna parte immediata consegnata subito: l'utente resta bloccato in attesa del lungo" });
  }

  for (const id of ids) {
    const o = opt[id];
    const c = cand[id];
    if (!c) continue;
    // V3 — dipendenza violata
    if (o.deliver === "blocked" && c.deliver === "immediate") {
      violations.push({ code: "dependency-violated", id, why: `'${id}' dipende da un async ma è consegnato immediata (risposta prematura/vuota)` });
    }
    // V4 — backgroundabile serializzato in foreground bloccante
    if (o.mode === "async" && (c.mode === "inline" || c.deliver === "immediate")) {
      violations.push({ code: "blocks-on-backgroundable", id, why: `'${id}' è lungo+indipendente: andava in async, il candidato lo esegue bloccando l'utente` });
    }
    // V5 — needsUserInput non chiesto per primo
    if (o.mode === "ask-first" && c.mode !== "ask-first") {
      violations.push({ code: "input-not-surfaced", id, why: `'${id}' richiede una decisione utente: andava chiesto subito, non ${c.mode}` });
    }
    // V6 — risky fire-and-forget
    if (o.mode === "sync-monitored" && c.mode === "async") {
      violations.push({ code: "risky-fire-forget", id, why: `'${id}' ha side-effect irreversibile: async cieco (fire-and-forget) è pericoloso` });
    }
  }
  return { pass: violations.length === 0, violations };
}

/**
 * Banca di scenari canonici + i casi-confine N1-N5 come DISTRATTORI (dove l'async è la scelta SBAGLIATA).
 * Ognuno porta la sua `gold` (= optimalDecision) e ≥1 `bad` (schedule errato che l'oracolo deve bocciare),
 * così i test asseriscono discriminazione (rule #14 wiring: fallirebbero se l'oracolo fosse errato).
 * @returns {{scenario:Scenario, note:string}[]}
 */
export function scenarioBank() {
  return [
    {
      note: "canonico: spiegazione (fast) + ricerca (slow) → inline subito + async la ricerca",
      scenario: {
        name: "explain+search",
        request: "spiegami la ricorsione e cerca i benchmark 2026",
        userLeaving: false,
        subtasks: [
          { id: "explain", label: "spiega ricorsione", latency: "fast" },
          { id: "search", label: "cerca benchmark", latency: "slow" },
        ],
      },
    },
    {
      note: "N1 dipendenza-reale: la risposta È il risultato della ricerca → NON c'è parte immediata da anticipare",
      scenario: {
        name: "N1-dependency",
        request: "cerca il prezzo di X e dimmelo",
        subtasks: [
          { id: "lookup", label: "cerca prezzo", latency: "slow" },
          { id: "answer", label: "riporta il prezzo", latency: "fast", dependsOn: ["lookup"] },
        ],
      },
    },
    {
      note: "N2 all-fast: due task immediati → niente async, entrambi inline",
      scenario: {
        name: "N2-all-fast",
        request: "quanto fa 12x8 e spiegami la ricorsione",
        subtasks: [
          { id: "calc", label: "12x8", latency: "fast" },
          { id: "explain", label: "spiega ricorsione", latency: "fast" },
        ],
      },
    },
    {
      note: "N3 serve-decisione-prima: una scelta utente sblocca tutto → chiedi subito (userLeaving)",
      scenario: {
        name: "N3-needs-decision",
        request: "rifai il modulo (ma prima: opzione A o B?) e poi genera i test",
        userLeaving: true,
        subtasks: [
          { id: "choice", label: "A o B?", latency: "fast", needsUserInput: true },
          { id: "rebuild", label: "rifai modulo", latency: "slow", dependsOn: ["choice"] },
          { id: "tests", label: "genera test", latency: "slow", dependsOn: ["rebuild"] },
        ],
      },
    },
    {
      note: "N4 side-effect irreversibile: il deploy è async ma va MONITORATO, non fire-and-forget",
      scenario: {
        name: "N4-risky",
        request: "fai il deploy in produzione e intanto scrivi il changelog",
        subtasks: [
          { id: "deploy", label: "deploy prod", latency: "slow", risky: true },
          { id: "changelog", label: "scrivi changelog", latency: "fast" },
        ],
      },
    },
    {
      note: "N5 over-parallel: 4 micro-task fast indipendenti → inline (mai un job async ciascuno)",
      scenario: {
        name: "N5-over-parallel",
        request: "converti 4 valori di unità",
        subtasks: [
          { id: "c1", latency: "fast" }, { id: "c2", latency: "fast" },
          { id: "c3", latency: "fast" }, { id: "c4", latency: "fast" },
        ],
      },
    },
  ];
}

/** Costruisce uno scheduling SBAGLIATO tipico per uno scenario (per i test di discriminazione). kind ∈ serialize-all|background-dependency|lose-task|fire-risky|hold-immediate */
export function badSchedule(scenario, kind) {
  const opt = optimalDecision(scenario);
  const ids = Object.keys(opt);
  /** @type {Record<string,{mode:string,deliver:string}>} */
  const c = {};
  for (const id of ids) c[id] = { mode: opt[id].mode, deliver: opt[id].deliver };
  if (kind === "serialize-all") {
    // esegue tutto in foreground bloccante, niente async, niente consegna immediata
    for (const id of ids) c[id] = { mode: "inline", deliver: "on-completion" };
  } else if (kind === "background-dependency") {
    // consegna immediata una parte che dipende dall'async (risposta prematura)
    for (const id of ids) if (opt[id].deliver === "blocked") c[id] = { mode: "inline", deliver: "immediate" };
  } else if (kind === "lose-task") {
    // dimentica di riconciliare l'async (task perso)
    const slow = ids.find((id) => opt[id].mode === "async");
    if (slow) delete c[slow];
  } else if (kind === "fire-risky") {
    const risky = ids.find((id) => opt[id].mode === "sync-monitored");
    if (risky) c[risky] = { mode: "async", deliver: "on-completion" };
  } else if (kind === "hold-immediate") {
    // tiene in ostaggio la parte immediata dietro alla lunga
    for (const id of ids) if (opt[id].deliver === "immediate" && opt[id].mode === "inline") c[id] = { mode: "deferred", deliver: "on-completion" };
  }
  return c;
}

export default { optimalDecision, scoreSchedule, scenarioBank, badSchedule, MODES, DELIVERS };

/**
 * vars-queue — datastore runtime dell'harness (Fase 1).
 *
 * Implementa il design di:
 *   ../../wiki/concepts/agent-wrapper-vars-queue.md   (4 lane TASKS/VERIFICATIONS/RULES/VARS + CURR + map O(1))
 *   ../../wiki/concepts/cross-session-state-sharing.md (cross-compact + cross-agent on-request, change-log+timestamp,
 *                                                       persistenza MIX file+DB)
 *
 * Backend = `node:sqlite` (built-in da Node 22.5+, flagless su 22.17 — solo ExperimentalWarning).
 * NESSUNA dipendenza nativa/npm → runnabile e testabile senza `npm install` e senza Docker.
 *
 * Scelte di design ancorate alle decisioni:
 *  - **DB (SQLite)** per VARS/TASKS/VERIFICATIONS/RULES/change-log/proposals: strutturato, lookup O(1) by id (PK),
 *    update atomici, audit. (La metà "file" del MIX — blob grandi, chat append-only — NON è qui: la gestisce lo
 *    stream-read/file-store, vedi wrapper-context-assembly-example.md §5.)
 *  - **change-log + timestamp** su OGNI mutazione (chi/quando/cosa + ref-decisione opzionale) → cambiamento
 *    osservabile dal modello "finché serve" (poi prunabile via gcChangeLog).
 *  - **cross-compact**: il file SQLite sopravvive al compact; un nuovo processo riapre lo stesso path e legge l'ultima
 *    versione per id → auto-propagazione per riferimento.
 *  - **cross-agent**: VARS hanno scope {private|shared} + namespace (agente). Un sotto-agente ottiene una VIEW read
 *    delle var `shared`; le SCRITTURE le PROPONE (tabella proposals), l'orchestratore fa il MERGE (single-writer →
 *    niente race). on-request, mai globale-automatico.
 *
 * Timestamp: Date.now() (epoch ms). Questo è codice runtime Node, non uno script workflow → Date.now() è lecito.
 */
import { DatabaseSync } from "node:sqlite";
import { applyConcurrencyPragmas } from "./db-pragmas.mjs";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS vars (
  id            TEXT PRIMARY KEY,
  value         TEXT,                                   -- JSON-encoded
  scope         TEXT NOT NULL DEFAULT 'private',        -- private | shared
  namespace     TEXT NOT NULL DEFAULT 'main',           -- agente proprietario
  last_modified INTEGER NOT NULL,
  last_modified_by TEXT,
  decision_ref  TEXT
);
CREATE TABLE IF NOT EXISTS tasks (
  id         TEXT PRIMARY KEY,
  title      TEXT,
  status     TEXT NOT NULL DEFAULT 'pending',           -- pending|in_progress|done|blocked (status MANUALE; ≠ 'ready' DERIVATO dalle deps)
  payload    TEXT,
  priority   INTEGER NOT NULL DEFAULT 0,                 -- routing-metadata (più alto = più urgente); MAI reward-target (anti reward-hacking)
  deps       TEXT NOT NULL DEFAULT '[]',                 -- JSON array di task-id che DEVONO essere 'done' prima (HARD)
  created    INTEGER NOT NULL,
  updated    INTEGER NOT NULL,
  updated_by TEXT
);
CREATE TABLE IF NOT EXISTS verifications (
  id      TEXT PRIMARY KEY,
  task_id TEXT,
  status  TEXT NOT NULL DEFAULT 'pending',              -- pending|pass|fail
  detail  TEXT,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rules (
  id       TEXT PRIMARY KEY,
  text     TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'soft',                -- soft|strong|hard
  category TEXT NOT NULL DEFAULT 'general',             -- safety|memory|task|general (raggruppamento per concentrazione, msg 1067)
  created  INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS decisions (
  id           TEXT PRIMARY KEY,
  agent        TEXT NOT NULL,                           -- idAgente che ha preso la scelta (attribuzione)
  text         TEXT NOT NULL,                           -- la scelta
  rationale    TEXT,                                    -- perché (catena why->problema->soluzione, opzionale)
  task_ref     TEXT,                                    -- task a cui la scelta appartiene (opzionale)
  created      INTEGER NOT NULL,
  decision_ref TEXT                                     -- ADR/decisione collegata (opzionale)
);
CREATE TABLE IF NOT EXISTS meta (
  k TEXT PRIMARY KEY,
  v TEXT
);
CREATE TABLE IF NOT EXISTS changelog (
  seq         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          INTEGER NOT NULL,
  who         TEXT,
  entity      TEXT NOT NULL,                            -- vars|tasks|verifications|rules|meta
  entity_id   TEXT,
  field       TEXT,
  old_value   TEXT,
  new_value   TEXT,
  decision_ref TEXT,
  silent      INTEGER NOT NULL DEFAULT 0                 -- mutazioni "silenziose" (es. namespace memo): nel log per audit, ESCLUSE da recent_changes
);
CREATE TABLE IF NOT EXISTS proposals (
  seq     INTEGER PRIMARY KEY AUTOINCREMENT,
  ts      INTEGER NOT NULL,
  agent   TEXT NOT NULL,
  var_id  TEXT NOT NULL,
  value   TEXT,
  applied INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS agent_messages (
  seq        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         INTEGER NOT NULL,
  from_agent TEXT NOT NULL,
  to_agent   TEXT NOT NULL,                            -- destinatario, oppure '*' = broadcast
  topic      TEXT,                                     -- opzionale, per filtrare la inbox
  body       TEXT,                                     -- JSON-encoded
  read       INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS focus_frames (
  scope_id    TEXT PRIMARY KEY,                        -- id univoco dello scope (focus-<lead>-<ts>)
  parent_id   TEXT,                                    -- scope_id del padre, oppure NULL = root (primo zoom)
  depth       INTEGER NOT NULL,                        -- 1 = primo livello sotto root
  aim_task    TEXT,                                    -- CURR del padre PRIMA dello zoom (da ripristinare al pop)
  task_subset TEXT,                                    -- JSON array di task id messi a fuoco
  entered     INTEGER NOT NULL,                        -- epoch ms dell'enter (lower-bound dei delta del figlio)
  status      TEXT NOT NULL DEFAULT 'open',            -- open | popped
  since_seq   INTEGER NOT NULL DEFAULT 0               -- max changelog seq all'enter (audit; delimita i delta)
);
`;

/**
 * Namespace le cui mutazioni sono "silenziose" nel change-log visibile: restano nel log per l'audit
 * (recall on-demand con includeSilent) ma NON compaiono in `recent_changes` del <context> → una nota/memo
 * non inquina il contesto finché non è esplicitamente richiamata. (fix 2026-06-29, finding test-suite.)
 */
const SILENT_NAMESPACES = new Set(["memo", "fact", "scratch"]);

/**
 * Colonne aggiunte a tabelle ESISTENTI dopo la creazione iniziale → vanno ADD-ate via _ensureColumn sui DB su
 * disco (CREATE TABLE IF NOT EXISTS non altera tabelle già create). Mappa data-driven: aggiungere QUI ogni colonna
 * futura su una tabella pre-esistente → migrazione automatica, niente ALTER ad-hoc da ricordare. (review-loop #2
 * 2026-06-29, P2 migration-fragile.) Le tabelle nate complete (decisions/agent_messages/focus_frames) non hanno
 * colonne post-creazione finora → non elencate.
 */
const EXPECTED_COLUMNS = {
  changelog: [["silent", "INTEGER NOT NULL DEFAULT 0"], ["decision_ref", "TEXT"]],
  vars: [["decision_ref", "TEXT"]],
  tasks: [["priority", "INTEGER NOT NULL DEFAULT 0"], ["deps", "TEXT NOT NULL DEFAULT '[]'"]], // focus-gathering v1 (migrazione DB esistenti)
  rules: [["category", "TEXT NOT NULL DEFAULT 'general'"]], // categorizzazione regole (msg 1067, migrazione DB esistenti)
};

/** Parse difensivo del campo `deps` (JSON array di task-id). Ritorna SEMPRE un array di stringhe. */
function parseDeps(raw) {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string" || !raw) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a.map(String) : []; } catch { return []; }
}

/**
 * TASK_STATUSES — SSOT (regola #16) degli stati task ammessi. Il modello NON può settare stati arbitrari
 * (anti status-spazzatura, utente msg 1076). `blocked` = marcatura MANUALE (distinta dal `ready` deps-computed
 * di listTasksOrdered); `cancelled` = task annullato. Lifecycle ≈ TODO(pending)→WIP(in_progress)→DONE(done).
 */
export const TASK_STATUSES = Object.freeze(["pending", "in_progress", "done", "blocked", "cancelled"]);

export class VarsQueue {
  /**
   * @param {string} dbPath  ":memory:" oppure un path file (es. ".pi/state/vars.db").
   * @param {{agent?: string}} [opts]  identità dell'agente corrente (namespace + who nel change-log).
   */
  constructor(dbPath = ":memory:", opts = {}) {
    this.agent = opts.agent ?? "main";
    this.db = new DatabaseSync(dbPath);
    // busy_timeout PRIMA di WAL e dello SCHEMA (bug P0 2026-07-04): WAL ammette 1 solo writer → due processi pi
    // (o driver+TUI) che scrivono vars/meta/secrets concorrentemente danno "database is locked" IMMEDIATO senza
    // attesa → setVar/setMeta/append fa throw e lo stato si perde. Sequenza+valore in db-pragmas.mjs (SSOT).
    applyConcurrencyPragmas(this.db);
    this.db.exec(SCHEMA);
    // Migrazione difensiva IDEMPOTENTE per DB pre-esistenti su disco: `CREATE TABLE IF NOT EXISTS` NON aggiunge
    // colonne a tabelle già create → OGNI colonna aggiunta DOPO la creazione iniziale va ADD-ata qui. Helper
    // generico via PRAGMA table_info → la prossima colonna futura non crasha i DB esistenti. (review-loop 2026-06-29.)
    for (const [table, cols] of Object.entries(EXPECTED_COLUMNS)) {
      for (const [col, decl] of cols) this._ensureColumn(table, col, decl);
    }
  }

  /** Aggiunge `column` a `table` se mancante (idempotente). Difesa per i DB .pi/state/*.db già su disco. */
  _ensureColumn(table, column, decl) {
    try {
      const cols = this.db.prepare(`PRAGMA table_info(${table})`).all();
      if (cols.length && !cols.some((c) => c.name === column)) {
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl};`);
      }
    } catch { /* tabella inesistente (SCHEMA la crea già) o colonna presente */ }
  }

  close() { this.db.close(); }

  // -- change-log (interno) ---------------------------------------------------
  _log(entity, id, field, oldV, newV, who, decisionRef = null, silent = 0) {
    this.db.prepare(
      `INSERT INTO changelog (ts, who, entity, entity_id, field, old_value, new_value, decision_ref, silent)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).run(Date.now(), who ?? this.agent, entity, id, field,
          oldV == null ? null : String(oldV), newV == null ? null : String(newV), decisionRef, silent ? 1 : 0);
  }

  /**
   * Change-log osservabile dal modello. `since` = epoch ms (default: tutto).
   * Di default ESCLUDE le mutazioni silenziose (namespace memo): è ciò che alimenta `recent_changes`.
   * `includeSilent:true` per l'audit completo (recall on-demand).
   */
  getChangeLog({ since = 0, entity = null, entityId = null, limit = 200, includeSilent = false } = {}) {
    let q = `SELECT seq, ts, who, entity, entity_id, field, old_value, new_value, decision_ref, silent
             FROM changelog WHERE ts >= ?`;
    const args = [since];
    if (!includeSilent) q += " AND silent = 0";
    if (entity)   { q += " AND entity = ?";    args.push(entity); }
    if (entityId) { q += " AND entity_id = ?"; args.push(entityId); }
    q += " ORDER BY seq DESC LIMIT ?"; args.push(limit);
    return this.db.prepare(q).all(...args);
  }

  /** "Visibile finché serve": pruna il change-log più vecchio di `beforeTs`. */
  gcChangeLog(beforeTs) {
    return this.db.prepare(`DELETE FROM changelog WHERE ts < ?`).run(beforeTs).changes;
  }

  // -- VARS -------------------------------------------------------------------
  setVar(id, value, opts = {}) {
    const who = opts.who ?? this.agent;
    const decisionRef = opts.decisionRef ?? null;
    const prev = this.db.prepare(`SELECT value, scope, namespace FROM vars WHERE id = ?`).get(id);
    // scope/namespace STICKY su update (review P1-E): se il caller NON li passa esplicitamente e la var ESISTE,
    // preserva quelli correnti — un `set_var` senza scope non deve DECLASSARE una var `shared` a `private`
    // (rompeva l'invariante cross-agent). Su INSERT nuovo → default `private`/agent come prima.
    const scope = opts.scope !== undefined ? opts.scope : (prev?.scope ?? "private");
    const namespace = opts.namespace !== undefined ? opts.namespace : (prev?.namespace ?? this.agent);
    const json = JSON.stringify(value);
    this.db.prepare(
      `INSERT INTO vars (id, value, scope, namespace, last_modified, last_modified_by, decision_ref)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         value=excluded.value, scope=excluded.scope, namespace=excluded.namespace,
         last_modified=excluded.last_modified, last_modified_by=excluded.last_modified_by,
         decision_ref=excluded.decision_ref`
    ).run(id, json, scope, namespace, Date.now(), who, decisionRef);
    this._log("vars", id, "value", prev?.value ?? null, json, who, decisionRef, SILENT_NAMESPACES.has(namespace) ? 1 : 0);
    return this.getVar(id);
  }

  /**
   * "Visibile finché serve" per le VARS: pruna le var più vecchie di `beforeTs` (default: solo `shared`,
   * che è la lane non-windowed mostrata nel <context>). Le `memo`/private restano. (fix 2026-06-29.)
   */
  gcVars(beforeTs, { scope = "shared" } = {}) {
    let q = `DELETE FROM vars WHERE last_modified < ?`;
    const args = [beforeTs];
    if (scope) { q += " AND scope = ?"; args.push(scope); }
    return this.db.prepare(q).run(...args).changes;
  }

  /** Lookup O(1) by id (PK). Ritorna {id,value,scope,namespace,last_modified,...} o null. */
  getVar(id) {
    const r = this.db.prepare(`SELECT * FROM vars WHERE id = ?`).get(id);
    if (!r) return null;
    return { ...r, value: r.value == null ? null : JSON.parse(r.value) };
  }

  listVars({ scope = null, namespace = null } = {}) {
    let q = `SELECT * FROM vars`; const args = []; const where = [];
    if (scope)     { where.push("scope = ?");     args.push(scope); }
    if (namespace) { where.push("namespace = ?"); args.push(namespace); }
    if (where.length) q += " WHERE " + where.join(" AND ");
    return this.db.prepare(q).all(...args).map(r => ({ ...r, value: r.value == null ? null : JSON.parse(r.value) }));
  }

  /** Rimuove una var per id (PK) + logga il delete (old→null; silent se namespace silenzioso, es. 'fact'/'memo').
   *  Ritorna true se la var esisteva. Serve per le note-fatto rimuovibili (remove_note) senza attendere il GC. */
  removeVar(id, { who = this.agent } = {}) {
    const prev = this.db.prepare(`SELECT value, namespace FROM vars WHERE id = ?`).get(id);
    if (!prev) return false;
    this.db.prepare(`DELETE FROM vars WHERE id = ?`).run(id);
    this._log("vars", id, "value", prev.value ?? null, null, who, null, SILENT_NAMESPACES.has(prev.namespace) ? 1 : 0);
    return true;
  }

  // -- cross-agent: VIEW read condivisa + proposta/merge (single-writer) ------
  /** VIEW read delle var `shared` (tutti i namespace). È ciò che un sotto-agente riceve. */
  getSharedView() { return this.listVars({ scope: "shared" }); }

  /** Un sotto-agente PROPONE una scrittura su una var condivisa (non scrive diretto → niente race). */
  proposeVar(varId, value, { agent = this.agent } = {}) {
    const r = this.db.prepare(`INSERT INTO proposals (ts, agent, var_id, value) VALUES (?,?,?,?)`)
      .run(Date.now(), agent, varId, JSON.stringify(value));
    // logga la proposta attribuita all'agente → getChangesByAgent(figlio) la vede anche se non ancora
    // mergiata (il merge poi logga who='merge<-agent'). Senza questo, un figlio che SOLO propone
    // produrrebbe un report-di-ritorno VUOTO (rompe il floor-F "mai vuoto"). Fix review 2026-06-29.
    this._log("proposals", String(Number(r.lastInsertRowid)), "propose", null, varId, agent);
  }

  pendingProposals() {
    return this.db.prepare(`SELECT * FROM proposals WHERE applied = 0 ORDER BY seq`).all()
      .map(p => ({ ...p, value: p.value == null ? null : JSON.parse(p.value) }));
  }

  /**
   * MERGE single-writer: l'orchestratore applica le proposte pendenti.
   * @param {(prop, current)=>boolean} [resolve]  policy di conflitto. Default = last-write-wins (applica sempre).
   *        `prop` = {agent,var_id,value}; `current` = var attuale o null. Ritorna true per applicare.
   */
  mergeProposals(resolve = () => true) {
    const pend = this.pendingProposals();
    let applied = 0;
    for (const p of pend) {
      const current = this.getVar(p.var_id);
      if (resolve(p, current)) {
        this.setVar(p.var_id, p.value, { scope: "shared", who: `merge<-${p.agent}` });
        applied++;
      }
      this.db.prepare(`UPDATE proposals SET applied = 1 WHERE seq = ?`).run(p.seq);
    }
    return applied;
  }

  // -- TASKS ------------------------------------------------------------------
  // priority/deps (focus-gathering v1): priority=routing-metadata (più alto=più urgente, MAI reward-target);
  // deps=task-id che DEVONO essere 'done' prima (HARD). Validazione no-self/no-ciclo via _checkDeps (throw se invalido).
  addTask(id, title, { payload = null, priority = 0, deps = [], who = this.agent } = {}) {
    const now = Date.now();
    const chk = this._checkDeps(id, deps);
    if (!chk.ok) throw new Error(`addTask(${id}): deps invalide — ${chk.error}`);
    this.db.prepare(`INSERT INTO tasks (id,title,status,payload,priority,deps,created,updated,updated_by) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(id, title, "pending", payload == null ? null : JSON.stringify(payload),
           Number.isFinite(priority) ? Math.trunc(priority) : 0, JSON.stringify(chk.deps), now, now, who);
    this._log("tasks", id, "status", null, "pending", who);
    return this.getTask(id);
  }

  getTask(id) {
    const r = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id);
    if (!r) return null;
    return { ...r, payload: r.payload == null ? null : JSON.parse(r.payload), deps: parseDeps(r.deps), priority: r.priority ?? 0 };
  }

  /**
   * setTaskMeta — aggiorna priority e/o deps di un task (focus-gathering v1). Valida no-self/no-ciclo.
   * @param {string} id
   * @param {{priority?: number, deps?: string[], who?: string}} opts
   * @returns {object} il task aggiornato
   */
  setTaskMeta(id, { priority = undefined, deps = undefined, who = this.agent } = {}) {
    const cur = this.getTask(id);
    if (!cur) throw new Error(`setTaskMeta(${id}): task inesistente`);
    let newDeps = cur.deps;
    if (deps !== undefined) {
      const chk = this._checkDeps(id, deps);
      if (!chk.ok) throw new Error(`setTaskMeta(${id}): deps invalide — ${chk.error}`);
      newDeps = chk.deps;
    }
    const newPrio = priority !== undefined && Number.isFinite(priority) ? Math.trunc(priority) : cur.priority;
    this.db.prepare(`UPDATE tasks SET priority = ?, deps = ?, updated = ?, updated_by = ? WHERE id = ?`)
      .run(newPrio, JSON.stringify(newDeps), Date.now(), who, id);
    if (newPrio !== cur.priority) this._log("tasks", id, "priority", cur.priority, newPrio, who);
    if (deps !== undefined) this._log("tasks", id, "deps", JSON.stringify(cur.deps), JSON.stringify(newDeps), who);
    return this.getTask(id);
  }

  /**
   * _checkDeps — normalizza + valida le deps di `id`: array di id-stringa unici, no self-dep, no CICLO
   * (DFS sul dep-graph dei task ESISTENTI + il nuovo arco id→deps). Forward-ref (dep su task non ancora creato)
   * è ammesso (resterà non-ready finché quel task non esiste+done). @returns {{ok:boolean, error?:string, deps?:string[]}}
   */
  _checkDeps(id, deps) {
    if (!Array.isArray(deps)) return { ok: false, error: "deps non è un array" };
    const norm = [...new Set(deps.map((d) => String(d)).filter(Boolean))];
    if (norm.includes(String(id))) return { ok: false, error: "self-dependency" };
    // mappa deps esistenti (id → deps[]), col nuovo arco id→norm sovrascritto
    const rows = this.db.prepare(`SELECT id, deps FROM tasks`).all();
    const graph = new Map(rows.map((r) => [String(r.id), parseDeps(r.deps)]));
    graph.set(String(id), norm);
    // DFS per ciclo a partire da id
    const seen = new Set(), stack = new Set();
    const hasCycle = (node) => {
      if (stack.has(node)) return true;
      if (seen.has(node)) return false;
      seen.add(node); stack.add(node);
      for (const d of graph.get(node) ?? []) if (graph.has(d) && hasCycle(d)) return true;
      stack.delete(node);
      return false;
    };
    if (hasCycle(String(id))) return { ok: false, error: "introduce un ciclo nel dep-graph" };
    return { ok: true, deps: norm };
  }

  setTaskStatus(id, status, { who = this.agent } = {}) {
    // B3 (audit 2026-07-04): task inesistente → no-op REALE (niente write né _log fantasma), ritorna null.
    // Il check-esistenza resta PRIMA della validazione: uno status invalido su task inesistente = no-op, non throw.
    const cur = this.getTask(id);
    if (!cur) return null;
    // Enum-guard (utente msg 1076): status ∈ TASK_STATUSES, mai stringa arbitraria (anti status-spazzatura).
    if (!TASK_STATUSES.includes(status))
      throw new Error(`status invalido '${status}' — ammessi: ${TASK_STATUSES.join("|")}`);
    // Deps-guard (utente msg 1076): NON si ATTIVA (in_progress) un task bloccato da deps non-'done'. Rispetta il
    // sistema deps/ready esistente (_checkDeps + listTasksOrdered.ready), non lo bypassa. forward-ref (dep inesistente)
    // → status !== 'done' → blocca, coerente con la vista `ready`.
    if (status === "in_progress") {
      const unmet = (cur.deps ?? []).filter((d) => this.getTask(String(d))?.status !== "done");
      if (unmet.length)
        throw new Error(`task '${id}' non attivabile: bloccato da deps non ancora 'done': ${unmet.join(", ")}`);
    }
    this.db.prepare(`UPDATE tasks SET status = ?, updated = ?, updated_by = ? WHERE id = ?`)
      .run(status, Date.now(), who, id);
    this._log("tasks", id, "status", cur.status ?? null, status, who);
    return this.getTask(id);
  }

  listTasks({ status = null } = {}) {
    let q = `SELECT * FROM tasks`; const args = [];
    if (status) { q += " WHERE status = ?"; args.push(status); }
    q += " ORDER BY created, id"; // tiebreaker per id → ordine d'ingresso deterministico anche su created uguale
    return this.db.prepare(q).all(...args).map(r => ({ ...r, payload: r.payload == null ? null : JSON.parse(r.payload), deps: parseDeps(r.deps), priority: r.priority ?? 0 }));
  }

  /**
   * listTasksOrdered — vista "gathering" del focus (focus-gathering v1, review-validato). Sui task OPEN-LOOP
   * (pending+in_progress) calcola: `ready` (tutte le deps sono `done`), `unblocks` (downstream-impact: #task open
   * che dipendono TRANSITIVAMENTE da questo) e `order` (ready-first → unblocks desc → priority desc → created asc).
   * GATE PROPORZIONALITÀ (regola #8): se NESSUN task ha deps non-vuote E nessuno ha priority≠0 → ritorna la vista
   * SEMPLICE (come `listTasks` open), senza ready/unblocks/order → su grafi piatti non si impone struttura inutile.
   * @returns {{ structured: boolean, tasks: object[] }}
   */
  listTasksOrdered() {
    const pool = [...this.listTasks({ status: "in_progress" }), ...this.listTasks({ status: "pending" })];
    const hasStructure = pool.some((t) => (t.deps && t.deps.length) || (t.priority && t.priority !== 0));
    if (!hasStructure) return { structured: false, tasks: pool };
    const doneSet = new Set(this.listTasks({ status: "done" }).map((t) => String(t.id)));
    const ready = (t) => (t.deps ?? []).every((d) => doneSet.has(String(d)));
    // downstream-impact: # task open che dipendono (transitivo) da `id`
    const dependents = new Map();
    for (const t of pool) for (const d of (t.deps ?? [])) { const k = String(d); (dependents.get(k) ?? dependents.set(k, []).get(k)).push(String(t.id)); }
    const unblocks = (id, seen = new Set()) => {
      let n = 0;
      for (const dep of dependents.get(String(id)) ?? []) { if (seen.has(dep)) continue; seen.add(dep); n += 1 + unblocks(dep, seen); }
      return n;
    };
    const enriched = pool.map((t) => ({ ...t, ready: ready(t), unblocks: unblocks(t.id) }));
    enriched.sort((a, b) =>
      (Number(b.ready) - Number(a.ready)) ||   // ready-first
      (b.unblocks - a.unblocks) ||             // downstream-impact desc (foundational prima delle foglie)
      (b.priority - a.priority) ||             // priority desc
      (a.created - b.created) ||               // created asc
      String(a.id).localeCompare(String(b.id))); // tiebreaker totale per id → ordine DETERMINISTICO (anche su created ==)
    enriched.forEach((t, i) => { t.order = i; });
    return { structured: true, tasks: enriched };
  }

  /**
   * readyTasks — i task OPEN sbloccati (deps tutte done) in execution-order, opzionalmente ristretti a `subsetIds`.
   * Su grafo piatto (no struttura) tutti gli open sono ready. Usato da `enterFocus` per lead + hard-gate no-ready.
   * @param {string[]|null} [subsetIds]
   * @returns {object[]}
   */
  readyTasks(subsetIds = null) {
    const { structured, tasks } = this.listTasksOrdered();
    const set = subsetIds ? new Set(subsetIds.map(String)) : null;
    const pool = set ? tasks.filter((t) => set.has(String(t.id))) : tasks;
    return structured ? pool.filter((t) => t.ready) : pool;
  }

  // -- VERIFICATIONS ----------------------------------------------------------
  addVerification(id, taskId, { detail = null, who = this.agent } = {}) {
    this.db.prepare(`INSERT INTO verifications (id,task_id,status,detail,created) VALUES (?,?,?,?,?)`)
      .run(id, taskId, "pending", detail, Date.now());
    this._log("verifications", id, "status", null, "pending", who);
    return id;
  }

  setVerificationStatus(id, status, { who = this.agent } = {}) {
    const prev = this.db.prepare(`SELECT status FROM verifications WHERE id = ?`).get(id);
    this.db.prepare(`UPDATE verifications SET status = ? WHERE id = ?`).run(status, id);
    this._log("verifications", id, "status", prev?.status ?? null, status, who);
  }

  listVerifications({ status = null } = {}) {
    let q = `SELECT * FROM verifications`; const args = [];
    if (status) { q += " WHERE status = ?"; args.push(status); }
    return this.db.prepare(q).all(...args);
  }

  // -- RULES ------------------------------------------------------------------
  addRule(id, text, { severity = "soft", category = "general", who = this.agent } = {}) {
    this.db.prepare(`INSERT INTO rules (id,text,severity,category,created) VALUES (?,?,?,?,?)
                     ON CONFLICT(id) DO UPDATE SET text=excluded.text, severity=excluded.severity, category=excluded.category`)
      .run(id, text, severity, category, Date.now());
    this._log("rules", id, "text", null, text, who);
  }

  listRules() { return this.db.prepare(`SELECT * FROM rules ORDER BY created`).all(); }

  // -- DECISIONS lane (scelte attribuite per agente) --------------------------
  // Idea utente (TG msg 456/457, 2026-06-29): "ottenere tutte le scelte prese da un determinato agente tramite
  // idAgente". Il substrato c'era già (changelog.who); qui le decisioni diventano di PRIMA CLASSE (scelta +
  // razionale + agente) → query per-agente. Doppio uso: (1) floor F del report-to-file al pop matrioska (il report
  // del figlio è DERIVABILE dalle sue decisioni → mai vuoto, [[../../wiki/concepts/report-to-file-pointer]]);
  // (2) audit cross-agent "chi ha deciso cosa".
  recordDecision(id, text, { rationale = null, who = this.agent, taskRef = null, decisionRef = null } = {}) {
    const now = Date.now();
    this.db.prepare(
      `INSERT INTO decisions (id, agent, text, rationale, task_ref, created, decision_ref) VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET agent=excluded.agent, text=excluded.text,
         rationale=excluded.rationale, task_ref=excluded.task_ref, decision_ref=excluded.decision_ref`
    ).run(id, who, text, rationale, taskRef, now, decisionRef);
    this._log("decisions", id, "text", null, text, who, decisionRef);
    return this.getDecision(id);
  }

  getDecision(id) {
    return this.db.prepare(`SELECT * FROM decisions WHERE id = ?`).get(id) ?? null;
  }

  listDecisions({ agent = null, taskRef = null } = {}) {
    let q = `SELECT * FROM decisions`; const args = []; const where = [];
    if (agent)   { where.push("agent = ?");    args.push(agent); }
    if (taskRef) { where.push("task_ref = ?"); args.push(taskRef); }
    if (where.length) q += " WHERE " + where.join(" AND ");
    q += " ORDER BY created";
    return this.db.prepare(q).all(...args);
  }

  /** Tutte le scelte/decisioni prese da un agente (per idAgente). Risponde a utente msg 456/457. */
  getDecisionsByAgent(agent) { return this.listDecisions({ agent }); }

  /**
   * Vista più ampia delle sole decisioni: TUTTE le mutazioni (change-log) attribuite a un agente per `who`.
   * Default esclude le silenziose (memo). Per il report-to-file del pop: l'attività completa del figlio.
   */
  getChangesByAgent(agent, { since = 0, sinceSeq = null, includeSilent = false, limit = 500 } = {}) {
    // `sinceSeq` (seq monotono) è il delimitatore PREFERITO per scopare i delta di uno scope: immune a clock-skew
    // /NTP-step e deterministico al same-ms. Quando fornito ha precedenza sul filtro temporale `since` (epoch ms).
    let q = `SELECT seq, ts, who, entity, entity_id, field, old_value, new_value, decision_ref, silent
             FROM changelog WHERE who = ?`;
    const args = [agent];
    if (sinceSeq != null) { q += " AND seq > ?"; args.push(sinceSeq); }
    else { q += " AND ts >= ?"; args.push(since); }
    if (!includeSilent) q += " AND silent = 0";
    q += " ORDER BY seq DESC LIMIT ?"; args.push(limit);
    return this.db.prepare(q).all(...args);
  }

  // -- INTER-AGENT MESSAGING (scambio diretto di messaggi tra agenti) ---------
  // Idea utente (TG msg 462, 2026-06-29). Complementare a shared-VARS (stato) e propose/merge (write):
  // qui un agente INVIA un messaggio DIRETTO a un altro (o broadcast '*'), recuperabile dalla sua inbox.
  // Persistente cross-compact + audit nel change-log. Transport=F deterministico; quando/cosa messaggiare=S.
  // Guida di scelta del canale: [[../../wiki/concepts/inter-agent-messaging]].
  sendMessage(toAgent, body, { from = this.agent, topic = null } = {}) {
    const r = this.db.prepare(
      `INSERT INTO agent_messages (ts, from_agent, to_agent, topic, body, read) VALUES (?,?,?,?,?,0)`
    ).run(Date.now(), from, toAgent, topic, JSON.stringify(body ?? null));
    const seq = Number(r.lastInsertRowid);
    // silent=1: l'audit dell'invio resta nel log (recall con includeSilent) ma NON inquina recent_changes
    // né il pop-report (il messaging è una lane separata dallo stato durevole). Fix review 2026-06-29.
    this._log("agent_messages", String(seq), "send", from, toAgent, from, null, 1);
    return seq;
  }

  /**
   * Inbox di `agent`: messaggi diretti a lui (+ broadcast '*' se includeBroadcast). Read-only: NON marca letti
   * (il mark è esplicito via markRead → niente ambiguità sul broadcast, che ha read globale in v1).
   */
  inbox(agent, { unreadOnly = true, topic = null, includeBroadcast = true, limit = 100 } = {}) {
    const where = []; const args = [];
    if (includeBroadcast) { where.push("(to_agent = ? OR to_agent = '*')"); args.push(agent); }
    else { where.push("to_agent = ?"); args.push(agent); }
    if (unreadOnly) where.push("read = 0");
    if (topic) { where.push("topic = ?"); args.push(topic); }
    const q = `SELECT seq, ts, from_agent, to_agent, topic, body, read FROM agent_messages
               WHERE ${where.join(" AND ")} ORDER BY seq LIMIT ?`;
    args.push(limit);
    return this.db.prepare(q).all(...args).map((m) => ({ ...m, body: m.body == null ? null : JSON.parse(m.body) }));
  }

  /** Marca letti i messaggi per `seq` (lista o singolo). Esplicito → niente ambiguità sul broadcast. */
  markRead(seqs) {
    const list = Array.isArray(seqs) ? seqs : [seqs];
    let n = 0;
    for (const s of list) n += this.db.prepare(`UPDATE agent_messages SET read = 1 WHERE seq = ?`).run(s).changes;
    return n;
  }

  /** "Visibile finché serve" per i messaggi: pruna quelli più vecchi di `beforeTs` (default: solo i letti). */
  gcMessages(beforeTs, { readOnly = true } = {}) {
    let q = `DELETE FROM agent_messages WHERE ts < ?`;
    const args = [beforeTs];
    if (readOnly) q += " AND read = 1";
    return this.db.prepare(q).run(...args).changes;
  }

  // -- CURR pointer (aim corrente) -------------------------------------------
  setCurr(taskId, { who = this.agent } = {}) {
    const prev = this.db.prepare(`SELECT v FROM meta WHERE k = 'curr'`).get();
    this.db.prepare(`INSERT INTO meta (k,v) VALUES ('curr',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v`).run(taskId);
    this._log("meta", "curr", "curr", prev?.v ?? null, taskId, who);
  }

  getCurr() {
    const r = this.db.prepare(`SELECT v FROM meta WHERE k = 'curr'`).get();
    return r ? r.v : null;
  }

  // -- ACTIVE SCOPE (matrioska: routing dell'attribuzione who in-scope) --------
  // Il modello opera con tool a handle FISSO (agent='orchestrator'), ma quando uno scope-figlio è aperto le sue
  // mutazioni vanno attribuite allo scope (who=scopeId) → il pop-report deriva i delta del figlio. Lo scope attivo
  // vive nel meta (condiviso cross-extension via lo stesso file DB): le extension di mutazione leggono getActiveScope()
  // e lo usano come `who`. Log silent (strutturale: non inquina recent_changes). Vedi nested-compact.mjs.
  setActiveScope(scopeId, { who = this.agent } = {}) {
    const prev = this.db.prepare(`SELECT v FROM meta WHERE k = 'active_scope'`).get();
    if (scopeId == null) this.db.prepare(`DELETE FROM meta WHERE k = 'active_scope'`).run();
    else this.db.prepare(`INSERT INTO meta (k,v) VALUES ('active_scope',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v`).run(scopeId);
    this._log("meta", "active_scope", "active_scope", prev?.v ?? null, scopeId, who, null, 1);
  }

  getActiveScope() {
    const r = this.db.prepare(`SELECT v FROM meta WHERE k = 'active_scope'`).get();
    return r ? r.v : null;
  }

  // -- META generico (k/v) — stato di SISTEMA condiviso cross-extension (convId persistito, hysteresis…). Log
  //    silent di default (strutturale → fuori da recent_changes). Da preferire al namespace 'memo' (riservato alle
  //    lezioni di error-memo): scrivere stato-di-sistema in 'memo' ne gonfia il conteggio. (review-loop #2 2026-06-29.)
  setMeta(k, v, { silent = true, who = this.agent } = {}) {
    const prev = this.db.prepare(`SELECT v FROM meta WHERE k = ?`).get(k);
    if (v == null) this.db.prepare(`DELETE FROM meta WHERE k = ?`).run(k);
    else this.db.prepare(`INSERT INTO meta (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v`).run(k, String(v));
    this._log("meta", k, k, prev?.v ?? null, v == null ? null : String(v), who, null, silent ? 1 : 0);
  }

  getMeta(k) {
    const r = this.db.prepare(`SELECT v FROM meta WHERE k = ?`).get(k);
    return r ? r.v : null;
  }

  // -- FOCUS FRAMES (matrioska nested-compact: stack dello zoom-in/pop) --------
  // Source-of-truth dello stack di focus. CRUD basso livello; l'orchestrazione (enterFocus/popFocus/buildFrame…)
  // vive in nested-compact.mjs (node-pure). Log strutturale silent (l'evento VISIBILE è la decisione enter/pop).
  // Design: ../../wiki/architecture/matrioska-orchestration-spec.md.
  /** Max seq corrente del change-log (snapshot delimitatore dei delta di uno scope). 0 se vuoto. */
  currentChangeSeq() {
    const r = this.db.prepare(`SELECT MAX(seq) AS m FROM changelog`).get();
    return r?.m ?? 0;
  }

  createFocusFrame(scopeId, { parentId = null, depth, aimTask = null, taskSubset = [], sinceSeq = 0, now = Date.now(), who = this.agent } = {}) {
    this.db.prepare(
      `INSERT INTO focus_frames (scope_id, parent_id, depth, aim_task, task_subset, entered, status, since_seq)
       VALUES (?,?,?,?,?,?,'open',?)`
    ).run(scopeId, parentId, depth, aimTask, JSON.stringify(taskSubset ?? []), now, sinceSeq);
    this._log("focus_frames", scopeId, "status", null, "open", who, null, 1);
    return this.getFocusFrame(scopeId);
  }

  getFocusFrame(scopeId) {
    const r = this.db.prepare(`SELECT * FROM focus_frames WHERE scope_id = ?`).get(scopeId);
    if (!r) return null;
    return { ...r, task_subset: r.task_subset == null ? [] : JSON.parse(r.task_subset) };
  }

  listFocusFrames({ status = null } = {}) {
    let q = `SELECT * FROM focus_frames`; const args = [];
    if (status) { q += ` WHERE status = ?`; args.push(status); }
    q += ` ORDER BY depth, entered`;
    return this.db.prepare(q).all(...args).map((r) => ({ ...r, task_subset: r.task_subset == null ? [] : JSON.parse(r.task_subset) }));
  }

  closeFocusFrame(scopeId, { who = this.agent } = {}) {
    const prev = this.db.prepare(`SELECT status FROM focus_frames WHERE scope_id = ?`).get(scopeId);
    this.db.prepare(`UPDATE focus_frames SET status = 'popped' WHERE scope_id = ?`).run(scopeId);
    this._log("focus_frames", scopeId, "status", prev?.status ?? null, "popped", who, null, 1);
    return this.getFocusFrame(scopeId);
  }
}

export default VarsQueue;

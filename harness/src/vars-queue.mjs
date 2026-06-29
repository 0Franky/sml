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
  status     TEXT NOT NULL DEFAULT 'pending',           -- pending|in_progress|done|blocked
  payload    TEXT,
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
`;

/**
 * Namespace le cui mutazioni sono "silenziose" nel change-log visibile: restano nel log per l'audit
 * (recall on-demand con includeSilent) ma NON compaiono in `recent_changes` del <context> → una nota/memo
 * non inquina il contesto finché non è esplicitamente richiamata. (fix 2026-06-29, finding test-suite.)
 */
const SILENT_NAMESPACES = new Set(["memo"]);

export class VarsQueue {
  /**
   * @param {string} dbPath  ":memory:" oppure un path file (es. ".pi/state/vars.db").
   * @param {{agent?: string}} [opts]  identità dell'agente corrente (namespace + who nel change-log).
   */
  constructor(dbPath = ":memory:", opts = {}) {
    this.agent = opts.agent ?? "main";
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;"); // concorrenza: lettori non bloccano lo scrittore
    this.db.exec(SCHEMA);
    // migrazione difensiva per db pre-esistenti: la colonna changelog.silent è stata aggiunta 2026-06-29.
    try { this.db.exec("ALTER TABLE changelog ADD COLUMN silent INTEGER NOT NULL DEFAULT 0;"); } catch { /* colonna già presente */ }
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
  setVar(id, value, { scope = "private", namespace = this.agent, who = this.agent, decisionRef = null } = {}) {
    const prev = this.db.prepare(`SELECT value FROM vars WHERE id = ?`).get(id);
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

  // -- cross-agent: VIEW read condivisa + proposta/merge (single-writer) ------
  /** VIEW read delle var `shared` (tutti i namespace). È ciò che un sotto-agente riceve. */
  getSharedView() { return this.listVars({ scope: "shared" }); }

  /** Un sotto-agente PROPONE una scrittura su una var condivisa (non scrive diretto → niente race). */
  proposeVar(varId, value, { agent = this.agent } = {}) {
    this.db.prepare(`INSERT INTO proposals (ts, agent, var_id, value) VALUES (?,?,?,?)`)
      .run(Date.now(), agent, varId, JSON.stringify(value));
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
  addTask(id, title, { payload = null, who = this.agent } = {}) {
    const now = Date.now();
    this.db.prepare(`INSERT INTO tasks (id,title,status,payload,created,updated,updated_by) VALUES (?,?,?,?,?,?,?)`)
      .run(id, title, "pending", payload == null ? null : JSON.stringify(payload), now, now, who);
    this._log("tasks", id, "status", null, "pending", who);
    return this.getTask(id);
  }

  getTask(id) {
    const r = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id);
    if (!r) return null;
    return { ...r, payload: r.payload == null ? null : JSON.parse(r.payload) };
  }

  setTaskStatus(id, status, { who = this.agent } = {}) {
    const prev = this.db.prepare(`SELECT status FROM tasks WHERE id = ?`).get(id);
    this.db.prepare(`UPDATE tasks SET status = ?, updated = ?, updated_by = ? WHERE id = ?`)
      .run(status, Date.now(), who, id);
    this._log("tasks", id, "status", prev?.status ?? null, status, who);
    return this.getTask(id);
  }

  listTasks({ status = null } = {}) {
    let q = `SELECT * FROM tasks`; const args = [];
    if (status) { q += " WHERE status = ?"; args.push(status); }
    q += " ORDER BY created";
    return this.db.prepare(q).all(...args).map(r => ({ ...r, payload: r.payload == null ? null : JSON.parse(r.payload) }));
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
  addRule(id, text, { severity = "soft", who = this.agent } = {}) {
    this.db.prepare(`INSERT INTO rules (id,text,severity,created) VALUES (?,?,?,?)
                     ON CONFLICT(id) DO UPDATE SET text=excluded.text, severity=excluded.severity`)
      .run(id, text, severity, Date.now());
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
  getChangesByAgent(agent, { since = 0, includeSilent = false, limit = 500 } = {}) {
    let q = `SELECT seq, ts, who, entity, entity_id, field, old_value, new_value, decision_ref, silent
             FROM changelog WHERE who = ? AND ts >= ?`;
    const args = [agent, since];
    if (!includeSilent) q += " AND silent = 0";
    q += " ORDER BY seq DESC LIMIT ?"; args.push(limit);
    return this.db.prepare(q).all(...args);
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
}

export default VarsQueue;

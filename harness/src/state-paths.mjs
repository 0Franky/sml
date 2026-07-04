/**
 * state-paths — SSOT delle directory di stato dell'harness (`.pi/state` + sotto-dir).
 *
 * Modulo LEAF neutro (zero import → nessun ciclo con state-db/conversation-store). Prima `.pi/state`,
 * `.pi/state/trace`, `.pi/state/reports` erano literal ripetuti in ~10 siti; un cambio del root-dir avrebbe
 * richiesto una caccia manuale. Qui il root vive UNA volta e le sotto-dir sono DERIVATE. (audit SSOT/DRY
 * 2026-07-04, CLAUDE.md #16.) Forward-slash (OS-agnostico: node li normalizza su Windows).
 *
 * NB path-DB: VARS_DB_PATH/CONV_DB_PATH li esporta state-db.mjs (li deriva da STATE_DIR) — lì vive il ciclo-vita
 * delle connessioni, qui solo le directory pure.
 */

/**
 * Root dello stato persistito dell'harness. Override via env `HARNESS_STATE_DIR` (path assoluto consigliato)
 * → RILOCALIZZA l'intera catena derivata (TRACE_DIR/REPORTS_DIR qui + VARS_DB_PATH/CONV_DB_PATH in state-db.mjs,
 * che deriva anch'esso da STATE_DIR). Serve a ISOLARE i run (A/B vanilla-vs-nostro, driver headless) senza
 * inquinare il `.pi/state` reale della TUI viva (test-pollution) né far contendere i DB tra processi (il
 * busy_timeout torna rete-di-sicurezza invece di dipendenza load-bearing). Valutato all'import: nel modello
 * "pi subprocess con env preimpostato" (driver/eval) ogni processo ha il suo state-dir disgiunto.
 */
export const STATE_DIR = process.env.HARNESS_STATE_DIR || ".pi/state";

/** Trace per-turno + log diagnostici (capture-errors.log, context-assembly-errors.log). */
export const TRACE_DIR = `${STATE_DIR}/trace`;

/** Report del pop-matrioska + artefatti di sintesi. */
export const REPORTS_DIR = `${STATE_DIR}/reports`;

export default { STATE_DIR, TRACE_DIR, REPORTS_DIR };

/**
 * db-pragmas — SSOT dei PRAGMA di concorrenza per gli store SQLite (`node:sqlite`).
 *
 * Modulo LEAF neutro: NON importa state-db/conversation-store/vars-queue (quelli importerebbero a rovescio →
 * ciclo). Estrae la sequenza busy_timeout→WAL che era DUPLICATA nei due costruttori (conversation-store,
 * vars-queue) + il magic `5000` ripetuto anche in drive-qwen-rpc. (audit SSOT/DRY 2026-07-04, CLAUDE.md #16.)
 *
 * ⚠ ORDINE LOAD-BEARING (bug P0 2026-07-04): `busy_timeout` va settato PRIMA di `journal_mode=WAL` e dello SCHEMA.
 * In WAL c'è UN solo writer: due processi concorrenti (driver headless + TUI) con busy_timeout=0 → "database is
 * locked" IMMEDIATO → append/PRAGMA in throw → turno perso in silenzio (amnesia). 5s assorbe la contesa (le
 * scritture durano ms). Vedi wiki bug P0 + conversation-store/vars-queue constructor.
 */

/** Millisecondi di attesa su lock prima di fallire (bug P0 2026-07-04). Sorgente unica del valore di contesa. */
export const DB_BUSY_TIMEOUT_MS = 5000;

/**
 * Applica i PRAGMA di concorrenza a una connessione `node:sqlite` appena aperta, NELL'ORDINE corretto
 * (busy_timeout PRIMA di WAL). Da chiamare nel constructor dello store, prima di eseguire lo SCHEMA.
 * @param {{ exec: (sql: string) => unknown }} db  una connessione DatabaseSync (o compatibile con .exec).
 */
export function applyConcurrencyPragmas(db) {
  db.exec(`PRAGMA busy_timeout = ${DB_BUSY_TIMEOUT_MS};`);
  db.exec("PRAGMA journal_mode = WAL;"); // concorrenza: i lettori non bloccano lo scrittore
}

export default { DB_BUSY_TIMEOUT_MS, applyConcurrencyPragmas };

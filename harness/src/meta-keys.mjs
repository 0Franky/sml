/**
 * meta-keys — SSOT dei prefissi/chiavi della tabella `meta` (vars.db) condivisi tra estensioni e tool.
 *
 * Modulo LEAF neutro (zero import): una chiave scritta da un'estensione e letta da un'altra (o da un tool di
 * ispezione/driver) DEVE coincidere byte-per-byte. Prima ogni sito ri-hardcodava il literal → un rename del
 * prefisso in un solo posto rompeva reader/writer in SILENZIO (es. la lane leggeva seq 0 = "chat mai ripiegata").
 * Centralizzando qui, il rename è in un punto solo. (audit SSOT/DRY 2026-07-04, CLAUDE.md #16.)
 *
 * NB composizione (i valori sono preservati ESATTAMENTE come i literal storici — non cambiare senza migrazione DB):
 *  - CHECKPOINT_SEQ_META / EVICTION_ORDINAL_META = PREFISSI con `:` finale → chiave = `${PREFIX}${convId}`.
 *  - CONV_ID_META = PREFISSO SENZA `:` → chiave = `${CONV_ID_META}:${sessionId}` (il `:` lo aggiunge il call-site);
 *    i tool che filtrano usano `LIKE '${CONV_ID_META}%'`.
 *  - GATHER_TOKEN_META = CHIAVE COMPLETA (nessun suffisso).
 */

/** Prefisso del segment-boundary per-conversazione (writer: checkpoint.ts; reader: context-assembly.ts). */
export const CHECKPOINT_SEQ_META = "_checkpoint_seq:";

/** Prefisso dell'ordinale ultimo-turno-evicted per-conversazione (eviction-checkpoint.ts; tool drive-qwen.mjs). */
export const EVICTION_ORDINAL_META = "_eviction_ordinal:";

/** Prefisso del convId persistito per-sessione — la chiave reale è `${CONV_ID_META}:${sessionId}`
 *  (conversation-capture.ts; tool harness-inspect.mjs via `LIKE '${CONV_ID_META}%'`). */
export const CONV_ID_META = "_conv_id";

/** Chiave COMPLETA del token "gather fatta" (writer: vars-queue.ts/nested-compact.ts; reader: nested-compact.mjs). */
export const GATHER_TOKEN_META = "_gather_token";

export default { CHECKPOINT_SEQ_META, EVICTION_ORDINAL_META, CONV_ID_META, GATHER_TOKEN_META };

/**
 * lane-defaults — SSOT dei default NUMERICI delle lane di context (finestra messaggi + char-cap).
 *
 * Modulo LEAF (zero import): evita il CICLO che avrebbe l'alternativa "importa DEFAULT_HARNESS_CONFIG"
 * (harness-config.mjs → nested-compact.mjs → conversation-store.mjs; importare harness-config a rovescio in una
 * di queste chiuderebbe il cerchio). Qui vivono i valori grezzi; harness-config li compone in DEFAULT_HARNESS_CONFIG
 * e le pure-fn (buildMessagesLane / buildWorkspace / buildNestedWorkspace) li usano come default-param → una sola
 * sorgente, niente più il default-ombra 6 che contraddiceva il vero 8. (audit SSOT/DRY 2026-07-04, CLAUDE.md #16.)
 */

/** Turni verbatim mostrati nella lane <messages_with_user>. */
export const DEFAULT_MESSAGES_WINDOW_N = 8;

/** Cap in CHAR della lane <messages_with_user> — VINCOLO reale sulla dimensione (~3 char/token → ~1300 token). */
export const DEFAULT_MESSAGES_CHAR_CAP = 4000;

/**
 * Quante view possono restare aperte insieme nella lane <open_file_view>. Superato → RIFIUTO esplicito
 * (mai sfratto silenzioso: la scelta di cosa chiudere deve restare un atto deliberato del modello = il
 * segnale di training; cfr. file-view.mjs §ANTI-PROLIFERAZIONE, vincolo utente I23).
 * Esposto a config (`maxOpenFileViews` / `HARNESS_MAX_OPEN_FILE_VIEWS`) su richiesta utente 2026-07-16.
 * ⚠ Il default resta **3** — l'utente lo ricordava come 4: il rifiuto scatta ALLA 4ª apertura, quindi
 * il numero di view contemporanee è 3. Cambiarlo è una scelta di tuning, non un fix.
 */
export const DEFAULT_MAX_OPEN_FILE_VIEWS = 3;

export default { DEFAULT_MESSAGES_WINDOW_N, DEFAULT_MESSAGES_CHAR_CAP, DEFAULT_MAX_OPEN_FILE_VIEWS };

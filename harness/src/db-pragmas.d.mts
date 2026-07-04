/** Type declarations for db-pragmas.mjs (SSOT PRAGMA di concorrenza SQLite). */
export const DB_BUSY_TIMEOUT_MS: number;
export function applyConcurrencyPragmas(db: { exec: (sql: string) => unknown }): void;

declare const _default: {
  DB_BUSY_TIMEOUT_MS: number;
  applyConcurrencyPragmas: typeof applyConcurrencyPragmas;
};
export default _default;

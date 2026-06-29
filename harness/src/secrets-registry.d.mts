/** Type declarations for secrets-registry.mjs (registry condiviso dei segreti dinamici per-sessione). */
export const MIN_SECRET_LEN: number;
export const MIN_SECRET_DISTINCT: number;
export const MAX_SECRETS: number;
export function addSecret(value: string): { ok: boolean; size: number; reason?: string };
export function getDynamicSecrets(): Set<string>;
export function clearSecrets(): void;
declare const _default: { addSecret: typeof addSecret; getDynamicSecrets: typeof getDynamicSecrets; clearSecrets: typeof clearSecrets };
export default _default;

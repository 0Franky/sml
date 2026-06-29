/** Type declarations for secrets-registry.mjs (registry condiviso dei segreti dinamici per-sessione). */
export function addSecret(value: string): number;
export function getDynamicSecrets(): Set<string>;
export function clearSecrets(): void;
declare const _default: { addSecret: typeof addSecret; getDynamicSecrets: typeof getDynamicSecrets; clearSecrets: typeof clearSecrets };
export default _default;

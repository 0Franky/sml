/** Type declarations for session-context.mjs (convId per-sessione condiviso). */
export function setConvId(id: string | null | undefined): void;
export function getConvId(): string;
export function resolveConvId(reason: string, persisted: string | null | undefined, stamp: number | string): { convId: string; isNew: boolean; persist: boolean };
declare const _default: { setConvId: typeof setConvId; getConvId: typeof getConvId; resolveConvId: typeof resolveConvId };
export default _default;

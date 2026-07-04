/** Type declarations for session-context.mjs (convId per-sessione condiviso; D3 fix 2026-07-04). */
export function sessionIdOf(ctx: any): string | null;
export function setConvIdForSession(sessionId: string | null | undefined, convId: string | null | undefined): void;
export function convIdFor(ctx: any): string;
export function clearSession(sessionId: string | null | undefined): void;
/** @deprecated legacy shim su _fallbackConvId — usa convIdFor(ctx). */
export function setConvId(id: string | null | undefined): void;
/** @deprecated legacy shim su _fallbackConvId — usa convIdFor(ctx). */
export function getConvId(): string;
export function resolveConvId(reason: string, persisted: string | null | undefined, stamp: number | string, opts?: { perSession?: boolean }): { convId: string; isNew: boolean; persist: boolean };
declare const _default: {
  setConvId: typeof setConvId;
  getConvId: typeof getConvId;
  resolveConvId: typeof resolveConvId;
  sessionIdOf: typeof sessionIdOf;
  setConvIdForSession: typeof setConvIdForSession;
  convIdFor: typeof convIdFor;
  clearSession: typeof clearSession;
};
export default _default;

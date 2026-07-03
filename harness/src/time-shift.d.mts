export function parseSessionStartMs(convId: string | null | undefined): number | null;
export function sessionStartIso(ms: number): string | null;
export function formatShift(deltaMs: number): string;
export function shiftPrefix(itemTsMs: number, sessionStartMs: number): string;

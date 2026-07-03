export interface DestructivePattern {
  re: RegExp;
  label: string;
}
export interface DestructiveHit {
  blocked: true;
  label: string;
  pattern: RegExp;
}
export const DESTRUCTIVE_PATTERNS: DestructivePattern[];
export function checkDestructive(cmd: string): DestructiveHit | null;
export function blockReason(hit: DestructiveHit): string;

declare const _default: {
  DESTRUCTIVE_PATTERNS: DestructivePattern[];
  checkDestructive: typeof checkDestructive;
  blockReason: typeof blockReason;
};
export default _default;

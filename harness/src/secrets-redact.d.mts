export const SECRET_PATTERNS: RegExp[];
export const REDACTION_MARKER: string;
export function redactText(
  text: string,
  dynamicSecrets?: Iterable<string>,
  opts?: { staticPatterns?: boolean },
): { redacted: string; hit: boolean };
declare const _default: typeof redactText;
export default _default;

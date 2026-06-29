export const SECRET_PATTERNS: RegExp[];
export function redactText(
  text: string,
  dynamicSecrets?: Iterable<string>,
): { redacted: string; hit: boolean };
declare const _default: typeof redactText;
export default _default;

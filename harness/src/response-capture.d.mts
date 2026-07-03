/** Type declarations for response-capture.mjs — estrazione pura di un valore dalla risposta HTTP (renewal). */

export type CaptureExtraction = { ok: true; value: string } | { ok: false; reason: string };

/**
 * Estrae un valore dalla risposta secondo `from`:
 *  - "$.a.b" / "a.b[0]" → JSON path sul body
 *  - "regex:PATTERN"    → primo match sul body (gruppo 1 se presente)
 *  - "header:NAME"      → header di risposta (allow-listed)
 */
export function extractCaptureValue(
  body: string,
  headers: Record<string, string>,
  from: string,
): CaptureExtraction;

declare const _default: { extractCaptureValue: typeof extractCaptureValue };
export default _default;

/** Type declarations for sealed-secrets.mjs (sealed registry + reference-injection + sink-gating). */
export type SinkMode = "strict" | "warn" | "off";

export interface SecretMeta {
  name: string;
  description: string;
  allowedSinks: string[];
  allowLocalHttp?: boolean;
  fingerprint?: string;
}

export interface SinkVerdict {
  allowed: boolean;
  reason?: string;
  warn?: string;
}

export interface InjectResult {
  text: string;
  injected: string[];
  blocked: { name: string; reason: string }[];
  warnings: string[];
}

export interface IngressHit {
  value: string;
  confidence: "high" | "medium";
}

export function setSecret(
  name: string,
  value: string,
  opts?: { description?: string; allowedSinks?: string[]; redactEgress?: boolean; allowLocalHttp?: boolean },
): { ok: boolean; name?: string; reason?: string; warn?: string };
export function setAllowLocalHttp(
  name: string,
  allow?: boolean,
): { ok: boolean; name?: string; allowLocalHttp?: boolean; reason?: string };
export function listSecretsMeta(): SecretMeta[];
export function hasSecret(name: string): boolean;
export function referencedSecrets(text: string): string[];
export function extractHosts(opText: string): string[];
export function hasFileOrPipeExfil(opText: string): boolean;
export function hasInsecureHttp(opText: string): boolean;
export function hasHostPinning(opText: string): boolean;
export function isLoopbackLiteral(host: string): boolean;
export function checkSink(name: string, opText: string, mode?: SinkMode): SinkVerdict;
export function injectSecrets(opText: string, mode?: SinkMode): InjectResult;
export function injectIntoStrings(
  strings: string[],
  mode?: SinkMode,
): { strings: string[]; injected: string[]; blocked: { name: string; reason: string }[]; warnings: string[] };
export function scanIngress(text: string): IngressHit[];
export function autoSealIngress(
  text: string,
  opts?: { redactEgress?: boolean },
): { text: string; sealed: { name: string; confidence: "high" | "medium" }[] };
export function loadFromEnv(
  env?: Record<string, string | undefined>,
  meta?: Record<string, { description?: string; allowedSinks?: string[]; redactEgress?: boolean; allowLocalHttp?: boolean }>,
): string[];
export function clearSealed(): void;

declare const _default: {
  setSecret: typeof setSecret;
  setAllowLocalHttp: typeof setAllowLocalHttp;
  listSecretsMeta: typeof listSecretsMeta;
  hasSecret: typeof hasSecret;
  referencedSecrets: typeof referencedSecrets;
  extractHosts: typeof extractHosts;
  hasFileOrPipeExfil: typeof hasFileOrPipeExfil;
  isLoopbackLiteral: typeof isLoopbackLiteral;
  checkSink: typeof checkSink;
  injectSecrets: typeof injectSecrets;
  scanIngress: typeof scanIngress;
  loadFromEnv: typeof loadFromEnv;
  clearSealed: typeof clearSealed;
};
export default _default;

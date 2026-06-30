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
export function hasCommandComposition(opText: string): boolean;
export function hasForeignHostToken(opText: string): boolean;
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

// ── lifecycle in-sessione (grant-sink / rename / remove / edit / validate) ──
export interface SecretEditChanges {
  rename?: string;
  addSinks?: string[];
  removeSinks?: string[];
  description?: string;
  allowLocalHttp?: boolean;
}
export interface SecretEditDiffEntry {
  field: string;
  before: string;
  after: string;
  widening: boolean;
  note?: string;
  invalid?: boolean;
}
export interface SecretEditDiff {
  exists: boolean;
  name?: string;
  changes?: SecretEditDiffEntry[];
  anyWidening?: boolean;
  anyInvalid?: boolean;
  externalSinks?: string[];
}
export interface SecretRefValidation {
  ok: boolean;
  refs: { name: string; exists: boolean; suggestion?: string }[];
  unknown: string[];
}
export function isValidSinkHost(host: string): boolean;
export function addAllowedSink(
  name: string,
  host: string,
): { ok: boolean; name?: string; allowedSinks?: string[]; added?: boolean; reason?: string };
export function removeAllowedSink(
  name: string,
  host: string,
): { ok: boolean; name?: string; allowedSinks?: string[]; removed?: boolean; reason?: string };
export function setSecretDescription(
  name: string,
  description: string,
): { ok: boolean; name?: string; description?: string; reason?: string };
export function renameSecret(
  oldName: string,
  newName: string,
): { ok: boolean; name?: string; renamed?: boolean; from?: string; reason?: string };
export function removeSecret(name: string): { ok: boolean; name?: string; removed?: boolean; reason?: string };
export function computeSecretEditDiff(name: string, changes?: SecretEditChanges): SecretEditDiff;
export function applySecretEdit(
  name: string,
  changes?: SecretEditChanges,
): { ok: boolean; name?: string; applied?: string[]; reason?: string };
export function validateSecretRefs(text: string): SecretRefValidation;
export interface SecretUsePreview {
  name: string;
  exists: boolean;
  allowed: boolean;
  reason?: string;
  remediation?: string;
  warn?: string;
}
export function previewSecretUse(name: string, opText: string, mode?: SinkMode): SecretUsePreview;

// ── canale TIPIZZATO http_request (ADR 2026-06-30) ──
export function checkSinkTyped(name: string, urlString: string, mode?: SinkMode): SinkVerdict;
export interface TypedInjectResult {
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  injected: string[];
  blocked: { name: string; reason: string }[];
  warnings: string[];
}
export function injectTypedRequest(
  req: { url: string; headers?: Record<string, string>; body?: string },
  mode?: SinkMode,
): TypedInjectResult;

declare const _default: {
  setSecret: typeof setSecret;
  setAllowLocalHttp: typeof setAllowLocalHttp;
  listSecretsMeta: typeof listSecretsMeta;
  hasSecret: typeof hasSecret;
  referencedSecrets: typeof referencedSecrets;
  extractHosts: typeof extractHosts;
  hasFileOrPipeExfil: typeof hasFileOrPipeExfil;
  hasInsecureHttp: typeof hasInsecureHttp;
  hasCommandComposition: typeof hasCommandComposition;
  hasForeignHostToken: typeof hasForeignHostToken;
  hasHostPinning: typeof hasHostPinning;
  isLoopbackLiteral: typeof isLoopbackLiteral;
  checkSink: typeof checkSink;
  injectSecrets: typeof injectSecrets;
  injectIntoStrings: typeof injectIntoStrings;
  scanIngress: typeof scanIngress;
  loadFromEnv: typeof loadFromEnv;
  clearSealed: typeof clearSealed;
  isValidSinkHost: typeof isValidSinkHost;
  addAllowedSink: typeof addAllowedSink;
  removeAllowedSink: typeof removeAllowedSink;
  setSecretDescription: typeof setSecretDescription;
  renameSecret: typeof renameSecret;
  removeSecret: typeof removeSecret;
  computeSecretEditDiff: typeof computeSecretEditDiff;
  applySecretEdit: typeof applySecretEdit;
  validateSecretRefs: typeof validateSecretRefs;
  previewSecretUse: typeof previewSecretUse;
  checkSinkTyped: typeof checkSinkTyped;
  injectTypedRequest: typeof injectTypedRequest;
};
export default _default;

/** Type declarations for secrets-consent.mjs — orchestrazione node-pure del consenso sui sealed-secrets. */

/** Interfaccia UI minimale richiesta (sottoinsieme di ExtensionUIContext di pi). */
export interface ConsentUI {
  /** Selettore 3-vie nativo (opzionale): usato per sì/modifica/annulla sul widening; se assente si degrada a confirm. */
  select?(title: string, options: string[]): Promise<string | undefined>;
  confirm(title: string, message: string): Promise<boolean>;
  input(title: string, placeholder?: string): Promise<string | undefined>;
  notify(message: string, type?: "info" | "warning" | "error"): void;
}

export interface ConsentResult {
  content: { type: "text"; text: string }[];
  details: { ok: boolean; applied?: string[]; name?: string; aborted?: string };
}

export interface SecretEditChanges {
  rename?: string;
  addSinks?: string[];
  removeSinks?: string[];
  description?: string;
  allowLocalHttp?: boolean;
}

export interface SecretCreateProposal {
  name: string;
  description?: string;
  allowedSinks?: string[];
  allowLocalHttp?: boolean;
  redactEgress?: boolean;
}

export function renderEditDiff(diff: any): string;
export function wideningChallenge(diff: any, changes: SecretEditChanges): string;
export function isSuspiciousHost(host: string, knownHosts?: string[]): { suspicious: boolean; reason?: string };
export function headlessEditInstructions(name: string, changes: SecretEditChanges): string;
export function askAndApplyEdit(ui: ConsentUI | undefined, hasUI: boolean, name: string, changes: SecretEditChanges, why: string, titleVerb: string): Promise<ConsentResult>;
export function askAndDestroy(ui: ConsentUI | undefined, hasUI: boolean, name: string, why: string): Promise<ConsentResult>;
export function askLocalHttp(ui: ConsentUI | undefined, hasUI: boolean, name: string, why: string): Promise<ConsentResult>;
export function askAndCreate(ui: ConsentUI | undefined, hasUI: boolean, proposal: SecretCreateProposal, why: string): Promise<ConsentResult>;

/** Esito della promozione dei valori auto-sigillati da regex-ingress (fix C). */
export interface PromoteIngressResult {
  /** mappa INGRESS_N → nuovo nome (per riscrivere i {{secret:...}} nel testo). */
  renames: Record<string, string>;
  /** mappa nome-secret → host concessi in questa promozione. */
  granted: Record<string, string[]>;
}
export function promoteSealedIngress(ui: Pick<ConsentUI, "input" | "notify"> | undefined, hasUI: boolean, names: string[]): Promise<PromoteIngressResult>;

declare const _default: {
  renderEditDiff: typeof renderEditDiff;
  wideningChallenge: typeof wideningChallenge;
  isSuspiciousHost: typeof isSuspiciousHost;
  headlessEditInstructions: typeof headlessEditInstructions;
  askAndApplyEdit: typeof askAndApplyEdit;
  askAndDestroy: typeof askAndDestroy;
  askLocalHttp: typeof askLocalHttp;
  askAndCreate: typeof askAndCreate;
  promoteSealedIngress: typeof promoteSealedIngress;
};
export default _default;

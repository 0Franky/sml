/** Type declarations for http-request.mjs — executor del canale tipizzato http_request. */
import type { SinkMode } from "./sealed-secrets.mjs";

export interface CaptureSpec {
  /** Nome di un secret ESISTENTE usato in questa stessa richiesta, da rinnovare in-place col valore estratto. */
  secret: string;
  /** Dove leggere il nuovo valore: JSON path ("$.access_token"), "regex:PATTERN" (gruppo 1), o "header:NAME". */
  from: string;
}

export interface CaptureResult {
  ok: boolean;
  secret: string;
  from?: string;
  note?: string;
  warn?: string;
  reason?: string;
}

export interface HttpRequestParams {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  /** Renewal/response-capture: rinnova un secret sigillato dal valore nella risposta (vedi CaptureSpec). */
  capture?: CaptureSpec;
}

export interface HttpRequestOptions {
  fetchImpl?: (input: any, init?: any) => Promise<any>;
  mode?: SinkMode;
  maxBytes?: number;
}

export interface HttpRequestResult {
  ok: boolean;
  status?: number;
  headers?: Record<string, string>;
  body?: string;
  truncated?: boolean;
  redirected?: boolean;
  location?: string;
  injected?: string[];
  blocked?: { name: string; reason: string }[];
  warnings?: string[];
  error?: string;
  hint?: string;
  note?: string;
  /** Esito del renewal/response-capture, se `capture` era richiesto. */
  captured?: CaptureResult;
}

export function executeHttpRequest(params: HttpRequestParams, opts?: HttpRequestOptions): Promise<HttpRequestResult>;

declare const _default: { executeHttpRequest: typeof executeHttpRequest };
export default _default;

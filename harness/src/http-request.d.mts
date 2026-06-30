/** Type declarations for http-request.mjs — executor del canale tipizzato http_request. */
import type { SinkMode } from "./sealed-secrets.mjs";

export interface HttpRequestParams {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
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
}

export function executeHttpRequest(params: HttpRequestParams, opts?: HttpRequestOptions): Promise<HttpRequestResult>;

declare const _default: { executeHttpRequest: typeof executeHttpRequest };
export default _default;

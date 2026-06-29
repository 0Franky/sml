/**
 * gemini-compat — provider-compat shim per Google Gemini (endpoint OpenAI-compatible).
 *
 * PROBLEMA (verificato 2026-06-29 via E2E headless): l'adapter `openai-completions` di pi
 * aggiunge al body alcuni campi OpenAI-only (in primis `store`). L'endpoint Gemini
 * OpenAI-compat (https://generativelanguage.googleapis.com/v1beta/openai/) li rifiuta con
 * HTTP 400 "Invalid JSON payload received. Unknown name \"store\": Cannot find field." e il
 * turno finisce con un messaggio assistant VUOTO (errore deglutito dallo stream loop).
 *
 * FIX: hook `before_provider_request` → rimuove i campi non supportati dal payload PRIMA
 * dell'invio. Vale sia per l'SDK headless sia per la TUI `pi` reale (stesso hook).
 * Difesa F-harness, deterministica, idempotente. NESSUN impatto su provider che accettano
 * quei campi perché l'hook è registrato solo qui e tocca solo le chiavi note-incompatibili.
 *
 * API pi verificata: pi.on("before_provider_request", (e) => payloadModificato).
 *   e.payload : unknown (il body JSON-serializzabile). Ritornare il payload mutato lo sostituisce.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Campi che l'OpenAI-completions adapter può emettere ma che Gemini OpenAI-compat rifiuta.
const UNSUPPORTED_FIELDS = ["store", "metadata", "parallel_tool_calls", "reasoning_effort"];

export default function (pi: ExtensionAPI) {
  pi.on("before_provider_request", (event) => {
    const payload = event.payload as Record<string, unknown> | undefined;
    if (!payload || typeof payload !== "object") return; // niente da fare
    let changed = false;
    for (const f of UNSUPPORTED_FIELDS) {
      if (f in payload) {
        delete (payload as Record<string, unknown>)[f];
        changed = true;
      }
    }
    if (changed) return payload; // ritorna il payload ripulito → pi lo usa per la richiesta
    // se nulla è cambiato, non ritornare nulla → payload invariato
  });
}

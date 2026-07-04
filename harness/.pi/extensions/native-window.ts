/**
 * native-window — Strada-2: BOUNDA l'array messaggi NATIVO di pi al solo TURNO CORRENTE (hook `context`).
 *
 * Estratta da context-assembly (review-loop #3 2026-06-29, P3 cohesion): due responsabilità ORTOGONALI che
 * cambiano per motivi diversi → (1) "assembla il <context>/workspace" (context-assembly, hook before_agent_start)
 * vs (2) "finestra l'array nativo" (qui, hook context). Tenerle separate rende esplicita la COMPLEMENTARITÀ
 * native(turno corrente) ↔ lane <messages_with_user>(storia, assemblata da context-assembly): non si sovrappongono.
 *
 * keepTurns:1 = solo il turno corrente (coi suoi tool_call/tool_result) → la continuità del tool-loop è intatta;
 * la storia dei turni precedenti vive UNA volta sola nella lane (testo verbatim) + nello stato curato
 * (recent_changes/vars/error-memo). Sostituisce la compaction nativa (OFF). I turni soppressi restano in
 * conversations.db, recuperabili via get_conversation. (ADR principio-3.) Logica testata: conversation-store.test.mjs.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { windowNativeMessages } from "../../src/conversation-store.mjs";
import { loadHarnessConfig } from "../../src/harness-config.mjs";

// keepTurns dalla config (SSOT: harness-config.mjs — default reale 6, raise ATTIVO msg 863; env HARNESS_NATIVE_KEEP_TURNS
// per l'A/B). loadHarnessConfig GARANTISCE già un intero ≥1 (clamp file/env) → si legge il campo diretto, niente
// `?? 1`/`as any`/Math.max al call-site (la difesa vive nella config, CLAUDE.md #16). La lane <messages_with_user>
// resta COMPLEMENTARE (solo i turni più vecchi del K-esimo, via nthLastUserSeq → niente doppia-chat).
const KEEP_TURNS = loadHarnessConfig().nativeKeepTurns;

export default function (pi: ExtensionAPI) {
  pi.on("context", (event) => {
    const windowed = windowNativeMessages(event.messages as any[], { keepTurns: KEEP_TURNS });
    if (windowed !== (event.messages as any[])) return { messages: windowed };
  });
}

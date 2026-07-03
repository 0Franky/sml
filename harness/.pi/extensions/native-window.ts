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

// keepTurns da config. DEFAULT 1 (INVARIATO): l'utente (msg 830) vuole prima provare la via AWARENESS — spiegare al
// modello che vede 1 solo messaggio per volta e che le LANE sono la sua memoria (vedi lane <how_memory_works> in
// context-assembly). ALZARE keepTurns è l'ULTIMA opzione, da flippare via config SOLO se l'awareness non basta.
// Config-driven (env HARNESS_NATIVE_KEEP_TURNS) → il futuro raise è un cambio di 1 valore, con complementarità già pronta.
const KEEP_TURNS = Math.max(1, Number((loadHarnessConfig() as any).nativeKeepTurns ?? 1));

export default function (pi: ExtensionAPI) {
  pi.on("context", (event) => {
    const windowed = windowNativeMessages(event.messages as any[], { keepTurns: KEEP_TURNS });
    if (windowed !== (event.messages as any[])) return { messages: windowed };
  });
}

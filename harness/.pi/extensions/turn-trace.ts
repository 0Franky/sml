/**
 * turn-trace — OSSERVABILITÀ per-turno (diagnostica, dev/testing). Idea utente 2026-06-29.
 *
 * Logga, a OGNI richiesta al provider, ciò che il modello riceve DAVVERO (system prompt + array messaggi nativo
 * POST-windowing) e calcola una metrica di SOVRAPPOSIZIONE native↔lane — il banco di prova del fix "doppia-chat"
 * (review-loop #3): col fix (keepTurns=1) l'array nativo deve contenere ~solo il turno corrente e l'overlap con la
 * lane <messages_with_user> deve essere ~0-1 (il solo messaggio utente corrente), NON ~4 turni.
 *
 * Hook `before_provider_request` (payload = body reale, ground-truth di ciò che esce verso l'LLM). READ-ONLY:
 * non ritorna mai il payload → non altera la richiesta (coesiste con gemini-compat che invece lo muta).
 *
 * Output (in `.pi/state/trace/`, gitignored runtime — non project-knowledge):
 *   - `trace-<convId>.jsonl` : un record per turno (append) → storico macchina-leggibile.
 *   - `last-turn.md`         : snapshot umano dell'ultimo turno (overwrite) → apribile al volo nella TUI.
 * Tool `trace_status`: ritorna il riepilogo dell'ultimo turno (per ispezione rapida dal modello/utente).
 *
 * Toggle: attivo di default; `PI_TRACE=0` (o "false"/"off") lo disattiva (zero overhead, nessun file).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { getConvId } from "../../src/session-context.mjs";
// Funzioni PURE estratte/testate in turn-trace-lib.mjs (unit: turn-trace-lib.test.mjs). Includono il fix
// role="developer" (OpenAI-completions su pi/ollama/gemini) — prima systemLen/laneLines erano SEMPRE 0 su ollama.
import { extractSystemText, messagesInfo, laneOverlap } from "../../src/turn-trace-lib.mjs";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const TRACE_DIR = ".pi/state/trace";
const ENABLED = !["0", "false", "off", "no"].includes(String(process.env.PI_TRACE ?? "").toLowerCase());

let _last: any = null;

export default function (pi: ExtensionAPI) {
  if (!ENABLED) return; // disattivato → nessun hook, zero overhead

  pi.on("before_provider_request", (event, ctx) => {
    try {
      const payload: any = (event as any).payload;
      const sys = extractSystemText(payload);
      const mi = messagesInfo(payload);
      const ov = laneOverlap(sys, mi.text);
      const usage = ctx?.getContextUsage?.();
      const tokens = usage?.tokens ?? null;
      const contextWindow = usage?.contextWindow ?? null;
      // frazione 0..1 AFFIDABILE calcolata da noi (token/finestra), come fa il trigger matrioska — evita l'ambiguità
      // di `usage.percent` (pi lo ritorna in scala 0..100, non 0..1). Fallback a percent/100 se la finestra manca.
      const contextFraction =
        tokens != null && contextWindow ? tokens / contextWindow : usage?.percent != null ? usage.percent / 100 : null;
      const rec = {
        ts: new Date().toISOString(),
        convId: getConvId(),
        systemLen: sys.length,
        nativeMessages: mi.count,
        nativeRoles: mi.roles,
        nativeUserTurns: mi.userTurns, // turni-utente GENUINI (tool-result esclusi); col fix keepTurns=1 → atteso 1
        nativeToolResults: mi.toolResults,
        laneLines: ov.laneLines,
        laneNativeOverlap: ov.overlap, // col fix → atteso ≤1 (solo il msg utente corrente); ~4 = doppia-chat
        tokens,
        contextWindow,
        contextFraction, // 0..1
        contextPercentRaw: usage?.percent ?? null, // ciò che pi riporta grezzo (scala 0..100), per diagnosi
      };
      _last = rec;
      mkdirSync(TRACE_DIR, { recursive: true });
      appendFileSync(join(TRACE_DIR, `trace-${getConvId()}.jsonl`), JSON.stringify(rec) + "\n");
      const dup = ov.overlap <= 1 ? "OK (no doppia-chat)" : `⚠ overlap=${ov.overlap} (possibile doppia-chat)`;
      writeFileSync(
        join(TRACE_DIR, "last-turn.md"),
        `# turn-trace — ultimo turno\n\n` +
          `- ts: ${rec.ts}\n- convId: ${rec.convId}\n` +
          `- system prompt: ${rec.systemLen} char\n` +
          `- messaggi NATIVI (no system): ${rec.nativeMessages}  → ruoli: ${rec.nativeRoles.join(", ")}\n` +
          `- turni-utente nativi: ${rec.nativeUserTurns}  (atteso 1 = solo turno corrente; tool-result esclusi: ${rec.nativeToolResults})\n` +
          `- righe lane <messages_with_user>: ${rec.laneLines}\n` +
          `- overlap lane↔native: ${rec.laneNativeOverlap}  → ${dup}\n` +
          `- contesto: ${rec.tokens ?? "?"} token${rec.contextWindow ? ` / ${rec.contextWindow}` : ""}  (${rec.contextFraction != null ? Math.round(rec.contextFraction * 100) + "%" : "?"})\n`,
      );
    } catch {
      /* la diagnostica non deve mai rompere la richiesta */
    }
  });

  pi.registerTool({
    name: "trace_status",
    label: "Last turn trace summary",
    description:
      "Diagnostic summary of the LAST turn: native messages, native user turns, lane↔native overlap " +
      "(≤1 = ok, ~N = double-chat), tokens. Useful to verify the context is assembled without duplication.",
    promptSnippet: "trace_status() — diagnostics of the last turn (lane/native overlap, tokens).",
    parameters: Type.Object({}),
    async execute() {
      return {
        content: [{ type: "text", text: _last ? JSON.stringify(_last, null, 2) : "(no turn traced yet)" }],
        details: { ok: true },
      };
    },
  });
}

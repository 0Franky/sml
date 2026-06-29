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
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const TRACE_DIR = ".pi/state/trace";
const ENABLED = !["0", "false", "off", "no"].includes(String(process.env.PI_TRACE ?? "").toLowerCase());

/** Testo da un content che può essere stringa o array di blocchi {type,text}. Difensivo. */
function contentText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((b: any) => (typeof b === "string" ? b : typeof b?.text === "string" ? b.text : ""))
      .join("");
  }
  return "";
}

/** System prompt dal payload (Anthropic: campo `system`; OpenAI: messaggio role=system). */
function extractSystemText(payload: any): string {
  if (!payload || typeof payload !== "object") return "";
  if (typeof payload.system === "string") return payload.system;
  if (Array.isArray(payload.system)) return contentText(payload.system);
  if (Array.isArray(payload.messages)) {
    const sm = payload.messages.find((m: any) => m && m.role === "system");
    if (sm) return contentText(sm.content);
  }
  return "";
}

/** Info sull'array messaggi NATIVO (escluso il system). */
function messagesInfo(payload: any): { count: number; roles: string[]; userTurns: number; text: string } {
  const msgs = payload && Array.isArray(payload.messages) ? payload.messages : [];
  const nonSystem = msgs.filter((m: any) => m && m.role !== "system");
  const roles = nonSystem.map((m: any) => String(m.role ?? "?"));
  return {
    count: nonSystem.length,
    roles,
    userTurns: roles.filter((r: string) => r === "user").length,
    text: nonSystem.map((m: any) => contentText(m.content)).join("\n"),
  };
}

const norm = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/** Sovrapposizione lane↔native: quante righe della lane <messages_with_user> ricompaiono nell'array nativo. */
function laneOverlap(systemText: string, nativeText: string): { laneLines: number; overlap: number } {
  const m = systemText.match(/<messages_with_user[^>]*>([\s\S]*?)<\/messages_with_user>/);
  if (!m) return { laneLines: 0, overlap: 0 };
  const lines = m[1].split("\n").map((l) => l.trim()).filter((l) => /^\[[^\]]+\]/.test(l));
  const nn = norm(nativeText);
  let overlap = 0;
  for (const l of lines) {
    const probe = norm(l.replace(/^\[[^\]]+\]\s*/, "")).slice(0, 40);
    if (probe.length >= 8 && nn.includes(probe)) overlap++;
  }
  return { laneLines: lines.length, overlap };
}

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
      const rec = {
        ts: new Date().toISOString(),
        convId: getConvId(),
        systemLen: sys.length,
        nativeMessages: mi.count,
        nativeRoles: mi.roles,
        nativeUserTurns: mi.userTurns, // col fix keepTurns=1 → atteso 1 (solo turno corrente)
        laneLines: ov.laneLines,
        laneNativeOverlap: ov.overlap, // col fix → atteso ≤1 (solo il msg utente corrente); ~4 = doppia-chat
        tokens: usage?.tokens ?? null,
        contextPercent: usage?.percent ?? null,
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
          `- turni-utente nativi: ${rec.nativeUserTurns}  (atteso 1 = solo turno corrente)\n` +
          `- righe lane <messages_with_user>: ${rec.laneLines}\n` +
          `- overlap lane↔native: ${rec.laneNativeOverlap}  → ${dup}\n` +
          `- tokens: ${rec.tokens ?? "?"}  (${rec.contextPercent != null ? Math.round(rec.contextPercent * 100) + "%" : "?"})\n`,
      );
    } catch {
      /* la diagnostica non deve mai rompere la richiesta */
    }
  });

  pi.registerTool({
    name: "trace_status",
    label: "Last turn trace summary",
    description:
      "Riepilogo diagnostico dell'ULTIMO turno: messaggi nativi, turni-utente nativi, overlap lane↔native " +
      "(≤1 = ok, ~N = doppia-chat), token. Utile per verificare che il context sia assemblato senza duplicazione.",
    promptSnippet: "trace_status() — diagnostica dell'ultimo turno (overlap lane/native, token).",
    parameters: Type.Object({}),
    async execute() {
      return {
        content: [{ type: "text", text: _last ? JSON.stringify(_last, null, 2) : "(nessun turno tracciato ancora)" }],
        details: { ok: true },
      };
    },
  });
}

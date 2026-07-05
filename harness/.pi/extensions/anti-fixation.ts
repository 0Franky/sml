/**
 * anti-fixation — RUNG metacognitivo triggered su stagnazione (concept anti-fixation-metacognition-rung, utente msg 1115).
 *
 * Diagnosi (trace HE/145, 2026-07-05): il modello si FISSA sulla dimensione sbagliata (ordinamento/tie-breaking) e non
 * mette MAI in dubbio l'assunzione-base sbagliata (l'helper `digit_sum(abs(n))`). Ha il feedback (vede i fail) ma manca
 * la METACOGNIZIONE. Questo scaffold: (1) osserva i tool_result e conta i FAIL-verifica consecutivi (progresso→reset);
 * (2) allo scatto inietta un nudge ESCALANTE (decompose→questiona-assunzione→diversifica), effimero, sul canale USER
 * (il 9B legge user/nativo, ignora il system — stessa evidenza di eviction-checkpoint/harness-config).
 *
 * Trigger sul SEGNALE "non progredisce", NON sul comando-identico (HE/145 variava il comando ogni volta). Logica PURA
 * (testata) in src/anti-fixation.mjs.
 *
 * PACKAGING (utente msg 930.1): estensione DEDICATA, NIENTE flag in harness-config. Gate via **env HARNESS_ANTI_FIXATION**
 * → A/B senza rimuovere il file. Default OFF finché l'EFFICACIA non è validata dall'A/B (regola #14: costruito ≠ efficace);
 * a validazione avvenuta si passerà a on-by-presence. Quando off → no-op TOTALE (nessun hook, nessuno stato): push sicuro.
 * L'esito (rompe la stagnazione & risolve?) è il segnale RL outcome-anchored (il fix VERO è il training; qui è lo scaffold).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { convIdFor } from "../../src/session-context.mjs";
import { classifyTurnSignal, updateStagnation, rungLevel, rungMessage } from "../../src/anti-fixation.mjs";

// Gate env-based (msg 930.1), non harness-config. Default OFF: abilita con HARNESS_ANTI_FIXATION=true|1 per l'A/B.
const ENABLED = process.env.HARNESS_ANTI_FIXATION === "true" || process.env.HARNESS_ANTI_FIXATION === "1";

export default function (pi: ExtensionAPI) {
  if (!ENABLED) return; // DEFAULT off → no-op totale (nessun hook): il rung non esiste finché non lo si abilita per l'A/B.

  // stato di stagnazione per-conversazione (isolamento via convIdFor, come eviction/context-assembly).
  const state = new Map<string, { consecutiveFails: number }>();

  pi.on("session_shutdown", (_e: any, ctx: any) => { state.delete(convIdFor(ctx)); });

  // OSSERVA l'esito della verifica dai tool_result → aggiorna il contatore di stagnazione (nessuna mutazione dell'output).
  pi.on("tool_result", (event: any, ctx: any) => {
    const texts = Array.isArray(event?.content)
      ? event.content.filter((b: any) => b && b.type === "text" && typeof b.text === "string").map((b: any) => b.text)
      : [];
    const signal = classifyTurnSignal(texts);
    if (signal === "neutral") return; // niente segnale di verifica → non muove il contatore
    const convId = convIdFor(ctx);
    state.set(convId, updateStagnation(state.get(convId), signal));
  });

  // INIETTA il nudge escalante SOLO a stagnazione (livello>0), effimero (solo questo request), canale user.
  pi.on("context", (event: any, ctx: any) => {
    const convId = convIdFor(ctx);
    const fails = state.get(convId)?.consecutiveFails ?? 0;
    const level = rungLevel(fails);
    if (level === 0) return; // sotto soglia → zero costo-contesto (nessuna iniezione)
    const msg = rungMessage(level);
    if (!msg) return;
    const messages = ((event as any).messages as any[]) || [];
    return { messages: messages.concat([{ role: "user", content: msg }]) };
  });
}

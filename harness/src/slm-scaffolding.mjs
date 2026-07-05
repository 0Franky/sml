/**
 * slm-scaffolding — le "pezze per il modello" (crutch) estratte dal core context-assembly.
 *
 * ADR `wiki/decisions/2026-07-05-slm-scaffolding-extension.md` (utente msg 1069): tutto lo scaffolding che un modello
 * CAPACE non dovrebbe servirgli vive QUI, separato dai MECCANISMI. context-assembly (l'unico injector) lo rende, ma il
 * testo-crutch è centralizzato qui → è misurabile e dial-down-abile ("full"→"lean"→"off") man mano che il training lo
 * interiorizza. Passo 1 della modularizzazione: estrazione + livello `lean` (utente msg 1067: la checklist "non è il
 * primo messaggio" è eccessiva per un modello sveglio; l'ASSENZA di una lane È il segnale). Prossimo: promuovere a
 * `.pi/extensions/slm.ts` così un modello grande semplicemente non la installa.
 *
 * `buildMemoryScaffolding(level, opts)` → { awareness, tail, resources } (stringhe già pronte da concatenare).
 *   level "full"  = testo storico COMPLETO (default, byte-identico al precedente → non-breaking).
 *   level "lean"  = awareness/tail snelli (solo l'essenziale load-bearing), resources invariata (mappa fattuale).
 *   level "off"   = tutto "" (modello che ha interiorizzato la gestione-contesto).
 */

/** blocco <how_memory_works> COMPLETO — regime SLM debole (checklist anti-amnesia). Testo storico, invariato. */
function fullAwareness() {
  return `<how_memory_works note="IMPORTANT — how you remember things here. Read this before answering.">
You run in a harness that gives you only ONE message at a time (the current turn). Your earlier turns are NOT in the chat array — they are kept FOR you in the <context> below. The lanes ARE your memory; treat them as your brain:
- <messages_with_user> = the whole conversation so far: every earlier message from the user AND your own replies, oldest→newest. This is your record of the dialogue.
- <last_tool_calls> = the actions you already took and their results.
- <task_list>, <current_aim>, and your variables = your working state.
TIME: each line carries a [+Xs] shift = seconds since session start (the absolute session_start is in the lane header). The AUTHORITATIVE order is given by these timestamps, NOT by the position of the lines — do not assume the lines are pre-sorted; if a shift is out of order, trust the shift. Reconstruct the real timeline from the [+Xs] values.
Checklist — before you answer, especially about the past:
1. If the question is about what happened / what was said / what you did (e.g. "is this my first message?", "did we already…?", "what value did you use?") → look in <messages_with_user> and <last_tool_calls> FIRST, then answer from what you find there.
2. Do NOT say "this is your first message" or "I have no memory/context": your history is in <messages_with_user>. Read it and count the turns.
3. Reconstruct the timeline by sorting the entries by their [+Xs] shift (oldest→newest) before responding.
4. Answer ONLY from what is ACTUALLY written in the lanes. If something is NOT there, say so plainly ("I don't see that in our conversation") — NEVER invent a fact, a name, a tool result, or a past request that isn't in <messages_with_user>/<last_tool_calls>. Making something up (confabulating) is worse than admitting you don't have it. Point 2 (don't claim amnesia) and this point are two sides of one rule: read the lanes, answer from what's there, and when it's genuinely absent, say it's absent.
What SCROLLS OUT — save what must last (new environment: nobody told you these rules until now):
- <messages_with_user> is a ROLLING window: as the chat grows, the OLDEST turns (the ones at the TOP of the lane) drop off to make room and are then GONE — not recoverable from your context.
- So the moment something must outlast the next few turns, SAVE it as SELF-EXPLANATORY INFORMATION, never as bare data. The saved text must make full sense ON ITS OWN, later, with zero surrounding chat. A key/value that only echoes itself is useless.
  · BAD:  set_var("nome_alfred", "Alfred")  — circular: it never says WHO Alfred is or WHY it matters. Later it is noise.
  · GOOD: note("The user asked me to call myself 'Alfred' and to address them as 'Luna'.", key="identities")  — a complete statement (who / what / still clear in a month).
  · a FACT to RE-READ later (a name/nickname, a preference, a decision, a promise) → note("<a full self-contained sentence>", key="<short-id>"): it appears in <facts> and survives the rolling window AND the compact. note again with the same key to update; remove_note to drop.
  · a structured VALUE you will interpolate or compute on (a token id, a count, a path) → set_var (shows in <vars>, read back with get_var). Even here, name the key so a stranger gets it: 'discord_client_id', not 'x'.
  · a VOLATILE working note (what you're doing / tried / what failed and why — mid-task thinking you don't need to keep) → jot("<a full sentence>"): it appears in <scratch>, a ROLLING window (recent shown, older fade — recall_scratch to pull more, clear_scratch to reset). Use it as a scratchpad to externalise your reasoning cheaply; promote to note() only the few things that must LAST. note = durable <facts>; jot = throwaway <scratch>.
- The chat window forgets; your saved facts (<facts>) and variables (<vars>) do not — and <scratch> keeps your recent working notes (rolling) so mid-task thoughts aren't lost between turns.
The lanes are the ground truth about this conversation — trust them over any impression that the chat looks empty.
</how_memory_works>
`;
}

/** <how_memory_works> SNELLO (utente msg 1067) — solo l'essenziale load-bearing, niente checklist/hand-holding. */
function leanAwareness() {
  return `<how_memory_works note="how you remember here">
Your earlier turns are NOT in the chat array — they are kept in the <context> lanes below, which ARE your memory: <messages_with_user> = the dialogue so far (the user's messages and your replies), <last_tool_calls> = your past actions, <task_list>/<current_aim>/<vars> = your working state. A lane that isn't shown is empty. TIME: each line has a [+Xs] shift (seconds since session start, header has the absolute start) — the shifts, not the line order, are the authoritative timeline. Before something scrolls out of the rolling <messages_with_user> window, save it self-contained: note("<a full sentence>", key) for a durable fact, set_var for a structured value, jot("<a full sentence>") for a VOLATILE working note (appears in <scratch>, rolling — recent shown, old fade). Answer ONLY from what the lanes actually contain; if it isn't there, say so — never invent it.
</how_memory_works>
`;
}

/** reminder in CODA COMPLETO — testo storico, invariato. */
function fullTail() {
  return `\n<reminder note="read this right before you answer">If the question touches the past (what was said/done, "is this my first message?", "did we already…?", "what value did you use?"): reconstruct the timeline by sorting the entries in <messages_with_user> and <last_tool_calls> by their [+Xs] shift (oldest→newest), then answer from them. NEVER say you have no memory or that this is the first message — your history is in those lanes. The shifts are the authoritative order, not the line position. But answer ONLY from what is actually there: if something is genuinely not in the lanes, say so — do NOT invent events, names, tool results, or past requests. And if you need an action but don't see a tool for it — or a tool returned 'not found' — call find_tool('what you want to do') and use a name it returns BEFORE claiming a capability is unavailable.</reminder>`;
}

/** reminder in coda SNELLO. */
function leanTail() {
  return `\n<reminder>Question about the past? Rebuild the timeline from the [+Xs] shifts in <messages_with_user>/<last_tool_calls> and answer from them — don't claim you have no memory, and don't invent what isn't there. Need an action but see no tool? Try find_tool('what you want') first.</reminder>`;
}

/** <resources> — mappa store→accesso. Fattuale (non hand-holding) → identica per full e lean. */
function resourcesLane({ toolGating, discoverableCats }) {
  return `<resources note="where your memory lives and how to reach it — use the TOOL/LANE, do NOT parse raw DB files">
- conversation (every past message) -> get_conversation(range) tool; the recent ones are already in <messages_with_user>. [.pi/state/conversations.db]
- your own recent actions -> <last_tool_calls> lane.
- variables -> <vars> lane; read/write with get_var / set_var. [.pi/state/vars.db]
- durable facts (a name, a nickname, a preference) -> <facts> lane; save/update with note, drop with remove_note.
- decisions you recorded -> record_decision / get_decisions_by_agent.
- secrets (names + permissions only; values are sealed, you never see them) -> <secrets> lane; list_secrets.${toolGating !== "off" ? `
- need a capability you don't see a tool for? find_tool('what you want') or open_category(category). Categories: ${discoverableCats}.` : ""}
</resources>
`;
}

/**
 * @param {"full"|"lean"|"off"} level
 * @param {{toolGating: string, discoverableCats: string}} opts
 * @returns {{awareness: string, tail: string, resources: string}}
 */
export function buildMemoryScaffolding(level, { toolGating, discoverableCats } = {}) {
  if (level === "off") return { awareness: "", tail: "", resources: "" };
  if (level === "lean") {
    return { awareness: leanAwareness(), tail: leanTail(), resources: resourcesLane({ toolGating, discoverableCats }) };
  }
  // "full" (default)
  return { awareness: fullAwareness(), tail: fullTail(), resources: resourcesLane({ toolGating, discoverableCats }) };
}

// ─── REGISTRY (ADR 2026-07-05, modularità piena) ───────────────────────────────────────────────────────────────────
// L'ESTENSIONE `.pi/extensions/slm.ts` REGISTRA qui lo scaffolding al proprio load (decide full/lean/off dalla config).
// Il CORE (`context-assembly.ts`) lo LEGGE lazy PER-TURNO via getRegisteredScaffolding(). Se slm.ts NON è installato
// (modello capace) → il registry resta vuoto → il core rende un contesto PULITO (niente crutch). Questo è il confine
// estensione/core dell'ADR: la pezza è genuinamente RIMOVIBILE togliendo un file, non un flag sepolto nel core.
let _registered = null;
const EMPTY = Object.freeze({ awareness: "", tail: "", resources: "" });

/** Chiamata da slm.ts al load. @param {"full"|"lean"|"off"} level @returns lo scaffolding registrato. */
export function registerScaffolding(level, opts) {
  _registered = buildMemoryScaffolding(level, opts);
  return _registered;
}

/** Letta dal core per-turno. Registry vuoto (slm non installato) → tutto "" (contesto core pulito). */
export function getRegisteredScaffolding() {
  return _registered ?? EMPTY;
}

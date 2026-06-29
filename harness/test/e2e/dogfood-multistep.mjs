/**
 * _dogfood-multistep — test DIFFICILE: intelligenza multi-step + decisione FASE-1 che intacca FASE-3.
 * Trappola downstream: un default/backfill miope a 'EUR' rompe l'audit futuro della valuta ORIGINALE.
 * Le rules del MODO-B sono PRINCIPI GENERALI (forward-compat + conseguenze-fasi-future + dep-check),
 * NON nominano la trappola → testa la FORESIGHT applicata, non il ricordo. Legge key da harness/.env.
 */
import { VarsQueue } from "../../src/vars-queue.mjs";
import { assembleContext } from "../../src/context-assembler.mjs";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../../.env", import.meta.url), "utf8");
const KEY = (env.match(/^GEMINI_API_KEY=(.*)$/m)?.[1] ?? "").trim();
const MODEL = process.argv[2] ?? "gemini-3.1-flash-lite";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

async function ask(system, user, maxTokens = 750) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
  });
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? `[ERR] ${JSON.stringify(j).slice(0, 300)}`;
}

// MODO-B: <context> con PRINCIPI GENERALI (nessun hint sulla trappola specifica)
const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
vq.addRule("structured-thinking", "Ragiona a passi (observe/orient/plan/verify, marker [V]/[A]/[?]); risposta finale concisa.", { severity: "soft" });
vq.addRule("future-phase-impact", "Prima di una decisione di SCHEMA-DATI o irreversibile: enumera l'impatto sui REQUISITI/FASI FUTURI già noti e scegli l'opzione che NON li preclude (forward-compatibility). Esplicita i trade-off e cosa diventerebbe impossibile dopo.", { severity: "hard" });
vq.addRule("verified-vs-inferred", "Non distruggere informazione: distingui sempre un dato OSSERVATO/dichiarato da uno ASSUNTO/di-default. Un default silenzioso che rimpiazza un'informazione mancante è una perdita irreversibile di informazione.", { severity: "hard" });
vq.addRule("dep-check", "Considera i consumer a valle e i client esistenti prima di cambiare uno schema/contratto.", { severity: "hard" });
vq.addTask("T1", "decidere lo schema della FASE 1 in modo forward-compatible", {});
vq.setCurr("T1");
const ctx = assembleContext(vq);

const SCENARIO = `Sei un coding agent su un microservizio di PAGAMENTI in produzione (Postgres + API REST, 4 servizi consumer a valle).

FASE 1 — ORA: introdurre il campo \`currency\` agli importi. Oggi \`payments(id, amount_cents, created_at, ...)\` NON ha valuta: tutti gli importi sono trattati come EUR per convenzione implicita. L'API \`POST /payments\` oggi accetta \`{amount_cents}\` senza valuta.

FASE 2 — DOPO: implementerai migrazione DB + API.

FASE 3 — REQUISITO FUTURO GIÀ NOTO (~1 mese): multi-valuta con conversione e storico tassi; + COMPLIANCE/AUDIT: per OGNI transazione, incluse TUTTE quelle storiche già nel DB, si deve poter dimostrare la valuta ORIGINALE di registrazione, distinguendo i dati certi da quelli inferiti.

DOMANDA (solo FASE 1): qual è il tuo piano CONCRETO per introdurre \`currency\` ORA — schema DB di \`payments\`, gestione/backfill delle righe STORICHE, e contratto dell'API \`POST /payments\` (vecchi client inclusi)? Concretezza massima.`;

console.log(`# Test multi-step (decisione FASE-1 → impatto FASE-3) — modello: ${MODEL}\n`);
const a = await ask(null, SCENARIO);
console.log("===== (A) VANILLA =====\n" + a + "\n");
const b = await ask(ctx, SCENARIO);
console.log("===== (B) CON NOSTRO <context> =====\n" + b + "\n");

const judge = await ask(
  null,
  `Due piani di FASE-1 per lo stesso task. Il requisito FUTURO di FASE-3 impone: per OGNI riga storica si deve dimostrare la valuta ORIGINALE distinguendo dati CERTI da INFERITI.\n\n--- PIANO A ---\n${a}\n\n--- PIANO B ---\n${b}\n\nValuta RIGOROSAMENTE: per ciascun piano, il modo in cui tratta le righe STORICHE (default/backfill) PRESERVA la distinzione certo-vs-inferito richiesta da FASE-3, o la DISTRUGGE (es. default secco a 'EUR' che rende le storiche indistinguibili da EUR-verificato)? Rispondi in formato:\nPIANO A: PRESERVA | DISTRUGGE — <1 frase>\nPIANO B: PRESERVA | DISTRUGGE — <1 frase>\nVINCITORE: A|B|pari — <perché, 1 frase>`,
  300,
);
console.log("===== GIUDICE (rigoroso, scorer≠scored caveat) =====\n" + judge);

vq.close();

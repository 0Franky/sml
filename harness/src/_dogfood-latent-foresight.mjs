/**
 * _dogfood-latent-foresight — Test A (HARD, trappola NON esplicitata).
 * Variante "latent" di _dogfood-multistep: il requisito di audit FASE-3 e' RIMOSSO dal prompt.
 * Resta solo un accenno INFORMALE del fondatore ("un giorno fuori eurozona", nessun requisito formale).
 * Isola UNA variabile vs il test PARI precedente: l'esplicitazione del requisito-futuro.
 * Ipotesi: il vanilla fa un backfill secco `currency='EUR'` (distrugge la distinzione verificato-vs-inferito
 * sulle righe storiche, perdita IRREVERSIBILE); il MODO-B, con la regola verified-vs-inferred, preserva la provenance.
 * 3 trial per ridurre il rumore di sampling. Legge la key da harness/.env (gitignored, mai stampata).
 */
import { VarsQueue } from "./vars-queue.mjs";
import { assembleContext } from "./context-assembler.mjs";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const KEY = (env.match(/^GEMINI_API_KEY=(.*)$/m)?.[1] ?? "").trim();
const MODEL = process.argv[2] ?? "gemini-3.5-flash";
const TRIALS = Number(process.argv[3] ?? 3);
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

async function ask(system, user, maxTokens = 700) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
    });
    const j = await r.json();
    const c = j.choices?.[0]?.message?.content;
    if (c) return c;
    if (attempt === 0 && /503|overload|unavailable/i.test(JSON.stringify(j))) {
      await new Promise((res) => setTimeout(res, 3000));
      continue;
    }
    return `[ERR] ${JSON.stringify(j).slice(0, 300)}`;
  }
}

// MODO-B: <context> con PRINCIPI GENERALI (gli stessi del test precedente; nessun hint sulla trappola)
const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
vq.addRule("structured-thinking", "Ragiona a passi (observe/orient/plan/verify, marker [V]/[A]/[?]); risposta finale concisa.", { severity: "soft" });
vq.addRule("future-phase-impact", "Prima di una decisione di SCHEMA-DATI o irreversibile: enumera l'impatto sui REQUISITI/FASI FUTURI plausibili e scegli l'opzione che NON li preclude (forward-compatibility). Esplicita i trade-off e cosa diventerebbe impossibile dopo.", { severity: "hard" });
vq.addRule("verified-vs-inferred", "Non distruggere informazione: distingui sempre un dato OSSERVATO/dichiarato da uno ASSUNTO/di-default. Un default silenzioso che rimpiazza un'informazione mancante e' una perdita IRREVERSIBILE di informazione.", { severity: "hard" });
vq.addRule("dep-check", "Considera i consumer a valle e i client esistenti prima di cambiare uno schema/contratto.", { severity: "hard" });
vq.addTask("T1", "introdurre lo schema currency in modo forward-compatible e non distruttivo", {});
vq.setCurr("T1");
const ctx = assembleContext(vq);

// SCENARIO LATENT: nessun requisito di audit FASE-3. Solo un accenno INFORMALE, non vincolante.
const SCENARIO = `Sei un coding agent su un microservizio di PAGAMENTI in produzione (Postgres + API REST, 4 servizi consumer a valle).

TASK (FASE 1, ORA): aggiungi il campo \`currency\` agli importi. Oggi \`payments(id, amount_cents, created_at, ...)\` NON ha valuta: per convenzione implicita TUTTI gli importi sono trattati come EUR. L'API \`POST /payments\` oggi accetta \`{amount_cents}\` senza valuta.

Devi consegnare: (a) lo schema DB aggiornato di \`payments\`, (b) la strategia per le righe STORICHE gia' nel DB, (c) il contratto dell'API \`POST /payments\` (vecchi client inclusi).

Contesto di business (informale, NESSUN requisito formale, NESSUNA compliance richiesta): in una call il fondatore ha buttato li' che "un giorno forse venderemo anche fuori dall'eurozona", ma non c'e' niente di pianificato e nessuno ti ha chiesto nulla di multi-valuta.

Concretezza massima: DDL, strategia di backfill delle storiche, contratto API.`;

const JUDGE = (a, b) =>
  `Due piani di FASE-1 per lo stesso task: aggiungere \`currency\` a una tabella \`payments\` dove le righe storiche sono EUR SOLO per convenzione implicita (mai verificato esplicitamente).

Criterio UNICO e RIGOROSO: il modo in cui il piano tratta le righe STORICHE PRESERVA o DISTRUGGE la distinzione tra "EUR certo/verificato" e "EUR solo-assunto"?
- DISTRUGGE = backfill secco (es. \`SET currency='EUR'\` / \`DEFAULT 'EUR' NOT NULL\` applicato alle storiche) che rende le righe storiche INDISTINGUIBILI da un EUR verificato. Perdita irreversibile.
- PRESERVA = registra la provenance (es. colonna currency_source assumed/explicit, oppure currency NULL+flag, oppure tabella di audit) cosi' che resti SEMPRE distinguibile cosa era certo da cosa era assunto.

NON premiare la lunghezza o l'eleganza, SOLO questo criterio.

--- PIANO A ---
${a}

--- PIANO B ---
${b}

Rispondi ESATTAMENTE:
PIANO A: PRESERVA | DISTRUGGE — <1 frase>
PIANO B: PRESERVA | DISTRUGGE — <1 frase>
VINCITORE: A | B | pari — <perche', 1 frase>`;

console.log(`# Test A (foresight LATENTE: trappola FASE-3 NON esplicitata) — modello: ${MODEL} — ${TRIALS} trial\n`);
for (let t = 1; t <= TRIALS; t++) {
  console.log(`\n========================= TRIAL ${t}/${TRIALS} =========================`);
  const a = await ask(null, SCENARIO);
  console.log("\n----- (A) VANILLA -----\n" + a);
  const b = await ask(ctx, SCENARIO);
  console.log("\n----- (B) CON NOSTRO <context> -----\n" + b);
  const judge = await ask(null, JUDGE(a, b), 250);
  console.log("\n----- GIUDICE (scorer != scored caveat) -----\n" + judge);
}
vq.close();

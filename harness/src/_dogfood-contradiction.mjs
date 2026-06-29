/**
 * _dogfood-contradiction — Test B (caso REALE/discusso: nostro research-gap, project_research_gaps).
 * Gap #1 (structured update injection) + #2 (contradiction-detection layer): una DECISIONE di FASE-1
 * (dedup per `email`, assunzione "1 email univoca per utente") che un requisito SUCCESSIVO (SSO multi-email,
 * 1 user_id con piu' email) CONTRADDICE silenziosamente. Il nuovo requisito NON dice "rivedi la dedup":
 * il modello deve ACCORGERSI da solo che il lavoro di FASE-1 si rompe.
 *
 * Equita': ENTRAMBE le condizioni ricevono gli STESSI fatti (D1 + assunzione + nuovo requisito SSO).
 * L'unica differenza e' il METODO harness: il MODO-B presenta D1 come DECISIONE strutturata nel <context>
 * (recent_changes/vars) + una regola `contradiction-check`; il vanilla li riceve come prosa. Isola il
 * valore del nostro datastore-decisioni + layer-contraddizioni vs prompt grezzo.
 * Ipotesi: il MODO-B segnala il conflitto con la dedup e riconcilia; il vanilla implementa SSO e basta,
 * lasciando la pipeline di dedup silenziosamente rotta.
 * 3 trial. Legge la key da harness/.env (gitignored, mai stampata).
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

// La storia condivisa (gli stessi FATTI in entrambe le condizioni)
const D1_TEXT = "DECISIONE D1 (FASE-1, gia' implementata): la pipeline di ingest deduplica i record utente usando `email` come chiave. ASSUNZIONE DICHIARATA su cui poggia D1: ogni persona ha una sola email, univoca per utente.";
const NEW_REQ = `NUOVO REQUISITO (FASE-3, ORA): aggiungi il supporto SSO. Con SSO un utente puo' collegare PIU' email al proprio account (es. una di lavoro e una personale), ma resta un solo \`user_id\`. Implementa il collegamento degli account (account linking): endpoint, schema, e flusso di login.`;

// MODO-B: <context> con D1 registrata come DECISIONE strutturata + regola contradiction-check
const vq = new VarsQueue(":memory:", { agent: "orchestrator" });
vq.addRule("contradiction-check", "PRIMA di applicare un nuovo fatto/requisito: confrontalo con le DECISIONI e ASSUNZIONI gia' prese (vedi vars/recent_changes). Se il nuovo input INVALIDA un'assunzione precedente, FERMATI, segnala esplicitamente il conflitto e riconcilia il lavoro a valle. NON applicare il nuovo requisito in isolamento.", { severity: "hard" });
vq.addRule("structured-thinking", "Ragiona a passi (observe/orient/plan/verify); risposta finale concisa.", { severity: "soft" });
vq.setVar("D1_dedup", D1_TEXT);
vq.addTask("T_SSO", "implementare account-linking SSO", {});
vq.setCurr("T_SSO");
const ctx = assembleContext(vq);

// VANILLA: stessi fatti, ma come prosa (D1 incluso → NON e' un test di memoria, e' di rilevamento-conflitto)
const VANILLA_PROMPT = `Sei un coding agent su un backend con una pipeline di ingest dati utenti.

${D1_TEXT}

${NEW_REQ}

Dammi il piano concreto (schema, endpoint, flusso).`;

// MODO-B: il nuovo requisito arriva, D1 e' nel <context> strutturato
const B_PROMPT = `Sei un coding agent su un backend con una pipeline di ingest dati utenti.

${NEW_REQ}

Dammi il piano concreto (schema, endpoint, flusso).`;

const JUDGE = (a, b) =>
  `Contesto: una pipeline deduplica gli utenti per \`email\`, sull'assunzione "1 email univoca per utente" (DECISIONE D1). Ora arriva SSO: un utente puo' avere PIU' email ma un solo user_id. Questo CONTRADDICE l'assunzione di D1: la dedup-per-email ora spaccherebbe lo stesso utente in piu' record (o ne fonderebbe di sbagliati). Il requisito SSO NON dice esplicitamente "rivedi la dedup".

Criterio UNICO e RIGOROSO: il piano RILEVA che SSO invalida la dedup-per-email di D1 e lo riconcilia (es. dedup per user_id, o segnala il conflitto), oppure implementa solo l'account-linking SSO LASCIANDO la dedup rotta/non menzionata?
- RILEVA = nomina esplicitamente il conflitto con la dedup-per-email e propone la riconciliazione.
- MANCA = implementa SSO senza accorgersi che rompe la dedup esistente.

--- PIANO A ---
${a}

--- PIANO B ---
${b}

Rispondi ESATTAMENTE:
PIANO A: RILEVA | MANCA — <1 frase>
PIANO B: RILEVA | MANCA — <1 frase>
VINCITORE: A | B | pari — <perche', 1 frase>`;

console.log(`# Test B (contradiction-detection, caso reale research-gap) — modello: ${MODEL} — ${TRIALS} trial\n`);
for (let t = 1; t <= TRIALS; t++) {
  console.log(`\n========================= TRIAL ${t}/${TRIALS} =========================`);
  const a = await ask(null, VANILLA_PROMPT);
  console.log("\n----- (A) VANILLA (D1 in prosa) -----\n" + a);
  const b = await ask(ctx, B_PROMPT);
  console.log("\n----- (B) CON NOSTRO <context> (D1 strutturata + contradiction-check) -----\n" + b);
  const judge = await ask(null, JUDGE(a, b), 250);
  console.log("\n----- GIUDICE (scorer != scored caveat) -----\n" + judge);
}
vq.close();

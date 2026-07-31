#!/usr/bin/env node
// check-stale-pending.mjs — un'attesa SENZA DATA e' un'attesa che nessuno puo' piu' valutare.
//
// PERCHE' ESISTE (2026-07-31, utente TG msg 2015): «le decisioni che prendiamo salvale
// immediatamente e tieni aggiornata la documentazione ... sennò non mi fa rifare ogni volta
// le stesse cose, poi impazzisco, perdo il filo e mi incazzo».
// Sweep dello stesso giorno: `lab-plan-base-model-metro.md` diceva «attende approvazione» e
// «niente qui e' stato eseguito» mentre era stato APPROVATO ed ESEGUITO (contraddiceva il
// proprio §ESITO); l'ADR training-from-scratch era `awaiting-user` da 71 GIORNI a decisione
// gia' presa; compute-access da 33 giorni senza dire quale scelta.
// Il denominatore comune non e' la dimenticanza: e' che UN'ATTESA SENZA DATA NON INVECCHIA MAI.
// Con la data, «attende dal 21/05» si legge da solo come un bug. Senza, sembra fresca per sempre.
//
// COSA FA: se una RIGA dichiara un'attesa-dell'utente e non porta una data ISO (YYYY-MM-DD)
// sulla stessa riga, esce 1 con file:riga. Niente altro.
//
// ================= QUELLO CHE QUESTO CONTROLLO **NON** FA (dichiarato, non implicito) =========
//  - NON verifica che la data sia VERA ne' che l'attesa sia ancora reale: una riga datata
//    2026-05-21 e ormai risolta passa. Il controllo rende l'anzianita' VISIBILE, non la giudica.
//  - NON trova le attese scritte in altre parole ("mi serve un tuo parere", "fammi sapere"):
//    e' un check LESSICALE su marcatori noti, ed e' un limite reale (#24 — la semantica non
//    si meccanizza). Copre i marcatori che usiamo davvero, non l'insieme dei modi di dirlo.
//  - Riconosce come CITAZIONE solo `backtick` e «guillemet», NON le virgolette dritte "cosi'".
//    E' una scelta, non una svista: appaiare le virgolette dritte e' fragile (una virgoletta
//    spaiata nella riga fa saltare il conteggio) e l'errore che ne uscirebbe sarebbe una
//    MANCATA segnalazione — molto peggio di un falso positivo. Chi cita usi la convenzione
//    del repo. Costo reale, misurato: la prima voce di log di questo stesso lavoro e' stata
//    bloccata da questa regola, ed era giusto cosi'.
//  - NON guarda dentro `wiki/_private/` (materiale RAW immutabile: le attese citate li' sono
//    citazioni, non stati) ne' fuori da `wiki/`.
//  - NON sa se una decisione e' stata ratificata: quello resta #26 (provenienza citabile).
// ============================================================================================

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const WIKI = join(ROOT, "wiki");
const SKIP_DIRS = new Set(["_private", "node_modules", ".git"]);

// Marcatori che significano "sto aspettando l'UTENTE". Volutamente STRETTI:
// "awaiting completion" (citazione dell'API di pi) NON deve entrare.
const MARCATORI = [
  /attende\s+(?:l['’]\s*)?utente/i,
  /attende\s+(?:un\s+)?ok\b/i,
  /attende\s+(?:la\s+)?(?:tua\s+)?(?:approvazione|ratifica|scelta|decisione|risposta)/i,
  /in\s+attesa\s+(?:di|del)\s+(?:te|Fra|utente|una\s+tua)/i,
  /awaiting[-\s]user/i,
  /awaiting\s+(?:scelta|decisioni|decisione|ok|approvazione)/i,
];

// Il marcatore 🗳️ e' trattato a parte, e SOLO in prima posizione. Ragione: la nostra convenzione
// dice «🗳️ come PRIMO CARATTERE», quindi un 🗳️ a meta' riga sta PARLANDO del marcatore, non lo
// sta usando (index.md descrive la convenzione, agent-constitution la insegna). Applicare la
// convenzione al controllo elimina quei falsi positivi senza inventare un'euristica.
const VOTO = /^\s*(?:[>#\-*+]|\[[ x]\]|\d+\.)*\s*\u{1F5F3}/u;

// Un marcatore dentro `backtick` o dentro «virgolette» e' CITATO, non dichiarato: il fix-ledger
// che scrive «⏳ attende UTENTE e' lo stato piu' costoso» sta insegnando la lezione, non aspettando.
function soloCitato(riga, re) {
  const m = riga.match(re);
  if (!m) return false;
  const i = m.index;
  const prima = riga.slice(0, i);
  const conta = (s, c) => (s.match(c) || []).length;
  if (conta(prima, /`/g) % 2 === 1) return true; // dentro backtick non chiuso
  if (conta(prima, /«/g) > conta(prima, /»/g)) return true; // dentro «...»
  return false;
}

const DATA_ISO = /\b20\d{2}-\d{2}-\d{2}\b/;

// Una riga e' esente se dichiara sulla riga stessa che l'attesa e' CHIUSA, o se e' barrata.
const CHIUSA = /~~|\bCHIUS[OA]\b|\bRATIFICAT[OA]\b|\bRISOLT[OA]\b|\bnessuna decisione (?:pendente|bloccante)\b/i;

function* mdFiles(dir) {
  for (const nome of readdirSync(dir)) {
    if (SKIP_DIRS.has(nome)) continue;
    const p = join(dir, nome);
    const st = statSync(p);
    if (st.isDirectory()) yield* mdFiles(p);
    else if (nome.endsWith(".md")) yield p;
  }
}

const colpevoli = [];
let righeViste = 0;
let fileVisti = 0;

for (const file of mdFiles(WIKI)) {
  fileVisti++;
  // split su \n e strip del \r: i file sono CRLF e il \r finale non deve entrare nel match
  const righe = readFileSync(file, "utf8").split("\n");
  righe.forEach((rigaRaw, i) => {
    const riga = rigaRaw.replace(/\r$/, "");
    righeViste++;
    const testuale = MARCATORI.find((re) => re.test(riga) && !soloCitato(riga, re));
    const voto = VOTO.test(riga);
    if (!testuale && !voto) return;
    if (DATA_ISO.test(riga)) return; // ha una data: invecchia da sola, passa
    if (CHIUSA.test(riga)) return; // dichiarata chiusa sulla riga stessa
    colpevoli.push({
      file: relative(ROOT, file).split(sep).join("/"),
      riga: i + 1,
      testo: riga.trim().slice(0, 160),
    });
  });
}

console.log(`[stale-pending] ${fileVisti} file, ${righeViste} righe esaminate sotto wiki/ (escluso _private/)`);

// ---- RATCHET -------------------------------------------------------------------------------
// Il primo giro ha trovato 46 attese senza data, tutte PREESISTENTI. Renderlo bloccante subito
// avrebbe rotto ogni commit finche' non erano bonificate tutte — cioe' il controllo sarebbe
// stato disattivato entro un'ora, che e' il modo tipico in cui questi check muoiono.
// Quindi: il debito NOTO e' congelato in un baseline; il controllo blocca solo il debito NUOVO.
// La chiave e' file + testo (NON il numero di riga, che si sposta a ogni modifica).
// `--baseline` riscrive il file: usarlo SOLO dopo aver guardato cosa si sta congelando.
const BASELINE = join(ROOT, "harness", "tools", "stale-pending-baseline.json");
const chiave = (c) => `${c.file}::${c.testo.slice(0, 90)}`;

if (process.argv.includes("--baseline")) {
  const dati = { generato: new Date().toISOString().slice(0, 10), voci: colpevoli.map(chiave).sort() };
  writeFileSync(BASELINE, JSON.stringify(dati, null, 2) + "\n", "utf8");
  console.log(`[stale-pending] baseline riscritto: ${dati.voci.length} attese congelate.`);
  process.exit(0);
}

let noto = new Set();
let generato = "mai";
try {
  const b = JSON.parse(readFileSync(BASELINE, "utf8"));
  noto = new Set(b.voci);
  generato = b.generato;
} catch {
  /* nessun baseline: tutto e' nuovo */
}

const nuovi = colpevoli.filter((c) => !noto.has(chiave(c)));
const residuo = colpevoli.length - nuovi.length;

if (nuovi.length === 0) {
  console.log(
    `[stale-pending] OK — nessuna attesa NUOVA senza data. ` +
      `Debito congelato: ${residuo} voci (baseline del ${generato}).`
  );
  if (residuo > 0) {
    console.log(`[stale-pending] NOTA: quelle ${residuo} restano da bonificare — vedi wiki/todo.md.`);
  }
  process.exit(0);
}

console.error(`\n[stale-pending] FAIL — ${nuovi.length} attese NUOVE senza data (debito noto: ${residuo}):\n`);
for (const c of nuovi) console.error(`  ${c.file}:${c.riga}\n    ${c.testo}\n`);
console.error(
  "Un'attesa senza data non si sa piu' di quando sia, e continua a sembrare fresca per sempre.\n" +
    "Aggiungi sulla stessa riga la data in cui l'attesa e' NATA (YYYY-MM-DD), oppure chiudila\n" +
    "dichiarandolo sulla riga (CHIUSO / RATIFICATO / ~~barrato~~).\n"
);
process.exit(1);

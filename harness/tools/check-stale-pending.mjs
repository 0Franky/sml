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

// ---- PASSO 2: INTESTAZIONI STANTIE (aggiunto 2026-08-17) -------------------------------------
// PERCHE' ESISTE: il passo 1 guarda le RIGHE, e non poteva vedere questo. Il 2026-08-17 ho
// consegnato all'utente un elenco di "cose ferme da settimane" e DUE VOCI SU QUATTRO erano gia'
// chiuse: l'intestazione della sezione diceva ancora "ATTENDE DECISIONE UTENTE" mentre il corpo
// sotto portava "✅ DECISO" e la voce-utente barrata come "superata".
//   → **le intestazioni invecchiano indipendentemente dal contenuto.**
// Non e' un difetto estetico: un tracker che dichiara attese FALSE fa rifare il lavoro all'utente,
// che e' esattamente il danno che wiki/REQUISITO-AFFIDABILITA.md esiste per impedire. Una lista
// sbagliata e' peggio di nessuna lista, perche' viene creduta.
//
// NON BLOCCANTE di proposito: un titolo puo' legittimamente restare aperto mentre un suo
// sotto-punto si chiude, quindi qui il falso positivo e' strutturale e va LETTO da un umano, non
// imposto. Renderlo bloccante lo farebbe disattivare entro un'ora — lo stesso modo in cui muoiono
// questi check, gia' documentato nel commento del RATCHET qui sotto.
const RISOLTO_NEL_CORPO = /✅|\bDECIS[OA]\b|\bFATT[OA]\b|\bsuperat[ao]\b|\bCHIUS[OA]\b|\bRATIFICAT[OA]\b|\bRISOLT[OA]\b/;
const intestazioniStantie = [];

for (const file of mdFiles(WIKI)) {
  const righe = readFileSync(file, "utf8").split("\n").map((r) => r.replace(/\r$/, ""));
  righe.forEach((riga, i) => {
    const h = riga.match(/^(#{2,4})\s+(.*)$/);
    if (!h) return;
    const dichiaraAttesa = MARCATORI.some((re) => re.test(riga) && !soloCitato(riga, re));
    if (!dichiaraAttesa) return;
    if (RISOLTO_NEL_CORPO.test(riga)) return; // l'intestazione stessa si dichiara chiusa

    // corpo = fino alla prossima intestazione di livello uguale o superiore
    const livello = h[1].length;
    let fine = righe.length;
    for (let j = i + 1; j < righe.length; j++) {
      const hh = righe[j].match(/^(#{1,6})\s+/);
      if (hh && hh[1].length <= livello) { fine = j; break; }
    }
    const corpo = righe.slice(i + 1, fine).join("\n");
    if (RISOLTO_NEL_CORPO.test(corpo)) {
      intestazioniStantie.push({
        file: relative(ROOT, file).split(sep).join("/"),
        riga: i + 1,
        testo: riga.trim().slice(0, 140),
      });
    }
  });
}

if (intestazioniStantie.length) {
  console.log(
    `[stale-pending] ⚠️ INFO — ${intestazioniStantie.length} intestazioni dichiarano un'attesa MA il corpo contiene una risoluzione.\n` +
    `             Da leggere a mano: il titolo puo' essere rimasto indietro (2 casi reali il 2026-08-17,\n` +
    `             riportati all'utente come "fermi da settimane" quando erano chiusi). NON bloccante.`
  );
  for (const c of intestazioniStantie) console.log(`             ${c.file}:${c.riga}  ${c.testo}`);
}

// ---- PASSO 3: COERENZA DEI TAG DI STATO (2026-08-17) -----------------------------------------
// Regola: cc-wiki-core `memory/rules/documentation/state-tag-in-the-title` (idea di Fra).
// ⚠️ NON si controlla la PRESENZA del tag, e la scelta e' deliberata: "questo documento ha uno
// stato?" NON e' decidibile da una macchina — una pagina di concetto non e' ne' aperta ne' chiusa,
// e obbligarla a un tag produce tag finti, cioe' l'inflazione che la regola stessa vieta. Un check
// che urla su meta' dei file viene spento in un'ora.
// Si controlla invece la COERENZA, che e' decidibile ed e' dove vive il difetto reale:
//   (a) se un tag c'e', deve stare in TESTA al titolo (se e' in mezzo, una ricerca non lo vede
//       come stato — che e' l'unico motivo per cui il tag esiste);
//   (b) due tag DIVERSI nello stesso titolo = il titolo contraddice se stesso;
//   (c) il tag contraddice il campo `status:` del frontmatter = due sorgenti che divergono.
const TAG_STATO = { "✅": "chiuso", "🔴": "aperto", "🟡": "in-corso", "⏳": "attende", "⛔": "proposta", "🗄️": "archiviato" };
const TAGS = Object.keys(TAG_STATO);
// status: → stato atteso. Ordine significativo: la prima che matcha vince.
const STATUS_A_STATO = [
  [/\bPROPOSTA\b/i, "proposta"],
  [/\bRATIFICAT|DECIS[AO]|CHIUS[AO]|RISOLT[AO]\b/i, "chiuso"],
  [/\battende|in attesa\b/i, "attende"],
  [/\bARCHIVIAT[AO]\b/i, "archiviato"],
  [/\bin corso\b/i, "in-corso"],
];
const tagIncoerenti = [];

for (const file of mdFiles(WIKI)) {
  const testo = readFileSync(file, "utf8");
  const righe = testo.split("\n").map((r) => r.replace(/\r$/, ""));
  const rel = relative(ROOT, file).split(sep).join("/");

  // status: del frontmatter (solo se dentro il blocco --- iniziale)
  let statusAtteso = null;
  if (righe[0] === "---") {
    for (let i = 1; i < righe.length && righe[i] !== "---"; i++) {
      const m = righe[i].match(/^status:\s*(.+)$/);
      if (!m) continue;
      const hit = STATUS_A_STATO.find(([re]) => re.test(m[1]));
      if (hit) statusAtteso = hit[1];
      break;
    }
  }

  righe.forEach((riga, i) => {
    const h = riga.match(/^(#{1,4})\s+(.*)$/);
    if (!h) return;
    const titolo = h[2];
    const presenti = [...new Set(TAGS.filter((t) => titolo.includes(t)))];
    if (!presenti.length) return; // niente tag: non e' un errore (vedi sopra)

    if (presenti.length > 1) {
      // COMPOSTO LEGITTIMO: due stati ADIACENTI separati da "/" (es. "✅/⏳" = fatto in parte,
      // in parte in attesa). E' un idioma gia' in uso e porta informazione VERA che forzare a un
      // solo stato distruggerebbe; resta perfettamente cercabile perche' matcha entrambi.
      // ⚠️ Falso positivo trovato aprendo un campione PRIMA di riportare il numero: la prima
      // versione di questo check lo segnalava, ed e' esattamente il rumore che fa disattivare
      // un controllo. Si segnalano solo i tag SPARSI nel titolo, non i composti.
      const composto = new RegExp(`(?:${TAGS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*/\\s*(?:${TAGS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`);
      if (!composto.test(titolo)) {
        tagIncoerenti.push({ file: rel, riga: i + 1, perche: `titolo con ${presenti.length} stati SPARSI (${presenti.join(" ")}) — se e' un composto, scrivilo come "${presenti[0]}/${presenti[1]}"` });
      }
      return;
    }
    const tag = presenti[0];
    // (a) posizione: deve aprire il titolo (eventuale grassetto/quote prima e' tollerato)
    if (!/^\s*(?:[*_>`]+\s*)?/.test(titolo.slice(0, titolo.indexOf(tag))) || titolo.indexOf(tag) > 3) {
      tagIncoerenti.push({ file: rel, riga: i + 1, perche: `tag ${tag} non in testa al titolo (una ricerca non lo legge come stato)` });
      return;
    }
    // (c) coerenza col frontmatter, solo per il titolo H1
    if (h[1].length === 1 && statusAtteso && TAG_STATO[tag] !== statusAtteso) {
      tagIncoerenti.push({ file: rel, riga: i + 1, perche: `titolo dice "${TAG_STATO[tag]}" ma il frontmatter status dice "${statusAtteso}"` });
    }
  });
}

if (tagIncoerenti.length) {
  console.log(`[stale-pending] ⚠️ INFO — ${tagIncoerenti.length} tag di stato incoerenti (posizione / doppi / vs frontmatter). NON bloccante.`);
  for (const c of tagIncoerenti) console.log(`             ${c.file}:${c.riga}  ${c.perche}`);
}

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

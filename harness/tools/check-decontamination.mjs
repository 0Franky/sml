#!/usr/bin/env node
/**
 * check-decontamination — una classe dichiara qualcosa HELD-OUT, e poi il suo stesso
 * §Label-generation prescrive al generatore di emetterlo. Train-on-test per costruzione (#18).
 *
 * IL DIFETTO CHE CATTURA, e come e' stato trovato (2026-07-26, `class-compositional-reversibility`).
 * Il §Decontaminazione dichiarava held-out due scenari canonici — *"il generatore **non deve
 * emetterli**"* — e li chiamava *"la **metrica di successo** della classe"*. Nello stesso file:
 *  - il §Label-generation istruiva il generatore a costruire **esattamente** la macchina del primo
 *    (*"il `backup job` c'e' in entrambe le varianti; in una la **retention** lo fa ruotare"*);
 *  - l'MCQ-controfattuale usava la **fixture verbatim** di quello scenario (*"retention = 1 snapshot"*);
 *  - la nota anti-overfit diceva *"non «backup job = trappola»"*, che **presuppone** quel token nel training;
 *  - un **negativo di training** conteneva la **sostanza del gold** del secondo scenario.
 * Conseguenza: la validazione avrebbe misurato **RECALL**, non transfer — cioe' l'opposto esatto di
 * cio' che quella sezione dichiara di misurare. Nessuno se n'era accorto per tre giri di review,
 * perche' e' un'incoerenza **fra due sezioni distanti** dello stesso documento: leggendole una alla
 * volta sono entrambe sensate.
 *
 * ⚠️ PERCHE' `check-anchors` NON LO VEDE, ed e' il punto: quel tool verifica che le **citazioni**
 * puntino dove dicono. Qui non c'e' nessuna citazione rotta — c'e' un documento che **contraddice
 * se stesso**. Verde reale, su un altro asse (#0: cio' che il tool controlla non discrimina questa
 * domanda). Un secondo tool era l'unica via.
 *
 * COME FUNZIONA — serve una dichiarazione MACCHINA-LEGGIBILE, non prosa (#24: la prosa la capisce
 * il modello, non una regex). La classe dichiara i token della **superficie** tenuta fuori:
 *
 *     ```held-out
 *     backup job
 *     retention
 *     ```
 *
 * e il tool verifica che **nessuno** compaia nelle sezioni che PRESCRIVONO IL TRAINING
 * (§Label-generation · §Hack-check · §Esempi NEGATIVI). Le sezioni §Esempi POSITIVI e
 * §Decontaminazione sono **escluse per costruzione**: e' li' che gli scenari held-out sono
 * *definiti*, e trovarli li' e' corretto, non un difetto.
 *
 * ⚠️ COSA NON VERIFICA (dichiarato, non taciuto — #0)
 *  - **la SOSTANZA**: se il gold held-out e' parafrasato con altre parole dentro un negativo, il tool
 *    non se ne accorge. E' comprensione del linguaggio, non pattern-matching (#24) → resta compito
 *    del modello e della review. Il tool copre il caso **letterale**, che e' quello che si ripete.
 *  - **se i token dichiarati sono quelli giusti**: una classe che dichiara un blocco `held-out` vuoto
 *    o irrilevante passa. Il tool verifica la COERENZA della dichiarazione, non la sua qualita'.
 *  - le classi **senza** blocco `held-out`: sono contate e mostrate, non fatte fallire — molte non
 *    hanno un held-out per costruzione (§Decontaminazione dichiara *"nessuna istanza osservata"*).
 *
 * USO
 *   node harness/tools/check-decontamination.mjs            # tutta wiki/training-taxonomy
 *   node harness/tools/check-decontamination.mjs --json
 *   exit 0 = nessuna contaminazione · exit 1 = token held-out dentro una sezione di training
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const TAX = `${ROOT}/wiki/training-taxonomy`;

// ⚠️ I pattern NON sono ancorati al `#`: la stessa sezione compare come heading (`## Hack-check`)
//    **e** come riga in grassetto (`**Hack-check (OBBLIGATORIO…)**:`). Ancorandoli all'heading il
//    tool mancava proprio la riga che il finding citava — misurato, non ipotizzato. Il rischio di
//    over-match e' chiuso a monte: questi pattern si applicano SOLO a righe gia' riconosciute come
//    marcatori di sezione, mai alla prosa.
/** Sezioni che PRESCRIVONO cosa finisce nel training: li' un token held-out e' contaminazione. */
const SEZIONI_TRAINING = [
  /label-?gen/i,
  /hack-?check/i,
  /esempi\s+negativi/i,
];
/** Sezioni dove i token held-out DEVONO comparire (e' dove sono definiti): mai un difetto. */
const SEZIONI_ESENTI = [
  /esempi\s+positivi/i,
  /decontaminazione/i,
];

const files = readdirSync(TAX).filter((f) => f.endsWith(".md"));
const problemi = [];
const senzaBlocco = [];
let conBlocco = 0, tokenTotali = 0;

for (const f of files) {
  const src = readFileSync(`${TAX}/${f}`, "utf8");

  // 1) il blocco macchina-leggibile
  const m = src.match(/```held-out\r?\n([\s\S]*?)```/i);
  if (!m) { senzaBlocco.push(f); continue; }
  const tokens = m[1].split(/\r?\n/).map((t) => t.trim())
    .filter((t) => t && !t.startsWith("#"));
  if (!tokens.length) { senzaBlocco.push(f); continue; }
  conBlocco++; tokenTotali += tokens.length;

  // 2) segmentazione in sezioni, e classificazione di ciascuna.
  //
  // ⚠️ UNA SEZIONE NON E' SEMPRE UN HEADING, e la prima versione di questo tool lo assumeva.
  //    Nel corpus la stessa sezione compare in TRE forme — `## Hack-check`, `**Hack-check**:` e
  //    `- **Hack-check (OBBLIGATORIO)**:` — e guardando i soli heading il tool **mancava** una delle
  //    contaminazioni reali che stava cercando (l'hack-check di `compositional-reversibility`, dove
  //    il token held-out compare in prosa). Trovato **confrontando l'esito col finding**, non
  //    ragionando: il tool trovava 5 occorrenze dove ne erano attese 6, e la differenza era il
  //    perimetro. E' lo stesso difetto che il corpus chiama *copertura dello strumento*.
  // Regola adottata: una sezione inizia a un **heading** oppure a una **riga-marcatore in grassetto**
  // (`**Nome…**:` a inizio riga, con o senza bullet), e finisce al marcatore successivo o a un `---`.
  const righe = src.replace(/\r\n/g, "\n").split("\n");
  // ⚠️ SEZIONE ≠ VOCE DI ELENCO, e confonderle rompe il tool nel verso opposto — misurato:
  //    trattando ogni `- **Nome**:` come confine, le occorrenze trovate sono scese da 5 a 1, perche'
  //    ogni bullet dentro §Label-generation azzerava il contesto. Un marcatore di sezione e' un
  //    heading, oppure una riga in grassetto **NON puntata** (`**Hack-check…**:` a inizio riga).
  const marcatoreSezione = (r) => /^#{1,6}\s/.test(r) || /^\*\*[^*]+\*\*\s*:/.test(r);
  let inTraining = false;
  righe.forEach((riga, i) => {
    if (/^\s*---\s*$/.test(riga)) { inTraining = false; return; }
    if (marcatoreSezione(riga)) {
      if (SEZIONI_ESENTI.some((re) => re.test(riga))) inTraining = false;
      else inTraining = SEZIONI_TRAINING.some((re) => re.test(riga));
    }
    // ⚠️ Il caso `- **Hack-check (OBBLIGATORIO)**: …` esiste nel corpus come VOCE SINGOLA: li' il
    //    contenuto sta sulla riga stessa, quindi la riga si ispeziona comunque, senza aprire sezione.
    //    Deve pero' essere un MARCATORE puntato, non una riga che *nomina* una sezione: la prima
    //    versione bastava che la riga contenesse "Label-gen" e cosi' ha segnalato come contaminata
    //    **la prosa che spiegava il difetto** — falso positivo prodotto dal tool su se' stesso.
    const m2 = riga.match(/^\s*[-*]\s+\*\*([^*]+)\*\*\s*:/);
    const rigaAutoPortante = !!m2 && SEZIONI_TRAINING.some((re) => re.test(m2[1]));
    if (!inTraining && !rigaAutoPortante) return;
    for (const t of tokens) {
      if (riga.toLowerCase().includes(t.toLowerCase())) {
        problemi.push({ file: f, riga: i + 1, token: t, testo: riga.trim().slice(0, 130) });
      }
    }
  });
}

const asJson = process.argv.includes("--json");
if (asJson) {
  console.log(JSON.stringify({ stats: { files: files.length, conBlocco, tokenTotali, problemi: problemi.length, senzaBlocco: senzaBlocco.length }, problemi }, null, 2));
} else {
  if (problemi.length) {
    console.log(`\n🔴 CONTAMINAZIONE — ${problemi.length} occorrenze di token HELD-OUT dentro sezioni che prescrivono il TRAINING`);
    console.log(`   Se il generatore emette lo scenario tenuto fuori, la validazione misura RECALL, non transfer (#18).`);
    for (const p of problemi) {
      console.log(`   ${p.file}:${p.riga}  token «${p.token}»`);
      console.log(`      ${p.testo}`);
    }
  }
  console.log(`\n${files.length} file · ${conBlocco} con blocco \`held-out\` (${tokenTotali} token) · ` +
    `${problemi.length} contaminazioni · ${senzaBlocco.length} senza blocco (non giudicate)`);
  console.log(problemi.length
    ? `❌ ${problemi.length} DA SISTEMARE — o si toglie il token dal training, o non e' davvero held-out.`
    : `✅ nessun token held-out compare in una sezione di training` +
      (senzaBlocco.length ? `  —  ${senzaBlocco.length} file senza dichiarazione, fuori portata` : ""));
}

process.exit(problemi.length ? 1 : 0);

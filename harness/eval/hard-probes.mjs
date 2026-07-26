/**
 * hard-probes — il probe-set DISCRIMINANTE del bake-off base-model (utente TG msg 1991:
 * *«crea i laboratori corretti e con la giusta difficoltà … rendili cognitivamente complessi
 * secondo il tuo e i giudizi già prodotti … fai test per dati REALMENTE concreti»*).
 *
 * ⚠️ PERCHE' NON BASTAVA `base-probes.mjs`. Quel set ha dato **13/13 a TUTTI e quattro** i candidati
 * (bake-off 1° giro, 2026-07-08). Un pareggio a quattro **non porta informazione**: il floor ha gia'
 * fatto il suo lavoro — *«tutti sono adeguati a operare il sistema»* — ed e' **esaurito come
 * strumento di SCELTA**. Il criterio di successo di QUESTO set non e' che i modelli passino:
 * ⭐ **e' che li SEPARI**. Se restano appaiati, il set e' ancora troppo facile — si alza, non si
 * conclude *«sono equivalenti»*.
 *
 * IL PRINCIPIO DI COSTRUZIONE — ogni probe ha **due** risposte:
 *   - la **DERIVABILE**, che richiede di fare un passo di ragionamento non ovvio;
 *   - la **PLAUSIBILE-MA-SBAGLIATA** (`trap`), che e' cio' che produce chi legge la superficie.
 * Il grader deterministico estrae l'**ULTIMO intero** (robusto a "mostra i passaggi") e confronta con
 * `expectNumber`. La `trap` **non e' gradata**: e' registrata perche' *sapere COME sbagliano vale
 * quanto sapere SE sbagliano* — un modello che cade sempre nella trap e' diverso da uno che spara a caso.
 *
 * L'IDENTITA' MISURATA e' quella dichiarata del Tier-1 (`project_base_model_intelligence`):
 * **analisi del problema e decomposizione**, NON coding. Per questo nessuna probe qui chiede di
 * scrivere codice: chiedono di **capire cosa e' stato chiesto davvero**.
 *
 * ⭐ LE PROBE SONO DERIVATE DAI NOSTRI ERRORI REALI (i «giudizi gia' prodotti»): ogni voce porta
 * l'origine. Non sono indovinelli: sono le forme in cui **noi** abbiamo sbagliato, astratte.
 *
 * ⚠️ LIMITI, dichiarati invece che scoperti dopo (#0):
 *  - **n=1 per modello non discrimina**: servono >=3 ripetizioni e la **dispersione** riportata, non
 *    la media secca (lezione misurata oggi: una dispersione di 7.7 conteneva un divario di 2.8).
 *  - **Il grader e' meccanico**: prende il numero finale. Una risposta giusta per la ragione
 *    sbagliata passa. Per il *perche'* serve leggere le risposte — il tool affianca la review, non
 *    la sostituisce (F27).
 *  - **Nessuna probe qui e' non-numerica** tranne dove marcato: il polo *«non e' determinabile»* e'
 *    volutamente incluso perche' e' l'anti-confabulazione, ma e' gradato su token, non su numero.
 */

/** @typedef {{ id:string, category:string, prompt:string, expectNumber?:number, trap?:number,
 *              mustContainAny?:RegExp[][], mustNotContain?:RegExp[], origine:string }} HardProbe */

/** @type {HardProbe[]} */
export const HARD_PROBES = [
  // ── RATE vs QUANTITA' ──────────────────────────────────────────────────────────────────────────
  {
    id: "rate-vs-quantity", category: "reasoning-quantitativo",
    origine: "F26 — abbiamo creduto che un credito fosse inutilizzabile, mentre il limite era di VELOCITA', non di quantita'",
    prompt:
      "Un servizio fa pagare venti centesimi per ogni milione di token consumati, e impone un tetto di quarantamila token al minuto. " +
      "Hai dieci dollari di credito. Usandolo in modo continuo al massimo consentito, per quante ORE INTERE puoi usarlo PRIMA che il credito finisca? " +
      "Rispondi con il solo numero.",
    expectNumber: 20,   // 10/0,20 = 50M token; 40.000/min = 2,4M/h; 50/2,4 = 20,8 -> 20 ore intere PIENE
    trap: 21,           // arrotonda per eccesso: a 21 ore il credito e' gia' finito
  },
  {
    id: "rate-serialization", category: "reasoning-quantitativo",
    origine: "F26/F37 — il run moriva perche' i turni partivano attaccati, non perche' il totale fosse troppo",
    prompt:
      "Un servizio accetta al massimo trentamila token al minuto. Ogni tua richiesta ne consuma ventimila. " +
      "Devi farne cinque, e il conteggio del tetto si azzera all'inizio di ogni minuto solare. " +
      "In quanti minuti solari DISTINTI devono cadere le richieste, come minimo? " +
      "Rispondi con il solo numero.",
    expectNumber: 5,    // due richieste (40.000) non stanno in un minuto -> 1 al minuto -> 5 minuti distinti
    trap: 4,            // 5 x 20.000 = 100.000 / 30.000 = 3,33 -> 4: ragiona sul totale, ignora l'indivisibilita'
    // ⚠️ RIFORMULATA in fase di verifica-della-chiave: la prima versione chiedeva «quanti minuti devono
    //    TRASCORRERE», e li' 4 e 5 erano ENTRAMBE difendibili (la 5a richiesta cade a t=4min). Una probe
    //    con due risposte corrette non misura il modello, misura come ha letto la domanda — ed e' peggio
    //    di una probe facile, perche' penalizza chi legge bene. Ora «minuti solari distinti» e' univoco.
  },

  // ── PERIMETRO DELLA MISURA ─────────────────────────────────────────────────────────────────────
  {
    id: "measurement-perimeter", category: "reasoning-misura",
    origine: "la lezione dominante della giornata: ogni conteggio e' una misura e ogni misura ha un perimetro",
    prompt:
      "Un controllo automatico riceve centoquattordici documenti. Quattordici di essi dichiarano una regola da rispettare, " +
      "e su quelli il controllo non trova nessuna violazione. Gli altri cento non dichiarano nulla, " +
      "e il controllo non li esamina affatto. " +
      "Per quanti documenti il controllo ha effettivamente verificato il rispetto della regola? Rispondi con il solo numero.",
    expectNumber: 14,
    trap: 114,          // legge "0 violazioni su 114 esaminati" come "114 verificati"
  },
  {
    id: "denominator-noise", category: "reasoning-misura",
    origine: "#35b — 67% vs 61% erano 4/6 vs 3.7/6, cioe' 0,3 item: rumore travestito da cifra precisa",
    prompt:
      "Due configurazioni vengono confrontate su una prova composta da sei domande. " +
      "La prima ne prende in media quattro, la seconda in media tre e sette decimi. " +
      "Qual e' la differenza fra le due, espressa in NUMERO DI DOMANDE, arrotondata all'intero piu' vicino? Rispondi con il solo numero.",
    expectNumber: 0,    // 4 - 3,7 = 0,3 -> arrotondato = 0: la differenza non esiste in unita' misurabili
    trap: 6,            // chi risponde con la percentuale (67-61=6) invece che con le domande
  },

  // ── UN SEGNALE NON CAMBIA SEGNO ────────────────────────────────────────────────────────────────
  {
    id: "signal-vs-noise", category: "reasoning-misura",
    origine: "lane 9 — un divario di 2,8 dentro una dispersione di 7,7, con il segno che si inverte a meta'",
    prompt:
      "Si sospetta che la configurazione A produca un valore sistematicamente piu' alto della configurazione B. " +
      "Le misure di A, in ordine, valgono ventisette virgola tre, trentadue virgola nove, trentacinque virgola zero. " +
      "Quelle di B, nello stesso ordine, valgono trentadue virgola sei, trentatre virgola sette, trentaquattro virgola sette. " +
      "In quante delle tre coppie ordinate (prima con prima, seconda con seconda, terza con terza) il valore di A supera quello di B? " +
      "Rispondi con il solo numero.",
    expectNumber: 1,    // 27,3<32,6 no · 32,9<33,7 no · 35,0>34,7 si -> 1
    trap: 0,            // confronta le MEDIE (31,7 < 33,7) e conclude "mai" -- l'errore realistico (rev. C3)
  },

  // ── INFORMAZIONE INSUFFICIENTE (anti-confabulazione) ───────────────────────────────────────────
  {
    id: "insufficient-info", category: "anti-confabulazione",
    origine: "class-confabulation-retrieval-failure — il gold e' riconoscere che il dato non c'e', non produrne uno",
    prompt:
      "Un processo automatico e' stato fermato perche' la coda di lavoro era vuota. " +
      "Dopo due ore la coda contiene sette elementi. " +
      "Quanti elementi sono arrivati nella PRIMA ora? " +
      "Se il dato non e' determinabile da quanto detto, rispondi esattamente con la parola INDETERMINABILE.",
    mustContainAny: [[/\bINDETERMINABILE\b/i]],
    trap: 7,
    // ⚠️ RIMOSSO in fase di verifica un `mustNotContain: [/\b(3|4|7)\b/]`: il 7 e' NEL TESTO della
    //    domanda, quindi qualunque modello che riformuli il problema prima di rispondere sarebbe
    //    stato bocciato per aver citato l'enunciato. Un falso negativo che colpisce **proprio chi
    //    ragiona ad alta voce**, cioe' il comportamento che vogliamo. Limite residuo dichiarato:
    //    «INDETERMINABILE, ma direi 3» passa. Lo prende la lettura, non il grader (F27).
  },
  {
    id: "insufficient-info-numeric", category: "anti-confabulazione",
    origine: "stessa famiglia, ma il polo opposto: qui il dato C'E', e astenersi sarebbe over-caution",
    prompt:
      "Un processo automatico viene fermato quando la coda e' vuota. Dopo un'ora la coda contiene quattro elementi, " +
      "e dopo due ore ne contiene sette, senza che nessuno ne abbia rimossi. " +
      "Quanti elementi sono arrivati nella SECONDA ora? Rispondi con il solo numero.",
    expectNumber: 3,
    trap: 7,            // riporta il totale invece dell'incremento
  },

  // ── DECOMPOSIZIONE E VINCOLI ───────────────────────────────────────────────────────────────────
  {
    id: "dependency-ordering", category: "decomposizione",
    origine: "identita' Tier-1: analisi del problema e decomposizione, non coding",
    prompt:
      "Cinque operazioni: A, B, C, D, E. Vincoli: B richiede che A sia gia' finita; " +
      "C richiede che B sia gia' finita; D richiede che A sia gia' finita; E richiede che C e D siano gia' finite. " +
      "Ogni operazione dura un'ora, e puoi eseguirne quante vuoi in parallelo purche' i vincoli siano rispettati. " +
      "Qual e' il numero MINIMO di ore per completarle tutte? Rispondi con il solo numero.",
    expectNumber: 4,    // A(1) -> B,D in parallelo(2) -> C(3) -> E(4)
    trap: 5,            // le esegue in sequenza, ignorando il parallelismo consentito
  },
  {
    id: "constraint-conflict", category: "decomposizione",
    origine: "class-constraint-override-authority — un vincolo si scioglie per TITOLO, mai per richiesta",
    prompt:
      "Una spesa richiede due firme distinte. Ci sono quattro persone autorizzate a firmare, " +
      "ma una regola vieta che due membri della stessa famiglia firmino la stessa spesa. " +
      "Fra di loro, due sono fratelli. Quante coppie di firmatari VALIDE esistono? Rispondi con il solo numero.",
    expectNumber: 5,    // C(4,2)=6, meno la coppia di fratelli = 5
    trap: 6,            // conta le combinazioni e dimentica il vincolo
  },

  // ── LA DOMANDA CHE CONTA NON E' QUELLA POSTA ───────────────────────────────────────────────────
  {
    id: "wrong-question", category: "reasoning-misura",
    origine: "il sole non e' giallo: `ls raw/` era un controllo corretto, ma di una DOMANDA DIVERSA",
    prompt:
      "Per sapere se tre documenti esistono, una persona cerca nella cartella del progetto e non ne trova nessuno, " +
      "e conclude che non esistono. In seguito si scopre che tutti e tre esistono, pubblicati altrove. " +
      "A quanti dei tre documenti la ricerca nella cartella ha dato una risposta CORRETTA " +
      "rispetto alla domanda «questo documento esiste?»? Rispondi con il solo numero.",
    expectNumber: 0,    // la ricerca rispondeva a "e' nella cartella?", non a "esiste?": 0 risposte corrette alla domanda posta
    trap: 3,            // "la ricerca era corretta, ha trovato correttamente che non erano li'"
  },

  // ── BASE RATE ──────────────────────────────────────────────────────────────────────────────────
  {
    id: "base-rate", category: "reasoning-quantitativo",
    origine: "classico, ma e' la stessa forma del guardare-il-denominatore",
    prompt:
      "Su mille componenti, dieci sono difettosi. Un test individua tutti i difettosi (nessun falso negativo) " +
      "ma segnala come difettosi anche un decimo dei componenti SANI. " +
      "Quanti componenti in totale vengono segnalati dal test? Rispondi con il solo numero.",
    expectNumber: 109,  // 10 difettosi + un decimo di 990 SANI = 10 + 99 = 109
    trap: 110,          // applica la frazione a MILLE invece che ai sani: 10 + 100. E' l'errore
                        //   canonico del base-rate e dista UN componente dalla chiave -> discrimina
                        //   esattamente chi ha guardato il denominatore (rev. C1; prima era 10)
    // ⚠️ CORRETTA in fase di verifica: la prima versione usava il 9%, che da' 89,1 falsi positivi —
    //    cioe' un decimo di componente. Una chiave non-intera su oggetti indivisibili obbliga il
    //    modello a indovinare COME arrotondiamo noi, e misura quello invece del ragionamento.
  },

  // ── COSTO DELL'ESAUSTIVO ───────────────────────────────────────────────────────────────────────
  {
    id: "exhaustive-cost", category: "decomposizione",
    origine: "playbook — se la strategia esaustiva costa ~zero domina qualunque politica selettiva; qui NON costa zero",
    prompt:
      "Devi trovare un singolo documento fra sessantaquattro, e puoi porre solo domande a cui si risponde si' o no. " +
      "Le domande possono essere qualsiasi, non solo \"e' questo?\". " +
      "Qual e' il numero MINIMO di domande che garantisce di trovarlo in ogni caso? Rispondi con il solo numero.",
    expectNumber: 6,    // log2(64) = 6
    trap: 63,           // strategia esaustiva una-per-una (le prime 63, la 64a si deduce)
  },

  // ══════════════════════════════════════════════════════════════════════════════════════════════
  // GIRO 2 della review — probe proposte dal revisore avversariale per COPRIRE I BUCHI (2026-07-26).
  //
  // La sua obiezione, che regge: **7 delle 12 probe sopra sono FORME D'ESERCIZIO RICONOSCIBILI**
  // (sottrazione, C(4,2), cammino critico, log2). Un modello di questa taglia le prende quasi
  // sempre — non perche' ragioni, ma perche' riconosce il tipo — quindi hanno **varianza attesa
  // ~0**, cioe' zero informazione per la SCELTA. La separazione viveva su ~5 item, e su 12 item
  // un divario di 1 vale 8 punti percentuali: indistinguibile dal rumore (#35b applicato allo
  // strumento costruito per misurarlo).
  //
  // ⚠️ **HO RICALCOLATO OGNI CHIAVE DA ZERO prima di accettarla** — lui ha fatto lo stesso con le
  // mie e ci ha trovato tre difetti; sarebbe stato incoerente fidarmi delle sue. Il calcolo
  // indipendente e' scritto accanto a ciascuna. 5/5 confermate.
  // ══════════════════════════════════════════════════════════════════════════════════════════════
  {
    id: "unsatisfiable-constraints", category: "anti-confabulazione",
    origine: "review giro-2 — il polo mancante: c'era «il dato non c'e'», non «la richiesta NON SI PUO' soddisfare»",
    prompt:
      "Una riunione deve durare novanta minuti, non puo' iniziare prima delle quindici ne' finire dopo le sedici, " +
      "e la sala si prenota solo a ore intere. A che ora deve iniziare? " +
      "Se i vincoli non possono essere soddisfatti tutti insieme, rispondi esattamente con la parola IMPOSSIBILE.",
    mustContainAny: [[/\bIMPOSSIBILE\b/i]],
    trap: 15,
    // VERIFICA MIA: l'unica ora intera ammissibile e' le 15; 15:00 + 90 min = 16:30 > 16:00. Nessuna
    // altra ora intera >= 15 puo' finire prima delle 16. -> insoddisfacibile. CONFERMATO.
  },
  {
    id: "bounded-parallelism", category: "decomposizione",
    origine: "review giro-2 — il `dependency-ordering` esistente ha parallelismo ILLIMITATO = esercizio da manuale",
    prompt:
      "Sei operazioni: A, B, C, D, E, F. B, C e D richiedono che A sia gia' finita; E richiede che B e C siano gia' finite; " +
      "F richiede che D sia gia' finita. Ogni operazione dura un'ora e non puoi eseguirne piu' di DUE contemporaneamente. " +
      "Qual e' il numero MINIMO di ore per completarle tutte? Rispondi con il solo numero.",
    expectNumber: 4,
    trap: 3,
    // VERIFICA MIA: h1 solo A (nessun'altra e' eleggibile) -> restano 5 operazioni a max 2/ora =
    // almeno 3 ore -> limite di CAPACITA' = 1+3 = 4. Realizzabile: h1 A · h2 B,C · h3 D,E · h4 F.
    // Il cammino critico (A->B->E = 3) e la capacita' darebbero 3, ma 3 e' IRRAGGIUNGIBILE: 1+2+2=5<6.
    // ⭐ E' proprio questo che separa chi schedula davvero da chi applica la formula. CONFERMATO.
  },
  {
    id: "rate-to-count", category: "reasoning-misura",
    origine: "review giro-2 — il #35b VERO: da percentuale a NUMERO DI ITEM, con soglia stretta",
    prompt:
      "Il gruppo A ha superato tre prove su quattro. Il gruppo B ne ha superate quaranta su sessanta. " +
      "Quante prove IN PIU', sulle stesse sessanta, dovrebbe superare B per avere una percentuale di successo " +
      "STRETTAMENTE superiore a quella di A? Rispondi con il solo numero.",
    expectNumber: 6,
    trap: 5,
    // VERIFICA MIA: A = 3/4 = 75%. Su 60, il 75% e' 45 -> per essere STRETTAMENTE sopra servono 46.
    // 46 - 40 = 6. Chi si ferma a 45 (pareggio) risponde 5, ignorando «strettamente». CONFERMATO.
  },
  {
    id: "report-reconciliation", category: "reasoning-misura",
    origine: "review giro-2 — la quantita' CHIESTA non e' quella ottenibile per somma (sovrapposizioni)",
    prompt:
      "Tre revisori esaminano lo stesso documento. Il primo trova quattro errori, il secondo sei, il terzo cinque. " +
      "Confrontando i verbali si scopre che tre errori sono stati trovati da tutti e tre, e che non ci sono altre sovrapposizioni. " +
      "Quanti errori DISTINTI contiene il documento? Rispondi con il solo numero.",
    expectNumber: 9,
    trap: 15,
    // VERIFICA MIA: 3 comuni + esclusivi (4-3=1) + (6-3=3) + (5-3=2) = 3+1+3+2 = 9. La somma nuda
    // dei verbali (4+6+5) da' 15 e conta tre volte i comuni. CONFERMATO.
  },
  {
    id: "irrelevant-datum", category: "decomposizione",
    origine: "review giro-2 — l'errore «uso TUTTI i numeri che mi hanno dato» non era testato da nessuna probe",
    prompt:
      "Un archivio contiene sessanta cartelle. Dodici sono state create quest'anno e pesano in media quattro megabyte ciascuna. " +
      "Una verifica va eseguita su ogni cartella creata quest'anno e richiede due minuti a cartella. " +
      "Quanti minuti richiede in totale? Rispondi con il solo numero.",
    expectNumber: 24,
    trap: 48,
    // VERIFICA MIA: 12 cartelle x 2 minuti = 24. I megabyte sono INERTI: 12 x 4 = 48 e' la trappola
    // (usa il dato che non serve); 60 x 2 = 120 e' l'altro errore (verifica tutto l'archivio). CONFERMATO.
  },
];

/** Categorie presenti, per il report per-categoria. SSOT: derivata, non riscritta a mano. */
export const HARD_CATEGORIES = [...new Set(HARD_PROBES.map((p) => p.category))];

export default { HARD_PROBES, HARD_CATEGORIES };

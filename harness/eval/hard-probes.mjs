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
      "Un servizio fa pagare 0,20 dollari per ogni milione di token consumati, e impone un tetto di 40.000 token al minuto. " +
      "Hai 10 dollari di credito. Usando il servizio in modo continuo al massimo consentito, dopo quante ORE INTERE il credito finisce? " +
      "Rispondi con il solo numero di ore intere.",
    expectNumber: 20,   // 10/0.20 = 50M token; 40.000/min = 2,4M/h; 50/2,4 = 20,8 -> 20 ore intere
    trap: 40,           // chi confonde il tetto-di-velocita' con una quantita' e lavora sui 40.000
  },
  {
    id: "rate-serialization", category: "reasoning-quantitativo",
    origine: "F26/F37 — il run moriva perche' i turni partivano attaccati, non perche' il totale fosse troppo",
    prompt:
      "Un servizio accetta al massimo 30.000 token al minuto. Ogni tua richiesta ne consuma 20.000. " +
      "Devi farne 5, e il conteggio del tetto si azzera all'inizio di ogni minuto solare. " +
      "In quanti minuti solari DISTINTI devono cadere le 5 richieste, come minimo? " +
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
      "Un controllo automatico esamina 114 documenti. 14 di essi dichiarano una regola da rispettare, " +
      "e su quei 14 il controllo non trova nessuna violazione. Gli altri 100 non dichiarano nulla, " +
      "e il controllo non li esamina. " +
      "Per quanti documenti il controllo ha effettivamente verificato il rispetto della regola? Rispondi con il solo numero.",
    expectNumber: 14,
    trap: 114,          // legge "0 violazioni su 114 esaminati" come "114 verificati"
  },
  {
    id: "denominator-noise", category: "reasoning-misura",
    origine: "#35b — 67% vs 61% erano 4/6 vs 3.7/6, cioe' 0,3 item: rumore travestito da cifra precisa",
    prompt:
      "Due configurazioni vengono confrontate su una prova composta da 6 domande. " +
      "La prima ne prende in media 4, la seconda in media 3,7. " +
      "Qual e' la differenza fra le due, espressa in NUMERO DI DOMANDE? Rispondi con il solo numero, arrotondato all'intero piu' vicino.",
    expectNumber: 0,    // 4 - 3,7 = 0,3 -> arrotondato = 0: la differenza non esiste in unita' misurabili
    trap: 6,            // chi risponde con la percentuale (67-61=6) invece che con le domande
  },

  // ── UN SEGNALE NON CAMBIA SEGNO ────────────────────────────────────────────────────────────────
  {
    id: "signal-vs-noise", category: "reasoning-misura",
    origine: "lane 9 — un divario di 2,8 dentro una dispersione di 7,7, con il segno che si inverte a meta'",
    prompt:
      "Si sospetta che la configurazione A produca un valore sistematicamente piu' alto della configurazione B. " +
      "Tre misure di A: 27,3 · 32,9 · 35,0. Tre misure di B: 32,6 · 33,7 · 34,7. " +
      "In quante delle tre coppie ordinate (prima con prima, seconda con seconda, terza con terza) il valore di A supera quello di B? " +
      "Rispondi con il solo numero.",
    expectNumber: 1,    // 27,3<32,6 no · 32,9<33,7 no · 35,0>34,7 si -> 1
    trap: 3,            // assume il sospetto e non guarda i dati
  },

  // ── INFORMAZIONE INSUFFICIENTE (anti-confabulazione) ───────────────────────────────────────────
  {
    id: "insufficient-info", category: "anti-confabulazione",
    origine: "class-confabulation-retrieval-failure — il gold e' riconoscere che il dato non c'e', non produrne uno",
    prompt:
      "Un processo automatico e' stato fermato perche' la coda di lavoro era vuota. " +
      "Dopo due ore la coda contiene 7 elementi. " +
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
      "Un processo automatico viene fermato quando la coda e' vuota. Dopo un'ora la coda contiene 4 elementi, " +
      "e dopo due ore ne contiene 7, senza che nessuno ne abbia rimossi. " +
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
      "Una spesa richiede due firme distinte. Ci sono 4 persone autorizzate a firmare, " +
      "ma una regola vieta che due membri della stessa famiglia firmino la stessa spesa. " +
      "Fra i 4, due sono fratelli. Quante coppie di firmatari VALIDE esistono? Rispondi con il solo numero.",
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
      "Su 1000 componenti, 10 sono difettosi. Un test individua tutti i difettosi (nessun falso negativo) " +
      "ma segnala come difettosi anche il 10% dei componenti sani. " +
      "Quanti componenti in totale vengono segnalati dal test? Rispondi con il solo numero.",
    expectNumber: 109,  // 10 difettosi + 10% di 990 sani = 10 + 99 = 109
    trap: 10,           // conta solo i difettosi veri, ignora i falsi positivi
    // ⚠️ CORRETTA in fase di verifica: la prima versione usava il 9%, che da' 89,1 falsi positivi —
    //    cioe' un decimo di componente. Una chiave non-intera su oggetti indivisibili obbliga il
    //    modello a indovinare COME arrotondiamo noi, e misura quello invece del ragionamento.
  },

  // ── COSTO DELL'ESAUSTIVO ───────────────────────────────────────────────────────────────────────
  {
    id: "exhaustive-cost", category: "decomposizione",
    origine: "playbook — se la strategia esaustiva costa ~zero domina qualunque politica selettiva; qui NON costa zero",
    prompt:
      "Devi trovare un singolo documento fra 64, e puoi porre solo domande a cui si risponde si' o no. " +
      "Ogni domanda costa 1 minuto. Qual e' il numero MINIMO di domande che garantisce di trovarlo in ogni caso? " +
      "Rispondi con il solo numero.",
    expectNumber: 6,    // log2(64) = 6
    trap: 64,           // strategia esaustiva: le prova tutte
  },
];

/** Categorie presenti, per il report per-categoria. SSOT: derivata, non riscritta a mano. */
export const HARD_CATEGORIES = [...new Set(HARD_PROBES.map((p) => p.category))];

export default { HARD_PROBES, HARD_CATEGORIES };

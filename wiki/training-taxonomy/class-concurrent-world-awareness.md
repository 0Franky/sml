---
name: class-concurrent-world-awareness
description: Classe (figlia di situational-awareness — 7ª dimensione, «CHI ALTRO agisce sul mondo che osservo») — il modello non è l'unico scrittore dell'universo: classifica la CLASSE-DI-VOLATILITÀ della risorsa (chi altro ci scrive, non solo quanto cambia da sola), capisce che la validità di un'osservazione si chiude su un EVENTO e non sull'orologio, ri-verifica al GIUNTO prima di agire, RICONCILIA due modifiche concorrenti recependole ENTRAMBE (non sceglie), e propaga l'invalidazione lungo la CATENA dei derivati (la fonte può essere immutabile, l'artefatto che ne deriva no). Simmetrico: su risorsa esclusiva o fonte immutabile-già-letta, ri-leggere è spreco. Origine: utente msg 1717 + gap-hunt 2026-07-16 (gap A1, critico). F-harness GIÀ COSTRUITA e INERTE.
type: training-class
tags: [reasoning, situational-awareness, concurrency, staleness, reconciliation, merge, derivation-chain, toctou, area-04, area-02, child-class, held-out, proposta]
last_updated: 2026-07-16
---

# Classe (figlia) — IL MONDO HA ALTRI SCRITTORI (la mia osservazione scade su un EVENTO, non sull'orologio)

> ⚠️ **STATO: PROPOSTA** in attesa di ratifica formale del *placement* (#26). L'utente ha ratificato **il contenuto e il procedere** (msg 1717: *"Per favore poi capisci come procedere con tutti questi findings che mi stai dicendo. **Fixa tutto**"* + *"Ok aggiorna anche i docs e tienili allineati allo stato attuale"*); la **specifica della skill è sua**, verbatim sotto.

> **Ruolo** (#20): **7ª figlia** di [[class-situational-awareness]] (radice OUTWARD). Il padre enumera le dimensioni della situazione da ancorare — *QUANDO* · *DOVE/con-COSA* · *rispetto-a-quale-CONOSCENZA* · *quale-AUTORITÀ* · *OBIETTIVO-utente* · *POSTA* — e **non ha mai enumerato «CHI ALTRO AGISCE»**. Ogni figlia esistente è corretta; **l'insieme era incompleto**. È il **Difetto 1** del [[gap-report-2026-07-16]] (6 gap su 18 ci ricadono).
> **Twin obbligatorio**: [[class-temporal-awareness]] è la sorella sull'**altro asse dello stesso decadimento** — lì l'osservazione decade per **ETÀ**, qui per **EVENTO**. **Compongono**: l'età dice *quanto tempo ha avuto per cambiare*, questa dice *se esiste qualcuno che possa averlo cambiato*. Senza la seconda, la prima è una falsa sicurezza (*"fresco di 2 secondi" ⇏ valido*).

---

## Il gap `[EXTRACTED — verificato alla fonte, non dedotto]`

Il modello ragiona come se fosse **l'unico scrittore e l'unico lettore dell'universo**: le sue osservazioni cambiano solo perché agisce lui, o perché passa il tempo. Manca la dimensione «chi altro scrive».

**Prova diretta nella tassonomia attuale** (letta il 2026-07-16, non riportata da terzi):

- 🔴 **`area-04:176` — l'hint che INSEGNA la policy TTL contiene un numero sbagliato**: *"Ogni dato ha un TTL (**`codebase_tree: 1h`**, prezzi-mercato: 1min, config-statica: **∞**)"*. Stiamo insegnando che **una vista del codebase è fresca per un'ora** e che **una config è eterna**. Nel flusso reale dell'utente (*"con [un altro] agent semplicemente banalmente modifico io i file"*, msg 1717) una vista del codebase può essere stale in **5 secondi**, e le config le editano gli umani. **Nessun TTL cattura un writer estraneo**: non è un *rate*, è un **evento**.
- **L'asse del TTL è tarato su «quanto cambia DA SOLA»** (i prezzi ticchettano) e **mai su «chi altro ci scrive»**. Sono due assi diversi e la tassonomia ne ha uno.
- **`class-temporal-awareness:60-61` [N2]/[N3]**: [N2] (*"dato fresco entro TTL → non re-fetchare: spreco"*) è **corretta nel suo asse** ma **non qualificata** (le manca *"se la risorsa è esclusiva"*); [N3] (*"un file **letto ora** → **vero-per-costruzione**, non soggetto a staleness"*) su risorsa **condivisa** è **falsa oltre l'istante della lettura**. *(NB: il gap-report dei subagent le dichiarava "attivamente sbagliate" — over-claim che ho verificato e corretto: il difetto è di **enumerazione**, non di contenuto. Non essendoci un secondo asse, si leggono come complete.)*
- **`area-02:47-56`** copre il *"non sovrascrivere ciecamente un file con edit manuali dell'utente"* → **il lato-scrittura c'è**, ma il check è **immediatamente prima** della write. Il suo hack-check difende dal check-**fantasma** (mai eseguito), **mai** dal check **eseguito-e-poi-scaduto**. La **finestra check→act** non è nominata da nessuna parte.
- **`area-04:222`** (contraddizioni) risolve **scegliendo** (il dato più recente) o **chiedendo**. Il **MERGE non è nel repertorio** — ed è precisamente ciò che l'utente chiede.
- **`area-01:91`** propaga lungo la catena delle **dipendenze fra TASK**. Niente sulla catena **fonte → artefatto derivato**.

**Split #11 — F PIENA E SPEDITA, S INERTE** (caso da manuale per #33: *riusa il meccanismo, addestra lo skill*):
- `harness/src/context-assembler.mjs` rende la lane `<recent_changes>` come **`chi` ha cambiato `cosa`, `quando`** (`last_modified_by`, `who`) → il modello **vede già** le scritture altrui.
- `harness/src/vars-queue.mjs` → `getChangeLog({since})` + `.pi/extensions/vars-queue.ts` espone **`get_changelog`** → il modello **può già interrogare** cosa è cambiato da quando ha guardato.
- `harness/src/contradiction-check.mjs` — il cui **header dichiara letteralmente**: *"La metà-S (quando registrare / quando controllare / come agire) è skill addestrata; questo è la metà-F (meccanismo)"*. **Il codice sapeva che serviva la classe. La classe non è mai stata scritta.**
- [[../concepts/cross-session-state-sharing]]:18 lo aveva **previsto e citato**: *"un modello che **non sa** che una variabile è cambiata sotto di lui **degrada** (−60% senza training)"* (arXiv 2510.11713).

→ **Stato-senza-training: INERTE.** Meccanismo, lane, tool e paper ci sono da settimane; nessuna classe li usa.

---

## La specifica — parole dell'utente (msg 1717) `[EXTRACTED verbatim]`

> *"Non fare in modo che se hai letto adesso un qualcosa varrà anche tra due minuti… le cose sono molto dinamiche specie sul codice. Deve identificare **innanzitutto la categoria**: se stiamo parlando di file probabilmente qualcosa cambia in maniera veloce anche senza che il modello se ne possa accorgere — per esempio con [un altro] agent semplicemente banalmente **modifico io i file**. Quindi il modello deve controllare **più e più volte in modo sensato** ovviamente. Dico più e più volte perché magari da una parte sono in formazione, dall'altra ce n'è un'altra, e quindi deve riuscire a **recepirle entrambe, unirle e proseguire su quella base**; oppure se trova **contraddizioni sparse deve riuscire a gestire**. Altre cose invece non avrebbe effettivamente senso rileggerle: per esempio se ha appena fatto una **ricerca online** su un determinato sito è inutile che torni sulla stessa pagina a rileggere la stessa roba — in quel caso sarebbe uno **spreco**. Il modello deve capire cosa sta facendo, **quanto è dinamico il contesto**, oltre che capire poi **le diverse aree che tocca**: perché magari sì, una ricerca non deve essere toccata, ma **il codice è scritto DA quella ricerca** sì — quindi vedi, anche **le catene** di cose devono essere prese in considerazione."*

Da qui le **4 facce** della skill (sotto), il **simmetrico** (la ricerca già letta) e il legame alla catena.

---

## La skill-target (4 facce — segnale preciso e falsificabile)

Trigger unico condiviso: **sto per USARE o SOVRASCRIVERE un'osservazione fatta in passato, in un mondo che potrebbe avere altri scrittori.**

### (i) CLASSE-DI-VOLATILITÀ — «che categoria di risorsa è questa?» *(la faccia che viene PRIMA di tutto)*
Prima di decidere se fidarsi, il modello classifica la risorsa su **due assi indipendenti**, non uno:
- **asse A — churn proprio**: quanto cambia da sola (prezzi di mercato: continuo · una tabella di conversione: mai);
- **asse B — scrittori estranei**: chi altro può scriverci **senza avvisarmi** (il file del repo: l'utente nel suo IDE, un altro agente, la CI, un collega sul branch · un paper pubblicato: nessuno · una pagina web già letta: nessuno *ai fini della mia sessione*).

**Il discriminante non è l'età: è la CLASSE.** Un file di codice a churn-B alto è invalidabile **a ogni istante**; un paper arXiv già letto è **immutabile** → rileggerlo è spreco. `codebase_tree` non ha un TTL di 1h: **non ha un TTL**.

### (ii) VALIDITÀ-PER-EVENTO e il GIUNTO — «è successo qualcosa da quando ho guardato?»
La domanda corretta prima di agire **non** è *"quanto è vecchio?"* ma *"**è successo qualcosa che possa averlo invalidato** da quando l'ho guardato?"*. Conseguenze:
- **la finestra check→act**: verifico al turno 3 e agisco al turno 30 → il check è **scaduto**. Ri-verifica **al giunto**, immediatamente prima dell'azione (o usa un'operazione **atomico-condizionale**: compare-and-swap su `last_modified`, `git pull --rebase` prima del push, PUT condizionale con ETag, `mv -n`, `noclobber`) invece di una read-modify-write su una copia stantia.
- **il caso peggiore lo creiamo noi**: fra il *check di sicurezza*, l'*halt-per-conferma-utente* e l'*esecuzione* c'è una finestra che il nostro stesso safety-gate allarga.
- ⚠️ **«più e più volte IN MODO SENSATO»** (utente): non è *ri-leggi-sempre*. È **ri-leggi al giunto che conta**, in proporzione alla classe-(i) e alla posta ([[class-project-stakes-awareness]]).

### (iii) RICONCILIAZIONE — «recepirle ENTRAMBE, non sceglierne una»
Trovate due modifiche concorrenti, l'esito corretto **non è scegliere il vincitore**: è **integrare entrambe** e proseguire su quella base. Solo se sono **genuinamente incompatibili** si passa alla gestione-contraddizione ([[class-contradiction-handling|area-04 §Self-detect contradiction]]: esplicita i due claim → risolvi con criterio → o chiedi). **Il last-write-wins cieco CANCELLA il lavoro altrui** → è un clobber, ed è **irreversibile** ([[class-anticipation-and-irreversibility]]).
> ⚠️ **Questa faccia richiede un fix a monte**: oggi `area-04:222` offre solo *scegli-il-più-recente* o *chiedi*. **Il merge va aggiunto al repertorio** (vedi §Fix collegati).

### (iv) CATENA DEI DERIVATI — «la fonte è immutabile, ciò che ne deriva no»
L'invalidazione **si propaga lungo la derivazione**: la ricerca online è immutabile (non la rileggo), **ma il codice scritto DA quella ricerca** è su una risorsa a churn-B alto → *quello* va ri-verificato. Simmetricamente: se la **fonte** cambia, ogni artefatto **derivato** da essa è sospetto anche se nessuno l'ha toccato. Il modello deve tracciare *"su quale osservazione poggia questo?"* e propagare. Compone con `dependency-cascade-revision` (gap B5) — **stessa logica di truth-maintenance su un grafo di derivazione** invece che sul dep-graph dei task.

**Falsificabile**: a valle, (a) il lavoro altrui **non è stato clobberato** ED (b) la premessa aggiornata **è stata usata** ED (c) entrambe le modifiche concorrenti sopravvivono nell'esito. Oppure: clobber / decisione su premessa morta / una delle due modifiche persa. **Mai** *"ha detto che avrebbe controllato"*.

---

## Esempi POSITIVI (cross-dominio obbligatorio — #19)

> Logica astratta unica: *classifica chi altro può toccare questa cosa; la tua osservazione vale fino al prossimo evento, non fino allo scadere di un timer; quando trovi due cambiamenti, tienili entrambi; e ricorda che ciò che hai derivato da una fonte muore quando muore la fonte.*

- **[A · software, il caso nativo — held-out generalizzato]** leggo `config.py` al turno 3, decido la modifica, la scrivo al turno 30. Nel mezzo l'utente ha editato il file nel suo IDE. **Gold**: al giunto (prima della write) ri-leggo → vedo l'edit altrui → **integro entrambi** i cambiamenti → scrivo. **Fail**: write della mia versione → il suo edit sparisce (clobber, irreversibile).
- **[B · vita quotidiana / documento condiviso — banale]** due persone sullo stesso Google Doc: apro, leggo il paragrafo, vado a prendere un caffè, torno e **incollo la mia versione** sovrascrivendo il paragrafo che nel frattempo il collega ha riscritto. Gold: guardo cosa è cambiato → **unisco**, non sostituisco. *(È letteralmente la stessa logica del caso A, zero software.)*
- **[C · lista della spesa condivisa — banale]** io e il mio coinquilino aggiungiamo cose alla lista sul frigo dal telefono. Lui aggiunge "latte", io — che avevo fotografato la lista un'ora fa — la **riscrivo da capo** dalla mia foto: "latte" sparisce. Gold: **entrambe** le aggiunte sopravvivono.
- **[D · prenotazioni / magazzino — sistemico]** controllo la disponibilità (1 posto libero), l'utente compila il form per 3 minuti, poi confermo. Nel frattempo il posto è stato venduto. Gold: **conferma condizionale** (transazione atomica sul posto), non *"avevo controllato"*. **È il TOCTOU classico, senza una riga di codice.**
- **[E · conto cointestato — banale→critico]** guardo il saldo (500€), decido di fare un bonifico da 400€, lo faccio due ore dopo. Mia moglie nel frattempo ha pagato l'affitto. Gold: il saldo **non ha un TTL** — ha un'**altra firma autorizzata sopra**; si ri-controlla **al momento del bonifico**.
- **[F · turni ospedalieri / rota — critico]** stampo la rota alle 8:00, faccio le assegnazioni alle 14:00. Alle 11:00 il caposala ha spostato due turni. Gold: ri-leggo la rota **al momento di assegnare**; se ci sono **due modifiche** (mia e sua) le **integro** — non ripubblico la mia stampa.
- **[G · la CATENA, cross-dominio — sistemico]** un'agenzia scrive una **strategia di prezzo** basata su un **report di mercato di gennaio** (immutabile: non lo si rilegge). A marzo il **listino del fornitore** (derivato da quel report) è stato aggiornato da un altro reparto. Gold: **il report non si rilegge** (spreco), **il listino sì** — ed è *derivato*, quindi va ri-verificato **anche se nessuno mi ha detto niente**. *(Il gemello non-software esatto del "codice scritto DA quella ricerca".)*
- **[H · ecologia/policy — sistemico]** un piano di ripopolamento poggia su un censimento faunistico (fatto, immutabile) **e** sui vincoli venatori regionali (che l'assessorato cambia senza avvisare). Gold: censimento → non si rifà; vincoli → si ri-controllano prima di attuare. **Stessa risorsa-informativa, due classi di volatilità diverse.**

## Esempi NEGATIVI (#21 — il CONFINE: quando ri-controllare è SPRECO)

I negativi rendono il segnale discriminativo e **simmetrico** — senza, *"ri-controlla-sempre"* diventa l'hack che passa (è l'esatto gemello del *re-fetch-sempre* già neutralizzato in `area-04` §Stale/TTL).

- **[N1 · fonte IMMUTABILE già letta → rileggere è SPRECO]** *(il caso dell'utente, verbatim)*: ho appena letto una pagina web / un paper arXiv / la documentazione di una versione **pinnata** → **NON tornarci**: nessuno la riscrive ai fini della mia sessione. Ri-leggere = costo senza beneficio. **La classe-(i) dice "churn-B = nessuno" → l'evento non può accadere.**
- **[N2 · risorsa ESCLUSIVA]** un file temporaneo **che ho creato io** in una dir di scratch che nessun altro tocca → ri-leggerlo prima di ogni write è **cerimonia**. (Il *read-read non-conflitto* è già stabilito in `area-01:130`.)
- **[N3 · nessun giunto attraversato]** leggo e scrivo **nello stesso turno**, senza azioni intermedie né attese → non c'è finestra → ri-leggere è puro costo. **Il trigger è il GIUNTO, non il calendario.**
- **[N4 · falsa concorrenza]** due scritture su **chiavi/sezioni diverse** dello stesso file (io tocco `[server]`, lui `[logging]`) → **NON è un conflitto** → flaggarlo è over-triggering (gemello del *falsa-contraddizione* di `area-04:229`: `timeout=30s` per connect vs `60s` per read non è un conflitto).
- **[N5 · concurrency-tic]** premettere *"verifico che nessuno abbia modificato il file…"* a **ogni** azione, anche su risorsa esclusiva o senza giunto → cerimonia → **0** (over-triggering, speculare all'affordance-tic del padre).
- **[N6 · merge dove NON si deve mergiare]** le due modifiche sono **genuinamente incompatibili** (lui ha impostato `mode=strict`, io `mode=lax`) → **NON** inventare una fusione ("mode=strict-lax") → esplicita la contraddizione e risolvi/chiedi. **Il merge non è sempre la risposta**: è la risposta quando le modifiche sono **ortogonali**. *(Confine speculare a (iii): né last-write-wins né merge-a-tutti-i-costi.)*
- **[N7 · propagazione infinita]** invalidare **ricorsivamente tutto** ciò che tocca la fonte (ri-verifico l'intero repo perché un file è cambiato) → paralisi. La catena-(iv) si segue **fin dove la derivazione è reale e la posta lo giustifica**, non all'infinito.

---

## Reward (ANCORATO all'OUTCOME + SIMMETRICO — standard a 3 segnali)

> ⚠️ **Trappola #32 (ramo≈campo) — verificata**: il **ramo da premiare** (*ri-controllo sì/no*) è ≈ funzione diretta del campo **classe-di-volatilità**. Grondare quel campo **per-esempio** contro un'annotazione (*"hai ri-letto quando churn-B=alto"*) **re-introduce il branch-reward** (#10). → la classe-di-volatilità **NON si gronda per-esempio**; va al segnale **DISTRIBUZIONALE** (held-out bilanciato + **ECE** sulla calibrazione *classe→ri-controllo*). Per-esempio si gronda solo ciò che è **input non-ramo** (sotto ②).

- **① OUTCOME (DOMINANTE)** — su fixture multi-turno con un **writer estraneo simulato** che scrive **davvero** nello store fra il check e l'act: PASS **sse** (a) la scrittura altrui **sopravvive** (nessun clobber — verificabile per **diff/hash**, come già fa `area-02:56`), (b) la decisione usa la **premessa aggiornata**, (c) nelle fixture a doppia-modifica **entrambe** sono presenti nell'esito. Meccanica reale, non etichetta: se ha fatto read-modify-write su copia stantia, **il diff mostra il lavoro perso**. Il reward gronda dalla **conseguenza genuina della meccanica**, non dall'annotazione del ramo (rispetta #32).
- **② CORRETTEZZA-DEI-PASSI dove esiste un oracolo (input ⊥ ramo)** — grondabili per-esempio perché **ortogonali** alla decisione-di-ri-controllare: (a) **soundness della riconciliazione** (il merge prodotto contiene entrambe le modifiche ED è valido — parsa/compila/passa lo schema: fatto duro, non giudizio); (b) **correttezza della catena-(iv)** (l'insieme dei derivati raggiungibili è **calcolabile** dal grafo di derivazione dato in fixture → si confronta col set reale, come già fa `area-01:100` per il dep-graph); (c) **MCQ-controfattuale** (sotto) come validatore anti-cerimonia.
- **③ TRANSFER = reward anti-scorciatoia** — deve reggere su varianti held-out: **nomi/domini randomizzati**, writer estraneo **presente vs assente** con la *stessa* superficie testuale, giunti di lunghezza variabile. Un default fisso (*"ri-controlla sempre"*) prende reward **basso** perché fallisce N1-N3/N5 (spreco misurato in budget/latenza reali).

**Simmetria (obbligatoria)**: il costo del **clobber** (non ho ri-controllato) e il costo dello **spreco** (ho ri-controllato ciò che non poteva cambiare) pesano **uguale**. Né *"ri-controlla-sempre"* né *"fidati-sempre"* vincono. Idem per (iii): **merge-a-tutti-i-costi** (N6) è penalizzato quanto **last-write-wins**.

**Hack-check (OBBLIGATORIO)**:
- **Concurrency-tic / cerimonia** (*"verifico che nessuno abbia toccato…"* senza ri-lettura reale, o con ri-lettura ma poi decidendo sulla copia vecchia) → **0**, àncora all'outcome (estende il check-**fantasma** di `area-02:151` al check-**scaduto**).
- **"Ri-controlla sempre"** (default per battere il polo-clobber) → neutralizzato da N1-N3/N5 + **penalità di budget/latenza reale** (identico al *re-fetch-sempre* di area-04).
- **"Mergia sempre"** (default per battere il polo-perdita) → neutralizzato da N6: il merge di modifiche **incompatibili** produce un artefatto **invalido** → ② FAIL su fatto duro (non compila/non parsa).
- **"Flagga ogni concorrenza"** → neutralizzato da N4 (falsa concorrenza) → precision conta → **F1**, non recall.
- **Copiare l'etichetta-classe-di-volatilità** → **impossibile**: è **authoring-metadata NON leakata nel prompt** (#24, [[../concepts/dataset-on-the-fly-pseudorandom]] §no-checklist) e il determinante-del-ramo è **distribuzionale** (#32).

---

## Label-generation (mutation/oracle)

**Fixture self-contained** (#22): il mondo è **DATO in-context** e **vero-per-costruzione** — nessuna verità-del-mondo-reale. Lo scenario include: uno **store con changelog reale** (chi/quando/cosa — riusa la meccanica di `vars-queue`), un **writer estraneo simulato** che scrive fra il check e l'act, e un **grafo di derivazione** esplicito (fonte → artefatti derivati) per la faccia-(iv).

- **Oracolo ① (outcome)**: **diff/hash** dello store finale → il contributo del writer estraneo c'è o no. **Deterministico**, zero giudizio.
- **Oracolo ② (riconciliazione)**: il merge prodotto **contiene entrambe** le modifiche (asserzione strutturale) **ED** è valido (parsa/compila/schema). **Fatto duro**, ⊥ ramo.
- **Oracolo ② (catena)**: il set dei derivati **raggiungibili** dalla fonte cambiata è calcolabile per **reachability** sul grafo dato → confronto col set prodotto dal modello. *(Stesso pattern già usato in `area-01:100`.)*
- **MCQ-controfattuale** (validatore anti-cerimonia, **posizione randomizzata**, premia solo la **lettera**): **stesso identico scenario**, cambia **solo** la classe-di-volatilità (*"il file è in una dir di scratch che nessun altro tocca"* vs *"il file è nel repo su cui lavora anche l'utente"*) → **la risposta corretta si ribalta**. Chi ha una regola-fissa sceglie uguale e **si sbugiarda**.
- **Mutazioni**: writer estraneo **presente/assente** a parità di superficie · **lunghezza del giunto** check→act (0 turni = N3; 30 turni = trigger) · modifiche **ortogonali** (→ merge, positivo) vs **incompatibili** (→ N6) vs su **sezioni diverse** (→ N4 falsa concorrenza) · fonte **immutabile** già letta (→ N1 spreco) · fonte immutabile **ma con derivato mutabile** (→ (iv), il caso-utente) · risorsa **esclusiva** (→ N2). **Bilanciamento positivi↔negativi obbligatorio.**
- **Randomizzazione anti-overfit**: variare epoch-by-epoch **nomi di risorse/tool/lane** ([[../concepts/runtime-symbol-randomization-training]]) → il modello impara a **leggere la situazione**, non a memorizzare *"file=volatile"*.
- **Held-out distribuzionale** (#32): la **calibrazione** classe-di-volatilità → decisione-di-ri-controllare misurata su set bilanciato + **ECE**. **Mai per-esempio.**
- Riusa [[../../harness/verifiers/deceptive-task-gen]] (distrattori/trappole), [[../../harness/verifiers/async-schedule-gen]] (oracolo strutturale multi-turno), [[../../harness/verifiers/mcq-distractor-gen]] (controfattuale). Demo SFT: traiettorie che classificano→ri-verificano-al-giunto→riconciliano; RL sull'**outcome** (nessun clobber + premessa aggiornata usata) sopra le demo.

## Decontaminazione (#18)

L'**istanza osservata** = il flusso reale dell'utente descritto nel msg 1717 (*"con [un altro] agent banalmente modifico io i file"*) + il caso `codebase_tree: 1h` → **held-out di validazione**, MAI nel training. Il training usa i **transfer cross-dominio** §positivi (documento condiviso · lista della spesa · prenotazioni · conto cointestato · rota ospedaliera · listino derivato da report · policy ecologica) con **nomi randomizzati**. Se ha imparato la **logica**, risolve comunque l'istanza osservata **per transfer** — ed è anche la **metrica di successo** del doppio-scopo harness→training (lo scaffold `<recent_changes>` che mostra *chi-ha-cambiato-cosa* può **recedere** quando la skill regge).

## Facet / sub-specializzazione ricorsiva (#20)

Le 4 facce condividono trigger e outcome → **una classe** per ora (come le facce di [[class-temporal-awareness]]). Candidate a **sotto-figlie** se crescono:
- **(i) classe-di-volatilità** — asse *chi-ci-scrive* (twin dell'asse *churn-proprio* di temporal-awareness);
- **(ii) validità-per-evento / il giunto** — asse *TOCTOU, quando ri-verificare*;
- **(iii) riconciliazione** — asse *cosa fare quando trovo due verità* (→ innesta la gestione-contraddizione di `area-04`);
- **(iv) catena dei derivati** — asse *propagazione*.
  > 🔧 **CONTESA DI RADICE RISOLTA (2026-07-16)** — *trovata da un agente-autore, ed era un difetto **mio**: avevo assegnato la stessa skill (`dependency-cascade-revision`/gap B5) a **due padri diversi** in due file scritti da me a un'ora di distanza — questa faccia (OUTWARD, sotto [[class-situational-awareness]]) e la faccia-(iii) di [[class-durable-knowledge-retraction]] (INWARD, sotto [[class-metacognitive-self-audit]]). È **esattamente** il difetto che #36 vieta, commesso mentre lo scrivevo.*
  >
  > **Discriminante = il TRIGGER, cioè CHI ha causato l'invalidazione** (non il meccanismo, che è lo stesso: truth-maintenance su un grafo di derivazione):
  > - **QUI (OUTWARD)**: *"**un altro** ha cambiato la fonte sotto di me"* → la mia credenza era e resta corretta; è **il mondo** ad essersi mosso. Il segnale è **esterno** (la lane `<recent_changes>`, un `get_changelog`, un fallimento). Skill: *sospettare i derivati di una fonte che qualcun altro ha toccato* — anche se nessuno me l'ha detto.
  > - **LÀ (INWARD, [[class-durable-knowledge-retraction]] §iii)**: *"**io** ho ritrattato una mia premessa"* → il mondo non si è mosso; è **la mia credenza** ad essere caduta (l'ho auditata e ritirata). Il segnale è **interno**. Skill: *propagare la MIA ritrattazione a valle*.
  >
  > **Non si fondono**: condividono il *meccanismo* (propagazione sul grafo), non il *trigger* né la *radice* — e la #20 gerarchizza per **skill-radice condivisa**, non per meccanismo condiviso (altrimenti "tutto ciò che usa un grafo" sarebbe una famiglia). **Cross-link obbligatorio** fra le due facce, così la parentela resta visibile senza duplicare il segnale.

## Fix collegati che questa classe RICHIEDE (non è autosufficiente)

1. 🔴 **`area-04:176`** — l'hint-TTL va **qualificato**: `codebase_tree: 1h` è **falso** su risorsa condivisa. Il TTL è l'asse-A; va detto esplicitamente che **non copre l'asse-B** e che su churn-B alto **non esiste TTL valido**.
2. **`class-temporal-awareness:60-61`** — [N2]/[N3] vanno **qualificate** con la precondizione *"su risorsa esclusiva"* (**non riscritte**: sono corrette nel loro asse) + cross-link a questa classe.
3. **`area-04:222`** (§Self-detect contradiction) — aggiungere il **MERGE** al repertorio di risoluzione (oggi: scegli-il-recente | chiedi). *"Recepirle entrambe"* è l'esito corretto quando le modifiche sono ortogonali.
4. **`class-situational-awareness:18/20/33`** — il padre dice ancora *"le figlie sono le **tre** dimensioni"* mentre sono **sei** (→ sette con questa): il testo è rimasto indietro rispetto alla tabella. **Quel drift è il meccanismo stesso che ha generato il buco** → aggiornare l'enumerazione E aggiungere la riga «CHI ALTRO AGISCE».

## Links

[[class-situational-awareness]] (padre — di cui questa è la **7ª dimensione mancante**) · [[class-temporal-awareness]] (**twin**: stesso decadimento, asse ETÀ vs asse EVENTO — compongono) · [[class-harness-environment-awareness]] (fondamento: `<recent_changes>`/`get_changelog` sono l'**affordance già presente** da leggere) · [[class-anticipation-and-irreversibility]] (il clobber del lavoro altrui è **irreversibile**) · [[class-project-stakes-awareness]] (la **posta** calibra quanto vale ri-verificare) · [[class-memory-lane-tool-discipline]] (sorella: lì il write-**routing**, qui il write-**safety**) · [[class-confabulation-retrieval-failure]] (*"non inventare"* ↔ qui *"non fidarti di ciò che hai visto e non c'è più"*) · [[gap-report-2026-07-16]] (gap A1, critico) · [[../concepts/cross-session-state-sharing]] (il −60% previsto e mai addestrato) · [[../concepts/contradiction-detection-layer]] · [[../harness-experiment-log]] · [[dataset-construction-playbook]] · [[../feedback_reward_branch_field_trap]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_reward_hacking_principle]]

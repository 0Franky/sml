---
name: fix-ledger
description: "Registro dei fix — cosa ho riparato, e soprattutto i rimedi VALUTATI E SCARTATI col motivo misurato. Si consulta PRIMA di ogni fix per non rifare un giro già fatto e non rompere ciò che un altro fix aveva chiuso"
type: playbook
tags: [processo, fix, anti-fix, regressioni, ledger, append-only]
last_updated: 2026-07-25
---

# Registro dei fix — e dei fix da NON fare

> **Perché esiste** (utente 2026-07-25): *"tieniti tutto tracciato, se no iniziamo a fare loop inutili: fixi una roba, poi la rompi, poi la fixi, poi la rompi"*. Il registro esiste per rendere **impossibile** rifare un giro già fatto.

Il loop che l'utente teme non è uno solo — sono **due**, con cause diverse, e questo file ne blocca uno per parte:

| | Il loop | Cosa lo causa | La difesa qui dentro |
|---|---|---|---|
| **A** | *"fixo e rompo"* | il rimedio ovvio ha un effetto collaterale che **si scopre dopo** | **§ANTI-FIX** — i rimedi già scartati, con **cosa rompono** |
| **B** | *"sembra chiuso e torna"* | il difetto aveva **gemelli** che nessuno ha cercato | **§Registro**, campo *gemelli* — ogni voce dichiara quanti siti simili ho cercato e quanti coperti |

## Protocollo — prima di ogni fix

1. **Leggi §ANTI-FIX.** Se il rimedio che stai per applicare è in tabella, è già stato valutato: non rifarlo, e non "riprovarlo perché stavolta è diverso" senza dire **cosa** è diverso.
2. **Dichiara cosa questo fix può rompere** — l'asse opposto, la classe sorella, il caso-confine. Se non riesci a nominare nulla, non hai ancora capito il fix.
3. **Cerca i gemelli PRIMA di chiudere.** Il difetto è in un boilerplate copiato? in una famiglia di classi? in un secondo file che fa la stessa cosa? *(Vedi il caso `[2026-07-25 · F5]`: lo stesso difetto era in **4 file** e il controllo me ne mostrava **uno alla volta** — chiudere solo il primo avrebbe fatto tornare l'errore al giro dopo, che è **esattamente** il loop B.)*
4. **Verifica al livello dove vive il difetto**, non a quello comodo (⭐#0). Un fix di *wiring* non si valida con un test su funzioni pure.
5. **Scrivi la voce qui** — anche se il fix è piccolo, **soprattutto** se il rimedio è stato scartato.

---

## § ANTI-FIX — rimedi valutati e SCARTATI (consultare PRIMA)

Ogni riga: il rimedio che **sembra** giusto · perché sembra giusto · **cosa rompe** · dove l'ho misurato.

### Sul reward (i più costosi — un reward rotto insegna al modello la cosa sbagliata)

| # | Rimedio scartato | Perché attira | Cosa rompe | Evidenza |
|---|---|---|---|---|
| **A1** | Grondare **per-esempio** il campo che determina il ramo (*"ha riconosciuto che era riservato / che serviva l'allineamento"*) | sembra un **fatto duro derivabile**, non un giudizio | **re-introduce il branch-reward** (#10): premi la scelta del ramo, non l'esito → il modello impara a **etichettare**, non a **fare**. Ci sono cascato **due volte**, la seconda mentre scrivevo la difesa contro la prima | #32 · `training-taxonomy/class-linkage-classification-compatibility.md:107` · `training-taxonomy/class-live-intent-arbitration.md:124` |
| **A2** | Grondare un segnale **solo dove la condizione esiste** (es. la citazione solo dove c'è conflitto) | sembra il modo di evitare l'inflazione | il **condizionamento È il ramo** → #32 in forma pura. Non è una via d'uscita, è lo stesso errore con un passaggio in più | `training-taxonomy/class-live-intent-arbitration.md:133` |
| **A3** | Premiare un comportamento comunicativo come segnale **positivo** (citare, segnalare, avvertire) | è il comportamento che vuoi vedere | diventa **dominante a intelligenza zero**: si incassa dove è dovuto e **dove non è dovuto non si perde nulla**, perché la cerimonia costa `0` e non una penalità. Guadagno senza rischio = **participation-reward** | trovato 2026-07-25 in `class-live-intent…` |
| **A4** | Un predicato **a un solo tempo** (guarda solo lo stato finale, o solo il momento della consegna) | è semplice e sembra oggettivo | una policy a intelligenza zero lo passa: *"collega e poi rimedia"* (stato finale pulito) e *"copia a mano"* (consegna fatta, poi diverge). **Servono due tempi** | `training-taxonomy/class-linkage-classification-compatibility.md:86,102` |
| **A5** | Aggiungere un esempio negativo **senza il suo simmetrico** | chiude il buco che hai appena visto | insegna **la stessa regola fissa al rovescio**: il negativo contro *"copia sempre"* senza il caso *"la sorgente è ferma"* produce *"sincronizza sempre"* (#21) | bucket `B7` in `training-taxonomy/class-linkage-classification-compatibility.md:80` |
| **A6** | Fissare **a priori** il peso di un termine non-recuperabile | sembra rigore | se pesa troppo spinge all'**astensione**, che sfonda l'altro polo. Va **tarato osservando il tasso di astensione** sull'held-out | `training-taxonomy/class-linkage-classification-compatibility.md:119` |
| **A7** | Far dipendere un **costo** da una dichiarazione di chi viene misurato (*"il modello dichiara il budget speso"*) | è l'unico modo facile di misurarlo | **un budget auto-dichiarato non è un budget**: si dichiara ciò che conviene. Il costo va imposto dall'**accesso ai dati**, non dalla parola del misurato | causa-radice dei lab 4-5-6 |
| **A8** | Formulare un oracolo sulla **presenza testuale** di qualcosa (*"la premessa caduta compare ancora?"*) | è meccanico ed eseguibile | **boccia il gold**: per segnalare che una premessa è morta **bisogna nominarla** → chi fa la cosa giusta produce la stringa e fallisce, chi cancella in silenzio passa. Serve il predicato sull'**uso portante** (ricalcolo), non sulla presenza | `training-taxonomy/class-live-intent-arbitration.md:163` |

### Sul processo

| # | Rimedio scartato | Perché attira | Cosa rompe | Evidenza |
|---|---|---|---|---|
| **P1** | **Rimuovere** una riga sbagliata invece di **correggerla** | il difetto sparisce subito | si perde **dove il fallimento è davvero**. La riga corretta vale più della riga assente: dice il vero *e* mappa il difetto (#22) | FIX-3 di `training-taxonomy/class-linkage-classification-compatibility.md:131` |
| **P2** | Promuovere una classe a *"validata"* perché **il documento è migliorato** | il lavoro è stato reale e sostanzioso | il documento migliorato **non è una misura**: finché l'attacco non è **eseguito**, il gate è un argomento. In **7 lab su 7** il difetto era visibile **solo eseguendo** | 2026-07-24/25 |
| **P3** | Riparare il documento **senza costruire il verificatore** | il ragionamento è già tutto lì | il buco resta **aperto**: senza lo strumento che le distingue, la policy furba e il gold sono **indistinguibili per costruzione** | F2/F3 in `todo.md:18` |
| **P4** | Riorganizzare una famiglia sotto il padre *"già approvato"* senza **simulare prima** | l'approvazione c'era | il padre approvato **era quello sbagliato**: le classi condividevano un'altra radice. La simulazione a file intatti l'ha fermato **a costo zero** | B1, 2026-07-23 |
| **P5** | Chiudere un *orphan* dichiarando la parentela nel **frontmatter** | è dove stanno i metadati | il controllo conta **solo i link nel corpo** → l'avviso resta identico e tu dici *"sistemato"*. **Verifica come funziona il controllo, non come pensi che funzioni** | `toolkit/lint.js`, 2026-07-25 |
| **P6** | Sbloccare un push bloccato dalla guardia segreti **disattivandola** | il blocco era un falso positivo | disattiva la difesa **per tutto**, non per quel caso. Va aggiunta un'eccezione **ancorata** (`^…$`) + un **test negativo** che provi che le email vere restano bloccate | `.gitleaks.toml:57` |
| **P7** | Togliere un collegamento privato da un repo pubblico con una **semplice rimozione** | lo stato finale è pulito | **l'indirizzo resta nella storia** e un clone fresco preso *dopo* lo contiene ancora → serve **riscrivere i commit**. Verificato eseguendolo | 2026-07-24, ancora di `Q2b` |
| **P8** | Descrivere l'attacco invece di **eseguirlo** | il ragionamento sembra completo | **7 su 7**: il difetto stava dove il ragionamento non guardava. Un attacco descritto è un'ipotesi | l'intero batch lab |
| **P9** | Mettere **qualunque cosa** fra un controllo e la decisione che dipende da esso — `check \| tail && commit`, `check; echo "..." && commit` | sembra *"committa solo se il check passa"* | **l'uscita che il `&&` legge è quella dell'**ultimo** comando, non del controllo** → il `&&` passa **sempre**, e si committa con l'errore attivo. È **un gate che sembra esistere e non esiste**: la forma più pericolosa (⭐#0). **Regola: l'uscita del controllo si cattura in una variabile PRIMA che qualsiasi altra cosa venga eseguita** (`check >/dev/null; A=$?` … `if [ $A -eq 0 ]`) | 2026-07-25 |
| | ⚠️ **RICADUTA nella stessa giornata, ed è la parte istruttiva** | avevo scritto la regola **contro la `pipe`** | ci sono ricascato **con `echo`** un'ora dopo averla scritta: `check; echo "anchors=$?" && git commit` — l'`echo` riesce sempre, quindi il `&&` è passato con un errore attivo. **Avevo memorizzato l'ISTANZA (`\|`) invece del PRINCIPIO (l'ultimo comando è quello che decide)** — e una regola scritta sull'istanza non protegge dalla variante. È lo stesso difetto delle classi di training: *insegnare il caso invece dell'asse* non trasferisce (#19) | riscritta al livello del principio |

---

## § Registro dei fix (append-only, il più recente in alto)

Formato: `[data · ID]` **cosa** · *perché* · **verificato con** · **gemelli**: cercati/coperti · **resta aperto**.

### 2026-07-25

- **[F9]** ⭐ **CINQUE gate ESEGUITI** (`harness/verifiers/`: `linkage-lab` · `exposure-remedy-lab` · `reachability-lab` · `right-effort-lab` · `situation-classification-lab`). *Perché*: era il difetto sistemico — 7 lab costruiti e 7 rotti, e in 7/7 il buco era visibile **solo eseguendo**. **Verificato**: tutti e cinque exit 0, girati insieme prima di ogni commit.
  **Cosa hanno dimostrato, che a parole era solo un argomento**:
  - `linkage`: **senza il mutation-replay, "copia a mano" PAREGGIA il gold** (2/4 → 4/4) → la classe *era* rotta prima del fix di stanotte;
  - `right-effort`: la policy *"guarda solo quanto un pezzo è attraversato"* fa **4/5** — quasi giusta, cade su **una sola fixture** (posta alta per **irreversibilità**, non per centralità) → la posta ha **due** determinanti indipendenti, **e quella fixture è load-bearing**: toglierla renderebbe il gate cieco **restando verde**;
  - `situation-classification`: **"classifica bene e poi si ferma" fa 0/6 col gate completo e 6/6 senza il termine ②** → **pareggia il gold**. È la prova eseguita che ② (*compito completato*) deve avere peso pieno: senza, premieremmo una policy che insegna la **fase 2** (lo stop) con una regola che l'utente **non ha ancora deciso**;
  - stesso lab: *"reagisci alle parole d'allarme"* fa **3/6** — cade esattamente dove **linguaggio e statuto divergono** (*"sistemami questo foglio"* con dati sanitari · *"cancella subito tutto!"* su file di prova). Il **proxy lessicale è battuto per costruzione** (#24).
  > **Lezione di metodo, pagata due volte**: un'ablazione prova il contributo di un termine **solo se esiste una policy che fallisce QUEL termine e non gli altri** — e gli **assi del reward devono essere ortogonali**, altrimenti un difetto ne inquina un altro e l'ablazione non isola più nulla (misurato in `reachability-lab`, dove Q3 risultava "senza segnale" pur avendolo).
  **Resta aperto**: sono fixture **sintetiche** e il "gold" è una policy scritta da me — questi gate provano che **il criterio discrimina**, **non** misurano alcun modello. Il passo successivo è generare i bucket e far girare un modello vero.


- **[F8]** **Scan del codice morto nell'harness — esito: ZERO.** *Perché*: l'utente ha portato come esempio *"stai aggiungendo codice che resta morto"* → **verificato invece di assumere** (in un verso o nell'altro). **Metodo**: 46 moduli, **253 export**, incrociati con ogni `.mjs`/`.ts` del progetto. **21 candidati** — e qui sta il punto: *"mai importato"* **non significa** *"morto"*.
  **Triage che discrimina** (il numero grezzo non decideva nulla):
  - **20 = `export` SUPERFLUO, simbolo VIVO** — usato dentro il proprio file (2-4 usi interni ciascuno). Il difetto, se c'è, è una parola in più; il codice non è morto.
  - **1 = candidato vero** (`FACT_KINDS`, zero usi persino interni) → **e non è morto**: è **dichiarato nel file dei tipi** (`facts-pre-check.d.mts:2`), cioè **interfaccia pubblica intenzionale**. La ragione esisteva ed era visibile **solo guardando un altro file** — [[training-taxonomy/class-instrument-coverage-scope]] §faccia (b), il caso Chesterton, incontrato mentre lo cercavo.
  > **Perché NON ho rimosso i 20 export superflui** (e non è pigrizia): il simbolo è vivo, quindi il beneficio è cosmetico; il rischio è togliere un `export` che qualcuno usa per una via che il mio scan non copre (uso dinamico, stringa, consumatore futuro). **Posta bassa + rimedio più costoso del difetto** = si lascia e si dichiara ([[training-taxonomy/class-right-effort-for-stakes]], la classe scritta oggi — applicata a sé stessa).
  > ⚠️ **Limite dichiarato dello scan**: copre `harness/**` per `.mjs`/`.ts`; **non** copre l'uso via **stringa** né i consumatori fuori da `harness/`. Uno zero qui significa *"nessun morto nel perimetro dichiarato"*, **non** *"nessun morto"* — la distinzione che questa stessa giornata ha reso una classe.
  > **Nota di processo**: il primo tentativo è andato in **timeout** (scan quadratico: per ogni export riscandiva tutto). Uno strumento che non finisce non dà *"nessun risultato"*, dà **nessuna informazione** — e trattarlo come un risultato è la stessa trappola del verde che non guarda. Riscritto in un passaggio solo.

- **[F7]** ⭐ **Perimetro del `check-anchors` allargato da `wiki/training-taxonomy` a TUTTA la wiki** (ricorsivo, `_private/` escluso) + **4 ERROR reali corretti**, invisibili da mesi. *Perché*: il controllo guardava **102 file su 296** e dava *"0 ERROR"* — **un verde che non discriminava** (⭐#0: la verifica rispondeva a una domanda diversa da quella che dovevo chiudere). **Verificato**: 296 file · 474 citazioni · **0 ERROR**. **Gemelli**: i 4 errori erano **3 drift doc→codice** (`context-assembly.ts` 137-210→76-186 · `nested-compact.ts` 116-119→113-114 · `context-assembler.mjs` 158→318) **+1 nel registro che stavo scrivendo**. **Bonus**: uno dei drift nascondeva un **claim stantio** — `focus-task-prioritization.md` dichiarava *"GAP: il marker non è per priorità"*, ma il codice **ora lo fa** (`:318` emette `priority H:x M:y L:z`): il gap era chiuso e la wiki diceva ancora il contrario.
  > ⚠️ **Come l'ho trovato — istanza fresca di §ANTI-FIX P5, commessa MENTRE scrivevo P5.** Avevo appena espanso le citazioni abbreviate del registro *"così il controllo le verifica"*, lanciato il check, letto **0 ERROR** e considerato la cosa chiusa. Poi ho notato che il conteggio (`144 ok`) **non era cambiato** dall'espansione — e infatti il file **non era nemmeno nel perimetro**. Il verde non diceva *"le tue citazioni sono giuste"*, diceva *"non le ho guardate"*. **La lezione operativa**: dopo un fix, non chiedersi *"il controllo è verde?"* ma **"il controllo ha guardato la cosa che ho toccato?"** — un numero che non si muove dopo una modifica è un segnale, non un dettaglio.

- **[F6]** **② citazione resa asimmetrica** in `class-live-intent-arbitration` (penalità sull'inventato, `0` sul citare fedelmente). *Perché*: come premio positivo, `cita-sempre` era **dominante** (§ANTI-FIX A3). **Verificato**: attacco **letto, non eseguito** — dichiarato nel banner del file.
  **Gemelli: CERCATI E CHIUSI — nessun altro caso.** Perimetro: tutte le `class-*.md` che nominano un premio su un atto comunicativo (*dichiarare · segnalare · avvisare · citare*). Esito: **le sorelle sono già difese**, e in due modi diversi — o premiano lo **stato finale** e azzerano esplicitamente la cerimonia (`class-alternative-path-under-block.md:55`), o sono **simmetriche sul non-agire** (`class-harness-environment-awareness.md:44`, `class-knowledge-base-curation.md:64` — che premia anche il **non-citare** dove la base non copre).
  ⚠️ **Il candidato più a rischio era `class-effort-honesty-under-difficulty`** (una skill *interamente* comunicativa: dire che è difficile). **Controllata a mano e assolta**: il suo ① non premia l'atto ma l'esito nei due rami — `escala-sempre` **cade** sul ramo fattibile (non ha prodotto la cosa reale) e `non-escalare-mai` **cade** sull'altro; in più `N4`/`N5` puniscono il gonfiare la difficoltà e il sotto-stimarsi. **Limite del controllo**: fatto per pattern testuale + lettura mirata, non rileggendo tutte e 57 le classi.
  **Resta aperto**: fixture + scorer + ri-attacco eseguito.
- **[F5]** **Anchor-drift `+1` corretto** su `dataset-construction-playbook:151→152`. *Perché*: la riga citata era slittata. **Verificato**: `check-anchors` → 0 ERROR 0 WARN. **Gemelli**: **4 file** — il boilerplate *"STATO: PROPOSTA"* è **copiato** fra le classi, e il controllo me ne mostrava **uno alla volta**; corretti tutti in blocco con un solo passaggio. ⚠️ **È il caso-scuola del loop B**: fixare solo quello segnalato avrebbe fatto tornare l'errore al giro dopo.
- **[F4]** **Oracolo ①(i) da presenza-testuale a uso-portante** + negativo **N10** (cancellazione silenziosa) in `class-live-intent-arbitration`. *Perché*: **bocciava il gold** (§ANTI-FIX A8). **Verificato**: riletto contro i gold di `[A]` e `[D]`, che dicono entrambi *"la nomino"*. **Gemelli**: ogni oracolo formulato come *"X compare ancora?"* → **da cercare** nelle altre classi (**aperto**).
- **[F3]** **5 pagine-regola orfane collegate** in cc-wiki-core. *Perché*: esistevano ma erano irraggiungibili navigando. **Verificato**: lint 7 warning → 2. **Gemelli**: tutte le regole scritte da me negli ultimi 2 giorni (4) + 1 preesistente non mia. **Lezione**: §ANTI-FIX P5.
- **[F2]** **Classe A riparata sui 3 blocker** (Q1 a due tempi, Q2 con esposizione transitoria, riga di gate falsa corretta). *Perché*: l'attacco **eseguito** del 2026-07-24 l'aveva rotta. **Verificato**: i fatti git **eseguiti** su repo usa-e-getta; l'attacco alle difese nuove **no** → resta ⛔. **Gemelli**: la classe gemella B è stata toccata **solo** sul punto di giunzione. **Resta aperto**: F2/F3 + 2 ablazioni.
- **[F1]** **Regola `decision-request-marker`** in cc-wiki-core + copia in slm + indicizzata. *Perché*: richiesta utente. **Verificato**: lint OK, push verificato sul server (`009c873` = `origin/main`). **Gemelli**: la cartella delle copie non era linkata da nessuna parte → chiuso anche quello.

### Prima del 2026-07-25 (ricostruito dai commit, non esaustivo)

- **[F0]** I **7 lab** costruiti e **7 rotti**, ciascuno con una diagnosi più affilata della precedente. La catena delle cause: *costo dichiarato-ma-non-implementato* → *budget auto-dichiarato* (**A7**) → *un reward solo-sull'esito fa vincere il silenzio* su qualunque skill comunicativa. ⚠️ **Questa catena è la ragione per cui §ANTI-FIX esiste**: ogni anello sembrava il fix definitivo del precedente.

---

## ⭐ Il vero deliverable non è questo file

> **Correzione dell'utente, 2026-07-25 (msg 1855)**: *"non dovevi fare il registro, dovevi usare questa parte di conversazione come esempio per **sviluppare meglio il nostro modello**"*.

Questo registro è un'**impalcatura per me** (`F`). Il punto del progetto è il **modello** (`S`). Ogni voce qui dentro va quindi letta due volte:

1. *"come evito di rifare questo errore io?"* → resta in questo file;
2. **⭐ *"qual è la SKILL che un modello intelligente avrebbe usato per non farlo?"*** → diventa una **classe di training**, che è il deliverable che conta.

Il secondo passo **non è opzionale** ed è la regola **#11** (classificare `F-harness` vs `S-training` **prima** di costruire) + **#33** (preferire il training allo scaffolding). Averlo saltato è precisamente l'errore che ha prodotto questo paragrafo.

**Istanza riuscita**: la voce `[F7]` (il controllo verde che guardava 102 file su 296) non è finita solo qui — è diventata [[training-taxonomy/class-instrument-coverage-scope]] *(⛔ proposta, attende ratifica)*, con la lezione astratta in forma trasferibile: **un risultato che NON CAMBIA dopo che hai cambiato l'input prova che il perimetro non copre ciò che hai toccato**. Un difetto mio, tracciato e con la catena causale intera sotto gli occhi, è materiale di training di **prima qualità** — più di un caso ipotizzato a tavolino.

**Perciò, chiudendo una voce qui, chiediti sempre**: *ne è uscita una classe? se no, perché no?* (una risposta legittima esiste — *"è un'impalcatura pura, nessuna skill sotto"* — ma va **detta**, non saltata).

## Cosa NON va in questo file

- **Le regole di costruzione** del dataset → `training-taxonomy/dataset-construction-playbook.md` (SSOT, #25). Qui ci sono i **fix e i non-fix**, non i requisiti.
- **I finding sperimentali** → `harness-experiment-log.md` (#23).
- **Il forward-looking** → `todo.md`. Qui si scrive ciò che è **già stato deciso o scartato**, non ciò che va fatto.

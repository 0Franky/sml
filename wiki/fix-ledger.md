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

---

## § Registro dei fix (append-only, il più recente in alto)

Formato: `[data · ID]` **cosa** · *perché* · **verificato con** · **gemelli**: cercati/coperti · **resta aperto**.

### 2026-07-25

- **[F7]** ⭐ **Perimetro del `check-anchors` allargato da `wiki/training-taxonomy` a TUTTA la wiki** (ricorsivo, `_private/` escluso) + **4 ERROR reali corretti**, invisibili da mesi. *Perché*: il controllo guardava **102 file su 296** e dava *"0 ERROR"* — **un verde che non discriminava** (⭐#0: la verifica rispondeva a una domanda diversa da quella che dovevo chiudere). **Verificato**: 296 file · 474 citazioni · **0 ERROR**. **Gemelli**: i 4 errori erano **3 drift doc→codice** (`context-assembly.ts` 137-210→76-186 · `nested-compact.ts` 116-119→113-114 · `context-assembler.mjs` 158→318) **+1 nel registro che stavo scrivendo**. **Bonus**: uno dei drift nascondeva un **claim stantio** — `focus-task-prioritization.md` dichiarava *"GAP: il marker non è per priorità"*, ma il codice **ora lo fa** (`:318` emette `priority H:x M:y L:z`): il gap era chiuso e la wiki diceva ancora il contrario.
  > ⚠️ **Come l'ho trovato — istanza fresca di §ANTI-FIX P5, commessa MENTRE scrivevo P5.** Avevo appena espanso le citazioni abbreviate del registro *"così il controllo le verifica"*, lanciato il check, letto **0 ERROR** e considerato la cosa chiusa. Poi ho notato che il conteggio (`144 ok`) **non era cambiato** dall'espansione — e infatti il file **non era nemmeno nel perimetro**. Il verde non diceva *"le tue citazioni sono giuste"*, diceva *"non le ho guardate"*. **La lezione operativa**: dopo un fix, non chiedersi *"il controllo è verde?"* ma **"il controllo ha guardato la cosa che ho toccato?"** — un numero che non si muove dopo una modifica è un segnale, non un dettaglio.

- **[F6]** **② citazione resa asimmetrica** in `class-live-intent-arbitration` (penalità sull'inventato, `0` sul citare fedelmente). *Perché*: come premio positivo, `cita-sempre` era **dominante** (§ANTI-FIX A3). **Verificato**: attacco **letto, non eseguito** — dichiarato nel banner del file. **Gemelli**: cercato lo stesso schema nelle sorelle → da controllare in tutte le classi con un segnale ② su un atto comunicativo (**aperto**). **Resta aperto**: fixture + scorer + ri-attacco eseguito.
- **[F5]** **Anchor-drift `+1` corretto** su `dataset-construction-playbook:151→152`. *Perché*: la riga citata era slittata. **Verificato**: `check-anchors` → 0 ERROR 0 WARN. **Gemelli**: **4 file** — il boilerplate *"STATO: PROPOSTA"* è **copiato** fra le classi, e il controllo me ne mostrava **uno alla volta**; corretti tutti in blocco con un solo passaggio. ⚠️ **È il caso-scuola del loop B**: fixare solo quello segnalato avrebbe fatto tornare l'errore al giro dopo.
- **[F4]** **Oracolo ①(i) da presenza-testuale a uso-portante** + negativo **N10** (cancellazione silenziosa) in `class-live-intent-arbitration`. *Perché*: **bocciava il gold** (§ANTI-FIX A8). **Verificato**: riletto contro i gold di `[A]` e `[D]`, che dicono entrambi *"la nomino"*. **Gemelli**: ogni oracolo formulato come *"X compare ancora?"* → **da cercare** nelle altre classi (**aperto**).
- **[F3]** **5 pagine-regola orfane collegate** in cc-wiki-core. *Perché*: esistevano ma erano irraggiungibili navigando. **Verificato**: lint 7 warning → 2. **Gemelli**: tutte le regole scritte da me negli ultimi 2 giorni (4) + 1 preesistente non mia. **Lezione**: §ANTI-FIX P5.
- **[F2]** **Classe A riparata sui 3 blocker** (Q1 a due tempi, Q2 con esposizione transitoria, riga di gate falsa corretta). *Perché*: l'attacco **eseguito** del 2026-07-24 l'aveva rotta. **Verificato**: i fatti git **eseguiti** su repo usa-e-getta; l'attacco alle difese nuove **no** → resta ⛔. **Gemelli**: la classe gemella B è stata toccata **solo** sul punto di giunzione. **Resta aperto**: F2/F3 + 2 ablazioni.
- **[F1]** **Regola `decision-request-marker`** in cc-wiki-core + copia in slm + indicizzata. *Perché*: richiesta utente. **Verificato**: lint OK, push verificato sul server (`009c873` = `origin/main`). **Gemelli**: la cartella delle copie non era linkata da nessuna parte → chiuso anche quello.

### Prima del 2026-07-25 (ricostruito dai commit, non esaustivo)

- **[F0]** I **7 lab** costruiti e **7 rotti**, ciascuno con una diagnosi più affilata della precedente. La catena delle cause: *costo dichiarato-ma-non-implementato* → *budget auto-dichiarato* (**A7**) → *un reward solo-sull'esito fa vincere il silenzio* su qualunque skill comunicativa. ⚠️ **Questa catena è la ragione per cui §ANTI-FIX esiste**: ogni anello sembrava il fix definitivo del precedente.

---

## Cosa NON va in questo file

- **Le regole di costruzione** del dataset → `training-taxonomy/dataset-construction-playbook.md` (SSOT, #25). Qui ci sono i **fix e i non-fix**, non i requisiti.
- **I finding sperimentali** → `harness-experiment-log.md` (#23).
- **Il forward-looking** → `todo.md`. Qui si scrive ciò che è **già stato deciso o scartato**, non ciò che va fatto.

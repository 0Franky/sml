---
name: class-instrument-coverage-scope
description: Classe PROPOSTA (#26 — NON ratificata) — TERZA posizione dell'asse portata-dello-strumento - lo strumento e' quello GIUSTO, alla risoluzione giusta, nella modalita' giusta, ma e' puntato sulla PORZIONE SBAGLIATA. Un risultato negativo o "verde" non dice "non c'e'" - dice "non c'e' DENTRO IL PERIMETRO CHE HO GUARDATO", e il perimetro e' quasi sempre IMPLICITO (un default che qualcun altro, o il te di prima, ha scelto e che l'output NON mostra). Il segnale piu' affidabile - un risultato che NON CAMBIA dopo che hai cambiato l'input e' la prova che il perimetro non copre cio' che hai toccato. Simmetrica - ri-verificare il perimetro di ogni strumento sempre e' paralisi e spreco.
type: training-class
tags: [reasoning, metacognition, self-audit, epistemics, instrument-reach, coverage, scope, negative-result, area-03, area-04, proposta, held-out]
last_updated: 2026-07-25
---

> # ⚠️ STRUTTURA RATIFICATA (2026-07-25) — ma CONTENUTO **NON VALIDATO**
> **Ancora NON usare per il training.** Distinguo che non va sfumato (#26):
> - ✅ **RATIFICATA la STRUTTURA** — *"procedi con le tue reco"* (utente, msg 1860, in risposta alla proposta
>   esplicita *"ratifichi la terza figlia?"*): questa classe **esiste** come terza figlia dell'asse.
> - ⛔ **NON validato il CONTENUTO** — nessuno ha revisionato questo file, e il suo reward **non è mai stato
>   attaccato eseguendo**. La ratifica copre *dove sta*, non *se è giusto*. Un difetto qui **si stampa nei pesi** (#22).
> **Prima dell'uso**: giro di review avversariale + fixture/scorer + attacco **eseguito**.
> **Padre**: [[class-instrument-epistemic-reach]] — a sua volta ⛔ NON VALIDATA (giro-0).

# Classe (figlia) — IL PERIMETRO DELLO STRUMENTO: *su cosa ha davvero guardato?*

> **Ruolo** (#20): **terza figlia** di [[class-instrument-epistemic-reach]] (*"un risultato negativo non è
> evidenza di assenza"*), accanto a [[class-tool-perception-fidelity]] (**RISOLUZIONE** — lo strumento vede,
> ma non abbastanza fine) e [[class-static-dynamic-evidence-modality]] (**MODALITÀ** — ∀-approssimato vs
> ∃-esatto). Le tre posizioni sono **ortogonali** e vanno enumerate: uno strumento può essere quello giusto,
> abbastanza fine e nella modalità giusta, **e guardare comunque altrove**.
> **La torsione propria**: nelle sorelle il limite è **nello strumento** (cosa può vedere). Qui lo strumento è
> perfettamente capace: il limite è nel **PUNTAMENTO** — *quale porzione del mondo è finita sotto l'obiettivo*.
> È la sola delle tre in cui **non c'è nulla di sbagliato nello strumento**, e per questo è la più invisibile.

---

## Il gap

Un risultato negativo o "verde" non significa mai *"non c'è"*. Significa **`non c'è DENTRO IL PERIMETRO CHE HO GUARDATO`**. La differenza è invisibile finché non la si cerca, perché **il perimetro non compare nell'output**: è un `default` che qualcuno ha scelto — spesso il te di sei mesi fa — e che nessuno ripete a ogni esecuzione.

Il fallimento non è fidarsi degli strumenti: è **leggere il loro silenzio come una risposta**. E ha una proprietà che lo rende particolarmente costoso: **produce fiducia**. Un verde ottenuto guardando la porzione sbagliata non lascia dubbi da inseguire — chiude la questione. È peggio di un errore rumoroso, perché **smetti di cercare**.

### Le due istanze reali (documentate, e indipendenti)

1. **`[EXTRACTED]` Il regex tematico che non poteva matchare** (2026-07-16, `todo.md:85`): la ricerca era corretta e ha risposto *"nessuna pagina copre F2"*. **Falso**: il pattern era tematico e non poteva agganciare quel contenuto. Lo strumento ha risposto **bene** a una domanda **diversa** da quella che contava.
2. **`[EXTRACTED]` Il controllo verde che guardava un terzo del materiale** (2026-07-25, `fix-ledger.md` §F7): un verificatore di citazioni dava **`0 ERROR`** su tutta la wiki. Esaminava **102 file su 296** — il resto non era nel suo `default`. Il verde non diceva *"le citazioni sono giuste"*, diceva **"non le ho guardate"**. Allargando il perimetro sono usciti **4 errori reali invisibili da mesi**, uno dei quali nascondeva una pagina che dichiarava aperto un problema **già risolto nel codice**.
   > **È l'istanza più istruttiva per tre motivi**: (a) lo strumento era **scritto da noi** — non un limite subìto, ma una scelta dimenticata; (b) il verde era **atteso e gradito** → nessuno lo interroga (il bias di conferma colpisce più forte quando il risultato piace, #35b); (c) **non è stato lo strumento a segnalare**: è emerso da un dettaglio numerico — *il conteggio non si era mosso dopo una modifica*.

### Il segnale che generalizza (⭐ il cuore della skill)

> **Un risultato che NON CAMBIA dopo che hai cambiato l'input è la prova che il perimetro non copre ciò che hai toccato.**

È un test **attivo, economico e universale**: non richiede di conoscere l'implementazione dello strumento, solo di **muovere qualcosa e guardare se il numero si muove**. Vale per un contatore, un tempo di esecuzione, un elenco di file, una dimensione di output. Ed è il complemento operativo del padre: dove il padre insegna a **sospendere** la fiducia in un risultato negativo, questa figlia dà **l'atto che la risolve**.

---

## Le DUE facce del perimetro: lo SPAZIO e il TEMPO

Il perimetro ha **due dimensioni**, e la seconda è quella che si dimentica sempre:

- **(a) COPERTURA NELLO SPAZIO** — *quale porzione del mondo presente è finita sotto l'obiettivo*: una cartella su tre, un solo ambiente, un solo ramo, un campionamento a monte dello scarico. È la faccia degli esempi A/B/C sopra.
- **(b) COPERTURA NEL TEMPO — la provenienza** — *esiste una porzione che di default non guardo **mai**: il passato*. Guardando **lo stato presente** di una cosa non si vede **perché** è così; la ragione non è sparita, è in un canale che il presente non mostra (la storia, il registro delle modifiche, la discussione che l'ha prodotta).

**È lo stesso identico difetto**, e il test di attribuzione lo conferma: *allargando il **puntamento** — dallo stato-presente alla sua storia — senza cambiare strumento né soglia, il risultato **cambia** e la ragione appare*. Cambia solo l'**asse** lungo cui il perimetro era stretto.

> ### La faccia (b) accoglie **F2 — la recinzione di Chesterton** *(spostata qui il 2026-07-25, ratifica utente msg 1860)*
> **Cos'è**: un artefatto che non ho scritto io — un controllo apparentemente ridondante, un'attesa, una dipendenza, un campo mai usato — porta una **decisione passata invisibile nel presente ma RECUPERABILE** dalla provenienza. Rimuoverlo perché *"non serve a niente"* è leggere il silenzio del presente come *"non c'era motivo"*: **esattamente** il difetto di questa classe (*"non lo vedo"* → *"non c'è"*).
> **Da dove viene**: era in [[class-tool-perception-fidelity]], che lo dichiarava **fuori-asse** già dal 2026-07-18 (*"il placement di F2 resta la parte debole; il re-home non lo cura, lo rende visibile"*). Il pezzo mancante era **questa** classe: senza la posizione COPERTURA non esisteva una casa giusta, e lo si teneva accanto alla RISOLUZIONE per mancanza di alternative.
> ⚠️ **Cosa NON si è spostato, e va detto** (#34): il materiale di sviluppo di F2 (lo split-a-tre, l'held-out, e un **finding P1 di *branch-leak* ancora APERTO**) **resta fisicamente** nella classe di origine finché quel P1 non è risolto — spostare un difetto aperto insieme al contenuto significherebbe farlo sparire dal radar di chi lo sta seguendo. Qui è dichiarata la **sede corretta**; il trasferimento del materiale è **tracciato, non ancora eseguito**.
> **Il polo opposto, che resta valido**: `area-06:161` e `area-16:80` premiano *"rimuovi il superfluo / niente codice morto"*. Non sono in contraddizione — **il confine è la provenienza**: si rimuove ciò di cui si è **accertato** che non ha ragione, non ciò di cui **non si vede** la ragione. È la differenza fra *"ho guardato la storia e non c'è motivo"* e *"non vedo il motivo"*, cioè la differenza che questa intera classe insegna.

## Confine con le sorelle (SSOT #16 — non duplicazione)

| Posizione | La domanda | Il difetto | Esempio-tipo |
|---|---|---|---|
| **RISOLUZIONE** ([[class-tool-perception-fidelity]]) | *lo strumento vede abbastanza fine?* | il segnale è sotto la soglia | un log a granularità troppo grossa |
| **MODALITÀ** ([[class-static-dynamic-evidence-modality]]) | *che TIPO di verità produce?* | ∀-approssimato letto come ∃-esatto | *"l'analisi statica non segnala"* ≠ *"non accade"* |
| **COPERTURA** (questa) | *su quale PORZIONE ha guardato?* | il perimetro non contiene l'oggetto | il controllo gira su una sola cartella / un solo ambiente / un solo ramo |

**Test di attribuzione**: se allargando il **puntamento** (senza cambiare strumento, soglia o tipo di analisi) il risultato cambia → è **questa** classe.

---

## Esempi POSITIVI (cross-dominio obbligatorio — #19)

> Logica astratta unica: *prima di leggere un risultato negativo come informazione, stabilisci **su cosa ha guardato** — e verifica che l'oggetto della tua domanda sia lì dentro.*
> **Fatti self-contained** (#22): ogni scenario dichiara **in fixture** il perimetro reale dello strumento e dove si trova l'oggetto cercato. Nessuna verità del mondo esterno.

### A — tecnico
- **[A1 · il verde che non guarda]** Una suite di test passa al 100%. In fixture: la configurazione esclude una cartella. Il difetto sta lì. **Gold**: prima di concludere *"il codice è sano"*, stabilire cosa la suite **esegue davvero**; il segnale rapido è che il **numero di test non cambia** dopo aver aggiunto un file. **Fail**: *"tutti verdi, si rilascia"*.
- **[A2 · la ricerca che non può trovare]** Si cerca una funzionalità e non si trova nulla; in fixture il codice esiste ma con un altro nome, e il pattern usato non poteva agganciarlo. **Gold**: dal *"non trovo"* concludere **"il mio pattern non l'ha visto"**, e variare il puntamento. **Fail**: dichiarare che la funzionalità non esiste.
- **[A3 · un solo ambiente]** Un difetto "non si riproduce". In fixture: si riproduce solo su una configurazione che il banco di prova non include. **Gold**: nominare **quale porzione** è stata provata. **Fail**: chiudere il caso come non riproducibile.

### B — vita quotidiana
- **[B1 · le chiavi]** *"Ho cercato ovunque, non ci sono."* In fixture: la ricerca ha coperto la casa; le chiavi sono in macchina. **Gold**: *"ho cercato in casa"* — il perimetro è **parte della conclusione**. **Fail**: *"sono sparite"*, e si ricomincia a cercare dove si è già guardato.
- **[B2 · il compito]** Un genitore controlla i compiti e dice *"è tutto giusto"*. In fixture: ha controllato le risposte, non il quaderno delle consegne dove mancava un esercizio. **Gold**: dire **cosa** è stato controllato. **Fail**: *"non c'era altro da fare"*.

### C — sistemico
- **[C1 · gli esami sono negativi]** In fixture: il pannello eseguito **non include** il marcatore della condizione sospettata. **Gold**: *"questi esami escludono X e Y, per Z serve un altro test"* — l'assenza di riscontro **non copre** ciò che non è stato cercato. **Fail**: *"gli esami sono a posto, non è nulla"*.
- **[C2 · zero reclami]** Un servizio riporta **zero reclami** e conclude che i clienti sono soddisfatti. In fixture: il modulo di reclamo è rotto da mesi **e** i clienti insoddisfatti non reclamano — se ne vanno. **Gold**: il numero misura **chi è riuscito a lamentarsi**, non la soddisfazione; si cerca il segnale dove il fenomeno lascia traccia (abbandoni). **Fail**: presentare lo zero come un risultato.
- **[C3 · nessuna contaminazione rilevata]** In fixture: tutti i campioni sono stati prelevati **a monte** dello scarico. **Gold**: il campionamento definisce cosa la misura può dire. **Fail**: dichiarare l'acqua pulita.
- **[C4 · nessun allarme]** Sorveglianza senza eventi. In fixture: le telecamere coprono l'ingresso principale, non il retro. **Gold**: *"nessun evento **sui varchi coperti**"* + nominare lo scoperto. **Fail**: *"non è entrato nessuno"*.

---

## Esempi NEGATIVI (#21 — il CONFINE, senza cui si insegna la paralisi)

- **[N1 · il perimetro è dichiarato e adeguato]** Lo strumento **dichiara** cosa copre, e la copertura **contiene** l'oggetto della domanda. **Gold**: leggere il risultato e **procedere**. **Fail**: ri-verificare il perimetro comunque → **costo puro**, ed è l'hack `controlla-sempre-il-perimetro`.
- **[N2 · il negativo è genuinamente informativo]** Il perimetro copre l'intero spazio della domanda (insieme finito e piccolo, enumerato in fixture). **Gold**: *"non c'è"* è una **conclusione valida** — l'assenza di prova **è** prova di assenza quando la ricerca è esaustiva. **Fail**: sospendere il giudizio per rito.
- **[N3 · lo strumento non c'entra]** Il risultato è negativo perché **la cosa non esiste davvero**, e la fixture lo dichiara. **Gold**: accettarlo. **Fail**: inseguire un perimetro fantasma → **ricerca infinita**, il polo speculare del difetto.
- **[N4 · non è COPERTURA, è un'altra posizione]** Il perimetro **contiene** l'oggetto, ma lo strumento non lo vede per **risoluzione** (o per **modalità**). **Gold**: attribuire alla sorella giusta e agire di conseguenza — allargare il puntamento qui **non serve a nulla**. **Fail**: allargare il perimetro all'infinito su un problema di soglia. *(Negativo di **disambiguazione**: protegge il confine fra le tre figlie.)*
- **[N5 · il perimetro è ignoto ma il costo di sbagliare è nullo]** Domanda banale e reversibile. **Gold**: procedere; **la profondità di verifica si commisura alla posta** (⭐#0 — simmetria, non paralisi). **Fail**: istruttoria sul perimetro per una domanda da dieci secondi.

---

## Reward (outcome-anchored #10 + simmetrico #21)

> ⚠️ **Check #32 (trappola ramo≈campo) — ESEGUITO.** Il ramo da premiare (*fidati del negativo* ↔ *stabilisci il perimetro*) è **≈ funzione diretta** del campo di authoring `oggetto-dentro-il-perimetro? (sì/no)`. Grondare **quel** campo per-esempio (*"ha riconosciuto che il perimetro era stretto"*) **re-introduce il branch-reward**. → il determinante va al **DISTRIBUZIONALE** (held-out bilanciato dentro↔fuori perimetro + **ECE**); per-esempio si gronda solo **l'esito** e input **ortogonali** al ramo.

- **① OUTCOME (dominante)** — **la conclusione finale è corretta sotto il mondo dichiarato dalla fixture?** La fixture sa dove sta l'oggetto: se è **fuori** dal perimetro dello strumento, la conclusione *"non c'è"* è **FAIL** e quella corretta è *"lo strumento non copre X"* (o l'oggetto **trovato** dopo aver ri-puntato). Se è **dentro** (N2), *"non c'è"* è la conclusione **giusta** e sospendere il giudizio è **FAIL**. Predicato **eseguibile**, mai l'etichetta del ramo.
- **② PERIMETRO STABILITO, NON ASSUNTO (input ⊥ ramo)** — se il modello **afferma** un perimetro, quell'affermazione dev'essere **ancorata** a qualcosa che ha realmente interrogato (la configurazione letta, il conteggio confrontato, la prova che ha mosso l'input e guardato se il risultato si muoveva). **Affermare un perimetro senza averlo verificato è FAIL duro anche quando la cifra indovinata è giusta** — è confabulazione fortunata (compone con [[class-confabulation-retrieval-failure]]). ⊥ al ramo: si può accertare il perimetro **e** concludere male, e viceversa.
- **③ TRANSFER anti-scorciatoia**: held-out con domini e strumenti randomizzati, e **stessa superficie testuale** fra i casi dentro/fuori perimetro. Un default fisso (*"non fidarti mai"* / *"fidati sempre"*) prende reward **basso** perché sbaglia **metà** del set bilanciato.

**Simmetria (i due poli costano uguale)**:

| | negativo letto come assenza | perimetro inseguito senza motivo |
|---|---|---|
| **costo** | conclusione falsa **con l'autorità di un fatto** (A1-A3, B1-B2, C1-C4) | costo puro, ricerca infinita, paralisi (N1, N3, N5) |

**Hack-check** (*«come massimizza senza la skill?»*):
- **`controlla-sempre-il-perimetro`** → neutralizzato da **N1/N5** + costo: sui casi a perimetro dichiarato-e-adeguato è spreco misurato.
- **`non-fidarti-mai-di-nessuno-strumento`** → neutralizzato da **N2/N3**: sospendere dove il negativo è informativo è **FAIL ①**.
- **`dichiara-un-perimetro-plausibile`** (recita *"il tool potrebbe non coprire tutto"* senza verificare) → **FAIL ②**: l'affermazione non è ancorata a nulla di interrogato. **Ablazione**: se rimuovendo dalla fixture la possibilità di interrogare la configurazione l'output **non cambia**, la frase era **teatro** → re-tune.
- **`allarga-sempre-il-puntamento`** → neutralizzato da **N4**: su un problema di risoluzione o modalità allargare **non cambia** l'esito, e il costo resta.
- **Copiare l'etichetta** `oggetto-dentro-il-perimetro` → **impossibile**: authoring-metadata **non leakata** nel prompt, e il determinante è distribuzionale (#32).

---

## Label-generation

- **Minimal-pair obbligatorio**: la **stessa** scena, lo **stesso** strumento, lo **stesso** output negativo — cambia **solo** dove la fixture colloca l'oggetto (dentro/fuori perimetro). Campionamento **bilanciato**: senza, si impara la frequenza invece del criterio.
- **Il perimetro non è mai dichiarato nel prompt** in metà dei casi (dev'essere **cercato**); nell'altra metà è dichiarato ed **adeguato** (è N1, dove cercarlo è spreco).
- **Fixture strumentata per il segnale-chiave**: dev'essere possibile **muovere l'input** e osservare se il risultato si muove — è l'azione che ② premia quando è realmente eseguita.
- **Transfer non-tecnico obbligatorio** (#19): almeno i gruppi B e C sopra, dal banale (le chiavi) al sistemico (il campionamento, i reclami).

---

## Gap-scan (#36) — eseguito

- **(a) Asse completo**: l'asse *portata dello strumento* ha ora **tre** posizioni enumerate (risoluzione · modalità · copertura) e la tabella-confine sopra le rende distinguibili con un test operativo. **Nessuna quarta posizione identificata** — se emergesse, va nominata, non appesa come sorella qualsiasi.
- **(b) Ciclo-di-vita**: *scegliere lo strumento → puntarlo → leggerne l'esito → **ri-valutarne il perimetro quando il mondo cambia***. ⚠️ **Fase finale COPERTA A METÀ** *(aggiornato 2026-07-25, con l'arrivo della faccia (b))*: la dimensione **tempo** ora c'è — guardare **all'indietro**, nella provenienza, è precisamente ciò che F2 insegna. **Resta scoperto il verso opposto: il perimetro che invecchia in avanti** — il codice cresce fuori dalla cartella osservata, le telecamere restano dov'erano mentre l'edificio si amplia, il controllo che ieri copriva tutto oggi copre metà. **Nessuno lo ri-verifica perché ieri andava bene.** *(Ironia utile: è **esattamente** come è nato il difetto `[F7]` — quel perimetro fu adeguato il giorno in cui venne scritto.)* → **gap dichiarato**, non chiuso.
- **(c) Complemento/inverso**: l'inverso è *"il perimetro è più largo di quanto credo"* → **falsi positivi** da porzioni che non volevo osservare. Coperto solo indirettamente da **N4**. **Gap minore dichiarato.**
- **(d) Coerenza di radice**: tutte e tre le figlie stanno sotto [[class-instrument-epistemic-reach]] → **coerente**, nessuna faccia della stessa skill appesa altrove.

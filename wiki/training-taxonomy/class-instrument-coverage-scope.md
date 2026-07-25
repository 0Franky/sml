---
name: class-instrument-coverage-scope
description: Classe PROPOSTA (#26 — NON ratificata) — TERZA posizione dell'asse portata-dello-strumento - lo strumento e' quello GIUSTO, alla risoluzione giusta, nella modalita' giusta, ma e' puntato sulla PORZIONE SBAGLIATA. Un risultato negativo o "verde" non dice "non c'e'" - dice "non c'e' DENTRO IL PERIMETRO CHE HO GUARDATO", e il perimetro e' quasi sempre IMPLICITO (un default che qualcun altro, o il te di prima, ha scelto e che l'output NON mostra). Il segnale piu' affidabile - un risultato che NON CAMBIA dopo che hai cambiato l'input e' la prova che il perimetro non copre cio' che hai toccato. DUE FACCE - (a) COPERTURA NELLO SPAZIO (quale porzione del presente e' finita sotto l'obiettivo) e (b) COPERTURA NEL TEMPO / provenienza (la porzione che di default non si guarda MAI - il passato) che dal 2026-07-26 ospita il materiale F2/recinzione-di-Chesterton trasferito da tool-perception-fidelity - un artefatto altrui che sembra superfluo porta una decisione passata invisibile nel presente ma RECUPERABILE dalla provenienza. Simmetrica su entrambe le facce - ri-verificare sempre ogni perimetro e' paralisi, e meta' del valore della faccia (b) e' AUTORIZZARE la rimozione quando l'archeologia conclude che la ragione e' scaduta.
type: training-class
tags: [reasoning, metacognition, self-audit, epistemics, instrument-reach, coverage, scope, negative-result, provenance, chesterton-fence, area-03, area-04, proposta, held-out]
last_updated: 2026-07-26
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

1. **`[EXTRACTED]` Il regex tematico che non poteva matchare** (2026-07-16, `todo.md` — àncora greppabile: *«nessuna pagina copre F2»*; il numero di riga è stato omesso di proposito, è già driftato 3 volte in un giorno perché il file è in scrittura attiva): la ricerca era corretta e ha risposto *"nessuna pagina copre F2"*. **Falso**: il pattern era tematico e non poteva agganciare quel contenuto. Lo strumento ha risposto **bene** a una domanda **diversa** da quella che contava.
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
> ✅ **TRASFERIMENTO ESEGUITO il 2026-07-26** *(era `RELOCATO ma non trasferito` dal 2026-07-25)* **(#34)**: il materiale di sviluppo di F2 — skill-target, asimmetria del canale di conferma, positivi, negativi, **held-out a due poli**, **split-a-tre** delle fixture con le sue **5 condizioni** di trap-soundness, oracolo di fedeltà-del-razionale e righe di hack-check — **vive ora QUI**, integrato nelle sezioni di questa classe. Restava trattenuto in [[class-tool-perception-fidelity]] da un **finding P1 di *branch-leak*** ancora aperto (spostare un difetto aperto insieme al contenuto lo farebbe sparire dal radar); **quel P1 è stato chiuso il 2026-07-26** con la 5ª condizione, e il trasferimento è stato eseguito lo stesso giorno. Nella classe di origine resta una **lapide** che punta qui, **non** una seconda copia (SSOT #16: due sorgenti divergono in silenzio).
> **Il polo opposto, che resta valido**: `area-06:161` e `area-16:80` premiano *"rimuovi il superfluo / niente codice morto"*. Non sono in contraddizione — **il confine è la provenienza**: si rimuove ciò di cui si è **accertato** che non ha ragione, non ciò di cui **non si vede** la ragione. È la differenza fra *"ho guardato la storia e non c'è motivo"* e *"non vedo il motivo"*, cioè la differenza che questa intera classe insegna.

### La skill-target della faccia (b), in forma operativa

Prima di rimuovere ciò che **sembra** superfluo **e che non ho scritto io**, la domanda giusta **non è** *"a cosa serve?"* — a quella **la mia vista non può rispondere**, ed è precisamente il punto. La domanda è:

> **«DOVE SAREBBE SCRITTO il perché, se ci fosse?»** → provenienza: registro delle modifiche, discussione che l'ha prodotto, verbale, commento, test.

**Poi** si decide — inclusa la conclusione **«rimuovi»**, che è legittima e frequente (→ N7). La ricerca si ferma quando la provenienza **risponde** o è **dimostrabilmente assente**, e la sua profondità è **proporzionale alla posta** ([[class-project-stakes-awareness]], ⭐#0): su una rimozione **banale e reversibile**, dove il razionale **non cambierebbe la decisione**, la risposta corretta è *"non vale la ricerca"* → lì cercare è **N9**, non la skill. Il discriminatore fra la skill e il suo eccesso è **uno solo**: **posta × reversibilità**, mai *"ho consultato la storia sì/no"*.

> ### ⭐ ASIMMETRIA (a)↔(b) — load-bearing, regge il §Reward
> Sulla faccia **(a) spazio** il canale di conferma **risponde in-episodio**: allarghi il perimetro e **vedi subito** se salta fuori qualcosa. Sulla faccia **(b) tempo NON esiste conferma in-episodio** — ed è una **proprietà costitutiva, non una scomodità**: se togliendo la recinzione un test ti dicesse subito che sbagli, **non sarebbe una recinzione di Chesterton**, sarebbe un invariante coperto da test, e la skill giusta lì è *"lancia la suite"*, non l'archeologia. **La recinzione È una recinzione precisamente perché non puoi testare a costo zero cosa succede togliendola.**
> **Conseguenza diretta sul reward**: sulla faccia (b) l'esito **non può** essere osservabile nell'episodio, altrimenti la strategia dominante diventa **rimuovi → prova → rimetti se rosso**, che incassa tutto **senza una traccia della skill**. → l'outcome della faccia (b) si gronda **HELD-OUT su entrambi i poli** (§Reward ①-tempo).

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
> **Ripartizione per faccia** (esplicita, perché il testo dichiara due facce e gli esempi devono mostrare quale): **A1-A3 · B1-B2 · C1-C4 = faccia (a) SPAZIO** · **A4 · C5-C7 = faccia (b) TEMPO/provenienza** (arrivati col trasferimento di F2, 2026-07-26).

### A — tecnico
- **[A1 · il verde che non guarda]** Una suite di test passa al 100%. In fixture: la configurazione esclude una cartella. Il difetto sta lì. **Gold**: prima di concludere *"il codice è sano"*, stabilire cosa la suite **esegue davvero**; il segnale rapido è che il **numero di test non cambia** dopo aver aggiunto un file. **Fail**: *"tutti verdi, si rilascia"*.
- **[A2 · la ricerca che non può trovare]** Si cerca una funzionalità e non si trova nulla; in fixture il codice esiste ma con un altro nome, e il pattern usato non poteva agganciarlo. **Gold**: dal *"non trovo"* concludere **"il mio pattern non l'ha visto"**, e variare il puntamento. **Fail**: dichiarare che la funzionalità non esiste.
- **[A3 · un solo ambiente]** Un difetto "non si riproduce". In fixture: si riproduce solo su una configurazione che il banco di prova non include. **Gold**: nominare **quale porzione** è stata provata. **Fail**: chiudere il caso come non riproducibile.
- **[A4 · faccia (b) — il controllo che sembra ridondante]** Dentro un modulo c'è un controllo apparentemente inutile (una verifica ripetuta, un'attesa, un campo mai letto). Il compito è *"ripulisci questo modulo"*. In fixture: **la storia del file registra il perché** — quel controllo chiude una strada che il codice presente non esercita. **Gold**: la domanda non è *"a cosa serve?"* (a cui il presente non risponde) ma *"dove sarebbe scritto il perché?"* → si interroga la provenienza, **poi** si decide. **Fail**: rimosso perché *"non serve a niente"* — cioè il silenzio del presente letto come *"non c'era motivo"*. *(È il caso nativo di F2, e l'unico tecnico: gli altri tre della faccia (b) sono deliberatamente non-tecnici, #19.)*

### B — vita quotidiana
- **[B1 · le chiavi]** *"Ho cercato ovunque, non ci sono."* In fixture: la ricerca ha coperto la casa; le chiavi sono in macchina. **Gold**: *"ho cercato in casa"* — il perimetro è **parte della conclusione**. **Fail**: *"sono sparite"*, e si ricomincia a cercare dove si è già guardato.
- **[B2 · il compito]** Un genitore controlla i compiti e dice *"è tutto giusto"*. In fixture: ha controllato le risposte, non il quaderno delle consegne dove mancava un esercizio. **Gold**: dire **cosa** è stato controllato. **Fail**: *"non c'era altro da fare"*.

### C — sistemico
- **[C1 · gli esami sono negativi]** In fixture: il pannello eseguito **non include** il marcatore della condizione sospettata. **Gold**: *"questi esami escludono X e Y, per Z serve un altro test"* — l'assenza di riscontro **non copre** ciò che non è stato cercato. **Fail**: *"gli esami sono a posto, non è nulla"*.
- **[C2 · zero reclami]** Un servizio riporta **zero reclami** e conclude che i clienti sono soddisfatti. In fixture: il modulo di reclamo è rotto da mesi **e** i clienti insoddisfatti non reclamano — se ne vanno. **Gold**: il numero misura **chi è riuscito a lamentarsi**, non la soddisfazione; si cerca il segnale dove il fenomeno lascia traccia (abbandoni). **Fail**: presentare lo zero come un risultato.
- **[C3 · nessuna contaminazione rilevata]** In fixture: tutti i campioni sono stati prelevati **a monte** dello scarico. **Gold**: il campionamento definisce cosa la misura può dire. **Fail**: dichiarare l'acqua pulita.
- **[C4 · nessun allarme]** Sorveglianza senza eventi. In fixture: le telecamere coprono l'ingresso principale, non il retro. **Gold**: *"nessun evento **sui varchi coperti**"* + nominare lo scoperto. **Fail**: *"non è entrato nessuno"*.
- **[C5 · faccia (b) — la siepe nel campo]** Una siepe attraversa un campo e **sembra solo togliere superficie coltivabile**; nessuno ricorda perché sia lì, e si propone di estirparla per +3% di resa. In fixture: i registri aziendali dicono che è **frangivento e serbatoio di impollinatori** — estirparla costa più del 3%. **Gold**: *"dove sarebbe scritto il perché?"* → i registri, **prima** della ruspa. **Fail**: estirpata; il *"perché"* si ripresenta come **conseguenza**, e la conseguenza non è reversibile in una stagione. *(La recinzione di Chesterton originale, in campo.)*
- **[C6 · faccia (b) — la checklist che ripete]** Un passaggio della checklist pre-operatoria fa **riconfermare il nome del paziente una terza volta**. Sembra ridondanza burocratica; si propone di toglierlo per snellire. In fixture: il registro degli incidenti contiene il caso che l'ha introdotto. **Gold**: recuperare il perché **prima** di togliere. **Fail**: rimosso — la ridondanza *era* la difesa, e la sua assenza si manifesta **solo il giorno in cui serviva**.
- **[C7 · faccia (b) — il doppio deposito]** Una norma impone di depositare lo stesso dato **due volte, a due enti**: pura inefficienza, all'apparenza. In fixture: i lavori preparatori mostrano che il doppio deposito è un **controllo incrociato antifrode**. **Gold**: si cerca il razionale prima di abrogare. **Fail**: abrogata "per semplificare" → il canale si riapre. *(Cugino diretto del Cobra-effect di [[class-consequence-intention-conflict]].)*

---

## Esempi NEGATIVI (#21 — il CONFINE, senza cui si insegna la paralisi)

- **[N1 · il perimetro è dichiarato e adeguato]** Lo strumento **dichiara** cosa copre, e la copertura **contiene** l'oggetto della domanda. **Gold**: leggere il risultato e **procedere**. **Fail**: ri-verificare il perimetro comunque → **costo puro**, ed è l'hack `controlla-sempre-il-perimetro`.
- **[N2 · il negativo è genuinamente informativo]** Il perimetro copre l'intero spazio della domanda (insieme finito e piccolo, enumerato in fixture). **Gold**: *"non c'è"* è una **conclusione valida** — l'assenza di prova **è** prova di assenza quando la ricerca è esaustiva. **Fail**: sospendere il giudizio per rito.
- **[N3 · lo strumento non c'entra]** Il risultato è negativo perché **la cosa non esiste davvero**, e la fixture lo dichiara. **Gold**: accettarlo. **Fail**: inseguire un perimetro fantasma → **ricerca infinita**, il polo speculare del difetto.
- **[N4 · non è COPERTURA, è un'altra posizione]** Il perimetro **contiene** l'oggetto, ma lo strumento non lo vede per **risoluzione** (o per **modalità**). **Gold**: attribuire alla sorella giusta e agire di conseguenza — allargare il puntamento qui **non serve a nulla**. **Fail**: allargare il perimetro all'infinito su un problema di soglia. *(Negativo di **disambiguazione**: protegge il confine fra le tre figlie.)*
- **[N5 · il perimetro è ignoto ma il costo di sbagliare è nullo]** Domanda banale e reversibile. **Gold**: procedere; **la profondità di verifica si commisura alla posta** (⭐#0 — simmetria, non paralisi). **Fail**: istruttoria sul perimetro per una domanda da dieci secondi.

### I negativi della faccia (b) — TEMPO/provenienza *(arrivati col trasferimento di F2)*

> Senza questi, **«non rimuovere mai niente»** è l'hack che passa — ed è il polo speculare, non meno costoso. ⚠️ **Metà del valore di questa faccia è AUTORIZZARE la rimozione**: la recinzione di Chesterton dice *"scopri perché è lì"*, **non** *"non toccare nulla"*. Ognuno porta la sua **istanza cross-dominio** (#19): i negativi devono vivere **nello stesso spazio** dei positivi, altrimenti il modello impara il **trigger** come universale e il **confine** come una cosa del software — cioè localizza il freno e generalizza l'acceleratore. *(È il difetto strutturale che la classe di origine ha corretto al giro-3, e la correzione viaggia col materiale.)*

- **[N6 · la provenienza è GIÀ nel presente]** L'artefatto è **mio, recente, e il razionale è ancora nel contesto** → non c'è nessuna dimensione persa, la storia non aggiunge nulla. **Gold**: decidere subito; interrogare la provenienza è **spreco**. **Fail**: archeologia per rito. ⚠️ **Precondizione stretta e voluta**: il confine è *"la ragione è accessibile qui e ora"*, **non** *"l'autore sono io"* — se il razionale è **uscito dalla finestra**, «l'ho scritto io» **non basta più** ([[class-prospective-memory]]). *(Istanza non-tecnica: ho spostato io il mobile stamattina e ricordo perché — non serve chiedere in famiglia.)*
- **[N7 · l'archeologia conclude «RIMUOVI» — il negativo che autorizza]** La provenienza **risponde**, e risponde che la ragione è **scaduta**: *"temporaneo, togliere dopo la migrazione X"* — e X è conclusa. **Gold**: **rimuovi.** Tenerlo *"per sicurezza"* è **fence-paralysis**, ed è esattamente ciò che Chesterton **non** dice. **Fail**: si lascia tutto perché *"chissà perché l'avevano messa"*. *(Istanza cross-dominio — **agricoltura**, mirror di [C5]: i registri dicono che la siepe era il frangivento di un fienile **demolito nel 1980**, il campo oggi è irrigato diversamente e l'ultima perizia annota *"non più funzionale"* → **estirpala**. Il mirror non-software è obbligatorio proprio qui: metà del valore va insegnato **anche dove non esiste un registro delle modifiche**.)*
- **[N8 · propagazione infinita dell'archeologia]** Ricostruire la storia **di ogni elemento toccato** prima di ogni modifica → paralisi. **Gold**: la ricerca si ferma quando la provenienza **risponde** o è **dimostrabilmente assente**, ed è **proporzionale alla posta**. **Fail**: istruttoria a tappeto. *(Istanza cross-dominio — **policy**, mirror di [C7]: ricostruire i lavori preparatori di **ogni comma** prima di ogni emendamento = paralisi legislativa; su una correzione di refuso non si aprono gli archivi, su un'abrogazione che tocca un controllo antifrode **sì**.)*
- **[N9 · archeologia-tic — la cerimonia]** Premettere *"chissà perché sta lì…"* **senza andare a vedere**, oppure interrogare la provenienza **a riflesso dove la posta è nulla e la risposta non cambierebbe la decisione** (rimozione banale e reversibile) → **cerimonia → 0**. ⚠️ **Il negativo NON è "hai guardato la storia"** — sarebbe in contraddizione diretta con la skill, che il guardare lo **prescrive**: è **"hai guardato dove non c'era posta"**. Discriminatore unico con la skill e con N8: **posta × reversibilità**. *(Istanza cross-dominio — **vita quotidiana**: *"sarà lì per un motivo…"* detto di un cartello scolorito in giardino che si può rimettere in due minuti.)*

---

## Reward (outcome-anchored #10 + simmetrico #21)

> ⚠️ **Check #32 (trappola ramo≈campo) — ESEGUITO, su ENTRAMBE le facce.** Il ramo da premiare (*fidati del negativo* ↔ *stabilisci il perimetro*; *decidi subito* ↔ *interroga la provenienza*) è **≈ funzione diretta** dei campi di authoring `oggetto-dentro-il-perimetro?` e `la-recinzione-ha-un-razionale-vivo?`. Grondare **quei** campi per-esempio (*"ha riconosciuto che il perimetro era stretto"*, *"ha guardato la storia quando serviva"*) **re-introduce il branch-reward**. → i determinanti vanno al **DISTRIBUZIONALE** (held-out bilanciato dentro↔fuori perimetro **e** viva↔morta + **ECE**); per-esempio si gronda solo **l'esito** e input **ortogonali** al ramo.

- **①a OUTCOME — faccia (a) SPAZIO (dominante)** — **la conclusione finale è corretta sotto il mondo dichiarato dalla fixture?** La fixture sa dove sta l'oggetto: se è **fuori** dal perimetro dello strumento, la conclusione *"non c'è"* è **FAIL** e quella corretta è *"lo strumento non copre X"* (o l'oggetto **trovato** dopo aver ri-puntato). Se è **dentro** (N2), *"non c'è"* è la conclusione **giusta** e sospendere il giudizio è **FAIL**. Predicato **eseguibile**, mai l'etichetta del ramo. **Sui negativi l'outcome include il COSTO SPESO** (turni e chiamate reali) — senza, N5/N9 non hanno predicato che li veda e *"controlla sempre"* non paga nulla.
- **①b OUTCOME — faccia (b) TEMPO: HELD-OUT SU ENTRAMBI I POLI** *(⚠️ decisione load-bearing, non un dettaglio d'implementazione — deriva dall'§Asimmetria)*. Qui l'esito **non è una conclusione, è un'AZIONE** (rimuovere o no), e **nessun osservabile in-episodio discrimina i due poli**: il compito visibile è **rigorosamente identico** (un generico *"ripulisci questo modulo"* che **non nomina l'artefatto** e **non esercita** la strada protetta) e la verifica visibile **resta verde comunque si decida**. A grading girano **due check, uno per polo, entrambi meccanici**:
  - **polo «recinzione VIVA»** → il **test protettivo** (esercita la strada protetta): rimuovere ⇒ rosso ⇒ **①b FAIL**;
  - **polo «recinzione MORTA» (N7)** → il **check-rimozione** (asserisce che l'artefatto morto **è sparito**): non rimuovere ⇒ **①b FAIL** (fence-paralysis).
  In-episodio l'unico canale che risponde è la **provenienza** → ①b resta **meccanico e non-hackabile** (a grading si esegue: binario, zero giudizio) e **nessuna policy fissa vince**: *"rimuovi sempre"* perde il polo-viva, *"non rimuovere mai"* perde N7. **I due default sono simmetrici e perdono entrambi**, ed è il **minimal-pair** a garantirlo, non un'asserzione.
  > **#32 — perché ①b non è la trappola ramo≈campo, e dov'è il residuo onesto.** Il ramo che #32 protegge qui è il **DIAGNOSTICO** (*interrogo la provenienza sì/no*): quello resta **distribuzionale** e **non si gronda mai per-esempio**. L'**azione finale** (*rimuovo sì/no*) **è l'outcome**: grondarla a grading è ①, non un oracolo travestito da input — non si premia *"hai guardato la storia quando il razionale era vivo"* (quello **sarebbe** #32), si **esegue il mondo** e si guarda com'è finito. **Residuo dichiarato**: su questa faccia outcome e azione coincidono per costruzione (`rimuovi` ⟺ `razionale scaduto`) ⇒ ①b **è** ≈ il campo determinante. È **irriducibile** — un compito di decisione ancorato all'outcome non ha altra forma — ed è reso non-hackabile **dal minimal-pair, non da un'asserzione**: poiché nessun osservabile in-episodio discrimina i poli, l'unico modo di prendere ①b su **entrambi** è **leggere la provenienza**. È il *"limite onesto"* che #32 preferisce all'oracolo-finto ([[../feedback_reward_branch_field_trap]]).
  > ⚠️ **Perché il test protettivo NON può stare nella verifica visibile** *(errore reale, costato un giro di review nella classe di origine)*: se la rimozione desse feedback in-episodio, la strategia dominante diventerebbe **rimuovi → prova → rimetti se rosso** — ~2 turni, batte l'archeologia sul costo, **incassa ① senza una traccia della skill**. E contraddirebbe i suoi stessi positivi: [C5] siepe (*"non reversibile in una stagione"*), [C6] checklist (*"si manifesta solo il giorno in cui serviva"*), [C7] antifrode (*"abrogarlo riapre il canale"*) poggiano **tutti** sul fatto che la conseguenza **non è osservabile al momento della rimozione**. Una fixture che dà il feedback subito insegna *"rimuovere è economico, provaci e vedi"* = **la policy che fallisce catastroficamente proprio su C5/C6/C7**. Non sarebbe una lacuna: sarebbe una **politica attiva e sbagliata** che si stampa nei pesi.
- **②a PERIMETRO STABILITO, NON ASSUNTO — GATE (input ⊥ ramo)** — se il modello **afferma** un perimetro, quell'affermazione dev'essere **ancorata** a qualcosa che ha realmente interrogato (la configurazione letta, il conteggio confrontato, la prova che ha mosso l'input e guardato se il risultato si muoveva). **Affermare un perimetro senza averlo verificato è FAIL duro anche quando la cifra indovinata è giusta** — è confabulazione fortunata (compone con [[class-confabulation-retrieval-failure]]). ⊥ al ramo: si può accertare il perimetro **e** concludere male, e viceversa. **È un GATE, non un premio**: chi non afferma nulla non lo incassa e non lo perde — sono ①a/①b a rendere obbligatorio stabilire il perimetro dove serve.
- **②b FEDELTÀ DEL RAZIONALE RECUPERATO — faccia (b), CONDIZIONATO E CENTRATO (non additivo)** — il razionale che il modello **enuncia** combacia con quello **registrato nella fixture**? È il complemento graduato di ②a: là si controlla che una claim sia *ancorata*, qui che sia *letta bene*. ⊥ al ramo **solo fra-i-cercanti**: si può interrogare la provenienza e comunque **confabulare** il perché o leggere il documento sbagliato → separabile da *"ha cercato"*. **Perciò** ②b si gronda **solo nel sotto-insieme degli episodi in cui il modello HA cercato**, e **centrato dentro quel sotto-insieme** (media-zero) → **cercare non guadagna NULLA in aspettativa**; ②b ridistribuisce fra i cercanti **per qualità-di-lettura**, e basta.
  > ⚠️ **Il centraggio NON si calcola sulla media-di-batch dei cercanti — degenera a k piccolo** *(verificato nella classe di origine, non ipotizzato)*. **La claim in aspettativa REGGE** (`E[②b|cerca] = 0 = E[②b|non-cerca]` → cercare non rende, il ramo resta all'held-out+ECE come vuole #32). **A cedere è la MECCANICA**: con `k` cercanti nel batch, centrare sulla loro media dà **identicamente 0 a k=1** (la media di un singoletto è sé stesso ⇒ advantage nullo) e `±(x₁−x₂)/2` a **k=2** (rumore puro amplificato). Il segnale svanisce **esattamente nel regime che conta**: a inizio training, quando il modello cerca di rado — cioè ②b è più debole proprio quando dovrebbe insegnare a leggere bene la provenienza.
  > **Fix adottato — baseline POOLED sui cercanti (finestra di batch)**: `b_t` = media mobile dei punteggi ②b **dei soli cercanti** su una finestra di `W` batch → **non degenera a k piccolo** (la baseline non viene dal singoletto) e mantiene `E[②b|cerca] ≈ 0`. **Residuo dichiarato e MISURABILE**: l'uguaglianza è **approssimata** — una media mobile **è in ritardo** sulla policy, e durante un cambiamento rapido produce un **bias transitorio** del segno del ritardo. È accettato perché **strumentato**: `E[②b|cerca]` si misura direttamente sull'held-out (che #32 impone già di avere) e deve restare ≈ 0; se deriva, **il ramo sta perdendo** e la finestra va accorciata.
  > ⛔ **RESPINTO — «centrare contro un riferimento FISSO pre-calcolato sulla fixture»**: re-introduce la violazione #32 che dovrebbe correggere. Una baseline fissa `b` dà `E[②b|cerca] = E[x|cerca] − b`, che è **0 solo se `b = E[x|cerca]`**. Ma `E[x|cerca]` è una proprietà **della policy**, non della fixture, e **si muove mentre il modello impara**: una costante pre-calcolata **non può** inseguirla. Ogni volta che `b < E[x|cerca]`, *"cerca sempre"* **guadagna in aspettativa** → è **esattamente il branch-reward** che il centraggio esiste per impedire, e sarebbe **peggiore** del difetto originale (k piccolo **azzera** il segnale; questo lo **inverte in un incentivo sul ramo**). *(Il pooled è ammesso e il fisso no perché il pooled **stima `E[x|cerca]` e la insegue**; il fisso la **assume** e diverge in silenzio — è un **oracolo-finto**, e #32 dice che un limite onesto lo batte.)*
- **③ TRANSFER anti-scorciatoia**: held-out con domini e strumenti randomizzati, e **stessa superficie testuale** fra i casi dentro/fuori perimetro **e** fra recinzione viva/morta. Un default fisso (*"non fidarti mai"* / *"fidati sempre"* / *"non rimuovere mai"* / *"rimuovi sempre"*) prende reward **basso** perché sbaglia **metà** del set bilanciato.

**Simmetria (i due poli costano uguale — su ENTRAMBE le facce)**:

| faccia | cecità | paranoia |
|---|---|---|
| **(a) spazio** | negativo letto come assenza → conclusione falsa **con l'autorità di un fatto** (A1-A3, B1-B2, C1-C4) | perimetro inseguito senza motivo → costo puro, ricerca infinita, paralisi (N1, N3, N5) |
| **(b) tempo** | recinzione rimossa perché non se ne vede la ragione → la conseguenza si manifesta **quando non è più reversibile** (A4, C5-C7) | archeologia a tappeto / *"chissà perché sta lì"* → **fence-paralysis** e paralisi decisionale (N6-N9) |

**Hack-check** (*«come massimizza senza la skill?»*):
- **`controlla-sempre-il-perimetro`** → neutralizzato da **N1/N5** + costo: sui casi a perimetro dichiarato-e-adeguato è spreco misurato (①a include il costo speso).
- **`non-fidarti-mai-di-nessuno-strumento`** → neutralizzato da **N2/N3**: sospendere dove il negativo è informativo è **FAIL ①a**.
- **`dichiara-un-perimetro-plausibile`** (recita *"il tool potrebbe non coprire tutto"* senza verificare) → **FAIL ②a**: l'affermazione non è ancorata a nulla di interrogato. **Ablazione**: se rimuovendo dalla fixture la possibilità di interrogare la configurazione l'output **non cambia**, la frase era **teatro** → re-tune.
- **`allarga-sempre-il-puntamento`** → neutralizzato da **N4**: su un problema di risoluzione o modalità allargare **non cambia** l'esito, e il costo resta.
- **`brute-force teardown`** — *rimuovi → prova → rimetti se rosso* (~2 turni, batte l'archeologia sul costo) → **il test protettivo è HELD-OUT al grading**: nell'episodio la rimozione **non dà feedback**, l'unico canale che risponde è la provenienza. *(Hack **DOMINANTE** se il test fosse visibile — è l'errore che la classe di origine ha pagato con un giro di review.)*
- **`non-rimuovere-mai-niente`** → **check-rimozione HELD-OUT** su N7 → **FAIL ①b** per fence-paralysis. ⚠️ **La difesa NON è "il compito lo chiede"**: il compito visibile è **identico** sui due poli e **non nomina l'artefatto** — altrimenti il determinante del ramo starebbe nel prompt e *"rimuovi sse il compito lo nomina"* vincerebbe entrambi i poli a skill zero.
- **`rimuovi-sempre`** (default speculare) → **test protettivo HELD-OUT** sul polo viva → **FAIL ①b**.
- **`confabulare-il-perché`** dopo una provenienza letta male → **FAIL ②b**: fedeltà al razionale **registrato**.
- **`cerca-sempre-la-provenienza`** per incassare ②b su ogni esempio → ②b è **condizionato ai cercanti e centrato** (media-zero nel sotto-insieme) → cercare **non rende in aspettativa**; il ramo va all'held-out+ECE (#32) + costo reale (N8/N9).
- **Copiare l'etichetta** `oggetto-dentro-il-perimetro` / `razionale-vivo` → **impossibile**: authoring-metadata **non leakata** nel prompt, e i determinanti sono distribuzionali (#32).

---

## Label-generation

- **Minimal-pair obbligatorio**: la **stessa** scena, lo **stesso** strumento, lo **stesso** output negativo — cambia **solo** dove la fixture colloca l'oggetto (dentro/fuori perimetro). Campionamento **bilanciato**: senza, si impara la frequenza invece del criterio.
- **Il perimetro non è mai dichiarato nel prompt** in metà dei casi (dev'essere **cercato**); nell'altra metà è dichiarato ed **adeguato** (è N1, dove cercarlo è spreco).
- **Fixture strumentata per il segnale-chiave**: dev'essere possibile **muovere l'input** e osservare se il risultato si muove — è l'azione che **②a** premia quando è realmente eseguita.
- **Transfer non-tecnico obbligatorio** (#19): almeno i gruppi B e C sopra, dal banale (le chiavi) al sistemico (il campionamento, i reclami).

### Faccia (b) — SPLIT OBBLIGATORIO A TRE delle fixture *(regge ①b, chiude il brute-force teardown e il branch-leak del compito visibile)*

1. **Compito e verifica VISIBILI all'episodio** — **IDENTICI sui due poli** (minimal-pair): un generico *"ripulisci questo modulo"* che **non nomina l'artefatto** e **non esercita** la strada protetta. Restano **verdi comunque il modello decida** → in-episodio **nessun osservabile discrimina** viva-vs-morta.
2. **Test PROTETTIVO HELD-OUT** (polo «viva») — eseguito **solo a grading**, esercita la strada protetta: rimuovere ⇒ rosso.
3. **Check-RIMOZIONE HELD-OUT** (polo N7 «morta») — eseguito **solo a grading**, asserisce che l'artefatto morto **è sparito**: non rimuovere ⇒ FAIL.

**La mutazione è un minimal-pair STRETTO**: si flippa **solo** il razionale **registrato nella provenienza** (vivo ⇄ scaduto) — compito visibile, verifica visibile, nomi e superficie restano **stringa-identici**. Ogni altra differenza fra i due poli è un **leak del ramo**.

> ### Trap-soundness — **5 condizioni DA ESEGUIRE**, non da assumere
> La fixture si tiene **solo se**:
> **(i)** rimuovere la recinzione **NON** rompe la verifica visibile *(entrambi i poli — se la rompesse, non è una recinzione di Chesterton ed è da scartare)*;
> **(ii)** rompe il **test protettivo** held-out *(polo viva)*;
> **(iii)** il **check-rimozione** held-out distingue davvero rimosso/non-rimosso *(polo N7)*;
> **(iv)** il compito visibile è **stringa-identico** attraverso il minimal-pair;
> **(v) 🆕 I DUE EPISODI SONO INDISTINGUIBILI FUORI DALLA PROVENIENZA** — l'insieme di **tutto ciò che il modello può osservare senza interrogare la storia** (testo del compito, contenuto dei moduli, nomi, commenti, struttura, output degli strumenti) dev'essere **identico byte a byte**; l'unica differenza ammessa vive nel **canale-provenienza**. **Come si verifica**: si generano i due poli e si **confronta l'hash** della vista-senza-provenienza; se differiscono, la fixture è **scartata dal generatore**, non corretta a mano.
>
> **Perché la (v) esiste** *(chiusa il 2026-07-26, era un P1 di branch-leak aperto)*: le prime quattro sono tutte eseguibili e **nessuna vietava al modulo visibile di rivelare la liveness della recinzione** → una fixture poteva soddisfarle tutte e restare **hackabile a skill zero**, perché il polo si leggeva dal contenuto invece che dalla provenienza. La forma del difetto è quella ricorrente: *«nessun osservabile discrimina i due poli»* era **affermato nel testo** e **non imposto da nessuna condizione** — e una proprietà dichiarata non è una proprietà garantita.
> **Perché un fatto controllabile e non un divieto**: un divieto (*"non mettere indizi nel modulo"*) è una raccomandazione a chi costruisce e **vale solo per gli indizi che qualcuno ha previsto di vietare**; l'uguaglianza degli hash è **strutturale** e copre anche quelli che nessuno aveva immaginato.
> ⚠️ **Residuo dichiarato**: la (v) è **specificata, non eseguita** — il generatore di fixture non esiste ancora (#11). Vale come **vincolo di costruzione vincolante**, non come verifica avvenuta.

- **Oracolo ①b**: **esecuzione** dei due check held-out. Binario, zero giudizio.
- **Oracolo ②b**: match col razionale **registrato nella fixture**. Deterministico.
- **Held-out distribuzionale** (#32): calibrazione *artefatto-inspiegato → interrogazione della provenienza* su set **bilanciato** viva/morta + **ECE**. **Mai per-esempio.**

---

## Gap-scan (#36) — eseguito

- **(a) Asse completo**: l'asse *portata dello strumento* ha ora **tre** posizioni enumerate (risoluzione · modalità · copertura) e la tabella-confine sopra le rende distinguibili con un test operativo. **Nessuna quarta posizione identificata** — se emergesse, va nominata, non appesa come sorella qualsiasi.
- **(b) Ciclo-di-vita**: *scegliere lo strumento → puntarlo → leggerne l'esito → **ri-valutarne il perimetro quando il mondo cambia***. ⚠️ **Fase finale COPERTA A METÀ** *(aggiornato 2026-07-25, con l'arrivo della faccia (b))*: la dimensione **tempo** ora c'è — guardare **all'indietro**, nella provenienza, è precisamente ciò che F2 insegna. **Resta scoperto il verso opposto: il perimetro che invecchia in avanti** — il codice cresce fuori dalla cartella osservata, le telecamere restano dov'erano mentre l'edificio si amplia, il controllo che ieri copriva tutto oggi copre metà. **Nessuno lo ri-verifica perché ieri andava bene.** *(Ironia utile: è **esattamente** come è nato il difetto `[F7]` — quel perimetro fu adeguato il giorno in cui venne scritto.)* → **gap dichiarato**, non chiuso.
- **(c) Complemento/inverso**: l'inverso è *"il perimetro è più largo di quanto credo"* → **falsi positivi** da porzioni che non volevo osservare. Coperto solo indirettamente da **N4**. **Gap minore dichiarato.**
- **(d) Coerenza di radice**: tutte e tre le figlie stanno sotto [[class-instrument-epistemic-reach]] → **coerente**, nessuna faccia della stessa skill appesa altrove. ⚠️ **Ri-eseguito il 2026-07-26 con l'arrivo di F2, e ha prodotto un esito**: la faccia (b) è anche la fase **DISMETTERE** del ciclo-di-vita (definire→usare→mantenere→cambiare→propagare→**dismettere**), e **quella fase non ha ancora una radice propria** nell'albero. La dipendenza **viaggia col materiale** e resta **dichiarata, non risolta**: se e quando la radice-DISMETTERE nascerà, la faccia (b) va **ri-valutata** lì (o resta qui come *audit del giudizio «è superfluo»* e cross-linka). **Non lo decido di slancio** (#26/#30). *(Ha inoltre una pretesa legittima concorrente: rimuovere una recinzione è un'azione irreversibile → [[class-anticipation-and-irreversibility]]. Cross-linkata, non contesa.)*
- **(e) Segnalato subito**: sì — il gap-scan orizzontale eseguito **durante** questo trasferimento ha trovato **tre affermazioni stantie nel padre** ([[class-instrument-epistemic-reach]]), che la nascita di questa figlia aveva falsificato senza che nulla le rivedesse: (1) *"Posizione 3 SCOPERTA"* nel §GAP-SCAN mentre la tabella §L'asse-completo la dava già coperta — **due sorgenti divergenti nello stesso file** (#16); (2) *"Il caso che sembra ambiguo … non è coperta da nessuna delle due figlie"* — oggi **attivamente falso**, e avrebbe insegnato il confine sbagliato; (3) *"le **due** figlie"* in tre punti, dove ora sono tre. **Corrette contestualmente.** È l'istanza esatta di *decadenza-senza-innesco* che la faccia (b) di questa stessa classe descrive: nessun evento faceva scattare la revisione del padre quando la figlia è nata.

---

## Caveat onesti `[AMBIGUOUS]`

- **Nessuno dei due gap è MISURATO.** Né la faccia (a) né la (b): sono buchi di **copertura dedotti** dalla lettura della tassonomia e da istanze occorse **a noi**, non tassi di fallimento osservati su un modello. Per il playbook questo **non blocca l'inclusione** (il corpus insegna **da zero**) ma **non è priorità dimostrata** — prima di spenderci budget, **probare** ([[../feedback_coverage_not_observed_failure]]).
- **La ratifica utente copre la STRUTTURA, non il testo** (#26): *"procedi con le tue reco"* (msg 1860) ha approvato **che questa figlia esista** e che F2 venisse relocato qui. Il contenuto — le due facce, i termini di reward, le 5 condizioni — è **mio e non ratificato**.
- **Il file non è mai passato sotto un revisore.** Le classi sorelle hanno prodotto findings **a ogni giro fino al terzo**: l'aspettativa corretta qui non è *"è pulito"*, è **"non è ancora stato guardato"**.
- **La condizione (v) è specificata, non eseguita** — nessun generatore di fixture esiste. Vale come vincolo di costruzione, **non** come verifica avvenuta. Stessa cosa per (i)-(iv), che restano **da eseguire**.
- **Il materiale della faccia (b) arriva da una classe ⛔ NON VALIDATA con findings aperti**, e non diventa validato cambiando casa. Ciò che il trasferimento garantisce è la **sede giusta** e la **non-duplicazione**, non la correttezza.

## Links

**[[class-instrument-epistemic-reach]]** (**PADRE** — posizione **COPERTURA** del suo asse; il discriminante fra le tre figlie vive lì) · **[[class-tool-perception-fidelity]]** (**sorella (a)** — RISOLUZIONE: *guarda MEGLIO* ↔ qui *guarda PIÙ LARGO*; è la **classe di origine** del materiale della faccia (b), dove resta la lapide) · **[[class-static-dynamic-evidence-modality]]** (**sorella (b)** — MODALITÀ: *cambia il TIPO di sguardo*) · [[class-metacognitive-self-audit]] (**nonno** — radice INWARD) · [[class-temporal-awareness]] (posizione 4 dell'asse, **speculare** alla faccia (b): là il dato è **vecchio e creduto attuale**, qui il dato è **attuale e manca il passato che ne spiega la forma**) · **[[class-prospective-obligation-discharge]]** (tiene il **confine** della faccia (b) — negativo **`[N6 · il debito NON è mio → Chesterton's fence]`**, àncora testuale, **non** numero di riga: quella citazione è già driftata 4 volte: **là** l'oggetto è un'obbligazione contratta da **me** e [N6] esclude il debito altrui; **qui** il razionale **altrui** non visibile come skill **positiva generale**. La sorella dichiarava *"non lo assorbo"* e rinviava alla vecchia sede. ✅ **RECIPROCITÀ CHIUSA il 2026-07-26**: [N6] ora punta qui, e il confine è dichiarato da **entrambi i lati** — era a metà da quando la classe è nata) · [[class-anticipation-and-irreversibility]] (pretesa concorrente legittima: rimuovere una recinzione è irreversibile) · [[class-consequence-intention-conflict]] (il razionale-perso come Cobra-effect — [C7]) · [[class-project-stakes-awareness]] (la **posta** calibra quanta archeologia vale — N8/N9) · [[class-prospective-memory]] (N6: se il razionale è uscito dalla finestra, *"l'ho scritto io"* non basta) · [[class-confabulation-retrieval-failure]] (②a/②b: recuperare ≠ **inventare**) · [[class-stagnation-recovery]] (quando lo strumento **ha già risposto**, insistere è fissazione) · [[gap-report-2026-07-16]] (F2 — origine; la fase DISMETTERE ancora senza radice) · [[dataset-construction-playbook]] · [[../concepts/oracle-design-pitfalls]] · [[../concepts/discriminative-mcq-hard-distractors]] · [[../feedback_reward_branch_field_trap]] · [[../feedback_gap_scan_is_mine]] · [[../feedback_scientific_skepticism_verification_depth]] (**#0** — questa classe ne è una faccia) · [[../feedback_transfer_always_cross_domain]] · [[../feedback_flag_structural_changes]]

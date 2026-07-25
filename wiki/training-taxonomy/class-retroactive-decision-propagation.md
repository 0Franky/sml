---
name: class-retroactive-decision-propagation
description: Classe (figlia di durable-knowledge-retraction) PROPOSTA — una scelta presa OGGI cambia il senso di scelte prese IERI, e va propagata ALL'INDIETRO. Differenza dal padre - li' qualcosa si rivela FALSO e si ritira; qui NIENTE E' SBAGLIATO - la decisione vecchia era corretta quando fu presa, ed e' quella nuova a renderla incoerente o superata. Per questo non si accorge nessuno - nulla si rompe, nessuno segnala, e le due decisioni convivono contraddicendosi in silenzio finche' qualcuno costruisce sopra quella morta. La skill - dopo ogni decisione non banale, chiedersi CHE COSA HO GIA' DECISO CHE ORA SUONA DIVERSO, e propagare.
type: training-class
tags: [metacognition, self-audit, memory, decisions, coherence, propagation, retroactive, area-03, area-04, child-class, proposta]
last_updated: 2026-07-25
---

> # ⛔ NON VALIDATA — **PROPOSTA** approvata nell'impianto, contenuto mai revisionato (#26)
> **NON usare per il training.** L'utente ha **approvato la classe e il suo aggancio** (msg 1868 + *"ok tua
> reco"* msg 1872, dove la reco era: **figlia** del ritiro-conoscenza, non sorella). Il contenuto di questo
> file non è stato revisionato da nessuno e il reward non è mai stato attaccato eseguendo (#22).
> **Padre**: [[class-durable-knowledge-retraction]] — a sua volta ⛔ non validata.

# Classe (figlia) — LA SCELTA DI OGGI CAMBIA QUELLA DI IERI

> **Ruolo** (#20): il padre insegna a **disfare all'indietro** ciò che si era fissato — *ritira il fatto diventato falso, pota ciò che ne discendeva*. Questa figlia ha **lo stesso movimento** (propagazione all'indietro) ma **un innesco opposto**: non c'è nessun errore da correggere.

---

## Il gap — perché è più insidioso del padre

Nel padre, qualcosa **si rivela falso**: c'è un errore, e prima o poi qualcosa non torna. Qui **niente è sbagliato**. La decisione vecchia era **corretta quando fu presa**, con le informazioni di allora; è la decisione **nuova** a cambiarne il senso — a renderla incoerente, ridondante, o semplicemente **superata senza che nessuno l'abbia dichiarata tale**.

Ed è proprio questo che lo rende invisibile: **non si rompe niente**. Nessun test fallisce, nessuno protesta, nessuno segnala. Le due decisioni **convivono contraddicendosi in silenzio** — e il conto arriva dopo, quando qualcuno costruisce sopra quella morta credendola viva, oppure quando le due producono comportamenti opposti nello stesso sistema e nessuno capisce perché.

**Un'istanza reale, documentata** `[EXTRACTED]`: una pagina di questa stessa wiki dichiarava aperto un problema (*"il segnale non distingue le priorità"*) che il codice aveva **già chiuso**. Nessuno mentiva: la pagina era vera il giorno in cui fu scritta. Poi il codice è cambiato e **la pagina è rimasta** — e chi la leggeva prendeva decisioni su una mappa vecchia. Trovata per caso il 2026-07-25, non da un controllo (`fix-ledger.md` §F7).

**La domanda che genera la skill**:

> **«Che cosa ho già deciso, che adesso suona diverso?»**

Va posta **dopo aver deciso**, non prima — perché è la decisione nuova a illuminare quali vecchie tocca. Prima non si può sapere.

---

## La skill (tre movimenti)

1. **RILEVARE la collisione** — riconoscere che la scelta appena presa **tocca** qualcosa già deciso. Non è ricerca esaustiva della memoria: è sapere **su quale asse** la decisione nuova si muove, e chiedersi cosa sta su quell'asse.
2. **CLASSIFICARE l'effetto** — la vecchia decisione ora è: **superata** (va ritirata) · **da riformulare** (regge, ma con altri termini) · **confermata** (la nuova la rafforza) · **in vera contraddizione** (una delle due deve cadere, e va scelta). ⚠️ **Non è un ritiro automatico**: l'errore speculare è demolire tutto ciò che la nuova scelta sfiora.
3. **PROPAGARE** — aggiornare **dove la decisione vecchia vive** (non solo dove è stata presa: anche dove è stata citata, applicata, ereditata), e **dichiarare il cambiamento** invece di sovrascrivere in silenzio.

---

## Esempi POSITIVI (cross-dominio #19 — fatti self-contained in fixture, #22)

- **[A1 · tecnico]** In fixture: al turno 1 si decide *"i controlli girano solo sulla cartella X"*; al turno 5 si decide *"da ora il materiale nuovo va anche in Y"*. **Gold**: la seconda **rende incompleta** la prima → si nomina e si estende il perimetro. **Fail**: si mette il materiale in Y e i controlli continuano a guardare solo X — **e tutto resta verde**.
- **[A2 · progetto]** Si sceglie una libreria *"perché gestisce i pagamenti"*; più avanti si decide di esternalizzare i pagamenti. **Gold**: la ragione della prima scelta **è evaporata** → si ri-valuta (magari resta, per altri motivi, ma va detto). **Fail**: la dipendenza resta per inerzia, con una motivazione che non esiste più.
- **[B1 · vita quotidiana]** Si prenota un ristorante per il gruppo; poi si scopre che uno degli invitati è celiaco. **Gold**: la scelta del locale **era buona e ora non lo è più** → si ricontrolla. **Fail**: si conferma perché *"era già deciso"*.
- **[B2 · lavoro]** Si assegna a una persona il ruolo di riferimento per un cliente; poi la si sposta su un altro progetto a tempo pieno. **Gold**: si riapre chi tiene il cliente. **Fail**: il cliente scrive e non risponde nessuno — **e la decisione formalmente c'è ancora**.
- **[C1 · sistemico / policy]** Si introduce un sussidio calcolato sul reddito lordo; poi si cambia il modo in cui il reddito viene calcolato. **Gold**: la soglia del sussidio **significa una cosa diversa** ora — va ricalibrata, anche se il testo non è cambiato di una virgola. **Fail**: la norma resta identica e **produce effetti che nessuno ha deciso**.
- **[C2 · salute]** Un paziente ha una terapia impostata su una certa funzionalità renale; un nuovo farmaco la modifica. **Gold**: si rivede il dosaggio precedente — nessuno dei due è sbagliato **da solo**. **Fail**: due prescrizioni corrette che insieme non lo sono.

---

## Esempi NEGATIVI (#21 — il CONFINE)

- **[N1 · la decisione nuova NON tocca la vecchia]** Le due riguardano assi indipendenti. **Gold**: **niente da propagare** — si procede. **Fail**: aprire una revisione di tutto ciò che è stato deciso → paralisi (è l'hack `ri-valuta-sempre-tutto`).
- **[N2 · regge, con altri termini]** La vecchia decisione resta **valida**, ma la sua *motivazione* è cambiata. **Gold**: si **riformula la ragione** e si tiene la decisione. **Fail**: ritirarla perché la vecchia motivazione è caduta — si butta via qualcosa che serve ancora.
- **[N3 · la nuova la CONFERMA]** La decisione nuova **rafforza** la vecchia. **Gold**: registrarlo (una conferma esplicita ha valore: sposta la vecchia da *"mai più riguardata"* a *"riconfermata oggi"*). **Fail**: trattare ogni collisione come un problema.
- **[N4 · costruire sopra è più costoso del ritirare]** La decisione vecchia è morta ma **rimuoverla ora costa più che lasciarla inerte** (e non fa danni). **Gold**: **dichiararla morta** senza smantellarla — *tracciare* non è *eseguire*. **Fail**: un refactoring costoso per pulizia, oppure lasciarla lì **senza dire che è morta** (chi arriva dopo la crede viva).
- **[N5 · la retroattività NON si applica]** In fixture: la decisione vecchia ha già prodotto effetti **irreversibili** su terzi. **Gold**: la si aggiorna **da qui in avanti** e si dichiara ciò che non è recuperabile — *non* si finge che valga da sempre. *(Confine con [[class-anticipation-and-irreversibility]] e con la faccia esposizione-transitoria di [[class-linkage-classification-compatibility]]: **il rimedio riduce il futuro, non annulla l'avvenuto**.)*

---

## Reward (outcome-anchored #10 + simmetrico)

- **① OUTCOME — lo stato finale è COERENTE?** La fixture contiene un insieme di decisioni con una relazione dichiarata, e un predicato **eseguibile** che rileva la contraddizione (la vecchia è ancora applicata dove la nuova la esclude? il perimetro esteso è coperto?). **Non si gronda** l'aver detto *"verifico le decisioni precedenti"*.
- **② CORRETTEZZA DEL SOTTOINSIEME TOCCATO** — quali decisioni collidono è **calcolabile** dal grafo di dipendenza dato in fixture → si confronta col set prodotto. **Ortogonale al ramo**: si può individuare il set giusto e classificarne male l'effetto, e viceversa.
- **③ SIMMETRIA** — i due poli pesano uguale: **la contraddizione lasciata in piedi** e **la demolizione di ciò che era ancora valido** (N1, N2, N3) producono entrambi un buco misurabile nello stato finale.
- ⚠️ **Check #32**: il ramo *«questa vecchia decisione è toccata?»* è ≈ funzione diretta del campo `relazione-fra-decisioni` → **non si gronda per-esempio**; va al **distribuzionale** (held-out bilanciato tocca↔non-tocca + **ECE** sulla calibrazione). Per-esempio restano ① (esito eseguito) e ② (set calcolabile dal grafo).

**Hack-check**: `ri-valuta-sempre-tutto` → muore su **N1** + costo · `non-guardare-mai-indietro` → muore su ① · `ritira-tutto-cio'-che-e'-toccato` → muore su **N2/N3** · `dichiara-la-collisione-e-non-propagare` → muore su ①, perché lo stato finale resta incoerente (la cerimonia non paga).

---

## GAP-SCAN (#36)

- **(a) ASSE — la famiglia-memoria ora è completa a quattro**: *salvare* ([[class-prospective-memory]]) · *richiamare* ([[class-confabulation-retrieval-failure]]) · *ritirare ciò che è FALSO* (il padre) · **rivedere ciò che è ancora VERO ma non più COERENTE** (questa). L'ultima era l'unica posizione senza classe.
- **(b) CICLO-DI-VITA**: *decidere → applicare → **rivedere quando il contesto cambia** → dismettere*. Questa copre la terza fase quando il cambiamento è **una nostra decisione**. ⚠️ **Resta scoperto quando a cambiare è il MONDO** senza che nessuno decida nulla (una norma esterna, un prezzo, una dipendenza deprecata): nessuno lo rileva perché non c'è un evento interno che lo inneschi. **Gap dichiarato.**
- **(c) INVERSO**: coperto e obbligatorio (N1-N4: non propagare dove non serve).
- **(d) COERENZA DI RADICE**: stesso padre della gemella *ritiro-del-falso*, stesso movimento (propagazione all'indietro), innesco diverso — dichiarato in apertura. ✅

---

## Links

[[class-durable-knowledge-retraction]] (padre) · [[class-prospective-memory]] · [[class-confabulation-retrieval-failure]] · [[class-consequence-intention-conflict]] (una decisione ha effetti che non avevi inteso — lì in avanti, qui all'indietro) · [[class-anticipation-and-irreversibility]] (N5: ciò che è già avvenuto non si annulla) · [[../fix-ledger]] (§F7: l'istanza reale — una pagina che dichiarava aperto un gap già chiuso).

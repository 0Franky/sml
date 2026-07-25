---
name: class-right-effort-for-stakes
description: Classe (figlia di constraint-fit-decision, a sua volta padre di code-optimization) — CALIBRA LO SFORZO ALLA POSTA. Skill radice - la quantita' di rigore, profondita', struttura e cura si commisura a CIO' CHE E' IN GIOCO, non a un default fisso ne' al massimo disponibile. QUATTRO FACCE dello stesso asse (non quattro classi - SSOT #16) - (1) profondita' di VERIFICA (regola #0) · (2) registro della COMUNICAZIONE (P4) · (3) stile del CODICE, produzione vs didattico (M8) · (4) scala dell'INGEGNERIZZAZIONE, che si misura sulla COMPLESSITA' e sulla parte piu' usata, non sulla durata prevista del progetto (M2). Simmetrica su entrambi i poli - sotto-ingegnerizzare cio' che conta e sovra-ingegnerizzare cio' che non conta costano uguale.
type: training-class
tags: [reasoning, proportionality, effort, stakes, calibration, code-quality, communication, area-03, area-06, child-class, parent-class, proposta]
last_updated: 2026-07-25
---

> # ⛔ NON VALIDATA — **PROPOSTA**; l'IMPIANTO è approvato, il contenuto no (#26)
> **NON usare per il training.** Provenienza tracciabile: il **placeholder** `right-effort-for-stakes` è
> approvato dall'utente (msg 1591) e la sua tabella-figlie lo prevedeva già come *«(futura)»*; l'unificazione
> **a una classe con più facce invece che a più classi** è indicazione esplicita (*"mi sembra un'ottima
> idea"*), e la creazione è stata autorizzata con *"ok tua reco"* (msg 1872). **Il contenuto di questo file
> non è stato revisionato** e il reward non è mai stato attaccato eseguendo (#22).
> **Padre**: [[class-constraint-fit-decision]] — a sua volta ⛔ non validata.

# Classe — CALIBRA LO SFORZO ALLA POSTA

> **Ruolo** (#20): il padre insegna a **scegliere l'opzione che combacia coi vincoli**, enumerando *quale risorsa · quale percorso · quale strumento*. Questa figlia occupa la dimensione **«quanto»**: non *cosa* scegliere, ma **quanta cura metterci**. Lo slot era già dichiarato nella tabella del padre come `*(futura)* right-effort-for-stakes` — questo file lo riempie.
> **È a sua volta padre di** [[class-code-optimization]] (la faccia 3 applicata al codice, con un contenuto tecnico proprio).

---

## La skill-RADICE

> **La quantità di rigore, profondità, struttura e cura si commisura a CIÒ CHE È IN GIOCO** — non a un default fisso, non al massimo disponibile, non a quanto tempo si ha.

**Perché è una skill e non una preferenza**: entrambi gli errori sono reali e costosi, e sono **opposti**.
- **Sotto**: trattare come banale ciò che non lo è → il difetto entra dove pesa.
- **Sopra**: trattare come critico ciò che è banale → costo puro, lentezza, e **inflazione del segnale** (se ogni cosa è trattata come critica, "critico" smette di significare qualcosa).

Il fallimento più comune **non è scegliere male il livello: è non porsi la domanda** — applicare lo stesso registro a tutto, e sembrare rigorosi ovunque o sbrigativi ovunque. Chi non calibra ha **un solo comportamento**, e un solo comportamento è giusto solo per caso.

**Il perno è la stima della posta**, e ha due parametri che vanno letti insieme: **quanto è grave sbagliare** e **quanto è reversibile**. Un errore grave ma banalmente reversibile può meritare meno cura di uno lieve ma permanente.

---

## Le QUATTRO facce (una classe, non quattro — SSOT #16)

| # | Faccia | Cosa si calibra | L'errore tipico |
|---|---|---|---|
| **1** | **profondità di VERIFICA** (⭐#0) | quanti livelli scendere prima di dire *"è così"* | fermarsi al primo livello che dà una risposta — *"ho guardato dalla finestra: il sole è giallo"* |
| **2** | **registro della COMUNICAZIONE** (P4) | quanta struttura, spiegazione e scomposizione mettere nella risposta | il rito a tre paragrafi su una domanda da una riga · o la riga secca dove serviva il ragionamento |
| **3** | **stile del CODICE** (M8) | ottimizzato e robusto se andrà in **uso**; basilare e lineare se serve a **spiegare** | l'esempio didattico con gestione errori e parallelismo (illeggibile) · il codice di produzione scritto come un esempio |
| **4** | **scala dell'INGEGNERIZZAZIONE** (M2) | quanta struttura dare all'impianto | *"è usa-e-getta, lo scrivo alla buona"* — e se è **grosso**, il disordine si propaga ovunque |

### La faccia 4 ha una precisazione che la rende non ovvia `[EXTRACTED — utente msg 1799]`

> Un progetto **usa-e-getta ma grosso o complesso** va comunque iniziato con **buona ingegnerizzazione, almeno nelle parti più usate** — altrimenti il disordine si propaga in **tutta** la base, e un errore commesso presto si moltiplica.

**Il parametro non è la durata prevista del progetto, è la sua COMPLESSITÀ** — e la calibrazione non è uniforme sul progetto: si concentra **sulle parti che tutto il resto attraversa**. È la stessa logica del *"non tutto merita il razzo"* (#0), applicata **per parti** invece che al tutto: *dentro* un lavoro sciatto per buone ragioni, i punti di passaggio meritano cura comunque.

**Che le quattro siano UNA classe** è la scelta di design (SSOT #16): la skill sottostante — *leggere la posta e dosare* — è identica; cambia solo **cosa si dosa**. Quattro classi separate la farebbero imparare quattro volte, e nessuna trasferirebbe alle altre.

---

## Esempi POSITIVI (cross-dominio #19)

- **[A1 · faccia 3]** *"Fammi vedere come funziona una coda"* → codice **lineare**, nessuna gestione errori, nomi espliciti. Lo stesso concetto per un servizio che gira davvero → limiti, errori, contesa. **Fail**: lo stesso registro in entrambi i casi.
- **[A2 · faccia 4]** Uno script di migrazione **una-tantum** che tocca 40 tabelle: è usa-e-getta, ma la parte che tutte le altre attraversano va scritta pulita. **Fail**: *"tanto lo buttiamo"* → l'errore si moltiplica per 40.
- **[A3 · faccia 1]** *"Su che porta gira?"* → si guarda la configurazione, si risponde. *"Possiamo esporlo pubblicamente?"* → serve il livello che chiude, non il primo che risponde.
- **[B1 · vita quotidiana]** Appendere un quadro leggero: un chiodo e via. Appendere una mensola che reggerà i libri sopra il letto: tasselli giusti, si controlla il muro. **La stessa persona, due livelli diversi** — e chi tratta il chiodo come la mensola perde tempo, chi fa il contrario si sveglia sotto i libri.
- **[B2 · comunicazione]** *"Che ore sono a Tokyo?"* → il numero. *"Mi conviene accettare questo lavoro?"* → struttura, alternative, cosa dipende da lui. **Fail**: la scomposizione formale sulla prima.
- **[C1 · sistemico]** Un controllo di qualità su un lotto di bulloni per mobili vs uno per travi portanti: stessa fabbrica, stesso oggetto, **posta diversa** → campionamento diverso.

## Esempi NEGATIVI (#21 — la simmetria è il cuore)

- **[N1 · massimo rigore ovunque]** Applica il livello più alto a tutto, *"per sicurezza"*. **Fail**: costo puro + **inflazione del segnale**. È l'hack `sempre-il-massimo`, che a intelligenza zero **sembra virtuoso** ed è il più difficile da bocciare per un valutatore umano.
- **[N2 · la posta è ALTA ma il compito è banale]** Sistema critico, ma l'operazione è aggiungere una riga a un commento. **Gold**: la posta **non è del compito** — si procede leggeri. **Fail**: istruttoria perché *"il sistema è critico"* (confondere la criticità del **contesto** con quella dell'**azione**).
- **[N3 · la posta è BASSA ma l'azione è irreversibile]** Dati di prova senza valore, ma l'operazione cancella e non si torna indietro. **Gold**: cura **alta** — la reversibilità pesa quanto la gravità. **Fail**: leggerezza perché *"tanto sono dati finti"*.
- **[N4 · sotto-ingegnerizzare il punto di passaggio]** Progetto piccolo, ma un modulo che tutti gli altri attraversano. **Gold**: quel modulo va scritto bene **anche se il progetto è minuscolo**. **Fail**: uniformare al basso.
- **[N5 · sovra-ingegnerizzare la foglia]** Progetto grande, ma una funzione usata in un punto solo e mai più. **Gold**: semplice. **Fail**: uniformare all'alto perché *"il progetto è importante"* — è il gemello speculare di N4, e insieme dicono che **la calibrazione è per PARTI, non per progetto**.

---

## Reward (outcome-anchored #10 + simmetrico)

- **① ESITO SOTTO LA POSTA DICHIARATA** — la fixture dichiara la posta reale (gravità × reversibilità) e l'esito atteso: l'artefatto **regge** quando la posta è alta (il difetto che il rigore avrebbe colto **non c'è**), ed è **snello** quando è bassa (nessuna struttura non richiesta). Predicato **eseguibile** su entrambi i poli.
- **② COSTO** — misurato (passi, lunghezza, struttura introdotta) e **confrontato con la posta**: senza questo termine `sempre-il-massimo` (N1) vince, perché ① da solo non lo penalizza mai.
- **③ GRANULARITÀ (faccia 4)** — la calibrazione è **per parti**: si verifica che i **punti di passaggio** abbiano cura alta e le **foglie** no, dal grafo di dipendenza dato in fixture (N4/N5 sono un minimal-pair sullo stesso progetto).
- ⚠️ **Check #32**: il ramo *«quanto sforzo?»* è ≈ funzione diretta del campo `posta` → **il campo posta non si gronda per-esempio** (sarebbe premiare l'etichetta invece della dosatura). Va al **distribuzionale**: held-out bilanciato su poste alte/basse + **ECE** sulla calibrazione *posta → sforzo speso*. Per-esempio si grondano ①, ② e ③, che sono **esiti misurati**, non giudizi sul ramo.

**Hack-check**: `sempre-il-massimo` → ② · `sempre-il-minimo` → ① · `calibra-sul-progetto-invece-che-sulla-parte` → ③ (N4/N5) · `dichiara-la-posta-e-non-cambiare-comportamento` → ① e ②: la stima recitata non muove l'esito, e la cerimonia non paga.

---

## GAP-SCAN (#36)

- **(a) ASSE**: le quattro facce coprono *verifica · comunicazione · codice · impianto*. ⚠️ **Manca il TEMPO**: quanta **fretta** è appropriata (una decisione presa in dieci secondi vs una rimandata a domani) è lo stesso asse e non è nominata. **Gap dichiarato.**
- **(b) CICLO-DI-VITA**: *stimare la posta → dosare → **ri-dosare quando la posta cambia*** — il prototipo che diventa produzione senza che nessuno rialzi il livello. ⚠️ **Terza fase scoperta** (è la stessa forma del gap dichiarato in [[class-retroactive-decision-propagation]]: cambia il contesto, nessuno rivede). **Gap dichiarato.**
- **(c) INVERSO**: coperto e **strutturale** — N1/N2/N5 sono il polo *"troppo"*, N3/N4 il polo *"troppo poco"*, ed è la ragione per cui ② e ③ esistono nel reward.
- **(d) COERENZA DI RADICE**: unifica **quattro** proposte che erano su tre padri diversi (`todo.md` §*«unificazione M2 + M8 + P4»*) → da tre radici a una. ✅ È esattamente il caso che #36(d) prescrive di risolvere allargando invece di moltiplicare.

---

## Links

[[class-constraint-fit-decision]] (padre) · [[class-code-optimization]] (figlia: la faccia 3 applicata al codice) · [[class-project-stakes-awareness]] (**fornisce la POSTA** — questa classe la consuma: là si percepisce quanto conta il progetto, qui si decide quanto sforzo metterci) · [[class-instrument-coverage-scope]] (la faccia 1 ha bisogno di sapere **fin dove** guarda lo strumento) · [[../fix-ledger]].

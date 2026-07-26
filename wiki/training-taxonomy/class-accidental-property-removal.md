---
name: class-accidental-property-removal
description: Classe (figlia di consequence-intention-conflict) PROPOSTA — riparare un difetto puo' APRIRNE un altro, quando una proprieta' desiderabile reggeva per una ragione ACCIDENTALE e non per progetto. Il fix e' corretto, l'intenzione e' giusta, e proprio per questo nessuno sospetta nulla - ma il comportamento sbagliato stava TRATTENENDO qualcosa, e ripararlo lo lascia passare. La skill - prima di cambiare qualcosa, chiedersi che cosa oggi dipende dal suo comportamento ATTUALE, incluso il comportamento che e' sbagliato. Complemento inverso della recinzione di Chesterton - la' una ragione esiste e va cercata, qui NON C'E' NESSUNA RAGIONE DA TROVARE, perche' l'effetto era un sottoprodotto che nessuno sapeva di avere.
type: training-class
tags: [reasoning, consequences, refactoring, safety, regression, area-03, area-06, child-class, proposta]
last_updated: 2026-07-25
---

> # ⛔ NON VALIDATA — **PROPOSTA** (#26)
> **NON usare per il training.** Filata su mandato *"prendi questi esempi, estrai le parti buone e
> cattive… fai un lavoro fatto bene"* (utente msg 1885) durante il loop autonomo. ⚠️ Il mandato copre
> **il lavoro**, non la ratifica: nessuno ha approvato questa classe né revisionato il file (#22).
> **Padre**: [[class-consequence-intention-conflict]] — a sua volta ⛔ non validata.
> **Origine**: caso reale portato dall'utente (grezzo in `wiki/_private/`, non pubblicabile).

# Classe (figlia) — RIPARARE UN DIFETTO PUÒ APRIRNE UN ALTRO

> **Ruolo** (#20): il padre insegna a tracciare *azione → conseguenza* e verificare che la conseguenza non contraddica l'**intenzione** (le soluzioni auto-sconfiggenti). Qui la torsione è più insidiosa: **la conseguenza non contraddice l'intenzione del fix** — il fix riesce, il difetto è davvero riparato — ma **contraddice un'altra proprietà del sistema, che nessuno aveva mai dichiarato** perché nessuno sapeva di averla.

---

## Il gap

Una proprietà desiderabile può reggere per **due ragioni completamente diverse**, e dall'esterno **sono indistinguibili**:

- **per progetto** — qualcuno l'ha voluta, e c'è un meccanismo che la produce;
- **per accidente** — è il **sottoprodotto di un difetto**, e nessuno lo sa. *Nessun documento la nomina, nessun test la copre, nessuno la difende — perché nessuno sa che esiste.*

Finché tutto funziona, la differenza non si vede. Si vede **nell'istante in cui si ripara il difetto**: la proprietà cade, e cade **in silenzio**.

### Il caso reale `[EXTRACTED — misurato]`

Un controllo di sicurezza aveva un ramo che **non veniva mai eseguito**: per un difetto a monte, gli input che avrebbero dovuto passare di lì finivano altrove e morivano per errore. **Erano respinti — per caso.**
Riparare quel ramo **era la cosa giusta da fare**. E ha convertito un **blocco accidentale** in un **passaggio aperto**.

> Il difetto non era nel fix. Il difetto era che **la sicurezza dipendeva da un bug** — e nessuno poteva saperlo, perché la protezione non era scritta da nessuna parte: era un effetto collaterale.
> Peggio: la verifica fatta dopo il fix **testava il caso appena toccato**, cioè il ramo riparato. Guardava esattamente dove il lavoro era stato fatto — e il buco stava **in ciò che il difetto teneva chiuso**, non in ciò che era stato riparato.

### Perché è il COMPLEMENTO INVERSO della recinzione di Chesterton

| | recinzione di Chesterton | **questa classe** |
|---|---|---|
| l'oggetto | un artefatto **intenzionale** (un controllo, un'attesa, un vincolo) | un **difetto** |
| la ragione | **esiste**, ed è recuperabile nella storia | **non esiste**: l'effetto è un sottoprodotto che nessuno ha voluto |
| il rimedio | **cercarla** prima di rimuovere ([[class-instrument-coverage-scope]] §faccia-b) | **non c'è niente da cercare** → va **misurato** cosa dipende dal comportamento attuale |
| perché sfugge | non vedi il motivo | **non c'è un motivo da vedere** — e il fix è corretto, quindi nessuno sospetta |

> **È la ragione per cui serve una classe separata**: chi ha imparato Chesterton cerca **nella storia** — e qui la storia **non contiene nulla**. La domanda giusta non è *"perché è così?"* ma **«che cosa smette di essere vero quando lo aggiusto?»**

---

## La skill

> **Prima di cambiare qualcosa, chiediti che cosa OGGI dipende dal suo comportamento attuale — incluso il comportamento che è sbagliato.**

Tre movimenti:

1. **Nominare l'effetto attuale per intero**, non solo la parte difettosa: *"questo ramo non gira"* significa anche *"tutto ciò che ci passerebbe oggi finisce altrove"*.
2. **Chiedersi chi ne beneficia**: qualcosa oggi **non accade** grazie a questo difetto? Se sì, quel qualcosa **perde la sua protezione** nel momento del fix.
3. **Verificare DOPO il fix ciò che il difetto teneva chiuso**, non ciò che è stato riparato. È il punto in cui quasi tutti guardano nel posto sbagliato: **si verifica il proprio lavoro, non il suo perimetro d'ombra**.

---

## Esempi POSITIVI (cross-dominio #19 — fixture self-contained #22)

- **[A1 · tecnico, il caso nativo]** In fixture: un controllo ha un ramo morto; per un difetto a monte gli input pericolosi non lo raggiungono e vengono respinti da un errore casuale. Il compito è riparare il difetto a monte. **Gold**: riparare **e** accorgersi che ora quegli input **raggiungono** il ramo — quindi verificare che il ramo li respinga davvero. **Fail**: riparare, testare il caso riparato, dichiarare chiuso.
- **[A2 · prestazioni]** Una funzione lenta faceva da freno naturale a un carico a valle che non ha limiti propri. Ottimizzandola, il carico a valle **satura**. **Gold**: nominare la dipendenza prima. **Fail**: *"l'ho resa 10 volte più veloce"* — ed è vero, ed è il problema.
- **[B1 · vita quotidiana]** Una porta che si chiudeva male restava sempre socchiusa, e per questo il gatto poteva rientrare. Riparata la serratura, il gatto resta fuori. **Gold**: prima di chiamare il fabbro, accorgersi di **cosa quella porta rotta stava permettendo**. **Fail**: sorpresa alla prima notte.
- **[B2 · abitudini]** Il computer lento costringeva a fare una pausa mentre compilava. Sostituito, le pause spariscono e la stanchezza aumenta. **Gold**: riconoscere che un limite **produceva** un beneficio non voluto, e sostituirlo con uno **scelto**.
- **[C1 · organizzazione]** Un passaggio burocratico inutile rallentava le richieste, e quel ritardo dava tempo di intercettare gli errori. Rimosso, le richieste sbagliate arrivano in fondo. **Gold**: il controllo va **reso esplicito** prima di togliere il rallentamento. **Fail**: efficienza aumentata, difetti pure.
- **[C2 · ecologia/urbanistica]** Una strada dissestata teneva bassa la velocità davanti alla scuola. Asfaltata, le auto accelerano. **Gold**: se il dosso non c'è, l'asfalto lo richiede. **Fail**: *"abbiamo solo sistemato la strada"*.

---

## Esempi NEGATIVI (#21 — senza questi si insegna a non riparare mai)

- **[N1 · niente dipende dal difetto]** Il difetto è **isolato**: la fixture dichiara che nulla poggia sul suo comportamento. **Gold**: **riparare e basta** — nessuna indagine da fare. **Fail**: istruttoria su ogni fix → paralisi, ed è l'hack `non-toccare-niente`, che a intelligenza zero **sembra prudenza**.
- **[N2 · la proprietà accidentale NON è desiderabile]** Il difetto tratteneva qualcosa che **doveva passare**. **Gold**: ripararlo **sblocca** una funzione legittima — è un beneficio, non un rischio. **Fail**: trattare ogni cambiamento di comportamento come una regressione.
- **[N3 · la proprietà è già protetta ALTROVE]** Ciò che il difetto tratteneva è coperto anche da un meccanismo **vero**, dichiarato. **Gold**: riparare senza aggiungere nulla — la protezione non dipendeva dall'accidente. **Fail**: duplicare una difesa che c'è già.
- **[N4 · il rimedio giusto NON è tenersi il difetto]** Scoperto che la sicurezza poggiava su un bug, **conservare il bug è la risposta sbagliata**. **Gold**: riparare **e** rendere esplicita la protezione che era implicita. **Fail (in entrambi i versi)**: lasciare il difetto *"perché protegge"*, **oppure** ripararlo e non sostituire ciò che teneva.
- **[N5 · il cambiamento è reversibile e a costo nullo]** Contesto usa-e-getta, nessuna conseguenza. **Gold**: procedere — la profondità dell'indagine si commisura alla posta (⭐#0, e [[class-right-effort-for-stakes]]). **Fail**: analisi delle dipendenze per un cambio banale.

---

## Reward (outcome-anchored #10 + simmetrico)

- **① OUTCOME — lo stato finale dopo il fix.** La fixture sa cosa il difetto tratteneva: si verifica se, **dopo il cambiamento**, quella cosa **passa** (regressione) o è ancora trattenuta **da un meccanismo esplicito**. Predicato eseguibile. *(Nessun credito per aver detto "valuto gli impatti".)*
- **② IL FIX È STATO FATTO** — con peso pieno: il difetto originale **deve** essere riparato. Senza questo termine, `non-toccare-niente` (N1) vincerebbe, e insegneremmo la paralisi.
- **③ DOVE HA GUARDATO** — la verifica prodotta copre **ciò che il difetto teneva chiuso**, non solo il ramo riparato. Grondabile dal trace come **insieme** dei casi verificati, confrontato con l'insieme che la fixture dichiara esposto dal cambiamento. ⊥ al ramo: si può riparare bene e guardare nel posto sbagliato, e viceversa.
- ⚠️ **Check #32**: il campo `qualcosa-dipende-dal-difetto` **determina il ramo** → **non si gronda per-esempio**; va al **distribuzionale** (held-out bilanciato dipende↔non-dipende, con N1/N2/N3 in numero pari ai positivi) + **ECE**. Per-esempio restano ①②③, tutti esiti.

**Hack-check**: `non-riparare-mai` → ② · `ripara-e-verifica-solo-il-fix` → ① (la regressione compare nello stato finale) · `dichiara-che-valuti-gli-impatti` → ③ è un insieme di casi verificati, la dichiarazione non entra · `tieniti-il-difetto-perche'-protegge` → **N4** + ② · `tratta-ogni-cambio-come-regressione` → **N2/N5** + costo.

---

## GAP-SCAN (#36)

- **(a) ASSE — «una proprietà regge per progetto o per accidente?»**: coperte entrambe le posizioni (la ragione esiste → Chesterton, in `instrument-coverage-scope`; la ragione **non** esiste → questa). ⚠️ **Terza posizione dichiarata e scoperta**: *la proprietà regge per progetto, ma il meccanismo che la produce **è cambiato di significato*** (esiste ancora, fa ancora qualcosa, ma non più quella cosa). Nessuna classe la insegna.
- **(b) CICLO-DI-VITA**: *scoprire la dipendenza accidentale → riparare → **rendere esplicito ciò che era implicito*** — la terza fase è in **N4** ed è obbligatoria, non opzionale.
- **(c) INVERSO**: coperto (N1, N2, N5: riparare è la risposta giusta, e l'indagine ha un costo).
- **(d) COERENZA DI RADICE**: sotto `consequence-intention-conflict` perché l'oggetto è **la conseguenza non prevista di un'azione deliberata**; la differenza col padre (la conseguenza non contraddice l'intenzione **del fix**, ma una proprietà mai dichiarata) è argomentata in apertura. ✅

---

## Links

[[class-consequence-intention-conflict]] (padre) · **[[class-self-sealing-decision]]** (**sorella**, stesso asse — *togliere qualcosa ha un secondo effetto che non guardi*, altra posizione: **qui** la proprietà reggeva **per ACCIDENTE** e non sapevi che quel pezzo la tenesse; **là** ciò che si toglie è **il revisore della premessa su cui si sta decidendo** — lo sapevi benissimo, non hai visto che sorvegliava *anche la ragione per cui lo spegnevi*) · [[class-instrument-coverage-scope]] (§faccia-b: la recinzione di Chesterton — **complemento inverso**) · [[class-retroactive-decision-propagation]] (cugina: là una scelta nuova invalida una vecchia, qui un fix invalida una protezione implicita) · [[class-right-effort-for-stakes]] (N5: la profondità dell'indagine si commisura alla posta) · [[class-artifact-reachability-completion]].

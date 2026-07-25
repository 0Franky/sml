---
name: class-defect-shape-reading
description: Classe (figlia di metacognitive-self-audit, sorella di exposure-measurement-before-remedy) PROPOSTA — leggere la FORMA dell'insieme dei difetti, non i difetti uno per uno. Se N problemi hanno la STESSA forma non sono N foglie da riparare - manca un punto di passaggio OBBLIGATO, e riparare le foglie lascia intatta la causa: la prossima nascera' con lo stesso buco. Simmetrica - vedere un pattern dove ci sono coincidenze porta ad astrazioni premature e a un'infrastruttura che nessuno ha chiesto. Il discriminante con la sorella - quella misura QUANTO e' esteso il problema, questa misura CHE FORMA ha.
type: training-class
tags: [metacognition, self-audit, diagnosis, pattern, root-cause, area-03, area-06, child-class, proposta]
last_updated: 2026-07-25
---

> # ⛔ NON VALIDATA — **PROPOSTA** (#26)
> **NON usare per il training.** Filata nel loop autonomo su mandato *"estrai le parti buone e cattive…
> fai un lavoro fatto bene"* (utente msg 1885). Il mandato copre **il lavoro**, non la ratifica: nessuno
> ha approvato questa classe né revisionato il file (#22).
> **Padre**: [[class-metacognitive-self-audit]] — a sua volta ⛔ non validata.

# Classe (figlia) — LA FORMA DEI DIFETTI DICE LA CURA

> **Ruolo** (#20): il padre insegna a **sospendere la fiducia nel proprio stato e verificarlo contro un riferimento oggettivo**. Qui l'oggetto verificato non è un singolo giudizio: è **la propria lista di problemi**, letta come **dato** invece che come **coda di lavoro**.
> **Sorella**: [[class-exposure-measurement-before-remedy]]. Entrambe rifiutano di rimediare istanza-per-istanza senza guardare l'insieme, ma misurano **cose diverse**: quella l'**ESTENSIONE** (*quanto è largo?*), questa la **FORMA** (*che aspetto hanno?*). Sono ortogonali: un problema può essere piccolo e avere una forma che rivela una causa comune, o vasto e composto di casi genuinamente scorrelati.

---

## Il gap

Davanti a una lista di problemi la reazione naturale è **trattarla come una coda**: si prende il primo, si ripara, si passa al secondo. Ogni riparazione è corretta, il conteggio scende, e **il lavoro sembra procedere**.

Ma una lista di difetti è anche **un'osservazione sul sistema**, e la sua **forma** dice qualcosa che nessuno degli elementi dice da solo:

> **Se N problemi hanno la stessa forma, non sono N foglie: è UN punto di passaggio obbligato che manca.**

E riparare le foglie **lascia intatta la causa** — quindi la prossima nascerà con lo stesso buco, e nessuno collegherà la nuova alle vecchie perché saranno già state chiuse.

### Il caso reale `[EXTRACTED]`

Da una campagna su un sistema reale, guardando **gli ultimi ~10 problemi trovati** invece dell'ultimo:
> *"Non sono bug su una foglia. Sono tutti la stessa cosa: **mancava il blocco obbligatorio**. Il controllo esisteva e nessuna richiesta ci passava. La stessa cosa era risolta in tre modi diversi in tre punti, in nessuno dei quali condiviso. Chi dimentica il controllo è aperto. **Fixare la foglia lascia intatta la causa: la prossima foglia nascerà con lo stesso buco.**"*

E la conseguenza operativa che ne è seguita — che è il **vero output della skill**: per ogni classe di cose che attraversa il sistema, (1) **qual è il punto obbligato**, (2) se non esiste **crearlo**, (3) **cosa succede a chi lo salta** — deve fallire, non passare, (4) un controllo **a macchina** che se ne accorge quando ne nasce uno nuovo.

> **La riga che riassume la skill**: *smette di essere una caccia e diventa una copertura* — e alla fine si può dire *"questa classe è coperta"* **indicando il punto obbligato**, invece di **elencare i fix**.

---

## La skill

> **Prima di attaccare la lista, leggila.** Non *"quale riparo per primo?"* ma **«questi hanno una forma in comune?»**

Tre movimenti:

1. **Astrarre ogni istanza alla sua forma** — non *"manca il controllo X nell'endpoint Y"* ma *"un ingresso senza punto di ammissione obbligato"*. La forma è quello che resta togliendo i nomi propri.
2. **Contare le forme, non gli elementi.** Dieci problemi con **una** forma sono un problema; dieci con **dieci** forme sono dieci problemi, e vanno trattati come tali.
3. **Se una forma domina, cambiare oggetto della cura**: non la foglia, ma **ciò che permette alla foglia di nascere**. E il criterio di completamento cambia con essa: non *"i dieci sono chiusi"* ma *"l'undicesimo non può nascere"*.

---

## Esempi POSITIVI (cross-dominio #19 — fixture self-contained #22)

- **[A1 · tecnico, il caso nativo]** In fixture: sei difetti in punti diversi, ognuno *"qui manca il controllo"*. **Gold**: nominare la forma comune — **non esiste un passaggio obbligato**, quindi ogni nuovo punto nasce scoperto — e proporre il punto unico + il controllo automatico che intercetta il prossimo. **Fail**: sei riparazioni corrette e la settima che nasce identica.
- **[A2 · il caso opposto, e va distinto]** Sei difetti che **non** hanno forma comune (uno di calcolo, uno di ortografia, uno di configurazione…). **Gold**: ripararli **uno per uno** — non c'è niente da astrarre. **Fail**: inventare un'astrazione che li accomuni a forza.
- **[B1 · vita quotidiana]** In casa si bruciano tre lampadine in un mese, sempre nella stessa stanza. **Gold**: non è sfortuna, è **l'impianto** — si guarda quello. **Fail**: la quarta lampadina.
- **[B2 · scuola]** Un ragazzo sbaglia molti esercizi diversi; guardandoli, sbaglia **sempre il passaggio con il segno meno**. **Gold**: si insegna quel passaggio, non si ricorreggono gli esercizi. **Fail**: correzione a uno a uno, stesso errore la settimana dopo.
- **[C1 · organizzazione]** Cinque reclami diversi, tutti da clienti che **hanno cambiato indirizzo** di recente. **Gold**: la forma è *"il cambio indirizzo non propaga"* — si guarda quello. **Fail**: cinque risposte cortesi e sei reclami il mese dopo.
- **[C2 · sanità/sicurezza]** Diversi infortuni in reparti diversi, tutti **a fine turno**. **Gold**: la forma non è il reparto, è **la stanchezza a fine turno** — si cambia il turno, non i cartelli nei reparti. **Fail**: un cartello nuovo per ogni reparto.

---

## Esempi NEGATIVI (#21 — il confine, e qui è particolarmente importante)

- **[N1 · coincidenza scambiata per pattern]** Tre problemi che *sembrano* simili ma la fixture dichiara cause indipendenti. **Gold**: ripararli separatamente e **dirlo**. **Fail**: costruire un'infrastruttura comune per tre casi che divergeranno — è l'astrazione prematura, e costa più dei tre fix.
- **[N2 · la forma c'è ma il punto obbligato ESISTE GIÀ]** I difetti condividono la forma, e il passaggio obbligato **c'è**: quello che manca è che qualcuno lo **usi**. **Gold**: la cura è l'adozione (o il controllo che la impone), **non** costruirne un secondo. **Fail**: un nuovo meccanismo accanto a quello ignorato — ora ce ne sono due, e divergeranno.
- **[N3 · N è troppo piccolo]** Due istanze. **Gold**: **dichiarare l'ipotesi** e continuare a osservare — due non fanno una distribuzione (#35b: una frequenza senza denominatore non è una misura). **Fail (nei due versi)**: proclamare una causa comune su due casi, **oppure** ignorare la somiglianza invece di annotarla.
- **[N4 · la cura strutturale costa più del problema]** La forma comune c'è, ma le istanze sono poche, innocue e il punto obbligato richiederebbe una ristrutturazione grossa. **Gold**: riparare le foglie **e tracciare la forma** per quando ne arriveranno altre. **Fail**: la ristrutturazione per tre casi banali ([[class-right-effort-for-stakes]]).
- **[N5 · più forme insieme]** La lista contiene **due** forme distinte più del rumore. **Gold**: separare e trattarle come due, senza forzare un'unica spiegazione. **Fail**: la teoria unificata che spiega tutto e non predice niente.

---

## Reward (outcome-anchored #10 + simmetrico)

- **① OUTCOME — l'undicesimo.** La fixture, dopo la soluzione proposta, **genera una nuova istanza** della stessa forma: passa o viene intercettata? È il predicato che distingue *"i dieci sono chiusi"* da *"l'undicesimo non può nascere"*, ed è **eseguibile**. *(Nessun credito per aver detto "vedo un pattern".)*
- **② LE ISTANZE ESISTENTI SONO CHIUSE** — con peso pieno: la cura strutturale **non esonera** dal riparare ciò che è già rotto. Senza questo termine, `proponi-sempre-una-riforma` vince senza sistemare nulla.
- **③ CORRETTEZZA DEL RAGGRUPPAMENTO** — quali istanze condividono la forma è **dato dalla fixture** (ogni istanza porta la sua causa) → si confronta col raggruppamento prodotto. ⊥ al ramo: si può raggruppare bene e proporre la cura sbagliata, e viceversa.
- ⚠️ **Check #32**: il campo `esiste-una-forma-comune` **determina il ramo** → **non si gronda per-esempio** (sarebbe premiare l'etichetta *"è un pattern"*). Va al **distribuzionale**: held-out bilanciato **con-forma ↔ senza-forma**, con N1/N3/N5 in numero pari ai positivi, + **ECE** sulla calibrazione. Per-esempio restano ①②③.

**Hack-check**: `vedi-sempre-un-pattern` → **N1/N3/N5** + ③ · `non-astrarre-mai` → ① (l'undicesimo nasce) · `proponi-la-riforma-e-non-riparare` → ② · `costruisci-un-meccanismo-nuovo-ogni-volta` → **N2** · `dichiara-la-forma-senza-proporre-il-punto-obbligato` → ①: la diagnosi che non cambia l'esito non paga.

---

## GAP-SCAN (#36)

- **(a) ASSE — come si legge un insieme di problemi**: **quanti** (estensione → la sorella) · **che forma** (questa) · ⚠️ **quando sono comparsi** — la dimensione **temporale** della distribuzione (*sono nati tutti dopo un certo cambiamento?*) **non è coperta da nessuna**, ed è spesso il segnale più forte di tutti. **Gap dichiarato.**
- **(b) CICLO-DI-VITA**: *osservare → astrarre la forma → curare la causa → **impedire la ricomparsa*** — la quarta fase è nel reward ① (l'undicesimo) e nel movimento 3, non è un di più.
- **(c) INVERSO**: coperto e strutturale (N1, N3, N5: il pattern che non c'è; N4: la cura sproporzionata).
- **(d) COERENZA DI RADICE**: sotto `metacognitive-self-audit` con la sorella `exposure-measurement-before-remedy`, e il discriminante fra le due (**quanto** vs **che forma**) è dichiarato in apertura. ✅

---

## Links

[[class-metacognitive-self-audit]] (padre) · [[class-exposure-measurement-before-remedy]] (sorella: l'estensione, non la forma) · [[class-accidental-property-removal]] (cugina: là il fix apre un buco, qui i fix non chiudono la causa) · [[class-right-effort-for-stakes]] (N4: la cura strutturale ha un costo) · [[class-artifact-reachability-completion]].

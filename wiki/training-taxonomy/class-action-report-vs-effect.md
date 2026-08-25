---
name: class-action-report-vs-effect
description: "🟡 PLACEMENT RATIFICATO 2026-08-25 — il contenuto NO (fixture e scorer non costruiti, non usare per il training). Classe figlia (c) di instrument-epistemic-reach, GEMELLA SIMMETRICA di tool-perception-fidelity: quella copre il polo NEGATIVO («non lo vedo» ≠ «non c'è»), questa copre il polo POSITIVO — «lo strumento dice fatto» ≠ «è fatto». Il resoconto di un'azione è una proprietà dell'ESECUZIONE, non dello stato del mondo: exit 0 significa «il processo è finito senza errori», non «il file adesso è giusto». La skill è verificare l'ARTEFATTO con un controllo che FALLIREBBE se l'azione fosse andata storta, proporzionalmente a quanto poco si controlla il canale. Simmetrica: ri-verificare il banale su canali senza quella classe di errore è spreco."
type: training-class
status: 🟡 PLACEMENT RATIFICATO 2026-08-25 (utente TG msg 2142) — ⚠️ il CONTENUTO resta non revisionato e le fixture non sono costruite: NON usare per il training
tags: [verifica, strumenti, affidabilita, area-metacognizione, proposta]
sources:
  - utente TG msg 2098 (2026-08-17) — «dopo ogni azione o batch di azioni su uno più file poi verifichi lo stato… quelle di cui non hai l'esatto controllo devono essere sempre verificate. Fallo, mettilo in wikicore e mettilo anche nel training set»
  - incidente reale dello stesso giorno (§Origine)
  - SSOT della regola operativa - cc-wiki-core `memory/rules/meta/verify-the-artifact-not-the-command-report`
last_updated: 2026-08-17
---

# 🟡 Il resoconto di un'azione non è il suo effetto

> **Padre**: [[class-instrument-epistemic-reach]]  ·  **Nonno**: [[class-metacognitive-self-audit]]
> ✅ Parentela **RATIFICATA** il **2026-08-25** (utente TG msg 2142, *«vai con la ratifica»*): il padre la elenca.

> **Serve direttamente [[../REQUISITO-AFFIDABILITA]]**: dichiarare fatto ciò che non è fatto — con la sicurezza di chi ha appena guardato — è **una delle vie con cui nasce la ritrattazione di domani**.

## Placement — argomentato, non scelto (#20 + #36)

**Padre proposto: [[class-instrument-epistemic-reach]]**, la cui skill-radice è *«un negativo è una proprietà dello STRUMENTO»*. Questa classe è la **stessa proprietà sul polo opposto**:

| polo | chi lo copre | l'errore |
|---|---|---|
| **negativo** | [[class-tool-perception-fidelity]] (figlia a) | *«non lo vedo, quindi non c'è»* |
| ⭐ **positivo** | **questa** | *«lo strumento dice fatto, quindi è fatto»* |

⭐ **Perché il padre è quello e non un altro** — lente **ASSE-COMPLETO** di #36(a): l'asse è *«cosa mi dice davvero lo strumento sul mondo?»*, e finora ne era coperta **una sola direzione**. Un resoconto di successo è **un'osservazione dello strumento su sé stesso**, esattamente come un'assenza di risultato.

**Perché NON le vicine** *(verificato col grep, non a memoria: nessuna classe copriva questo)*:
- **non** [[class-verification-seam-placement]] (figlia di ground-truth-integrity): lì il giunto è **sbagliato**; qui non si verifica **affatto** — ci si fida di un resoconto.
- **non** [[class-independent-verification-integrity]]: lì si eredita l'assunzione **di chi ha prodotto** l'artefatto; qui l'artefatto **l'ho prodotto io un secondo fa**, e il produttore è **il mio stesso comando**.

## L'origine — un caso vero, e istruttivo per come è stato scoperto

Uno script inserisce una riga in un file JavaScript e stampa `dump temporaneo inserito`. **Successo pieno.** La riga conteneva una sequenza di escape che il canale ha interpretato: stringa **non terminata**, file **sintatticamente rotto**, un hook di sistema **fuori uso per minuti**.

Il controllo che l'avrebbe intercettato (`node --check`) costava **un secondo** e non è stato eseguito — perché il comando *aveva detto di sì*.

⚠️ **E la scoperta è arrivata per una via laterale**: non da una verifica, ma dall'**assenza di un effetto atteso** (certi promemoria avevano smesso di arrivare). **Accorgersene per fortuna non è accorgersene** — e un caso in cui l'effetto mancante non fosse stato visibile sarebbe passato del tutto.

## La skill

**Verificare l'artefatto con un controllo che FALLIREBBE se l'azione fosse andata storta.** Se il controllo passerebbe comunque, non è una verifica: è una cerimonia.

E la mossa **migliore** della verifica: **preferire il canale che non ha il problema** — se la mutazione richiede escape e virgolette, si scrive un file e lo si esegue. Si **toglie** la classe di errore invece di verificarla.

**Proporzionalità (il polo simmetrico, #21)**: la profondità scala con **quanto poco si controlla il canale** × **quanto costa lo sbaglio**. Ri-leggere tre volte un file scritto con uno strumento che non ha quella classe di errore è **spreco**, ed è il fallimento speculare.

## Reward — ancorato all'OUTCOME, mai al gesto

⛔ **NON premiare**: *«ha eseguito un controllo dopo l'azione»* — è partecipazione, e diventa cerimonia pagata (#10). Un modello che aggiunge un `ls` dopo ogni comando lo massimizzerebbe senza acquisire nulla.

✅ **Premiare l'esito**: a valle, **lo stato consegnato è quello inteso?** Il fallimento si conta quando il modello **dichiara fatto** e l'artefatto è rotto — **indipendentemente** da quanti controlli abbia eseguito.
✅ **Secondo segnale, distributivo** (#32): il controllo scelto **discrimina**? Su fixture in cui l'azione è **stata sabotata**, il controllo del modello deve **fallire**. Un controllo che passa sia sul sano sia sul rotto vale **zero**, anche se è stato eseguito.

## Fixture e negativi *(da costruire — dichiarato)*

**Positivi**: sostituzione che **non matcha** (nessun errore, nessun effetto) · escape interpretato dal canale · operazione in blocco che tocca meno file del previsto · modifica a un processo **in esecuzione** che resta valido ma non riparte.
**Negativi (#21)**: azione su canale **pienamente controllato** con effetto banale → verificare è **spreco**; e il caso in cui il modello verifica **la cosa sbagliata** (che il file esista, quando la domanda era se il contenuto è corretto) → **deve perdere**, perché ha eseguito la cerimonia senza la sostanza.

## Transfer cross-dominio (#19)

- **[vita quotidiana]** il bonifico dice *«disposto»*: è l'ordine partito, non il denaro arrivato. Si controlla il **saldo del destinatario**, non la ricevuta.
- **[medicina]** *«terapia somministrata»* sulla cartella è la registrazione dell'atto, non l'effetto: si misura il **parametro**.
- **[logistica]** *«spedito»* non è *«consegnato»*, e il tracking racconta il **corriere**, non il pacco.
- **[costruzioni]** il collaudo firmato attesta che **qualcuno ha firmato**; il carico di prova attesta la **struttura**.

## Cosa manca *(#37 — dichiarato, non nascosto)*

Fixture e scorer **non costruiti**. La classe è **PROPOSTA**: placement argomentato ma **non ratificato** (#26), reward mai attaccato **eseguendo**. ⛔ **Non usare per il training finché non è validata.**

## Links
[[class-instrument-epistemic-reach]] (padre proposto) · [[class-tool-perception-fidelity]] (gemella, polo negativo) ·
[[class-verification-seam-placement]] · [[class-independent-verification-integrity]] · [[../REQUISITO-AFFIDABILITA]] ·
[[dataset-construction-playbook]]

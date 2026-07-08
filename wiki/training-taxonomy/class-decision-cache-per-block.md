---
name: class-decision-cache-per-block
description: Classe di training (figlia di action-execution-optimization) — riconoscere che una decisione (policy/scelta/classificazione) è COSTANTE su uno scope/blocco → deciderla UNA volta, cache-arla, applicarla a tutti gli item dello scope; ri-valutare solo ai confini dello scope o su invalidazione (cambio di premessa). Evita di ri-derivare la stessa decisione per ogni item (ri-ragionamento sprecato + rischio di incoerenza tra item). Capire quando la decisione NON è invariante e la cache è sbagliata.
type: training-class
tags: [planning, optimization, execution-strategy, decision-cache, memoization, coherence, agentic, area-01, area-08, held-out]
last_updated: 2026-07-08
---

# Classe di training — DECISION CACHE PER BLOCCO (decidi una volta, applica a tutto lo scope)

> **Stato**: figlia formalizzata dell'asse *decision-cache* del padre (già elencata nella sua tabella, [[class-action-execution-optimization]] §Le figlie). È la forma-*reasoning* di **optimization-first** (CLAUDE.md #8, [[../feedback_optimization_first]]) applicata al RAGIONAMENTO: non ri-derivare ciò che è invariante sullo scope.
> **Padre**: [[class-action-execution-optimization]] (asse *riuso di una decisione valida per un intero blocco*, regola #20). **Sorelle**: [[class-async-dispatch-and-prioritization]] (modalità sync/async), [[class-batching-repeated-ops]] (una analisi unica su item omogenei), le foglie parallelization/scheduling di [[area-01-organization-planning]]. Attraversa Area-1 (planning) + Area-8 (esecuzione agentic). Complementare a *batching*: il batch collassa **operazioni** identiche; la decision-cache riusa una **decisione** invariante.

## Il gap

Dato un blocco/scope di item su cui una decisione è **invariante** (la stessa policy/scelta/classificazione vale per tutti — es. "questa sessione usa lo schema v2", "in questo modulo il naming è snake_case", "questo batch di file va formattato con lo stile X"), il modello **ri-deriva la decisione da zero per ogni item**: ri-ragiona la stessa scelta N volte. Il costo è duplice: (a) **ri-ragionamento sprecato** (deriva N volte ciò che si decide una volta) e — più insidioso — (b) **rischio di incoerenza**: ri-decidendo per item, può arrivare a conclusioni *diverse* su item equivalenti (drift di decisione), producendo un output internamente contraddittorio. Non è un buco di conoscenza: è **mancata pianificazione della strategia di ragionamento** — non riconosce che la decisione ha uno *scope* più largo del singolo item.

## La skill (imparata una volta)

Prima di decidere per il singolo item, fare un **triage di scope della decisione**:

1. **Scope?** Questa decisione (policy/scelta/classificazione) è **costante su un blocco** di item, o cambia legittimamente per-item? Identifica il *confine* dello scope su cui è invariante.
2. **Se invariante sul blocco** → **decidi UNA volta**, **cache**-a l'esito, **applica** a tutti gli item dello scope. Non ri-ragionarla per ciascuno.
3. **Coerenza**: applicando la decisione cache-ata garantisci che tutti gli item del blocco siano trattati **in modo coerente** (elimini il drift di ri-decisione).
4. **Confini & invalidazione**: **ri-valuta** la decisione SOLO (a) quando esci dallo scope (nuovo blocco) oppure (b) quando una **premessa cambia** (evento di invalidazione: cambia il contesto, arriva un dato che rende la decisione stale). Una cache mai invalidata quando la premessa cambia produce una decisione **stantia** (N3).
5. **Costo/rischio**: se ri-decidere è *economico* E il rischio-staleness è *alto* (la decisione tende a cambiare), la cache può non valere la pena (N2). Se la decisione dovrebbe adattarsi per-item, cache-arla **perde la sfumatura** (N5).

Regola pratica: *"questa decisione vale per tutto il blocco? → decidila una volta e riusala; ri-decidi solo al confine o se cambia una premessa."*

## Gold example (HELD-OUT di validazione — istanza osservata, NON nel training)

Due istanze osservate, tenute **held-out**:
- La foglia **Area-1 "decisione-vale-per-blocco (decision cache)"** ([[area-01-organization-planning]]): quando una scelta di planning è costante su un blocco di sotto-task, si fissa una volta e si applica, invece di ri-deciderla per ogni sotto-task.
- Il pattern **criticality "self-versioning: decidi una volta per sessione"** ([[gold-example-area02-criticality]]): la decisione di versioning/policy si prende **una volta per sessione** e vale per tutte le operazioni della sessione, invece di ri-derivarla a ogni operazione (che rischierebbe di produrre versioni/policy incoerenti nella stessa sessione).

Tenuti **held-out**: se il modello impara la skill deve gestire questi pattern via transfer, non per averli memorizzati ([[../feedback_intelligence_gap_to_training_class]], decontaminazione).

## Transfer examples (domini DIVERSI — OBBLIGATORIO cross-campo, NON solo software)

> **Regola di generalizzazione** (utente msg 1186, CLAUDE.md #19, [[../feedback_transfer_always_cross_domain]]): il transfer NON deve concentrarsi in un'area (men che meno solo software) → altrimenti il modello impara "decision-cache = cosa del compilatore" e **localizza** la skill. La logica astratta — *"una scelta invariante su uno scope si prende una volta e si applica a tutto lo scope, coerentemente; si ri-decide solo al confine o al cambio di premessa"* — vale ovunque (è il principio di **hoisting dell'invariante / standardizzazione / precedente**).

Ogni task presenta un blocco di item con una decisione etichettata invariante o variabile (a volte con un evento di cambio-premessa a metà); l'oracolo misura se il ragionatore **decide una volta e applica coerentemente** dove invariante, E **ri-valuta correttamente** al confine/invalidazione, senza errori da cache-stantia.

### A — Software / sistemi (dove è nato)
1. **Hoist di loop-invariant (compilatore)**: un calcolo che non dipende dall'indice del loop va **sollevato fuori** dal loop e calcolato una volta, non ri-eseguito a ogni iterazione. È la decision-cache formalizzata dalla compilazione.
2. **Risolvere la config una volta, non per-request**: leggere/parsare/validare la configurazione **all'avvio** e riusarla, invece di ri-risolverla a ogni richiesta (ri-lavoro + rischio che due richieste vedano config diverse).
3. **Memoizzazione di una funzione pura**: per input uguale, l'output è invariante → cache-a il risultato invece di ri-calcolarlo. (Ma se la funzione **non** è pura / l'input cambia stato, la memoizzazione è sbagliata → N1/N5.)
4. **Decidere lo schema una volta per la migrazione**: fissare la mappatura/schema-target **una volta** per l'intera migrazione e applicarla a ogni riga, invece di ri-decidere la mappatura riga-per-riga (che produrrebbe righe migrate in modo incoerente).

### B — Vita quotidiana (scelte basilari)
5. **Menù della settimana deciso una volta vs a ogni pasto**: pianificare i pasti della settimana in una sessione e seguirli, invece di ri-decidere "cosa mangio?" ad ogni pasto (ri-deliberazione quotidiana + spesa incoerente).
6. **Regola "a novembre porto sempre l'ombrello"**: adottare una regola-di-stagione (decisione cache-ata sul blocco "novembre") invece di deliberare ogni mattina guardando il cielo — e ri-valutarla al **confine** (arriva la primavera = cambio-premessa, N3/N4-safe).
7. **Dress-code deciso una volta per il viaggio**: scegliere lo stile/valigia in base a meta e clima **una volta** all'inizio del viaggio, invece di ri-decidere l'outfit da capo ogni giorno senza un criterio stabile (→ incoerenza, dimenticanze).

### C — Scelte complesse cross-dominio (governance · diritto · operations · standard)
8. **Policy aziendale vs caso-per-caso**: fissare una **policy** (es. rimborsi, ferie, sicurezza) applicata uniformemente, invece di decidere ad-hoc ogni caso — la policy garantisce **coerenza** ed evita il drift/arbitrarietà del giudizio ripetuto (e si ri-valuta al **review periodico** = confine).
9. **Precedente giudiziario (stare decisis)**: una volta stabilito il principio in un caso, i casi analoghi lo **riusano** invece di ri-argomentare da zero — coerenza tra decisioni + economia di deliberazione; si rivede solo con un *overruling* (cambio-premessa esplicito).
10. **Standard Operating Procedure (SOP)**: la decisione operativa è codificata una volta nella SOP e applicata a ogni esecuzione, invece di re-inventare la procedura ogni turno — riduce errori e varianza. Va aggiornata quando cambiano le condizioni (invalidazione).
11. **Standard tecnico condiviso**: adottare uno standard (protocollo, formato, unità di misura) una volta per l'intero progetto/consorzio e applicarlo ovunque, invece di rinegoziare la scelta per ogni componente — interoperabilità e coerenza sistemica.

> Dal banale (menù della settimana) al sistemico (stare decisis) la logica astratta è identica: **la scelta è invariante sullo scope? Decidila una volta, applicala coerentemente a tutto lo scope, ri-valutala solo al confine o quando cambia una premessa.**

## Esempi NEGATIVI (il CONFINE — quando NON cache-are, regola #21)

> I negativi insegnano il confine e rendono il segnale discriminativo (CLAUDE.md #21, [[../feedback_negative_examples_and_dataset_completeness]]). Senza, "cache-sempre" diventa un hack.

- **N1 — la decisione NON è davvero invariante**: sembra costante sul blocco ma il contesto **cambia per item** (ogni item ha condizioni diverse che spostano la scelta giusta). Cache-arla → applica la decisione **sbagliata** agli item dove il contesto differisce. Qui si decide per-item; la cache è la scelta SBAGLIATA.
- **N2 — ri-decidere è economico + alto rischio-staleness**: la decisione è banale da ri-derivare *e* tende a cambiare spesso → cache-arla aggiunge complessità di gestione/invalidazione che non ripaga (e rischia staleness). Meglio ri-valutare al volo.
- **N3 — cache mai invalidata quando la premessa cambia (decisione STALE)**: la decisione era giusta all'inizio, ma a metà del blocco una **premessa cambia** (nuovo dato, nuovo vincolo) → continuare ad applicare la cache produce una decisione **stantia/sbagliata**. Il fallimento non è cache-are, è **non invalidare** al cambio-premessa. (È il modo-di-fallimento peggiore: silenziosamente sbagliato.)
- **N4 — un solo item (niente blocco)**: c'è un solo item nello scope → non c'è un blocco su cui ammortizzare la decisione. Cache-are è cerimonia; decidi e applica.
- **N5 — over-caching di una decisione che dovrebbe adattarsi per-item**: forzare l'uniformità dove ogni item merita una scelta su misura → si **perde la sfumatura** (es. classificare tutti gli item di un blocco con la stessa etichetta quando differiscono davvero). L'uniformità coerente è un pregio solo se la decisione è *legittimamente* invariante.

## Reward (ANCORATO all'OUTCOME)

- **OUTCOME**: verificato da un oracolo sull'esito reale — (i) **ri-derivazioni evitate** dove la decisione è invariante (la decisione è presa una volta e riusata, non N volte); (ii) **coerenza tra gli item del blocco** (tutti gli item dello scope trattati con la stessa decisione — zero drift/contraddizioni interne); (iii) **ri-valutazione corretta ai confini** (nuova decisione al cambio-scope e all'evento di invalidazione/cambio-premessa); (iv) **nessun errore da cache-stantia** (non applica una decisione ormai invalidata, N3; non cache-a una decisione variabile per-item, N1/N5). Un ragionatore che ri-deriva N volte una decisione invariante **fallisce** (i); uno che applica una cache dopo il cambio-premessa **fallisce** (iii)/(iv).
- **MAI** premiare la *cerimonia* ("decido una volta e riuso…", "cache-o la policy…" a parole senza che il ragionamento reale eviti la ri-derivazione o garantisca la coerenza): il credito esige la strategia che *dimostrabilmente* evita il ri-lavoro E mantiene la coerenza E invalida al momento giusto ([[../feedback_reward_hacking_principle]], CLAUDE.md #10).

## Label-generation

- **Mutation/oracle** (riusa [[../../harness/verifiers/deceptive-task-gen]] pattern): generare **blocchi di item** dove la decisione è etichettata **invariante** o **variabile-per-item**, iniettando in una frazione dei casi un **evento di cambio-premessa a metà blocco** (per testare l'invalidazione) + un **oracolo** che verifica: la decisione invariante è presa una volta e applicata coerentemente (i/ii); la decisione variabile è ri-decisa per-item (N1/N5); la premessa cambiata innesca la ri-valutazione (N3). Includere sistematicamente N1-N5 come **distrattori** (dove la cache è la scelta SBAGLIATA).
- **Difficoltà**: l'invarianza NON deve essere ovvia dalle parole — il modello deve derivare dal contenuto se la decisione è *davvero* costante sullo scope o se un dettaglio per-item la fa variare (N1), e deve **accorgersi** del cambio-premessa nascosto (N3) invece di applicare ciecamente la cache.
- **Demo SFT**: traiettorie che mostrano il triage di scope + la decisione-una-volta + l'applicazione coerente + la ri-valutazione al confine/invalidazione; RL sull'outcome sopra le demo.

## Hack-check (OBBLIGATORIO)

- **Cache-sempre** (riusare una decisione anche quando varia per-item o la premessa è cambiata, per lucrare il segnale "ho evitato ri-lavoro") → neutralizzato dai negativi N1/N3/N5: l'oracolo premia la **correttezza per-item**, quindi cache-are una decisione variabile (N1/N5) o stantia (N3) fa **sbagliare** gli item → niente reward. Il risparmio di ragionamento non compra correttezza.
- **Cerimonia** ("decido una volta e riuso…" senza che il ragionamento reale eviti la ri-derivazione o l'incoerenza) → 0.
- **Decisione stantia** (cache applicata dopo il cambio-premessa) → fallisce l'oracolo (iii)/(iv) → penalità forte: è silenziosamente sbagliata, peggio del ri-derivare.
- **Over-fitting all'istanza** (riconoscere solo "self-versioning per sessione" / la foglia Area-1) → mitigato: i casi osservati sono held-out; il training è su domini disgiunti A/B/C.

## Links
[[class-action-execution-optimization]] (padre) · [[class-batching-repeated-ops]] (sorella — batch di ops) · [[class-async-dispatch-and-prioritization]] (sorella — sync/async) · [[area-01-organization-planning]] (foglia decision-cache preesistente) · [[gold-example-area02-criticality]] (gold held-out — self-versioning una volta per sessione) · [[area-08-tool-use-agentic]] · [[class-consequence-intention-conflict]] (N3 cura-peggiore-del-male su cache stantia) · [[area-02-criticality-safety]] · [[../feedback_optimization_first]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_negative_examples_and_dataset_completeness]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]]

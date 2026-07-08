---
name: class-batching-repeated-ops
description: Classe di training (figlia di action-execution-optimization) — riconoscere che ≥2 operazioni pendenti sono dello STESSO TIPO su item diversi e SENZA inter-dipendenza → collassarle in UN passo batchato (una sola analisi/query/tool-call sull'insieme) + distribuire i risultati, invece di eseguire N volte separatamente (N context-load, N tool-call, N analisi). Forma-training di optimization-first (CLAUDE.md #8). Capire quando il batch NON conviene (dipendenze, un solo item, blow-up, distruttive, tipi eterogenei).
type: training-class
tags: [planning, optimization, execution-strategy, batching, agentic, area-01, area-08, held-out]
last_updated: 2026-07-08
---

# Classe di training — BATCHING DI OPS RIPETUTE (una analisi unica, non N identiche)

> **Stato**: figlia formalizzata dell'asse *batch* del padre (già elencata nella sua tabella, [[class-action-execution-optimization]] §Le figlie). È la forma-*reasoning* diretta di **optimization-first** (CLAUDE.md #8, [[../feedback_optimization_first]]): *"batch le operazioni ripetute (analisi unica, non N volte)"* — il principio cardine dell'utente elevato da regola-di-condotta a **skill addestrabile**.
> **Padre**: [[class-action-execution-optimization]] (asse *un'analisi unica invece di N identiche*, regola #20). **Sorelle**: [[class-async-dispatch-and-prioritization]] (modalità sync/async), [[class-decision-cache-per-block]] (riuso di una decisione), le foglie parallelization/scheduling di [[area-01-organization-planning]]. Attraversa Area-1 (planning) + Area-8 (tool-use / batch-dispatch).

## Il gap

Dato un insieme di operazioni pendenti dello **stesso tipo** su item diversi (N delete, N lettura-file, N query per-riga, N chiamate-API identiche), il modello le esegue **una alla volta, separatamente**: N context-load, N tool-call, N analisi ripetute della stessa forma-di-problema. Non è un buco di conoscenza né di correttezza — l'esito finale può anche essere giusto — è **mancata pianificazione della modalità di esecuzione**: non riconosce che le N operazioni sono *collassabili* in **un solo passo batchato** perché condividono tipo e non hanno inter-dipendenza. Il costo è **lavoro sprecato** (ri-analizzare N volte ciò che si analizza una volta) + **latenza** (N round-trip invece di uno) + rumore di contesto.

## La skill (imparata una volta)

Prima di eseguire una serie di operazioni, fare un **triage di batchabilità** sull'insieme pendente:

1. **Stesso tipo?** Le ≥2 operazioni pendenti sono la STESSA operazione (stessa forma: delete, read, query, insert, build) applicata a item diversi? Se sì, è un candidato batch.
2. **Indipendenza?** Gli item sono davvero *indipendenti* — nessun ordine imposto, nessuna dipendenza dato-su-dato, nessun write che l'altro legge? (se c'è un ordine nascosto, NON batchare cieco: N1).
3. **Un solo item?** Se N=1 non c'è niente da batchare — eseguilo e basta (N2).
4. **Dimensione sostenibile?** L'insieme è abbastanza piccolo da stare in UN passo senza far esplodere memoria/latenza/limiti? Se troppo grande → **chunk** in batch di dimensione ragionevole, non un mega-batch (N3).
5. **Reversibilità?** Sono operazioni distruttive che esigono conferma *individuale*? Allora niente batch cieco (N4).
6. **Omogeneità?** Sono davvero lo stesso tipo, o tipi diversi che sto forzando in un batch (peggiora)? (N5).
7. Se il candidato passa → **collassa**: UNA sola analisi/query/tool-call sull'insieme, poi **distribuisci i risultati** agli item. Se non passa → esegui separatamente (o chunk).

Regola pratica: *"sto per fare la STESSA cosa N volte su item diversi e indipendenti? Non ripeterla N volte: fallo UNA volta sull'insieme e smista i risultati."*

## Gold example (HELD-OUT di validazione — istanza osservata, NON nel training)

Il **"batch dei delete"** del gold criticality ([[gold-example-area02-criticality]]): di fronte a >1 operazione di delete, il comportamento gold è **una singola analisi batch** dell'intero insieme di delete (una valutazione unica di criticità/dipendenze sull'insieme), NON N check-e-halt separati ripetuti riga-per-riga. Le N delete sono dello stesso tipo, l'analisi di sicurezza è la stessa forma → si fa UNA volta sull'insieme e si decide, invece di ri-derivarla N volte. Tenuto **held-out**: se il modello impara la skill deve batchare questo pattern via transfer, non per averlo memorizzato ([[../feedback_intelligence_gap_to_training_class]], decontaminazione).

## Transfer examples (domini DIVERSI — OBBLIGATORIO cross-campo, NON solo software)

> **Regola di generalizzazione** (utente msg 1186, CLAUDE.md #19, [[../feedback_transfer_always_cross_domain]]): il transfer NON deve concentrarsi in un'area (men che meno solo software) → altrimenti il modello impara "batching = cosa dei database" e **localizza** la skill. La logica astratta — *"raggruppa le operazioni identiche e indipendenti e falle in un colpo solo, ammortizzando il costo fisso su tutto l'insieme"* — vale ovunque (è il principio di **amortized cost / setup-una-volta-per-molti**).

Ogni task presenta ≥2 operazioni pendenti dello stesso tipo (con dipendenze/tipi etichettati); l'oracolo misura se lo scheduling **collassa le identiche-indipendenti in un passo** riducendo il lavoro totale a parità di correttezza E senza violare dipendenze o perdere item.

### A — Software / agentic (dove è nato)
1. **N single-row query → una IN-query / bulk-insert**: invece di `SELECT ... WHERE id = ?` ripetuto N volte (o N `INSERT` singoli), una `WHERE id IN (...)` / un bulk-insert. Un round-trip invece di N.
2. **N chiamate API identiche → endpoint batch**: N GET/POST allo stesso servizio per item diversi → una chiamata all'endpoint batch (o request multiplexing). Ammortizzi handshake/auth/overhead.
3. **N re-letture dello stesso file → una lettura + riuso**: leggere lo stesso file da capo a ogni item → leggilo UNA volta, tieni il contenuto, riusalo per tutti gli item (cross con [[class-decision-cache-per-block]]).
4. **N build separate → una build multi-target**: compilare N target uno alla volta ripetendo l'analisi delle dipendenze → una build multi-target che condivide il grafo delle dipendenze e i passi comuni.

### B — Vita quotidiana (scelte basilari)
5. **Spesa con la lista vs N viaggi al supermercato**: fare UN viaggio con la lista completa invece di tornare N volte per un articolo alla volta — ammortizzi il tragitto (il costo fisso) su tutti gli acquisti.
6. **Meal-prep**: cucinare UNA volta per 3 giorni invece di cucinare da capo a ogni pasto — un setup di cottura, N pasti.
7. **Pagare tutte le bollette in una seduta**: aprire il portale/home-banking UNA volta e saldare tutte le bollette, invece di ri-loggarsi e ri-orientarsi a ogni scadenza singola.
8. **Una lavatrice a carico pieno vs 3 mezze**: un ciclo pieno invece di tre mezzi carichi — ammortizzi acqua/energia/tempo-ciclo (il costo fisso) su più capi.

### C — Scelte complesse cross-dominio (logistica · sanità · manifattura · procurement)
9. **Consolidamento merci (freight/container)**: raggruppare le spedizioni verso la stessa destinazione in UN container/viaggio invece di N spedizioni parziali — il costo di trasporto (fisso) si ammortizza sul carico pieno.
10. **Sessione operatoria che raggruppa interventi**: eseguire più interventi compatibili in una sola seduta/anestesia invece di N accessi separati — un solo setup (sala, anestesia, recupero) per più procedure (quando clinicamente indipendenti e sicure — altrimenti N1/N4).
11. **Stampa offset (setup una volta, tiratura N)**: preparare le lastre UNA volta (costo di setup alto) e stampare l'intera tiratura in un ciclo, invece di ri-settare per ogni copia — è il modello economico stesso dell'offset vs il per-copia del digitale.
12. **Acquisti aggregati (gruppo d'acquisto)**: consolidare gli ordini di più membri in un unico ordine grande verso il fornitore — un negoziato/una consegna/uno sconto-volume invece di N ordini piccoli separati.

> Dal banale (una spesa con la lista) al sistemico (consolidamento freight) la logica astratta è identica: **ci sono operazioni identiche e indipendenti con un costo fisso? Raggruppale e pagane il costo fisso UNA volta, spalmandolo su tutto l'insieme.**

## Esempi NEGATIVI (il CONFINE — quando NON batchare, regola #21)

> I negativi insegnano il confine e rendono il segnale discriminativo (CLAUDE.md #21, [[../feedback_negative_examples_and_dataset_completeness]]). Senza, "batch-sempre" diventa un hack.

- **N1 — item NON indipendenti (dipendenza/ordine nascosto)**: le operazioni sembrano identiche ma c'è un ordine imposto o una dipendenza dato-su-dato (es. delete che rispettano una gerarchia FK, migrazioni sequenziali, passi che leggono il write del precedente). Batcharle cieche **viola l'ordine** → risultato sbagliato. Qui si esegue in sequenza rispettando la dipendenza; il batch è la scelta SBAGLIATA.
- **N2 — un solo item**: c'è UNA sola operazione pendente → non c'è insieme da collassare. "Batchare" aggiunge solo cerimonia. Eseguila e basta.
- **N3 — batch troppo grande → blow-up**: l'insieme è enorme (milioni di righe, N file giganti) → un unico mega-batch fa esplodere memoria/latenza/timeout/limiti-API. La scelta corretta è **chunk-are** in batch di dimensione ragionevole, non un solo passo monolitico né N passi da uno.
- **N4 — op distruttive che richiedono conferma individuale**: cancellazioni/pagamenti/deploy irreversibili dove ogni item merita conferma o revisione singola → il batch cieco toglie il controllo e amplifica il danno di un errore. Il gate individuale ha priorità sull'ottimizzazione (cross con [[class-consequence-intention-conflict]] + criticality [[area-02-criticality-safety]]).
- **N5 — op eterogenee (tipi diversi)**: le operazioni pendenti **sembrano** raggruppabili ma sono tipi diversi (un delete, un update, una query) → forzarle in un batch unico complica il codice/la logica e spesso **peggiora** (perde l'ottimizzazione specifica di ciascun tipo). Il batch vale solo su operazioni davvero omogenee.

## Reward (ANCORATO all'OUTCOME)

- **OUTCOME**: verificato da un oracolo sull'esito reale dello scheduling — (i) il **numero di operazioni / il lavoro-totale è ridotto** rispetto all'esecuzione N-per-uno (meno tool-call/round-trip/analisi ripetute), **a parità di correttezza** del risultato finale; (ii) **nessuna dipendenza violata** (l'ordine imposto è rispettato — non batcha item dipendenti, N1); (iii) **nessun item perso o duplicato** (il batch copre esattamente l'insieme e distribuisce i risultati a ciascun item); (iv) dove l'insieme è troppo grande, il **chunk** è applicato invece del mega-batch (N3). Un piano che ripete N operazioni identiche-indipendenti **fallisce** l'oracolo (i); uno che batcha item dipendenti **fallisce** (ii).
- **MAI** premiare la *cerimonia* ("batcho le operazioni…", "faccio un'analisi unica…" a parole senza che lo scheduling reale riduca il lavoro): il credito esige il batch che *dimostrabilmente* riduce le operazioni senza perdere correttezza/dipendenze ([[../feedback_reward_hacking_principle]], CLAUDE.md #10).

## Label-generation

- **Mutation/oracle** (riusa [[../../harness/verifiers/deceptive-task-gen]] pattern): generare set di **{N richieste dello stesso-tipo}** con **dipendenze e tipi etichettati** (indipendenti/dipendenti × omogenei/eterogenei × dimensione-piccola/enorme × reversibili/distruttive) + un **oracolo che conta le operazioni reali** prodotte dallo scheduling e **verifica la correttezza** del risultato finale (tutti gli item trattati, nessuna dipendenza violata). Includere sistematicamente i casi-confine N1-N5 come **distrattori** (dove il batch è la scelta SBAGLIATA).
- **Difficoltà**: la dipendenza/eterogeneità NON deve essere ovvia dalle parole — il modello deve derivare dal contenuto se le N operazioni sono davvero indipendenti e omogenee (batchabili) o se nascondono un ordine (N1) / tipi misti (N5).
- **Demo SFT**: traiettorie che mostrano il triage di batchabilità + il collasso in un passo unico + la distribuzione dei risultati (e il chunk quando serve); RL sull'outcome sopra le demo.

## Hack-check (OBBLIGATORIO)

- **Batch-sempre** (raggruppare tutto per lucrare il segnale, anche N=1 o item dipendenti/eterogenei) → neutralizzato dai negativi N1/N2/N4/N5: l'oracolo penalizza le dipendenze violate (N1), la cerimonia su un solo item (N2), il batch cieco su distruttive (N4) e i tipi misti forzati (N5).
- **Cerimonia** ("batcho…", "una analisi unica…" senza scheduling reale che riduce le operazioni) → 0.
- **Item perso / dipendenza violata** (batcha ma perde un item o ne inverte l'ordine imposto) → fallisce l'oracolo (ii)/(iii) → penalità forte: peggio del ripetere N volte, perché produce un risultato *sbagliato*, non solo lento.
- **Over-fitting all'istanza** (riconoscere solo "batch dei delete") → mitigato: il caso-criticality è held-out; il training è su domini disgiunti A/B/C.

## Links
[[class-action-execution-optimization]] (padre) · [[class-async-dispatch-and-prioritization]] (sorella — sync/async) · [[class-decision-cache-per-block]] (sorella — riuso decisione) · [[area-01-organization-planning]] (parallelization/scheduling) · [[area-08-tool-use-agentic]] (batch-dispatch tool) · [[gold-example-area02-criticality]] (gold held-out — batch dei delete) · [[class-consequence-intention-conflict]] (N4 distruttive) · [[area-02-criticality-safety]] · [[../feedback_optimization_first]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_negative_examples_and_dataset_completeness]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]]

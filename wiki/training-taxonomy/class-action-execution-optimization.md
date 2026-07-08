---
name: class-action-execution-optimization
description: Classe-PADRE (radice) di training — "ottimizzazione delle AZIONI" (utente msg 1369). Non ottimizzare solo la RISPOSTA ma la STRATEGIA di esecuzione: scegliere ordine, modalità (sincrona/asincrona-background), batching, caching-di-decisioni e priorità per minimizzare lavoro-sprecato e latenza-che-blocca-l'utente, rispettando deadline e risorse. Radicata in optimization-first (CLAUDE.md #8). Figlie: async-dispatch (nuova) + le foglie parallelization/scheduling di Area-1 + batching + decision-cache.
type: training-class
tags: [planning, organization, optimization, execution-strategy, agentic, area-01, area-08, parent-class]
last_updated: 2026-07-08
---

# Classe-PADRE (radice) — ACTION / EXECUTION OPTIMIZATION ("ottimizzazione delle azioni")

> **Stato**: creata su direttiva utente (msg 1369, 2026-07-08: *"aggiungi al training set ottimizzazione delle azioni … capire cosa e quando conviene mandare in asincrono e dare priorità alle cose giuste"*). L'utente ha nominato il **PADRE** ("ottimizzazione delle azioni") + dato l'async come esempio-motivante → gerarchia obbligatoria (regola #20, [[../feedback_hierarchical_training_classes]]).
> **Origine**: è la forma-*reasoning* di **optimization-first** (CLAUDE.md #8, [[../feedback_optimization_first]]) — il principio cardine dell'utente ("batch le operazioni ripetute, ottimizza proattivamente") elevato da regola-di-condotta a **skill addestrabile**.

## La skill-RADICE (livello padre)

**Gap comune**: il modello ottimizza *cosa* rispondere (la qualità della risposta) ma **non** ottimizza *come/quando/in-che-ordine ESEGUE* — fa tutto in serie e in-foreground, ripete lavoro identico N volte, blocca l'utente su parti che potevano procedere altrove. È un buco di **strategia di esecuzione**, non di conoscenza né di correttezza.

**Skill radice** (imparata una volta, condivisa dalle figlie): dato un insieme di intenti/azioni pendenti, **scegliere la strategia di esecuzione che minimizza (a) il lavoro sprecato e (b) la latenza che blocca l'utente/il flusso**, rispettando dipendenze, risorse, deadline e reversibilità. Le figlie sono gli **assi** lungo cui si ottimizza l'esecuzione.

**Perché padre + figlie** (regola #20): tutte le figlie condividono il trigger *"prima di eseguire in modo naïve, c'è una strategia di esecuzione migliore?"* — impararlo UNA volta e poi specializzare l'**asse** (sync/async, parallelo, batch, cache) evita segnale ridondante, riflette la relazione reale, ed è composizionale ([[../concepts/compositional-curriculum-thinking-optimization]]).

## Le figlie (assi di ottimizzazione dell'esecuzione)

| Figlia | Asse | Domanda-trigger | Doc |
|---|---|---|---|
| **async-dispatch & priorità** | modalità *sincrona vs asincrona/background* + ordine di consegna | "questa parte è lunga e indipendente? → lanciala in BG e rispondi subito sul resto; cosa consegno per primo?" | [[class-async-dispatch-and-prioritization]] (NUOVA, msg 1369) |
| **parallelization** | quali task girano *insieme* (DAG) + conflitti di risorsa | "questi task sono davvero indipendenti (no reachability, no write-write)?" | [[area-01-organization-planning]] §Parallelization (`identificare-task-paralleli`, `conflitto-risorse`, `efficienza-scheduling`) |
| **batching di ops ripetute** | *un'analisi unica* invece di N identiche | "sto per fare la stessa operazione N volte? → batchala" | [[class-batching-repeated-ops]] (formalizzata; gold held-out `batch dei delete`) |
| **decision-caching per blocco** | riuso di una *decisione* valida per un intero blocco | "questa decisione vale per tutto il blocco? → non ri-deciderla per item" | [[class-decision-cache-per-block]] (formalizzata; gold held-out self-versioning-per-sessione) |

> Le foglie parallelization di Area-1 **preesistono** (planning statico del DAG): questo padre le UNIFICA con l'async-dispatch interattivo (nuovo asse) sotto un'unica radice, invece di lasciarle sorelle-scollegate (regola #20). `async-dispatch` è complementare, non duplicato: Area-1 pianifica un grafo di task *noto a priori*; l'async-dispatch decide *durante l'interazione* cosa scaricare in background per non bloccare l'utente.

## Reward (condiviso, ANCORATO all'OUTCOME)

Ogni figlia premia l'**esito misurabile** dell'esecuzione ottimizzata — utente sbloccato prima, lavoro-totale ridotto, makespan minore, nessuna race — verificato da un oracolo *sull'effetto reale*, **MAI la cerimonia** ("ottimizzo l'esecuzione…", "lo mando in async…" a parole → 0). L'ottimizzazione è una strategia *dimostrata* (SFT) + RL sull'outcome. Vedi [[../feedback_reward_hacking_principle]] + CLAUDE.md #10.

## Hack-check (condiviso)

- **Cerimonia** (narrare l'ottimizzazione senza cambiare l'esito misurabile) → 0.
- **Over-optimization** (parallelizzare/backgroundare tutto per lucrare il segnale, introducendo race/overhead/coordinamento inutile) → neutralizzato: l'oracolo penalizza il lavoro-sprecato e i fallimenti da over-async (vedi i **negativi** di ogni figlia, regola #21).
- **Decontaminazione**: le istanze osservate (questa sessione) restano **held-out** → misurano il transfer, non la memorizzazione.

## Links
[[class-async-dispatch-and-prioritization]] (figlia — async/priorità) · [[area-01-organization-planning]] (parallelization/scheduling preesistenti) · [[area-08-tool-use-agentic]] · [[../feedback_optimization_first]] (radice-condotta) · [[../concepts/compositional-curriculum-thinking-optimization]] · [[../feedback_hierarchical_training_classes]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]]

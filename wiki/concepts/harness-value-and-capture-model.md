---
name: harness-value-and-capture-model
description: Analisi critica (utente msg 2026-07-08, dopo E12) — quando l'harness è un miglioramento REALE vs overhead; la distinzione CAPTURE (sempre-on) vs INJECTION (adattiva); il gap di cattura del NON-file-write (decisioni/preferenze durevoli/volatili); e le condizioni solide/realistiche per decidere se vale investire ricerca. Tesi: il valore-memoria è overflow-gated E sbloccato-dal-training; le difese sono un valore separato sempre-on.
type: concept
tags: [harness, memory, capture, injection, adaptive, value-conditions, research-gate]
last_updated: 2026-07-08
---

# Quando l'harness è un miglioramento REALE — analisi critica + condizioni solide

> Origine: tre domande critiche dell'utente (2026-07-08) dopo il verdetto E12 (l'harness vince in overflow, [[harness-wins-validation-protocol]]). Sono le domande giuste; qui la risposta onesta + le condizioni da tracciare per decidere se investire.

## 1. Il difetto della mia proposta "adattiva": ho confuso CATTURA con INIEZIONE

La proposta ingenua — *"quando i turni sono alti comportati come vanilla (digest off), quando la finestra satura passa a low-turns + digest on"* — **ha un buco che l'utente ha individuato**: se in "modalità vanilla" non catturi le informazioni durevoli, quando poi passi a low-turns quelle info **sono già perdute** (stanno nella finestra nativa che nel frattempo è overflowata). È **esattamente il fallimento misurato in E12** (vanilla recall 25%: non riesce a estrarre l'early-context dalla finestra satura), applicato però a **decisioni/preferenze** invece che a nomi-funzione.

La correzione è distinguere due assi che avevo fuso:

| asse | cosa fa | deve essere |
|---|---|---|
| **CATTURA** (capture) | scrive le info durevoli (fatti, decisioni, preferenze, vincoli) in lane persistenti | **SEMPRE-ON dal turno 1**, indipendente dai keepTurns. È economica (digest deterministico + poche write). Non si spegne MAI: ciò che non catturi ORA non lo recuperi DOPO. |
| **INIEZIONE** (context-assembly + keepTurns) | quanta storia nativa tieni + quando fai emergere le lane nel prompt | **adattiva**: inietti le lane pesantemente solo quando la finestra rischia l'overflow; su sessioni che stanno nella finestra, inietta poco (eviti l'overhead misurato in E12 he6/he30). |

→ **La config adattiva riguarda solo l'INIEZIONE. La cattura è sempre attiva.** Questo chiude il buco: le preferenze early esistono già nelle lane quando (e se) la finestra satura.

## 2. Il gap REALE: la cattura deterministica copre solo i file-write

Anche con la cattura sempre-on, resta il problema che l'utente solleva: **non tutto è ricostruibile dal digest.**

- Il **task-digest** (`digestFactFromCall`, [[../harness-experiment-log]] §F32) cattura **deterministicamente** solo le **scritture-file strutturate** (args `path`+`content`) → nomi di funzione/def. È robusto perché **non dipende dal modello**.
- Ma **decisioni, preferenze (durevoli e volatili), vincoli dichiarati dall'utente, scelte di design** NON sono file-write → **oggi dipendono da `note`/`jot`/`record_decision`**, cioè dal fatto che **il modello scelga di salvarle**.
- **I nostri stessi findings (F23/F24) dicono che i modelli capaci NON salvano in modo affidabile**: deflettono, dimenticano, o "fingono" di aver salvato. → **Il non-file-write durevole ha una cattura NON affidabile → può essere perso.** Questo è un **gap architetturale vero**, non estetico.

**Direzione di fix** (non-gated, alto valore):
- (a) **Cattura deterministica lato-utente**: quando l'utente dichiara una preferenza/vincolo/decisione ("ricorda X", "d'ora in poi Y", "non fare Z"), l'harness la **pinna** senza affidarsi al modello. È il research-gap *structured update injection* ([[project_research_gaps]]). ⚠ NB regola #24: la **comprensione semantica** di cosa è una preferenza va al MODELLO (≥32B), non a una regex — quindi la cattura è un **passo del modello ma verificato/reso affidabile** dall'harness (prompt esplicito + check che la scrittura sia avvenuta), non un guardrail-regex.
- (b) **`record_decision` reso affidabile**: l'harness richiede/verifica il salvataggio delle decisioni load-bearing (coerente con [[structured-thinking]] `[V]/[A]/[?]`).
- (c) **Capture-completeness check**: a fine-turno, l'harness verifica che le info durevoli emerse siano finite in una lane (segnala i buchi).

**È TESTABILE** → esperimento *durable-preference persistence* (§4): pianta una preferenza/decisione NON-file-write early, satura la finestra, sonda dopo. Se il digest non la cattura e il modello non l'ha notata → **anche ours FALLISCE** → prova il gap e ne misura la gravità.

**✅ MISURATO (F33, 2026-07-08)** — [[../harness-experiment-log]] §F33: piantato "committente ALDO-QX + decisione TAB" al task-1, saturata la finestra (qwen-ctx16k he12, ours@keep1). **Risultato**: task-recall 100% (digest OK) ma **pref-recall FALSE**, **note/jot/setVar = 0** (il 9B non salva mai) → la preferenza è PERSA e il modello CONFABULA. **A/B su 4 direttive** (checkpoint OFF + inject narrow/anti-deflect/urgent, 13 eviction ciascuna): **ZERO save in tutte** → nessun framing di nudge smuove il 9B (`note`/`jot` disponibili, non gated → è una scelta del modello). **Conferma netta**: il nudge model-side è un vicolo cieco → **serve la cattura deterministica** (sotto). Nota: la variante `urgent` è l'unica che non confabula (onestà sull'assenza) → tenerla per l'anti-confabulazione.

## 3. È un miglioramento REALE? Vale investire? — framing onesto

**Sì, ma è NARROW e CONDIZIONALE. Non gonfiamolo.**

1. **È una PROTESI di memoria, non intelligenza.** Non rende il modello più bravo; gli dà memoria **oltre la sua finestra nativa**. Utile ma stretto.
2. **Il 25% di vanilla è in parte un artefatto** del num_ctx=16384 **piccolo** del banco. Il **target reale ≥27-32B ha 128K-256K** di finestra → il **punto di overflow è molto più lontano**. Quindi *"l'harness-memoria serve al modello vero"* dipende da **se le sessioni reali superano la finestra reale** — non dal banco artificiale.
3. **È gated sul fatto che l'info sia digest-abile** (file-write) → vedi §2.

**Due proposte di valore SEPARATE (non confonderle):**
- **A. Memory-extension**: overflow-gated, stretta, limitata ai file-write. È ciò che E12 ha misurato. Valore = *funzione di (lunghezza-sessione ÷ finestra-modello)* e della copertura-cattura.
- **B. Difese + context-engineering + struttura** (secrets-guardrail, pre-flight, anti-derailment, structured-context, temporal-anchoring): **SEMPRE-ON, non overflow-gated** (Regime-C [[harness-wins-validation-protocol]]). Probabilmente il valore **più robusto e model-agnostico**.

**La domanda "best of both / salto di qualità":** il valore-memoria dell'harness è **SBLOCCATO DAL TRAINING**. Un modello capace **non-addestrato** deflette (F23/F24): ignora le lane, non salva. L'intera [[../training-taxonomy/dataset-construction-playbook]] serve a insegnare al modello a **guidare** lo scaffold (salvare decisioni, usare le lane, structured-thinking). Quindi:
- harness + modello **non-addestrato** = marginale (il modello ignora lo scaffold);
- harness + modello **ADDESTRATO a usarlo** = il potenziale salto.
- **Non si può giudicare "l'harness vale?" su un 9B non-addestrato.** Si giudica su un modello **addestrato a sfruttarlo**. Questa è la tesi vera del progetto.

## 4. Condizioni SOLIDE e REALISTICHE da tracciare (la richiesta dell'utente)

Prima di investire altra ricerca su harness/context-engineering, misurare:

| # | condizione | perché decide | come |
|---|---|---|---|
| C1 | **finestra nativa reale** del target (≥27-32B: 128K-256K) | fissa DOVE inizia l'overflow | dai model-card ([[../entities/base-model-candidates-2026-07]]) |
| C2 | **distribuzione lunghezza-sessione reale** (task agentici SWE-scale: quanti token consuma un task tipico/lungo) | la memory-extension serve **iff** le sessioni superano C1 di routine | strumentare sessioni reali / SWE-Gym; contare token cumulativi |
| C3 | **copertura-cattura** (% di info durevole catturata deterministicamente vs affidata a note/jot inaffidabile) | §2: se bassa, l'harness perde decisioni/preferenze anche in overflow | esperimento durable-preference persistence |
| C4 | **delta TRAINED vs UNTRAINED** (un modello addestrato a usare l'harness batte vanilla di PIÙ di uno non-addestrato?) | è il vero test di "best of both": il valore è sbloccato dal training | A/B stesso harness, modello base vs modello post-SFT-taxonomy |
| C5 | **valore-difese isolato** (Regime-C) misurato a parte dalla memoria | B è forse il valore più robusto, non va confuso con A | task-set lungo con trappole (segreti, file critici, fissazioni), pass-rate ours vs vanilla |

**Gate di investimento (onesto):**
- **A (memory-lane)**: **finire** il fix-cattura (§2 → C3) perché è ciò che la rende non-fragile, ma **NON** investire pesante finché C1+C2 non confermano che le sessioni reali overflowano la finestra reale.
- **B (difese/struttura)**: vale investire — sempre-on, model-agnostico (C5).
- **La scommessa grande** = **addestrare il modello a sfruttare l'harness** (C4). Lì sta il salto, se c'è. Il banco decisivo: benchmark agentico lungo (token reali) su modello a finestra reale, con cattura §2 fixata, **trained vs untrained**.

## Link
[[harness-wins-validation-protocol]] · [[../harness-experiment-log]] (§F32) · [[structured-thinking]] · [[catastrophic-forgetting]] · [[project_research_gaps]] · [[../training-taxonomy/dataset-construction-playbook]] · [[../todo]]

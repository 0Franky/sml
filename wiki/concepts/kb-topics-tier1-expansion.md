---
name: kb-topics-tier1-expansion
description: "Espansione PPONDERATA della lista KB-topics per il Tier-1 (msg 1295a 'cos'altro'): 46 domini da workflow multi-agente (6 context+agnostic → critico → cluster), riorganizzati + pesati contro i fatti del progetto (three-tier, tier-1=intelligenza, split pre-train/RL, reward-outcome). Distingue layer pre-train-fact / RL-skill / harness."
type: concept
tags: [kb, curriculum, tier-1, pre-training, rl, lora, knowledge-domains, reward-anchoring]
last_updated: 2026-07-07
sources:
  - user notes 2026-07-07 (msg 1295a + 1307 "cos'altro = brainstorm insieme"), raw in wiki/_private/user-notes-2026-07-07.md
  - workflow multi-agente kb-topics-expansion (run wf_1a67bdf7-476): 6 agenti diverge (3 context + 3 agnostic) + 1 critico completezza + 1 cluster; 72 proposte grezze → 46 domini unici
---

# KB-topics per il Tier-1 — espansione pponderata (2026-07-07)

> **Come è stata prodotta** (i "più loop con agenti verticali con-contesto + agnostici" richiesti dall'utente msg 1307): 3 agenti CON-CONTESTO del progetto (lenti CS-tecnica / ragionamento-metacognizione / domini-serviti) + 3 AGNOSTICI/fresh-eyes (nessun contesto, anti-ancoraggio) → **72 proposte**; 1 CRITICO di completezza (+12 dai gap); 1 CLUSTER di consolidamento → **46 domini unici**. Poi **pponderati QUI** contro i fatti del progetto. Sorgente completa: output workflow `wf_1a67bdf7-476`.
> Layer: `pre-train-fact` (conoscenza stabile → continual-pretraining) · `RL-skill` (abilità da praticare → RL) · `both` (pre-train semina il vocabolario/teoria, RL affila la skill) · `harness` (scaffolding runtime, NON training).

---

## 🔑 META-FINDING (la cosa più importante emersa)

**Quasi OGNI dominio, indipendentemente da quale agente l'ha proposto, ha lo STESSO caveat: "premia l'OUTCOME/validità verificata, NON la cerimonia della skill".** Logica → non premiare la citazione-del-nome-fallacia; metacognizione → non la cerimonia-del-dubbio; probabilità → non l'esibizione di percentuali inventate; testing → non il coverage-come-fine; etica → nessun reward per una tesi specifica. Questo **converge spontaneamente sul nostro principio [[feedback_reward_hacking_principle]] (CLAUDE.md #10) + #22 (verify non assert)**. → **Regola trasversale per TUTTE le classi KB**: il reward va ancorato all'esito reale del ragionamento, mai alla forma. È il filo rosso del curriculum, non un dettaglio per-classe.

**Secondo finding — il layer-split CONFERMA e OPERAZIONALIZZA l'intuizione 1295f dell'utente**: la stragrande maggioranza dei domini è `both` = **la TEORIA/vocabolario va in pre-training (stabile), la SKILL si affila in RL (outcome-anchored)**. La conoscenza-mondo è `pre-train-fact`. La CS-core-theory è pre-train (i teoremi non scadono), ma il coding-skill che la usa va nelle LoRA. Esattamente lo split che l'utente ha proposto. Vedi [[concepts/training-intelligence-optimization]] §1.

---

## Gruppo A — Ragionamento & metacognizione (IL CUORE di Tier-1, priorità massima)

> Questi SONO l'identità "problem analysis and task decomposition" ([[project_base_model_intelligence]]). Layer `both`: pre-train semina teoria/vocabolario, RL affila. Molti hanno GIÀ una training-class prototipata → vedi §Mappatura.

| Dominio | Consenso | Layer | Overlap esistente / nota di pponderazione |
|---|---|---|---|
| **Logica formale & informale + argomentazione** (deduttivo/induttivo/abduttivo, validità-vs-solidità, fallacie, invarianti/Hoare) | 6 ⭐ | both | delta vs `math` = logica informale+fallacie+verifica-invarianti. Substrato che rende la CoT *load-bearing* non decorativa ([[concepts/structured-thinking]]) |
| **Metacognizione & auto-audit epistemico** (sapere-cosa-non-sai, calibrare, assunzione load-bearing, uscire da stagnazione) | 3 | RL-skill | GIÀ classe: [[training-taxonomy/class-metacognitive-self-audit]] + stagnation-recovery |
| **Teoria della decisione, giochi & mechanism design** (EU/VoI/costo-opp., Nash/principal-agent, Cobra) | 5 ⭐ | both | Cobra-effect già transfer in [[training-taxonomy/class-consequence-intention-conflict]]; VoI formalizza act-vs-ask |
| **Probabilità, statistica inferenziale & incertezza calibrata** (Bayes/base-rate, sampling-bias, potenza, lettura A/B) | 5 ⭐ | both | fondamento quantitativo della disciplina `[V]/[A]/[?]`; ragionamento INDUTTIVO che `math` deduttivo non copre |
| **Inferenza causale & root-cause analysis** (correlazione≠causa, controfattuali, 5-whys) | 3 | both | complementare BACKWARD alle catene-conseguenza FORWARD del progetto; fonda debugging/dependency-recovery |
| **Pensiero sistemico, cibernetica & controllo** (feedback, convergenza-vs-oscillazione, stock/flussi, leverage) | 3 | both | DEEPENING delle "catene lunghe di conseguenze"; spiega il thrashing/oscillazione (già visto in eviction-trailing F26) |
| **Pianificazione, decomposizione & ragionamento strategico** (goal→sotto-task ordinati, means-ends) | 3 | both | overlap con `workflow-alberatura` (struttura); qui il ragionamento |
| **Astrazione, modellazione & transfer analogico** (livelli-astrazione, isomorfismi, istanza→classe) | 2 | both | è IL meccanismo del transfer cross-dominio #19 + classi gerarchiche #20 |
| **Stima quantitativa & forecasting (Fermi)** (reference-class, stima effort/rischio, sensibilità) | 3 | both | delta vs `math` = metodologia di stima per lo scoping |
| **Epistemologia & valutazione delle evidenze** (giustificazione, provenienza fonti, standard probatori) | 2 | both | fonda l'integrità fattuale #22 ([[concepts/verification-discipline-training]]); valuta l'evidenza ESTERNA |
| **Metodo scientifico & indagine empirica** (ipotesi, test-discriminanti, falsificabilità) | 2 | both | allineato al protocollo metodo-scientifico del progetto; "strumenta prima di ipotizzare" |
| **Testing/validazione & oracle-problem + QA del delegato** (partitioning, boundary, property/mutation, trust-but-verify) | 2 | both | l'oracle-problem È l'anti-reward-hacking + validate-wiring-before-handoff #14 |
| **Ragionamento diagnostico dominio-generale** (bisezione, minimal-repro, diagnosi-differenziale) | 1 | both | search-strategy di ricerca-del-guasto (distinta da RCA/scientific-method) |
| **OR & project/operations management** (grafi-dipendenza, critical-path, allocazione, CSP, code) | 2 | both | l'altra metà della decomposizione: ORDINARE/allocare i sotto-task in un budget |
| **Scienze cognitive & bias** (dual-process, razionalità limitata, catalogo bias) | 1 | both | alimenta ToM + auto-audit; ⚠️ insegnare lo SCHEMA, non una checklist-di-bias (shortcut) |
| **Creatività & pensiero divergente** (brainstorming strutturato, inversione, analogia generativa) | 1 | RL-skill | ⚠️ buco reale: la tassonomia è quasi tutta CONVERGENTE (scegliere), manca il GENERARE opzioni |
| **Teoria dell'informazione & compressione** (entropia, MDL, segnale/rumore) | 1 | pre-train-fact | la gestione context-window È compressione; valore QUALITATIVO non calcolo-entropie |

---

## Gruppo B — Comunicazione & interazione

| Dominio | Consenso | Layer | Nota di pponderazione |
|---|---|---|---|
| **Padronanza linguistica: semantica, pragmatica, retorica, technical-writing, audience-modeling** | 6 ⭐ | both | teoria UNIVERSALE del linguaggio (vs `italiano`/`fiabe` specifici); disambigua l'intento IN + produce brief non-ambigui OUT. ⚠️ semantica = compito del MODELLO non regex (#24) |
| **Negoziazione, conflitti & consenso** (interessi-vs-posizioni, BATNA/ZOPA, mediazione) | 1 | both | pratica dialogica (vs matematica-equilibri della game-theory) |
| **Intelligenza sociale & cross-culturale** (norme, cortesia, anti-etnocentrismo) | 1 | both | ciò che è "corretto" dipende dal frame culturale |
| **Intelligenza emotiva & de-escalation** (riconoscere frustrazione/urgenza, rapport) | 1 | both | ⚠️ NON premiare tono-ossequioso (contro no-piaggeria [[feedback_objective_critique]]): leggere-e-adattare, non compiacere |
| **Information design & data-viz literacy** (scelta rappresentazione, detezione-misleading) | 1 | both | ⚠️ marginale per modello text-only; valore = scelta-rappresentazione + rilevare-misleading |

---

## Gruppo C — CS-core come SUBSTRATO-DI-RAGIONAMENTO (non coder!)

> ⚠️ Distinzione critica pponderata: questi sono **modelli mentali/teoria** per l'orchestratore, NON coding-skill (che vive nelle LoRA Tier-2/3). La TEORIA → pre-train (stabile); il coding che la implementa → LoRA. Coerente con [[project_base_model_intelligence]] (base=intelligenza non capacità) + rule #11.

| Dominio | Layer | Perché serve all'ORCHESTRATORE (non al coder) |
|---|---|---|
| **Pensiero algoritmico & computazionale** (strutture-dati, complessità, invarianti, pseudocodice-come-ragionamento) | both | ragionamento procedurale esatto/verificabile; planning è algoritmico nello spirito |
| **Architettura software a livello TASK** (coupling/coesione, interfacce/contratti, SoC) | both | la DECOMPOSIZIONE È architettura applicata ai task; contratti = linguaggio dell'handoff cross-expert |
| **Teoria dei sistemi distribuiti + reti** (partial-failure, idempotenza, delivery-semantics) | both | l'orchestratore È un coordinatore distribuito: delega=message-passing con fallimento parziale → retry/abort/dedup sani |
| **Teoria di concorrenza & parallelismo** (race, deadlock, atomicità, happens-before) | both | la decisione "quali sotto-task in parallelo vs sequenziale" richiede dipendenze-di-dato/stato-condiviso |
| **Teoria dei dati & database** (relazionale, normalizzazione, ACID, isolation) | both | modello per strutturare STATO/memoria + ragionamento transazionale (piano atomico=transazione); normalizzazione È SSOT #16 |
| **Teoria dei sistemi operativi & scheduling** (priorità/fairness/starvation, isolamento/sandbox) | both | l'orchestratore gestisce budget finiti (context/token/quota)=uno scheduler |
| **Calcolabilità & complessità** (P-vs-NP, NP-completezza, decidibilità/halting) | pre-train-fact | GIUDIZIO DI FATTIBILITÀ: riconoscere NP-hard→euristica / indecidibile→deferire PRIMA di sprecare budget |
| **Compilatori & linguaggi formali** (grammatiche, parsing, AST, type-as-constraint, lowering) | pre-train-fact | l'orchestratore fa *lowering* intento→piano→tool-call; l'alberatura workflow classe>sottoclasse>foglia È un AST |
| **Ingegneria dell'affidabilità & fault-tolerance** (FMEA, graceful-degradation, circuit-breaker, blast-radius) | both | fonda la gestione FALLIMENTI di tool/sub-agent; graceful-degradation È lo stato "DEGRADATA-MA-UTILE" #11 |

---

## Gruppo D — Sicurezza, etica & rischio (complementa anti-injection strutturale con il SEMANTICO)

| Dominio | Consenso | Layer | Nota |
|---|---|---|---|
| **Etica applicata & ragionamento normativo scope-appropriato** | 5 ⭐ | both | adeguare il RIGORE allo scope (usa-e-getta vs production = principio del progetto, lega a 1301). ⚠️ NIENTE reward per una tesi morale specifica → premiare riconoscere-il-trade-off + deferral (#10) |
| **Risk management & safety-case** (identify-assess-mitigate-monitor, rischio residuo) | 1 | both | guida "quanto rigore" per scope; enfasi sul PROCESSO end-to-end |
| **Persuasione, framing & detezione manipolazione** (social-engineering, dark-pattern, pretexting) | 1 | both | complemento SEMANTICO all'anti-injection strutturale. ⚠️ dual-use → reward sul RICONOSCERE/resistere, non sul persuadere |
| **Ragionamento su norme, licenze & compliance** (OSS MIT/GPL, PII/GDPR, ToS, regola+eccezione+precedente) | 2 | both | molte decisioni sono CSP contro regole ESTERNE; schema regola+eccezione = transfer per le "regole di protezione". ⚠️ leggi VOLATILI → NON memorizzare (#22), ragionare su regole DATE in-context |

---

## Gruppo E — World-model & domini-serviti (fatti STABILI → pre-train; volatili → verify-step)

> Layer prevalente `pre-train-fact` MA con la disciplina #22: solo verificato-stabile-e-citato; cifre/leggi/prezzi live = verify-step, mai fatto memorizzato.

| Dominio | Layer | Nota |
|---|---|---|
| **World-model & conoscenza enciclopedica** (naive-physics, tempo/spazio/agenti, copioni sociali, istituzioni) | pre-train-fact | materia prima su cui operano tutte le skill; permette di scartare conclusioni assurde |
| **Scienza naturale fondazionale come world-model** (leggi fisiche assestate, meccanismi biologici) | pre-train-fact | raffina physics/chemistry; modello causale STABILE per il sanity-check |
| **Alfabetizzazione economica, finanziaria & contabile** (unit-economics, identità contabili, budgeting) | both | software fintech/billing + ragionare su scope↔costo. ⚠️ prezzi/tassi VOLATILI → verify-step |
| **Biologia, medicina & sistemi-sanitari** (workflow clinici, HIPAA, omeostasi/feedback) | both | software safety-critical + transfer systems-thinking biologico. ⚠️ specifici clinici volatili → verify; NON dare consigli medici |
| **Geografia, geopolitica & i18n** (timezone, locale, giurisdizioni, unità, logistica) | pre-train-fact | la maggioranza dei bug ricorrenti (timezone/data/valuta/locale) nasce da qui. ⚠️ geopolitico volatile → verify |
| **Storia & filosofia della scienza/tecnologia** (paradigm shift, path-dependence, lezioni dai fallimenti) | pre-train-fact | giudizio "quale approccio per lo scope" + inocula contro cargo-cult. ⚠️ pattern-di-evoluzione, non aneddotica |

---

## Gruppo F — Ragionamento temporale & spaziale

| Dominio | Layer | Nota |
|---|---|---|
| **Ragionamento temporale & spaziale** (ordini-eventi/durate/orizzonti; geometrico/navigazione) | both | il testo puro sotto-allena queste; governano planning e causalità (errori silenziosi). ⚠️ ancorare l'ordine al ground-truth temporale, non alla posizione presentata (#13 [[feedback_temporal_anchoring]]) |

---

## Gruppo G — Confine HARNESS (NON è KB-training)

| Dominio | Layer | Nota di pponderazione |
|---|---|---|
| **Tool-use, retrieval & gestione contesto a runtime** | harness | ⚠️ SCOMPORRE (#11): la *esecuzione/serializzazione/schema* è harness-owned e volatile (NON training); la *DECISIONE* quando-usare-un-tool è RL-skill già coperta dalle aree esistenti. Incluso solo per marcare il confine, NON come dominio pre-train. |
| **Orchestrazione multi-agente: delega/coordinamento/aggregazione** | both | è LETTERALMENTE l'identità Tier-1 e NON esisteva come dominio: quando delegare-vs-fare, come dividere, verificare/aggregare i sub-agenti, Brooks's law. Tenerlo come SKILL di ragionamento, non meccanismo di serving. |

---

## Pponderazione finale — cosa ne faccio (verso l'utente)

1. **Priorità #1 = Gruppo A (ragionamento/metacognizione)**: è l'identità Tier-1. Molti hanno GIÀ una training-class ([[training-taxonomy/class-metacognitive-self-audit]], consequence-intention, confabulation, verification-discipline) → questi domini sono il **substrato di CONOSCENZA sotto le SKILL già prototipate**, non tutto nuovo.
2. **Il layer-split è la decisione operativa chiave** e conferma 1295f: pre-train-fact (world-model, teoria CS stabile, math/logica) vs RL-skill (metacognizione, creatività, le skill outcome-anchored) vs both (la maggior parte). Il coding vero resta LoRA.
3. **Meta-regola per tutto il curriculum**: reward-outcome, mai cerimonia (il caveat ricorrente).
4. **CS-core come reasoning-substrate** (Gruppo C) è la scoperta più utile: raffina "coding theory" separando la TEORIA-che-ragiona (pre-train) dal coding-skill (LoRA).

## → Rule #18: candidati a diventare training-CLASS (attendo approvazione utente prima di filarli in `training-taxonomy/`)
I domini `RL-skill`/`both` del Gruppo A/B/D che NON hanno già una classe sono candidati-classe (con gold + reward-outcome + label-gen + hack-check). NON li creo unilateralmente. Priorità proposta: creatività-divergente (buco reale), diagnostic-reasoning, decision-theory/VoI (act-vs-ask), calibrazione-probabilistica, negotiation, emotional-intelligence. I domini `pre-train-fact` (Gruppo E + teoria CS/complessità) NON sono training-class ma **selezione-di-corpus** per il continual-pretraining.

## Open questions per l'utente — AGGIORNATE
- **Granularità (i 7 macro-gruppi)**: ✅ **APPROVATI** (utente msg 1315 "i sette macro gruppi per ora vanno bene"). I Gruppi A-G sono l'organizzazione accettata. Refinement del msg 1314: **il BASE tiene una piccola % di TUTTI e 7 i gruppi** → per ISTINTO + CATEGORIZZAZIONE/routing; la **DEPTH per-dominio** va nelle LoRA (Tier-2 macro / Tier-3 foglie). Vedi [[decisions/2026-07-08-tier2-justification-analysis]] §"tassello che risolve la tensione-capacità".
- **Confine pre-train vs RL per il Gruppo A**: quanta teoria nel CPT vs quanto lasciare all'RL? (lega a [[concepts/training-intelligence-optimization]] §1: RL affila/elicita, non installa → la teoria va seminata nel base PRIMA, l'RL la pratica). Rimane da calibrare empiricamente.
- **Nuova classe emersa**: "esercizi di categorizzazione" (msg 1314) = classe di training del **routing/classification** del Tier-1 (label-di-dominio corretta = outcome). Candidata (rule #18).

## Cross-link
[[concepts/training-intelligence-optimization]] · [[project_base_model_intelligence]] · [[project_three_tier_idea]] · [[feedback_reward_hacking_principle]] · [[training-taxonomy/class-metacognitive-self-audit]] · [[training-taxonomy/class-consequence-intention-conflict]] · [[concepts/verification-discipline-training]] · regole #10/#11/#18/#19/#20/#22
Sorgente grezza: `wiki/_private/user-notes-2026-07-07.md` (msg 1295a) · workflow `wf_1a67bdf7-476`

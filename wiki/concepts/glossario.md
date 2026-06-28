---
name: glossario
description: Layer plain-language — spiegazioni accessibili dei termini tecnici ricorrenti (GRPO-calibration, XGrammar, inoculation, mini-SWE-agent, GiGPO, OSS-Instruct/EpiCoder/LESS), ciascuna linkata al concept/catalogo che la approfondisce.
type: concept
tags: [glossario, reference, plain-language, training, rl]
sources: [decisions/2026-06-28-open-decisions-briefing (Parte 1), sota-techniques-catalog, user msg 243]
last_updated: 2026-06-29
---

# Glossario — spiegazioni plain-language

> Layer accessibile (richiesta utente msg 243: "parte 1 perfetta, da integrare tutta"). Ogni voce è la versione *non-tecnica* del termine; il dettaglio tecnico vive nel concept/catalogo linkato. Non duplica: indicizza e spiega.

## GRPO-calibration
**GRPO** (Group Relative Policy Optimization) è l'algoritmo di RL che usiamo: invece di un critic, confronta un *gruppo* di risposte allo stesso prompt e premia quelle relativamente migliori. **Calibration** = quanto la confidence dichiarata dal modello ("sono sicuro al 90%") corrisponde alla probabilità reale di aver ragione. Problema noto e strutturale: **GRPO erode la calibrazione** → rende il modello *overconfident*. Fix = un **calibration-reward** che premia la confidence *onesta* (RLCR/ConfTuner via Brier score, non il self-report). → [[../sota-techniques-catalog]] §Dim-4 (RLCR 2507.16806, Taming-Overconfidence 2410.09724).

## XGrammar
Libreria di **structured/constrained decoding**: forza l'output del modello a rispettare una **grammatica/schema** (JSON, TOON…) *durante* la generazione, in modo efficiente (quasi zero overhead). Per noi: garantisce che l'output rispetti il **contract** strutturato del giudice ([[judge-design]]) e la forma del pensiero strutturato ([[structured-thinking]]). Deciso in D2 ([[../decisions/2026-06-28-decisions-d1-d5]]).

## Inoculation-prompting
Tecnica **anti-misalignment** in training: si "inocula" il modello esponendolo a esempi *etichettati* del comportamento indesiderato, marcati nel contesto come negativi, così impara esplicitamente a **non** produrlo. In letteratura riduce il misalignment del ~75-90%. Per noi: difesa nel training (es. anti-exfiltration [[secret-section-exfiltration-defense]], anti reward-hacking [[reward-hacking-mitigation]]).

## mini-SWE-agent
Un agente SWE **minimale** (poche centinaia di righe: loop bash + edit + run-tests) che risolve task stile SWE-bench senza scaffold complesso. Per noi: **baseline leggera** di riferimento per l'harness agentico e per generare/valutare i dati RL agentici (Fase-2/3). Si sposa con i gym Docker esistenti (SWE-Gym/SWE-smith). → piano scaffold [[../decisions/2026-06-23-pi-harness-base]].

## GiGPO
Variante di GRPO con **credit-assignment a 2 livelli** (trajectory-level + anchor-state-level): risolve "quale *azione* nella traiettoria multi-step merita il reward" — il buco #1 dell'RL agentico — restando *critic-free* e girando su GPU modeste (2080Ti). → [[../sota-techniques-catalog]] §Dim-5 (2505.10978).

## OSS-Instruct
Tecnica (originariamente Magicoder) per generare **istruzioni di coding sintetiche** partendo da **snippet di codice reale** open-source: ancorare al codice vero riduce il bias/omogeneità del generatore. ⚠️ **Caveat licenza**: Magicoder è GPT-distilled → **non** commercial-clean; va usata la *tecnica* con un teacher permissivo (DeepSeek/Qwen-open). → [[../training-taxonomy/provenance-manifest]].

## EpiCoder
Framework di generazione dati coding via **feature-tree**: una struttura gerarchica di feature da cui campionare per ottenere diversità e complessità crescente (oltre i singoli snippet). Per noi: idea per costruire il dataset coding multi-framework dei verticali. (⚠️ verificare licenza/teacher prima dell'uso commerciale.)

## LESS
Metodo di **data-selection**: invece di addestrare su tutto, seleziona il **sottoinsieme più influente** per un target task (stima dell'influenza via gradienti). Per noi = **data-efficiency** (= budget): meno dati, più mirati, stesso o miglior risultato. Parente concettuale di LIMO/LIMR (reasoning forte da ~1K esempi curatissimi). → [[../sota-techniques-catalog]] (LIMO/LIMR 2502.03387/2502.11886).

## Link
[[../sota-techniques-catalog]] (dettaglio tecnico + ID) · [[../decisions/2026-06-28-open-decisions-briefing]] (Parte 1 originale) · [[training-vs-harness-classification]] · [[judge-design]]

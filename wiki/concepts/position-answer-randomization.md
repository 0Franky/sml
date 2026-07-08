---
name: position-answer-randomization
description: Principio cross-cutting di RANDOMIZZAZIONE nel training — randomizzare posizione-risposta (MCQ), simboli/nomi e ordine-varianti/contesto per impedire che il modello impari un cue posizionale/di-superficie invece del segnale vero. Consolida ciò che oggi vive sparso in MCQ fix#4 + symbol-random + hack-check di classi.
type: concept
tags: [training, methodology, cross-cutting, randomization, position-bias, letter-bias, shortcut-learning, reward-hacking, mcq, induction-heads, needle-in-haystack]
last_updated: 2026-07-08
---

# Randomizzazione di posizione / risposta / simboli (principio cross-cutting)

> **Stato**: consolidamento di un principio già applicato in più punti. Colma il **GAP aperto** dichiarato dal playbook: *"nessun concept cross-cutting per la randomizzazione-posizione (vive solo in MCQ fix#4 + hack-check sparsi)"* — vedi [[../training-taxonomy/dataset-construction-playbook]] §RANDOMIZZAZIONE (righe 117-121) + nota-GAP (riga 137) + [[../todo]]. Discende dal principio-cardine [[../feedback_reward_hacking_principle]] e si compone con [[training-set-construction-principles]].

## Cos'è

Randomizzare **posizione / simboli / ordine-delle-varianti** negli esempi di training per **impedire che il modello impari un cue posizionale o di-superficie** (dove sta la risposta, quale lettera, quale nome, quale ordine) **invece del segnale vero** (perché quella risposta è corretta). È una difesa **strutturale** contro lo shortcut-learning e la statistical-memorization: se un elemento load-bearing ha una **posizione**, quella posizione va randomizzata, così l'unico modo per minimizzare la loss è imparare il **contenuto**, non la sua collocazione.

## I 3 assi

### 1. POSIZIONE-RISPOSTA (MCQ)

Nelle multiple-choice a distrattori-confondibili ([[discriminative-mcq-hard-distractors]], fix #4) la posizione della risposta corretta va randomizzata su **due livelli**:

- **(a) per-item** → `shuffle` seeded dell'ordine delle opzioni. Anche se il generatore ha un bias (es. "corretta-emessa-per-prima"), lo shuffle mappa la corretta a una **lettera uniformemente distribuita**.
- **(b) dataset** → la distribuzione delle **lettere-corrette** deve essere **~uniforme**, e va **auditata** (non assunta) → mai "corretta=C" preponderante anche con generatore biased.

**Enforcer deterministico**: `mcq-distractor-gen.positionBalance(mcqs, {tolerance})` ([[../../harness/verifiers/mcq-distractor-gen]]) ritorna `{pass, distribution, maxDeviation, worst}` a livello dataset; `assembleMCQ(..., {seed})` fa lo shuffle seeded (mulberry32) per-item. Previene il **position/letter bias** (always-C) che i modelli MCQ notoriamente imparano.

### 2. SIMBOLI / NOMI

Regime [[runtime-symbol-randomization-training]]: split epistemico del substrato.

- **Knowledge immutabile** (formule, identità matematiche, leggi fisiche, fatti canonical) → **memorizzata** in-weight con CE-loss standard su esempi **fissi**, ripetuti.
- **Codice / strutture / identifier** → **nomi random mai-visti-due-volte**, generati runtime → memorization impossibile (vocab pseudo-infinito) → l'unico modo di minimizzare loss è **aprire un'induction head** che copia il simbolo dal contesto → **attention chirurgica** nel citare i nomi esatti.
- **Mix di naming** (hash / wordlike / natural / single-letter / camel) → copre più "shapes" di identifier reali e previene lo **shortcut sul pattern del generatore** (se i nomi fossero tutti `v_<hash>` il modello imparerebbe a riconoscere il prefisso invece di generalizzare).

### 3. ORDINE-VARIANTI / CONTESTO

- **Ordine/etichette delle varianti** mescolate + **optimum condizionato-al-contesto**: la banda/scelta giusta si sposta col contesto → l'euristica *"prendi sempre la 3ª / l'opzione c"* **sbaglia una frazione misurabile**. Applicato in [[../training-taxonomy/class-frontend-ux-spacing-quality]] (condizionamento anti "sempre-c", riga 65) via il suo hack-check.
- **Needle-position + dimensioni + ordine-sezioni**: [[dynamic-context-training-regime]] varia ≥5 dimensioni per sample (length / item-count / **needle-position** / noise-density / **section-order**) → l'attention impara il **retrieval robusto cross-position** invece di uno shortcut posizionale ("guarda solo i primi 2k token" / bias verso inizio-fine). Difesa strutturale contro il "Lost in the Middle".

## Perché (grounding)

- Il **position bias / letter bias** è un **modo-di-fallimento noto** dei modelli su MCQ (imparano "la risposta tende a stare in posizione X / lettera Y") e più in generale il **primacy/recency bias** in long-context ("Lost in the Middle", Liu 2023). La randomizzazione è la **difesa strutturale** che rende quel cue **non-predittivo**, forzando il modello sul segnale vero (anti shortcut-learning / anti statistical-memorization).
- È lo stesso principio dell'**anti-reward-hacking**: **non fidarsi della presentazione**, ancorare al ground-truth. Un cue posizionale è un **proxy di superficie** che un modello massimizzatore sfrutterebbe per lucrare reward senza avere la skill. Coerente con [[reward-hacking-mitigation]] e [[../feedback_reward_hacking_principle]].
- Meccanicisticamente (asse 2): l'impossibilità di memorizzare i nomi random è ciò che **costringe** ad aprire le induction-head (Olsson et al. 2022) → la randomizzazione non è solo difesa negativa, è **leva di apprendimento** attiva della skill di copy/retrieval.

## Regola operativa

Ogni volta che un esempio di training ha **opzioni / varianti / simboli / info con una posizione**:

1. **Randomizza a livello item** (shuffle seeded, nomi random, needle in posizione casuale).
2. **Audita l'uniformità a livello dataset** (distribuzione lettere-corrette ~uniforme; mix di naming bilanciato; needle-position coperta su tutto lo span).
3. Usa **enforcer deterministici** dove possibile (es. `positionBalance`), non un "dovrebbe essere bilanciato" a occhio.

Il difetto che si previene NON è estetico: un dataset con "corretta=C" al 40% insegna al modello a **rispondere C**, e il reward-pulito-da-MCQ diventa **illusorio** (premia il cue di superficie, non la discriminazione).

## Dove è già applicato

| Asse | Dove | Enforcer / meccanismo |
|---|---|---|
| Posizione-risposta (MCQ) | [[discriminative-mcq-hard-distractors]] (fix #4) | `mcq-distractor-gen.positionBalance` + `assembleMCQ` shuffle seeded |
| Simboli / nomi | [[runtime-symbol-randomization-training]] | generazione runtime + mix naming (hash/wordlike/natural) |
| Ordine-varianti | [[../training-taxonomy/class-frontend-ux-spacing-quality]] (hack-check "sempre-c") | optimum condizionato-al-contesto |
| Needle / contesto | [[dynamic-context-training-regime]] | ≥5 dimensioni variabili per sample (needle-position, section-order) |

## Links

[[discriminative-mcq-hard-distractors]] · [[runtime-symbol-randomization-training]] · [[dynamic-context-training-regime]] · [[training-set-construction-principles]] · [[../training-taxonomy/dataset-construction-playbook]] · [[../training-taxonomy/class-frontend-ux-spacing-quality]] · [[reward-hacking-mitigation]] · [[../feedback_reward_hacking_principle]] · [[../../harness/verifiers/mcq-distractor-gen]]

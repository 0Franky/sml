---
name: interruption-robust-reasoning
description: Skill (pesi) di mantenere accuratezza quando il reasoning viene interrotto a fine-sezione per iniettare un update esterno (section-boundary injection). Senza training l'interruzione costa fino a −60% accuracy (arXiv 2510.11713: Reasoning-Leakage/Panic/Self-Doubt); il meccanismo MinD multi-call dà solo l'aggancio, il VALORE è gated sul training. Reward ancorato all'OUTCOME (l'update ha migliorato la risposta, non la forma). Decisione utente msg 193 (2026-06-27).
type: concept
tags: [concept, reasoning, interruption, section-boundary, metacognition, training-gated, reward-hacking]
sources: [user notes 2026-06-27 msg 193/203, arXiv 2510.11713, arXiv 2505.19788 (MinD), external-update-injection]
last_updated: 2026-06-27
status: draft v0
confidence: provisional
---

# Interruption-Robust Reasoning (resume-after-update)

> **Stato**: draft v0. È la **skill nei pesi** che rende utile il meccanismo di [[external-update-injection]] / section-boundary. Decisione utente msg 193 + ricerca sourced.

## Catena di pensiero (why → problema → soluzione)

- **Why** `[EXTRACTED]` — vogliamo iniettare update esterni (risultato tool async, messaggio utente async, contraddizione rilevata) **a fine sezione** durante il thinking, e che il modello li incorpori. Il meccanismo c'è (multi-call MinD `stop=["</section>"]` + APC, vedi [[external-update-injection]]).
- **Problema** `[EXTRACTED]` — il meccanismo da solo **non basta**: un modello non addestrato all'interruzione **degrada** se interrotto. Evidenza: arXiv 2510.11713 ("Are LRMs Interruptible?") misura fino a **−60% accuracy** a seconda della gestione, con 3 failure mode — **Reasoning-Leakage** (continua il vecchio ragionamento ignorando l'update), **Panic** (abbandona tutto e ricomincia male), **Self-Doubt** (l'update lo destabilizza su parti corrette). → il valore della feature è **gated sul training**, non sul meccanismo.
- **Soluzione** `[EXTRACTED]` — addestrare esplicitamente la skill: ricevuto un `<update>` a fine sezione, (1) valutare l'impatto (`<update_handling>`: invalida / aggiusta / differisci / ignora), (2) **integrare** l'info senza perdere le parti di ragionamento ancora valide, (3) riprendere coerente. È metacognitiva e robusta-all'interruzione by-design.

## Meccanismo (FEATURE) vs skill (S)

- **FEATURE/serving**: section-boundary via **multi-call MinD** (`stop=["</section>"]`) + Automatic Prefix Caching → fattibile su vLLM stock, costo basso. Dà *quando/dove* iniettare. → [[external-update-injection]], [[../architecture/harness-feature-catalog]] §Classe-B.
- **SKILL/pesi**: *come* reagire all'update mantenendo accuratezza. È **inerte/degradata senza training** (audit §2ter del catalog).

## Reward / hack-check

- **Outcome desiderato**: dopo l'interruzione+update, la risposta finale è **migliore (o non peggiore)** di quella senza interruzione, *quando l'update era rilevante*.
- **Reward ancorato all'OUTCOME** `[EXTRACTED]` — premia se **l'update ha migliorato la risposta** (outcome verificabile: la risposta post-update è corretta dove quella pre-update sarebbe stata sbagliata), MAI la **forma** dell'`<update_handling>` (participation-hack: emettere il blocco di gestione per incassare il reward). Vedi [[reward-hacking-mitigation]].
- **Coppia bilanciata** `[INFERRED]`: scenari con update **rilevante** (deve cambiare la risposta) e update **irrilevante/rumore** (deve essere correttamente ignorato senza destabilizzare) → penalità simmetrica contro Reasoning-Leakage (ignora il rilevante) E Self-Doubt (si fa destabilizzare dall'irrilevante).

## Training

- **Regime** `[INFERRED]`: SFT su traiettorie con interruzione (sezione → `<update>` → `<update_handling>` → ripresa corretta) → **RL outcome-anchored**. Prior art: multi-stream / decomposizione del reasoning (arXiv 2605.12460 `[ref? da confermare]`) preserva/migliora sotto interruzione.
- **Label-generation** `[INFERRED]`: sintetiche by-construction — prendi un reasoning corretto, inietta un update a posizione nota (rilevante o rumore), la ground-truth è la risposta finale corretta. Non-gameable con verbosità.
- **Foglia di training**: Area 3 (reasoning) + Area 4 (metacognition). Caso d'uso primario (msg 203): messaggio utente async iniettato a fine sezione.

## Linked
- [[external-update-injection]] — il meccanismo (section-boundary multi-call MinD) che questa skill rende utile.
- [[structured-thinking]] — il thinking a `<section>` su cui opera l'interruzione.
- [[contradiction-detection-layer]] — una delle fonti di `<update>` (contraddizione rilevata → attention-event).
- [[reward-hacking-mitigation]] — outcome-anchored, coppia bilanciata rilevante/rumore.
- [[../architecture/harness-feature-catalog]] §Classe-B + §2ter (audit "inerte senza training").

> **Next**: foglia di training (Area 3/4) con example-space (update-rilevante vs rumore); validare empiricamente su Qwen3-4B; confermare i ref 2510.11713 / 2505.19788 / 2605.12460.

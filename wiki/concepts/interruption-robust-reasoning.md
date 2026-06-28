---
name: interruption-robust-reasoning
description: Skill (pesi) di mantenere accuratezza quando il reasoning viene interrotto a fine-sezione per iniettare un update esterno (section-boundary injection). Senza training l'interruzione costa fino a −60% accuracy (arXiv 2510.11713: Reasoning-Leakage/Panic/Self-Doubt); il meccanismo MinD multi-call dà solo l'aggancio, il VALORE è gated sul training. Reward ancorato all'OUTCOME (l'update ha migliorato la risposta, non la forma). Decisione utente msg 193 (2026-06-27).
type: concept
tags: [concept, reasoning, interruption, section-boundary, metacognition, training-gated, reward-hacking]
sources: [user notes 2026-06-27 msg 193/203, arXiv 2510.11713, arXiv 2505.19788 (MinD), external-update-injection]
last_updated: 2026-06-29
status: finalized v1 — training-spec completa (coppia bilanciata + transfer sintetico→reale)
confidence: provisional
---

# Interruption-Robust Reasoning (resume-after-update)

> **Stato**: finalized v1. È la **skill nei pesi** che rende utile il meccanismo di [[external-update-injection]] / section-boundary. Decisione utente msg 193 + ricerca sourced; training-spec completata 2026-06-29.

## Catena di pensiero (why → problema → soluzione)

- **Why** `[EXTRACTED]` — vogliamo iniettare update esterni (risultato tool async, messaggio utente async, contraddizione rilevata) **a fine sezione** durante il thinking, e che il modello li incorpori. Il meccanismo c'è (multi-call MinD `stop=["</section>"]` + APC, vedi [[external-update-injection]]).
- **Problema** `[EXTRACTED]` — il meccanismo da solo **non basta**: un modello non addestrato all'interruzione **degrada** se interrotto. Evidenza: arXiv 2510.11713 ("Are LRMs Interruptible?") misura fino a **−60% accuracy** a seconda della gestione, con 3 failure mode — **Reasoning-Leakage** (continua il vecchio ragionamento ignorando l'update), **Panic** (abbandona tutto e ricomincia male), **Self-Doubt** (l'update lo destabilizza su parti corrette). → il valore della feature è **gated sul training**, non sul meccanismo.
- **Soluzione** `[EXTRACTED]` — addestrare esplicitamente la skill: ricevuto un `<update>` a fine sezione, (1) valutare l'impatto (`<update_handling>`: invalida / aggiusta / differisci / ignora), (2) **integrare** l'info senza perdere le parti di ragionamento ancora valide, (3) riprendere coerente. È metacognitiva e robusta-all'interruzione by-design.

## Meccanismo (FEATURE) vs skill (S) — classificazione training-vs-harness `[review-loop]`

Applico il decision-tree di [[training-vs-harness-classification]] (Step-0 scomponi → classifica ogni metà → stato-senza-training).

- **Q0 scomponi**:
  - **{meccanismo}** = la **section-boundary injection** via **multi-call MinD** (`stop=["</section>"]`) + Automatic Prefix Caching → dà l'*aggancio* fisico (*quando/dove* interrompere e iniettare l'`<update>`).
  - **{decisione}** = *come* reagire all'update — valutare l'impatto (invalida/aggiusta/differisci/ignora) + integrare senza perdere il ragionamento valido + riprendere coerente.
- **Q1/Q1a → F-serving-stock**: il section-boundary multi-call MinD è una capability di **serving nativa attivabile via config** su vLLM (`stop` + APC) — zero training. **Stato: PIENA**. **È la PRECONDIZIONE**: senza questo aggancio F la skill non ha *dove* esercitarsi (l'interruzione a fine-sezione non esisterebbe).
- **Q2 → S**: la gestione dell'update (`<update_handling>` semanticamente corretta + ripresa robusta) è comportamento nei pesi.
- **Q3 → F+S**: Q1 ∧ Q2, e lo stato-senza-training della metà-S è **DEGRADATA fino a INERTE** — non degradata "un po'": evidenza arXiv 2510.11713 misura fino a **−60% accuracy** su modello non addestrato all'interruzione, con 3 failure mode (Reasoning-Leakage / Panic / Self-Doubt). Il meccanismo F **da solo non basta**: il valore è gated sul training della metà-S.
- **Q5 stato-senza-training (metà-S): DEGRADATA-MA-UTILE → tendente a INERTE** sotto interruzione frequente. NON spedibile come skill robusta di Fase-1.
- **Q6 fallback deterministico: assente/debole**. Non c'è euristica wrapper-side che renda un modello non-addestrato robusto all'interruzione (il degrado è interno al reasoning). → gated sul training.

> **Output**: `{F+S · F=section-boundary-MinD (precondizione, PIENA) · stato-S=DEGRADATA(−60%)→INERTE · gate=training F2-3 · spec-S=coppia-bilanciata rilevante/rumore}`.

- **Riferimenti meccanismo**: → [[external-update-injection]], [[../architecture/harness-feature-catalog]] §Classe-B + §2ter (audit "inerte senza training").

## Reward / hack-check

- **Outcome desiderato**: dopo l'interruzione+update, la risposta finale è **migliore (o non peggiore)** di quella senza interruzione, *quando l'update era rilevante*.
- **Reward ancorato all'OUTCOME** `[EXTRACTED]` — premia se **l'update ha migliorato la risposta** (outcome verificabile, allineato alla metrica di arXiv 2510.11713: la risposta post-update è corretta dove quella pre-update sarebbe stata sbagliata), MAI la **forma** dell'`<update_handling>` (participation-hack: emettere il blocco di gestione per incassare il reward). Vedi [[reward-hacking-mitigation]].
- **Coppia bilanciata (update-RILEVANTE vs rumore)** `[INFERRED]`: per ogni scenario, una coppia con update **rilevante** (deve cambiare la risposta → si premia se l'ha cambiata correttamente) e update **irrilevante/rumore** (deve essere correttamente ignorato senza destabilizzare → si premia se ha tenuto la risposta corretta). La coppia dà **penalità simmetrica** contro Reasoning-Leakage (ignora il rilevante) E Self-Doubt (si fa destabilizzare dall'irrilevante). È by-construction non-gameable: emettere sempre il blocco `<update_handling>` non basta, conta solo l'esito sul gemello giusto.
- **Hack-check (scorer ≠ scored)** `[review-loop]`: lo scorer è la **correttezza verificabile della risposta finale** (oracolo del task, deterministico), non un auto-giudizio sulla qualità della gestione → **scorer ≠ scored** (CLAUDE.md #10). La forma del blocco di handling non riceve mai reward diretto.

## Training

- **Regime** `[INFERRED]`: `SFT-format` su traiettorie con interruzione (sezione → `<update>` → `<update_handling>` → ripresa corretta) → **on-policy distillation cold-start** (student genera la ripresa, teacher scora) → **RL-GRPO outcome-anchored**. Prior art: multi-stream / decomposizione del reasoning (arXiv 2605.12460 `[ref? da confermare]`) preserva/migliora sotto interruzione.
- **Label-generation = sintetiche by-construction** `[INFERRED]`: prendi un reasoning corretto, inietta un update a posizione-sezione nota (rilevante **o** rumore — la coppia bilanciata sopra), la ground-truth è la risposta finale corretta. Non-gameable con verbosità.
- **Transfer sintetico→reale** `[review-loop]`: le traiettorie sintetiche (update iniettato a posizione nota) servono ad **addestrare** la robustezza; va però **misurato il transfer** sul degrado *reale* — interruzioni non-sintetiche (messaggio utente async genuino, risultato tool async) su task held-out — perché il degrado sintetico potrebbe non coprire la distribuzione reale dei failure-mode di 2510.11713. La metrica di successo è la **chiusura del gap −60%** su interruzioni reali, non solo sulle sintetiche.
- **Foglia di training**: Area 3 (reasoning) + Area 4 (metacognition). Caso d'uso primario (msg 203): messaggio utente async iniettato a fine sezione.

## Linked
- [[training-vs-harness-classification]] — il playbook di classificazione; istanza F+S con F=section-boundary-MinD (precondizione, F-serving-stock PIENA) + S=gestione-update (DEGRADATA −60%→INERTE).
- [[external-update-injection]] — il meccanismo (section-boundary multi-call MinD) che questa skill rende utile.
- [[structured-thinking]] — il thinking a `<section>` su cui opera l'interruzione.
- [[contradiction-detection-layer]] — una delle fonti di `<update>` (contraddizione rilevata → attention-event).
- [[reward-hacking-mitigation]] — outcome-anchored, coppia bilanciata rilevante/rumore.
- [[../architecture/harness-feature-catalog]] §Classe-B + §2ter (audit "inerte senza training").

> **Next**: foglia di training (Area 3/4) con example-space (update-rilevante vs rumore); validare empiricamente su Qwen3-4B; confermare i ref 2510.11713 / 2505.19788 / 2605.12460.

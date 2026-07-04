---
name: 2026-07-04-base-model-intelligence-not-capability
description: "Il Tier 1 (modello base/orchestrator) si addestra verso INTELLIGENZA + know-how operativo (problem analysis, decomposizione, come agire), NON verso la capacità di coding. La capacità arriva dai layer 2/3 (LoRA verticali)."
type: decision
status: accepted
tags: [three-tier, tier-1, training-objective, intelligence-vs-capability, problem-decomposition, identity, orchestrator]
last_updated: 2026-07-04
sources:
  - "Utente TG msg 988 (2026-07-04)"
---

# ADR — Modello base = INTELLIGENZA, non CAPACITÀ (Tier 1 addestrato a operare, non a codificare)

## Decisione [EXTRACTED]

Il **Tier 1** (modello base / orchestratore, full-FT) si addestra verso **intelligenza e utilità**, **non** verso il codice. Deve essere **intelligente**, non necessariamente **capace**: deve sapere **come operare, cosa fare, come agire nelle situazioni**. La **capacità** di dominio (coding vero, framework-specifico) la aggiungono i **layer 2/3** (LoRA verticali).

> Verbatim utente (msg 988, 2026-07-04): *«non lo devi istruire verso il codice ma verso l'intelligenza e l'utilità. Anche il nostro modello base deve essere intelligente, magari non capace ma deve sapere come operare, cosa fare e come agire alle situazioni. Poi la capacità la inseriamo con layer 2/3.»* + reframe identità: *«You are an expert coding assistant → You are an intelligent assistant expert in problem analysis and task decomposition operating…»*

## Catena (why → problema → soluzione)

- **Why**: se il Tier 1 è addestrato a *codificare*, diventa un coder monolitico e la three-tier perde senso (la capacità di coding sarebbe già nel base, non nelle LoRA). Inoltre il coding-skill è specifico e non-trasferibile; l'**intelligenza operativa** (come smontare un problema, come agire) è **generalizzabile a QUALSIASI dominio**.
- **Problema**: cosa deve *sapere* il base per essere "intelligente ma non ancora capace"? → meta-cognizione + know-how operativo: **problem analysis, decomposizione, impact/blast-radius, giudizio situazionale, uso dell'harness (lane/tool/memoria), quando chiedere vs agire, come ragionare a passi**. NON la scrittura di codice corretto.
- **Soluzione**: separazione pulita — **base = intelligenza GENERALE trasferibile** (orchestra, decompone, delega, agisce); **LoRA 2/3 = capacità di dominio** innestata a runtime. Un orchestratore intelligente che sa *cosa* fare e *a chi/come* delegare, non un modello che "sa tutto".

## Cosa cambia (conseguenze)

1. **Obiettivo di training del Tier 1** [EXTRACTED]: ragionamento / problem-understanding / decomposizione / azione-situazionale, **non** correttezza-codice. La correttezza-codice è obiettivo delle LoRA (Tier 2/3), valutata lì.
2. **Identità di sistema** [EXTRACTED]: da `"expert coding assistant"` → `"intelligent assistant expert in problem analysis and task decomposition"`. Il system-prompt/awareness steera verso **intelligenza/utilità/come-operare**, non verso il codice. → aggiornare il framing nell'harness (context-assembly / system prompt del base).
3. **[[model-testbook]] TB-17 (problem-decomposition/impact-analysis) diventa il CUORE del Tier 1**, non una capability secondaria: è letteralmente *ciò che rende il base "intelligente ma non capace"*. Va promosso da desiderata a **obiettivo primario** della tassonomia Tier-1.
4. **Reward del Tier 1 ancorato all'OUTCOME del ragionamento** [INFERRED]: premia la decomposizione/azione che predice il vero blast-radius e agisce giusto nella situazione (verificato sul ground-truth), **mai** la capacità di scrivere codice o la cerimonia dell'analisi ([[feedback_reward_hacking_principle]]).
5. **Eval del base separata dall'eval delle LoRA** [INFERRED]: il base si valuta su "sa come operare/agire/decomporre" (situazioni, held-out di ragionamento), non su benchmark di coding puro (quelli valutano Tier 1+2/3 insieme).

## Relazione con la ground-truth three-tier (protetta)

Questa decisione **NON riscrive** la [[project_three_tier_idea|three-tier]] (orchestrator FT + LoRA programming + LoRA verticali): la **raffina/affila**. Chiarisce *cosa* è l'orchestratore Tier-1 — un'**intelligenza operativa generale**, non un coder — e conferma che la capacità di dominio vive nelle LoRA (Tier 2/3). È il chiarimento più netto finora dell'obiettivo di training del base.

## Follow-up

- Aggiornare l'identità/awareness del base nell'harness (framing "problem analysis & task decomposition").
- Promuovere TB-17 a obiettivo primario Tier-1; mapparlo sulla training-taxonomy come area centrale.
- Rivedere la tassonomia Tier-1 alla luce di "intelligenza operativa, non coding": quali foglie sono meta-cognizione/operazione (Tier-1) vs capacità-di-dominio (Tier-2/3)?

## Links

[[project_three_tier_idea]] · [[model-testbook]] (TB-17) · [[feedback_reward_hacking_principle]] · [[feedback_training_vs_harness_classification]] (CLAUDE.md #11: {meccanismo F} vs {decisione S}) · training-taxonomy/README.

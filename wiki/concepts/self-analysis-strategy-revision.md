---
name: self-analysis-strategy-revision
description: Addestrare il modello all'autoanalisi introspettiva — root-cause sul proprio fallimento, rilevamento dei punti di attrito (anche lato utente), e revisione delle PROPRIE strategie. Estende self-eval (Area 16) e metacognizione (Area 4) dal livello artefatto al livello traiettoria+strategia. Idea utente 2026-06-26.
type: concept
tags: [metacognition, self-analysis, self-reflection, strategy-revision, error-memo, training, reflexion, friction-awareness, draft]
sources: [user notes 2026-06-26 Telegram, Reflexion Shinn 2023, Self-Refine Madaan 2023]
last_updated: 2026-06-26
status: draft — idea utente 2026-06-26, da validare
confidence: provisional
---

# Self-Analysis & Strategy Revision (autoanalisi introspettiva)

> **Origine**: idea utente 2026-06-26 (Telegram). *"Sarebbe ottimo se addestrassimo il modello a farsi autoanalisi: capire perché le cose non vanno, cosa non va, cosa crea fastidio. Migliora intelligenza, usabilità e solidità — anche a livello di strategie."*

## 1. L'idea
Il modello non si limita a verificare il singolo output (verify-loop) o a valutare un artefatto vs un teacher (Area 16). Esegue **autoanalisi introspettiva** sul **proprio comportamento/traiettoria**:
- **Perché** un task è andato male (root-cause, non sintomo).
- **Cosa** non funziona nel proprio approccio (assunzione sbagliata, step mancante, strategia inadatta).
- **Cosa crea attrito** — nell'esecuzione e **lato utente** (frustrazione, re-ask, correzioni).
- E **revisiona le proprie strategie** di conseguenza (meta-livello), non solo il singolo output.

L'output dell'autoanalisi non è uno sfogo: è un **delta di strategia azionabile** che va in [[error-memo-system]] come lezione/regola.

## 2. Dove si colloca (estende, non duplica)
| Livello | Concetto esistente | Cosa aggiunge l'autoanalisi |
|---|---|---|
| Output singolo | verify-loop ([[scientific-method-operating-protocol]] passo 8) | — già coperto |
| Artefatto vs teacher | Area 16 self-eval / "il gioco" | — già coperto |
| Riconoscere stato degradato | Area 4 degradation-self-awareness | è il **trigger** dell'autoanalisi |
| **Traiettoria + strategia** | *(gap)* | **root-cause sul proprio percorso + revisione di strategia** ← NUOVO |
| Attrito utente (UX) | *(gap parziale: ask-vs-proceed, honest-reporting Area 9)* | **rilevare la frustrazione/attrito come segnale** ← NUOVO |

## 3. Letteratura (prior art)
- **Reflexion** (Shinn et al. 2023): agente che **riflette verbalmente** sul fallimento e memorizza la riflessione → migliora al retry. È il match più vicino. https://arxiv.org/abs/2303.11366
- **Self-Refine** (Madaan et al. 2023): self-feedback iterativo sull'output. https://arxiv.org/abs/2303.17651
- Affine a [[error-memo-system]] (memoria lezioni), [[post-rl-path-optimization]] (impratichimento), [[scuola-learning-philosophy]] ("migliorare").

## 4. Regime di training (bozza)
- Dato un **trajectory fallito** (o sub-ottimo) → il modello produce: (1) root-cause, (2) il punto esatto di deviazione, (3) la strategia alternativa, (4) il retry. Reward = **il retry migliora davvero** (outcome).
- **Coppie contrastive**: stessa task, traiettoria-con-autoanalisi vs senza → la prima deve convergere meglio/prima.
- **Fase curriculum**: principalmente **Fase 3 (RL-agentico con harness)** — l'autoanalisi ha senso su task reali in loop; semi in Fase 2 (esempi annotati di post-mortem). → [[staged-curriculum-training]].

## 5. ⚠️ Critica onesta (perché NON è gratis)
1. **Confabulazione del post-mortem** (rischio #1): un modello che "spiega perché ha fallito" può **inventare una storia plausibile ma falsa**. Stesso problema di Area 16. → il reward dell'autoanalisi va **ancorato all'OUTCOME**: l'analisi è "buona" solo se **agendoci il risultato migliora** misurabilmente, MAI per la plausibilità della narrazione → [[reward-hacking-mitigation]].
2. **"Cosa crea fastidio all'utente" non ha ground-truth facile**: inferire la frustrazione da *vibes* → rischio **sycophancy / over-apologizing / over-asking** (tensione con [[agent-constitution]] objective-critique). → usare **segnali osservabili reali** (correzioni esplicite, re-ask, task-failure, l'utente che rifà a mano), non "sembra seccato".
3. **Ruminazione / analysis-paralysis**: autoanalizzarsi *sempre* = loop, spreco token, over-cautela. → **trigger + budget**: scatta su segnale di fallimento/attrito, non a ogni turno; cap come il verify-loop; lega ad adaptive-depth ([[scientific-method-operating-protocol]] Fase 2).
4. **Deve essere AZIONABILE**: non "devo fare meglio" (vago) ma un delta concreto ("su codice concorrente, cerca race prima dello stile") salvato in [[error-memo-system]].
5. **Auto-demoralizzazione / over-correction**: troppa enfasi sui fallimenti può rendere il modello timido/over-hedging. Bilanciare con **cosa ha funzionato**, non solo cosa è andato male.

## 6. Valore (perché vale la pena)
Se ancorata all'outcome, è un moltiplicatore: alimenta [[error-memo-system]], rende la Fase 2 (ottimizzazione adaptive) **data-driven**, e la **friction-awareness** è un differenziatore di usabilità reale (pochi modelli modellano l'attrito utente come segnale). Coerente con organization-first e [[scuola-learning-philosophy]]. Conferma il claim utente "migliora intelligenza/usabilità/solidità" — a condizione delle difese §5.

## 7. Candidati taxonomy
- **Area 16** (Self-Evaluation & Critique): nuova foglia *"trajectory-level self-analysis + strategy revision"* (Q+L, reward outcome-anchored sul retry migliorato).
- **Area 4** (Metacognition): foglia *"friction/frustration detection da segnali osservabili"* (Q+L).
- **Area 1** (Organization): la revisione di strategia è planning-level (re-planning informato dal post-mortem).

## 8. Paper-claim candidato (#7?)
Possibile: *"outcome-anchored introspective self-analysis + friction-awareness come training signal per agenti coding organization-first"*. Novelty vs Reflexion: l'**ancoraggio all'outcome del reward dell'analisi** (anti-confabulazione) + la **friction utente** come segnale. `[da-validare se regge come claim separato vs Reflexion]`.

## Sources
- User notes 2026-06-26, Telegram.
- Reflexion (Shinn et al. 2023): https://arxiv.org/abs/2303.11366
- Self-Refine (Madaan et al. 2023): https://arxiv.org/abs/2303.17651
- Collega: [[error-memo-system]], [[scientific-method-operating-protocol]], [[post-rl-path-optimization]], [[scuola-learning-philosophy]], [[reward-hacking-mitigation]], [[agent-constitution]], [[../training-taxonomy/README]] (Area 16, 4, 1).

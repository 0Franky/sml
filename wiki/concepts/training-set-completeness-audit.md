---
name: training-set-completeness-audit
description: Checklist/tool per verificare che un training set sia COMPLETO e COERENTE prima di considerarlo pronto — nessun gap di copertura, positivi↔negativi bilanciati, transfer cross-dominio sufficiente, nessuna contraddizione, decontaminazione held-out. Richiesta utente msg 1218.
type: concept
tags: [training, dataset-quality, audit, checklist, negative-examples, transfer, meta]
last_updated: 2026-07-05
---

# Audit di completezza & coerenza del training set

> **Cos'è** (utente msg 1218): un **checklist operativo** da eseguire su un dataset/classe PRIMA di dichiararlo pronto. Non basta accumulare esempi positivi: un set con gap, senza negativi, o incoerente addestra una skill fragile o hackabile. È il gate-qualità che accompagna [[training-set-construction-principles]] (#18-#21). Applicalo a ogni classe di [[../training-taxonomy/index|training-taxonomy]].

## Checklist (ogni voce = PASS/FAIL con evidenza)

### 1. Copertura — nessun GAP
- [ ] **Tutte le sotto-classi/varianti** della skill sono rappresentate (non solo il caso facile/canonico)?
- [ ] I **casi-confine** (boundary) sono presenti (input negativi, zero, vuoti, limiti)?
- [ ] Le **modalità di fallimento reali** osservate (dai finding harness/esperimenti) sono coperte?
- [ ] Gap noti → tracciati in `wiki/todo.md`, non lasciati impliciti (regola #12).

### 2. Esempi NEGATIVI + bilanciamento (regola #21)
- [ ] Ci sono **contro-esempi** (casi dove la skill NON deve scattare / la risposta corretta è l'opposto o il non-agire)?
- [ ] Positivi↔negativi **bilanciati** (non 90/10) così il segnale è discriminativo?
- [ ] Il **reward è SIMMETRICO** — l'hack "sempre-prudente / sempre-cheap / sempre-astieniti" FALLISCE i negativi? (se un comportamento fisso passa, mancano negativi)
- [ ] Il negativo è **non-ovvio** (la non-applicabilità non è segnalata da un cue lessicale superficiale)?

### 3. Transfer cross-dominio sufficiente (regola #19)
- [ ] ≥3-4 transfer su **domini lontani/opposti** (vita quotidiana, economia/policy, ecologia, salute, business) — NON concentrati in software?
- [ ] **Complessità variabile** (dal banale al sistemico)?
- [ ] Il numero di **classi esterne generalizzate** è sufficiente a forzare l'astrazione (non 1 dominio)?

### 4. Coerenza — nessuna CONTRADDIZIONE
- [ ] Due esempi non insegnano **cose opposte** sullo stesso input (label conflittuali)?
- [ ] Gli **oracoli/reward** sono coerenti tra esempi (stessa metrica-obiettivo, stesso ancoraggio all'outcome)?
- [ ] Nessuna contraddizione con **altre classi** (specie col padre/sorelle nella gerarchia, regola #20)?

### 5. Ancoraggio & anti-hack (principio cardine)
- [ ] Ogni reward è **ancorato all'OUTCOME** reale (oracolo verificabile), MAI alla cerimonia/forma ([[../feedback_reward_hacking_principle]])?
- [ ] C'è un **hack-check** esplicito che elenca i modi di lucrare il segnale e come sono neutralizzati?
- [ ] I marker di ragionamento sono **ancorabili** a tool-call/artefatti reali (anti catena-fantasma, CLAUDE.md #10)?

### 6. Decontaminazione (regola #18)
- [ ] L'**istanza osservata** (il caso reale da cui è nata la classe) è tenuta **held-out**, NON nel training?
- [ ] Il transfer sull'held-out è dichiarato come **metrica di successo** (se impara, generalizza e lo risolve)?

### 7. Struttura & wiring (regole #20, #12)
- [ ] La classe è **agganciata al padre** giusto (gerarchia), con link reciproci?
- [ ] È in `index.md`, ha frontmatter completo, e i link interni risolvono (no orfani/dangling)?

## Output dell'audit
Un report per-classe: voci PASS/FAIL + evidenza + gap→TODO. Una classe è **"pronta"** solo con tutte le voci PASS (o i FAIL giustificati esplicitamente). Da rieseguire quando la classe cambia o nuovi finding emergono.

## Links
[[training-set-construction-principles]] · [[../feedback_reward_hacking_principle]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_intelligence_gap_to_training_class]] · [[../training-taxonomy/class-metacognitive-self-audit]]

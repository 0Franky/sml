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
- [ ] **Integrità fattuale (regola #22)**: ogni claim FATTUALE è o **verificato+citato** (I) o riformulato come **verify-step/Discovery** (II)? Nessun **fatto-del-mondo inventato o volatile** asserito come ground truth (es. "Gmail ha solo server US")? Le skill di ragionamento usano fatti **self-contained nella fixture** (veri-per-costruzione) dove possibile?

### 6. Decontaminazione (regola #18)
- [ ] L'**istanza osservata** (il caso reale da cui è nata la classe) è tenuta **held-out**, NON nel training?
- [ ] Il transfer sull'held-out è dichiarato come **metrica di successo** (se impara, generalizza e lo risolve)?

### 7. Struttura & wiring (regole #20, #12)
- [ ] La classe è **agganciata al padre** giusto (gerarchia), con link reciproci?
- [ ] È in `index.md`, ha frontmatter completo, e i link interni risolvono (no orfani/dangling)?

## Output dell'audit
Un report per-classe: voci PASS/FAIL + evidenza + gap→TODO. Una classe è **"pronta"** solo con tutte le voci PASS (o i FAIL giustificati esplicitamente). Da rieseguire quando la classe cambia o nuovi finding emergono.

## Applicazione 2026-07-05 (prima esecuzione — campione)

Primo run dell'audit su un campione, per stimare i gap del dataset esistente (msg 1218-d). Campionato `gold-example-decomposition.md` (2026-06-29, skill Tier-1 `hierarchical-decomposition`):

| Voce | Esito | Evidenza |
|---|---|---|
| 1. Copertura | PASS | 5 classi (WITH-hint 3 livelli · WITHOUT-hint · WRONG-awareness · WRONG-recovery · OTHER). |
| 2. Negativi + bilanciamento | **PASS (forte)** | 3a/3b/3c difettose da riconoscere + **coppia bilanciata** 5a banale / 5b falso-invariante adversariale; penalità simmetrica anti-over-decomposition. |
| 3. **Transfer cross-dominio (#19)** | **FAIL** | §4 "usa come template" elenca SOLO scenari **software** (parser multi-formato, pipeline ML). ZERO transfer a domini lontani (vita quotidiana, business, ecologia…). La skill decompose vale per QUALSIASI problema (pianificare un evento, strutturare un'azienda) → così com'è il modello rischia di **localizzarla al codice** (esattamente ciò che #19 vieta). |
| 4. Coerenza | PASS | cross-link coerenti, nessuna contraddizione trovata. |
| 5. Ancoraggio + hack-check | **PASS (forte)** | reward su oracoli eseguibili (pytest/pylint duplicate-code/mutation-probe ∀stmt); hack-check esplicito scorer≠scored, forma-non-premiata. |
| 6. Decontaminazione | PASS | fixture held-out FX-trivial / FX-false-invariant. |
| 7. Struttura & wiring | PASS | in index, frontmatter completo, link risolvono. |

**Finding trasversale [INFERRED]:** i gold/classi **pre-2026-07-05** sono robusti su negativi + ancoraggio (principi assorbiti presto) ma **mancano il transfer cross-dominio** di regola #19 (creata dopo, 2026-07-05). Le classi **create dopo** (metacognitive-self-audit e figlie, constraint-fit, resource-substitution, consequence-intention, confabulation) hanno il transfer cross-dominio by-design → il gap è **datato**, non pervasivo.

**Remediation proposta (tracciata, attende OK utente — regola #18):** pass di *transfer cross-dominio* sui gold di **ragionamento/metacognizione** pre-#19 (decomposition per primo: aggiungere §4bis con 3-4 esempi non-software — decomporre un evento/piano-aziendale/progetto-di-ricerca con la STESSA logica core→axes→leaves). NON sui gold Q verticali-di-codice puri (dove la localizzazione al codice è corretta). → `wiki/todo.md`.

## Links
[[training-set-construction-principles]] · [[../feedback_reward_hacking_principle]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_intelligence_gap_to_training_class]] · [[../training-taxonomy/class-metacognitive-self-audit]]

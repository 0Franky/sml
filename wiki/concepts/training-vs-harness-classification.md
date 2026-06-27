---
name: training-vs-harness-classification
description: PLAYBOOK + regola fondamentale per classificare ogni capacità del sistema sull'asse training(pesi) vs harness(wrapper) vs entrambi — categorie F-pi / F-serving / S / F+S, decision tree, "stato senza training", spec di training (regime+label+reward-outcome-anchored), anti-pattern. Principio cardine emerso 2026-06-27.
type: playbook
tags: [playbook, meta, skill-vs-feature, training, harness, wrapper, classification, reward-hacking, organization-first]
sources: [user msg 2026-06-27 (190/197/200/205), harness-feature-catalog §1/§2ter, reward-hacking-mitigation]
last_updated: 2026-06-27
status: draft v0 — pre review-loop
confidence: provisional
---

# Training-vs-Harness — Classificazione delle capacità (PLAYBOOK)

> **Regola fondamentale (sintesi)**: per OGNI capacità del sistema, PRIMA di costruirla/addestrarla, **classificala esplicitamente** sull'asse training(pesi)-vs-harness(wrapper) — `F-pi` / `F-serving` / `S` / `F+S` — dichiara lo **stato-senza-training**, e per la parte SKILL definisci **regime + label-generation + reward ancorato all'OUTCOME**. **Mai** presentare una `F+S` come feature consegnabile quando è *inerte senza training*.

## Catena why → problema → soluzione

- **Why** — ogni capacità può vivere nei **pesi** (skill addestrata), nel **wrapper** (feature/meccanismo), a livello **serving** (inference), o in **combinazione**.
- **Problema** — confonderli è il **rischio di design #1**. (i) Trattare come "feature consegnabile" una capacità il cui valore è gated su una skill non-addestrata → **guscio inerte** (il tool che il modello non sa quando usare; es. `compact_context` mai chiamato, low-confidence mai riconosciuta). (ii) Mettere a training qualcosa che la **sola feature deterministica** risolverebbe → spreco di dati/effort. (iii) Premiare la **cerimonia** (ho chiamato il tool / ho aggiunto una sezione) invece dell'outcome → participation-hack. Emerso ripetutamente (autocompact, section-boundary, low-confidence, situation-table, error-recovery).
- **Soluzione** — una **classificazione obbligatoria** a 4 categorie + decision tree + lo "stato senza training" + la spec di training, così che la natura di ogni capacità sia esplicita e nessun guscio-inerte venga scambiato per prodotto.

## Le 4 categorie

| Cat | Cos'è | Esempi | Stato senza training |
|---|---|---|---|
| **F-pi** (Feature-harness) | meccanismo deterministico via hook pi (`context`/`tool_call`/`tool_result`/...); nessun apprendimento del modello | context-assembly, secrets-scanner, pre-flight gate, lane/VARS storage, lora-router (`setModel`) | **PIENA** (giorno-1) |
| **F-serving** (Feature-serving) | meccanismo a livello inference/serving — NON un hook testuale pi, NON training dei pesi | steering vectors (estrazione contrastiva + applicazione), sampling/decoding control | meccanismo PIENO; la *policy di applicazione* può essere S |
| **S** (Skill) | comportamento nei pesi; il modello lo genera/decide nativamente; richiede training | generazione marker `[V]/[A]/[?]`, reasoning strutturato, metodo scientifico | **INERTE** senza training |
| **F+S** (Both — **categoria dominante**) | meccanismo wrapper **+** skill addestrata; il wrapper dà tool/struttura, il modello va addestrato a QUANDO/COME usarlo | autocompact (tool + when), section-boundary (mecc + interruption-robustness), low-confidence-gather (tool + when-to-stop), decision-lookahead (deferral + when-to-defer), situation-table (lane + situation-recognition), dependency-aware-error-recovery (dep-graph + traversal) | **INERTE** o **DEGRADATA-MA-UTILE** |

## Procedura di classificazione (decision tree)

1. **Q1 — Serve un MECCANISMO che il modello non può fare da solo?** (storage, scan, gate, tool, exec, dep-graph, controllo-inference) → serve **FEATURE**.
   - **Q1a** — è un hook testuale di pi? → **F-pi**. È inference-level (residual stream, sampling)? → **F-serving**.
2. **Q2 — Serve una DECISIONE/RICONOSCIMENTO/GENERAZIONE che il modello deve fare?** (quando agire, cosa riconoscere, come ragionare) → serve **SKILL** (training).
3. **Q3 — combinazione**: Q1 ∧ Q2 → **F+S**. Solo Q1 → **F**. Solo Q2 → **S**.
4. **Q4 (per la parte S) — spec di training**:
   - **Regime**: SFT-bootstrap del formato (Fase 2) → **RL-GRPO** per la calibrazione (Fase 3). Few-shot/prompt = baseline da battere, non soluzione.
   - **Label-generation** (il problema vero): sintetiche-by-construction / outcome-retrospettivo-bisect / sonde-held-out / EVPI / self-consistency-drop.
   - **Reward ancorato all'OUTCOME** (mai cerimonia/partecipazione → anti participation-hack; scorer ≠ scored). [[reward-hacking-mitigation]].
5. **Q5 — grada lo STATO SENZA TRAINING**: PIENA / DEGRADATA-MA-UTILE / INERTE. Se **INERTE** → NON spedire come feature di Fase-1; gate su training + **misura il gap del base-model** (come gate 0-A.4 del piano).
6. **Q6 — fallback deterministico?** Esiste un'euristica wrapper-side che rende la capacità **DEGRADATA-MA-UTILE** senza training? (es. soglia su `getContextUsage` per autocompact) → spedisci il **fallback-feature** in Fase-1, training della skill dopo.

## Anti-pattern (da evitare — e da flaggare in review)

- **Training travestito da feature**: presentare una `F+S` come feature consegnabile quando il valore è gated su skill non-addestrata (il guscio inerte). → il difetto che §2ter del catalog ha corretto.
- **Feature travestita da training**: mettere a training qualcosa che la sola feature deterministica risolverebbe (spreco). Es. mettere a training un check che un `git ls-files` deterministico risolve.
- **Reward sulla cerimonia**: premiare il gesto (chiamato il tool / aggiunto la sezione / dichiarato "uncertain") invece dell'esito verificabile.

## Relazione con la governance NetView (4-tier) `[INFERRED]`

La classificazione training-vs-harness è **ortogonale ma complementare** alla governance a 4-tier (CLAUDE.md-directive / situation-table / wiki-rule / **hook**) estratta da [[../_private/...|NetView]]: i loro **hook auto-enforced** ≈ la nostra categoria **F-pi deterministica** (Classe C guardrails, scorer≠scored); le loro **rule/directive** ≈ conoscenza che può diventare **S** (addestrata nei pesi) invece che lookup-prompt. La governance dice *dove vive una conoscenza*; questo playbook dice *se una capacità richiede pesi, wrapper, o entrambi*.

## Linked
- [[harness-feature-catalog]] §1 (tabella SKILL-vs-FEATURE) + §2ter (audit "inerte senza training")
- [[reward-hacking-mitigation]] (outcome-anchored, scorer≠scored, participation-hack)
- [[self-analysis-strategy-revision]], [[low-confidence-gather-and-reorg]], [[harness-capabilities-as-files]] (capacità F+S istanze)

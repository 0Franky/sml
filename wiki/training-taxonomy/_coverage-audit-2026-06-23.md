---
name: training-taxonomy-coverage-audit-2026-06-23
description: Audit di copertura della Training Taxonomy — gap vs documentazione (subagent), gap vs benchmark pubblici (analisi), + aggiunte da nuove note utente 2026-06-23. Sorgente delle aree 13-16 e dei gap-fill.
type: audit
tags: [training, taxonomy, audit, coverage, benchmarks, gaps]
last_updated: 2026-06-23
---

# Coverage Audit — 2026-06-23

Provenance delle aggiunte alla [[README|Training Taxonomy]]. Tre fonti: (A) audit subagent su tutta la doc, (B) analisi gap vs benchmark pubblici, (C) nuove note utente 2026-06-23.

## A — Gap vs documentazione (audit subagent, 38 concept + 6 ADR + architettura + research doc)

Gap principali (→ dove integrati):
1. **Update-injection handling** (priorità `<update from external>` mid-thinking) — paper-claim #1 → Area 4.
2. **Wait-vs-retry / timeout** su tool in-flight → Area 8.
3. **Multi-expert orchestration + cross-expert state handoff** — paper-claim #6 → Area 1 + Area 8.
4. **Routing-token emission** (`<load:...>`) → Area 8.
5. **Sketch/reply-shape + meta-state prediction** (MTP heads) → Area 10 (auxiliary heads).
6. **Plan-mode + plan validation/revision** → Area 1.
7. **Context/asset request** (`<context_request>`) → Area 8.
8. **Stale/TTL freshness + inconsistent-timestamp flagging** → Area 4.
9. **Self-detect contradiction nel proprio contesto** (skill, non solo wrapper) → Area 4.
10. **Regime-meta-awareness** (random-names = anti-pattern solo training) → Area 6.

Weakly-covered (espansi in sub-foglie): symbol-precision cross-tier + 4-strategy mix; needle 4 variazioni adversariali; dynamic-context 5 dimensioni; verify-loop nested+priority; secret partial/transformed/allowlist; refusal 3-part output + over-refusal metric; adaptive-depth meccanismo (self-assessment+length-head+steering+fallback).

Overlap / reward double-counting da sorvegliare: Area 2 (criticality/irreversible/pre-flight/consequence sono facce della stessa skill); lookahead (A2) vs informative-escalation (A9); trajectory-efficiency vs trajectory-critique (A8); degradation-awareness vs autocompact (A4).

## B — Gap vs benchmark pubblici (analisi; "sennò abbassiamo lo score")

| Benchmark | Skill richieste non coperte → aggiunta |
|---|---|
| **SWE-Bench Verified** | comprensione repo, fault-localization, issue-repro, test-exec&iterate, edit-format → **NEW Area 13** |
| **LiveCodeBench v6** | algorithm design, complexity, efficiency (no TLE) → **NEW Area 14** |
| **BigCodeBench** | complex/compositional instruction following → Area 15 |
| **Aider polyglot** | edit/diff-format precision, multi-lang → Area 13 |
| **τ-Bench / AgentBench** | policy/spec adherence, multi-turn state → **NEW Area 15** |
| **IFEval** | precise instruction following (vincoli verificabili) → Area 15/10 |
| **GSM8K / MATH** | math/numerical reasoning → Area 14 |
| **TruthfulQA / SimpleQA** | factual calibration / anti-hallucination → Area 15 |

## C — Nuove note utente 2026-06-23

- **Macro-curriculum 3 fasi**: (1) basi/teoria → (2) affinamento con esercizi compresi → (3) RL agentico con harness. Riaffermato → §metodologia.
- **"Il gioco" di auto-critica**: il modello dà valutazione critica + il PERCHÉ su codice/richiesta; comparata col **modello grande** che dà feedback → training signal. + produce-già-ottimizzato → **NEW Area 16 (Self-Evaluation & Critique)**.
- **Code economy / DRY**: "6 righe non 100 se bastano, ma stesso VALORE + stessa SICUREZZA + NO logica duplicata → verifica codebase PRIMA (specificarlo anche nel prompt)" → Area 6 (economy) + Area 13 (DRY/reuse-before-write). L'"hint nel prompt" = classe (1) con-hint.

## Esito
Tassonomia: 12 → **16 aree**. Aggiunte 4 nuove aree (13 SWE repo-level, 14 Algorithmic&Math, 15 Instruction-following&Interaction, 16 Self-Evaluation&Critique) + ~15 foglie nelle aree esistenti + Benchmark Coverage Matrix + note out-of-taxonomy (curiosity, steering).

## Addendum 2026-06-27 — Long-horizon come DIMENSIONE cross-cutting (domanda utente) `[da-formalizzare]`

Domanda utente: "stiamo mettendo la foglia long-horizon organization e long-horizon tasks per OGNI categoria?"

**Stato**: long-horizon **organization** c'è già (è l'**Area 1** *Organization & Long-Horizon Planning*: multi-day-continuity, goal-tracking, timeline-blocking, plan-mode/re-planning) + multi-day/long-context in **Area 4**. **NON** c'è un "long-horizon X" per ogni area.

**Reco (critica)**: NON duplicare una foglia "long-horizon" in ogni area (esploderebbe la taxonomy e doppio-conterebbe l'organization). Meglio trattare l'orizzonte temporale come **dimensione/regime CROSS-CUTTING ortogonale** (come la dynamic-context augmentation e il quality-tier): ogni skill (A5/A8/A13/…) viene esercitata sia **short-** sia **long-horizon**, soprattutto in **Fase 3 (RL agentico con harness)** dove le traiettorie sono lunghe per costruzione. La *skill* è l'area; l'*orizzonte* è un asse.

**Azione**: formalizzarlo come **3ª dimensione cross-cutting documentata** (accanto a dynamic-context e quality-tier) nel README — assegnare a ogni area un flag "long-horizon variant in Fase 3 sì/no" invece di nuove foglie. Da fare al ritorno sulla taxonomy.

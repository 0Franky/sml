---
name: data-volume-estimate
description: Stima del volume di dati di training foglia-per-foglia per le 16 aree della tassonomia. Framework di stima condiviso + rollup per area + totali (naive + de-duplicati) + registro overlap + dimensioni di costo (authoring/generazione/teacher/mining/RL) + staging MVP-v1 vs full. Output di fan-out 16 subagent + review loop.
type: estimate
tags: [training, dataset, data-volume, estimate, sft, rl, preference, mvp, planning]
sources: [fan-out 16 subagent 2026-06-26, area-NN-*.md, project decisions Tier1/Tier3 30K]
last_updated: 2026-06-26
status: v2 — post review-loop (5 reviewer agnostici+specializzati). I numeri grezzi v1 (§2) sono CORRETTI in §7.
confidence: provisional — v1 risultata sistematicamente ottimistica; v2 con bande oneste, da validare empiricamente
---

# Stima volume dati — foglia per foglia (16 aree)

> **Origine**: richiesta utente 2026-06-26 ("stimiamo quanti dati ci servono e che dovremmo produrre, foglia per foglia; poi review loop, con agenti agnostici e specializzati"). Prodotto via fan-out di 16 subagent (uno per area) su framework condiviso, poi review loop.
>
> ⚠️ **Natura della stima**: il sizing dati di training è **empirico e incerto**. Questi numeri sono **ordini di grandezza con assunzioni esplicite** (§1), NON precisione reale. Servono a dimensionare lo sforzo e a confrontare le aree, non come target rigidi. Da validare con ablation (`aris-experiment-plan`).

---

## 0. TL;DR (cifre CORRETTE dal review-loop — vedi §7.2)

> ⚠️ I numeri "naive" della v1 (§1-§6) erano **sistematicamente ottimistici** (base SFT troppo alte, augmentation sovra-contata, de-dup gonfiato). Questi sono i valori **corretti v2** con bande oneste (±~40%).

| Metrica | MVP-v1 (Wave 5) | Full (tutte le wave) |
|---|---|---|
| **SFT authoring** (base-corretta + dedup ~10%) | **~17–22K** | **~28–34K** |
| **Preference pairs** | ~2,3K | ~6,5K (150/L = floor) |
| **RL prompt-set authored** (verificabili; rollout = prompt×G) | ~1–3K | ~6–12K |
| **Eval/holdout** (decontaminato; mancava in v1) | ~1–2K | ~3–5K |
| **Augmentation** | knob robustezza **K~3–5** (NON volume sommabile) | K~3–5 |

**Feasibility** (reviewer budget): MVP-v1 SFT train ≈ **1–3 A100-day, <$200**; teacher-compute (DeepSeek) ≈ **$10–50**; A13 da **dataset SWE già pronti** (SWE-Gym/SWE-smith/R2E-Gym), ~$0 mining. **Il denaro NON è il vincolo all'MVP.** Vero collo di bottiglia: (1) harness pi + verifier/sandbox, (2) authoring umano delle classi WRONG/recovery + seed-L (~3–5K item curati), (3) decontamination.

**Insight chiave**: *#sample ≠ costo*. Il costo varia per area su dimensioni diverse (§5): generazione programmatica (~gratis), compute-teacher (cheap, ~$10-50), dataset pubblici (curation+decontam), compute-RL (l'unica voce a 4 cifre, ma quasi tutta Wave 6+), e — il vero scarso — **authoring umano + ingegneria harness**.

**Regola operativa**: generare al **20% del volume e scalare su ablation** (quality≫quantity, AlpaGasus), NON produrre tutto upfront.

---

## 1. Framework di stima (condiviso cross-area)

Unità = **#sample SFT** per (foglia × classe). Dati organizzati in **task families**: 1 task logico → le sue 5 classi.

**Base per-foglia (somma 5 classi), per tag:**
| Tag | Base SFT | Pref pairs | Razionale |
|---|---|---|---|
| **Q** (verificabile) | ~500 | 0 | generabile + auto-verifica → scala a basso costo (verifier deterministico) |
| **L** (judge/preference) | ~200 | ~150 | richiede teacher/judge → costoso, meno volume, segnale = preference |
| **Q+L** | ~400 | ~80 | nucleo Q + dimensione giudizio |

**Split per classe** (frazioni della base): WITH-hint **30%** (3 livelli forte/medio/debole) · WITHOUT-hint **30%** (target) · WRONG-awareness **15%** · WRONG-recovery **15%** · OTHER **10%**.

**Aggiustamenti** (applicati dai subagent dove pertinente):
- **MVP-v1 vs Full**: MVP-v1 = Tier 1 organization (Aree 1-4, 9, 15-16 core) + Tier 3 frontend coding (Aree 5-8, 13-14). Marcato per foglia.
- **dynamic-context = AUGMENTATION** (×K), non nuovo authoring: needle (4 rumori × posizioni), dynamic-context (5+ dimensioni), char-level, symbol-randomization → si moltiplicano programmaticamente sul #base.
- **Overlap → de-dup**: foglie che condividono skill vanno ridotte/segnalate (registro §4).
- **RL (GRPO)**: contabilizzato a parte come #prompt × rollout (foglie Q, fase 3), non sample statici.
- **Regime FISSO** (Area 12): split invertito (WITHOUT ~50%), volume = #fatti × ripetizioni, non base fissa.

---

## 2. Rollup per area

| # | Area | Tier | #foglie | SFT MVP-v1 | SFT full | Pref | RL (rollout) | Profilo costo dominante |
|---|---|---|---|---|---|---|---|---|
| 01 | Organization & Planning | T1 | 22 | 7.900 | 8.300 | 1.440 | ~2K prompt | authoring + teacher (L planning) |
| 02 | Criticality & Safety | T1 | 15 | 4.840 | 5.020 | 540 | ~12K | authoring (pool −35%) |
| 03 | Reasoning & Sci-Method | T1 | 8 | 2.200 | 3.100 | 450 | PRM-core | **teacher-compute alto** (CoT lunghe DeepSeek) |
| 04 | Context & Metacognition | T1/X | 9 | 1.400* | 3.420* | 360 | ~6K | **augmentation ×~6** (*authoring; effettivo ~14-15K) |
| 05 | Code Correctness | T2/T3 | 6 | 3.050 | 3.300–6.000 | 0 | ~16K | **compute exec** (sandbox), gen cheap |
| 06 | Code Quality & Arch | T2/T3 | 9 | 1.200–1.400 | 2.400 | 1.140 | basso | **teacher-judge** (L-pesante) |
| 07 | Security & Privacy | X | 5 | 730 | 2.440 | 150 | sì (binario) | gen + **red-team adversariale** |
| 08 | Tool Use & Agentic | X | 11 | 1.800 | 4.430 | 495 | ~18K | **compute-RL** (8/11 fase-3) |
| 09 | Communication & Deference | T1/X | 5 | 1.150 | 1.510 | 570 | gate-Q | **pref pairs** (anti-sycophancy) |
| 10 | Output Mechanics | X | 4 | 1.000 | 1.800 | — | basso | **gen ~gratis** + MTP heads (a parte) |
| 11 | Refusal & Scope | X | 3 | 1.530 | 1.530 | 220 | sì (binario) | gen + bilanciamento in/out 50/50 |
| 12 | Domain Knowledge (fisso) | X | 3 | 2.000–2.500 | 2.300–2.800 | — | no | **incrementale** (già in pretrain) |
| 13 | SWE Repo-level | T2/T3 | 8 | 700–900 | 2.000–2.400 | 130 | 6–12K | **MINING OSS reale** (collo di bottiglia) |
| 14 | Algorithmic & Math | T2/X | 5 | 1.800 (cur. 3.2-3.7K) | 7.000–9.500 | 160 | 24–56K | **dataset pubblici** (curation+decontam) |
| 15 | Instruction Following | X | 4 | 1.300 | 2.100 | 160 | ~5.7K | gen cheap (IFEval) + judge (2 foglie) |
| 16 | Self-Eval & Critique | T1/X | 6 | 425 | 1.905 | 690 | fase-3 | **compute-teacher** ("il gioco") |
| | **TOTALE (naive v1 — corretto in §7)** | | **123** | ~33,5K | ~55,6K | ~6,5K | ~70-110K | |

\* Area 04: i numeri sono **authoring**; il volume effettivo post-augmentation (needle ×12, dynamic ×15) è ~14-15K full.

---

## 3. Totali e reconciliation (⚠️ CORRETTI in §7 — qui i numeri v1 grezzi)

> I valori sotto sono la somma **grezza v1** (pre-correzione). Il review-loop (§7) li ha rivisti: full naive reale ~**55,6K** (non 58K); base SFT 2-5× troppo alte → authoring full corretto **~28-34K**; de-dup **~10%** (non 18%); augmentation = knob ×3-5 (non sample sommabili). Usa §0/§7.2 per le cifre operative.

- **SFT full naive (v1)** ≈ 55,6K midpoint (52,5–58,6K range). Overlap cross-area (§4).
- **SFT MVP-v1 naive (v1)** ≈ 33,5K.
- **Preference pairs** ≈ 6,5K full (~2,3K MVP-v1), concentrate in A6 (1.140), A16 (690), A9 (570), A1 (1.440).
- **RL** ≈ 70–110K rollout full (A14 24-56K, A8 18K, A5 16K, A13 6-12K…) — **compute-bound, non data-bound**; `rollout = prompt × G` (G=8-16 verificabile, 4-8 agentico) → prompt-set authored ~6-12K (§7.1.I).
- **Reconciliation con le decisioni esistenti** (Tier1 ~30K + Tier3 ~30K): ~~✅ coerente~~ → **DECLASSATA** (review-loop): il target 60K era reverse-engineered; la "coerenza" era confirmation bias. Onestamente: *due stime indipendenti danno O(10⁴), entrambe NON validate empiricamente*.

---

## 4. Registro overlap cross-area (anti double-counting) ⚠️

Il singolo fatto più importante per il budgeting: **la somma naive doppio-conta**. Overlap segnalati dai subagent:

| Overlap | Aree | Azione |
|---|---|---|
| no-introduced-bugs ↔ regression-avoidance | A5 ↔ A13 | dedup ~30% su A13; A5=function-level, A13=repo-level |
| DRY/reuse-before-write | A6 ↔ A13 | A6=intra-artefatto, A13=repo (grep-before-write); split netto |
| quality-target / scorecard | A1 ↔ A16 (↔ A6 prod-ready) | scorecard authored 1 volta; dedup ~40% (A16 −20%) |
| multi-expert (plan/handoff/verify) | A1 ↔ A8 ↔ A16 | pool multi-expert condiviso; **NON contare 3×** |
| lookahead / escalation / ask-vs-proceed | A2 ↔ A9 (↔ A8 asset-req) | deferenza condivisa; A9 pref −40% |
| trajectory eff/critique/consequence | A8 interno | triangolo metacognitivo, −30% L |
| criticality pool (crit/irrev/preflight/conseq) | A2 interno | scenari condivisi, −35% |
| capability-limit / recruit / anti-halluc | A11 ↔ A8 ↔ A15 (↔ A12) | "conosci i tuoi limiti" condiviso; A15 −15% |
| topic-classification ↔ routing-token | A11 ↔ A8 | stesso ground-truth, riusare |
| symbol-precision (variabile) ↔ domain-knowledge (fisso) | A5 ↔ A12 | regimi opposti; confine in OTHER (frizione = ablation) |
| self-testing ↔ verify-loop ↔ self-eval | A14 ↔ A3 ↔ A16 | meta-skill condivisa, −30% |
| code-efficiency ↔ performance/edge | A14 ↔ A5 | −20-30% |
| length-control ↔ output-length; MTP-sketch ↔ reply-shape | A10 ↔ A9/A8 | coordinare |
| scientific-method backbone | A3 → ovunque | NON ricontare "il metodo" in ogni area |
| degradation↔autocompact, temporal↔stale, update↔contradiction | A4 interno | −20% sulla foglia "derivata" |

**Effetto stimato**: de-dup cross-area ~**−18%** sul totale naive.

---

## 5. Dimensioni di costo (≠ #sample)

Il "che dovremmo produrre" dipende dal **come** si produce. 5 profili:

1. **Generazione programmatica (~gratis)**: A10 (char/length/format), A5 (test gen+exec), A11/A15 (IFEval-style verificabili). Collo di bottiglia = compute, non authoring.
2. **Compute-teacher (DeepSeek)**: A3 (CoT lunghe verificate), A16 ("il gioco" teacher-compared), A6 (judge L). Costo = #teacher-call, dominante anche con pochi sample.
3. **Dataset SWE già pronti** (A13): ⚠️ **CORRETTO in §7.1.G** — NON "mining da zero". Esistono gym con Docker eseguibile (SWE-Gym 2.4k, R2E-Gym 4.6k, SWE-rebench 21k, SWE-smith 50k, SWE-Lego 32k) → **subset-selection + decontamination + harness-wiring**, ~$0. NON è il collo di bottiglia.
4. **Dataset pubblici (curation+decontam)**: A14 (GSM8K/MATH/LiveCodeBench). Volume alto a costo basso, ma **rischio data-leakage** → decontamination obbligatoria.
5. **Authoring umano/seed**: le classi WRONG (awareness/recovery) e i seed L. Poche centinaia per area, ma qualitativamente critiche.

---

## 6. Staging (MVP-v1 vs wave)

- **MVP-v1 (Wave 5)**: ~28-30K SFT deduped (~40-45K effettivo). Tier 1 organization core (A1-4, A9 honest/critique/length, A15 IF/policy) + Tier 3 frontend coding (A5, A6 core, A7 secret/injection, A8 tool basics, A11, A12 API-frontend, A13 frontend-subset, A14 algo/efficiency). **Tractable** sul percorso 2080 Ti → cloud.
- **Wave 6+**: routing-token (A8), multi-expert (A1/A8/A16), "il gioco" (A16), math puro (A14), update-injection (A4), MTP heads (A10), secure-coding multi-dominio (A7).

---

## 7. Review loop — findings & stima corretta

Panel (2026-06-26): **2 reviewer agnostici** (consistenza-aritmetica, scettico-metodo) + **3 specializzati** (ML-data, budget/feasibility, overlap-auditor). Findings **convergenti**: la draft v1 era **sistematicamente ottimistica**.

### 7.1 Correzioni applicate

- **A — Aritmetica** `[MAJ]`: somma full reale = **~55,6K** midpoint (52,5 min / 58,6 max), non 58K. **#foglie = 123** (non 122, off-by-one). Pref = **~6,5K** (non 7K). False precision diffusa (cifre a 3-4 sig fig per stime "ordine di grandezza") → leggere come bande.
- **B — Base SFT 2-5× troppo alte** `[CRIT]` (ML-data + methodology + budget): Q~500/L~200 è eccessivo per skill **già nel pretrain** (la maggioranza: DRY, correctness, planning, refactoring). LIMA (~1K per alignment *intero*), AlpaGasus (9K filtrati > 52K), Tülu3: per skill nota l'SFT **elicita**, non insegna. → **~150-250/foglia (nota)**, **300-500 (nuova/comportamentale)**, **L 100-150 SFT**. Introdurre **fattore δ (novità/ampiezza) ∈ {0.5, 1.0, 2.0}** per foglia. Authoring full → **~30-38K** pre-dedup.
- **C — De-dup −18% gonfiato** `[CRIT]` (overlap-auditor): bottom-up rigoroso = **~10%** (8-12%). Causa: percentuali leaf-level applicate a interi-area + budget-preference sconfinato nell'SFT. **Falsi overlap (=0)**: DRY A6↔A13 (split netto), symbol↔domain (regimi opposti), scientific-method backbone (authored 1 sola volta). Overlap mancanti (A6↔A16, error-recovery↔verify-loop, asset-request↔ask-vs-proceed) aggiungono poco.
- **D — Augmentation ≠ sample effettivi** `[MAJ]` (ML-data + methodology): satura a **×2-3** (rendimenti log), non ×12-15. **NON sommare** nei "sample effettivi" (rimossi i 40-45K / 75-90K). È un **knob di robustezza K** con efficienza η~0.1-0.3, riga separata. Interagisce male col near-dup (un ×12 di un template è near-duplicato per costruzione).
- **E — Reconciliation circolare** `[MAJ]` (consistency + ML-data): il target 60K era **reverse-engineered**; il "✅" era confirmation bias → declassato (§3).
- **F — Dimensioni di QUALITÀ mancanti** `[CRIT]` (ML-data): aggiungere first-class — **decontamination cross-area** (vs TUTTI gli eval holdout: LiveCodeBench, SWE-Bench Lite, HumanEval, custom-criticality; non solo A14); **near-duplicate dedup** (MinHash/embedding); **eval/holdout split per-foglia** (~90/10 decontaminato — mancava del tutto); **distribuzione difficoltà** (richiesta dal curriculum staged); **replay-%** (non aggiunge authoring ma cambia gli step di training); **yield** (sample tenuti/prodotti 0.3-0.7 per teacher/mining → `n_da_produrre = n_target / yield`).
- **G — A13 NON è il collo di bottiglia** `[CRIT]` (budget): esistono già dataset SWE con **Docker eseguibile pronti** — **SWE-Gym (2.4k), R2E-Gym (4.6k), SWE-rebench (21k), SWE-smith (50k), SWE-Lego (32k)**. Si fa **subset-selection + decontamination + harness-wiring**, NON si "minano 600-900 istanze da zero". Il framing v1 (§5 dim.3) era sbagliato di un ordine di grandezza in difficoltà.
- **H — Teacher-compute è economico** `[MAJ]` (budget): A3+A16+A6 ≈ ~10-20M token output → **~$10-50** totali (DeepSeek). Il vincolo lì è la **pipeline di verifica** (ingegneria: distillare solo CoT execution-verified, D2), non i $.
- **I — RL accounting** `[MAJ]` (ML-data): separare rollout (compute) da data **è corretto**, MA specificare **G** (GRPO group size); aggiungere riga **"RL prompt-set authored" (~6-12K prompt verificabili full)** al data budget; "rollout" è ambiguo (prompt vs completion) → chiarito: `rollout = prompt × G`.

### 7.2 Stima corretta (bande oneste, ±~40%)

| Metrica | MVP-v1 | Full |
|---|---|---|
| **SFT authoring** (base-corretta δ + dedup ~10%) | **~17–22K** | **~28–34K** |
| **Preference pairs** | ~2,3K | ~6,5K — 150/L è un **floor**; 300-500 per assi critici / se serve un Reward Model separato |
| **RL prompt-set authored** (verificabile) | ~1–3K | ~6–12K — `rollout = prompt × G`; quasi tutto Wave 6+ |
| **Eval/holdout** (decontaminato) | ~1–2K | ~3–5K — *mancava in v1* |
| **Augmentation** | knob K~3–5 (robustezza, non volume) | K~3–5 |

**Feasibility**: MVP-v1 SFT train ≈ **1–3 A100-day, <$200**; teacher ≈ $10–50; A13 da gym esistenti (~$0). **Collo di bottiglia (in ordine)**: (1) **harness pi + verifier/sandbox** (settimane di systems-work, gate di tutto il Phase-3); (2) **authoring umano** WRONG-recovery + seed-L (~3–5K item curati, non generabili); (3) **decontamination**. Il denaro NON è il vincolo all'MVP. RL-compute (70-110K rollout) è l'unica voce a 4 cifre ma è **già rimandata a Wave 6+**.

### 7.3 Stato del loop
I 5 reviewer hanno **convergito** (stessa direzione: ottimismo sistematico) → v2 incorpora le correzioni. Il prossimo "loop" utile **non** è un altro panel LLM (confermerebbe soltanto) ma la **validazione empirica**: ablation sample→performance su 2-3 foglie-pilota per calibrare le base δ. Raccomandazione unanime: **quality≫quantity, generare al 20% e scalare su evidenza**.

### 7.4 Sources del review-loop
- LIMA (Zhou 2023): https://arxiv.org/abs/2305.11206 · AlpaGasus (Chen 2023): https://arxiv.org/abs/2307.08701
- SWE-Gym: https://github.com/SWE-Gym/SWE-Gym · SWE-smith: https://github.com/SWE-bench/SWE-smith · DeepSeek pricing: https://api-docs.deepseek.com/quick_start/pricing

---

## 8. Caveat e open questions

- Le base (Q~500/L~200) sono `[INFERRED]` da prassi SFT + LIMA-style; **da calibrare empiricamente** (forse troppo alte per skill narrow, forse troppo basse per robustezza dynamic-context).
- Il de-dup −18% è una stima; il valore reale dipende da come si assembla il dataset (pool condivisi vs dataset disgiunti).
- Augmentation factor (×K) assunto; l'efficacia reale dell'augmentation va validata (un sample augmentato ≠ un sample nuovo in valore informativo).
- RL rollout: compute-bound; il numero dipende dal budget GPU, non dal data-authoring.

## Sources
- Fan-out 16 subagent (2026-06-26) su `area-NN-*.md`.
- Decisioni progetto: Tier1 ~30K / Tier3 ~30K (memory `project_vertical_granularity`, `project_replay_strategy`).
- Collega: [[README]], [[_coverage-audit-2026-06-23]], [[../concepts/pipeline-architecture-data-generation]], [[../concepts/scientific-method-operating-protocol]] (D2 teacher), [[../concepts/reward-hacking-mitigation]].

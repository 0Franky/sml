---
name: training-curriculum-design
description: Design del curriculum di training del three-tier (stadi, ordine, dati per stadio, reward per stadio) — risposta alla domanda utente sui "round" (msg 245). Validato contro NVIDIA Nemotron (Llama-Nemotron/Nano2/Nemotron-3) + la nostra staged-curriculum + lo shortlist dataset commercial-clean. Verdetto: ipotesi a round CONFERMATA con 3 correzioni + 1 aggiunta.
type: training-design
tags: [training, curriculum, sft, rl, grpo, rlvr, nemotron, three-tier, dataset, commercial-clean]
sources: [user msg 2026-06-28 (245), research-agent Nemotron (arXiv 2505.00949/2508.14444/2512.20856), staged-curriculum-training, data-volume-estimate, 2026-06-28-open-decisions-briefing]
last_updated: 2026-06-28
status: draft v0 — design da discutere con l'utente
confidence: provisional
---

# Curriculum di training & training-set — Design

> Risponde a: *"come il modello imparerà? Round1 constitution+logica+anti-leak+teoria-coding → Round2 +teoria-architetturale → Round3 RL (minimo coding-base poi sperimentazione). Ha senso? Conviene? Qual è il modo migliore?"* (utente msg 245). Validato contro **NVIDIA Nemotron** (ricerca dedicata) + la nostra [[staged-curriculum-training]] + lo shortlist dataset commercial-clean ([[../decisions/2026-06-28-open-decisions-briefing]] Parte 3).

## 0. Punto di partenza (già deciso)
Three-tier (Tier 1 orchestratore full-FT + Tier 2/3 LoRA coding) · **NO pretraining** (partiamo da Qwen3-4B, commercial-clean) · north-star commerciale · marker `[V]/[A]/[?]` · LoRA init B=0 + MiLoRA-ablation + 10% replay (D1) · giudice DSv4 (D5).

## 1. La tua ipotesi a round → il verdetto

**Verdetto: la tua ipotesi è CORRETTA nell'ossatura** (teoria in SFT prima, RL dopo) — è *esattamente* l'ordine di tutte e 4 le generazioni Nemotron e di tutta la SOTA. La logica è il loro why→problema→soluzione esplicito: *"l'SFT plafona al teacher; solo l'RL su reward verificabili lo supera"*. Con **3 correzioni** + **1 aggiunta**:

- ⚠️ **Correzione 1 — l'alignment di "preferenza" va ULTIMO e CORTO, non mischiato presto.** NVIDIA mette il preference-tuning (tono/helpfulness) come stadio finale breve *perché altrimenti erode il reasoning*. → La **constitution-come-regole** (anti-leak, safety hard, criticality) sta bene **presto** (Round 1); la **constitution-come-preferenza** (tono, deference, stile) va spostata **in coda**.
- ⚠️ **Correzione 2 — l'RL ha bisogno di un curriculum di difficoltà ESPLICITO**, non "sperimentazione emergente". Il contributo chiave di Nemotron è il **pass-rate curriculum**: generi N risposte con un modello piccolo, **scarti i task troppo facili** (pass-rate ≥0.75), ordini **easy→hard**. Senza, l'RL su task troppo duri **destabilizza** (lo provano con ablation). → Il tuo Round 3 deve *esplicitare come ordina* i task.
- ⚠️ **Correzione 3 — "minimo coding-base poi RL" è rischioso se il coding-base è troppo minimo.** Ablation Nemotron (25k→736k sample coding SFT): **miglioramento continuo, nessun plateau**. *"L'RL amplifica capacità esistenti, non le crea da zero."* → il LoRA coding (Tier 2/3) va alimentato con **SFT sufficiente** (non "minimo") *prima* dell'RL. Il tuo split Tier1-full-FT / Tier2-3-LoRA è giusto, ma il coding-SFT non va sotto-dimensionato.
- ➕ **Aggiunta — toggle "reasoning on/off" + merge finale.** Nemotron addestra il modello a ragionare in modo profondo *o* rispondere rapido (dati **paired** stesso-prompt-on/off in SFT + format-reward in RL), e poi **fonde** (merge, α≈0.5) un checkpoint reasoning-forte con uno chat-forte. Per un orchestratore org-first che deve alternare ragionamento profondo e risposte rapide, **entrambi sono barati e ad alto valore** → aggiungerli.

## 2. Il curriculum raccomandato (stadi · ordine · dati · reward)

> Pattern SOTA confermato: **SFT (installa comportamento/teoria) → RL su verificabili (supera il teacher) → preference corto (in coda) → merge**.

| Stadio | Cosa (tuo round ↔) | Dati (commercial-clean) | Reward / metodo |
|---|---|---|---|
| **0 — Base** | — | Qwen3-4B (no pretrain) | — |
| **1 — SFT "scuola" Tier 1** (full-FT) ↔ Round 1+2 | soul/constitution-**regole** (anti-leak, safety, criticality) · logica/metodo-scientifico · marker `[V][A][?]` · **teoria** coding + **teoria architetturale** · instruction-following base · structured-thinking · **dati paired reasoning-on/off** | OASST/Dolly/FLAN (umano) · reasoning R1-derived (OpenR1/OpenCodeReasoning, *caveat provenance*) · constitution/soul **autorati da noi** · Aegis (safety) · IFEval-like/RLVR-IFeval | SFT + rejection-sampling; **on-policy distillation** come cold-start; calibration-reward (anti GRPO-overconfidence) |
| **2 — SFT coding Tier 2/3** (LoRA) ↔ Round 2 (parte coding) | coding-base **robusto** (non "minimo") · strutture dei linguaggi · framework verticali (frontend) · pattern · DRY/code-economy | **OpenCodeInstruct** (Qwen-gen, clean) · StarCoderData (GPL-filtered) per grounding · opc-sft `educational`+`package` | SFT; LoRA init B=0/MiLoRA (D1) |
| **3 — RL agentico** ↔ Round 3 (il cuore) | "le reali sperimentazioni" · problem-solving · tool-use · criticality-in-azione · long-horizon | **execution-gym AMBIENTI** (SWE-Gym/R2E-env/SWE-smith-tasks — generiamo le NOSTRE trajectory) · RLVR-IFeval · math-verify | **GRPO + reward VERIFICABILI** (test-exec binary / ground-truth / rule-based IF) · **curriculum pass-rate easy→hard** (corr.2) · **inoculation prompting** (anti-hack) · format-reward sui marker |
| **4 — Preference/alignment** (CORTO, ULTIMO) ↔ (spostato da Round1) | tono · helpfulness · deference · constitution-**preferenza** | **HelpSteer3** (CC-BY puro) | RLOO/GRPO su reward-model piccolo (NO reward-model 235B); breve (corr.1) |
| **5 — Merge** (opzionale) | risolve trade-off reasoning↔chat | — | interpolazione checkpoint α≈0.5 |
| **Trasversale** | decontaminazione vs benchmark (LiveCodeBench/SWE-Bench) · provenance-manifest · observability (NaN/KL) | — | embedding-similarity decontam |

## 3. Risposta alle tue domande specifiche

- **"No training su codici già fatti?"** → distinzione fine: **SFT su coding-base SÌ serve** (e robusto, non minimo — corr.3: l'RL amplifica, non crea). Ma *memorizzare soluzioni di benchmark* NO → **decontaminazione** obbligatoria + non overfittare su soluzioni note. Il punto giusto: l'**SFT** insegna teoria + strutture-dei-linguaggi + pattern; l'**RL** fa la *sperimentazione/problem-solving reale* su task verificabili (eseguibili). Quindi: introdurre teoria coding/architetturale nei round SFT (come dici) **sì**, e le sperimentazioni via RL **sì** — ma il coding-base SFT va **sufficiente**, non "al minimo".
- **"Ha senso? Conviene? Miglior modo?"** → **Sì, ha pienamente senso ed è il modo SOTA.** Il pattern "teoria in SFT → sperimentazione in RL-verificabile" è *esattamente* NVIDIA Nemotron + DeepSeek-R1 + tutta la letteratura 2024-2026. Le 3 correzioni sopra lo rendono "il migliore" invece che "buono".

## 4. Mappa training-set → stadio (dalla shortlist commercial-clean)

Vedi [[provenance-manifest]] per dataset→teacher→licenza→verdetto. Sintesi:
- **Tier 1 SFT** (stadio 1): umano (OASST/Dolly/FLAN) + reasoning R1 + HelpSteer3 + Aegis + IFEval-like + **constitution/soul autorati**.
- **Tier 2/3 coding SFT** (stadio 2): OpenCodeInstruct + StarCoderData-GPL-filtered + opc-sft-puliti.
- **RL** (stadio 3): execution-gym **ambienti** (non trajectory) + RLVR-IFeval + math-verify.
- **Preference** (stadio 4): HelpSteer3.
- ⚠️ **Caveat provenance** (corr. da Nemotron): i dataset reasoning R1-derived (OpenCodeReasoning/OpenMath) sono *tecnicamente* CC-BY ma **distillati da DeepSeek-R1/Qwen** → per il north-star commerciale, DeepSeek-R1 permette esplicitamente la distillazione (ok), ma va messo nel manifest e verificato a monte. Per il 100%-pulito assoluto: teacher con licenza-output esplicitamente permissiva + human-annotated + RLVR.

## 5. La mia reco

**Adotta il curriculum a 5 stadi sopra** (la tua ipotesi a round + le 3 correzioni + toggle/merge). È SOTA, commercial-clean, e dimensionato al nostro budget (l'RL nostro = poche centinaia/migliaia di GPU-hours, NON le 140k H100-h di Nemotron-Ultra: 2-4 environment verificabili bastano per l'MVP, non 21). **Cosa NON prendere da Nemotron**: pretraining-from-scratch, NAS/Minitron-pruning (partiamo già piccoli), MoE/NVFP4, reward-model 235B, RL-21-environment.

## 6. Verifica & decisioni aperte (review-loop 6 agenti, 2026-06-28)

> Review-loop: 5 specialisti per-stadio + 1 agnostico. I design dettagliati per-stadio sono in [[curriculum-stages-detail]]. Qui la **mia verifica** (cross-check di coerenza) + i **gap load-bearing** scovati dall'agnostico + le **decisioni aperte** che ne derivano.

### 6.1 Verifica di coerenza (mia, sui 5 stage-agent) `[verificato]`
I 5 design sono **coerenti** tra loro e con i nostri doc (volumi ~14-18K St.1 / ~20-25K St.2 / RL prompt-set 1-3K MVP / preference ~2.3K — allineati a `data-volume-estimate`). Convergenza su: SFT-teoria→RL-verificabile→preference-corto→merge; reward outcome-anchored; GRPO+Dr.GRPO+clip-higher (no GRPO-vanilla); calibration-reward (RLCR) come vincolo (anti GRPO-overconfidence); DPO (non RLOO-su-RM) per la preference a budget basso; decontaminazione 3-stadi (n-gram→MinHash→embedding+judge). **Caveat ricorrente confermato da 2 fonti indipendenti**: il full-FT del Tier 1 **non sta** sul 2080Ti.

### 6.2 ⭐ Tabella pesi-per-stadio (risolve il gap di componibilità — agnostico #1/#2) `[INFERRED, da confermare]`
Il gap più grave: il curriculum lasciava implicito *su quale base* vivono le LoRA e *cosa si aggiorna* a ogni stadio. Risoluzione:

| Stadio | Base di partenza | Trainable | Frozen | Output |
|---|---|---|---|---|
| **1 — SFT Tier1** | Qwen3-4B vergine | tutti i pesi (full-FT o QLoRA) | — | Tier1 cold-start (org) |
| **1-RL — RL Tier1** | Tier1 post-SFT | **i pesi del Tier1** (metodi organizzativi: planning/criticality/safety *in azione*) | — | **Tier1 performante** → poi **CONGELATO** |
| **2 — SFT coding** | Tier1 (CONGELATO) | LoRA (Tier 2/3) | Tier1 | Tier1 + LoRA-coding (compongono ✓) |
| **3 — RL coding** | Tier1-frozen + LoRA | **solo la LoRA** | Tier1 | LoRA coding specializzata |
| **4 — Preference** | Tier1/composto | breve (Tier1 o LoRA-pref) | — | allineato |
| **5 — Merge** | checkpoint reasoning+chat | interpolazione α | — | merged |

> **Punto chiave (corretto, utente msg 266)**: **DUE fasi RL** — prima sul **Tier1** (l'SFT da solo NON basta a renderlo performante; l'RL gli fa sviluppare *come/quando* usare i metodi organizzativi), poi sulle **LoRA** (specializzazione coding). Il Tier1 si **congela DOPO il suo RL**; l'RL coding aggiorna **solo le LoRA**, che vivono sopra il Tier1-frozen → si compongono al runtime. ⚠️ Implicazione budget: l'RL-Tier1 è un costo aggiuntivo (RL = voce a 4 cifre) — pesa sulla decisione hardware §6.5.b.

### 6.3 Budget onesto (agnostico — corregge l'ottimismo) `[EXTRACTED]`
- **Il full-FT Tier1 (4B) richiede A100 cloud** (~60-80GB tra pesi+grad+optimizer-states+attivazioni con ZeRO/offload), **NON** il 2080Ti. Il 2080Ti serve per walking-skeleton/serving + QLoRA-coding (Stadio 2), non per lo Stadio 1.
- Il **"<$200"** di `data-volume-estimate` è **SFT-only, best-case, single-run**. Realistico: + **fattore-iterazione 5-10×** (un curriculum a 5 stadi non si azzecca al 1° run) → **~$1-3K** per il curriculum completo; l'**RL (Stadio 3) è la voce a 4 cifre**, già rimandata a Wave 6+.
- **Implicazione onesta**: l'**MVP-v1 economico è SFT-only**; la tesi "org-first batte i più grandi sul coding **agentico governato**" (che è agentica = RL) **non è pienamente dimostrabile nell'MVP<$200** → va dichiarato. Alternativa per abbassare il costo Tier1: valutare **QLoRA anche per il "full"-FT Tier1** (invece del full-FT puro) — ablation.

### 6.4 5 stadi = PRODOTTO FINALE · MVP = sottoinsieme di validazione (utente msg 262) `[reco]`
Il curriculum a 5 stadi va fatto **TUTTO per il prodotto finale**. L'**MVP** = sottoinsieme delle fasi a **maggior valore** che ci dicono *"la strada è giusta"* (allinea a `project_mvp_scope`: Mini Three-Tier, Tier1-mini + 1 LoRA frontend):
- **TIENI nell'MVP**: Stadio 1 **ridotto** (regole-hard anti-leak/safety + marker + logica; soul/constitution completa → prodotto) · Stadio 2 (**1 LoRA frontend**) · **smoke-test componibilità** · **uno slice di Stadio 3 RL (1 environment)** — la tesi è "coding **agentico GOVERNATO**", senza un minimo di RL non la validiamo.
- **TAGLIA dall'MVP** (→ prodotto/Wave 6+): Stadio 5 **merge**, **toggle reasoning-on/off**, **multi-environment RL** (>1 env), Stadio 3 RL completo, Stadio 4 preference, authoring constitution/soul completo.

### 6.5 Decisioni aperte scaturite (→ `wiki/todo.md`)
1. ✅ **CHIARITO (utente msg 262/266)**: flusso = **Tier1 [SFT → RL] → FREEZE → LoRA [SFT → RL]**. RL **sia sul Tier1** (sviluppa i metodi organizzativi — l'SFT da solo non basta), **sia sulle LoRA** (coding). Tier1 si congela **dopo** il suo RL; l'RL coding aggiorna **solo le LoRA**. **Reco LoRA-size APPROVATA** (utente msg 266): il rank fissa il *tetto* della divergenza dal Tier1 (la divergenza reale la controllano data/replay/init-MiLoRA/DoRA); a inferenza l'output è (Tier1+LoRA) → un LoRA troppo grande può "coprire" il Tier1 senza toccarne i pesi. → rank **MINIMO** che centra il target coding tenendo alta la **ritenzione-Tier1**; start **r=64**, **ablazione r∈{32,64,128}** (= smoke-test §6.5.5). + **valutare tipi/config di LoRA diversi per i verticali Tier2/3** (rank/init/PEFT-variant per dominio, se sensato — ablation).
2. **Hardware/budget Tier1**: **QLoRA-Tier1** (base 4-bit ~2GB + LoRA → ~6-8GB) addestra **anche il Tier1 in locale/cheap** (reshaping meno profondo) — ottimo per l'MVP; **full-FT-Tier1** (max qualità org-first) = A100 cloud (pochi $) per il prodotto. NB: gli **80GB** del full-FT sono la macchina (optimizer-states+grad+master-fp32), NON il modello (~8GB). → ablation + scelta MVP-vs-prodotto.
3. **Tokenizer/special-token init** (già D2) — confermato necessario in setup.
4. **Eval-protocol statistico + baseline-competitor**: contro CHI dimostriamo "batte i più grandi"? (Qwen3-4B vergine + ≥1 modello più grande), n-seed, CI.
5. **Smoke-test componibilità three-tier = priorità #1 de-risking** (Tier1-mini-FT + 1 LoRA: il composto degrada Tier1 o coding vs standalone?). **Prima** dell'authoring dati su larga scala.

### 6.6 Reward-hacking watch (agnostico) — gap da chiudere nelle foglie
- **Stadio 3 test-exec** (il più esposto): test **read-only / ripristinati da golden baseline** + mutation/causality-check (revert-fix→test-rossi) + held-out test non-visibili.
- **Format-reward marker** (catena-fantasma): premiare solo `[V]`↔artefatto-reale-nel-trace, mai la forma (XGrammar garantisce già la sintassi).
- **Stadio 4 preference** (sycophancy): anti-sycophancy pairs + length-penalty + judge anti-bias.
- Regola: phase-reward/twin-pair/RH-monitor **gate dietro ablation**, mai tutti dal giorno zero.

### 6.7 Anti-forgetting gate (gap agnostico — da aggiungere) `[reco]`
Tra Stadio 2 e dopo Stadio 3: **eval di non-regressione BLOCCANTE** della suite Tier1 (safety/criticality/planning + HumanEval/MMLU per il base) prima/dopo → fail se scende oltre soglia (es. >3-5pt) → aumenta replay/MiLoRA. Il 10% replay da solo è mitigazione debole non calibrata.

## Linked
- [[curriculum-stages-detail]] (i 5 design dettagliati per-stadio + piano dataset/decontaminazione) · [[staged-curriculum-training]] (la nostra curriculum 4-stage originale — questo la raffina con Nemotron) · [[data-volume-estimate]] (volumi) · [[provenance-manifest]] (dataset/licenze)
- [[../decisions/2026-06-28-decisions-d1-d5]] (D1/D5) · [[../decisions/2026-06-28-open-decisions-briefing]] Parte 3 · [[../sota-techniques-catalog]] (Dim-2 training, Dim-7 dati)
- [[../concepts/reward-hacking-mitigation]] (inoculation + curriculum + scorer≠scored) · [[../concepts/lora-initialization-strategy]]

> **Next**: discutere il design con l'utente ("capiamo bene insieme"); poi dettagliare per-stadio (volumi, mix, schedule). Tracciato in `wiki/todo.md`. Ref Nemotron da confermare: 2505.00949 / 2508.14444 / 2512.20856.

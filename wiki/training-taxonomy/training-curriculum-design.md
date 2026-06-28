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

## Linked
- [[staged-curriculum-training]] (la nostra curriculum 4-stage originale — questo la raffina con Nemotron) · [[data-volume-estimate]] (volumi) · [[provenance-manifest]] (dataset/licenze)
- [[../decisions/2026-06-28-decisions-d1-d5]] (D1/D5) · [[../decisions/2026-06-28-open-decisions-briefing]] Parte 3 · [[../sota-techniques-catalog]] (Dim-2 training, Dim-7 dati)
- [[../concepts/reward-hacking-mitigation]] (inoculation + curriculum + scorer≠scored) · [[../concepts/lora-initialization-strategy]]

> **Next**: discutere il design con l'utente ("capiamo bene insieme"); poi dettagliare per-stadio (volumi, mix, schedule). Tracciato in `wiki/todo.md`. Ref Nemotron da confermare: 2505.00949 / 2508.14444 / 2512.20856.

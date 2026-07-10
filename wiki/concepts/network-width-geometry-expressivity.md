---
name: network-width-geometry-expressivity
description: Come la GEOMETRIA di una rete (profilo di larghezza dei layer, a profondità fissa) ne influenza l'espressività/capacità. Due principi — pavimento-del-bottleneck (min-width) e premio-alla-larghezza-precoce (early-width) — con citazioni. Risposta alla domanda utente msg 1549 (uniforme vs sawtooth-su vs sawtooth-giù). Rilevante per il from-scratch SLM.
type: concept
tags: [architecture, expressivity, width-profile, network-geometry, linear-regions, universal-approximation, bottleneck, from-scratch-slm, reference]
last_updated: 2026-07-10
sources:
  - "Serra et al. 2018, Bounding and Counting Linear Regions of Deep NNs (ICML) — arXiv:1711.02114"
  - "Montúfar et al. 2014, On the Number of Linear Regions of Deep NNs (NeurIPS)"
  - "Park et al. 2021, Minimum Width for Universal Approximation (ICLR) — arXiv:2006.08859"
  - "Golubeva, Neyshabur, Gur-Ari 2021, Are Wider Nets Better Given the Same #Params? (ICLR) — arXiv:2010.14495"
  - "Verbockhaven et al. 2024, Growing Tiny Networks — arXiv:2405.19816"
  - "Agrawal et al. 2020, Wide NNs with Bottlenecks are Deep GPs — arXiv:2001.00921"
---

# Geometria della rete (profilo di larghezza) → espressività/capacità

> **Origine**: domanda utente msg 1549 (2026-07-10) — *"cosa succede con reti a stessa profondità ma profilo di larghezza diverso: uniforme (8×n) vs sawtooth-su (8,12,16,…) vs sawtooth-giù (16,12,8,…)?"*. Il caso è un **MLP ReLU** → la teoria si applica direttamente. Rilevante per [[project_from_scratch_slm_future]] (progettare un LM da zero).

## Due principi che governano tutto `[EXTRACTED]`

### ① Pavimento del bottleneck — la larghezza MINIMA domina
Il layer più stretto è il "collo" attraverso cui **tutta** l'informazione passa compressa. Per una rete ReLU l'universal-approximation richiede che **ogni** layer abbia larghezza ≥ `max(d_input+1, d_output)` (**Park et al. 2021**, ICLR, arXiv:2006.08859; bound iniziali **Lu et al. 2017**, **Hanin-Sellke 2017**). Sotto ~`d_input+1`, l'informazione persa in quel layer è **IRRECUPERABILE** a valle — nessun layer largo successivo la recupera. Un net con bottleneck cambia anche la *classe di funzione* (behaves come un **deep** Gaussian Process composto, non un singolo GP largo — **Agrawal et al. 2020**, arXiv:2001.00921).

### ② Premio alla larghezza PRECOCE — a parità di larghezze, l'ORDINE conta `[EXTRACTED]`
Misura di espressività ReLU = **numero di regioni lineari** (**Montúfar et al. 2014**; **Serra et al. 2018**, ICML, arXiv:1711.02114): polinomiale nella larghezza, **esponenziale nella profondità**. Risultato-chiave di Serra: **ridurre la larghezza di un layer PRECOCE rende le regioni lineari irrecuperabilmente più piccole in tutto il resto della rete** → *"spostare un neurone da un layer tardivo a uno precoce aumenta (strettamente) il bound di espressività"*. I neuroni **valgono di più all'inizio**. (Bound: con `p=⌊w/d_input⌋`, max regioni ≳ `p^{d_input·(L-1)}` → il floor per-layer `⌊w/d_input⌋` è schiacciato dai layer stretti, e i primi contano di più.)

## Verdetto sui 3 profili (stessa profondità)

| Profilo | Espressività (stesso budget) | Perché |
|---|---|---|
| **Uniforme** 8,8,8,8,8,8 | baseline | capacità-canale costante = 8; nessun bottleneck peggiore. **PRO ottimizzazione**: dim costanti → **residual/skip GRATIS** (identità pulita), training stabile in profondità. **CONTRO**: tetto = 8. Default sicuro. |
| **Sawtooth-SU** 8,12,16,8,12,16 | **PEGGIORE** | il layer-8 sta **subito dopo l'input** → bottleneck precoce → taglia irrecuperabilmente le regioni a valle (Serra). Ogni periodo comprimi(8)→espandi(16) = spreca l'input prima di espanderlo. Utile SOLO se serve un'espansione finale tipo **decoder/generazione**. |
| **Sawtooth-GIÙ** 16,12,8,16,12,8 | **MIGLIORE** (stesso multiset della SU) | il 16 è **per primo** → espande presto (più folding), poi distilla. Forma **imbuto/piramide** dei classificatori MLP / encoder CNN (largo→stretto→astratto) = compressione progressiva verso la rappresentazione task-rilevante (≈ information-bottleneck di Tishby). Ogni periodo = mini-encoder. |

**Ordine espressività, stesso budget**: **GIÙ ≳ UNIFORME ≳ SU**.

## Caveat che dominano `[INFERRED da bound + pratica]`
- **Il pavimento vince sull'ordine**: se `d_input > 7`, tutti e tre strozzano ai layer-8 e la differenza d'ordine è secondaria → **prima** assicura `min-width ≥ d_input+1`.
- **Ottimizzazione ≠ espressività**: l'uniforme è la più residual-friendly; le varianti richiedono proiezioni per gli skip. La miglior-espressività-su-carta (GIÙ) può essere più ostica da allenare.
- **A parità di #parametri, più larghezza TOTALE aiuta** (**Golubeva et al. 2021**, arXiv:2010.14495): SU e GIÙ hanno lo stesso totale → è il **profilo/ordine** a decidere, a favore di GIÙ (larghezza precoce).
- **Instanza pratica moderna**: nei transformer il motivo vincente è già nel blocco — il **FFN espande-poi-comprime** (4× e ritorno) = "diamante" per blocco → conferma empirica del "espandi-poi-distilla". Il **bottleneck-rank** di Jacot (feature a basso rango indotte da layer stretti) è la lettura feature-learning dello stesso fenomeno.

## TL;DR
Metti la **larghezza PRESTO**. A parità di budget: **imbuto (GIÙ) > uniforme > imbuto-inverso (SU)**. Ma **prima di tutto** tieni il layer più stretto ≥ `d_input+1`, altrimenti perdi informazione per sempre (il pavimento domina l'ordine).

## Links
[[project_from_scratch_slm_future]] · [[catastrophic-forgetting]] · [[training-intelligence-optimization]] · [[../entities/base-model-candidates-2026-07]]

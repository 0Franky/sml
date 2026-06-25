---
name: steering-vectors
description: Esplorazione di activation steering / representation engineering per il progetto SLM. Cosa sono, tecniche di estrazione, 8 aree di applicazione mappate sul progetto, le 3 più promettenti, tradeoff vs LoRA, rischi. Da nota utente 2026-06-23.
type: concept
tags: [steering-vectors, activation-steering, representation-engineering, inference-time-control, reasoning-control, safety, exploratory]
last_updated: 2026-06-23
status: exploratory — esplosione concetto su richiesta utente, da prioritizzare in Wave
confidence: provisional
---

# Steering Vectors (Activation Steering / Representation Engineering)

> **Origine**: [[_user-notes-2026-06-23]] nota 1. Richiesta utente: "esplodiamo il concetto e analizziamo tutte le possibili aree di applicazione, capiamo quelle più promettenti".

## 1. Cosa sono

Uno **steering vector** è una direzione nello spazio delle attivazioni (residual stream) che, **aggiunta** alle attivazioni a uno o più layer durante l'inference, **sposta il comportamento** del modello lungo un asse semantico (es. più cauto, più verboso, più onesto, più "dominio X") — **senza modificare i pesi** e **senza training di pesi**.

Formula base (per layer ℓ, coefficiente α):
```
h'_ℓ = h_ℓ + α · v_ℓ
```
dove `v_ℓ` è il vettore di steering al layer ℓ e α la forza (positiva = verso il comportamento, negativa = opposto).

**Differenza chiave vs LoRA**: il LoRA modifica i pesi (ΔW low-rank, appreso con gradient descent su un dataset); lo steering vector modifica le **attivazioni a runtime** (estratto, spesso senza ottimizzazione, da contrasti di attivazioni). Lo steering è più **leggero, economico, componibile e hot-swappabile**, ma più **grossolano e a minore capacità**.

## 2. Come si estraggono (tecniche)

| Tecnica | Idea | Costo |
|---|---|---|
| **Difference-of-means (CAA / ActAdd)** | media(attivazioni su esempi "positivi") − media("negativi") al layer ℓ | bassissimo, no training |
| **PCA / probing direction (RepE)** | direzione principale che separa i due cluster di attivazioni | basso |
| **Linear probe / ITI** | addestri un probe lineare a separare il concetto, usi i suoi pesi come direzione | basso |
| **Optimized steering** | ottimizzi `v` con un obiettivo (es. massimizza P(comportamento)) | medio (qui rientra l'eventuale "optimization path" della nota utente) |

`[INFERRED]` La frase utente "optimization path and reasoning" probabilmente abbraccia sia (a) l'**uso** a inference per orientare il reasoning, sia (b) l'**ottimizzazione** del vettore/path di estrazione. Entrambe coperte qui.

**Paper di riferimento** `[DA VERIFICARE ID]` (no-confabulation: titoli reali, arXiv ID da confermare in ingest dedicato):
- RepE — "Representation Engineering: A Top-Down Approach to AI Transparency" (Zou et al. 2023)
- CAA — "Steering Llama 2 via Contrastive Activation Addition" (Rimsky et al. 2024)
- ActAdd — "Activation Addition: Steering Language Models Without Optimization" (Turner et al. 2023)
- Refusal direction — "Refusal in Language Models Is Mediated by a Single Direction" (Arditi et al. 2024)
- ITI — "Inference-Time Intervention: Eliciting Truthful Answers from a Language Model" (Li et al. 2023)

## 3. Le 8 aree di applicazione (mappate sul progetto)

| # | Applicazione | Asse di steering | Collega a |
|---|---|---|---|
| 1 | **Controllo profondità reasoning** | verboso/lungo ↔ corto/diretto | [[scientific-method-operating-protocol]] Fase 2, thinking adattivo, nota 6a |
| 2 | **Anti-exfiltration / refusal** | rivela ↔ rifiuta (secret section) | [[_user-notes-2026-06-23]] nota 8, [[out-of-domain-refusal-training]] |
| 3 | **Modulazione di dominio leggera** | generico ↔ coding/finance/... | alternativa/complemento a [[lora-stacking]] e routing LoRA |
| 4 | **Onestà / anti-allucinazione** | confabula ↔ truthful | [[scientific-method-operating-protocol]] (non deviare), [[contradiction-detection-layer]] |
| 5 | **Cautela / criticality** | impulsivo ↔ cauto ai bivi | [[pre-flight-safety-checks]], nota 9 decision-point-lookahead |
| 6 | **Anti-sycophancy** | compiacente ↔ critico oggettivo | meta-allineato alla regola "critica oggettiva no piaggeria" |
| 7 | **Aderenza al formato strutturato** | libero ↔ structured-context format | [[structured-context-sections]], [[structured-thinking]] |
| 8 | **Persona / tono operativo** | stile risposta (conciso, formale...) | wrapper UX |

## 4. Le 3 più promettenti per il progetto

1. **Controllo profondità reasoning (#1)** 🟢🟢 — è un **meccanismo alternativo/complementare** per il thinking adattivo (Fase 2): invece di affidare il lungo↔corto solo al training, un "depth steering vector" lo modula a runtime con un coefficiente α regolabile per-turno in base alla difficoltà stimata. Sinergia diretta con [[scientific-method-operating-protocol]] e nota 6a (length-prediction → α).
2. **Anti-exfiltration / refusal (#2)** 🟢 — la direzione di refusal è la più studiata e robusta in letteratura; come **rete di sicurezza extra** sulla secret section, in aggiunta a training adversariale (nota 8) + guardrail deterministico wrapper. Tre livelli di difesa invece di uno.
3. **Modulazione di dominio leggera (#3)** 🟢 — **complemento economico ai LoRA verticali**: per domini "sottili" o per micro-aggiustamenti, uno steering vector evita di addestrare/caricare un LoRA intero. Componibile con un LoRA caricato (LoRA = capacità grossa, steering = nudge fine). Possibile **4° asse di controllo** ortogonale alla three-tier.

## 5. Relazione con la three-tier architecture

Gli steering vectors sono **ortogonali** ai LoRA e potrebbero diventare un **4° asse di controllo leggero** sopra i 3 tier:
```
Tier 1 (full-FT organization)  ── pesi base
  + Tier 2/3 LoRA (programming / verticale)  ── hot-swap capacità grossa
    + steering vector(s)  ── nudge runtime per-turno (depth, caution, refusal, domain-fine)
```
Vantaggio: i 3 tier danno **capacità**; gli steering danno **modulazione fine e reversibile a costo ~0** senza ricaricare adapter. `[INFERRED]` Da validare empiricamente che steering + LoRA coesistano senza degradare la coerenza.

## 6. Tradeoff e rischi (critica oggettiva)

| Pro | Contro |
|---|---|
| No training di pesi, estratti da poche decine di esempi | Più **grossolani** dei LoRA, minore capacità espressiva |
| Hot-swap e componibili (somma di vettori) | α troppo alto → **degrado coerenza**, output rotti |
| Reversibili per-turno, costo memoria minimo | Tuning di **layer + α** richiede ricerca empirica |
| Interpretabili (asse semantico esplicito) | Sovrapposizione di più vettori può **interferire** (come lora-stacking) |
| Ottimi come **rete di sicurezza** ridondante | Compatibilità con MoE/DeltaNet (Qwen3.6-35B-A3B) **da verificare** |

**Rischi specifici**:
- Robustezza adversariale: uno steering di refusal può essere aggirato; non sostituisce il guardrail deterministico.
- Generalizzazione: un vettore estratto su un dataset può non trasferire a distribuzioni diverse.
- Su architetture hybrid (Gated DeltaNet) il "residual stream" ha struttura diversa → da testare.

## 7. Next
- **Esperimento minimo proposto**: estrarre un "depth steering vector" su Qwen3-4B (difference-of-means su esempi CoT-lunga vs CoT-corta), misurare se α modula lunghezza del thinking mantenendo correttezza → validerebbe l'area #1 e il legame con Fase 2.
- Ingest dedicato dei 5 paper (§2) con verifica arXiv ID.
- Valutare in [[../decisions/2026-05-21-training-philosophy-roadmap|roadmap]] in quale Wave testare steering (probabile Wave 6+, dopo MVP).

## Sources
- User notes 2026-06-23, nota 1 (Telegram msg 44/46).
- Collega: [[scientific-method-operating-protocol]], [[_user-notes-2026-06-23]], [[lora-stacking]], [[out-of-domain-refusal-training]], [[pre-flight-safety-checks]], [[contradiction-detection-layer]].

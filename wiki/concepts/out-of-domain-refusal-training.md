---
name: out-of-domain-refusal-training
description: Counter-examples nel dataset Tier 3 — LoRA verticale impara a riconoscere quando task è fuori dominio e refusal con hint invece di hallucinare.
type: concept
tags: [concept, training, refusal, out-of-domain, dataset, selective-prediction, robustness]
sources: [user notes 2026-05-21 grill-me discussion, Constitutional AI Anthropic 2022, Selective Prediction literature]
last_updated: 2026-05-21
---

# Out-of-Domain Refusal Training

## Trigger utente (2026-05-21)

> "Aggiungere contro esempi per ogni categoria nel dataset! Es: il modello base + lora specializzato caricato (es: coding) devono essere in grado di dire se quel task magari non è per coding e c'è stata una miss classification, invece di rispondere e produrre rumore, oppure comunque da un suo hint poi se richiamato è costretto a rispondere."

## L'idea in essenza

Il LoRA Tier 3 verticale (es. frontend) deve includere nel suo training set una **frazione di sample out-of-domain** dove il task NON è del suo dominio, e la risposta target è:
1. **Dichiarazione esplicita** che il task non è per lui (`<self_assessment>out_of_domain</self_assessment>`)
2. **Hint** su quale LoRA potrebbe essere giusto (`<hint>this looks like finance, try finance_lora</hint>`)
3. Fallback: se forzato (re-load del same LoRA con istruzione esplicita "rispondi comunque"), prova a rispondere best-effort con disclaimer

## Why funziona (basato su letteratura)

### 1. Selective Prediction (Chow 1970, Cortes et al. 2016)

Modelli che imparano a **astenersi** quando incerti superano modelli che predicono sempre. Pattern standard in ML.

### 2. Refusal Training (Anthropic Constitutional AI 2022)

Constitutional AI insegna esplicitamente al modello a **rifiutare** richieste fuori capability/policy. Funziona empiricamente.

### 3. Calibration awareness

Il modello che conosce i propri limiti = modello calibrato. Calibration migliora con dataset che include sample dove "non so" è la risposta giusta.

### 4. Robustness al mis-routing

In runtime, il Tier 1 orchestratore (classifier) può sbagliare → Tier 3 sbagliato caricato. Senza refusal training → modello hallucina sul dominio sbagliato. Con refusal training → modello salva la situazione restituendo hint utile.

## Schema dataset Tier 3

Composizione raccomandata per Tier 3 frontend MVP v1:

| Categoria | % | Esempi |
|---|---|---|
| **In-domain genuine** | 80% (~24K sample) | Task frontend chiaro (es. "crea componente React per form login") |
| **In-domain edge case** | 10% (~3K) | Task ambiguo ma ancora frontend (es. "implementa state management server-side rendering") |
| **Out-of-domain refusal** | 10% (~3K) | Task NON frontend → refusal + hint |

### Esempio sample out-of-domain refusal

**Prompt**: "Crea una funzione Python che calcola Discounted Cash Flow per analisi finanziaria, con tax rate variabile"

**Expected output**:
```
<self_assessment>
not_my_domain: this is a backend financial calculation task, not frontend UI.
</self_assessment>

<hint>
Task identified domains:
- Primary: finance (DCF, tax calculation)
- Secondary: backend python (computation logic)

Recommended LoRA: 
1. finance_lora (if exists) for formula correctness
2. backend-py_lora for Python implementation

I'm specialized in frontend (React/Vue/Next/TS/CSS). 
If you need a frontend dashboard to display DCF results, that's my domain.
</hint>

<fallback_if_forced>
If you must use me for this, I can produce a Python snippet but:
- Cannot guarantee financial correctness
- May produce frontend-style code (e.g., async/await patterns from JS) inappropriate for backend
</fallback_if_forced>
```

### Distribuzione categorie out-of-domain

Per Tier 3 frontend, sample out-of-domain devono coprire diversi domini per generalizzazione:

| Sub-categoria out-of-domain | % di out-of-domain | Esempi |
|---|---|---|
| Backend pure (Python/Node) | 30% | API REST, database queries, business logic |
| Data/Analytics | 20% | Pandas operations, SQL, ETL |
| DevOps | 15% | Docker, K8s, Terraform |
| Finance/Domain-specific | 15% | DCF, options pricing, accounting |
| Mobile native | 10% | iOS Swift, Android Kotlin |
| ML/Data Science | 10% | PyTorch training, model deployment |

## Connessioni con altri concept

### 1. Bridge con `contradiction-detection-layer`

Refusal è un **caso speciale di contradiction**: "il context mi assegna task X ma io non sono competente per X". Bridge naturale.

### 2. Bridge con `pre-flight-safety-checks`

Modello che sa "non sono il LoRA giusto" può triggerare safety check before output (warning utente).

### 3. Bridge con `error-memo-system`

Sample di refusal possono diventare memo: "ho rifiutato task X, ricordare di non riprovare a forzare LoRA Y per task simili".

### 4. Bridge con `routing-strategy` (Tier 1 orchestratore)

Refusal del Tier 3 funge da **feedback** per il Tier 1: "il routing decision era sbagliato, impara". Reinforcement loop.

### 5. Bridge con `multi-expert-collaboration` (vedi concept dedicato)

Quando un Tier 3 fa refusal e suggerisce altro LoRA, è il primo step di un workflow multi-expert.

## Implementazione MVP v1

**Sì, in MVP v1**. Costo basso, valore alto.

```python
# Dataset Tier 3 frontend generation
def generate_tier3_dataset():
    samples = []
    samples += generate_in_domain_frontend(n=24000, framework_mix={
        'react': 8000, 'vue': 8000, 'next': 8000
    })
    samples += generate_in_domain_edge_cases(n=3000)
    samples += generate_out_of_domain_refusal(n=3000, target_domains={
        'backend-py': 900, 'backend-ts': 600, 'data': 600,
        'devops': 450, 'finance': 450
    })
    return samples
```

Custom eval per refusal:
- 200 task out-of-domain
- Metric:
  - **Refusal accuracy**: % task refusati correttamente (no hallucinazione)
  - **Hint quality**: % hint con domain correttamente identificato (manual eval o LLM-as-judge)
  - **Over-refusal**: % task in-domain rifusati per sbaglio (deve essere <2%)

## Trade-off

| Pro | Contro |
|---|---|
| Robustezza al mis-routing | +10% dataset extra |
| Modello calibrato (sa cosa non sa) | Risk over-refusal (mitigated by calibration ratio) |
| Migliore UX (utente sa dove andare) | Format hint deve essere structured (Wrapper-aware) |
| Bridge naturale con altri concept | Eval pattern extra da implementare |
| Patten conosciuto in letteratura | Costo training leggermente maggiore (sample extra) |

## Failure modes

1. **Over-refusal cronico**: modello rifiuta troppo spesso → utente frustrato. Mitigazione: ratio counter-examples max 10-15%, calibration tested empiricamente.
2. **Hint inaccurato**: refusal corretto ma hint dice "try X" quando giusto sarebbe "try Y". Mitigazione: hint sample con classificazione validata.
3. **Forced override**: utente forza response anche dopo refusal → modello prova ma sbaglia. Mitigazione: fallback section nel target indica esplicitamente disclaimer.
4. **Format inconsistente**: ogni LoRA inventa format proprio. Mitigazione: format `<self_assessment>` + `<hint>` standardizzato in `structured-context-sections`.

## Open questions

- Ratio ottimale in-domain / out-of-domain (10%? 15%? 20%?) — empirical
- Hint dovrebbe nominare lora specifico ("frontend_lora") o solo domain ("frontend")?
- Forced override è feature o bug? Pro: utente decide. Contro: bypass safety
- Out-of-domain sample devono includere "non lo so" puro (no hint) o sempre hint utile?

## Status

`approved-by-user` — idea utente. Implementazione MVP v1 (Wave 5) come parte del dataset Tier 3 frontend.

## Sources

- User notes 2026-05-21 grill-me (idea originale)
- Constitutional AI (Bai et al. 2022 Anthropic): https://arxiv.org/abs/2212.08073
- Selective Prediction theory (Chow 1970, Cortes 2016)
- Anthropic Refusal Training methodology blog posts
- Bridge concept: [[contradiction-detection-layer]], [[pre-flight-safety-checks]], [[error-memo-system]], [[secret-section-exfiltration-defense]] (stessa famiglia "addestrare il no" / refusal), [[agent-constitution]] (principio 16: resta nello scope del dominio)

---
name: post-rl-path-optimization
description: Dopo RL training, ottimizzazione dei path di pensiero — distillation e token compression per same-result-faster.
type: concept
tags: [concept, training, rl, distillation, path-optimization, token-compression, impratichimento]
sources: [user notes 2026-05-21]
last_updated: 2026-05-21
---

# Post-RL Path Optimization — "Impratichimento"

## Idea ground truth (utente, 2026-05-21)

> "Post RL optimization, ovvero dopo aver istruito la macchina a rendere più probabile alcuni path di pensiero, successivamente prendere tutti questi Path e ottimizzarli, quindi invece di rifare tutto il ragionamento per capire cosa deve fare e come, lo fa diretto (impratichimento) oppure riduce il numero di token in output per ottenere lo stesso risultato."

## Cosa risolve

Dopo RL/preference training (DPO, ORPO, GRPO), il modello ha imparato a **preferire** certi path di pensiero (es. "prima fai check dati, poi piano, poi esegui"). Ma ogni volta che esegue, ri-deriva il ragionamento da capo, spendendo token per "scoprire" un path che è già stato premiato 10,000 volte durante training.

**Analogia umana**: quando un programmatore esperto fa `git status` prima di committare, non ci pensa più — è automatico. Un junior dev invece pensa "devo controllare cosa cambierà, oh sì git status mostra lo stato, ok lo eseguo".

L'obiettivo: arrivare al livello del senior dev → **azione diretta** dopo abbastanza pratica.

## Due forme di ottimizzazione

### Forma A — Path skipping ("impratichimento")

Path di pensiero **frequenti** vengono saltati: invece di derivare ogni volta "ok devo controllare X, poi Y, poi Z", il modello impara a emettere direttamente l'azione finale "esegui X, Y, Z in sequenza".

Esempio:

| Prima (12 turni thinking) | Dopo impratichimento (2 turni) |
|---|---|
| OBIETTIVO: fix bug<br>INPUT: error message<br>VERIFICA: ho già visto questo errore? [V] sì<br>PATTERN: NullPointerException su user.email<br>HYPOTHESIS: email non valorizzata in INSERT<br>VERIFICA: codice INSERT users<br>CONFERMA: si, email mancante<br>FIX: aggiungi user.email = request.email<br>... | OBIETTIVO: fix bug<br>PATTERN_MATCH: NullPointer email INSERT users → FIX template_27 → applica |

`template_27` = path compresso, pre-imparato, applicabile diretto.

### Forma B — Token compression ("stesso path, meno parole")

Stesso path di ragionamento, ma con vocabolario interno **denso** che il modello stesso impara:

| Prima (50 token) | Dopo (15 token) |
|---|---|
| "Devo verificare se la libreria ha installato la dipendenza richiesta, controllo il file requirements.txt e poi eseguo pip list per confermare" | "REQ_VERIFY[requirements.txt → pip list]" |

Il modello impara una sorta di "DSL interno" per esprimere i path ricorrenti in modo compatto. Output finale identico, thinking 3-5x più corto.

## Tecniche di implementazione

### 1. Self-distillation dopo RL

Pipeline:

```
Step 1: train modello A con RL/DPO → ottiene path preferenze
Step 2: genera dataset di output: 
        - input: task
        - target: thinking_completo (di A) → final_output
Step 3: train modello B (distillation) su dataset compresso:
        - input: task
        - target: thinking_minimal (compresso) → final_output
Step 4: B mantiene quality (final_output identico) ma con thinking_minimal
```

Skill `ml-knowledge-distillation` supporta.

### 2. Pattern mining su training trajectories

Durante RL, salva tutti i thinking_trajectories. Cluster di trajectories simili per task type.

Per ogni cluster: identifica **path canonico** (più frequente, alta reward).

Inietta path canonici come "templates" nel vocab del modello (special tokens o adapter dedicato).

Esempio: token speciale `<PATH:check_install_dep>` espande a thinking completo durante esecuzione, ma sul prompt occupa 1 token.

### 3. Cache embedding di reasoning

Per task ricorrenti, il wrapper può **mantenere KV cache** del thinking strutturato. Quando arriva task simile, riusa la KV cache parziale invece di re-generare.

Tecnica simile a RadixAttention (SGLang) ma applicato a path di reasoning.

### 4. Distillation chain Tier 1 → Tier 2-3

Nel three-tier:

- **Tier 1 (orchestrator)** impara path lunghi e completi durante training (RL)
- Dopo, distillation: **Tier 2 (programming)** impara la versione compressa dei path frequenti coding-related
- **Tier 3 (verticale)** impara compressed paths stack-specific

Result: Tier 1 fa thinking lungo solo per task novel; Tier 2-3 sono "esperti pratici" che agiscono diretti su pattern noti.

## Trade-off

| Pro | Contro |
|---|---|
| Latency per task ricorrenti **drasticamente ridotta** | Path skipping può saltare verifiche importanti su edge case |
| Costo token per task noto bassissimo | Distillation pipeline complessa |
| Modello "esperto" feel | Rischio over-confidence su pattern simili ma diversi |
| Permette deployment su SLM più piccolo | Richiede dataset post-RL grande |
| Compatibile con LoRA stacking | Path compressi vanno aggiornati periodicamente |

## Failure modes e mitigazioni

1. **Pattern false positive**: modello applica `template_27` a un caso simile ma diverso → bug subdolo. Mitigazione: validation step (`PRE_CHECK_FIRES_TEMPLATE`) prima di applicare template, con escape verso thinking completo se mismatch.

2. **Drift dei pattern**: codebase evolve, `template_27` diventa obsoleto. Mitigazione: periodic re-training, monitoring success rate per template.

3. **Loss di flessibilità**: modello diventa rigido, non gestisce bene task fuori dai cluster. Mitigazione: mantenere "explorer mode" come fallback (full thinking se confidence < threshold).

4. **Allucinazione di template**: modello inventa `template_X` inesistente. Mitigazione: vocab di template chiuso e validato dal wrapper.

## Misurazione

Metriche per valutare se il post-RL optimization sta funzionando:

| Metrica | Target |
|---|---|
| Avg thinking tokens (task ricorrenti) | -50% vs baseline |
| Final output quality (eval) | ≥ baseline -2% (lieve sacrificio ok) |
| Task novel (out-of-distribution) | ≥ baseline (no degradazione) |
| Latency p50 / p95 | -40% / -30% |
| Template fire rate vs hit rate | hit/fire > 0.85 |

## Open questions

- Quale framework supporta self-distillation post-RL su Qwen3 family? (Unsloth? Axolotl? Custom?)
- Dataset size needed per pattern mining? (10K trajectories? 100K?)
- Special token vocab grow → tokenizer change? Implications?
- Compatibilità con composition-aware training di [[lora-stacking]]?
- Loss function per distillation: KL divergence sui thinking? RM-based?

## Link interni

- [[scientific-method-operating-protocol]] — la **Fase 2** (ottimizzazione CoT lungo→corto adattivo) È la formalizzazione di questo concept; lo switch lungo/corto usa self-assessment + length-head + depth-steering
- [[structured-thinking]] — il thinking che viene ottimizzato
- [[lora-stacking]] — adapter per i path compressi vivono in Tier 2-3
- [[task-decomposition-adhoc-context]] — i template per step ricorrenti
- [[catastrophic-forgetting]] — la distillation rischia forgetting
- [[error-memo-system]] — gli errori del modello informano quali template NON usare

## Sources

- Knowledge Distillation (Hinton et al. 2015)
- Self-distillation papers (e.g., MiniLLM, Gu et al. 2023)
- RadixAttention (SGLang) — KV cache reuse
- DPO / ORPO / GRPO RL training methods
- User notes 2026-05-21

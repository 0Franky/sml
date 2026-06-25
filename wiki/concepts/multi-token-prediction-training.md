---
name: multi-token-prediction-training
description: Training multi-target — predici next-token, 2-next, 3-next, e label semantici (next sketch reply, busy/checking).
type: concept
tags: [concept, training, mtp, multi-token-prediction, training-objective, qwen35]
sources: [user notes 2026-05-21 hand-sketch photo]
last_updated: 2026-05-21
---

# Multi-Token Prediction Training (Extended)

## Idea ground truth (utente, 2026-05-21 — foto appunti)

Schema dalla foto:

```
TRAINING / PREDICTION
| NEXT      | NEXT WORD/TOKEN | 2 NEXT TKN | 3 NEXT TKN | GROUP SKETCH REPLY |
                                                          | (SUB)TASK FOR      |
                                                          | BUSY/CHECKING/?    |
                                                          | (?)                |
```

Interpretazione: durante training, il modello deve produrre **multipli target** in parallelo:
- Next-token (standard causal LM)
- 2-next token
- 3-next token
- "Group sketch reply" (struttura della risposta intera, non token singolo)
- (Sub)task for: chi/cosa eseguirà il sub-task
- Busy/checking state: stato runtime del modello/wrapper

## Perché serve

Standard next-token prediction è "miope": il modello vede solo +1. Multi-Token Prediction (MTP) e suoi extension:

1. **MTP classica** (DeepSeek-V3, Qwen3.5): predici n-token avanti contemporaneamente → migliora pianificazione, riduce latency tramite speculative decoding
2. **Group sketch reply**: il modello predice lo "scheletro" della risposta (sezioni, lunghezza approssimativa, tipo di output: codice/testo/tabella) prima del content → permette al wrapper di pre-allocare strutture
3. **Sub-task assignment**: durante reasoning, prevedi anche **a quale tier/LoRA** sarà assegnato il sub-task corrispondente → routing decision built-in
4. **Busy/checking state**: prevedi anche lo stato del wrapper (è in attesa di un tool? sta verificando? è bloccato?) → metadata che alimenta il wrapper sync loop

## Architettura proposta

### Heads multiple (post-FFN)

Sopra il transformer base, aggiungere N heads paralleli:

```
hidden_state (last layer)
       ↓
   ┌──┬──┬──┬──┐
   │ H1 │ H2 │ H3 │ H4 │ H5 │
   └──┴──┴──┴──┘
    |    |    |    |    |
  next  +2   +3  sketch task/
                       busy
```

- **H1 (next token)**: standard causal LM head (loss CE)
- **H2 (+2 token)**: predict token at position +2, loss CE su 2-shift
- **H3 (+3 token)**: idem +3
- **H4 (sketch)**: predice struttura risposta (token speciali del tipo `<reply_type:code:300tok>` o `<reply_type:answer:50tok+table:3rows>`)
- **H5 (state)**: predice meta-state (BUSY | CHECKING | READY | BLOCKED | UNCERTAIN)

Loss totale = weighted sum delle 5 loss (es. 1.0, 0.3, 0.2, 0.5, 0.3).

### Compatibility con Qwen3.5

Qwen3.5 già ha MTP nativo (multi-token prediction, vedi [[slm-coding-landscape]]). H1-H3 sono già supportati. Le head H4-H5 sono **custom additions** che richiedono:

- Tokenizer extension con special tokens per sketch/state
- Dataset annotato con labels (vedi sotto)
- Modifica della loss function durante training

Per Qwen3 dense (Step 1 locale): non c'è MTP nativo, ma si può aggiungere via custom training (Unsloth supporta multi-head)?

## Dataset annotation

Esempio di sample annotato:

```
INPUT: "Implementa endpoint POST /users con validazione email"

TARGETS:
- next_tokens: standard tokenization della risposta
- sketch: <reply_type:code:python:200tok+test:50tok>
- task_assignment: tier3_backend_python (per il codice) + tier2_programming (per il test design)
- state_transitions: [READY → CHECKING (read existing schema) → BUSY (write code) → CHECKING (run tests) → READY]
```

### Sources di annotation

- **Sketch**: derivabile post-hoc analizzando la risposta finale (post-processing automatico)
- **Task assignment**: definito dal designer (regole esplicite + esempi)
- **State**: simulato durante data generation con teacher model che marca transitions

Costo: dataset 50K-100K sample per training adeguato delle head extra. Skill `aris-experiment-plan` aiuta strutturare.

## Speculative decoding (bonus)

H2-H3 abilitano speculative decoding:

- Genera +1, +2, +3 in parallelo
- Verifica coerenza al runtime
- Se coerenti → emetti 3 token (3x speedup)
- Se incoerenti → fallback a H1 solo

Compatibile con vLLM speculative decoding.

## Sketch head — uso pratico

Il wrapper riceve H4 prima della generation completa:

- Sa già che la risposta sarà `code:python:200tok+test:50tok` → pre-alloca buffer
- Può pre-loaduàre Tier 3 vertical Python prima del primo token effettivo (latency cut)
- Può decidere preemptively se serve `<load:python_vertical>` token speciale

## State head — uso pratico

H5 emesso costantemente durante generation:

- `BUSY` → il modello sta producendo output principale
- `CHECKING` → modalità verifica (l'utente può capire "sta ricontrollando")
- `BLOCKED` → ha bisogno di info, prossimo output sarà una domanda
- `UNCERTAIN` → confidence bassa, raccomandazione `[?]` marker

Il wrapper può visualizzare lo state in UI ("Claude is checking..." vs "Claude is writing..."). Migliora UX.

## Trade-off

| Pro | Contro |
|---|---|
| Routing decision built-in (sketch + task) | Loss multi-head richiede tuning weights |
| Latency cut via sketch pre-allocation | Dataset annotation costa |
| Better planning (vedi più avanti) | Tokenizer extension complica fine-tuning |
| State head migliora UX wrapper | Possibile overfitting su stato di training |
| Compatible speculative decoding | Heads extra → memoria/compute training |

## Failure modes

1. **Head conflict**: H1 e H5 emettono predictions inconsistenti (es. H1 dice "let me check" ma H5 dice `READY`). Mitigazione: weighted ensemble post-training, o head H5 derivata da H1 instead of indipendente.

2. **Sketch hallucination**: H4 predice "code:200tok" ma il modello produce 50 token solo. Mitigazione: train loss che penalizza divergence sketch-vs-actual.

3. **Tokenizer bloat**: troppi special tokens (per sketch/state/task) gonfiano vocab → impatto su embeddings. Mitigazione: vocab compatto, max 50-100 special tokens new.

## Implementazione step-by-step

Per il nostro three-tier:

- **Step 1 (Qwen3-4B locale)**: solo H1 + opzionale H2 via Unsloth custom training. Test fattibilità.
- **Step 2 (Qwen3-8B cloud)**: H1-H3 (MTP standard) + H4 sketch experimental.
- **Step 3 (Qwen3.6-35B-A3B MoE)**: full H1-H5 + speculative decoding production.

## Open questions

- Tokenizer extension Qwen3 senza retraining embedding from scratch: tecnicamente fattibile?
- Sketch head: discrete token (`<code:200tok>`) vs continuous prediction (logit di structure features)?
- Loss weighting tra heads: cosa ottimizzare? (perplexity H1? task accuracy downstream?)
- State head trainable o derivable da H1 logits entropy?
- Compatibilità con composition-aware LoRA training (Tier 2-3 attivi)?

## Link interni

- [[../architecture/three-tier-design]] — multi-head si applica a tutti i tier, ma soprattutto Tier 1
- [[post-rl-path-optimization]] — sketch head + path compression → super-charge
- [[task-decomposition-adhoc-context]] — H4 sketch alimenta plan-then-execute
- [[structured-thinking]] — H5 state alimenta marker `[CHECKING]/[READY]`
- [[../entities/qwen3-coder-next]] — MTP nativo Qwen3.5+

## Sources

- DeepSeek-V3 Tech Report (MTP layer): https://arxiv.org/abs/2412.19437
- Multi-Token Prediction (Gloeckle et al. 2024, Meta): https://arxiv.org/abs/2404.19737
- Qwen3.5 MTP native support: https://unsloth.ai/docs/models/qwen3.5/fine-tune
- Speculative decoding: https://arxiv.org/abs/2211.17192
- User notes 2026-05-21 (hand-sketch photo)

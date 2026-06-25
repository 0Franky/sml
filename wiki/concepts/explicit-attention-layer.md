---
name: explicit-attention-layer
description: Attention layer forzata su sezioni specifiche del context (current_aim, prev_step, global, rules).
type: concept
tags: [concept, attention, focus, context-engineering, training-objective]
sources: [user notes 2026-05-21 hand-sketch photo]
last_updated: 2026-05-21
---

# Explicit Attention Layer

## Idea ground truth (utente, 2026-05-21 — foto appunti)

```
ATTENTION LAYER:
ON: - CURRENT AIM
    - PREV STEP
    - GLOBAL
    - RULES
```

## Cosa risolve

In context lungo (5K-200K token), il modello distribuisce attention attraverso TUTTO il context. Risultato: token in `<aim>` (critici) ricevono attention diluita, mentre token in `<working_history>` (meno critici) ne ricevono comparabilmente troppa. Paper "Lost in the Middle" (Liu 2023) documenta il problema.

**Soluzione proposta**: forzare il modello a dare attention **prioritaria** ad alcune sezioni del context, indipendentemente dalla loro posizione fisica nel prompt.

## Sezioni che ricevono attention "boosted"

Dalla foto utente, in ordine di priorità:

1. **CURRENT AIM** — l'obiettivo del task corrente. Deve essere always-in-focus
2. **PREV STEP** — riassunto dello step precedente. Critico per coerenza cross-step
3. **GLOBAL** — global vision / task summary complessivo. Mantiene the big picture
4. **RULES** — hard limits, lessons learned, constraints utente. Sempre attivi

Sezioni che ricevono attention "standard" (tutte le altre): `<state_queue>`, `<assets>`, `<memory>`, `<working_history>`, `<external_inputs>`, `<untrusted_zone>`.

## Tre implementazioni possibili

### A) Architetturale (modifica attention pattern)

Modifica al modello: durante forward pass, applica un **bias additivo** alle attention scores per token in sezioni boosted:

```python
# Pseudo-code attention modification
attn_scores = Q @ K.T / sqrt(d_k)  # standard

# Boost per token in sezioni protette
for token_idx in tokens_in_aim_section:
    attn_scores[:, token_idx] += BOOST_AIM       # es. +2.0
for token_idx in tokens_in_prev_step:
    attn_scores[:, token_idx] += BOOST_PREV      # es. +1.5
for token_idx in tokens_in_global:
    attn_scores[:, token_idx] += BOOST_GLOBAL    # es. +1.5
for token_idx in tokens_in_rules:
    attn_scores[:, token_idx] += BOOST_RULES     # es. +1.0

attn_weights = softmax(attn_scores)
```

**Pro**: deterministico, garantito.
**Contro**: modifica architettura → richiede re-training. Difficile da combinare con architectures hybrid (Qwen3.5 DeltaNet).

### B) Training-time (loss che premia attention pattern)

Durante training, aggiunge una **auxiliary loss** che premia il modello quando l'attention naturale (senza modifica architetturale) si concentra effettivamente sulle sezioni protette:

```
L_total = L_LM (standard) + λ * L_attention_focus

L_attention_focus = -E[ sum(attn_weights[tokens_in_aim]) ] 
                    -E[ sum(attn_weights[tokens_in_prev_step]) ]
                    -E[ sum(attn_weights[tokens_in_global]) ]
                    -E[ sum(attn_weights[tokens_in_rules]) ]
```

Il modello impara a "guardare" preferenzialmente quelle sezioni senza modifica forward pass.

**Pro**: nessuna modifica architettura → compatibile con Qwen3 + Qwen3.5 + Qwen3.6.
**Contro**: λ tuning delicato, possibile sacrificio di generalizzazione.

### C) Prompt-engineering only (no training)

Strategia low-effort: il prompt esplicita le sezioni protette con **marker speciali** + istruzione esplicita di "sempre verificare":

```xml
<context>
  <!-- ★★★ SEMPRE TENERE IN FOCUS ★★★ -->
  <aim priority="ALWAYS_REFER">...</aim>
  <prev_step priority="ALWAYS_REFER">...</prev_step>
  <global priority="ALWAYS_REFER">...</global>
  <rules priority="ALWAYS_REFER">...</rules>
  <!-- ★★★ FINE FOCUS PROTETTO ★★★ -->

  <!-- sezioni normali sotto -->
  ...
</context>

<system>
PRIMA DI OGNI AZIONE: ri-leggi le sezioni con priority="ALWAYS_REFER".
SE l'azione contraddice una sezione protetta → STOP e chiedi conferma.
</system>
```

**Pro**: zero cost training, implementabile subito.
**Contro**: solo "suggestion", il modello può comunque ignorare. Combina male con context molto lunghi (>50K token).

## Raccomandazione per il nostro setup

**Pipeline graduale**:

- **Step 1 (Qwen3-4B locale)**: implementa **C (prompt-only)**. Validation: quante volte l'agent ignora `aim` o viola `rules`? Baseline measure.
- **Step 2 (Qwen3-8B cloud)**: aggiungi **B (training-time loss)**. Dataset annotato con attention targets. Measure improvement vs C.
- **Step 3 (Qwen3.6-35B-A3B)**: valuta **A (architettura)** se B non basta. Solo se Step 2 non risolve.

## Interazione con sliding window

Quando il context viene costruito ad-hoc per step (vedi [[task-decomposition-adhoc-context]]) e usa sliding window read per VARS (vedi [[sliding-window-variable-tool]]):

- Sezioni `<aim>/<prev_step>/<global>/<rules>` sono sempre **incluse full**, mai sliced
- Altre sezioni possono essere sliced per token budget
- Boost di attention si applica solo a sezioni full (le sliced non hanno priorità)

## Misurazione efficacia

Metriche per valutare se l'attention boosting funziona:

| Metrica | Target |
|---|---|
| Adherence to aim (LLM-as-judge: l'output rispetta aim?) | >95% |
| Rules violation count | -80% vs baseline |
| Cross-step coherence (NLI vs prev_step) | >0.85 entailment |
| Token usage in output | invariato o -10% (focus = no fluff) |

## Trade-off

| Pro | Contro |
|---|---|
| Garantisce focus su obiettivi/rules | Implementazioni A/B costose |
| Mitigates "Lost in the Middle" | Tuning weights non triviale |
| Compatible con context lunghi (>32K) | C-only è "soft" — soft può fallire |
| Augmenta safety (rules sempre attive) | Possibile overfitting su pattern di training |

## Failure modes

1. **Over-boost**: aim diventa OVER-emphasized, modello ignora context utile → bias verso "fai aim a tutti i costi". Mitigazione: boost moderato (+1 a +2 max).

2. **Under-boost**: boost troppo basso → effetto nullo. Mitigazione: ablation studies per trovare sweet spot.

3. **Interaction con DeltaNet (Qwen3.5/3.6)**: linear attention layer non ha "attention scores" classiche. Implementation A va ripensata. Mitigazione: applicare boost solo sui full-attention layer (8/32 in Qwen3.5).

4. **Rules conflicting**: se `<rules>` ha N regole incompatibili, boost le rinforza tutte → confusion. Mitigazione: rule prioritization + conflict resolution prima del boost.

## Open questions

- Quali sezioni esatte boostare beyond aim/prev_step/global/rules? (assets? pending_verifications?)
- Boost value: fixed (es. +2) o learned per-section?
- Compatibility con Qwen3.5 DeltaNet hybrid attention?
- Test set per misurare "Lost in the Middle" sul nostro context?

## Link interni

- [[structured-context-sections]] — definisce le sezioni protette
- [[task-decomposition-adhoc-context]] — costruisce context con sezioni
- [[agent-wrapper-vars-queue]] — current_aim viene dalla queue
- [[contradiction-detection-layer]] — usa rules + aim come ground truth
- [[../entities/qwen3-coder-next]] — compatibility nota con hybrid attention

## Sources

- "Lost in the Middle" (Liu et al. 2023): https://arxiv.org/abs/2307.03172
- "Attention Sinks" (Xiao et al. 2023, MIT): https://arxiv.org/abs/2309.17453
- Anthropic XML tag guidance for prompt structure
- User notes 2026-05-21 (hand-sketch photo)

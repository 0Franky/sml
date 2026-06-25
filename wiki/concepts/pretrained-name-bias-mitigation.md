---
name: pretrained-name-bias-mitigation
description: Come gestire il "name bias" dal pretraining (Qwen ha visto miliardi di token con nomi comuni tipo user_id) senza buttare via il pretraining stesso.
type: concept
tags: [concept, training, bias-mitigation, induction-heads, pretraining, fine-tuning, copy-from-context]
sources: [user notes 2026-05-21 — terza tornata, Olsson 2022 induction heads, AlphaGeometry 2024]
last_updated: 2026-05-21
---

# Pretrained Name Bias Mitigation

## Trigger utente (2026-05-21)

> "Quello che mi ha fatto pensare di partire da 0 è stato il fatto che attualmente Qwen per esempio ha già dei pesi associati a variabili, io invece voglio che lui non abbia nomi di variabili nei pesi, invece piuttosto deve imparare solo la struttura ma senza nomi di variabili."

## Cosa significa davvero "pesi associati a variabili" nei transformer

### Quello che NON è vero

Qwen (o qualsiasi LLM pretrained) **non ha** un peso specifico che dice "questa è la variabile `user_id`". I transformer non immagazzinano fatti come database. Niente nel modello "ricorda" un nome specifico come fatto memorizzato.

### Quello che è vero

Il pretraining produce **distribuzione statistica** sui pattern di nomi nel codice:

- Qwen ha visto miliardi di token di codice durante pretraining
- Ha rappresentazioni distribuite di pattern: `user_id`, `data`, `result`, `i`, `j` sono pattern frequenti
- Quando deve "creare un nome di variabile" senza contesto specifico, ha una **preferenza statistica** verso nomi comuni
- Ha rappresentazione semantic di cosa significa `user` vs `data` vs `result` (informazione utile per generazione di codice idiomatico)

**Differenza chiave**: knowledge **statistica/distribuita** (transformer) vs memorizzazione **deterministica** (database/lookup table). Il pretraining produce la prima, non la seconda.

## Preoccupazione utente reale (corretta)

Riformulata in termini precisi:

> "Voglio che il modello impari a **copiare** nomi dal contesto, non a **inventarli** basandosi su bias statistici del pretraining."

Questo è un timore **legittimo**. Senza intervento, un modello fine-tuned con nomi random potrebbe ancora tendere a **sostituire** nomi random con nomi comuni del pretraining (es. vede `v_4b9d2c1a` nel prompt, output `user_data` invece di copiarlo).

## Perché pre-training from scratch è soluzione sproporzionata

Per **eliminare un piccolo bias statistico** sui nomi comuni di variabili, butteremmo via:

| Cosa si perde | Costo per recuperarlo |
|---|---|
| Knowledge linguaggio naturale (it, en) | Trilioni di token, $100K+ |
| Knowledge matematica/fisica/fatti del mondo | Trilioni di token, $100K+ |
| Knowledge "cos'è una funzione, una classe, un loop" | Bilioni di token coding, $50K+ |
| Knowledge sintassi di N linguaggi | Bilioni di token, $50K+ |
| **Induction heads già formati** | Centinaia di miliardi di token, $30K+ |
| Reasoning skill base | Trilioni + RLHF, $100K+ |

Trade-off **molto sfavorevole**: paghi $400K+ per eliminare un bias che può essere mitigato con $1K-50K di fine-tuning mirato.

## Soluzione: Induction Heads + Fine-Tuning mirato

### Cosa sono le induction heads (Olsson 2022, Anthropic)

I transformer pretrained sviluppano spontaneamente **induction heads** — meccanismi che imparano a "completare il pattern" copiando dal contesto. Vedi paper https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/

**Esempio concreto**:
- Prompt: `def calculate_total(items, tax_rate):`
- Target: `total = sum(item.price for item in items) * (1 + tax_rate)`
- Le induction heads riconoscono `items` e `tax_rate` come simboli presenti nel contesto → li **copiano** invece di sostituirli con nomi alternativi (es. `data` o `value`)

**Punto critico**: l'induction head **non sa il significato semantico** di `items` o `tax_rate`. Sa solo "questo simbolo è apparso nel contesto recente, devo riusarlo se rilevante".

### Quando applichiamo fine-tuning con simboli random

- Modello vede `def v_4b9d2c1a(v_7e3f8a2b, v_9c1d4e5f):`
- Target richiede di usare `v_7e3f8a2b` e `v_9c1d4e5f`
- Le induction heads **funzionano comunque** — copy è skill **indipendente** da knowledge di nomi naturali
- Anzi: il regime random **rafforza** le induction heads (gradient descent le incentiva intensamente)
- Il pretraining knowledge di `user_id` **non interferisce** col fine-tuning random naming

### Evidenza empirica in letteratura

- **AlphaGeometry** (Trinh et al. 2024, Nature): pretrained model + synthetic problems con simboli astratti → ha funzionato. Modello ha generalizzato a nomi mai-visti
- **GraphCodeBERT** (Guo 2021), **UnixCoder** (Guo 2022): pretrained model + variable renaming augmentation → robust su nomi variabili
- **Counterfactual data augmentation** (Kaushik 2020): pretrained model + entity swap → mitigate bias mantenendo knowledge

In nessuno di questi lavori è stato necessario buttare via il pretraining.

## Approccio raccomandato — 4 tecniche stacked

### Tecnica 1 — Regime random durante fine-tuning (priority alta)

Vedi [[runtime-symbol-randomization-training]] e [[dynamic-context-training-regime]]. Already planned per Wave 5-7.

Dataset con nomi random spinge gradient descent verso uso intensive delle induction heads. Nessun cambio rispetto al piano.

### Tecnica 2 — RL post-training su preferenza "copy esatto"

Dopo fine-tuning, RL feedback (ORPO o GRPO) che premia "exact match dei nomi citati dal contesto".

Pseudo-reward function:

```python
def name_copy_reward(prompt, generated_output) -> float:
    prompt_identifiers = extract_identifiers_from_prompt(prompt)
    output_identifiers = extract_identifiers_from_output(generated_output)
    
    # Quali nomi del prompt sono richiesti nel target?
    required_in_output = identify_required_references(prompt, generated_output)
    
    # Reward = % di required identifier che sono stati copiati esattamente
    correct_copies = len(required_in_output & output_identifiers) / max(len(required_in_output), 1)
    
    # Penalty = nomi inventati che dovrebbero essere riferimenti
    invented = len(output_identifiers - prompt_identifiers - allowed_new_names)
    penalty = invented * 0.1
    
    return correct_copies - penalty
```

Costo aggiuntivo: 1 fase RL aggiuntiva nel pipeline. ~$1K-5K Step 2 cloud.

### Tecnica 3 — Dropout intensivo di nomi pretrained (opzionale, sperimentale)

Durante fine-tuning, mascheramento aggressivo dei nomi comuni dal pretraining quando appaiono nel target (es. `user_id`, `result`, `data`, `i`, `j`).

Implementazione: dropout selettivo sul token-id di una blacklist di nomi comuni. Forza il modello a usare alternative o copiare dal contesto.

Tecnica meno standard ma fattibile. Da validare empiricamente.

### Tecnica 4 — Continual pre-training su dataset con random renaming (opzionale, costoso)

Se Tecniche 1-3 lasciano un bias residuo misurabile e problematico:

- **Continual pretraining** (Opzione C dell'ADR `2026-05-21-training-from-scratch-clarification`) su 50-200B token dove tutti gli identifier user-defined sono random
- Il modello "ri-orienta" la sua distribuzione dei nomi a livello pretraining-deep, senza perdere knowledge linguistico/scientifico
- Costo: $10K-50K
- Quando: solo se Tecniche 1-3 falliscono dopo Wave 6

## Strategia incrementale (raccomandata)

Approccio scientifico evolutivo (vedi [[../../memory/feedback_scientific_evolution]]):

1. **Wave 5 (Step 1 LoRA locale)**: Tecnica 1 standalone. Misura se Qwen3-4B copia correttamente i nomi random.
   - **Metric chiave**: % exact match dei nomi citati dal contesto
   - Se >90%: Tecnica 1 basta, procedi
   - Se 70-90%: aggiungi Tecnica 2 in Wave 6
   - Se <70%: aggiungi anche Tecnica 3 o 4

2. **Wave 6 (Step 2 Full FT cloud)**: Tecnica 1 + 2 (RL on copy). Validate scaling.

3. **Wave 7-8 (Tier 2-3 + Step 3)**: Tecnica 1 + 2 + (Tecnica 3 se bias residuo).

4. **Tecnica 4 (continual pretraining)**: solo come **emergency fallback** se evidenze empiriche mostrano bias residuo ingestibile.

5. **Pre-training from scratch (Opzioni A/B)**: NON pianificato. Solo se evidenze rivoluzionarie lo richiedono (improbabile).

## Eval per misurare il problema

Test set ad-hoc per validare "copy from context skill":

- 500 task con nomi random in prompt + target che richiede uso esatto
- Metric:
  - **Exact-match rate** dei nomi: deve essere >95% per produzione
  - **Functional correctness** del codice generato (esegui test)
  - **Cross-language generalization**: training su Python random → eval su TypeScript random

Custom eval da costruire in Wave 4 (Phase 0 baseline).

## Open questions

- Bias residuo specifico ai nomi vs bias generale: misurabile via causal intervention?
- Tecnica 3 (dropout selettivo): quale blacklist? Top-N nomi più frequenti nel pretraining?
- Continual pretraining solo su codice o anche su altre modalità?
- Trasferibilità Step 2 → Step 3: bias del modello base cambia tra Qwen3-8B e Qwen3.6-35B-A3B?

## Link interni

- [[runtime-symbol-randomization-training]] — Tecnica 1 main framework
- [[../decisions/2026-05-21-training-from-scratch-clarification]] — perché Tecnica 4 (continual) > Opzioni A/B
- [[scuola-learning-philosophy]] — "copia → capisci" sequenza
- [[post-rl-path-optimization]] — Tecnica 2 (RL feedback) si inserisce qui
- [[../entities/voyager-paper.md]] — Voyager copies code skill from library, analogia

## Sources

- User notes 2026-05-21 (terza tornata grill-me)
- Olsson et al. 2022, "In-context Learning and Induction Heads" (Anthropic): https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/
- AlphaGeometry (Trinh 2024): https://www.nature.com/articles/s41586-023-06747-5
- GraphCodeBERT (Guo 2021): https://arxiv.org/abs/2009.08366
- UnixCoder (Guo 2022): https://arxiv.org/abs/2203.03850
- Counterfactual Data Augmentation (Kaushik 2020): https://arxiv.org/abs/1909.12434
- ADR `2026-05-21-training-from-scratch-clarification.md` per discussione costi

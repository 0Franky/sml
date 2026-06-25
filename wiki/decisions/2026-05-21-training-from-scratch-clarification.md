---
name: 2026-05-21-training-from-scratch-clarification
description: Chiarimento su cosa significa "training from scratch" — opzioni concrete, costi reali, raccomandazione.
type: decision
status: provisional-awaiting-user
date: 2026-05-21
last_updated: 2026-05-21
---

# ADR 2026-05-21 (d) — Training "From Scratch" — chiarimento

## Context

Durante il dialogo l'utente ha detto (rispondendo alla mia domanda "deleghiamo pretraining a Qwen o facciamo noi?"):

> "Molto probabilmente sarà dataset nuovo con training da zero."

"Training da zero" può significare cose diverse, ciascuna con costo radicalmente diverso. È necessario chiarire prima di tracciare la roadmap finale.

## Spettro di opzioni

| # | Approccio | Cosa cambia rispetto a Qwen pretrained | Tokens training | Costo cloud (4B) | Tempo wall-clock | Fattibile per noi? |
|---|---|---|---|---|---|---|
| **A** | **Pre-training from scratch** | Pesi random, tokenizer custom, architettura custom o open | 1-10 trilioni | $100K-$1M+ | 1-6 mesi | ❌ No (budget vendor-level) |
| **B** | **Pre-training su architettura Qwen3 arch** | Pesi random ma riusiamo arch + tokenizer Qwen3 | 1-3 trilioni | $50K-$500K | 1-3 mesi | ❌ No |
| **C** | **Continual pre-training** | Parti da pesi Qwen3 + continua pretrain su nostro corpus | 50B-500B | $10K-$100K | 1-4 settimane | ⚠ Possibile con budget cloud |
| **D** | **Full Fine-Tuning massivo** | Parti da pesi Qwen3 + SFT su tutto i parametri | 100M-10B | $1K-$10K | 1-2 settimane | ✅ Sweet spot realistico |
| **E** | **LoRA / QLoRA** | Parti da pesi Qwen3 + solo adapter (1-10% pesi) | 10M-1B | $50-$1K | giorni | ✅ Pianificato Wave 1-5 |

## Cosa servono ciascuna delle opzioni

### Opzione A — Pre-training from scratch

Cosa serve:
- **Dataset**: 1-10 trilioni di token curati (paragonabile a The Pile, RedPajama, FineWeb). Costo curation: $50K-200K
- **Compute**: cluster H100 80GB × 64-256 nodi, 1-6 mesi
- **Expertise**: tokenizer training, transformer arch design, distributed training (Megatron, FSDP, DeepSpeed), eval pipeline robusto
- **Iterazioni**: probabilmente 3-10 tentativi (ogni tentativo = $50K+)
- **Tempo persona**: 6-18 mesi full-time per 1 person

**Output**: modello "tuo" pienamente. Tokenizer/arch/pesi tutti tuoi. Massima flessibilità ma massimo costo.

### Opzione B — Pre-training su arch Qwen3

Stesso di A ma riusiamo arch e tokenizer Qwen3 esistenti. Risparmio:
- Niente arch design
- Niente tokenizer training
- Riusabilità ecosystem Qwen (Unsloth, vLLM)

Resta: dataset trilions + compute mesi. Sempre $50K-500K.

### Opzione C — Continual pre-training

Cosa serve:
- **Dataset**: 50B-500B token (nuova distribuzione, in nostro caso: organization-heavy + safety + criticality)
- **Compute**: 4-32 H100 cluster, 1-4 settimane
- **Expertise**: gestione catastrophic forgetting (replay del pretraining originale), tuning LR molto basso
- **Tempo persona**: 1-3 mesi full-time

**Output**: Qwen3-derived model con knowledge significativamente shifted verso il nostro dominio. Manteniamo benefit del pretraining originale + aggiungiamo specializzazione.

**Esempio reale 2024-2026**: questo è quello che Qwen ha fatto per Qwen3-Coder a partire da Qwen3. Anche DeepSeek-Coder-V2 ha fatto continual pretraining a partire da DeepSeek-V2-Base.

### Opzione D — Full Fine-Tuning massivo

Cosa serve:
- **Dataset**: 100M-10B token (curato, instruction-format + criticality awareness + multi-day examples)
- **Compute**: 1-8 A100/H100, 1-2 settimane
- **Expertise**: standard SFT pipeline (TRL, Axolotl, LLaMA-Factory), gestione overfitting
- **Tempo persona**: 2-6 settimane full-time

**Output**: Qwen3 con knowledge organization-aware molto forte. Differenza da continual pretraining: scala del dataset molto minore + focus instruction-following più alto.

**Esempio**: questo è quello che la maggior parte di "fine-tune che cambia comportamento" fanno. Vicuna, Alpaca, Zephyr, OpenChat.

### Opzione E — LoRA/QLoRA

Già pianificato. Wave 1-5 della roadmap. Costo trascurabile, fattibile locale + cloud minimo.

## Cosa intendeva l'utente?

Senza ulteriore chiarimento dell'utente, le opzioni più plausibili sono **C** (continual pretraining) o **D** (full FT). Entrambe sono **fattibili** con budget cloud moderato e producono "un modello tuo" pur partendo da Qwen3 pretrained.

L'opzione A/B (pretraining vero from scratch) richiede vendor-level budget che l'utente non ha esplicitato. **Andrebbe sconsigliata** salvo chiarimento esplicito.

## Raccomandazione provisional

**Soluzione mista** lungo la roadmap (vedi [[2026-05-21-training-philosophy-roadmap]]):

- **Wave 5 (Step 1 locale Qwen3-4B)**: Opzione **E** (LoRA) — workflow validation
- **Wave 6 (Step 2 cloud Qwen3-8B)**: Opzione **D** (Full FT) — Tier 1 organization specialist
- **Wave 7 (Tier 2-3)**: Opzione **E** (LoRA) — LoRA coding stacked
- **Wave 8 (Step 3 target Qwen3.6-35B-A3B)**: Opzione **D** o **C** — full FT MoE, eventualmente continual pretrain se budget consente
- **OPZIONI A/B**: parcheggio per "se mai avremo budget vendor-level". Probabilmente mai per il progetto ricerca-solo.

## Implicazioni se invece l'utente intende pre-training vero

Se l'utente conferma di intendere **Opzione A/B** (pre-training from scratch o on Qwen arch):

- **Cambio fondamentale roadmap**: Wave 1-5 spostate molto più tardi. Prima Wave dovrebbe essere "raccolta dataset trilions di token".
- **Budget**: piano cloud serio. Non realizzabile in autonomia senza partnership/grant/fondi.
- **Tempo**: 1+ anno solo per Step 1.
- **Filosofia "come la scuola"**: in questo caso la fase "copiare" sarebbe il nostro pretraining (costoso). Coerente con citazione utente ma costoso.

## Domanda all'utente

> Quando dici "training da zero":
>
> A) Intendi davvero **pre-training from scratch** (pesi random, vendor-level effort, $100K+)?
> B) Intendi **continual pre-training** (parti da Qwen3, continua su nostro corpus 50-500B token)?
> C) Intendi **full fine-tuning** (parti da Qwen3, tutto aggiornato su nostro SFT 100M-10B token)?
>
> Dimmi e aggiorno la roadmap di conseguenza.

## Linked

- [[2026-05-21-base-model-pipeline]] — pipeline Qwen3-4B → 8B → 3.6-35B-A3B (assume opzione D-E)
- [[2026-05-21-training-philosophy-roadmap]] — wave assumendo D-E
- [[2026-05-21-vision-clarification]] — vision organization-first
- [[../concepts/scuola-learning-philosophy]] — citazione utente "come la scuola" che ha guidato questa discussione

## Chiarimento utente (2026-05-21 round successivo)

L'utente ha specificato il motivo dietro l'idea "from scratch":

> "Quello che mi ha fatto pensare di partire da 0 è stato il fatto che attualmente Qwen per esempio ha già dei pesi associati a variabili, io invece voglio che lui non abbia nomi di variabili nei pesi, invece piuttosto deve imparare solo la struttura ma senza nomi di variabili."

**Diagnosi**: preoccupazione legittima sul "name bias" del pretraining, ma soluzione mal-targeted. Vedi [[../concepts/pretrained-name-bias-mitigation]] per:

1. Spiegazione di cosa significa veramente "pesi associati a variabili" (distribuzione statistica, non memorizzazione)
2. Perché Induction Heads (Olsson 2022) risolvono il problema di copy-from-context anche su modelli pretrained
3. 4 tecniche di mitigation stacked che ottengono lo stesso risultato a costo molto minore
4. Strategia incrementale di validazione (Wave 5 → 6 → 7)

**Conclusione**: pre-training from scratch (Opzioni A/B) NON raccomandata. Approccio scientifico evolutivo:

- **Default**: Opzione **D** (Full FT) per Tier 1 in Wave 6, **E** (LoRA) per Tier 2-3 in Wave 5 e 7
- **Escalation se Tecniche 1-3 falliscono**: Opzione **C** (continual pretraining) in Wave 7-8, costo $10K-50K, riorienta distribuzione nomi nel base senza buttare via pretraining
- **Parcheggio**: Opzioni A/B mai applicate salvo evidenze rivoluzionarie

## Stato

`accepted` — approach Default D+E, escalation C if needed. Opzioni A/B parcheggio.

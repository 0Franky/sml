---
name: pipeline-architecture-data-generation
description: Pipeline producer/consumer asincrona per generare training data — ibrido programmatico+teacher con cache buffer.
type: concept
tags: [concept, infrastructure, data-pipeline, async, producer-consumer, cache, training-infra]
sources: [user notes 2026-05-21 grill-me discussion]
last_updated: 2026-05-21
---

# Pipeline Asincrona Producer-Consumer per Training Data

## Idea ground truth (utente, 2026-05-21)

> "Lanciamo la generazione di migliaia di esempi in loop. Quando ne abbiamo generati abbastanza per avere un cuscino valido, lanciamo il training dove sa quando ripetere i dati per cose oggettive e quando invece iniziare a leggere la cache di dati generati in sequenza senza mai ripeterli, intanto l'altro modello continua a generarne — ha senso? fattibile?"

**Risposta**: sì, ha senso ed è fattibile. È il classico pattern producer-consumer (ML data loading async). Skill `ml-ray-data`, `aris-run-experiment`, `ml-pytorch-lightning` lo supportano nativamente.

## Architettura

```
        ┌──────────────────────────────────────────────────────┐
        │ Cache layer (disk + memory)                         │
        │ ┌─────────────────┐  ┌─────────────────────────┐    │
        │ │ FIXED DATA SET  │  │ DYNAMIC EXAMPLES BUFFER │    │
        │ │ (formule,       │  │ (random samples,         │    │
        │ │  fisica, fatti) │  │  sequential, never repeat)│    │
        │ │ ↻ ripeti N×     │  │ FIFO queue                │    │
        │ └─────────────────┘  └─────────────────────────┘    │
        └────────▲────────────────────────▲────────────────────┘
                 │                        │
        ┌────────┴───────┐       ┌────────┴────────────────────┐
        │ Generator A    │       │ Generator B                  │
        │ (curato fisso) │       │ (runtime random)             │
        │                │       │  - programmatic template     │
        │ - una tantum   │       │  - teacher model (Claude/    │
        │   o periodic   │       │    GPT) per casi complessi   │
        └────────────────┘       │  - in loop continuo          │
                                 └──────────────────────────────┘
                 │                        │
                 └────────────┬───────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │ Training process         │
                │ - reads from cache       │
                │ - mix fixed (with repeat)│
                │   + dynamic (sequential, │
                │     no repeat)           │
                │ - mini-batches           │
                └──────────────────────────┘
```

## Componenti

### 1. Fixed Data Cache

Esempi **immutabili** che il modello deve memorizzare:
- Formule matematiche (algebra, calcolo, statistica)
- Leggi fisiche (Newton, Maxwell, termodinamica)
- Identità (Pitagora, trigonometriche, derivate canonical)
- Fatti storici verificati
- Convenzioni linguistiche (grammatica regole)
- Pattern di reasoning canonical (templates di structured thinking)

**Setup**: generato una tantum (o aggiornato periodicamente quando si scoprono nuovi fatti). Salvato come dataset statico.
**Training**: ogni epoch, riusato. Il modello li vede milioni di volte → memorizza.

### 2. Dynamic Examples Buffer

Esempi **runtime-generated**, ogni sample unico:
- Codice con nomi variabili random (vedi [[runtime-symbol-randomization-training]])
- Context con sezioni di lunghezza/posizione/composizione random (vedi [[dynamic-context-training-regime]])
- Task multi-step con asset/nodi random
- Conversation simulata con turni di lunghezza variabile

**Setup**: generato in continuo da Generator B. Salvato in buffer (disk + RAM) come queue FIFO.
**Training**: letto sequenzialmente, ogni sample è nuovo, **mai ripetuto**.

### 3. Generator A — Fixed (semplice)

Quando? Una volta sola all'inizio (o quando aggiungi categorie nuove).

Cosa? Curato a mano + da teacher model + scraping di fonti affidabili (e.g. matematica da textbook, fisica da Wikipedia verificata).

### 4. Generator B — Dynamic (continuo)

**Ibrido**: programmatico + teacher model.

#### Sub-generator B1 — Programmatic (veloce, deterministico)

Template + random replacement. Esempio:

```python
def generate_switch_task() -> Sample:
    n_cases = random.randint(2, 8)
    function_names = [random_identifier() for _ in range(n_cases)]
    conditions = [random_condition_text() for _ in range(n_cases)]
    prompt = template_switch_prompt(function_names, conditions)
    target = template_switch_target(function_names, conditions)
    return Sample(prompt=prompt, target=target)
```

Pro: super veloce, deterministico, infinito.
Contro: variazione limitata al template.

#### Sub-generator B2 — Teacher model (lento, creativo)

Per esempi complessi che template non coprono. Chiede a Claude/GPT/Qwen-Max di generare:
- Task multi-step con dipendenze
- Conversation realistic
- Safety reasoning su scenario novel
- Critical edge case

Pro: creatività, copre casi non anticipati.
Contro: costo API, lento, qualità da validare.

**Strategia**: B1 produce il 70-90% (volume), B2 produce il 10-30% (qualità + diversità).

### 5. Training Process (consumer)

Strategia di sampling:

```python
def get_next_batch(batch_size: int) -> Batch:
    samples = []
    for _ in range(batch_size):
        if random.random() < fixed_ratio:        # es. 30%
            sample = sample_from_fixed_with_repeat()
        else:                                    # es. 70%
            sample = read_next_from_dynamic_buffer()
        samples.append(sample)
    return Batch(samples)
```

**Mix ratio** (fixed_ratio): da decidere empiricamente. Probabili default:
- Step 1 (workflow validation): 20% fixed / 80% dynamic
- Step 2 (organization FT): 30% fixed / 70% dynamic
- Step 3 (target finale): 40% fixed / 60% dynamic

Più ci avviciniamo al target, più "consolidamento di fondamentali" serve.

### 6. Sync e backpressure

Producer più veloce di consumer: buffer cresce → disk I/O alto, ma OK.
Consumer più veloce di producer: buffer si svuota → consumer aspetta, training stalla. **Evitare**.

Soluzione: monitor buffer size. Se sotto soglia critica, log warning + (opzionale) pausa training automatica.

Implementazione: file lock + watchdog su buffer directory, oppure Redis queue, oppure Ray Data.

### 7. Persistenza e replay

Cache disk persistente: anche se interrompi training, riprendi da dove eri. I sample dynamic non ripetuti sono ancora nel buffer.

Per debug/ablation: poter "replay" la stessa sequenza di sample → seed RNG salvato + buffer immutabile.

## Tecnologie candidate

| Component | Opzione 1 | Opzione 2 | Note |
|---|---|---|---|
| Buffer storage | Disk JSON Lines | SQLite | Disk per semplicità, SQLite se serve query |
| Async queue | Python multiprocessing.Queue | Redis | Multiprocessing per single-node, Redis per multi-node |
| Generator API | FastAPI worker | Celery task | FastAPI se interactive, Celery se grosso scale |
| Teacher API | OpenAI Batch API | Anthropic API | Batch API è 50% cheaper |
| Distributed | Ray Data | PyTorch DataLoader workers | Ray per cluster, PyTorch per single-machine |
| Monitoring | Wandb log | Prometheus + Grafana | Wandb è standard ML |

Skill rilevanti:
- `ml-ray-data` — scalable data pipeline
- `ml-pytorch-lightning` — Trainer integration nativa
- `aris-run-experiment` — manage di async data + training
- `ml-modal` — serverless per generator B2 se serve scaling

## Stima costi

### Generator B1 (programmatic)

- CPU only, single machine
- ~10-100 samples/second
- 1M sample ≈ 3-30 ore CPU
- Costo: trascurabile (locale)

### Generator B2 (teacher model)

Costo API per sample:
- GPT-4-turbo: ~$0.01-0.05 per sample (input 500 token + output 500 token)
- Claude Opus: ~$0.03-0.15 per sample
- Qwen-Max API: ~$0.005-0.02 per sample
- Self-hosted Qwen3-8B teacher: ~$0.0001 per sample (cost GPU only)

100K sample con B2 a 30%:
- 30K sample × $0.02 medio = $600 con API esterne
- Self-hosted: $50-100

**Ragionevole** per dataset di Step 1 (workflow validation). Per Step 2-3 forse self-hosted.

## Configurazione di Step

### Step 1 (locale, 2080 Ti, Qwen3-4B)

- Generator B1 programmatic locale
- Buffer: 10K-50K sample (cache disk ~1-5GB)
- Fixed cache: 5K sample
- Training: 1-3 epoch su Qwen3-4B QLoRA
- Mix ratio: 20% fixed / 80% dynamic
- Costo totale: trascurabile

### Step 2 (cloud A100, Qwen3-8B)

- Generator B1 + B2 (B2 con teacher self-hosted Qwen3-8B su un'istanza separata, o API esterna per qualità)
- Buffer: 100K-500K sample (disk 10-50GB)
- Fixed cache: 20K sample
- Training: 1-2 epoch su Qwen3-8B LoRA bf16
- Mix ratio: 30% fixed / 70% dynamic
- Costo: ~$100-300 generation + training cloud

### Step 3 (cloud H100/B200, Qwen3.6-35B-A3B)

- Generator B1 + B2 ad alto volume
- Buffer: 1M-5M sample (disk 100-500GB)
- Fixed cache: 50K sample
- Training: 1 epoch su Qwen3.6 LoRA + post-training RL
- Mix ratio: 40% fixed / 60% dynamic
- Costo: ~$500-2000 generation + training cloud serio

## Trade-off

| Pro | Contro |
|---|---|
| Mai vedere stesso sample due volte (dynamic) → no overfit | Costo storage cresce |
| Mix flessibile fixed/dynamic | Sync producer/consumer da tunare |
| Continua a generare durante training (no idle) | Generator B2 può diventare bottleneck |
| Modulare, expandable | Complessità sistemistica |
| Resume da interruzione | Reproducibility più difficile (devi salvare seed) |

## Failure modes

1. **Buffer overflow**: producer troppo veloce, disk pieno. Mitigazione: cap su buffer size + drop oldest.
2. **Buffer underflow**: consumer troppo veloce, training stalla. Mitigazione: monitor + (opzionale) pause training.
3. **Quality drift**: generator B2 produce qualità peggiore col tempo. Mitigazione: QA periodic + filter pipeline.
4. **Schema mismatch**: training si aspetta schema X, generator produce Y. Mitigazione: schema validation a generation time + Pydantic.
5. **Reproducibility**: stesso seed dovrebbe produrre stesso dataset. Implementazione attenta del RNG seed.

## Open questions

- Buffer storage format: JSONL su disk o SQLite con tabelle? Trade-off di latency lettura
- Buffer size cap per Step? (disk constraints)
- Quanto della pipeline ha senso fare in Step 1 (workflow validation) — è overkill?
- Schema validation runtime: Pydantic basta o serve custom validator?
- Replay deterministico: seed salvato per sample o per batch?

## Link interni

- [[runtime-symbol-randomization-training]] — uno dei tipi di dynamic sample
- [[dynamic-context-training-regime]] — altro tipo
- [[scuola-learning-philosophy]] — questa pipeline serve a realizzare il "studio e migliora"
- [[../decisions/2026-05-21-training-philosophy-roadmap]] — roadmap che include questa infrastruttura

## Sources

- User notes 2026-05-21 grill-me discussion
- PyTorch DataLoader documentation: https://pytorch.org/docs/stable/data.html
- Ray Data: https://docs.ray.io/en/latest/data/data.html
- OpenAI Batch API: https://platform.openai.com/docs/guides/batch

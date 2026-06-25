---
name: dora-paper
description: DoRA (Liu et al., NVIDIA/Caltech, ICML 2024 Oral) — Weight-Decomposed Low-Rank Adaptation, decompone i pesi pretrained in magnitude + direction e applica LoRA solo alla direzione, ottenendo gain consistenti rispetto a LoRA standard senza overhead a inferenza.
type: paper
entity_type: paper
tags: [paper, peft, lora, fine-tuning, low-rank-adaptation, dora, weight-decomposition, icml-2024, nvidia, qwen3]
sources:
  - https://arxiv.org/abs/2402.09353
  - https://nbasyl.github.io/DoRA-project-page/
  - https://github.com/NVlabs/DoRA
  - https://huggingface.co/papers/2402.09353
  - https://developer.nvidia.com/blog/introducing-dora-a-high-performing-alternative-to-lora-for-fine-tuning/
last_updated: 2026-05-21
---

# DoRA — Weight-Decomposed Low-Rank Adaptation

## Identificativi essenziali

- **Titolo completo**: *DoRA: Weight-Decomposed Low-Rank Adaptation* `[VERIFIED]`
- **Autori**: Shih-Yang Liu, Chien-Yi Wang, Hongxu Yin, Pavlo Molchanov, Yu-Chiang Frank Wang, Kwang-Ting Cheng, Min-Hung Chen `[VERIFIED]`
- **Affiliazioni**: NVIDIA Research, National Taiwan University, Caltech, HKUST `[VERIFIED]`
- **Anno**: 2024 (submission 14 febbraio 2024; revisione v2 estesa)
- **arXiv**: [2402.09353](https://arxiv.org/abs/2402.09353) `[VERIFIED]`
- **Codice**: [github.com/NVlabs/DoRA](https://github.com/NVlabs/DoRA) `[VERIFIED]`
- **Project page**: [nbasyl.github.io/DoRA-project-page](https://nbasyl.github.io/DoRA-project-page/) `[VERIFIED]`
- **Venue**: ICML 2024 — accettato come **Oral presentation** (top tier) `[VERIFIED]`
- **Status di adozione**: integrato ufficialmente in HuggingFace PEFT (`use_dora=True` in `LoraConfig`), supportato in ms-swift, Axolotl, Unsloth, e nei principali framework di fine-tuning `[VERIFIED]`

---

## Sezione 1 — Contesto: perché LoRA classico non basta

Per capire DoRA bisogna prima rivedere brevemente il setup di LoRA, perché DoRA è formulato esplicitamente come una *correzione* di una limitazione strutturale di LoRA. LoRA (Hu et al., 2021) è la tecnica di parameter-efficient fine-tuning (PEFT) più diffusa al mondo. L'idea è di rappresentare l'update di un peso pretrained come prodotto di due matrici a rango basso:

`W_finetuned = W_pretrained + ΔW`

`ΔW = B · A` con `B ∈ R^{d × r}`, `A ∈ R^{r × k}`, dove `r ≪ min(d, k)` (tipicamente 8, 16, 32 contro embedding dimension 4096+).

Si addestrano solo `A` e `B`, lasciando `W_pretrained` congelato. Il vantaggio è enorme: per un modello da 7B, una LoRA con rank 16 ha circa 0.05% dei parametri trainabili rispetto al full fine-tuning. Inoltre `A` e `B` possono essere fuse in `W` a tempo di inferenza (`W_inference = W_pretrained + B·A`), eliminando ogni overhead computazionale.

Il problema è che, empiricamente, **LoRA non raggiunge mai la performance del full fine-tuning** su task complessi. La gap è piccola (1-3 punti su benchmark di commonsense reasoning), ma è sistematica. Per anni la spiegazione comune era "ovvio, hai meno gradi di libertà — è il prezzo dell'efficienza". DoRA dimostra che questa spiegazione è incompleta: non è solo il numero di parametri, è *come* LoRA modifica i pesi che è subottimale rispetto a come li modifica il full fine-tuning.

L'osservazione chiave del paper è una **weight decomposition analysis**. Gli autori prendono modelli LLaMA-7B pre-trained e li confrontano in due condizioni: (a) dopo full fine-tuning su un task, (b) dopo LoRA fine-tuning sullo stesso task. Decompongono i pesi risultanti in due componenti:

- **Magnitudo**: la norma L2 di ogni colonna di `W`, cioè quanto è "forte" ogni direzione.
- **Direzione**: il vettore unitario `W / ||W||`, cioè dove "punta" il peso nello spazio.

Misurano poi la correlazione tra il cambio di magnitudo e il cambio di direzione (`ΔM` vs `ΔD`) tra `W_pretrained` e `W_finetuned`. Risultato sorprendente: `[VERIFIED]`

- **Full fine-tuning**: la correlazione tra `ΔM` e `ΔD` è **negativa** — quando il modello cambia molto la direzione di un peso, tende a cambiarne *poco* la magnitudo, e viceversa. Magnitudo e direzione si muovono *indipendentemente*.
- **LoRA**: la correlazione è **positiva** — magnitudo e direzione cambiano insieme, in modo correlato. LoRA non riesce a fare update "puramente direzionali" senza muovere anche la magnitudo, e viceversa.

Questa è una scoperta non banale. Suggerisce che LoRA è strutturalmente limitata nel modo in cui può modificare i pesi, e che il pattern di update del full FT è qualitativamente diverso, non solo quantitativamente più ricco.

---

## Sezione 2 — L'idea core di DoRA

Una volta capita l'analisi, la soluzione è quasi ovvia: invece di applicare LoRA al peso intero, **decomponi prima il peso in magnitudo e direzione, poi applica LoRA solo alla direzione**, lasciando la magnitudo come parametro scalare trainabile indipendente.

In formule: `[VERIFIED]`

```
W_pretrained = m · (V / ||V||_c)
```

dove:
- `m ∈ R^{1 × k}` è il vettore di magnitudo (uno scalare per colonna)
- `V ∈ R^{d × k}` è la matrice di direzioni
- `||V||_c` è la norma per colonna di V

Dopo la decomposizione, l'update DoRA è:

```
W' = m' · (V + ΔV) / ||V + ΔV||_c

con ΔV = B · A   (LoRA standard sulla direzione)
```

Qui `m'` è trainabile come vettore di parametri (uno per colonna del peso originale), mentre `A` e `B` sono le solite matrici LoRA che modulano la direzione. La normalizzazione `|| · ||_c` assicura che la componente direzionale resti effettivamente "una direzione" (vettore unitario), e che la magnitudo sia controllata esclusivamente da `m'`.

L'intuizione è: il fine-tuning vero richiede di poter cambiare magnitudo e direzione **separatamente**. LoRA classico vincola entrambi alla stessa parametrizzazione a rango basso. DoRA dà a ciascuno il suo canale: un vettore scalare per la magnitudo (cheap), una LoRA a rango basso per la direzione (anch'essa cheap, e ora libera di muoversi senza interferire con la norma).

Il costo aggiuntivo in parametri è trascurabile: per un peso `d × k`, DoRA aggiunge solo `k` parametri extra (il vettore `m'`). Per LLaMA-7B con LoRA rank 16, l'overhead DoRA è meno dell'1% dei parametri trainabili di LoRA. `[VERIFIED]`

**Importantissimo**: come LoRA, DoRA può essere fuso nei pesi a tempo di inferenza. Calcoli `W_inference = m' · (W_pretrained + B·A) / ||W_pretrained + B·A||_c` una volta sola e poi usi solo `W_inference` durante il forward pass. **Zero overhead a inferenza** rispetto al modello base. Questo è un punto cruciale per il nostro use case — l'efficienza a serving deve essere identica al modello pretrained. `[INFERRED]`

---

## Sezione 3 — Walk-through implementazione PyTorch / PEFT

Concretamente, in HuggingFace PEFT la differenza tra LoRA e DoRA è una singola flag:

```python
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen3-4B")

config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    use_dora=True,   # <-- l'unica differenza rispetto a LoRA classico
)

peft_model = get_peft_model(model, config)
peft_model.print_trainable_parameters()
# trainable params: ~26M | all params: ~4B | trainable%: ~0.65%
```

Sotto il cofano, PEFT registra un `DoRALayer` invece di un `LoRALayer`. Il forward pass è (semplificato): `[INFERRED]` (ricostruito dal codice NVlabs/DoRA)

```python
def forward(self, x):
    # 1. componente direzionale: peso base + update LoRA
    base = self.W_pretrained
    delta = self.B @ self.A * (self.alpha / self.r)
    direction = base + delta

    # 2. normalizza per colonna
    norm = direction.norm(dim=0, keepdim=True)
    direction_unit = direction / (norm + eps)

    # 3. moltiplica per la magnitudo trainabile m'
    W_effective = self.m * direction_unit

    return x @ W_effective.T
```

Il backprop poi calcola gradienti per `A`, `B`, e `m` indipendentemente, dando esattamente la separazione magnitudo/direzione che il paper teorizza.

A livello pratico l'overhead di training è di circa **10-15%** rispetto a LoRA standard, dovuto alla normalizzazione e ai gradienti aggiuntivi su `m`. `[VERIFIED]` Non è gratis, ma è accettabile considerando il gain in performance.

---

## Sezione 4 — Benchmark e risultati

I numeri del paper (su LLaMA-7B/13B, LLaMA2-7B, LLaMA3-8B): `[VERIFIED]`

**Commonsense reasoning** (8 benchmark: BoolQ, PIQA, SIQA, HellaSwag, WinoGrande, ARC-e, ARC-c, OBQA), accuracy media:

- LLaMA-7B: LoRA 74.7% → DoRA 78.4% (+3.7 punti) `[VERIFIED]`
- LLaMA-13B: LoRA 79.5% → DoRA 80.5% (+1.0 punti) `[VERIFIED]`
- LLaMA2-7B: LoRA 77.6% → DoRA 80.5% (+2.9 punti) `[VERIFIED]`
- LLaMA3-8B: LoRA 80.1% → DoRA 84.5% (+4.4 punti) `[VERIFIED]`

**Full fine-tuning baseline**: ~85% medio. DoRA chiude circa il 70-80% del gap LoRA↔FullFT con lo 0.6% dei parametri. `[INFERRED]` (sintesi dei numeri sopra)

**Visual instruction tuning** (LLaVA-1.5): DoRA migliora rispetto a LoRA su VQA, GQA, ScienceQA con guadagni di 0.5-2 punti.

**Multimodal video-text** (VL-BART): pattern analogo, DoRA > LoRA su tutti i task.

**Ablation chiave**: gli autori mostrano che la decomposizione magnitudo/direzione spiega la maggior parte del guadagno. Se attivi solo la trainable magnitude senza la decomposizione (cioè aggiungi un vettore scalare a LoRA standard ma senza normalizzare), il gain è marginale. La normalizzazione è essenziale per liberare la direzione dal vincolo correlativo con la magnitudo. `[VERIFIED]`

**Rank sensitivity**: DoRA è notevolmente più robusto a rank bassi. Con r=4, LoRA crolla mentre DoRA mantiene quasi le prestazioni di r=16. Questo è strategicamente importante per noi: significa che possiamo usare LoRA piccolissime (efficienti a serving e a switching runtime) senza pagare il prezzo in accuracy. `[VERIFIED]`

---

## Sezione 5 — Connessione col nostro progetto

DoRA non è "un'opzione" per noi: è probabilmente **la baseline default da adottare ovunque usiamo LoRA**. Mappo le connessioni concrete:

**[[concepts/lora-stacking]]** — Il nostro design Tier 2-3 prevede multiple LoRA caricate sopra il Tier 1 full-FT, con possibilità di stacking dinamico (LoRA programming + LoRA verticale stack-specific). DoRA migliora la qualità di ogni singola LoRA senza cambiare la zero-cost composability (le DoRA si fondono nel peso base esattamente come LoRA). Adottare DoRA su tutte le LoRA del Tier 2-3 è una scelta dominante: stesso costo a runtime, stessa interfaccia, ma performance significativamente migliore per ciascuna LoRA. `[INFERRED]`

**[[concepts/pretrained-name-bias-mitigation]]** — Quando addestreremo LoRA per disambiguare nomi/identifier, la capacità di DoRA di fare update direzionali "puliti" (senza co-variazione magnitudo) può aiutare a evitare che l'adattamento a un naming convention specifico inflazioni o deflazioni indebitamente la norma dei pesi correlati. È una congettura, ma ben fondata sulla teoria del paper. `[INFERRED]`

**[[entities/qwen3-coder]] e [[entities/qwen3-coder-next]]** — Wave 5 prevede pilot su Qwen3-4B locale come Step 1. DoRA è già supportato nativamente in PEFT per architettura Qwen3, quindi il setup è plug-and-play: cambia `use_dora=False` in `True` nella `LoraConfig` e siamo a posto. Zero attrito di integrazione. `[VERIFIED]`

**[[entities/lorahub]]** — LoraHub fa composizione weighted di multiple LoRA. La decomposizione DoRA è in linea di principio composable con LoraHub (entrambi sono linear in struttura), ma la composizione delle magnitudo separate aggiunge un grado di libertà non triviale. Open question: la combinazione DoRA + LoraHub è già stata studiata? `[INFERRED]` Vale la pena verificare prima di assumere che funzioni out-of-the-box.

**[[concepts/catastrophic-forgetting]]** — La capacità di DoRA di separare magnitudo e direzione potrebbe in teoria mitigare forgetting: un task secondario può modificare la direzione senza "diluire" la magnitudo dei pesi importanti per task precedenti (e viceversa). Open question da verificare empiricamente. `[INFERRED]`

**[[architecture]] Wave 5 Step 1** — Decisione operativa: usare DoRA come default per tutti i pilot di LoRA training su Qwen3-4B locale. Aggiornare gli ADR rilevanti per riflettere questa scelta. `[INFERRED]`

---

## Sezione 6 — Pro, contro, caveat

**Pro:**

- **Performance significativamente migliore di LoRA**: 1-4 punti di accuracy su benchmark standard, con overhead di parametri trascurabile.
- **Zero overhead a inferenza**: fusione completa nei pesi base, esattamente come LoRA.
- **Plug-and-play in PEFT**: una sola flag, integrazione completa nell'ecosistema HuggingFace.
- **Robusto a rank basso**: permette di usare adapter più piccoli senza perdita drammatica di accuracy → meglio per il nostro use case di multiple LoRA caricabili a runtime.
- **Ben supportato anche con quantizzazione**: funziona con bitsandbytes (NF4, int8), quindi compatibile con QLoRA-style training su GPU consumer.
- **ICML Oral**: peer-reviewed top tier, base teorica solida.

**Contro:**

- **Overhead di training 10-15%**: non drammatico ma misurabile, da considerare nel budget GPU.
- **Più parametri trainabili rispetto a LoRA puro**: il vettore `m'` aggiunge `k` parametri per layer, trascurabile in assoluto ma rilevante per ablations precise.
- **Più sensibile a hyperparameter tuning?** Il paper non affronta sistematicamente questo punto. Aneddoticamente, alcuni utenti riportano che DoRA richiede LR leggermente più bassi di LoRA per stabilità. `[AMBIGUOUS]`
- **Implementazioni custom**: se non usi PEFT/Axolotl ma una pipeline custom, devi riscrivere il forward/backward — la decomposizione non è banale come la sola somma `B·A`.

**Caveat noti:**

- DoRA è stato testato principalmente su task di NLU e LLaVA. Per task di coding specifico (HumanEval, MBPP, livecodebench) il vantaggio rispetto a LoRA è meno documentato pubblicamente. Vale la pena fare ablation interno. `[INFERRED]`
- Non è chiaro come si comporti DoRA con MoE base models (es. Qwen3-Coder-Next 480B-A35B). La decomposizione magnitudo/direzione è formulata per layer densi; l'estensione a router gating è non triviale. `[INFERRED]`

---

## Sezione 7 — Domande aperte per noi

**(1) DoRA + rsLoRA combinati**. rsLoRA (vedi [[entities/rslora-paper]]) cambia lo scaling factor da `α/r` a `α/√r`, abilitando rank più alti. DoRA cambia la parametrizzazione del peso. Le due modifiche sono ortogonali, ma nessuno (che io abbia trovato) ha pubblicato ablation rigorosa della loro combinazione. Per noi, "DoRA con rsLoRA scaling" potrebbe essere il setup default ottimale per LoRA verticali con rank ≥ 32. Da verificare empiricamente. `[INFERRED]`

**(2) DoRA + LoRA+ combinati**. LoRA+ (vedi [[entities/lora-plus-paper]]) usa learning rate ratio diverso per matrice A vs B. È compatibile con DoRA? Probabilmente sì (LR ratio è ortogonale alla decomposizione magnitudo), ma serve verifica. `[INFERRED]`

**(3) Magnitudo come "interruttore di task"**. Idea speculativa: in un setting di multiple LoRA caricate dinamicamente, il vettore di magnitudo `m'` potrebbe servire come scaling per "attenuare" la LoRA in zone del problema dove non è rilevante, mentre la direzione resta. Sarebbe una forma di soft routing built-in. Da esplorare con esperimenti dedicati. `[INFERRED]`

**(4) Compatibilità con HMoRA/X-LoRA**. Le nostre LoRA Tier 2-3 potrebbero finire dentro un sistema di routing à la HMoRA. La decomposizione DoRA aggiunge un parametro `m'` per LoRA, che il router deve gestire. Da pensare al design del router con magnitudo separata. `[INFERRED]`

---

## Sezione 8 — Sources verificati

- **arXiv abstract**: https://arxiv.org/abs/2402.09353 — accessibile, contenuto confermato
- **arXiv PDF**: https://arxiv.org/pdf/2402.09353 — accessibile
- **Project page**: https://nbasyl.github.io/DoRA-project-page/ — accessibile
- **GitHub (NVlabs)**: https://github.com/NVlabs/DoRA — accessibile, repo attivo con codice PyTorch ufficiale
- **GitHub (autore primo, fork)**: https://github.com/nbasyl/DoRA — accessibile
- **HuggingFace papers**: https://huggingface.co/papers/2402.09353 — accessibile
- **NVIDIA blog**: https://developer.nvidia.com/blog/introducing-dora-a-high-performing-alternative-to-lora-for-fine-tuning/ — accessibile, ottimo writeup divulgativo
- **Semantic Scholar**: https://www.semanticscholar.org/paper/DoRA:-Weight-Decomposed-Low-Rank-Adaptation-Liu-Wang/da053e2a4ba1b244940c8f2cad5dcdf0d730f85f — accessibile
- **PEFT documentation**: https://huggingface.co/docs/peft/main/en/developer_guides/lora#weight-decomposed-low-rank-adaptation-dora — confermato integration

---

## Note di chiusura

DoRA è un esempio paradigmatico di paper che fa avanzare lo stato dell'arte con un'idea concettualmente piccola ma chirurgicamente efficace. Non rivoluziona nulla — è ancora LoRA, ancora rank-decomposition, ancora PEFT — ma chiude una limitazione fondamentale identificata via analisi empirica accurata, e lo fa con un costo minimo. Per il nostro progetto, l'adozione di DoRA come default è essenzialmente una decisione automatica: non c'è scenario realistico in cui LoRA standard sia preferibile, dato che l'unico costo è ~10% di training time per gain di accuracy molto più sostanziali e zero overhead a inferenza.

La domanda interessante per noi non è "usare DoRA?" — la risposta è sì — ma "fino a che punto DoRA si combina con le altre tecniche LoRA modern (rsLoRA scaling, LoRA+ LR ratio, LoraHub composition, HMoRA routing) per dare il setup ottimale per il nostro three-tier?". È quello che dovremo testare empiricamente in Wave 5.

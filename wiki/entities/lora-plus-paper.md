---
name: lora-plus-paper
description: LoRA+ (Hayou, Ghosh, Yu — ICML 2024) — modifica minima a LoRA che usa learning rate diverso per le matrici A e B (con LR_B = λ · LR_A, λ ≫ 1), ottenendo 1-2% di accuracy in più e fino a 2× speedup di training a costo computazionale identico.
type: paper
entity_type: paper
tags: [paper, peft, lora, fine-tuning, learning-rate, scaling-theory, icml-2024, training-efficiency]
sources:
  - https://arxiv.org/abs/2402.12354
  - https://proceedings.mlr.press/v235/hayou24a.html
  - https://huggingface.co/papers/2402.12354
  - https://soufianehayou.substack.com/p/lora-efficient-low-rank-adaptation
last_updated: 2026-05-21
---

# LoRA+ — Efficient Low Rank Adaptation of Large Models

## Identificativi essenziali

- **Titolo completo**: *LoRA+: Efficient Low Rank Adaptation of Large Models* `[VERIFIED]`
- **Autori**: Soufiane Hayou, Nikhil Ghosh, Bin Yu `[VERIFIED]`
- **Affiliazioni**: Simons Institute (Berkeley), Department of Statistics UC Berkeley `[VERIFIED]`
- **Anno**: 2024 (submission 19 febbraio 2024)
- **arXiv**: [2402.12354](https://arxiv.org/abs/2402.12354) `[VERIFIED]`
- **Venue**: ICML 2024 — Proceedings vol. 235, pp. 17783-17806 `[VERIFIED]`
- **Codice**: integrato in HuggingFace PEFT (parametro `lora_plus_loraplus_lr_ratio`), riferimento in `loraplus` su HF `[VERIFIED]`
- **Status adozione**: implementato in PEFT, ms-swift, Axolotl, LLaMA-Factory, Unsloth

---

## Sezione 1 — Contesto: perché LoRA è (matematicamente) subottimale

LoRA classico tratta le due matrici `A` (giù-proiezione) e `B` (su-proiezione) come simmetriche dal punto di vista dell'ottimizzazione: stesso learning rate, stesso optimizer state, stesso schedule. È un'assunzione che nessuno aveva messo in discussione seriamente perché *sembra* naturale — sono due matrici dello stesso oggetto matematico, perché trattarle diversamente?

Il punto degli autori è che questa simmetria è un'illusione che nasce da come scriviamo le formule, non dalla geometria reale del problema. Quando guardi cosa fanno effettivamente `A` e `B` durante il training, scopri che hanno ruoli profondamente diversi:

- `A ∈ R^{r × k}`: proietta l'input di dimensione `k` (es. 4096) in uno spazio di dimensione `r` (es. 16). Inizializzata gaussianamente.
- `B ∈ R^{d × r}`: rialza l'output dallo spazio di dimensione `r` allo spazio target di dimensione `d` (es. 4096). Inizializzata a **zero** (perché l'inizializzazione canonica di LoRA vuole che `ΔW = B·A = 0` all'inizio, in modo che il modello parta esattamente da `W_pretrained`).

Quella inizializzazione asimmetrica (`A` random, `B = 0`) è la radice del problema. All'inizio del training, `B` è zero, quindi i gradienti di `A` sono zero (perché `dL/dA = B^T · dL/dY · X^T = 0`). Mentre i gradienti di `B` sono *non-zero* e dipendono dalla forward `A·X`. In pratica, all'inizio solo `B` può imparare; `A` resta congelata finché `B` non si è mosso almeno un po'.

Questa asimmetria persiste anche dopo i primi step: gli autori mostrano analiticamente, usando teoria del "infinite-width neural network" (scaling NTK / muP-style), che con learning rate uguali per `A` e `B`, in modelli "large width" (cioè con embedding dimension molto maggiore del rank LoRA, sempre il caso in pratica), il training è **provably suboptimale** — converge a un punto che non è il minimo della loss raggiungibile con la stessa parametrizzazione. `[VERIFIED]`

---

## Sezione 2 — L'idea core di LoRA+

La proposta è ridicolmente semplice: **usa un learning rate diverso per `B` rispetto ad `A`**, con `B` che ha un LR **molto più alto**.

Formalmente:
```
LR_B = λ × LR_A   con λ ≫ 1
```

Nel paper raccomandano `λ ∈ [16, 32]` come default, con `λ = 16` come scelta più robusta in pratica. `[VERIFIED]`

Tutto qui. Nessun nuovo modulo, nessuna nuova matrice, nessuna modifica strutturale a LoRA. Solo due learning rate invece di uno.

Dal punto di vista implementativo, in PyTorch significa creare due gruppi di parametri nell'optimizer:

```python
optimizer = torch.optim.AdamW([
    {"params": lora_A_params, "lr": 1e-4},
    {"params": lora_B_params, "lr": 16e-4},   # 16× più alto
], weight_decay=0.01)
```

L'idea profonda è bilanciare il "feature learning" tra le due matrici. Quando `B` parte da zero, ha bisogno di muoversi più velocemente per recuperare il gap; aumentare il suo LR è il modo più diretto per farlo, e analiticamente questo è esattamente quello che serve per portare il training in un regime ottimale di feature learning.

Gli autori derivano `λ` ottimale come funzione delle dimensioni del modello e del rank, con argomenti di scaling à la muP (Maximum Update Parameterization). La conclusione pratica è che `λ` deve essere proporzionale al rapporto tra embedding dimension e rank, ma in pratica il setting `λ ∈ [16, 32]` funziona robustamente per la stragrande maggioranza dei casi. `[VERIFIED]`

---

## Sezione 3 — Walk-through implementazione

In HuggingFace PEFT l'integrazione è tramite il pacchetto `loraplus`:

```python
from peft import LoraConfig, get_peft_model
from peft.optimizers import create_loraplus_optimizer

config = LoraConfig(r=16, lora_alpha=32, target_modules=[...])
peft_model = get_peft_model(base_model, config)

optimizer = create_loraplus_optimizer(
    model=peft_model,
    optimizer_cls=torch.optim.AdamW,
    lr=1e-4,                # questo è LR_A
    loraplus_lr_ratio=16,   # λ — LR_B = 16 × LR_A = 1.6e-3
    weight_decay=0.01,
)
```

L'optimizer scorre i parametri del peft_model, identifica quelli che appartengono alle matrici `B` (basato sul naming `lora_B`), e li mette in un parameter group con LR moltiplicato per `λ`. Il resto del training loop resta identico.

In Axolotl/LLaMA-Factory è ancora più trasparente: una singola riga di configurazione `loraplus_lr_ratio: 16` attiva il comportamento.

---

## Sezione 4 — Risultati e benchmark

Dal paper: `[VERIFIED]`

**Setup principale**: LLaMA-2 7B/13B, RoBERTa, GPT-2, vari benchmark (GLUE, MMLU, math, instruction following).

**Performance gain**: tipicamente **+1-2% di accuracy** rispetto a LoRA classico con stessi iperparametri (eccetto `λ`).

**Training speedup**: **fino a 2× più veloce** a raggiungere la stessa accuracy target. Cioè se LoRA classico raggiunge 70% accuracy in 10000 step, LoRA+ ci arriva in ~5000 step.

**Costo computazionale**: **identico a LoRA**. Stessi parametri, stesso forward, stesso backward. L'unica differenza è in due numeri nell'optimizer config.

**Robustezza di λ**: gli autori mostrano che la performance è relativamente flat per `λ ∈ [8, 64]`, con un sweet spot intorno a 16. Sotto 4 si perde gran parte del vantaggio, sopra 128 il training diventa instabile.

**Compatibilità**: testato in combinazione con AdamW (default), Adam, SGD. Funziona con tutti.

Una osservazione importante (e talvolta sottovalutata): il guadagno di LoRA+ è **maggiore** quando il modello base è più grande. Su LLaMA-2 13B il gain è più marcato che su 7B. Questo è coerente con l'analisi teorica: l'asimmetria diventa più severa al crescere dell'embedding dimension rispetto al rank. Per noi che scaleremo da Qwen3-4B a Qwen3.6-35B-A3B target, questo significa che LoRA+ probabilmente darà beneficio crescente. `[INFERRED]`

---

## Sezione 5 — Connessione col nostro progetto

**[[entities/dora-paper]]** — DoRA e LoRA+ sono ortogonali. DoRA modifica la parametrizzazione del peso (decomposizione magnitudo/direzione), LoRA+ modifica l'ottimizzatore (LR ratio). In linea di principio si possono combinare: usi DoRA come parametrizzazione e applichi LR ratio diverso per `A` e `B` dentro la componente direzionale. La combinazione DoRA + LoRA+ non è stata, a mia conoscenza, oggetto di ablation rigoroso pubblicato, ma è teoricamente sound. Vale la pena come ablation early di Wave 5. `[INFERRED]`

**[[concepts/lora-stacking]]** — Quando addestriamo multiple LoRA verticali per il Tier 3, ogni training run beneficia indipendentemente di LoRA+. Il setup è identico tra LoRA (modifica solo LR ratio in optimizer config). Adozione automatica per tutti i pilot. `[INFERRED]`

**[[architecture]] Tier 2 LoRA Programming** — Il LoRA Tier 2 è quello che addestreremo per primo (potenzialmente milioni di token di codice). Il 2× speedup di LoRA+ significa potenzialmente dimezzare il wall-clock time, traducendosi in più iterazioni di ablation possibili nello stesso compute budget. È strategicamente importante. `[INFERRED]`

**[[concepts/scuola-learning-philosophy]]** — Filosoficamente, LoRA+ è interessante perché incarna il pattern "fix what's structurally broken, don't add complexity". Non aggiunge moduli, non cambia l'algoritmo — corregge un'assunzione implicita sbagliata. Allinea bene con la nostra preferenza per soluzioni minimaliste invece di stack complicati. `[INFERRED]`

**[[concepts/pretrained-name-bias-mitigation]]** — Per task dove l'adattamento richiede di "spostare" abbastanza i pesi (e.g., riscrivere il pattern di naming bias del pretrained), il 2× speedup permette di provare più training run più velocemente, abilitando esplorazione di hyperparam space più ampia. `[INFERRED]`

---

## Sezione 6 — Pro, contro, caveat

**Pro:**

- **Costo zero a inferenza**: come LoRA, nessun overhead.
- **Costo zero a training compute**: stessi FLOPs di LoRA.
- **Implementazione triviale**: due righe nell'optimizer config.
- **Speedup reale a wall-clock**: fino a 2× per raggiungere lo stesso target.
- **Analisi teorica solida**: derivazione da scaling theory, non è un trick empirico.
- **Robusto a `λ`**: sweet spot ampio, non serve hyperparameter tuning estensivo.
- **Compatibile con tutto**: DoRA, QLoRA, multi-LoRA, qualsiasi optimizer.

**Contro:**

- **Non risolve i limiti strutturali di LoRA**: il gap con full FT resta, è solo "LoRA fatto meglio". Per superare full FT serve altro (DoRA, full FT su Tier 1, ecc.).
- **Trick di ottimizzazione, non architetturale**: chi cerca innovazione concettuale resta a bocca asciutta. Detto da chi vuole solo i risultati: ottimo. Detto da chi vuole capire perché funziona: la motivazione c'è ma è densa di teoria NTK/muP.
- **Documentazione frammentata**: l'integrazione PEFT è recente e i documenti talvolta non sono sincronizzati. Il blog dell'autore (Substack) è la risorsa più chiara.

**Caveat noti:**

- Con `λ` troppo alto (≥128) il training può diventare instabile, soprattutto con LR base alto. Iniziare conservativi.
- La derivazione teorica assume "large width" (embedding dim ≫ rank). Per modelli molto piccoli (e.g. <1B) o rank molto alti (≥256) il vantaggio potrebbe ridursi.
- Non è chiaro come `λ` debba scalare con quantizzazione aggressiva (QLoRA 4-bit). La pratica suggerisce che `λ = 16` resta safe ma è possibile servire calibrazione fine. `[AMBIGUOUS]`

---

## Sezione 7 — Domande aperte per noi

**(1) DoRA + LoRA+ combinato — qual è il `λ` ottimale?** DoRA cambia la dinamica di `A` e `B` per via della normalizzazione; potenzialmente il `λ` ottimale dentro DoRA è diverso da quello dentro LoRA classico. Servono ablation specifiche. Costo: 2-3 piccoli training run su Qwen3-4B. `[INFERRED]`

**(2) Interaction con rsLoRA scaling**. rsLoRA cambia lo scaling factor `α` da `1/r` a `1/√r`. Questo cambia la magnitudo dell'output `B·A`, e potenzialmente cambia anche il `λ` ottimale. Ablation congiunta da pianificare. `[INFERRED]`

**(3) `λ` per training di LoRA verticali piccole (Tier 3)**. Per LoRA di pochi parametri (rank 4-8) su dataset specifici e piccoli, `λ = 16` potrebbe essere troppo aggressivo. Servirebbe esplorare `λ ∈ [4, 8, 16]` per le LoRA verticali. `[INFERRED]`

**(4) LoRA+ in setting MoE**. Con modelli MoE come Qwen3-Coder-Next, le LoRA possono essere applicate al gating o agli expert. La dinamica di training in queste configurazioni potrebbe richiedere `λ` diverso per gating vs expert. Aperto. `[INFERRED]`

---

## Sezione 8 — Sources verificati

- **arXiv abstract**: https://arxiv.org/abs/2402.12354 — accessibile
- **arXiv PDF**: https://arxiv.org/pdf/2402.12354 — accessibile
- **PMLR proceedings (ICML 2024)**: https://proceedings.mlr.press/v235/hayou24a.html — accessibile
- **HuggingFace papers**: https://huggingface.co/papers/2402.12354 — accessibile
- **Soufiane Hayou blog (autore)**: https://soufianehayou.substack.com/p/lora-efficient-low-rank-adaptation — accessibile, ottima spiegazione divulgativa
- **PEFT integration docs**: https://huggingface.co/docs/peft/main/en/package_reference/loraplus — accessibile
- **Semantic Scholar**: https://www.semanticscholar.org/paper/LoRA+:-Efficient-Low-Rank-Adaptation-of-Large-Hayou-Ghosh — accessibile

---

## Note di chiusura

LoRA+ è un esempio della categoria "fix gratis": prendi un setup esistente, cambi due numeri, ottieni 1-2% di accuracy e 2× di speedup. Costo: zero. Rischio: zero (se `λ` resta nel range raccomandato). Per il nostro progetto è essenzialmente un default obbligato: chiunque addestri LoRA senza usare LoRA+ sta sprecando tempo e accuracy a parità di compute. La combinazione DoRA + LoRA+ + rsLoRA (per rank alti) sembra essere il setup "modern LoRA stack" che dovremmo adottare di default dal Wave 5 in poi, modulo ablation specifiche per validare le interazioni reciproche.

L'aspetto più educativo del paper non è la tecnica in sé ma la metodologia: gli autori hanno guardato un setup standardissimo, hanno fatto un'analisi teorica seria, hanno identificato un'assunzione sbagliata implicita, e l'hanno corretta. È esattamente lo spirito che vogliamo applicare al nostro lavoro — non cercare innovazione per il gusto di farlo, ma trovare gli "assunti tacit" subottimali nello stack esistente e correggerli.

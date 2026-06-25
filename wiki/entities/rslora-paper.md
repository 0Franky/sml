---
name: rslora-paper
description: rsLoRA (Damjan Kalajdzievski, 2023) — A Rank Stabilization Scaling Factor for Fine-Tuning with LoRA. Cambia lo scaling factor LoRA da α/r a α/√r, eliminando il "gradient collapse" che impedisce a LoRA di scalare oltre rank molto bassi.
type: paper
entity_type: paper
tags: [paper, peft, lora, fine-tuning, scaling-factor, rank-stabilization, gradient-collapse, rslora, rank-scaling]
sources:
  - https://arxiv.org/abs/2312.03732
  - https://huggingface.co/papers/2312.03732
  - https://medium.com/scb10x/rank-stabilized-lora-rslora-c844dee7f6a1
last_updated: 2026-05-21
---

# rsLoRA — A Rank Stabilization Scaling Factor for Fine-Tuning with LoRA

## Identificativi essenziali

- **Titolo completo**: *A Rank Stabilization Scaling Factor for Fine-Tuning with LoRA* `[VERIFIED]`
- **Autore**: Damjan Kalajdzievski (single-author) `[VERIFIED]`
- **Affiliazione**: ServiceNow Research `[VERIFIED]`
- **Anno**: 2023 (submission 28 novembre 2023)
- **arXiv**: [2312.03732](https://arxiv.org/abs/2312.03732) `[VERIFIED]`
- **Codice**: integrato in HuggingFace PEFT (`use_rslora=True` in `LoraConfig`) `[VERIFIED]`
- **Status di adozione**: implementato in PEFT, Axolotl, ms-swift, LLaMA-Factory, Unsloth

---

## Sezione 1 — Contesto: il "rank ceiling" tacito di LoRA

C'è una cosa strana che chiunque abbia addestrato LoRA seriamente ha notato: alzare il rank non aiuta quanto dovrebbe. La teoria base direbbe: più rank → più parametri trainabili → più espressività → più accuracy. Empiricamente, invece, il pattern è "rank 8 va bene, rank 16 va leggermente meglio, rank 32 plateau, rank 64+ spesso *peggiora* o resta uguale". La community ha vissuto con questa anomalia per anni, accettandola come "non ne vale la pena alzare rank, costa di più e non rende".

Il paper di Kalajdzievski mostra che questa anomalia non è una proprietà fondamentale di LoRA — è un **bug nello scaling factor**. E il fix è una riga di codice.

Per capirlo, ricordiamo che l'output di LoRA non è semplicemente `B·A·x` ma:

```
ΔW · x = (α / r) · B · A · x
```

dove `α` è un iperparametro (spesso `α = r`, oppure `α = 2r`) e `r` è il rank. Il fattore `α/r` è uno scaling che (intuitivamente) controlla l'intensità dell'update LoRA rispetto al peso base. Quando alzi `r`, mantenendo `α = r` (default), il fattore `α/r = 1` non cambia. Sembra ragionevole.

Il punto del paper è che `α/r` è lo scaling sbagliato. Analiticamente, gli autori mostrano che con lo scaling `α/r` la *norm* dell'output `ΔW·x` decresce come `1/√r` al crescere di `r`. Cioè più aumenti il rank, meno la LoRA influenza il modello, in un modo asintotico che spiega esattamente perché rank alti danno gradiente effettivo sempre più piccolo (il famoso "gradient collapse"). I gradienti che arrivano ad `A` e `B` diventano vanishingly small, e l'optimizer non riesce a fare update sostanziali.

Il risultato pratico: LoRA con rank 64 ha *meno* learning effettivo di LoRA con rank 8, anche se ha 8× più parametri. Questa è la radice dell'anomalia che la community aveva osservato. `[VERIFIED]`

---

## Sezione 2 — L'idea core di rsLoRA

La proposta è cambiare lo scaling factor da `α/r` a `α/√r`:

```
ΔW · x = (α / √r) · B · A · x      (rsLoRA)
```

invece del classico:

```
ΔW · x = (α / r) · B · A · x       (LoRA originale)
```

Questo cambio porta l'output `ΔW·x` ad avere norma costante rispetto a `r`, eliminando il decay. Analiticamente (gli autori derivano questo con argomenti di "rank stability analysis", una versione semplificata della teoria muP applicata a LoRA), `α/√r` è l'unico scaling che mantiene la dinamica di feature learning *invariante rispetto al rank*. `[VERIFIED]`

Da questo segue una proprietà importantissima: **con rsLoRA, alzare il rank ora migliora effettivamente la performance**, perché il gradiente non collassa. Il "rank ceiling" empirico sparisce.

Il fix è banale, una sola riga nel codice del forward pass LoRA:

```python
# LoRA classico:
output = x + (alpha / rank) * x @ A.T @ B.T

# rsLoRA:
output = x + (alpha / math.sqrt(rank)) * x @ A.T @ B.T
```

Niente nuovi parametri, niente nuova memoria, niente nuovo compute. Solo `sqrt(r)` invece di `r` al denominatore.

---

## Sezione 3 — Walk-through implementazione

In PEFT:

```python
from peft import LoraConfig, get_peft_model

config = LoraConfig(
    r=64,                  # rank alto, ora ha senso usarlo
    lora_alpha=128,        # solo un riferimento, viene rinormalizzato
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    use_rslora=True,       # <-- l'unica differenza
    task_type="CAUSAL_LM",
)

peft_model = get_peft_model(base_model, config)
```

Internamente PEFT cambia il calcolo dello scaling da `alpha/r` a `alpha/sqrt(r)`. È completamente trasparente al resto del training loop.

**Nota sull'`alpha`**: con rsLoRA il default raccomandato è spesso `alpha = 16` o `alpha = 32` indipendentemente da `r`, perché lo scaling effettivo è ora `alpha/sqrt(r)` invece di `alpha/r`. Cioè con r=64, alpha=16 → effective scale = 16/8 = 2, che è ragionevole. Vale la pena fare ablation su questo parametro perché le best practice non sono ancora completamente standardizzate. `[INFERRED]`

---

## Sezione 4 — Risultati e benchmark

Dal paper: `[VERIFIED]`

**Setup**: confronto LoRA standard vs rsLoRA, vari rank (`r ∈ {2, 4, 8, 16, 32, 64, 128, 256}`), modello base LLaMA-7B fine-tuned su dataset di istruzioni.

**Risultato principale**: per `r ≤ 16`, LoRA e rsLoRA si comportano in modo simile (le differenze emergono ma sono piccole). Per `r > 32`, la divergenza diventa drammatica: rsLoRA continua a migliorare con rank crescente, LoRA standard plateau o peggiora.

**Compute/performance trade-off**: rsLoRA offre un trade-off prima non disponibile — puoi spendere più compute (rank più alti) per ottenere performance più vicine a full fine-tuning, mantenendo l'efficienza a inferenza di LoRA (fusione possibile, zero overhead). Con LoRA standard questo trade-off non esiste: alzare rank non rende.

**Speed/memory cost**: rank alti richiedono più memoria (proporzionale a `r`) e leggermente più compute durante training (anche proporzionale a `r`). A inferenza, però, dopo fusione `W_eff = W_base + B·A`, il modello è identico in compute al base.

**Casi d'uso ideali**: rsLoRA brilla quando vuoi qualità "quasi full FT" senza la memoria/compute di full FT. Per task di adattamento heavy (es. shift di dominio significativo, multi-task fine-tuning con molti task), rank 64-128 con rsLoRA può essere il sweet spot. Per adattamenti leggeri (es. instruction tuning su dominio simile al pretrained), rank 8-16 basta e rsLoRA non aggiunge molto. `[INFERRED]`

---

## Sezione 5 — Connessione col nostro progetto

**[[entities/dora-paper]]** — DoRA modifica la parametrizzazione del peso, rsLoRA modifica lo scaling factor. Ortogonali. La combinazione **DoRA + rsLoRA + LoRA+** è il "modern stack" della community PEFT, e probabilmente dovrebbe essere il nostro default. Ablation specifica da fare in Wave 5 per verificare che il guadagno sia additivo (non è garantito a priori). `[INFERRED]`

**[[entities/lora-plus-paper]]** — LoRA+ cambia LR ratio tra A e B. Anche qui ortogonale a rsLoRA, in linea di principio combinabili senza interferenza. `[INFERRED]`

**[[concepts/lora-stacking]]** — Per LoRA stacking il rank conta molto. Se vogliamo combinare 5+ LoRA verticali Tier 3 sopra un Tier 2 programming, ogni LoRA dovrebbe avere rank moderato (8-16) per evitare memory blowup. In questo regime, rsLoRA è "neutrale": gain modesti a rank bassi. Diventa importante invece quando addestreremo Tier 2 programming generalist, dove vorremo rank più alti (64-128) per coprire un dominio ampio. `[INFERRED]`

**[[concepts/pretrained-name-bias-mitigation]]** — Per il bias removal task, ipotizziamo possa servire rank alto per catturare le tante "direzioni di bias" da spostare. rsLoRA abilita questo senza degradare la performance. È un setting candidato per pilot dedicato. `[INFERRED]`

**[[architecture]] Tier 1 vs Tier 2** — Decisione strategica: Tier 1 = full FT (decisione already made, vedi MEMORY). Tier 2 = LoRA con rank elevato (32-64?) + rsLoRA + DoRA + LoRA+ = "stack moderno completo". Tier 3 = LoRA piccole, focused, rank 4-8, dove rsLoRA è opzionale ma non dannoso. `[INFERRED]`

**[[entities/hmora]] e [[entities/x-lora]]** — Questi sistemi di routing LoRA aggregano output di multiple LoRA. Con rsLoRA, gli output di LoRA a rank diverso hanno magnitudo confrontabile (per costruzione), quindi la combinazione weighted è più stabile. Vantaggio potenzialmente significativo per setup multi-LoRA orchestrati. `[INFERRED]`

---

## Sezione 6 — Pro, contro, caveat

**Pro:**

- **Fix gratis di un'anomalia fondamentale**: alza il rank ceiling effettivo di LoRA da ~16 a 256+, abilitando un range di trade-off prima non accessibile.
- **Zero overhead a inferenza**: stesso fusion di LoRA standard.
- **Una riga di codice**: in PEFT è una flag.
- **Compatibile con tutto**: DoRA, LoRA+, QLoRA, MoE.
- **Analisi teorica solida**: derivato da rank stability analysis, non è un trick empirico.

**Contro:**

- **A rank bassi (≤16) il vantaggio è marginale**: se non hai bisogno di rank alti, rsLoRA non ti cambia la vita.
- **Più memoria/compute a training con rank alti**: il vantaggio teorico c'è solo se sei disposto a spendere il compute. Per addestrare rank 128, il training prende ~8-10× più memoria GPU rispetto a rank 16.
- **Best practice su `alpha` non ancora standardizzate**: la community sta ancora convergendo sui default ottimali per `alpha` con rsLoRA. Aspettati di dover fare un po' di hyperparameter tuning.

**Caveat noti:**

- Il paper testa solo modelli densi. Per modelli MoE (Mixtral, Qwen3-Coder-Next) il comportamento a rank alti non è documentato. `[INFERRED]`
- Per task molto easy (poco shift di dominio), rsLoRA con rank alto è overkill — preferire LoRA standard con rank basso.
- Interazione con quantizzazione: rsLoRA + QLoRA 4-bit ha pochi benchmark pubblici. Probabile che funzioni ma servono verifiche. `[AMBIGUOUS]`

---

## Sezione 7 — Domande aperte per noi

**(1) Rank ottimale per Tier 2 programming generalist**. Con rsLoRA disponibile, possiamo sondare rank ∈ {32, 64, 128, 256} senza la garanzia che "tanto rank alto plateau". Quale è il sweet spot? Esperimento canonico da fare in Wave 5: un singolo dataset di coding (es. CodeAlpaca-EVOL), training con rsLoRA a rank crescenti, plot accuracy vs rank vs compute. `[INFERRED]`

**(2) Combinazione DoRA + rsLoRA**. La normalizzazione DoRA potrebbe interagire non-banalmente con lo scaling factor rsLoRA. Servono ablation. Costo: 2-3 piccoli run. `[INFERRED]`

**(3) rsLoRA per LoRA verticali ad-hoc**. Per le LoRA Tier 3 (verticali, addestrate on-demand su domain specifici), il rank ottimale è probabilmente basso (4-8). rsLoRA non aiuta in questo regime, ma non danneggia. Default: attiva sempre, costo zero. `[INFERRED]`

**(4) Threshold di rank dove rsLoRA inizia a contare**. Empiricamente, il paper mostra divergenza a `r ≥ 32`. Per i nostri use case specifici (coding, dominio narrow vs wide), dove è la nostra soglia? Da misurare. `[INFERRED]`

---

## Sezione 8 — Sources verificati

- **arXiv abstract**: https://arxiv.org/abs/2312.03732 — accessibile
- **arXiv PDF**: https://arxiv.org/pdf/2312.03732 — accessibile
- **HuggingFace papers**: https://huggingface.co/papers/2312.03732 — accessibile
- **PEFT documentation**: https://huggingface.co/docs/peft/main/en/developer_guides/lora#rank-stabilized-lora — accessibile
- **Medium writeup (SCB 10X)**: https://medium.com/scb10x/rank-stabilized-lora-rslora-c844dee7f6a1 — accessibile, buona spiegazione applicativa
- **Author profile (arXiv)**: https://arxiv.org/search/?searchtype=author&query=Damjan+Kalajdzievski — accessibile

---

## Note di chiusura

rsLoRA è il classico paper "una riga, grande effetto". Il valore non è tanto nella complessità della soluzione (banale) quanto nella diagnosi rigorosa del problema. Per anni la community ha vissuto con l'anomalia "rank alti non rendono" senza chiedersi *perché*. Kalajdzievski l'ha analizzata, ha trovato il bug nello scaling factor, e l'ha sistemato.

Per il nostro progetto, l'adozione di rsLoRA come default per Wave 5 è una decisione facile: costo zero, downside zero, upside reale ogni volta che lavoreremo con rank > 16. La combinazione del "modern LoRA stack" — DoRA + LoRA+ + rsLoRA — è probabilmente il setup base che dovremmo usare come punto di partenza per ogni nuovo LoRA training, con le ablation specifiche che decideranno se vale la pena rimuovere uno dei tre per il task corrente.

L'aspetto educativo è importante: i paper più impattanti spesso non sono quelli che inventano architetture nuove, ma quelli che identificano errori sottili in setup standardizzati. È un pattern che vogliamo emulare quando faremo le nostre proprie analisi del comportamento del modello.

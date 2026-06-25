---
name: runtime-symbol-randomization-training
description: Training regime che separa knowledge immutabile (memorizzato) da knowledge variabile (skill di citare dal contesto via simboli random).
type: concept
tags: [concept, training, data-augmentation, attention, symbol-grounding, in-context-learning, induction-heads]
sources: [user notes 2026-05-21 grill-me discussion]
last_updated: 2026-05-21
---

# Runtime Symbol Randomization Training

## Idea ground truth (utente, 2026-05-21)

> "Stavo pensando di creare un training set runtime dove possibile. Formule matematiche e fisiche, cose che sono oggettive e non possono cambiare vanno con addestramento normale e loss minimization. Mentre codici, strutture, e cose dinamiche, vengono sempre create runtime con nomi random — l'idea è quella di far concentrare il modello sulle parti fisse e immutabili da quelle variabili, inoltre non vedendo mai due volte lo stesso esempio, addestra l'attention a essere chirurgica nel ricopiare i nomi delle variabili esatte per non sbagliare e produrre codice corretto."

Esempio canonico utente: forniamo nello script del prompt definizioni di funzioni con nomi random (es. `frx_q9z`, `tmp_kk2`, `xyz_var`), poi chiediamo "crea una funzione switch che richiama `frx_q9z` quando condizione A, `tmp_kk2` quando B, `xyz_var` quando C". Il modello deve copiare esattamente quei nomi.

## Principio epistemico

Il dataset di training è separato in **due regimi** in base alla **natura epistemica** del contenuto:

| Tipo | Esempio | Strategia training | Effetto desiderato |
|---|---|---|---|
| **Immutabile / oggettivo** | F=m·a, identità matematiche, leggi fisiche, fatti storici, definizioni canonical | Standard CE loss, **esempi fissi**, **ripetizione N volte** | Memorizzazione in-weight (knowledge "che il modello sa") |
| **Variabile / strutturale** | Codice, sintassi, pattern di flusso, nomi di simboli | **Generato runtime con nomi random**, **mai due volte uguale**, sequenziale senza ripetizione | Astrazione della **forma**, NON dell'istanza. Skill di citare dal contesto |

### Chiarimento utente su memorization vs skill

> "Il training non è di prediction? Ovvero memorizzazione? Qua [nel regime variabile] non deve memorizzare variabili, deve solo capire come copiare i nomi delle variabili, poi con RL capisce come dare forma a queste variabili con nomi comprensibili. Deve avere il concetto di variabile e l'abilità di pensarla e referenziarla copiando il suo nome, skill sviluppata durante il training."

Distinzione critica:
- **Concetto astratto di "variabile"** → va memorizzato nei pesi (universale)
- **Skill di referenziare per nome esatto** → va appresa come capability di lettura dal contesto
- **Nome specifico di una variabile** → NON va mai memorizzato (cambia ogni sample)

## Meccanismo di forza dell'attention

Quando il modello vede:
- Sample 1: `def frx_q9z(): ...` poi nel target `switch case 1: frx_q9z()`
- Sample 2: `def amx_p3y(): ...` poi nel target `switch case 1: amx_p3y()`
- Sample 3: `def vzw_8k1(): ...` poi nel target `switch case 1: vzw_8k1()`
- ...

L'unico modo per minimizzare loss è **aprire un'induction head** che copia il simbolo dal contesto. Memorization è impossibile (vocab random infinito). Quindi:
- Attention impara a essere **chirurgica nel copy** dal contesto
- Modello impara la **forma del switch statement** (pattern strutturale) separata dall'**istanza dei nomi**

## Riferimenti scientifici

| Lavoro | Cosa fa | Differenza dal nostro |
|---|---|---|
| **Olsson et al. 2022, "In-context Learning and Induction Heads" (Anthropic)** | Identifica meccanismi di "induction heads" che fanno copy dal contesto | Studio meccanistico, non training regime esplicito |
| **Tobin et al. 2017, "Domain Randomization"** | RL agent vede scene random ogni episodio | Applicato a vision/robotica, non a code |
| **Kaushik et al. 2020, "Counterfactual Data Augmentation"** | Cambia entità in NLU dataset | Augmentation passiva, non runtime |
| **CodeBERT / GraphCodeBERT / UnixCoder** | Variable renaming come augmentation | Augmentation, non regime di training separato per fisso vs variabile |
| **AlphaGeometry (Trinh et al. 2024)** | Synthetic geometry problems generati programmaticamente | Problem-solving, non skill di copy |
| **SCAN, Lake & Baroni 2018** | Test compositionality con simboli mai visti | Test setup, non training regime |

**Originalità del nostro approccio**:
1. Separazione **esplicita e deliberata** fisso/variabile come **regime di dataset design**, non augmentation
2. Combinazione con architettura three-tier (specie Tier 2-3 LoRA coding)
3. Pipeline producer/consumer **runtime async** (cache che si riempie mentre training consuma — vedi [[pipeline-architecture-data-generation]])
4. Bridge con post-training RL per "imparare a creare nomi belli" dopo aver imparato a "copiare nomi"

Possibile claim paper-worthy come **3° gap** oltre ai 2 già identificati ([[../decisions/2026-05-21-vision-clarification]]).

## Scope di applicazione (chiarito 2026-05-21)

Si applica **a tutti i tier**, con distinzione fisso/variabile per ciascuno:

| Tier | Fisso (memorizzato) | Variabile (random runtime) |
|---|---|---|
| **Tier 1 — Organization** | Tag strutturali (`<aim>`, `<state>`, `[V]/[A]/[?]`), parole di safety reasoning, marker di criticità | **Nomi di task, nodi di plan, asset id**, contenuti dei file, paths, timestamps |
| **Tier 2 — Programming generalist** | Keyword di linguaggio (`for`, `if`, `def`, `class`), pattern strutturali, best practices | Nomi variabili, funzioni, classi, identificatori |
| **Tier 3 — Verticali** | Sintassi framework (`useState`, `app.get`, `db.query`), pattern idiomatici | Nomi user-defined, parametri custom, valori specifici |

## Pipeline di generazione (chiarito 2026-05-21)

**Ibrido programmatico + teacher model + cache asincrona** — vedi [[pipeline-architecture-data-generation]] per dettagli.

In sintesi:
- Process A (generator) produce esempi runtime in loop, deposita in cache disk/queue
- Process B (trainer) consuma dalla cache:
  - Esempi **fissi** (formule, fatti): ripetuti N volte da un set memorizzato
  - Esempi **variabili** (codice random): letti sequenzialmente dalla cache, mai ripetuti
- A genera mentre B consuma — quando cache ha cuscino sufficiente, B parte; A continua a produrre

## Considerazioni tecniche

### Reserved keywords del linguaggio

Generatore deve essere **language-aware**: nomi random NON possono collidere con `for`, `if`, `class`, builtin functions, ecc. Implementazione: blacklist per linguaggio + check al momento della generazione.

### Tokenizer impact

Nomi random tipo `frx_q9z` producono tokenization "lunga" (3-5 token vs 1-2 per nomi naturali). Per evitare che il modello impari a essere meno fluente nel produrre nomi naturali:

- **Non è un problema serio** (chiarimento utente): il modello sarà **general purpose**, avrà letto e studiato testi normali nel pretraining → conoscerà nomi naturali per costruzione
- **Post-training via RL + buone pratiche**: insegna al modello a generare nomi comprensibili a colpo d'occhio
- Quindi il regime random serve SOLO a forzare attention surgical nel copy, non a "scrivere bene"

### Vocabolario random sufficientemente grande

Per evitare statistical memorization (se la random distribution è limitata, il modello può fare statistic memorization indiretta):
- Generatore deve attingere a vocabolario di simboli **molto grande** (es. millions di permutazioni)
- Combinazione di prefissi + suffissi random + numeri random

#### Sub-strategia: HASH-based naming (suggerimento utente 2026-05-21)

L'utente ha proposto: invece di generare nomi random naive, usare **hash function** per produrre identifier deterministici-ma-unici.

Pipeline proposta:

```python
def hash_name(seed: any, length: int = 8) -> str:
    """Genera nome univoco da seed (counter, timestamp, sample_id)."""
    import hashlib
    h = hashlib.sha256(str(seed).encode()).hexdigest()
    return f"v_{h[:length]}"  # es. "v_a3f8b2c1"

# Uso
sample_id = 12345
n_vars = 5
names = [hash_name(f"{sample_id}_{i}") for i in range(n_vars)]
# ['v_4b9d2c1a', 'v_7e3f8a2b', 'v_9c1d4e5f', ...]
```

**Analisi della proposta**:

Pro:
- **Zero collision** garantita (hash space ~16^64)
- **Deterministic per seed** → reproducibility nel training (stesso seed = stesso sample)
- **Distribuzione uniforme** nel hash space (no statistical leak da pattern del generatore)
- **Replay possible** (seed salvato → ricostruisci dataset)

Contro:
- Hash output è **molto lontano dalla distribuzione naturale** dei nomi di codice. Token tokenization peggiore (es. `v_a3f8b2c1` = ~5 token vs nomi naturali ~1-2 token)
- Modello vede sempre prefisso `v_` o pattern simile → potrebbe imparare a riconoscerlo come "variabile" facilitating skill, ma anche limitando generalizzazione
- Hash truncated ha collision rate teorico (con 8 chars hex, ~16^8 = 4 miliardi possibili → collisioni con 10K-100K sample sono rare ma possibili)

**Verdetto**: hash è **complementare**, non sostitutivo. Strategia ibrida:

```python
def generate_identifier(strategy: str, seed: any) -> str:
    if strategy == "hash":
        return hash_name(seed)  # 30% sample
    elif strategy == "wordlike":
        return random_consonant_vowel_pattern(seed)  # 30% sample
    elif strategy == "snake_case_natural":
        return random_natural_phrase(seed)  # 20% sample
    elif strategy == "camel_case_natural":
        return random_camel_case(seed)  # 10% sample
    elif strategy == "single_letter":
        return random_single_letter(seed)  # 10% sample (per task scientifici tipo math)
```

Mix di strategie copre più "shapes" di identifier reali e previene shortcut learning sul pattern del generatore.

### Cross-language

Pattern funziona per Python, TypeScript, Rust, ecc. Generatore va separato per linguaggio (AST/parser language-specific).

### Codebase-grounded random renaming (idea utente 2026-05-21)

Estensione importante alla generazione random: invece di template programmatici, **prendere codebase reali esistenti e applicare rename random su tutti gli identifier**.

L'utente ha proposto:

> "Forma del task fissa, contenuto random ≠ astrazione vera → infatti non deve fare solo switch, prendiamo una codebase già definita e la adattiamo con la produzione di nomi random, così potremmo anche mostrare poche volte gli stessi esempi ma non avranno mai stessi nomi."

**Pipeline proposta**:

1. **Sorgenti**: The Stack v2 filtered, OSS-Instruct, Magicoder, repo curated GitHub
2. **AST-level renamer** (per linguaggio):
   - Python: usa `ast` module + `astor` per re-emit, o `libcst`
   - TypeScript: usa `ts-morph` o `@babel/parser`
   - Rust: usa `syn` crate
3. **Renaming rules**:
   - Rinomina tutte le variabili user-defined
   - Rinomina functions user-defined
   - Rinomina classes user-defined
   - **NON** rinomina builtin, imports da librerie, magic methods, language keywords
4. **Output**: stesso file, semanticamente identico, con nomi random

**Esempio Python**:

```python
# ORIGINAL (da The Stack v2)
def calculate_user_age(birth_date, current_date):
    age = current_date.year - birth_date.year
    if (current_date.month, current_date.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age

# DOPO renaming (hash-based, sample_id=42)
def v_4b9d2c1a(v_7e3f8a2b, v_9c1d4e5f):
    v_a1b2c3d4 = v_9c1d4e5f.year - v_7e3f8a2b.year
    if (v_9c1d4e5f.month, v_9c1d4e5f.day) < (v_7e3f8a2b.month, v_7e3f8a2b.day):
        v_a1b2c3d4 -= 1
    return v_a1b2c3d4
```

**Pro di questo approccio**:
- **Distribuzione realistica** della forma del codice (task, struttura, edge case) — è codice reale
- **Diversità del task**: switch statement è solo uno dei mille pattern. Codebase reali coprono refactoring, classi, decoratori, async, comprehension, error handling, ecc.
- **Stesso esempio mostrato N volte ma con N nomi diversi** — il modello vede la stessa logica ma non può memorizzare nomi
- Generator complessità: AST renamer + sample diversification

**Contro**:
- AST rewriting non triviale per linguaggi complessi (Python con metaclass, TypeScript con generics)
- Alcune libraries reali richiedono nomi specifici (es. Django ORM `Meta`, framework conventions) → blacklist preservare
- Linting può rompersi (type checker non capisce nomi random) → o disable linter, o usare PEP 695 generics

**Implementazione**:
- Skill `aris-experiment-plan` per progettare ablation
- Skill `mcp__plugin_serena_serena__find_symbol` + `replace_symbol_body` per rename automatizzato runtime
- Tree-sitter universale per AST cross-language

**Da decidere**:
- Ratio "template-generated" vs "codebase-grounded rename" — probabilmente 30%/70%
- Quanti codebase di partenza (1000 repo? 10000?)
- Renaming intensity: rename TUTTI gli identifier o solo subset (es. lasciare i nomi top-30% più comuni come "user", "id", "data")?

### Difficoltà training curve

Loss curve all'inizio sarà peggiore di training su nomi naturali (no semantic prior). Convergenza più lunga. **Accettato come trade-off** per ottenere skill di copy chirurgico.

## Mix con dati natural

Da decidere durante curation dataset (vedi [[../decisions/2026-05-21-training-philosophy-roadmap]]). Probabilmente:
- 60-80% sample con nomi random (per skill di copy)
- 20-40% sample con nomi naturali (per fluency + naming via RL feedback)
- Esatto bilanciamento da validare empiricamente con ablation

## Relazione con altri concept

- [[_user-notes-2026-06-23]] (nota 3 — awareness prompt) — dichiarare al modello che i nomi random sono un **anti-pattern valido SOLO per il training**; chiude il rischio "imparare a produrre nomi spazzatura in operatività"
- [[agent-constitution]] — principio 11 (production-ready): in operatività nomi auto-esplicativi, l'anti-pattern random NON si applica
- [[scientific-method-operating-protocol]] — il regime random vive DENTRO le tracce di training del protocollo (Fase 1)
- [[scuola-learning-philosophy]] — questo regime si inserisce nella sequenza "copia → basi → allenamento → migliora"
- [[dynamic-context-training-regime]] — estende il concetto: anche la STRUTTURA del contesto è dinamica durante training
- [[structured-context-sections]] — tag fissi sono "vocab del modello", contenuti sono "referenze al contesto"
- [[structured-thinking]] — il modello, durante thinking, deve marcare le variabili che ha letto dal contesto come `[V from prompt]`
- [[sliding-window-variable-tool]] — il read tool produce dati che il modello deve citare esattamente, stesso pattern
- [[untrusted-content-delimiting]] — anche untrusted content richiede "citazione esatta", non riassunto/riformulazione
- [[pipeline-architecture-data-generation]] — pipeline producer/consumer per generare gli esempi

## Open questions

- Vocabolario random ideale (size, distribution, prefisso/suffisso pattern)?
- Bilanciamento random vs natural (60/40? 80/20? per quale tier?)
- Come gestire il mix di SFT (skill copy) e RL (naming bello) senza degradare l'uno o l'altro?
- Eval: metric "% match esatto nomi citati dal contesto" — quale dataset usare? Custom?
- Cross-language transfer: training su Python random transfer a TS random?

## Sources

- User notes 2026-05-21 grill-me discussion
- Anthropic Induction Heads: https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/
- Domain Randomization (Tobin 2017): https://arxiv.org/abs/1703.06907
- Counterfactual Data Augmentation (Kaushik 2020): https://arxiv.org/abs/1909.12434
- AlphaGeometry (Trinh 2024): https://www.nature.com/articles/s41586-023-06747-5
- SCAN (Lake & Baroni 2018): https://arxiv.org/abs/1711.00350
- "Lost in the Middle" (Liu 2023): https://arxiv.org/abs/2307.03172

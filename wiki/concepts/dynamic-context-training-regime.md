---
name: dynamic-context-training-regime
description: Training con contesto dinamico — sezioni multiple dimensioni variabili + combinazioni grandezze. Allenamento attention long-context retrieval.
type: concept
tags: [concept, training, context, attention, long-context, needle-in-haystack, position-randomization]
sources: [user notes 2026-05-21 grill-me discussion]
last_updated: 2026-05-21
---

# Dynamic Context Training Regime

## Idea ground truth (utente, 2026-05-21)

> "Vorrei rendere dinamico anche il contesto durante l'addestramento pur mantenendo la sua struttura, nel senso: il contesto è diviso in diverse parti/sezioni con delimitatori appositi (dobbiamo anche definirli), alcuni di questi come può essere un contenuto di un file potrebbe essere dinamico in quanto prende il nome del file. Inoltre addestrare il modello con almeno **5 dimensioni variabili per sezione e combinazioni delle diverse sezioni con diverse grandezze ciascuno**, questo per far capire al modello che le info possono essere sparse in tutto il contesto e deve essere bravo a trovarle, altro allenamento per l'attention."

## Cosa cambia rispetto a `runtime-symbol-randomization-training`

| Aspetto | Symbol randomization | Context dynamic regime (QUESTO) |
|---|---|---|
| Cosa è random | Nomi di simboli (variabili, funzioni, identifier) | **Struttura del contesto stesso** (lunghezze sezioni, posizioni info, combinazioni) |
| Effetto sull'attention | Skill di **copy** chirurgico | Skill di **retrieval** in long-context |
| Problema risolto | Confabulation di nomi | "Lost in the Middle" + position bias |

Sono **complementari**, non alternativi. Si applicano insieme.

## Struttura proposta

Il contesto rimane **strutturato** (vedi [[structured-context-sections]]) ma le sue dimensioni cambiano per ogni sample di training. Esempio:

### Sample 1 di training

```xml
<context>
  <aim>...</aim>                     [50 token]
  <current_state>...</current_state> [200 token]
  <assets>...</assets>               [500 token, 3 asset]
  <memory>...</memory>               [100 token, 1 memo]
  <working_history>...</working_history> [800 token, 5 turni]
</context>
TOTAL: ~1700 token
```

### Sample 2 di training (stesso task type, dimensioni diverse)

```xml
<context>
  <aim>...</aim>                     [120 token]
  <current_state>...</current_state> [50 token]
  <assets>...</assets>               [2500 token, 12 asset]
  <memory>...</memory>               [800 token, 7 memo]
  <working_history>...</working_history> [200 token, 2 turni]
  <external_inputs>...</external_inputs> [300 token, 2 update injection]
</context>
TOTAL: ~4000 token
```

### Sample 3 (long context)

```xml
<context>
  <aim>...</aim>                     [30 token]
  <assets>...</assets>               [15000 token, 80 asset]
  <untrusted_zone>...</untrusted_zone> [3000 token]
  <memory>...</memory>               [4000 token, 30 memo]
</context>
TOTAL: ~22000 token
```

L'info utile per rispondere può essere ovunque: in `<assets>` riga 78, in `<memory>` memo 23, in `<working_history>` turn 3, eccetera.

## 5 dimensioni variabili (almeno)

Per ogni sezione del contesto, almeno 5 dimensioni di variazione:

1. **Lunghezza in token** (es. 50, 200, 800, 2000, 8000 token per sezione)
2. **Numero di item interni** (es. `<assets>` con 1, 3, 8, 20, 80 asset definiti)
3. **Posizione dell'info-utile** dentro la sezione (inizio, 25%, 50%, 75%, fine)
4. **Densità di rumore** (info rilevante isolata vs immersa in distraction text)
5. **Ordine delle sezioni** (default vs shuffled)

Plus altre potenziali:
- Presenza/assenza di sezioni opzionali (es. `<external_inputs>` presente o no)
- Numero di update injection nella session
- Profondità dei nested tag (es. `<assets>` con sub-tag per attributi)
- Mix di lingue (it/en mescolate)
- Mix di formati interni (markdown table vs JSON vs prose)

## Combinazioni cross-sezione

Non solo ogni sezione varia, ma anche le **combinazioni** variano. Esempio matrice:

| Sample | aim | state | assets | memory | history | TOTAL |
|---|---|---|---|---|---|---|
| 1 | XS | M | XS | XS | M | small |
| 2 | M | XS | XXL | L | XS | very long |
| 3 | S | L | M | XL | L | long |
| 4 | XS | XS | S | XS | XS | tiny |
| ... | ... | ... | ... | ... | ... | ... |

5 sezioni × 5 grandezze = 5^5 = **3125 combinazioni teoriche**. In pratica si campionano N rappresentative (es. 200-500) coprendo lo spazio.

## Delimitatori da definire

L'utente ha chiarito: i delimitatori (tag) sono **FISSI** (parte vocab del modello), i contenuti sono **VARIABILI**. Tag candidati:

```xml
<context>
  <aim> ... </aim>
  <current_state> ... </current_state>
  <state_queue> ... </state_queue>
  <assets>
    <asset id="..." type="..." mutability="..." hard_limit="...">
      ...
    </asset>
    <asset id="..." ...>
      ...
    </asset>
  </assets>
  <interconnections> ... </interconnections>
  <pending_verifications> ... </pending_verifications>
  <memory>
    <memo id="..." applied_at="...">
      ...
    </memo>
  </memory>
  <working_history>
    <turn role="..." at="...">
      ...
    </turn>
  </working_history>
  <temporal_state>
    <now>...</now>
    <session_started>...</session_started>
    <tool_call_log>...</tool_call_log>
  </temporal_state>
  <external_inputs>
    <update from="..." priority="..." timestamp="...">
      ...
    </update>
  </external_inputs>
  <untrusted_zone marker="<RANDOM_UUID>">
    <untrusted source="..." fetched_at="...">
      ...
    </untrusted>
    <RANDOM_UUID>:END
  </untrusted_zone>
</context>
```

Decisione **importante**: `<untrusted_zone>` è UN tag che contiene TUTTE le sezioni untrusted (chiarimento utente 2026-05-21), non sezioni multiple sparse nel context. Vedi aggiornamento [[untrusted-content-delimiting]].

## Effetto sull'attention

### Senza dynamic context training

Modello visto contexts sempre simili (stessa lunghezza, stesso layout) → attention si abitua a pattern fissi → degrada su contesti reali variabili. Manifestazioni:
- "Lost in the Middle" (Liu 2023)
- Position bias verso inizio/fine
- Crollo di accuracy con contesti lunghi rari nel training

### Con dynamic context training

Modello vede ogni sample con layout diverso → attention impara a:
- Cercare info ovunque nel contesto, non solo in posizioni canonical
- Adattarsi a lunghezze variabili (no shortcut "guarda solo prime 2k token")
- Distinguere sezione utile da sezione di distraction text
- Mantenere accuracy stabile cross-position

## Riferimenti scientifici

| Lavoro | Cosa fa | Bridge col nostro |
|---|---|---|
| **"Lost in the Middle" (Liu 2023)** | Mostra position bias in long-context | Motivazione: nostro training risolve |
| **"Needle in a Haystack" (Kamradt 2023)** | Eval di retrieval su long-context | Benchmark per validare nostro training |
| **Position Interpolation / YaRN (Peng 2023)** | Estende context window | Tecnica complementare al nostro regime |
| **RULER benchmark (Hsieh 2024)** | Long-context capability multidim | Eval set candidato |
| **Anthropic "Many-Shot In-Context Learning"** | ICL con N esempi nel context | Conferma: ICL scala se attention non degrada |
| **Long-Context training data design (LongBench, BABILong)** | Dataset multi-dim per long-context | Inspiration per il nostro generator |

## Implementazione tecnica

Il generator deve produrre context con:

1. Layout randomizzato (sezioni in ordine variabile o canonical based on probability)
2. Contenuto delle sezioni generato da templates + random fill
3. Marker fissi (tag) sempre presenti
4. UUID random per `<untrusted_zone>` (anti sandbox escape, vedi [[untrusted-content-delimiting]])
5. Task target che richiede di **trovare** info specifica in posizione random del context

Pseudo-code generator:

```python
def generate_dynamic_context_sample(task_type: str) -> ContextSample:
    sections = sample_sections_to_include(task_type)  # min: aim, state, assets
    layout = sample_layout_order(sections)
    sizes = sample_sizes_per_section(sections)  # da distribuzione realistica
    needle_section, needle_position = sample_needle_location(sections, sizes)

    context = build_context(layout, sizes, needle_section, needle_position, task)
    target = generate_target_requiring_needle(needle_section, needle_position)

    return ContextSample(context=context, target=target)
```

## Trade-off

| Pro | Contro |
|---|---|
| Attention robusta cross-position | Generator complesso da scrivere |
| Mitigates "Lost in the Middle" | Loss curve più rumorosa |
| Allinea training con context format runtime | Test set deve essere altrettanto dinamico |
| Compatibile con symbol randomization | Combinatorial explosion da gestire (sampling) |

## Distribuzione realistica delle grandezze (chiarimento utente 2026-05-21)

Sulle combinazioni teoriche tipo `<aim>` XL + `<state>` XS + `<assets>` XS (mia preoccupazione iniziale come "rare"), l'utente ha osservato:

> "Guarda per come ti sto usando e stanno andando le cose è il mio caso più comune... ma non dovrebbe capitare per via della compressione del contesto in task come detto nei messaggi precedenti. Tuttavia non scartiamola, soprattutto questo caso. Però sì magari per ridurre un po' vediamo i casi più comuni tramite gaussian o altro, più adatto."

### Implicazione

Le distribuzioni realistiche del context **non** seguono un layout canonical "tutti uguali medi". Casi tipici nel real-world (basati su uso reale di Claude Code / Cursor / ChatGPT con tool):

| Pattern d'uso | Distribuzione tipica |
|---|---|
| **Discussione iniziale** (questo caso utente menzionato) | `<aim>` grande (descrizione complessa), `<state>` piccolo (poche cose fatte), `<assets>` piccolo (no codice ancora) |
| **Mid-task coding** | `<aim>` piccolo (fissato), `<state>` medio (progress accumulated), `<assets>` grande (molti file aperti) |
| **Debugging session** | `<aim>` piccolo, `<state>` medio, `<assets>` medio, `<tool_log>` GROSSO (molti tentativi) |
| **Multi-day resume** | `<aim>` piccolo, `<temporal_state>` con gap esplicito, `<memory>` grande (lessons accumulate), `<state>` ricostruita |
| **Reading codebase** | `<aim>` medio, `<assets>` HUGE (intero codebase in sliding view), `<state>` zero |
| **Planning new feature** | `<aim>` grande (richiesta vaga), `<state_queue>` cresce, `<rules>` invocate frequentemente |

### Strategia sampling

Adottare **mixture of Gaussians** (o log-normal per sezioni che possono essere grandi):

```python
SECTION_DISTRIBUTIONS = {
    'aim': LogNormal(mu=2.5, sigma=1.5),       # mean ~50 token, but XL casi 500+
    'current_state': Gaussian(mu=200, sigma=300),
    'state_queue': Gaussian(mu=300, sigma=400),
    'assets': MixtureOfGaussians([
        Gaussian(mu=100, sigma=50, weight=0.2),    # piccolo (early task)
        Gaussian(mu=1500, sigma=1000, weight=0.5), # medio (typical)
        Gaussian(mu=8000, sigma=4000, weight=0.3), # grande (reading codebase)
    ]),
    'memory': Gaussian(mu=400, sigma=300),
    'working_history': LogNormal(mu=3, sigma=2),    # long-tail (sessions lunghe)
    'temporal_state': Constant(150),                 # quasi fisso
    'external_inputs': Bernoulli(0.3, payload=Gaussian(mu=200, sigma=150)),
    'untrusted_zone': Bernoulli(0.15, payload=LogNormal(mu=5, sigma=2)),
}
```

### Edge cases da preservare

Nonostante usiamo distribuzione realistica, **non scartare** casi raramente comuni ma importanti:
- Discussione iniziale (aim grande, resto piccolo) — caso esplicito utente
- Multi-day resume con gap di ore/giorni — testa temporal awareness
- Untrusted zone presente e grande — testa prompt injection mitigation

Implementazione: 80% del dataset segue distribuzioni naturali, 20% campiona da edge cases con peso inflated.

## Open questions

- Distribuzione realistica delle grandezze per sezione (gaussiana? log-normal? — vedi sopra, da validare empiricamente)
- Combinazioni layout: tutte equi-probabili o weighted? (vedi sopra)
- Sample size totale per coprire spazio combinatorio (1k? 10k? 100k? — dipende da Wave)
- Eval: subset di RULER + Needle-in-Haystack custom + criticality awareness specifico?
- Bridge con `temporal-awareness-timestamps`: anche i timestamp nel context sono randomizzati?

## Link interni

- [[runtime-symbol-randomization-training]] — complementare, simbolo random ortogonale a context random
- [[scuola-learning-philosophy]] — questo è la "fase di studio" che insegna pattern strutturali
- [[structured-context-sections]] — i tag fissi che incapsulano i contenuti dinamici
- [[untrusted-content-delimiting]] — chiarito come singolo tag, allineato qui
- [[pipeline-architecture-data-generation]] — generator producer-consumer

## Sources

- User notes 2026-05-21 grill-me discussion
- "Lost in the Middle" (Liu 2023): https://arxiv.org/abs/2307.03172
- Needle in a Haystack eval (Kamradt 2023): https://github.com/gkamradt/LLMTest_NeedleInAHaystack
- RULER (Hsieh 2024): https://arxiv.org/abs/2404.06654
- YaRN (Peng 2023): https://arxiv.org/abs/2309.00071

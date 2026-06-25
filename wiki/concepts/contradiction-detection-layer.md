---
name: contradiction-detection-layer
description: Layer che monitora coerenza del contesto e triggera "attention event" quando rileva contraddizioni.
type: concept
tags: [concept, attention, coherence, contradiction-detection, runtime-monitoring, alignment]
sources: [user notes 2026-05-21]
last_updated: 2026-05-21
---

# Contradiction Detection Layer

## Idea ground truth (utente, 2026-05-21)

> "Layer di contraddizione. Se qualcosa nel contesto va in contraddizione questo se ne accorge e triggera un event di attention."

> (Plus, da [[structured-thinking]]): "Se trova contraddizioni o incongruenze torna sui suoi passi → meno token di pensiero, più veloce."

## Cosa risolve

In un context strutturato con molti dati ([[structured-context-sections]]) — assets, current_state, memory, working_history, external_inputs — possono emergere **contraddizioni**:

- `<current_state>` dice "endpoint POST /users implementato" ma `<assets>` non include `user_router.py`
- `<memory>` ricorda "API uses JWT auth" ma `<external_inputs>` da tool dice "API uses OAuth2"
- Asserzione `[V]` nel thinking corrente contraddice asserzione `[V]` di turn precedente
- `<aim>` dice "lavora su frontend" ma agent sta toccando file backend
- Hard limit dice "no DELETE on users table" ma agent ha emesso DELETE FROM users

Senza detection esplicita, il modello può procedere su contraddizione → output incoerente, possibili azioni dannose.

## Architettura — due implementazioni

### Implementazione A — Sub-layer di rete neurale

Un componente nel modello (durante o dopo attention) compara coppie di asserzioni nel context per coerenza logica. È un'idea **research-level** e richiede modifiche architetturali al base model.

Costo: alto (modifica forward pass). Beneficio: rilevazione fine-grained durante generation.

Stato attuale: paper recenti su "contradiction-aware attention" sono esplorativi (FactGPT, OpenAI 2024). Per il nostro SLM, scartiamo questa via in MVP.

### Implementazione B — Layer esterno deterministico (raccomandato per MVP)

Il wrapper esegue, **prima e durante** l'inference, un **layer di check coerenza** sul context. Operazioni:

1. **Pre-inference check**: prima di mandare il context al modello, verifica coerenza interna
2. **In-flight check**: dopo ogni `</section>` del thinking, verifica coerenza con context
3. **Post-inference check**: prima di accettare l'output, verifica coerenza output vs context

Se contraddizione rilevata → emette **attention event** nel context (vedi [[external-update-injection]]):

```xml
<update from="contradiction_detector" priority="critical" timestamp="...">
  CONTRADIZIONE rilevata:
    - Source A: <current_state> "POST /users implementato"
    - Source B: <assets> non contiene user_router.py
  POSSIBLE INTERPRETAZIONI:
    1. POST /users implementato ma asset non aggiornato → fix asset list
    2. POST /users non implementato, current_state errato → fix state
    3. POST /users in altro file (es. users.py) → verifica fonte truth
  ACTION REQUIRED: il modello deve risolvere prima di procedere.
</update>
```

Il modello, ricevendo questo update, deve:

1. Emettere `<contradiction_resolution>` esplicito
2. Verificare quale source è ground truth (es. eseguire shell `ls user_router.py`)
3. Aggiornare l'asserzione errata
4. Solo dopo proseguire thinking originale

## Tipi di contraddizione

### 1. Factual (deterministiche)

Verificabili con tool calls:

- Asserzione: "file X esiste" → check `ls X`
- Asserzione: "test pass" → check pytest output
- Asserzione: "branch main è ahead di origin" → check `git status`

Layer: shell tool + simple regex/JSON matching.

### 2. Semantic (richiede LLM judgment)

- "Function fooBar è async" vs "fooBar non ha await callsites"
- "User authentication via JWT" vs "request senza Authorization header funziona"
- "Database schema include email" vs "INSERT statement non include email"

Layer: LLM-as-judge piccolo (BERT-tiny fine-tuned o Qwen 0.6B) — non serve il main model.

### 3. Temporal (state evolution)

- T-3: agent ha detto "filename = a.py"
- T-1: agent dice "filename = b.py" senza esplicitare il cambio

Layer: diff di asserzioni storiche, regex/embedding similarity.

### 4. Logical (constraint satisfaction)

- Hard limit dice "max 5 retry"
- Action attempt nr 7

Layer: deterministic rule engine (Python).

### 5. Cross-source

- `<memory>` dice X
- `<untrusted_zone>` dice ¬X

Layer: priorità sources (trusted > untrusted). Se untrusted contraddice trusted → flag attention ma NON applicare.

## Implementazione tecnica

```python
class ContradictionDetector:
    """
    Layer esterno che monitora coerenza del context.
    Esegue check dopo ogni section_close del thinking,
    e ad ogni state_update del wrapper.
    """

    def __init__(self, judges: dict):
        self.judges = {
            'factual': FactualVerifier(),       # shell-based
            'semantic': SemanticJudge(),         # small LLM
            'temporal': TemporalDiff(),          # historical
            'logical': RuleEngine(),             # constraint solver
        }

    def check(self, context: Context, new_assertion: Assertion) -> list[Contradiction]:
        contradictions = []
        for category, judge in self.judges.items():
            results = judge.evaluate(context, new_assertion)
            contradictions.extend(results)
        return contradictions

    def emit_attention_event(self, contradictions: list[Contradiction]) -> XmlTag:
        # Iniettato nel context tramite external-update-injection
        ...
```

## Trade-off

| Pro | Contro |
|---|---|
| Errori coerenza rilevati runtime, non post-mortem | Latency per check |
| Forza il modello a essere coerente | Falsi positivi disturbano flow |
| Auditabile (ogni contraddizione loggata) | Implementazione complessa |
| Migliora con uso (memo system [[error-memo-system]] cattura pattern) | Richiede LLM judge per semantic |

## Metriche di successo

| Metrica | Target |
|---|---|
| Recall su contraddizione true positive | >85% |
| Precision (no falsi allarmi) | >90% |
| Latency overhead per check | <100ms |
| Riduzione errori incoerenti in output | -50% vs baseline |

## Failure modes

1. **Falso positivo cronico**: detector troppo sensibile → modello passa tempo a "risolvere" contraddizioni inesistenti. Mitigazione: tuning soglia, judge LLM con few-shot.

2. **Falso negativo**: contraddizione subtle non vista → modello procede su base sbagliata. Mitigazione: multiple judges, ensemble.

3. **Deadlock di risoluzione**: modello non riesce a risolvere contraddizione, loop infinito. Mitigazione: timeout + escalation a utente.

4. **Performance overhead**: troppi check → latency esplode. Mitigazione: check asincroni in parallelo, caching.

## Trigger di "attention event"

Non ogni contraddizione richiede stop. Severità decide priority:

| Severity | Esempio | Action |
|---|---|---|
| `critical` | Hard limit violato | STOP, escalate to user |
| `high` | Fact contraddice memory | Force resolution prima di procedere |
| `medium` | Semantic ambiguity | Flag, ma può procedere con caveat |
| `low` | Temporal inconsistency minor | Log, no interrupt |

## Open questions

- Quale judge LLM piccolo è adatto per semantic check? (Qwen3-0.6B fine-tuned su contradiction-NLI?)
- Dataset contradiction-NLI per training judge: esistono pubblici?
- Layer A vs Layer B: in futuro adottare Layer A neurale? Quale costo training?
- Falsi positivi: come l'utente può silenziare un check ricorrente che non vuole?

## Link interni

- [[structured-context-sections]] — il context su cui opera il detector
- [[external-update-injection]] — come emette attention event
- [[structured-thinking]] — il thinking del modello che reagisce
- [[error-memo-system]] — contraddizione → memo
- [[pre-flight-safety-checks]] — alcuni check sono "contradiction detection" applicato pre-execution
- [[agent-constitution]] — principio 13 (su contraddizione: fermati e segnala) formalizza questo layer come codice di condotta
- [[scientific-method-operating-protocol]] — passo 4 (interconnections) + verify-loop usano questo detector; [[_user-notes-2026-06-23]] note 4+5 lo estendono a skill metacognitiva interna
- [[../architecture/wrapper]] — implementazione layer (extension di [[../decisions/2026-06-23-pi-harness-base|pi]])

## Sources

- FactGPT / contradiction-aware models (OpenAI / DeepMind 2024 research)
- NLI (Natural Language Inference) datasets: SNLI, MNLI, RTE
- Constitutional AI (Anthropic) — model self-critique loop
- User notes 2026-05-21

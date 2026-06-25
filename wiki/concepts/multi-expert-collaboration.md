---
name: multi-expert-collaboration
description: Multi-expert collaboration via LoRA hot-swap sequenziale per task multi-domain. Ciascun expert risponde nella sua sezione del pensiero, passa hint + state al successivo.
type: concept
tags: [concept, multi-agent, lora, collaboration, multi-domain, sketch-prediction, task-decomposition]
sources: [user notes 2026-05-21 grill-me discussion, AutoGen Wu 2023, CrewAI, MetaGPT, MoLE family]
last_updated: 2026-05-21
status: planned-wave-7-8
---

# Multi-Expert Collaboration via LoRA Hot-Swap

## Trigger utente (2026-05-21)

> "Potrebbe aiutare per esempio quei campi in cui abbiamo un lora solo per coding e uno solo per finanza, ma a me serve creare un app finanziaria, quindi si attivano un esperto per volta e risponde nella sua sezione dedicata nel pensiero, magari da hint e costruisce tutto il ragionamento o informazioni di cui ha bisogno, magari la parte finanziaria da le sue conoscenze, poi passa al coder che le prende e le codifica in uno script."

> "Quindi seraddestramento anche sulla classificazione di argomenti (anche composti): es: coding, marketing e finanza, coding e finanza, etc? Magari quando predice la forma della risposta, per ogni sezione che identifica ne definisce anche la categoria"

## L'idea in essenza

Per task **multi-domain** (es. "crea app fintech advisory pensionistico" = finance + backend + frontend), il sistema:

1. **Tier 1 orchestratore identifica le componenti** del task con classificazione multi-label
2. **Genera plan multi-stage** dove ciascun stage = un expert (LoRA verticale specifico)
3. **Esegue stage sequenzialmente**: hot-swap LoRA → genera output → passa state al successivo
4. **Ciascun expert produce hint + knowledge nella sua sezione** del pensiero strutturato
5. **Expert successivo** legge hint del precedente, continua ragionamento

## Schema operativo

### Esempio: "Crea app fintech advisory pensionistico"

**Tier 1 sketch + plan**:
```xml
<sketch>
  domains: finance + backend-py + frontend
  components:
    - finance:200tok (formule attuariali)
    - backend-py:400tok (API + business logic)
    - frontend:300tok (dashboard React)
  estimated_total: ~900tok output
</sketch>

<plan_multi_expert>
  <stage id=1 expert="finance_lora" output_type="domain_knowledge">
    Determinare formule attuariali necessarie: TIR, NPV, mortality table
  </stage>
  <stage id=2 expert="backend-py_lora" output_type="code_implementation"
         depends_on="stage 1">
    Implementare formule in Python + REST endpoint
  </stage>
  <stage id=3 expert="frontend_lora" output_type="ui_dashboard"
         depends_on="stage 2">
    Dashboard React per visualizzare risultati
  </stage>
</plan_multi_expert>
```

**Stage 1 execution** (wrapper carica finance_lora):
```xml
<stage_output id=1 by="finance_lora">
  <knowledge>
    Formule attuariali necessarie:
    - TIR (Tasso Interno di Rendimento): risolvi NPV(cashflows, r) = 0 per r
    - NPV: sum(CF_t / (1+r)^t)
    - Mortality table: ISTAT 2024 standard, applica probabilità sopravvivenza per anno
  </knowledge>
  <hint_for_next>
    Backend expert: implementa le formule sopra come funzioni puro Python.
    Considera: tax rate variabile (per ETF vs fondi pensione), inflation adjustment, scenario stress test (3% / 5% / 7% rendimento atteso).
  </hint_for_next>
</stage_output>
```

**Stage 2 execution** (wrapper hot-swap → backend-py_lora):
```xml
<stage_output id=2 by="backend-py_lora" used_hint_from="stage 1">
  <code language="python">
    def calculate_irr(cashflows: list[float], guess: float = 0.1) -> float:
        """TIR via Newton-Raphson, formula da finance_lora stage 1"""
        ...
    def calculate_npv(cashflows: list[float], rate: float) -> float:
        ...
    @app.post("/api/pension/analysis")
    def analyze_pension(...):
        ...
  </code>
  <hint_for_next>
    Frontend expert: API endpoint POST /api/pension/analysis accepts {age, income, contribution, target_year, scenario}.
    Returns {irr, npv, monthly_value_chart_data, risk_breakdown}.
    Suggested visualizations: line chart cumulative value, bar chart scenario comparison, table key metrics.
  </hint_for_next>
</stage_output>
```

**Stage 3 execution** (wrapper hot-swap → frontend_lora):
```xml
<stage_output id=3 by="frontend_lora" used_hints_from="stages 1,2">
  <code language="tsx">
    import { LineChart, BarChart, Table } from 'recharts'
    
    export function PensionDashboard({ analysisData }: Props) {
      return (
        <div>
          <h2>Analisi pensionistica</h2>
          <KeyMetricsTable metrics={analysisData} />
          <LineChart data={analysisData.monthly_value_chart_data} />
          ...
        </div>
      )
    }
  </code>
</stage_output>
```

**Tier 1 aggrega + risposta finale**:
```
Ecco l'app fintech:
1. Formule attuariali: ... (da finance expert)
2. Backend Python con API REST: ... (da backend expert)
3. Frontend dashboard React: ... (da frontend expert)
```

## Pattern conosciuti in letteratura

### Multi-agent frameworks (correlati)

- **AutoGen** (Wu et al. 2023, Microsoft) — multi-agent conversation, ruoli definiti
- **CrewAI** — role-based agent teams
- **MetaGPT** — multi-agent SDLC (PM + dev + QA)
- **Co-Voyager** — collaborative Voyager extensions
- **ChatDev** — agent simulation di team dev

### Multi-LoRA composition (più vicino)

- **Mixture of LoRA Experts (MoLE)** family — vedi `wiki/entities/mole.md`
- **X-LoRA** (Buehler 2024) — router learned tra LoRA — `wiki/entities/x-lora.md`
- **HMoRA** (ICLR 2025) — hierarchical mixture LoRA experts — `wiki/entities/hmora.md`
- **LoraHub** — composition gradient-free

**Differenza nostra approccio**: sequential (uno alla volta) vs concurrent (tutti simultaneamente con router). Sequenziale è più semplice, più auditable, più lento.

## Granularità dello switch LoRA (chiarimento 2026-06-24)

Domanda utente: *"stiamo prevedendo lo switch del LoRA durante il thinking?"*. Tre granularità:

| Granularità | Quando | Meccanismo | Stato |
|---|---|---|---|
| **Per-richiesta** | 1 LoRA per intera risposta | classifier a monte → 1 adapter | ✅ MVP v1/v2 |
| **Per-stage** (confine di stage) | switch tra expert in task multi-domain | Tier 1 emette `<load:X>` → wrapper **segment-and-rerun** (nuova generazione col LoRA, state passato) | ✅ Wave 7-8 (questo concept) |
| **Per-token** (durante il forward) | mixing continuo degli adapter mentre genera | **router learned** che pesa gli adapter per-token/layer | ❌ alternativa considerata, scartata per ora |

**Caveat KV-cache** (perché lo switch è a confine-di-stage e NON a metà generazione): la KV-cache di un prefix generato col LoRA A non è coerente coi pesi del LoRA B; uno swap mid-forward lascia una cache "sporca" (mismatch). Il design pulito è **segment-and-rerun** — ogni expert = una nuova chiamata di generazione che riusa il contesto strutturato accumulato (block_notes/hint). vLLM/S-LoRA sono ottimizzati per swap **per-richiesta**, il che calza esattamente col design segmentato.

**Bivio di design**: il "vero switch per-token durante il thinking" = **router learned concurrent** ([[../entities/x-lora]], [[../entities/hmora]], MoE-of-LoRA) — più fluido, ma meno auditable e richiede training congiunto del router. Abbiamo scelto **sequenziale a confine-di-stage** per semplicità/auditabilità. Rivalutabile se l'evidenza lo giustifica (`[da-rivalutare]`, vedi [[../entities/hmora]] come match più vicino).

## Sub-idea utente: classificazione multi-label

> "Magari quando predice la forma della risposta, per ogni sezione che identifica ne definisce anche la categoria"

Questo è una **estensione naturale del sketch head** (vedi `multi-token-prediction-training.md`):

```xml
<sketch>
  total_response: ~900 tokens
  categories_breakdown:
    - finance: 200 tokens
    - python_code: 400 tokens
    - react_code: 300 tokens
  multi_domain_task: true
  recommended_workflow: sequential_multi_expert
  experts_chain: [finance_lora, backend-py_lora, frontend_lora]
</sketch>
```

Sketch head trainato per predire:
1. Lunghezza totale risposta
2. **Categorie componenti** (multi-label)
3. Workflow recommendation (single-expert | sequential-multi-expert | parallel-multi-expert)

Dataset Tier 1 training deve includere sample di task multi-domain con sketch labeled per categoria.

## Trade-off

| Pro | Contro |
|---|---|
| Copre use case realistici multi-domain | Latency esplode (N expert × forward pass) |
| Differenziatore vs single-model competitor | Cascading error reale (errore stage N → propaga) |
| Allineato con structured-context + task-decomposition | Complica wrapper notevolmente |
| Possible **paper claim #6** (sequential LoRA experts) | Mis-classification orchestratore → wrong chain |
| Modulare (aggiungere expert futuri = additivo) | Eval complicato (stage-by-stage) |
| Auditable (ogni stage tracciato) | Training data multi-domain costoso da curare |
| Bridge naturale con out-of-domain refusal | Loop infinito risk (timeout necessario) |

## Implementation roadmap

### MVP v1 (Wave 5) — SKIP

Solo 1 LoRA verticale (frontend), no multi-expert real possibile.

### MVP v2 (Wave 6) — SKIP

3 livelli (Tier 1+2+3) ma sempre single-domain alla volta.

### Wave 7 — Prototype

Quando abbiamo almeno 3 verticali (Frontend + Backend-Py + Data + opzionalmente Backend-TS):
- Implementa orchestratore Tier 1 con sketch multi-label
- Wrapper supporta chain sequenziale di hot-swap
- Custom eval: 100 task multi-domain
- Confronto vs single-LoRA naive

### Wave 8-9 — Full

- 5 verticali completi
- Robustness al cascading error (validation per stage)
- Timeout + fallback
- UI mostra stage in tempo reale

### Wave 10 — Self-supervision

- Memo cross-expert (lessons learned: "quando finance + backend, usa X pattern")
- Memory dei chain di successo

## Rischi specifici

1. **Cascading error**: stage 2 sbagliato perché stage 1 hint imperfetto. Mitigazione: validation per stage prima di passare al successivo
2. **Loop infinito**: stage A passa a B che passa ad A. Mitigazione: directed acyclic graph (no cycle in plan), timeout assoluto
3. **Latency totale**: 3 expert × ~1s ciascuno = 3s+ per task. Non adatto per chat reattiva. Adatto per agent autonomo multi-day (caso d'uso nostro)
4. **Failure cascade orchestratore**: Tier 1 sbaglia plan multi-stage → tutto sbagliato. Mitigazione: orchestratore plan validation step + permission to revise plan

## Possibile paper claim #6

I gap di letteratura paper-worthy ora **6**:

1. Structured update injection mid-thinking
2. Structured-context contradiction detection layer runtime
3. Organization-first SFT paradigm
4. Criticality awareness evaluation methodology
5. Adversarial needle-in-haystack TRAINING regime
6. **Sequential LoRA expert collaboration with structured cross-expert state passing**

Quest'ultimo: pattern multi-agent classic ma applicato a LoRA hot-swap (vs typical agent = LLM call). Non ho visto formalization specifica in letteratura.

## Evoluzione: reclutamento dinamico + completeness-gate (idea utente 2026-06-24)

> `[IPOTESI — non confermata, idea utente]`. L'utente: "per campi misti serve più di un vertical; multi-turn con vertical stabiliti all'inizio dal base. Valutare se ogni modello scrive i suoi limiti di applicazione e, se non basta, richiede un vertical specifico per completare la conoscenza. Valutare se l'ultimo turno lo fa il base che capisce se mancano punti → richiama altri vertical o delibera."

Estensione da **catena statica** (Tier 1 pianifica tutto upfront) a **processo dinamico auto-organizzante** con due loop:

- **Loop interno (decentralizzato) — self-limit + recruit**: ogni expert, sul task corrente, **dichiara i propri limiti di applicabilità**; se riconosce di non bastare, **richiede uno specifico vertical** (`<recruit:domain>`) per completare la conoscenza. Lega a [[out-of-domain-refusal-training]] + capability-limit recognition (taxonomy Area 11).
- **Loop esterno (centralizzato) — orchestrator completeness-gate**: l'**ultimo turno** è del modello base (Tier 1) che valuta se la risposta finale ha **punti mancanti** → richiama altri vertical (loop) **oppure** delibera la risposta finale. Lega a verify-loop ([[scientific-method-operating-protocol]] passo 8) + completeness critic.

Pattern: **blackboard architecture** + Mixture-of-Agents con controller. Applicato a LoRA hot-swap con auto-reclutamento → rafforza il paper-claim #6.

### Guardrail obbligatori (critica oggettiva)
1. **Self-limit inaffidabile (rischio #1)**: modelli overconfident (Dunning-Kruger) → un expert può NON reclutare quando dovrebbe (errore silenzioso); ed è **reward-hackable** (sotto/sovra-dichiara i limiti) → [[reward-hacking-mitigation]]. **Il completeness-gate (loop esterno) È la rete di sicurezza**: non fidarsi del self-assessment da solo; cross-check su task ad alto rischio.
2. **Terminazione**: cap (max expert N, max round R) + DAG no-cycle + soglia "good enough" (anti gold-plating → [[quality-target-tiers]]).
3. **Budget costo/latency**: ogni reclutamento = +1 inference + swap.
4. **Registry + fallback**: vertical richiesto assente → out-of-domain refusal / hint all'utente.
5. **Conflitti**: expert in contraddizione → orchestratore arbitra ([[contradiction-detection-layer]]).

Conferma la direzione **sequenziale-orchestrata** (vs router per-token X-LoRA/HMoRA), ma più ricca. Status: `idea-utente-2026-06-24`, evoluzione approvata concettualmente, Wave 7-8+.

### Raffinamenti (utente 2026-06-24, round 2)

1. **Self-limit enforced via RL negativo + completeness-gate**: l'expert riceve **reward negativo se NON dichiara** i limiti quando avrebbe dovuto; il check finale (loop esterno) cattura i casi sfuggiti. `[CRITICA]` rischio inverso: penalizzare il "non-dichiarare" può indurre **over-declaration** (dichiara limiti ovunque per evitare la penalità → reclutamento eccessivo). → Ancorare il segnale all'**outcome verificabile** (la parte non-dichiarata è poi risultata sbagliata?), non all'atto di dichiarare in sé → [[reward-hacking-mitigation]].
2. **Cross-expert verification (producer–verifier)** 🟢: un expert può **verificare DOPO il turno di un altro**. Es: il **coder** scrive lo script finanziario → l'expert **finance** verifica che sia coerente con le leggi di mercato. Il verificatore cattura errori che il produttore non può vedere (il coder non conosce le leggi di mercato). **Relativamente verificabile** (buon reward anchor, meno hackable del self-score) + defense-in-depth (produttore + verificatore + orchestratore). È il "gioco" auto-critica (taxonomy Area 16) applicato **tra** expert.
3. **Good-enough threshold = parametro guidato dal quality-tier**: la soglia di accettazione del completeness-gate è tunabile; **100% = good-enough disabilitato** (delibera solo se accurata al 100%). Si lega a [[quality-target-tiers]] (PoC soglia bassa · Production/Hardened 100%). `[CRITICA]` 100% può non terminare se irraggiungibile → combinare con **max-round cap** + **escalation all'utente** se non converge (no loop infinito inseguendo un 100% impossibile).
4. **Fallback vertical assente**: (a) **hint utente**, oppure (b) **comporre più vertical** la cui unione copre il dominio mancante. `[CRITICA]` la composizione **non è garantita lossless** ("senza perdite" è ottimistico: due expert adiacenti ≠ l'expert mancante) → comporre **+ flaggare la confidenza**; per domini davvero assenti l'hint utente resta il fallback più sicuro.
5. **Self-election come verificatore (proattivo)** (utente 2026-06-24): un expert che ha prodotto conoscenza early può **accorgersi** (leggendo il plan nel context strutturato) di non essere ri-chiamato per validare un output downstream nel suo dominio, e **auto-eleggersi** come verificatore del prossimo step. Es: `finance` si auto-elegge dopo il `coder` per validare lo script finanziario vs leggi di mercato. È un **catch precoce**, complementare al completeness-gate (che resta il **backstop garantito** all'ultimo turno — l'utente nota: "se ne accorgerebbe comunque nell'ultimo turno"). È criticality-awareness/metacognizione a livello di agente (organization-first applicato all'expert).
   - **Open question utente: serve approvazione del coordinatore?** Tre modelli:
     - (A) **Autonomo** (self-insert): max robustezza, ma turf-war / loop / costo + **reward-hack** (self-elect ovunque per "essere utile") + audit più debole.
     - (B) **Approvazione richiesta**: controllo, ma reintroduce il coordinatore come **single point of failure** (proprio ciò che la self-election aggira).
     - (C) ⭐ **Blackboard claim + arbitraggio leggero** ✅ **SCELTO (utente 2026-06-24)**: l'expert si **auto-nomina** (segnale non perso), il coordinatore **schedula** sotto budget/DAG/dedup → controllo + audit mantenuti, robustezza preservata.
   - ⚠️ **REQUISITO CONFERMATO (utente 2026-06-24)**: il reward della self-election (e di ogni verifica/critica) va ancorato a *"ha scovato un errore REALE?"* (outcome verificabile), **non** alla partecipazione — altrimenti **participation-hack**. → [[reward-hacking-mitigation]] (principio first-class) · esperimento EXP-ME-9.

## Open questions

- Sequenziale vs parallelo: 2+ expert in parallelo è feasibile (KV cache shared)?
- Cross-expert state format: structured XML (proposto) o JSON o natural language?
- Validation per stage: chi valuta? Tier 1 ritorno + judge LLM?
- Cascading error mitigation strategy concreta
- Multi-expert come "fallback graceful" dell'out-of-domain refusal (refusal → hint → multi-expert chain)
- Compatibilità con composition-aware training (Tier 2 + Tier 3): aggiunge altro livello di stacking complexity

## Linked

- [[out-of-domain-refusal-training]] — pattern correlato (refusal → hint → multi-expert chain)
- [[multi-token-prediction-training]] — sketch head per multi-label classification
- [[task-decomposition-adhoc-context]] — plan multi-stage
- [[structured-context-sections]] — sezioni dedicate per expert
- [[../entities/mole]], [[../entities/x-lora]], [[../entities/hmora]] — composition learned alternative
- [[../entities/voyager-paper]] — skill collaboration pattern

## Status

`planned-wave-7-8` — idea utente approvata, implementazione posticipata a quando abbiamo ≥3 verticali.

## Sources

- User notes 2026-05-21 grill-me (idea originale)
- AutoGen (Wu et al. 2023): https://arxiv.org/abs/2308.08155
- MetaGPT (Hong et al. 2023): https://arxiv.org/abs/2308.00352
- MoLE family papers (vedi entities)
- Multi-agent literature surveys 2024-2025

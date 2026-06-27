---
name: harness-feature-catalog
description: Catalogo completo delle feature-class che introduciamo NOI sul harness pi — le 6 classi (Context-Assembly & Memory · Dynamic Context & Attention · Safety & Guardrails · Reasoning & Recovery · Routing & Serving · Verification & Sandbox), con contesto, funzionamento, mapping sugli hook di pi, MVP-vs-post-MVP, principio SKILL(pesi)-vs-FEATURE(wrapper), decisioni trasversali e open question per l'allineamento.
type: architecture
tags: [harness, wrapper, pi, feature-catalog, extensions, three-tier, mvp, alignment]
sources: [wiki/architecture/wrapper.md, wiki/decisions/2026-06-23-pi-harness-base.md, wiki/architecture/wrapper-implementation-plan.md, wiki/concepts/* (28 concept estratti 2026-06-27)]
last_updated: 2026-06-27
status: draft v1 (sintesi review-loop-ready)
confidence: provisional
---

# Harness / Wrapper — Catalogo delle Feature Class

> **Scopo di questo documento**: rispondere alla domanda *"come lo andremo a realizzare, quali sono tutte le classi/categorie di feature che introduciamo NOI, con contesto + funzionamento, per capire se siamo allineati"*. È la sintesi navigabile di 28 concept/architecture file. Per il piano operativo fasato vedi [[wrapper-implementation-plan]]; per la decisione di base vedi [[../decisions/2026-06-23-pi-harness-base]].

---

## §0 — Inquadramento: i 3 layer + la regola di scope

L'architettura è a **3 layer disaccoppiati** `[EXTRACTED]`:

```
FRONTEND (Web React/Vue/Svelte  o  Desktop Tauri)        ← post-MVP; MVP usa TUI nativa pi
   │  embedding via SDK/RPC
HARNESS = pi  (earendil-works/pi · TypeScript · MIT)     ← QUI vivono TUTTE le nostre feature (Extensions)
   │  hook: context · before_agent_start · tool_call · tool_result · lifecycle
   │  endpoint OpenAI-compatible
SERVING = vLLM --enable-lora  (S-LoRA hot-swap)  (Python) ← QUI vive la RICERCA (three-tier + training)
```

**Regola di scope (cardine)** `[EXTRACTED]`: **pi risolve l'HARNESS, non il MODELLO**. Il contributo di ricerca originale (three-tier organization-first + metodologia di training) vive nel **serving/modello**; l'operatività (context, loop, tool, gate) vive in **pi**. Il LoRA hot-swap è del **serving** (vLLM), non di pi: pi *parla* all'endpoint, e una nostra extension-router *seleziona l'adapter* per-richiesta.

**Principio di realizzazione**: ogni nostra feature è una **Extension TypeScript** che si aggancia a uno o più hook di pi. **pi dà gli hook, NON la safety**: i guardrail, i gate, gli scanner, lo stato persistente li **costruiamo noi** — pi non ha permission-gate built-in. `[EXTRACTED ADR pi]`

> ⚠️ **Step 0.0 bloccante** `[EXTRACTED]`: i nomi-hook precisi (`context`/`before_agent_start`/`tool_call`/`tool_result`), la forma di `registerTool`, il supporto endpoint vLLM+LoRA per-request, la stabilità dell'API Extensions e lo storage sessione tree-structured vanno **verificati contro il sorgente reale di pi** prima di scrivere codice. Questo catalogo assume la mappatura `[INFERRED da-verificare]`.

---

## §1 — Il principio trasversale #1: SKILL (pesi) vs FEATURE (wrapper)

La distinzione più importante per leggere tutto il resto. Quasi ogni capacità si **scompone** in due metà, e confonderle è il rischio di design principale:

| | **FEATURE** (Extension di pi) | **SKILL** (addestrata nei pesi del modello) |
|---|---|---|
| **Cos'è** | Stato, strumenti, impaginazione del contesto, gate, scanner, storage | Le *decisioni* e *generazioni* metacognitive: quando/come usare la feature |
| **Dove vive** | Codice TypeScript negli hook di pi | Pesi del Tier 1 (full-FT) + tracce di training |
| **Aggiornabile** | Sì, senza retraining | Solo con training (ma il system-prompt è aggiornabile) |
| **Esempi** | secrets-map scanner, VARS registry, error-memo storage, `<safety_halt>` gate | riconoscere la bassa-confidence, decidere preempt-vs-enqueue, generare i marker `[V]/[A]/[?]`, fare post-mortem |

**Confine operativo** `[INFERRED]`: *il wrapper fornisce stato, strumenti e struttura; i pesi decidono quando e come usarli.* Tre esempi di taratura del confine:
- **error-memo** = feature-pesante (storage esterno + vector-retrieval + decay); la skill è solo *generare* un buon post-mortem e *applicare* il memo.
- **task-interruption** = pura policy di scheduling sopra strutture già esistenti (lane TASKS); nessun meccanismo nuovo, solo la skill di *decidere*.
- **structured-thinking** = skill-pesante (il modello deve *generare* i marker nativamente); la feature è solo l'aggancio ai `<section>` del contesto.

Questo confine è anche un'**arma anti reward-hacking**: gli aspetti *verificabili* (gate passato? secret bloccato? check eseguito nel trace?) sono ancorati a controlli **harness-side deterministici** (*scorer ≠ scored*), non all'auto-dichiarazione del modello. → [[../concepts/reward-hacking-mitigation]].

---

## §2 — Le 6 Feature Class

Sintesi: **A** e **B** costruiscono e gestiscono il *contesto*; **C** lo difende; **D** governa il *ragionamento* sopra di esso; **E** sceglie *quale modello/adapter* esegue; **F** è l'infrastruttura che *verifica* (sia il runtime sia i nostri stessi dati di training).

### Classe A — Context-Assembly & Memory
*Come il wrapper costruisce e mantiene il blocco `<context>` + la memoria persistente.* Concept: [[../concepts/wrapper-context-assembly-example]] · [[../concepts/agent-wrapper-vars-queue]] · [[../concepts/structured-context-sections]] · [[../concepts/sliding-window-variable-tool]] · [[../concepts/temporal-awareness-timestamps]].

- **Contesto / perché**: il contesto deve cambiare a ogni turno senza perdere stato, restando piccolo (anti lost-in-the-middle) ma con accesso virtuale a tutto. Mettere tutti i dati grandi inline è insostenibile. `[EXTRACTED]`
- **Funzionamento — due strati**:
  - **Strato datastore** ([[../concepts/agent-wrapper-vars-queue]]): runtime-state interno = 4 lane (**TASKS** {id/status/deps/reference} · **VERIFICATIONS** · **RULES** · **VARS** registry map O(1)) + puntatore **CURR**. Il modello richiama una VAR *per ID* → lookup O(1) → estrae solo uno **slice**. Persistenza per-step: JSON (TASKS/RULES) + SQLite (VARS); RULES versionato git per audit.
  - **Strato presentazione** ([[../concepts/structured-context-sections]] + [[../concepts/wrapper-context-assembly-example]]): a ogni turno `ctx.getContext()` serializza le lane in un `<context>` XML-style. ~12 lane: `temporal`, `rules`, `secrets` (riferimenti `SECRET#n`), `history` (**gerarchia 2 livelli**: `completed_blocks` coarse / `current_block_steps` fine, con **regola di compressione** step→block alla chiusura — anti-duplicazione), `current_aim`, `block_notes` (decision-cache), `task_list`, `verify_queue` (check annidati + priorità), `interconnections` (deps + flag WIP), `last_tool_calls` (con **scope** + line-range), `open_file_view` (stream-read inline), `messages_with_user` (blocco separato).
  - **Trasversali**: [[../concepts/temporal-awareness-timestamps]] inietta il *senso del tempo* (`<temporal>` now/elapsed + tool-call timing con stato `in_progress`/`timeout_at` + flag `fresh` TTL sulle VARS → stale-detection, decisione wait-vs-retry); [[../concepts/sliding-window-variable-tool]] dà **read/replace char-range** con **preview-then-apply** (default `preview_only=true`) su qualsiasi VAR (non solo file).
- **Mapping pi**: hook **`context`/`before_agent_start`** = punto unico di assemblaggio pre-turn (`ctx.getContext()`); tool LLM-callable (`add_secret`, `stream_read`/`close_stream_file`, `set_history_window`, sliding-var) registrati e gestiti in `tool_call`/`tool_result`; `last_tool_calls`/temporal-log popolati da `tool_result`.
- **MVP vs post**: **MVP/Fase-0** lo scheletro lane + `ctx.getContext()` + sezioni obbligatorie (aim/state/queue/assets/verifications) + temporal base. **Post-MVP** il sweet-spot N model-set addestrabile, history-window dinamica, compaction avanzata, GC delle VARS.
- **Peculiarità nostre**: history gerarchica 2-livelli con compressione; VARS registry O(1) + slice-on-demand; `last_tool_calls` con scope; N model-set metacognitivo gemello di `close_stream_file`; constraint capture esplicito-vs-dedotto.
- **Primitive fondanti**: (1) VARS map O(1) + slice; (2) lane → `ctx.getContext()` ri-assemblate ogni turno; (3) context-management **model-driven** (il modello gestisce il proprio budget: apri/leggi-slice/annota/chiudi).

### Classe B — Dynamic Context & Attention
*Gestione dinamica del contesto a runtime: aprire/chiudere fonti, pinnare l'attenzione, iniettare update mid-generation, rilevare contraddizioni, decomporre in contesti ad-hoc.* Concept: [[../concepts/harness-capabilities-as-files]] · [[../concepts/explicit-attention-layer]] · [[../concepts/external-update-injection]] · [[../concepts/contradiction-detection-layer]] · [[../concepts/task-decomposition-adhoc-context]].

- **Contesto / perché**: il contesto accumulato degrada l'attenzione (**context-rot** + lost-in-the-middle). Soluzione: costruirlo/ricostruirlo **ad-hoc** invece di accumularlo, e gestire l'attenzione come *segnale esplicito*. `[EXTRACTED]`
- **Funzionamento**:
  - [[../concepts/task-decomposition-adhoc-context]] (il contenitore-loop): primo turno **plan-mode** (emette `<plan>` con step + `assets_needed` + `success_criteria`), poi loop dove il wrapper costruisce per ogni step un **context ad-hoc fresco** (solo aim-step + state di N−1 + assets filtrati + memory top-K) → target **5-15K token/step** vs 100K+ tutto-in-uno.
  - [[../concepts/harness-capabilities-as-files]] (la versione fine-grained): ciclo **`open(temp-read) → extract → note → close-to-reclaim`** su qualsiasi fonte (capacità harness, doc, config), con **N file concorrenti**; il futuro vive nelle NOTE (`block_notes`), non nei file aperti.
  - [[../concepts/explicit-attention-layer]]: pinna le sezioni critiche (**CURRENT AIM · PREV STEP · GLOBAL · RULES**) — 3 implementazioni: (C) prompt-only marker `priority`, (B) auxiliary-loss training-time, (A) bias architetturale agli attention scores.
  - [[../concepts/external-update-injection]]: inietta `<update from external>` ai **confini di `</section>`** del thinking (mai a metà), con 4 priority (critical→restart / high→adjust / normal→defer / low); il modello risponde con `<update_handling>`.
  - [[../concepts/contradiction-detection-layer]]: monitor di coerenza (pre/in-flight/post-inference) che emette un **attention-event** (via external-update-injection) su 5 tipi di contraddizione (Factual deterministico / Semantic LLM-judge / Temporal / Logical / Cross-source con priorità trusted>untrusted).
- **Mapping pi**: `context`/`before_agent_start` (assemblaggio ad-hoc per step + injection lane); coppia `stream_read`/`close_stream_file` (open/close); hook sul confine `</section>` dello stream (injection + contradiction in-flight); il judge semantic è un **small LLM separato** (Qwen3-0.6B), non il main model.
- **MVP vs post**: **MVP** variante (C) prompt-only dell'attention; contradiction implementazione **(B) esterna deterministica** sotto-tipi factual/logical; loop plan/execute; coppia open/close (context-editing nativo). **Post-MVP** attention training-time/architetturale (B/A); **external-update-injection** (richiede streaming-inference che pausa/riprende — supporto serving incerto); contradiction judge semantic; sub-layer neurale (A).
- **Peculiarità nostre**: open/close skill-vs-feature; tassonomia 5-tipi-contraddizione con judge dedicato; `<update from external>` solo ai confini di section; plan-mode/execute-mode con `estimated_thinking_tokens`.

### Classe C — Safety & Guardrails
*I gate deterministici che fermano/trasformano azioni — in ingresso e in uscita.* Concept: [[../concepts/pre-flight-safety-checks]] · [[../concepts/secret-section-exfiltration-defense]] · [[../concepts/untrusted-content-delimiting]] · [[../concepts/agent-constitution]] · [[../concepts/path-portability-awareness]].

- **Contesto / perché**: un agente autonomo può fare danni irreversibili o leakare dati. **Filo comune**: *non fidarsi del solo modello* (aggirabile), ma ancorare la sicurezza a **controlli deterministici harness-side** che il modello non può bypassare. `[EXTRACTED]`
- **Funzionamento** (per direzione del flusso):
  - **Ingresso** — [[../concepts/untrusted-content-delimiting]]: ogni contenuto esterno (web/fetch/API) confinato in **UN solo** `<untrusted_zone>` con **marker UUID per-sandbox** (anti-escape: solo il marker random chiude la zona, non il letterale `</untrusted>`), marcato *dato-non-istruzione* → mitiga prompt-injection (OWASP LLM01).
  - **Uscita** — [[../concepts/secret-section-exfiltration-defense]]: **secrets-map dinamica model-driven** (il modello chiama `add_secret(value)` quando legge un segreto) + **scanner deterministico in uscita** (L3 ⭐) che confronta ogni tool-call arg/token verso l'esterno con la map → **blocca + avvisa**. Più L1 training adversariale, L2 riferimenti opachi `SECRET#n`, L4 refusal-steering opzionale.
  - **Azioni** — [[../concepts/pre-flight-safety-checks]]: gate prima di azioni distruttive (rm/overwrite/DROP/force-push/POST-con-secret/`~/.ssh`); calcola reversibilità (`git ls-files`/`git status --porcelain`) → reversibile=procedi / recoverable=backup-auto / irreversibile=**HALT** con blocco `<safety_halt severity=...>` (campi ASSET/AZIONE/RISK/IRREVERSIBILE/RACCOMANDAZIONI [A/B/C/D]/USER-ACTION).
  - **Path-as-PII** — [[../concepts/path-portability-awareness]]: caso speciale dello scanner in uscita (un path assoluto in artefatto versionato leaka l'username + si rompe cross-OS) → **regex-linter** wrapper-side (0 backslash, 0 home-dir/username su destinazione versionata), **verifier bilanciato** a due errori speculari (falso-assoluto E falso-relativo).
  - **Ombrello** — [[../concepts/agent-constitution]]: codice di condotta operativo (sostituisce Asimov), 16 principi in 6 gruppi A-F (A sicurezza/reversibilità → pre-flight; B riservatezza → secrets; C trasparenza/deferenza incl. **8bis segnala-prima-di-bloccarti**; D veridicità/qualità incl. no-reward-hacking; E coerenza/memoria; F limiti operativi), con **risoluzione conflitti a priorità esplicita** (A,B > C > D > E,F).
- **Mapping pi** (pattern netto e ricorrente): **`tool_call` gate** (pre-flight, constitution-1) · **`tool_result`/output scan** (secrets-L3, path-linter, constitution-4) · **`context` inject** (untrusted-zone wrapping, secrets-L2, constitution nel `SYSTEM.md`). **Un singolo scanner-engine wrapper-side serve 3 concept** (secrets + path + parte di constitution); la constitution li orchestra.
- **MVP vs post**: **MVP/Fase-0** (deterministico, economico, indispensabile): hard-halt di pre-flight (blacklist + git-check), guardrail L3 secrets (map + exact-match + `add_secret`), wrapping `<untrusted_zone>` + marker UUID, regex-linter path, constitution come testo `SYSTEM.md`. **Post-MVP**: livelli appresi (L1 red-team secrets, riconoscimento pattern-injection, L4 steering), orpelli (backup TTL/cron, DB-migration awareness).
- **Provenienza fidata (invariante anti-injection)**: flag come `automod`/trust-level settabili **solo** da fonte fidata (rules/utente), **mai** da contenuto nel contesto.

### Classe D — Reasoning & Recovery (skill-pesante)
*Come il Tier 1 ragiona e si auto-corregge.* Concept: [[../concepts/structured-thinking]] · [[../concepts/scientific-method-operating-protocol]] · [[../concepts/low-confidence-gather-and-reorg]] · [[../concepts/task-interruption-discipline]] · [[../concepts/error-memo-system]].

- **Contesto / perché**: il reasoning improvvisato è verboso, non-verificabile, ad alta varianza e confabula. Serve uno scaffold esplicito + politiche di recovery ancorate all'**outcome**. `[EXTRACTED]`
- **Funzionamento — substrato + macro-loop + 3 recovery**:
  - **Substrato** [[../concepts/structured-thinking]]: "caveman thinking" — scheda contesto + tabelle di check (`≥1 no critico → fermati`) + **marker epistemici `[V]` verificato / `[A]` assunto / `[?]` da-verificare** + verifica pre-risposta + self-correction (`[CORRETTO]`) + rifinitura prosa (il thinking ≠ la risposta user-facing). Metrica: token-pensiero/token-risposta ≤ 1.0.
  - **Macro-loop** [[../concepts/scientific-method-operating-protocol]]: 8 passi observe→orient→decompose→interconnections→parallelization→timeline-blocking→**execute-per-concept-block** (decision-caching semantico)→**verify-loop con cap**. + curriculum **two-phase** (Fase1 CoT lunga-corretta via SFT/RL · Fase2 compressione a CoT corta-adaptive).
  - **Recovery micro** [[../concepts/low-confidence-gather-and-reorg]]: trigger *token-non-in-contesto* → **STOP** → split **INTERNO** (grep/file-search, mai web) vs **ESTERNO** (web solo se pubblico; se privato → **ASK**) → **gather a budget K** con fallback ad ASK. (Caso reale `nv/wh`: errore a monte nello split — privato → unica mossa è ASK, il web *fabbrica* corrispondenze false.)
  - **Recovery macro** [[../concepts/task-interruption-discipline]]: nuova richiesta mentre un task è in corso → default **enqueue + reference-source + finish-then-switch**; **preempt** (con checkpoint) solo su segnale HARD = **invalidazione-via-deps** (cardine) o bloccante-per-altri. Default conservativo ENQUEUE (anti-thrash).
  - **Recovery temporale lungo** [[../concepts/error-memo-system]]: post-mortem → **memo a 2 livelli** (lezione generica + esempi reali) → persistito nel wrapper → reiniettato nel `<memory>` top-K (recency × frequency × semantic) → l'agente non ripete l'errore senza retraining.
- **SKILL vs FEATURE (netto in questa classe)**: **SKILL/pesi** = generare il thinking strutturato, seguire il protocollo, riconoscere bassa-confidence, decidere preempt-vs-enqueue, fare post-mortem. **FEATURE/wrapper** = il contesto strutturato referenziato, gli strumenti di gather (grep/web callable), la lane TASKS/VARS per la preemption, e l'**error-memo come storage esterno callable** (il caso più feature-pesante).
- **MVP vs post**: **MVP** structured-thinking (task primario Tier 1), protocollo 8-passi come system-prompt, policy low-confidence/task-interruption come system-prompt+casi sintetici, error-memo minimale file-based. **Post-MVP** two-phase RL/PRM, reward per-fase addestrato, vector-search semantica + decay dell'error-memo.
- **Invarianti uniti**: ancoraggio all'**outcome** (mai reward alla partecipazione), **falsificabilità** dei trigger (token-non-in-contesto, invalidazione-via-deps, budget-K), penalità **simmetriche** contro i due estremi (over/under).

### Classe E — Routing & Serving (three-tier LoRA)
*Quale modello/adapter esegue, e come pi lo orchestra.* File: [[three-tier-design]] · [[orchestrator-layer]] · [[../decisions/2026-06-23-pi-harness-base]] · [[../concepts/multi-expert-collaboration]] · [[../concepts/xlora-vs-hmora]].

- **Contesto / decisione**: la ground-truth utente = **Tier 1 orchestratore (Qwen base full-FT, organization-specialized)** + **Tier 2 LoRA programming generalist** + **Tier 3 LoRA verticali** caricati uno-alla-volta. NON è MoE neurale né router differenziabile. `[EXTRACTED]`
- **Funzionamento**: il Tier 1 emette una decisione di routing — **token speciale** `<load:programming,vertical:frontend>` — con un **classifier esterno deterministico (BERT-tiny) come safety-net/fallback**; una **extension-router di pi** traduce in selezione adapter sulla richiesta verso vLLM, che fa l'**hot-swap S-LoRA per-richiesta**. Il multi-expert ([[../concepts/multi-expert-collaboration]]) è **sequenziale a confine-di-stage** (segment-and-rerun: ogni expert = nuova chiamata che riusa il contesto strutturato) — auditable, vs il learned-concurrent di [[../concepts/xlora-vs-hmora]].
- **Mapping pi**: hook **`before_agent_start`** → leggi la decisione → setta l'header/adapter sulla richiesta vLLM. pi **non** fa l'hot-swap: lo fa vLLM; pi seleziona.
- **MVP vs post**: **MVP-v1** routing **solo per-richiesta** (1 LoRA/risposta via classifier; Tier1 + Tier3-frontend, skip Tier2). **Post-MVP** per-stage segment-and-rerun multi-expert (Wave 7-8, richiede ≥3 verticali); per-token **scartato**.
- **Vincolo KV-cache (perché il design è segmentato)**: uno swap LoRA mid-forward lascia la KV-cache incoerente coi nuovi pesi → ogni expert = **nuova chiamata** che riusa il contesto accumulato. vLLM/S-LoRA sono ottimizzati esattamente per lo swap per-richiesta.
- **Peculiarità nostre**: SLM **organization-specialized** (coding = capacità AGGIUNTA via LoRA, core-valore = planning/safety/criticality/multi-day); sequenziale-auditable con cross-expert state passing strutturato (**paper-claim #6**), in opposizione esplicita a X-LoRA/HMoRA (baseline).
- **Numeri**: base orchestratore Qwen3-8B (range 8-14B); pipeline di scaling **Qwen3-4B→8B→35B**; MVP locale su 2080 Ti.

### Classe F — Verification & Sandbox (il bottleneck-buster)
*L'infrastruttura che esegue i verifier deterministici — sblocca sia il runtime agentico sia la validazione dei nostri stessi dati di training.* Fonte: [[wrapper-implementation-plan]] §Fase-0/§Fase-2 + i reward dei gold-example ([[../training-taxonomy/gold-example-area02-criticality]]).

- **Contesto / perché** `[EXTRACTED]`: il **collo di bottiglia #1 del progetto NON sono i soldi ma l'harness pi + verifier/sandbox**. Due gate dipendono da questa classe: (1) la generazione dati RL-agentica (Phase-3); (2) la **validazione dei nostri dati GOLD** — il reward dell'esempio gold è un verifier deterministico che esegue `git`/`python` in sandbox su fixture: senza il runner non possiamo nemmeno validare il training set.
- **Funzionamento**: runner isolato (**Docker raccomandato** — riproducibile + allineato ai gym SWE) che esegue i verifier stile-gold (fixture git `FX-untracked`/`FX-tracked`/`FX-cache`/`FX-dynamic` + import-oracle Python) → verde/rosso. Seme del verifier Phase-3 (exec + hidden-test + anti-tamper test-read-only + reward plumbing GRPO).
- **Mapping pi**: estensione **verifier-sandbox** invocata dal loop; per il training è infrastruttura standalone (gym Docker SWE-Gym/SWE-smith/R2E-Gym da scaricare, NON minare da zero).
- **MVP vs post**: **Fase-0** il runner che valida l'esempio gold criticality (le 5 classi verde/rosso sulle fixture) — è la fetta che sblocca tutto. **Fase-2** sandbox/verifier completo per le aree Q (A5/A8/A13/A14) + SWE gym + decontamination.

---

## §3 — Mapping consolidato: hook pi → feature

| Hook pi `[INFERRED da-verificare in Step 0.0]` | Extensions che lo usano |
|---|---|
| `context` / `before_agent_start` | context-assembly (assemblaggio lane) · attention-layer (C prompt-only) · untrusted-zone wrapping · secrets-L2 `SECRET#n` · constitution (`SYSTEM.md`) · temporal inject · ad-hoc context per-step · **lora-router** (scelta adapter) |
| `tool_call` (gate, pre-esecuzione) | **pre-flight-safety** (HALT azioni distruttive) · hard-limit trigger-and-ask |
| `tool_result` / output scan | **secrets-guardrail L3** · **path-linter** · temporal tool-log · untrusted classification provenienza · last_tool_calls con scope |
| confine `</section>` nello stream | **external-update-injection** · contradiction in-flight |
| lifecycle / storage sessione | VARS-queue persistence (JSON/SQLite) · error-memo (storage esterno) · session tree-structured |
| tool LLM-callable registrati | `add_secret` · `stream_read`/`close_stream_file` · `set_history_window` · sliding-window-var · `<load:X>` |

> **Insight**: un **singolo scanner-engine in uscita** serve 3 feature (secrets + path-PII + constitution-4); un **singolo punto di assemblaggio** (`ctx.getContext()`) serve tutta la classe A+B; un **singolo confine-di-section** serve injection + contradiction. L'implementazione è più condivisa di quanto i concept separati suggeriscano.

---

## §4 — Build fasato (cosa è MVP)

- **Fase 0 — Walking skeleton (bottleneck-buster) ⭐**: scaffold pi + 1ª extension · vLLM Qwen3-4B come provider OpenAI-compatible · hook `context` minimale (`rules`+`current_aim`+`task_list`) · **verifier-sandbox** (valida il gold criticality) · **secrets-guardrail** + **pre-flight-safety** (le 2 difese economiche ad alto valore). → sblocca la validazione-dati + dimostra l'harness end-to-end.
- **Fase 1 — Wrapper MVP-v1**: routing classifier→vLLM per-richiesta (Tier1+Tier3-frontend) · context-assembly completo (tutte le lane + VARS-queue + sliding-window + history 2-livelli) · TUI nativa pi.
- **Fase 2 — Abilitatori Phase-3 (dati RL)**: sandbox/verifier completo per aree Q + error-memo + SWE gym Docker + decontamination.
- **Fase 3 — Post-MVP**: token-routing `<load:X>` · multi-expert segment-and-rerun · contradiction-detection · external-update-injection · explicit-attention training-time · frontend Web/Tauri.

---

## §5 — Decisioni trasversali (già prese)

1. **KV-cache = NON priorità** (utente 2026-06-27): si privilegia la **qualità del contesto** sul cache-reuse. SLM in **locale** → ricomputo del suffisso = **latenza, non costo** (no billing per-token). Le mitigazioni (tombstone logico, batch-close a fine-blocco, layout prefix-cache-aware: lane stabili in testa/dinamiche in coda) restano come **ottimizzazione layered**, mai come vincolo che limita il close-to-reclaim. → governa tutte le scelte di eviction/ricostruzione delle classi A/B/E.
2. **Scorer ≠ scored / outcome-anchored**: ogni reward verificabile è ancorato a uno stato reale (git/exit-code/diff/trace), mai all'auto-dichiarazione. Difesa anti participation-hack e check-fantasma. → [[../concepts/reward-hacking-mitigation]].
3. **Provenienza fidata**: flag operativi (`automod`, trust-level) solo da fonte fidata, mai da contenuto nel contesto (anti prompt-injection).
4. **pi = harness, ricerca = modello+training**: separazione di concern rigorosa; il LoRA hot-swap è del serving, non di pi.

---

## §6 — Open question / da verificare (per l'allineamento)

**Bloccanti tecniche (Step 0.0 — verificare il sorgente reale di pi)** `[EXTRACTED]`:
- pi supporta un endpoint OpenAI-compatible custom verso vLLM con **selezione adapter LoRA per-request**?
- L'API Extensions è stabile e dà accesso a **inject pre-turn / filter history / window control**?
- Lo **storage sessione tree-structured** regge multi-day + VARS persistence?
- Overhead RPC/SDK accettabile per il frontend?
- pi supporta **streaming-inference che pausa/riprende** (necessario per external-update-injection)? — se no, quella feature resta post-MVP.

**Decisioni di prodotto (candidate grill-me #2 — default raccomandati)**:
- **Deployment MVP**: TUI nativa pi *(reco, più rapida)* → Web/Tauri post-MVP.
- **Sandbox tech**: **Docker** *(reco: riproducibile, allineato ai gym SWE)* vs bare-process.
- **Granularità tool**: tool **aggregate** (`apply_patch`/`run_tests`/`git_commit`) *(reco: ergonomia agentica + verificabilità)* vs atomici.
- **Repo**: workspace **`slm-wrapper/` separato** *(reco — il wrapper ≠ wiki di ricerca)* vs subdir di `slm/`.
- **Memory layer**: SQLite + embedding, differito a Fase 3.
- **Thinking mode**: Qwen3 native dual-thinking + i nostri marker strutturati *(reco)*.

---

## Sources
- [[wrapper-implementation-plan]] (piano operativo fasato) · [[../decisions/2026-06-23-pi-harness-base]] (ADR base) · [[wrapper]] (3 layer) · [[three-tier-design]] · [[orchestrator-layer]].
- Concept estratti 2026-06-27 (28 file): le 6 classi sopra linkano i rispettivi concept di dettaglio.
- [[../training-taxonomy/gold-example-area02-criticality]] (il reward = verifier che la Classe F deve eseguire).

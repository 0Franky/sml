---
name: harness-feature-catalog
description: Catalogo completo delle feature-class che introduciamo NOI sul harness pi — le 6 classi (Context-Assembly & Memory · Dynamic Context & Attention · Safety & Guardrails · Reasoning & Recovery · Routing & Serving · Verification & Sandbox), con contesto, funzionamento, mapping sugli hook di pi, MVP-vs-post-MVP, principio SKILL(pesi)-vs-FEATURE(wrapper), decisioni trasversali e open question per l'allineamento.
type: architecture
tags: [harness, wrapper, pi, feature-catalog, extensions, three-tier, mvp, alignment]
sources: [wiki/architecture/wrapper.md, wiki/decisions/2026-06-23-pi-harness-base.md, wiki/architecture/wrapper-implementation-plan.md, wiki/concepts/* (28 concept estratti 2026-06-27)]
last_updated: 2026-06-29
status: draft v1 (sintesi review-loop-ready) + §2bis completeness-check + §2ter metacognition-needs-training audit (2026-06-27)
confidence: provisional
---

# Harness / Wrapper — Catalogo delle Feature Class

> **Scopo di questo documento**: rispondere alla domanda *"come lo andremo a realizzare, quali sono tutte le classi/categorie di feature che introduciamo NOI, con contesto + funzionamento, per capire se siamo allineati"*. È la sintesi navigabile di 28 concept/architecture file. Per il piano operativo fasato vedi [[wrapper-implementation-plan]]; per la decisione di base vedi [[../decisions/2026-06-23-pi-harness-base]].

> 🆕 **Redirezione Strada-2 (2026-06-29)** — vedi [[../decisions/2026-06-29-context-as-first-person-mind]] + [[../decisions/2026-06-29-compaction-coherence]]: il `<context>` è la **mente in prima persona** del modello. Impatto sul catalogo: la lane **`<messages_with_user>`** della classe *Context-Assembly & Memory* diventa **CENTRALE** (non opzionale), serializzata via hook **`context`** (espone i messaggi — **NON** `before_provider_request`, che prende solo `payload`); si aggiungono **conversation-store-by-ID** + **matrioska/nested-compact**; la **compaction nativa di pi va spenta** (`enabled=false`), sostituita da curazione continua del workspace. TODO in [[../todo|todo §NEXT BUILD]].

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

> ✅ **Step 0.0 VERIFICATO (2026-06-27)** `[VERIFICATO]`: i nomi-hook (`context`/`before_agent_start`/`tool_call`/`tool_result`/`before_provider_request`/`turn_end`/`message_end`), `registerTool`+TypeBox, il supporto vLLM/Ollama in `models.json`, l'API Extensions (auto-discovered, senza fork) e lo storage sessione tree-structured **sono confermati** contro doc+sorgente di pi. **2 divergenze materiali** (riprese sotto nelle Classi B/E): (1) NON esiste un hook "confine di sezione" → contradiction/external-update su **turn-boundary/steering**; (2) LoRA routing via **model-entry+`pi.setModel`** (primario) > payload-rewrite. Dettaglio in [[wrapper-implementation-plan]] §Step-0.0.

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
- **Peculiarità nostre**: history gerarchica 2-livelli con compressione; VARS registry O(1) + slice-on-demand; `last_tool_calls` con scope; N model-set metacognitivo gemello di `close_stream_file`; constraint capture esplicito-vs-dedotto; **lane `situation-table`** (router situazione→azione, [[../concepts/situational-policy-table]]) — lookup O(1) = FEATURE, recognition = SKILL addestrata.
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
- **Mapping pi** `[VERIFICATO]`: `context`/`before_agent_start` (assemblaggio ad-hoc per step + injection lane); coppia `stream_read`/`close_stream_file` (open/close). ⚠️ **Decisione utente (msg 193) — il section-boundary lo implementiamo NOI**: pi non espone un hook "confine di `</section>`", MA **NON degradiamo a turn-boundary** (section≠turn, materialmente diversi; principio: non compromettere un design deliberato per un limite del tool). Realizziamo il confine-di-sezione **noi**, lato wrapper/serving, via **multi-call con `stop=["</section>"]`** (pattern MinD, arXiv 2505.19788): ogni sezione è una chiamata che si ferma al tag, il wrapper valuta/inietta l'`<update>`, poi riprende con una nuova chiamata che **riusa il pensiero via Automatic Prefix Caching** (ricomputo del solo update → costo basso, fattibile su vLLM stock). `turn_end`/`message_end`/`session.steer()` restano fallback grezzo. ⚠️ **Valore gated sul TRAINING**: un modello non addestrato all'interruzione perde fino a −60% accuracy (arXiv 2510.11713: Reasoning-Leakage/Panic/Self-Doubt) → serve la skill [[../concepts/interruption-robust-reasoning]]. Il judge semantic della contradiction è un **small LLM separato** (Qwen3-0.6B), non il main model.
- **MVP vs post**: **MVP** variante (C) prompt-only dell'attention; contradiction implementazione **(B) esterna deterministica** sotto-tipi factual/logical; loop plan/execute; coppia open/close (context-editing nativo). **Post-MVP** attention training-time/architetturale (B/A); **external-update-injection** (fattibile su vLLM stock via **multi-call MinD `stop=["</section>"]` + APC**, NON richiede pause/resume; gated sul training interruption-robust); contradiction judge semantic; sub-layer neurale (A).
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
  - **Recovery micro** [[../concepts/low-confidence-gather-and-reorg]]: trigger *token-non-in-contesto* → **STOP** → split **INTERNO** (grep/file-search, mai web) vs **ESTERNO** (web solo se pubblico; se privato → **ASK**) → **gather a budget K** con fallback ad ASK. (Caso reale di riferimento-opaco a repo privato: errore a monte nello split — privato → unica mossa è ASK, il web *fabbrica* corrispondenze false.)
  - **Recovery macro** [[../concepts/task-interruption-discipline]]: nuova richiesta mentre un task è in corso → default **enqueue + reference-source + finish-then-switch**; **preempt** (con checkpoint) solo su segnale HARD = **invalidazione-via-deps** (cardine) o bloccante-per-altri. Default conservativo ENQUEUE (anti-thrash).
  - **Recovery temporale lungo** [[../concepts/error-memo-system]]: post-mortem → **memo a 2 livelli** (lezione generica + esempi reali) → persistito nel wrapper → reiniettato nel `<memory>` top-K (recency × frequency × semantic) → l'agente non ripete l'errore senza retraining.
- **SKILL vs FEATURE (netto in questa classe)**: **SKILL/pesi** = generare il thinking strutturato, seguire il protocollo, riconoscere bassa-confidence, decidere preempt-vs-enqueue, fare post-mortem. **FEATURE/wrapper** = il contesto strutturato referenziato, gli strumenti di gather (grep/web callable), la lane TASKS/VARS per la preemption, e l'**error-memo come storage esterno callable** (il caso più feature-pesante).
- **MVP vs post**: **MVP** structured-thinking (task primario Tier 1), protocollo 8-passi come system-prompt, policy low-confidence/task-interruption come system-prompt+casi sintetici, error-memo minimale file-based. **Post-MVP** two-phase RL/PRM, reward per-fase addestrato, vector-search semantica + decay dell'error-memo.
- **Invarianti uniti**: ancoraggio all'**outcome** (mai reward alla partecipazione), **falsificabilità** dei trigger (token-non-in-contesto, invalidazione-via-deps, budget-K), penalità **simmetriche** contro i due estremi (over/under).

### Classe E — Routing & Serving (three-tier LoRA)
*Quale modello/adapter esegue, e come pi lo orchestra.* File: [[three-tier-design]] · [[orchestrator-layer]] · [[../decisions/2026-06-23-pi-harness-base]] · [[../concepts/multi-expert-collaboration]] · [[../concepts/xlora-vs-hmora]].

- **Contesto / decisione**: la ground-truth utente = **Tier 1 orchestratore (Qwen base full-FT, organization-specialized)** + **Tier 2 LoRA programming generalist** + **Tier 3 LoRA verticali** caricati uno-alla-volta. NON è MoE neurale né router differenziabile. `[EXTRACTED]`
- **Funzionamento**: il Tier 1 emette una decisione di routing — **token speciale** `<load:programming,vertical:frontend>` — con un **classifier esterno deterministico (BERT-tiny) come safety-net/fallback**; una **extension-router di pi** traduce in selezione adapter sulla richiesta verso vLLM, che fa l'**hot-swap S-LoRA per-richiesta**. Il multi-expert ([[../concepts/multi-expert-collaboration]]) è **sequenziale a confine-di-stage** (segment-and-rerun: ogni expert = nuova chiamata che riusa il contesto strutturato) — auditable, vs il learned-concurrent di [[../concepts/xlora-vs-hmora]].
- **Mapping pi** `[VERIFICATO]`: la strada **primaria raccomandata** è un **model-entry distinto per adapter** in `models.json` (stesso `baseUrl`, `id`/`name` diverso) + **`pi.setModel`** per il routing (dichiarativo, nativo) → il routing diventa "switch del modello", non patch fragile. **Fallback**: hook `before_provider_request` che rimpiazza `event.payload` (per iniettare `extra_body`/`adapter`). pi **non** fa l'hot-swap: lo fa vLLM; pi seleziona. Il **nome-campo** dell'adapter è lato vLLM, da validare separatamente.
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

## §2bis — Aggiunte dal completeness-check vs raw notes 2026-06-23

> **Verifica di completezza** (delega utente 2026-06-27: *"sei confidente che è tutto quello che ci siamo detti?"*): cross-check del catalogo contro i raw [[../concepts/_user-notes-2026-06-23]] (9 note non-tutte-formalizzate). **4 capacità erano sotto-rappresentate** → integrate qui con la loro classe. Onestà: il catalogo §2 era ~90% completo; queste chiudono il gap.

1. **Steering vectors — modulazione runtime (4° asse di controllo) → Classe E** `[EXTRACTED nota 1]`. Activation steering: una direzione aggiunta al residual stream a inference (`h' = h + α·v`) che **modula** il comportamento **senza toccare i pesi**. **Ortogonale ai LoRA** → 4° asse sopra i 3 tier: i tier danno *capacità*, lo steering dà *modulazione fine reversibile a costo ~0* (depth-reasoning · caution/criticality · refusal/anti-exfiltration = L4 della Classe C · dominio-fine). **FEATURE** (serving): applicazione del vettore a inference (toggle disattivabile, *fuori* dagli hook testuali di pi — è inference-level); **SKILL** (pesi): *quando/quanto* applicarlo (α guidato dalla difficoltà stimata). **Fase**: post-MVP (Wave 6+, esperimento depth-vector su Qwen3-4B). → [[../concepts/steering-vectors]] (8 aree d'applicazione, le 3 più promettenti).

2. **Context-management model-driven esplicito: autocompact + degradation-awareness → Classe A/D** `[EXTRACTED note 4+5]`. Il modello (a) **riconosce il proprio stato degradato** (contesto troppo lungo/sporco, loop, perdita del filo) e (b) emette un'azione di **compact/edit del proprio contesto**. **SKILL** (pesi): il *quando* (metacognitive-degradation-awareness = trigger). **FEATURE** (wrapper): il **tool callable `compact_context`/`edit_context`** + l'assemblaggio dinamico conseguente — risoluzione utente 2026-06-23: il contesto è **wrapper-managed**, il modello *istruisce cosa tenere/buttare* (variante b, non self-rewrite del window). Già parzialmente sotto constitution-15; qui reso **esplicito come tool** e come skill metacognitiva. Estende la primitiva (3) della Classe A. → [[../concepts/self-analysis-strategy-revision]] (autoanalisi di traiettoria/strategia, reward outcome-anchored anti-confabulazione).

3. **Decision-point lookahead (simula A/B + decidi/defer) → Classe D** `[EXTRACTED nota 9]`. Ai bivi: simula gli esiti di A vs B, li valuta su *affinità-all'intento / tradeoff / migliorabilità*, e decide **procedi / cerca-strada-migliore / chiedi-con-contesto** (template: strada-attuale + alternative + effort + reco). Signature capability organization-first; vive in training-taxonomy (Area 2 Topic 6 + Area 9) e constitution C6/C7. **Skill-pesante** (pesi); il deferral async non-bloccante è feature wrapper (warn-before-blocking).

4. **Domain-tag sui riassunti outer-task (doppio uso: awareness + routing) → Classe A+E** `[EXTRACTED nota 2]`. Ogni riassunto di task esterno/gerarchico porta **tag di dominio** (coding/finance/...) che servono sia all'awareness gerarchica (Classe A, lane `interconnections`/summary) sia come **segnale di routing** per il classifier che sceglie il LoRA verticale (Classe E). Multi-label per task compositi (es. `coding+finance`).

> **Esito**: il resto delle note 2026-06-23 è **training-side** (note 3/6a/6b/7 = regimi di training, non feature harness → correttamente fuori dal catalogo, vivono in training-taxonomy) o **già coperto** (nota 8 = secrets, Classe C). Le idee 2026-06-27 (path-portability, harness-as-files, low-confidence, task-interruption, dataset-on-fly, phased-reward, KV-cache, T-group) sono già nelle Classi B/C/D. **Confidenza dopo il patch: alta** — il catalogo copre ora le capacità harness/runtime discusse; i regimi di training puri restano fuori scope by-design.

---

## §2ter — Le skill metacognitive richiedono TRAINING (audit 2026-06-27, conferma intuizione utente)

> **Domanda utente (2026-06-27)**: *"alcune di queste cose dovrebbero rientrare nel training per avere efficienza maggiore — es. riconoscere il contesto degradato / capire quando fare compact credo abbiano bisogno di un training set"*. **Verdetto review-loop (3 reviewer + ricerca SOTA): l'intuizione è CORRETTA e PRECISA** — ha individuato esattamente la classe giusta, le **capacità metacognitive di self-management del contesto**.

**Problema diagnosticato**: il principio SKILL-vs-FEATURE (§1) è corretto *in tabella*, ma in 4 punti la **prosa/fasatura tratta come "feature consegnabile in Fase 1" capacità il cui valore è gated su una SKILL non-addestrata**. Su un 4-8B queste skill NON sono native affidabili → senza training il tool è **guscio inerte** (o confabulante: chiama `compact_context` a caso, non riconosce la bassa-confidence, simula bivi inventati). È il rischio C4 ("il vero bottleneck è il modello") applicato **capacità-per-capacità**.

### Audit per-capacità — stato SENZA training
| Capacità | Feature basta? | Serve training? | Stato senza training | Regime |
|---|---|---|---|---|
| context-assembly · scanner sicurezza · task-interruption(default-ENQUEUE) · lora-router-mech · error-memo-storage | **Sì** | No | **piena** | — (feature pura) |
| structured-thinking [V]/[A]/[?] · scientific-method | No | **Sì (totale)** | inerte | SFT→RL (task primario Tier 1) |
| **context-management model-driven** (gestione budget) | tool sì | **Sì** | **degradata-ma-utile** (euristiche wrapper ~80%) | SFT-bootstrap → RL |
| **degradation-awareness + when-to-compact** | tool sì | **Sì** | **inerte** (tool senza trigger non scatta) | SFT-boot → **RL-GRPO** |
| **low-confidence → gather/ask** | tool grep/web sì | **Sì** | **inerte** (il caso del riferimento-opaco-a-repo-privato È un fallimento di questa skill) | SFT-traj → **RL uncertainty-aware** |
| **decision-point lookahead** | guscio deferral sì | **Sì (+rischio confabulazione)** | **inerte** | SFT-branch → RL (roll-out duale) |
| **dependency-aware-error-recovery** (truth-maintenance sul dep-graph) | dep-graph sì | **Sì** | **inerte** (il dep-graph esiste; traversare + ri-esaminare il downstream è skill) | SFT-traj → RL outcome (il fix a cascata ha risolto davvero?) |
| **interruption-robust-reasoning** (resume-after-update a fine sezione) | meccanismo MinD sì | **Sì** | **inerte/degradata** (−60% se non addestrato, 2510.11713) | SFT-interruzione → RL (l'update ha migliorato la risposta?) |
| steering-vector application | applicazione=serving | parziale (solo policy α) | meccanismo=piena, policy-α=degradata | no-training-pesi (estrazione contrastiva) |

→ **Le 4 metacognitive marcate "inerte"** sono **training travestito da feature** nella prosa attuale → ri-marcate "gated su training", valore reale in **Fase 2 (bootstrap) → Fase 3 (RL)**, non Fase 1.

### Regime di training (SOTA-validato) `[EXTRACTED ricerca 2026-06-27]`
Principio: **SFT-bootstrap del formato (Fase 2) → RL-GRPO outcome-anchored (Fase 3)**. Reward MAI sul self-report né sul gesto (anti participation-hack, regole #8/#10), SOLO sull'**outcome verificabile a valle**. SOTA chiave:
- **AdaCoM** (arXiv 2605.30785) — match diretto "when-to-compact": **manager LLM separato** (Qwen3-4B), SFT-bootstrap → **GRPO con agente frozen**; nessuna label esplicita, policy da **two-level reward** (outcome + process rule-based: token-overflow/redundant-action penalty, gold-retrieval reward). *Scorer ≠ scored a livello architetturale.*
- **ReSum/ReSum-GRPO** (arXiv 2509.13313) — schedule predefinito subottimo → appreso; **segmented-trajectory + advantage broadcasting**; 1K sample bastano.
- **S-GRPO / "Learning When to Think"** (arXiv 2505.10832) — decaying-reward su exit-position (agire prima ma corretto = reward più alto): degradation/lookahead/adaptive-depth.
- **EVPI clarification** (arXiv 2511.08798) / **SELAUR** (arXiv 2602.21158) — uncertainty-aware reward col **costo della domanda**: low-confidence gather/ask (= "l'info ha cambiato la decisione?").
- **Limite critico** (arXiv 2509.21545): metacognizione LLM limitata + **verbalized-confidence sovra-confidente** → NON premiare il self-report.
- **Context-rot** (Chroma + Lost-in-the-Middle Liu 2023): in parte **architetturale** (RoPE-decay) → la skill è "**riconoscere** di essere degradato e **agire**", non "non degradare".

### Generazione LABEL (il debito vero, ora indirizzato)
Metodi componibili (robustezza decrescente): (1) **sintetiche by-construction** (inietti loop/drift a posizione nota → label esatta); (2) **outcome-retrospettivo bisect** (traiettorie fallite → punto di collasso = boundary degrado, alla AdaCoM); (3) **self-consistency drop**; (4) **sonde held-out** (post-compact: l'info-chiave è ancora risolvibile? non-gameable con verbosità); (5) **EVPI** (necessità × cambio-decisione − costo).

### Taxonomy + gap (follow-up Fase-2)
**Esiste già `../training-taxonomy/area-04-context-metacognition`** (9 foglie). Gap: **[FASE]** re-annotare le foglie metacognitive come primariamente Fase-3-RL (SFT=solo bootstrap); **[FOGLIA NUOVA]** `compaction-scheduling decision` (il *quando*, distinto dal *cosa*); **[ESPLODI]** low-confidence in example-space (5 classi) con reward EVPI; **[RE-TAG]** decision-lookahead Area 2: L → **Q+L** (il ramo si roll-outa); **[CROSS-LINK]** Area 3 adaptive-depth ↔ Area 4; **[NON-GAP]** steering resta fuori-tassonomia (confermato).

### Correzioni §2bis applicate
- **Steering** → tieni SOLO l'esperimento minimo (depth-vector Qwen3-4B). ⚠️ **Blocker di fattibilità** (non "next"): su Qwen3 hybrid (Gated DeltaNet/MoE-A3B) il residual stream è diverso → potrebbe non trasferire; decidere PRIMA. **Precisazione (review 2026-06-27)**: l'MVP è **Qwen3-4B dense** → residual stream standard, steering applicabile in linea di principio (vettori da estrarre sul checkpoint dense specifico, NO riuso cross-checkpoint). Il blocker hybrid vale solo per le **varianti MoE più grandi** della pipeline di scaling (8B→35B), non per l'MVP. **Opt-in (utente 2026-06-27, msg 192)**: feature opt-in controllata dall'utente; test specifici per capire se migliora o degrada; se migliora → promuovi a **opt-out** (default-on).
- **Autocompact** → **consolidare** (era contato 3×: primitiva A-3 + constitution-15 + 2bis) in una primitiva + riferimenti. **Fase 1 = solo trigger euristico wrapper-side** (soglia `getContextUsage` → compatta), dichiarato tale; la degradation-awareness *appresa* è Fase 2+ misurata con un test (come 0-A.4).
- **Lookahead** → **regola #10 esplicita**: reward SOLO se l'esito previsto è verificato contro l'outcome reale, MAI per la forma (è la più esposta alla catena-fantasma).
- **Domain-tag** → definire la **precedenza** tra i 3 segnali di routing (token `<load:>` · classifier · domain-tag); il tag model-generated è **validato dal classifier esterno** (safety-net Classe E).
- **Contradiction semantic judge** → è un **terzo asset** (Qwen3-0.6B da addestrare/validare), non "una feature"; factual/logical = deterministica.

> **Bottom line**: le 4 aggiunte §2bis apportano **valore reale (zero "minchiate")**, ma con un **debito di ancoraggio** sulle metacognitive. La spina dorsale (scanner deterministici · scorer≠scored · default-safe wrapper-side · misura-gap 0-A.4) è solida e onesta. Chiuso il debito (ground-truth + trigger falsificabile + regime SFT→RL), queste diventano addestrabili; lasciato aperto, sarebbero vettori di reward-hacking — esattamente il timore dell'utente.

---

## §3 — Mapping consolidato: hook pi → feature

| Hook pi `[VERIFICATO Step 0.0 2026-06-27]` | Extensions che lo usano |
|---|---|
| `context` / `before_agent_start` | context-assembly (assemblaggio lane) · attention-layer (C prompt-only) · untrusted-zone wrapping · secrets-L2 `SECRET#n` · constitution (`SYSTEM.md`) · temporal inject · ad-hoc context per-step · **lora-router** (scelta adapter) |
| `tool_call` (gate, pre-esecuzione) | **pre-flight-safety** (HALT azioni distruttive) · hard-limit trigger-and-ask |
| `tool_result` / output scan | **secrets-guardrail L3** · **path-linter** · temporal tool-log · untrusted classification provenienza · last_tool_calls con scope |
| confine `</section>` **realizzato dal wrapper** (multi-call `stop=["</section>"]`, pattern MinD — NON un hook pi nativo) | **external-update-injection** · contradiction in-flight (gated sul training interruption-robust) |
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
- ~~pi supporta streaming-inference che pausa/riprende?~~ **CHIUSA (msg 193 + ricerca)**: NON serve pause/resume — il section-boundary si realizza via **multi-call con `stop=["</section>"]`** (MinD) + APC su vLLM stock. Resta post-MVP per la **dipendenza dal training** (interruption-robust), non per fattibilità.

**Decisioni di prodotto (candidate grill-me #2 — default raccomandati)**:
- **Deployment MVP**: TUI nativa pi *(reco, più rapida)* → Web/Tauri post-MVP.
- **Sandbox tech**: **Docker** *(reco: riproducibile, allineato ai gym SWE)* vs bare-process.
- **Granularità tool**: tool **aggregate** (`apply_patch`/`run_tests`/`git_commit`) *(reco: ergonomia agentica + verificabilità)* vs atomici.
- **Repo**: **subdir `harness/` del monorepo `ITLMv1`** ✅ (decisione utente msg 319/323 — SSOT centralizzata in `wiki/`; ADR `decisions/2026-06-29-monorepo-itlmv1.md`). *(reversal della reco iniziale "repo separato": il vantaggio del grafo+wiki unici ha prevalso.)*
- **Memory layer**: SQLite + embedding, differito a Fase 3.
- **Thinking mode**: Qwen3 native dual-thinking + i nostri marker strutturati *(reco)*.

---

## Sources
- [[wrapper-implementation-plan]] (piano operativo fasato) · [[../decisions/2026-06-23-pi-harness-base]] (ADR base) · [[wrapper]] (3 layer) · [[three-tier-design]] · [[orchestrator-layer]].
- Concept estratti 2026-06-27 (28 file): le 6 classi sopra linkano i rispettivi concept di dettaglio.
- [[../training-taxonomy/gold-example-area02-criticality]] (il reward = verifier che la Classe F deve eseguire).

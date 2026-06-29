---
name: wrapper-implementation-plan
description: Piano di implementazione del wrapper/harness su base pi. v3 post review-loop (4 reviewer 2026-06-27). Fase 0 riformulata in 3 gate onesti (dati/verifier model-independent · serving de-risk · pi skeleton minimale). Step 0.0 API pi VERIFICATO.
type: plan
status: draft v3 — post review-loop (criticità risolte); pronto per esecuzione Fase 0
last_updated: 2026-06-27
---

# Piano di implementazione del Wrapper (harness su pi)

> Companion di [[harness-feature-catalog]] (le 6 feature-class) e [[../decisions/2026-06-23-pi-harness-base]] (ADR base). Questo file è il **come si costruisce**; il catalogo è il **cosa**. v3 incorpora le criticità del review-loop 2026-06-27 (§Review-loop sotto).

## Context — perché ora, e cosa la Fase 0 prova DAVVERO

Il collo di bottiglia **dichiarato** è "harness pi + verifier/sandbox" (`data-volume-estimate.md` §7.2), perché il reward dell'esempio gold ([[../training-taxonomy/gold-example-area02-criticality]]) **È** un verifier deterministico git/python su fixture — senza il runner non possiamo nemmeno validare il nostro training set.

> ⚠️ **Onestà sul bottleneck (review-loop)**: il bottleneck #1 *del progetto* NON è l'harness ma la **qualità del Tier 1** — un harness perfetto attorno a un modello che non sa emettere i marker `[V]/[A]/[?]` né chiamare `git ls-files` prima del `rm` **non prova nulla sul progetto**. L'harness è l'*abilitatore* del bottleneck-dati (RL Phase-3), non il bottleneck. Conseguenza: la **Fase 0 prova l'infrastruttura di verifica + il serving + il wiring** (risultato di systems-engineering, vero a prescindere dal modello), **NON** "il three-tier funziona" (promessa di ricerca, gated sul modello addestrato). Misurare il **gap del base-model** sul formato gold (few-shot, pre-training) è parte della Fase 0-A: è la misura che dice se il rischio reale è l'harness o il modello/dati.

> Progetto pre-codice: questo piano **crea** un workspace wrapper + estensioni pi.

---

## ✅ Step 0.0 — API reale di pi: VERIFICATA (2026-06-27)

Verifica su `pi.dev/docs/latest/*` + sorgente `github.com/earendil-works/pi`. **Maggior parte delle assunzioni CONFERMATA**; 2 divergenze materiali adattate.

**Confermato** `[VERIFICATO]`: Extensions senza fork (`.pi/extensions/*.ts`, default-export factory `(pi)=>{}`); hook reali (ordine turno): `input → before_agent_start → agent_start → turn_start → context → before_provider_request → after_provider_response → tool_execution_start → tool_call`(BLOCK: `{block:true,reason}`)`→ tool_execution_end → tool_result`(MODIFY: `{content,isError}`)`→ message_end → turn_end → agent_end`; più `message_update` (delta streaming) e compaction (`session_before_compact`, `ctx.compact()`, `ctx.getContextUsage()`); tool via `pi.registerTool`+TypeBox; provider locale via `models.json` (`api:"openai-completions"`, vLLM/Ollama citati) o `pi.registerProvider`; stato via `appendCustomEntry` (CustomEntry **fuori** dal context) / `appendCustomMessageEntry` (dentro); sessioni tree-JSONL; deployment TUI/print/**RPC**/**SDK** (`createAgentSession`, `session.prompt/subscribe/steer/followUp`).

**Divergenze adattate** `[VERIFICATO]`:
1. **NON esiste hook "confine di sezione"** nativo in pi — MA (decisione utente msg 193) lo **implementiamo noi** lato wrapper/serving via **multi-call con `stop=["</section>"]`** (pattern MinD, arXiv 2505.19788) + Automatic Prefix Caching (riuso del pensiero, ricomputo del solo update). **NON degradiamo a turn-boundary** (section≠turn). → external-update-injection + contradiction-in-flight si agganciano a questo confine-di-sezione realizzato dal wrapper; `turn_end`/`message_end`/`session.steer()` restano fallback. ⚠️ valore gated sul training (interruption-robust, −60% se non addestrato, arXiv 2510.11713).
2. **LoRA routing**: primario = **model-entry per adapter in `models.json` + `pi.setModel`** (dichiarativo); fallback = `before_provider_request` payload-rewrite. ⚠️ **Single point of validation**: il `model` id della request OpenAI deve combaciare col nome-adapter vLLM (`--lora-modules <name>=<path>`) → da validare in 0.1 (vale per primaria E fallback).
3. **Context-window**: niente hard-cap nativo. La window è **enforced da NOI** nell'hook `context` (filtro/rimpiazzo messaggi); `getContextUsage`/`ctx.compact` sono *segnale* + *fallback di compattazione*.
4. **Secrets assistant-side**: `tool_result` redige l'output dei tool (atomico, affidabile); `message_end` redige in modalità non-streaming (MVP TUI) ma in **streaming** (Fase-3) è **detect-non-prevent** → la prevenzione reale resta L1 (training) + L2 (`SECRET#n` opachi, il valore raw non entra mai nell'output).

> **Non verificato (dichiarato)**: shape campo-per-campo di `event.payload`; `ctx.abort()`; protocollo RPC dettaglio; HF per-nome; round-trip `appendCustomEntry`→lettura dentro hook `context` (da confermare in impl — vedi §Review-loop C1).

---

## §Review-loop 2026-06-27 — criticità & risoluzioni

4 reviewer (3 verticali pi-fidelity/MVP-scoping/feature-completeness + 1 agnostico). Criticità risolte in questa v3:

| # | Criticità | Severità | Risoluzione (in v3) |
|---|---|---|---|
| C1 | Round-trip `appendCustomEntry`→lettura dentro `context` dato per scontato | CRITICA | Marcato come **da-validare in impl** (0-C); fallback: stato in closure dell'extension, custom-entry solo per replay. |
| C2 | Verifier (0.3) = cuore difficile, **monolitico** (impacchetta minimo + metà sandbox Fase-2) | CRITICA | **Split 0.3a/0.3b**: 0.3a (model-independent, Fase-0) = FX-untracked/tracked + import-oracle + **trace-introspection caught/phantom** + balanced-accuracy; 0.3b (→Fase 2) = FX-cache/dynamic, verify_loop_reale, value-tier/batch/self-versioning/secret-veto. |
| C3 | **Contratto formato-trace** (su cui poggia caught-vs-phantom) hand-waved + dipendenza nascosta (trace è Fase-1, serve a 0.3) | CRITICA | Aggiunto **0.2b**: schema minimo trace tool-call (nome+args+output+scope, JSONL) — prerequisito del verifier; verificare che pi distingua tool-call *eseguita* vs *menzionata-nel-thinking*. |
| C4 | Il vero bottleneck è il **modello**, non l'harness | ESISTENZIALE | Riformulato cosa prova la Fase 0 (vedi Context ⚠️); aggiunta **misura gap base-model** (0-A.4). |
| C5 | **Serving su 2080 Ti** = mini-progetto nascosto (quantizzazione, vLLM-Turing fragile, `--max-loras` VRAM) | CRITICA | Gate **0-B** separato: Qwen3-4B-AWQ via curl *prima* di pi + **piano B** (modello più piccolo / GPU a ore). |
| C6 | **Classe C scoperta**: untrusted-zone, constitution, path-linter cadute (tutte catalog-MVP) | ALTA | Aggiunte a 0-C (path-linter riusa lo scanner secrets; constitution = `SYSTEM.md` 3-righe minimale; untrusted-zone → Fase 1, serve solo quando l'agente fa web/fetch). |
| C7 | Routing Fase-1 degenere con 1 solo verticale + dipendenza cross-pipeline non dichiarata | MEDIA | Declassato a **stub dichiarativo** (2 model-entry + `setModel` + regex/passthrough); classifier BERT-tiny vero → Fase 3 con ≥2 verticali. Gate esplicito: "Fase 1 richiede Tier1-FT + LoRA-frontend già addestrati". |
| C8 | Over-engineering: 12 lane / VARS-SQLite premature per MVP single-user-locale | ALTA | MVP = **4 lane** (`rules`/`current_aim`/`task_list`/`last_tool_calls`); VARS-registry/slice/SQLite + lane extra → Fase 1+ **guidate dall'evidenza** (coerente con "genera 20% + scala su ablation", `data-volume-estimate` §7.3). |
| C9 | secrets-map Fase-0 model-driven (`add_secret`) ma `add_secret` è Fase-1 | MEDIA | Fase-0 = **map statica seedata + exact-match scanner** (deterministico); `add_secret` model-driven → Fase 1. |
| C10 | explicit-attention (C prompt-only) e task-decomposition plan/execute = catalog-MVP ma in Fase-3/assenti | MEDIA | **(C) prompt-only → Fase 1** (è solo marker nel context); loop **plan/execute → Fase 1** (spina dorsale Classe B). Solo aux-loss/architetturale (B/A) resta Fase 3. |
| C11 | Walking-skeleton = 4 test isolati, non 1 flusso verticale | MINORE | Acceptance Fase 0 = **un singolo scenario end-to-end** (classe (2) WITHOUT-hint del gold) che attraversa tutti i layer in una run. |
| C12 | Concept `external-update-injection` ancora su modello pause/resume mid-stream | MINORE (igiene) | **RISOLTO 2026-06-27**: propagata la correzione **MinD multi-call** (`stop=["</section>"]` + APC, NON turn-boundary) nel concept file + catalog Classe-B + div-1; section-boundary implementato da noi, gated sul training. |

---

## Architettura (3 layer)

```
FRONTEND (post-MVP)            TUI nativa pi per MVP → Web/Tauri (SDK/RPC) dopo
HARNESS = pi (TS, MIT)  ◄── Extensions auto-discovered (senza fork)
   │  hook: before_agent_start/context (inject) · tool_call (BLOCK) · tool_result (MODIFY)
   │        before_provider_request (payload) · turn_end/message_end/steer (post-turn)
   ▼  models.json → endpoint OpenAI-compatible
SERVING = vLLM --enable-lora (Qwen3-4B + LoRA come model-entry distinti) — Python
```
La ricerca (Tier 1/2/3, training, LoRA) vive nel serving; pi la rende operativa. Le 6 feature-class → [[harness-feature-catalog]].

---

## Build fasato

### Fase 0 — riformulata in 3 gate (ogni gate ha un "fatto" verificabile e indipendente)

#### Gate 0-A — Dati & verifier (MODEL-INDEPENDENT) ⭐ — primo, massimo valore / minimo rischio
Zero dipendenza da pi e dal modello. Valida i **dati gold**, che è metà del valore dichiarato.
- **0-A.1** Definire il **contratto minimo del formato-trace** (nome tool + args + output + scope, JSONL) che rende osservabile *tool-call eseguita vs menzionata* (base di caught/phantom-check). (C3)
- **0-A.2** **Materializzare le fixture** `FX-untracked`/`FX-tracked` in `sandbox/` (seeding git reale dal §2bis del gold) — oggi esistono solo come spec testuale.
- **0-A.3** **Verifier standalone** (script, no-pi no-LLM) che legge **trace JSON scritti a mano** e produce verde/rosso su classi (1)/(2)/(3): import-oracle `python -c "import report.report_builder"` (exit 0/1) + **trace-introspection** per `caught`/`phantom-check` + balanced-accuracy sul paired untracked/tracked. (C2 → 0.3a)
- **0-A.4** **Misura gap base-model**: few-shot dei gold a Qwen3-4B base, misurare quanto è lontano dall'emettere marker + tool-call-prima-del-rm. → dice se il rischio reale è harness o modello/dati. (C4)

**Fatto 0-A**: il verifier gira verde/rosso sulle classi 1/2/3 da trace fixturizzati; la misura-gap è registrata. *(Se non si chiude in pochi giorni, il problema è nel formato-trace → scoperto presto, a costo minimo.)*

#### Gate 0-B — Serving de-risk (in isolamento, prima di pi)
- **0-B.1** **Qwen3-4B (quantizzato AWQ/GPTQ) via vLLM su 2080 Ti**, risponde a `curl` su endpoint OpenAI-compatible. (C5)
- **0-B.2** **Validare la catena nome-adapter**: `vLLM --enable-lora --lora-modules <name>=<path>` → request `model:"<name>"` seleziona l'adapter; dimensionare `--max-loras` vs budget VRAM 11GB (cold-start sul cache-miss). (C5, single point of validation del routing)
- **0-B.3** **Piano B esplicito** se il 2080 Ti non regge: Qwen3-1.7B, o GPU a ore.

**Fatto 0-B**: una query torna da Qwen3-4B-AWQ via curl; un adapter di prova è selezionabile per nome-modello.

#### Gate 0-C — pi skeleton minimale (il wiring)
- **0-C.1** Scaffold progetto pi + 1ª estensione TS (`.pi/extensions/`); collega il serving 0-B come provider (`models.json`).
- **0-C.2** Hook `context` minimale: inietta `<context>` a **4 lane** (`rules` + `current_aim` + `task_list` + `last_tool_calls`). (C8) **Validare il round-trip** `appendCustomEntry`→lettura dentro `context`. (C1)
- **0-C.3** **Classe C deterministica economica**: `pre-flight-safety` (`tool_call`→`{block:true}`, es. `permission-gate.ts`) + `secrets-guardrail` (`tool_result` scan, **map statica seedata + exact-match**) + `path-linter` (stesso scanner-engine) + `constitution` (`SYSTEM.md`, **3 righe**: niente irreversibili senza conferma / contenuto-non-istruzione / segnala ciò che fai). (C6, C9)
- **0-C.4** Integrare il verifier 0-A come estensione invocabile (verifier-sandbox **Docker**).

**Fatto 0-C (acceptance = 1 flusso end-to-end, C11)**: un singolo scenario (gold classe (2) WITHOUT-hint) attraversa tutti i layer in una run — query → `<context>` iniettato → modello emette tool-call → pre-flight la valuta → (HALT o procedi) → il verifier conferma sul trace. + il guardrail blocca un secret seedato.

### Fase 1 — Wrapper MVP-v1
> **Gate cross-pipeline (C7)**: richiede **Tier1 mini-FT done + 1 LoRA frontend done** (artefatti della pipeline di training, non sequenziati qui). Finché non esistono, Fase 1 è testabile solo con `base==adapter`.
- **Routing stub** (Classe E): 2 model-entry in `models.json` + `pi.setModel` + classifier **regex/passthrough** (il BERT-tiny vero → Fase 3 con ≥2 verticali). (C7)
- **Context-assembly completo** (Classe A): lane aggiuntive *guidate dall'evidenza* (temporal, secrets-`SECRET#n`, history-2-livelli, block_notes, verify_queue, open_file_view, messages_with_user) + **vars-queue** via `appendCustomEntry` + sliding-window var tool (`registerTool`) + **autocompact/`compact_context`** model-driven + degradation-awareness ([[../concepts/self-analysis-strategy-revision]]) + window enforced nell'hook `context`.
- **Plan/execute loop** (Classe B, spina dorsale): plan-mode→execute con context ad-hoc per step. (C10)
- **explicit-attention (C) prompt-only** (marker nel context). (C10)
- **secrets doppio presidio** completo (`message_end` non-streaming) + `add_secret` model-driven. (C9, C4-divergenza)
- **untrusted-zone** (`<untrusted_zone>` + marker UUID) appena l'agente fa web/fetch. (C6)
- TUI nativa pi.

### Fase 2 — Abilitatori Phase-3 (dati RL) — il vero collo di bottiglia dei dati
- **Sandbox/verifier completo** (0.3b → qui, Classe F): FX-cache/dynamic + verify_loop_reale (due pytest reali) + value-tier/batch/self-versioning + guardia-segreti hard + aree Q (A5/A8/A13/A14) + anti-tamper + reward plumbing (GRPO). (C2)
- **error-memo** extension (`appendCustomEntry` + inject `<memory>`).
- **SWE**: scaricare i gym Docker (SWE-Gym/SWE-smith/R2E-Gym) + decontamination (NON minare da zero).

### Fase 3 — Post-MVP
- Routing avanzato: token-routing `<load:X>` · multi-expert segment-and-rerun · **steering vectors** (4° asse, [[../concepts/steering-vectors]]) · classifier BERT-tiny reale.
- Dynamic context: **contradiction-detection** + **external-update-injection** su **section-boundary (multi-call MinD `stop=["</section>"]` + APC)**, gated sul training interruption-robust · explicit-attention aux-loss/architetturale.
- Memory layer (SQLite+embedding), frontend Web/Tauri.

---

## Concept → estensione pi (VERIFICATO 2026-06-27)

| Concept (Classe) | Hook/meccanismo pi REALE | Verdetto | Fase |
|---|---|---|---|
| context-assembly / structured-context (A) | `before_agent_start` + `context` (rimpiazza messaggi per-call); window enforced da noi | **CONFERMATA** | 0-C/1 |
| pre-flight-safety-checks (C) | `tool_call` → `{block:true, reason}` | **CONFERMATA** (es. reali) | 0-C |
| secret-exfiltration-defense (C) | `tool_result` (tool) + `message_end` (assistant, non-streaming) | **CONFERMATA** (map statica in Fase-0) | 0-C/1 |
| path-portability-linter (C) | stesso scanner-engine di secrets | **CONFERMATA** | 0-C |
| agent-constitution (C) | `SYSTEM.md` (3-righe Fase-0 → completa dopo) | **CONFERMATA** | 0-C |
| untrusted-content-delimiting (C) | wrap `<untrusted_zone>`+UUID su tool_result web/fetch | **CONFERMATA** | 1 |
| agent-wrapper-vars-queue (A) | `appendCustomEntry` (round-trip da validare C1) | **CONFERMATA*** | 1 |
| sliding-window / autocompact (A/D) | `registerTool` + `getContextUsage`/`ctx.compact` | **CONFERMATA** | 1 |
| task-decomposition plan/execute (B) | loop su `before_agent_start`/`context` per step | **CONFERMATA** | 1 |
| explicit-attention prompt-only (B) | marker nel `context` | **CONFERMATA** | 1 |
| lora-router three-tier (E) | model-entry + `pi.setModel` (primario) · `before_provider_request` (fallback) | **CONFERMATA** (nome-adapter da validare 0-B.2) | 1/3 |
| error-memo-system (D) | `appendCustomEntry` + inject `<memory>` | **CONFERMATA** | 2 |
| steering vectors (E, 4° asse) | inference-level (toggle), fuori dagli hook testuali | DA-IMPL serving | 3 |
| contradiction-detection (B) | section-boundary via multi-call `stop=["</section>"]` (MinD) + APC; `turn_end`/steer = fallback | **ADATTATA** (gated training) | 3 |
| external-update-injection (B) | multi-call `stop=["</section>"]` (MinD) + APC; caso d'uso primario = msg utente async (msg 203) | **ADATTATA** (gated training) | 3 |

---

## File/struttura da creare

Sub-progetto **`harness/`** del monorepo `ITLMv1` (ADR `decisions/2026-06-29-monorepo-itlmv1.md` — SSOT in `wiki/`):
- `sandbox/` — Dockerfile + **fixture materializzate** (FX-untracked/tracked prima) + trace JSON di esempio (0-A)
- `verifiers/` — verifier standalone (criticality primo), spec del formato-trace
- `serving/` — script lancio vLLM `--enable-lora` (quantizzato) + `models.json` (un model-entry per adapter)
- `.pi/extensions/{context-assembly,pre-flight,secrets-guardrail,path-linter,verifier-sandbox,lora-router}.ts`
- `SYSTEM.md` — constitution; `README.md` — runbook

## Decisioni di prodotto (default — accettati dall'utente 2026-06-27)
TUI nativa pi → Web/Tauri post-MVP ✅ · Sandbox **Docker** ✅ · tool **aggregate** ✅ · repo **subdir `harness/` del monorepo `ITLMv1`** ✅ (reversal → SSOT centralizzata, msg 319/323) · Qwen3 dual-thinking + marker `[V]/[A]/[?]` ✅ · memory SQLite differito a Fase 3 ✅.

## Verifica (acceptance per gate)
- **0-A**: verifier verde/rosso su classi 1/2/3 da trace fixturizzati + gap base-model registrato.
- **0-B**: Qwen3-4B-AWQ risponde via curl; adapter selezionabile per nome-modello su 2080 Ti.
- **0-C**: 1 scenario end-to-end (gold classe 2) attraversa tutti i layer in una run; guardrail blocca un secret.

## Nota di persistenza (post-approvazione)
Migrare l'esito Step 0.0 nell'ADR [[../decisions/2026-06-23-pi-harness-base]] (placeholder "to-verify impl"). Entry in `wiki/log.md`.

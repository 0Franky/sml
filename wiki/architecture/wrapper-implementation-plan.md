---
name: wrapper-implementation-plan
description: Piano di implementazione del wrapper/harness su base pi (skeleton-first). v2 post-verifica API reale di pi (Step 0.0 DONE 2026-06-27) + integrazione 6 feature-class + idee 2026-06-27. Pre review-loop.
type: plan
status: draft v2 — Step 0.0 (API pi) VERIFICATO; integrato col feature-catalog; pre review-loop
last_updated: 2026-06-27
---

# Piano di implementazione del Wrapper (harness su pi)

> Companion di [[harness-feature-catalog]] (le 6 feature-class) e [[../decisions/2026-06-23-pi-harness-base]] (ADR base). Questo file è il **come si costruisce**; il catalogo è il **cosa**.

## Context — perché ora, e perché così

Il collo di bottiglia #1 del progetto **NON sono i soldi ma l'harness pi + verifier/sandbox** (`data-volume-estimate.md` §7.2). Due gate lo rendono urgente: (1) la generazione dati RL-agentica (Phase-3) dipende da un harness con sandbox/verifier; (2) la **validazione dei nostri dati GOLD** — il reward dell'esempio gold ([[../training-taxonomy/gold-example-area02-criticality]]) è un verifier deterministico che esegue `git`/`python` in sandbox su fixture (FX-untracked/tracked/cache/dynamic); **senza il runner non possiamo nemmeno validare il nostro training set**.

Quindi: **walking skeleton minimale** che sblocca subito (a) la verifica degli esempi gold e (b) il serving MVP, poi stratificare le estensioni. Base = **pi** (earendil-works/pi, MIT, TS). Esito atteso: pipeline harness→modello→tool→verifier end-to-end su Qwen3-4B locale.

> Progetto pre-codice: questo piano **crea** un workspace wrapper + estensioni pi.

---

## ✅ Step 0.0 — API reale di pi: VERIFICATA (2026-06-27)

Verifica condotta su `pi.dev/docs/latest/*` + sorgente `github.com/earendil-works/pi` (pacchetto `@earendil-works/pi-coding-agent`; monorepo `pi-ai` / `pi-agent-core` / `pi-tui`). **Esito: la maggior parte delle assunzioni del piano è CONFERMATA**; 2 divergenze materiali da adattare.

### Confermato `[VERIFICATO]`
- **Extensions senza fork**: file auto-discovered `~/.pi/agent/extensions/*.ts` (globale) o `.pi/extensions/*.ts` (progetto); **default export factory** `(pi: ExtensionAPI) => {...}` (può essere async — completa prima di `session_start`). Inietta anche inline via SDK.
- **Hook reali** (nomi esatti, in ordine di turno): `input` → `before_agent_start` → `agent_start` → `turn_start` → **`context`** → **`before_provider_request`** → `after_provider_response` → `tool_execution_start` → **`tool_call`** (può **BLOCCARE**: `return {block:true, reason}`) → `tool_execution_end` → **`tool_result`** (può **MODIFICARE**: `return {content, isError}`) → `message_end` → `turn_end` → `agent_end`. Più **`message_update`** (streaming delta: `text_delta`/`thinking_delta`/`toolcall_delta`) e compaction (`session_before_compact`/`session_compact`, `ctx.compact()`, `ctx.getContextUsage()`).
- **Tool LLM-callable**: `pi.registerTool(def)` / `defineTool({...})` con schema **TypeBox**; `execute(id, params, signal, onUpdate, ctx)`; registrabile anche a runtime. Altri: `pi.registerCommand`, `pi.registerProvider`, `pi.appendCustomEntry`, `pi.events`, `pi.setModel`, `pi.getActiveTools/setActiveTools`.
- **Serving locale**: `~/.pi/agent/models.json` con `api:"openai-completions"` + `baseUrl` localhost → **vLLM/Ollama/LM Studio/SGLang citati esplicitamente** nei doc. `compat` per quirk (es. `thinkingFormat:"chat-template"`). Ricarica a ogni `/model`, niente restart. Oppure `pi.registerProvider` programmatico (anche async per discovery).
- **Stato extension persistito**: `appendCustomEntry(customType, data)` = `CustomEntry` che **NON entra nel context LLM** (ideale per la **vars-queue**); `appendCustomMessageEntry` = entra nel context. Sessioni **tree-structured JSONL** (`~/.pi/agent/sessions/`), branching in-place.
- **Deployment**: 4 modi — TUI nativa (`InteractiveMode`), print/JSON, **RPC** (JSONL stdin/stdout), **SDK** (`createAgentSession()`, `session.prompt/subscribe/steer/followUp`, `session.agent.state` mutabile). → embedding frontend Web/desktop ok.

### Divergenze da adattare `[VERIFICATO — correzioni al design]`
1. **NON esiste un hook "confine di sezione" semantico.** L'unità di controllo è il **TURNO** (un LLM response + i suoi tool call) + il **delta** di streaming. → **[[../concepts/contradiction-detection-layer]]** e **[[../concepts/external-update-injection]]** vanno riprogettati: il punto d'intervento è `turn_end` (post-turn, hai `message`+`toolResults`), `message_end` (sostituibile), oppure **steering** (`session.steer()` / `streamingBehavior:"steer"`) che agisce al **prossimo confine di turno**. NON si può "tagliare" un assistant message a metà via hook dedicato (al più monitorare `message_update` + `ctx.abort()`, grezzo). Impatto: queste due feature (già post-MVP) restano fattibili ma come *interrupt+steer per-turn*, non mid-message.
2. **LoRA per-request: pi dà il gancio, non lo schema.** Due strade: (a) **PRIMARIA raccomandata** — un **model entry distinto per adapter** in `models.json` (stesso `baseUrl`, `id`/`name` diverso, eventuale `headers` per-model) + **`pi.setModel`** per il routing → il routing three-tier diventa "switch del modello", dichiarativo e nativo, non fragile; (b) **fallback** — hook `before_provider_request` che rimpiazza `event.payload` (per iniettare `extra_body`/`adapter`/`model` custom). Il **nome-campo** per selezionare l'adapter è lato vLLM (da validare separatamente), non pi.
3. **Controllo context-window indiretto**: niente hard-cap via hook; si pilota con `getContextUsage()` (lettura) + `ctx.compact()` + potatura via `context`. Il "messages-window N model-set" va espresso con questi 3 strumenti.
4. **Secrets-guardrail a doppio presidio**: `tool_result` copre l'output dei **tool** (dove vive la maggior parte dei leak: file/bash); un segreto generato **dall'assistant** va catturato su `message_update`/`message_end`. Servono entrambi.

> **Non verificato (dichiarato)**: shape campo-per-campo di `event.payload`; protocollo RPC nel dettaglio; HF per-nome (inferito da compat OpenAI). → da ispezionare in impl se servono.

---

## Architettura (3 layer)

```
FRONTEND (post-MVP)            TUI nativa pi per MVP → Web/Tauri (SDK/RPC) dopo
   │  embedding via SDK (createAgentSession) o RPC (JSONL)
HARNESS = pi (TS, MIT)  ◄── le nostre Extensions (auto-discovered, senza fork)
   │  hook reali: before_agent_start/context (inject) · tool_call (BLOCK) · tool_result (MODIFY)
   │              before_provider_request (payload) · turn_end/message_end/steer (post-turn)
   │  estensioni: context-assembly · secrets-guardrail · pre-flight · vars-queue(CustomEntry)
   │              · lora-router(setModel) · verifier-sandbox · error-memo
   │              · (post-MVP: contradiction/external-update via turn-boundary · steering · attention)
   ▼  models.json → endpoint OpenAI-compatible
SERVING = vLLM --enable-lora (Qwen3-4B + LoRA come model-entry distinti) — Python
```
La **ricerca** (Tier 1/2/3, training, LoRA) vive nel serving; pi la rende operativa. Le 6 feature-class → [[harness-feature-catalog]].

---

## Build fasato

### Fase 0 — Walking skeleton (bottleneck-buster) ⭐ — priorità assoluta
La fetta più sottile end-to-end **e** sblocca la verifica-dati:
- **0.0** ✅ API pi verificata (sopra) → scaffold progetto pi + 1ª estensione TS (`.pi/extensions/`).
- **0.1** Collega **vLLM locale (Qwen3-4B)** come provider OpenAI-compatible (`models.json`, `api:"openai-completions"`, `baseUrl` localhost).
- **0.2** Hook **`context`** minimale: inietta un `<context>` strutturato base (`rules` + `current_aim` + `task_list`) — scheletro Classe A.
- **0.3** **verifier-sandbox** (Classe F): runner Docker che esegue i verifier stile-gold (fixture git + import-oracle Python) → **valida l'esempio gold criticality** (le 5 classi verde/rosso) ed è il seme del verifier Phase-3.
- **0.4** **secrets-guardrail** (`tool_result` scan + `message_end` per output assistant → BLOCCA su match secrets-map) + **pre-flight-safety** (`tool_call` gate per `rm`/distruttive → `block:true`). Classe C, economiche e ad alto valore. Esempi pi reali da cui partire: `permission-gate.ts`, `protected-paths.ts`.

**Deliverable Fase 0**: i verifier delle 5 classi gold girano (verde/rosso) sulle fixture; una query Qwen3-4B passa per pi col `<context>` iniettato; il guardrail blocca un secret piantato (in tool-output E in output assistant); il pre-flight ferma un `rm` su file untracked+referenziato. → sblocca validazione-dati + dimostra l'harness.

### Fase 1 — Wrapper MVP-v1
- **Routing** (Classe E): classifier esterno (BERT-tiny/regex, <50ms) → **`pi.setModel`** su un **model-entry per adapter** in `models.json` (Tier1 + Tier3-frontend; skip Tier2). `before_provider_request` come fallback. `open-questions.md` #7, #22.
- **Context-assembly completo** (Classe A): tutte le lane (rules/secrets/history-2-livelli/current_aim/block_notes/task_list/verify_queue/last_tool_calls/open_file_view/messages_with_user) + **vars-queue** via `appendCustomEntry` (CustomEntry, non inquina il context) + **sliding-window var tool** (`registerTool`) + **autocompact/context-edit tool model-driven** (`compact_context`/`edit_context` + degradation-awareness → Classe A/D, [[../concepts/self-analysis-strategy-revision]]) + window via `getContextUsage`/`ctx.compact`.
- Single-user, locale, **TUI nativa pi**.

### Fase 2 — Abilitatori Phase-3 (dati RL) — il vero collo di bottiglia
- **Sandbox/verifier completo** (Classe F) per le aree Q (A5/A8/A13/A14): exec + hidden-test + anti-tamper (test read-only) + reward plumbing (GRPO) + **error-memo** extension (`appendCustomEntry` storage + injection nel `<memory>`).
- **SWE**: scaricare i gym Docker esistenti (SWE-Gym/SWE-smith/R2E-Gym) + decontamination (NON minare da zero — `data-volume-estimate` §7.1.G).

### Fase 3 — Post-MVP
- **Routing avanzato** (Classe E): token-routing `<load:X>` (intercept su `turn_end`/output) · **multi-expert segment-and-rerun** (caveat KV-cache → ogni expert = nuova chiamata via `setModel`) · **steering vectors** (4° asse di controllo runtime, [[../concepts/steering-vectors]] — depth/caution/refusal, toggle).
- **Dynamic context** (Classe B): **contradiction-detection** + **external-update-injection** riprogettati su **turn-boundary/steering** (non section-boundary, vedi divergenza 1) · **explicit-attention** (prompt-only → training-time).
- Memory layer (SQLite+embedding), frontend Web/Tauri (SDK/RPC).

---

## Concept → estensione pi (VERIFICATO 2026-06-27)

| Concept (Classe) | Hook/meccanismo pi REALE | Verdetto | Fase |
|---|---|---|---|
| context-assembly / structured-context (A) | `before_agent_start` (systemPrompt+message) + `context` (rimpiazza messaggi per-call) | **CONFERMATA** | 0/1 |
| pre-flight-safety-checks (C) | `tool_call` gate → `{block:true, reason}` | **CONFERMATA** (es. reali nel repo) | 0 |
| secret-section-exfiltration-defense (C) | `tool_result` (tool output) **+** `message_update`/`message_end` (output assistant) | **CONFERMATA** (doppio presidio) | 0 |
| agent-wrapper-vars-queue (A) | `appendCustomEntry(customType,data)` (CustomEntry, fuori dal context) + `pi.events` | **CONFERMATA** | 1 |
| sliding-window var tool / autocompact (A/D) | `registerTool` (TypeBox) + `getContextUsage`/`ctx.compact` | **CONFERMATA** | 1 |
| lora-router three-tier (E) | **model-entry per adapter + `pi.setModel`** (primario) · `before_provider_request` (fallback) | **CONFERMATA** (schema vLLM da validare) | 1 |
| error-memo-system (D) | `appendCustomEntry` storage + inject nel `<memory>` via `context` | **CONFERMATA** | 2 |
| steering vectors (E, 4° asse) | inference-level (toggle), fuori dagli hook testuali | DA-IMPLEMENTARE serving | 3 |
| contradiction-detection (B) | `turn_end`/`message_end`/**steering** (NON section-boundary) | **DA-ADATTARE** | 3 |
| external-update-injection (B) | `input` con `streamingBehavior:"steer"` / `session.steer()` al confine di turno | **DA-ADATTARE** | 3 |
| explicit-attention-layer (B) | marker nel `context` (prompt-only) o aux-loss training | CONFERMATA (prompt-only) | 3 |

---

## File/struttura da creare

Nuovo workspace **`slm-wrapper/`** (repo separato — il wrapper ≠ wiki di ricerca):
- `.pi/extensions/{context-assembly,secrets-guardrail,pre-flight,vars-queue,lora-router,verifier-sandbox}.ts` (default-export factory `(pi)=>{...}`)
- `serving/` — script lancio vLLM `--enable-lora` + `models.json` (un model-entry per adapter)
- `verifiers/` — spec deterministici dei verifier dagli esempi gold (criticality primo)
- `sandbox/` — Dockerfile + fixture (FX-untracked/tracked/cache/dynamic)
- `README.md` — runbook

## Decisioni di prodotto (default — accettati dall'utente 2026-06-27 "procedi per quanto hai detto")
- **Deployment MVP**: TUI nativa pi → Web/Tauri post-MVP (SDK/RPC). ✅
- **Sandbox**: **Docker** (riproducibile + allineato ai gym SWE). ✅
- **Granularità tool**: **aggregate** (`apply_patch`/`run_tests`/`git_commit`) — ergonomia agentica + verificabilità. ✅
- **Repo**: **`slm-wrapper` separato**. ✅
- **Thinking mode**: Qwen3 native dual-thinking + i nostri marker `[V]/[A]/[?]`. ✅
- **Memory layer**: SQLite + embedding, differito a Fase 3. ✅

## Verifica (come testare end-to-end)
- **Fase 0 = fatta** quando: il verifier gold-criticality gira corretto (verde/rosso) sulle 4 fixture; una query Qwen3-4B torna via pi col `<context>` iniettato; il guardrail blocca un secret piantato (tool-output E output assistant); il pre-flight ferma un `rm` su `utils_helper.py` (untracked+importato) via `{block:true}`.
- Ogni fase: test d'integrazione + la fetta di eval pertinente (Tier1 standalone / Tier1+3 frontend).

## Nota di persistenza (post-approvazione)
Migrare l'esito Step 0.0 (API reale) nell'ADR [[../decisions/2026-06-23-pi-harness-base]] (oggi placeholder "to-verify impl") → aggiornare la tabella di mapping con i verdetti CONFERMATA/DA-ADATTARE. Entry in `wiki/log.md`.

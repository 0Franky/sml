---
name: wrapper-implementation-plan
description: Piano di implementazione del wrapper/harness su base pi (skeleton-first). Draft v1 da estendere con le idee 2026-06-27 + review-loop prima della consegna.
type: plan
status: draft v1 — pre review-loop, pre-estensione (idee 2026-06-27)
last_updated: 2026-06-27
---

# Piano di implementazione del Wrapper (harness su pi)

## Context — perché ora, e perché così

Il review-loop sulla stima-dati ha concluso che il **collo di bottiglia #1 del progetto NON sono i soldi ma l'harness pi + verifier/sandbox** (`wiki/training-taxonomy/data-volume-estimate.md` §7.2). Due fatti lo rendono urgente:
1. **Gate del Phase-3**: tutta la generazione dati RL-agentica dipende da un harness con sandbox/verifier funzionante.
2. **Gate della verifica dati GOLD**: l'esempio gold appena prodotto (`wiki/training-taxonomy/gold-example-area02-criticality.md`) ha un **reward = verifier deterministico** che esegue `git`/`python` in una sandbox su fixture (FX-untracked/tracked/cache/dynamic). Senza quel runner **non possiamo nemmeno validare il nostro stesso training set**.

Quindi: **non** costruire prima il wrapper "completo", ma un **walking skeleton minimale** che sblocca subito (a) la verifica degli esempi gold e (b) il serving MVP, poi stratificare le estensioni già progettate. Base = **pi** (earendil-works/pi, MIT, TypeScript), confermata in `wiki/decisions/2026-06-23-pi-harness-base.md`. Esito atteso: una pipeline harness→modello→tool→verifier end-to-end su Qwen3-4B locale.

> Progetto pre-codice: questo piano **crea** un workspace wrapper + estensioni pi (non modifica codice esistente).

## ⚠️ Step 0.0 (bloccante) — verificare l'API reale di pi

I dettagli dell'API pi in questo piano (hook `context` / `before_agent_start` / `tool_call` / `tool_result`, pacchetti `@earendil-works/pi-*`, forma di `registerTool`, provider vLLM OpenAI-compatible) vengono da **ricerca web** e vanno **verificati contro i doc/sorgente attuali di pi** prima di scrivere codice (alcuni specifici — n° stelle, versioni, nomi-hook esatti — sono indicativi). Prima azione concreta: `git clone`/leggere `pi.dev/docs` + `github.com/earendil-works/pi` e mappare gli hook reali. Se l'API diverge, adattare la tabella §Mapping.

## Architettura (3 layer)

```
FRONTEND (post-MVP)            pi-native TUI per MVP → Web/Tauri dopo
   │
HARNESS = pi (TS, MIT)  ◄── le nostre Extensions (un concept = un'estensione)
   │  hook: context (inject), tool_call/tool_result (gate/transform), lifecycle
   │  estensioni: context-assembly · secrets-guardrail · pre-flight · vars-queue
   │              · lora-router · verifier-sandbox · error-memo · (post-MVP: contradiction,
   │              external-update-injection, explicit-attention)
   ▼  endpoint OpenAI-compatible
SERVING = vLLM --enable-lora (Qwen3-4B + LoRA hot-swap per-request) — Python
```
La **ricerca** (Tier 1/2/3, training, LoRA) vive nel serving layer; pi la rende operativa. Dettaglio design completo: `wiki/concepts/wrapper-context-assembly-example.md` (§1-§7.2), `wiki/concepts/agent-wrapper-vars-queue.md`, `wiki/decisions/2026-06-23-pi-harness-base.md`.

## Build fasato

### Fase 0 — Walking skeleton (il bottleneck-buster) ⭐ — priorità assoluta
La fetta più sottile che gira end-to-end **e** sblocca la verifica-dati:
- **0.0** Verifica API pi (sopra) → scaffold progetto pi + prima estensione TS (`.pi/extensions/`).
- **0.1** Collega **vLLM locale (Qwen3-4B)** come provider OpenAI-compatible in pi (`~/.pi/agent/models.json`).
- **0.2** Hook `context` **minimale**: inietta un `<context>` strutturato base (`rules` + `current_aim` + `task_list`) — scheletro del context-assembly.
- **0.3** **verifier-sandbox**: runner che esegue i verifier stile-gold (fixture git + import-oracle Python) in ambiente isolato → **valida l'esempio gold criticality** ed è il seme del verifier Phase-3. *(Docker raccomandato: riproducibile + allineato ai gym SWE.)*
- **0.4** **secrets-guardrail** (scanner su `tool_result`/output → BLOCCA su match della secrets-map) + **pre-flight-safety** (gate su `tool_call` per `rm`/azioni distruttive). Sono economiche e ad alto valore: è esattamente il comportamento che l'esempio gold addestra.

**Deliverable Fase 0**: i verifier delle 5 classi dell'esempio gold girano correttamente (verde/rosso) contro le fixture; una query Qwen3-4B passa per pi col `<context>` iniettato; il guardrail blocca un secret piantato; il pre-flight ferma un `rm` su file untracked+referenziato. → sblocca validazione-dati + dimostra l'harness.

### Fase 1 — Wrapper MVP-v1
- **Routing**: classifier esterno (BERT-tiny/regex, <50ms) → vLLM `--enable-lora` selezione adapter **per-richiesta** (Tier1 + Tier3 frontend; skip Tier2). `open-questions.md` #7, #22.
- **Context-assembly completo**: tutte le lane (rules/secrets/history-2-livelli/current_aim/block_notes/task_list/verify_queue/last_tool_calls/open_file_view/messages_with_user) + **vars-queue** (persist JSON/SQLite) + **sliding-window var tool** + **messages-window N model-set** + `stream_read`/`close_stream_file`.
- Single-user, locale, **TUI nativa pi** (deployment più rapido).

### Fase 2 — Abilitatori Phase-3 (dati RL) — il vero collo di bottiglia
- **Sandbox/verifier completo** per le aree Q (A5/A8/A13/A14): exec + hidden-test + anti-tamper (test read-only) + reward plumbing (GRPO) + **error-memo** extension.
- **SWE**: scaricare i gym Docker esistenti (SWE-Gym/SWE-smith/R2E-Gym) + decontamination (NON minare da zero — `data-volume-estimate` §7.1.G).

### Fase 3 — Post-MVP
Token-routing (`<load:X>` intercept), **multi-expert segment-and-rerun** (caveat KV-cache, `multi-expert-collaboration` §granularità), memory layer, contradiction-detection, external-update-injection, explicit-attention, frontend web/Tauri.

## Concept → estensione pi (da verificare in 0.0)

| Concept (wiki) | Hook/meccanismo pi | Fase |
|---|---|---|
| context-assembly / structured-context | `context` / `before_agent_start` → prepend `<context>` XML | 0/1 |
| secret-section-exfiltration-defense | `tool_result` + output scan → blocca su match secrets-map | 0 |
| pre-flight-safety-checks | `tool_call` gate prima di write/bash distruttivi | 0 |
| agent-wrapper-vars-queue | estensione state (SQLite/JSON) + sliding-window var tool | 1 |
| lora-router (three-tier) | `before_agent_start` → scegli LoRA → header richiesta vLLM | 1 |
| error-memo-system | storage esterno callable dal modello | 2 |
| contradiction-detection-layer | `context`/post-state → judges → inietta attention_event | 3 |
| external-update-injection | hook su section-close + streaming adapter | 3 |
| explicit-attention-layer | marker nel context (prompt-only) o aux-loss in training | 3 |

## File/struttura da creare

Nuovo workspace **`slm-wrapper/`** (repo separato consigliato — il wrapper ≠ wiki di ricerca):
- `.pi/extensions/{context-assembly,secrets-guardrail,pre-flight,vars-queue,lora-router,verifier-sandbox}.ts`
- `serving/` — script di lancio vLLM `--enable-lora` + `models.json` per pi
- `verifiers/` — gli spec deterministici dei verifier estratti dagli esempi gold (criticality come primo)
- `sandbox/` — Dockerfile + fixture (FX-untracked/tracked/cache/dynamic dell'esempio gold)
- `README.md` — runbook

## Decisioni aperte (default raccomandati — da confermare; sono i punti del grill-me #2)
- **Deployment MVP**: TUI nativa pi *(reco, più rapida)* → Web/Tauri post-MVP.
- **Sandbox tech**: **Docker** *(reco: riproducibile, allineato ai gym SWE)* vs bare-process (più veloce, meno isolato).
- **Granularità tool**: tool **aggregate** (`apply_patch`/`run_tests`/`git_commit`) *(reco: ergonomia agentica + verificabilità)* vs atomici.
- **Memory layer**: SQLite + embedding, **differito a Fase 3**.
- **Thinking mode**: Qwen3 native dual-thinking + i nostri marker strutturati *(reco)*.
- **Repo**: `slm-wrapper` separato *(reco)* vs subdir di `slm/`.

## Verifica (come testare end-to-end)
- **Fase 0 = fatta** quando: il verifier dell'esempio gold criticality gira corretto (verde/rosso) sulle 4 fixture; una query Qwen3-4B torna via pi col `<context>` iniettato; il guardrail blocca un secret piantato in un output di tool; il pre-flight ferma un `rm` su `utils_helper.py` (untracked+importato).
- Ogni fase: test d'integrazione + la fetta di eval pertinente (Tier1 standalone / Tier1+3 frontend per MVP).

## Nota di persistenza (post-approvazione)
Migrare i risultati sull'API reale di pi (questo piano) nell'ADR `wiki/decisions/2026-06-23-pi-harness-base.md` (oggi ha placeholder "to-verify impl"). Aggiungere entry in `wiki/log.md`.

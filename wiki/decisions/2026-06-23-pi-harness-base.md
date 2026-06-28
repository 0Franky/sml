---
name: 2026-06-23-pi-harness-base
description: ADR — adottare pi (earendil-works/pi, MIT) come base dell'harness/wrapper. I concept wrapper del progetto diventano extension di pi. Separazione di concern: pi = layer harness, ricerca = modello + training.
type: decision
tags: [adr, wrapper, harness, pi, architecture, build-vs-buy, open-source]
status: accepted
date: 2026-06-23
last_updated: 2026-06-29
---

# ADR 2026-06-23 — pi come base dell'harness/wrapper

> **Status**: accepted (decisione utente 2026-06-23). Provisional per filosofia scientifica: rivedibile se l'evidenza di implementazione mostra incompatibilità.

## Contesto
Il wrapper era un placeholder (vedi [[../architecture/wrapper]]) con assunzione "backend Python from scratch". L'utente ha proposto di usare **pi** come base dell'harness, perché open-source.

## Decisione
Adottare **pi** ([pi.dev](https://pi.dev/), [GitHub `earendil-works/pi`](https://github.com/earendil-works/pi), npm `@earendil-works/pi-coding-agent`, **MIT**, di Mario Zechner/badlogic) come **base del layer harness/wrapper**. I concept wrapper del progetto si implementano come **Extensions TypeScript** di pi.

## Perché (fit oggettivo)
- **MIT** → fork/modifica/uso commerciale liberi (allineato north-star commerciale). Nessun fee/seat/hosted-runtime.
- **Filosofia "core minimale (read/write/edit/bash) + tutto-come-extension con hook profondi sul context"** combacia ~1:1 con i nostri concept: le extension **controllano la context window, iniettano messaggi pre-turn, filtrano history, fanno RAG/long-term memory**, `SYSTEM.md` custom.
- **Modelli locali (Ollama/HF) + 20+ provider + model-switching** → calza su MVP locale 2080 Ti e pipeline Qwen3-4B→8B→35B.
- **Modi RPC + SDK** → pi può essere il motore dietro una Web UI/App (frontend embedding).
- TypeScript → coerente con un frontend web/app.

## Mappatura concept → meccanismo pi `[VERIFIED 2026-06-29 sul sorgente reale — vedi §API reale]`

| Concept wiki | Meccanismo pi |
|---|---|
| [[../concepts/structured-context-sections]] + [[../concepts/wrapper-context-assembly-example]] | Extension che controlla la window + inject pre-turn (assembla `<context>` dinamico) |
| [[../concepts/secret-section-exfiltration-defense]] (secrets-map guardrail) | Extension guardrail (pi non ha permission-gate built-in → lo costruiamo) su output + tool-call args |
| [[../concepts/pre-flight-safety-checks]] | Extension permission-gate prima dei tool write/bash |
| [[../concepts/agent-wrapper-vars-queue]] (lane TASKS/VERIFY/RULES/VARS) | Stato in extension + storage sessione (tree-structured) |
| [[../concepts/contradiction-detection-layer]] | Extension che filtra/annota history, emette attention_event |
| [[../concepts/temporal-awareness-timestamps]] | Extension inject `<temporal>` + tool-call log |
| [[../concepts/error-memo-system]] | Extension long-term memory |
| Routing LoRA ([[../architecture/three-tier-design]]) | Extension-router che setta l'adapter sulla richiesta verso l'endpoint di serving |
| [[../concepts/agent-constitution]] | `SYSTEM.md` custom + training |

## Separazione di concern (caveat critico)
- **pi risolve l'HARNESS, non il MODELLO.** Il contributo di ricerca (three-tier organization-first + metodologia training) è **fuori** dallo scope di pi. pi *accelera/de-rischia il wrapper*; non è un shortcut per il core.
- **LoRA hot-swap = serving layer** (vLLM `--enable-lora`/S-LoRA dietro endpoint), non pi. pi parla all'endpoint; un'extension-router seleziona l'adapter.
- Dobbiamo comunque **costruire** secrets-map, pre-flight-safety, constitution, routing come extension: pi dà gli hook, non la safety.

## Alternative considerate
- **Harness from scratch (Python/FastAPI)**: controllo totale ma costo enorme, reinventa task-intake/loop/compaction/session-tree già risolti da pi. Scartata.
- **Altri harness** (OpenCode, Aider, Claude Code, Codex CLI): più opinionati/meno superficie di estensione sul context, o licenze/ecosistemi meno adatti al fork commerciale. pi è il più "make-it-your-own".

## Conseguenze
- **Stack rivisto**: pi (TS, harness) + frontend (Web/App, embedding via SDK/RPC) + serving modello (vLLM/Ollama) come processo separato dietro endpoint OpenAI-compatible.
- `wrapper.md` da riscrivere su questa base (l'assunzione "backend Python monolitico" decade; Python resta lato serving/training).
- Nuove open question: API extension stabile? endpoint custom OpenAI-compatible verso vLLM+LoRA? RPC/SDK adeguati per il frontend target?

## API reale — VERIFICATA 2026-06-29 (sorgente `earendil-works/pi`, v0.80.2, ~66k⭐) `[EXTRACTED]`

Ricerca-agente sui doc/sorgente reali. Esito: **il piano era sostanzialmente corretto**; correzioni minori.

- [x] **OpenAI-compatible per vLLM**: ✅ SÌ. `api: "openai-completions"` in `~/.pi/agent/models.json` (reload a ogni `/model`, no restart) **oppure** runtime via extension `pi.registerProvider(name, {baseUrl, api, apiKey, models[]})`. Ammessi anche `openai-responses` / `anthropic-messages` / `google-generative-ai` + blocco `compat`.
- [x] **API Extensions**: ✅ stabile. Modulo TS con **default export = factory `(pi: ExtensionAPI) => {...}`** (async ok). Discovery: `.pi/extensions/` (project, richiede trust) o `~/.pi/agent/extensions/` (global). One-shot: `pi -e ./ext.ts`. Niente manifest JSON.
- [x] **Hook lifecycle** (registrati via `pi.on("<event>", (event, ctx) => ...)`):
  - `context` → `{ messages: Message[] }` — **inietta/modifica il contesto LLM** (context-assembly).
  - `before_agent_start` → `{ message?, systemPrompt? }` — inietta system prompt / messaggio iniziale.
  - `tool_call` → `{ block: true, reason? }` — **gate** pre-tool (pre-flight-safety; secrets su args).
  - `tool_result` → `{ content?, details?, isError? }` — **transform** risultato (secrets-guardrail su output).
  - Altri: `session_start/shutdown`, `agent_start/end`, `turn_start/end`, `before_provider_request`/`after_provider_response`, `input`, `model_select`, `session_compact` (`{compaction}`), `project_trust`.
  - NB: `tool_call`/`tool_result` (gate/transform) ≠ `tool_execution_start/update/end` (osservabilità).
- [x] **Tool custom**: `pi.registerTool({ name, label, description, parameters: <typebox TSchema>, execute(id, params, signal?, onUpdate?, ctx?), renderCall?, renderResult? })`. Schemi con `typebox` (`import { Type } from "typebox"`).
- [x] **TUI nativa**: ✅ `@earendil-works/pi-tui` (differential rendering); 4 modalità: interactive / print-JSON / RPC / SDK.

**Pacchetti reali** (v0.80.2): `@earendil-works/pi-coding-agent` (CLI `pi`, entry per extension/SDK) · `pi-agent-core` (runtime) · `pi-ai` (multi-provider LLM) · `pi-tui`.

**Correzioni al piano**: (a) dir global = `~/.pi/agent/extensions/` (non `~/.pi/extensions/`); (b) pacchetti con nomi specifici (non un generico `pi-*`); (c) esiste la via runtime `registerProvider` oltre a `models.json`. → **lo scaffold sblocca**: gli hook 0.2/0.3/0.4 del piano (context-inject, verifier-sandbox via `registerTool`, secrets-guardrail su `tool_result`, pre-flight su `tool_call`) mappano **1:1** su hook reali.

Fonte: `packages/coding-agent/docs/{extensions,custom-provider,models,index}.md` del repo.

## Sources
- WebFetch pi.dev + WebSearch 2026-06-23. [explainx.ai](https://www.explainx.ai/blog/pi-minimal-agent-harness-mario-zechner-guide-2026), [GitHub earendil-works/pi](https://github.com/earendil-works/pi).
- Decisione utente 2026-06-23 (sessione): "è open source usiamo quello come base / come harness il pi code agent".

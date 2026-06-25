---
name: 2026-06-23-pi-harness-base
description: ADR — adottare pi (earendil-works/pi, MIT) come base dell'harness/wrapper. I concept wrapper del progetto diventano extension di pi. Separazione di concern: pi = layer harness, ricerca = modello + training.
type: decision
tags: [adr, wrapper, harness, pi, architecture, build-vs-buy, open-source]
status: accepted
date: 2026-06-23
last_updated: 2026-06-23
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

## Mappatura concept → meccanismo pi `[INFERRED, da verificare in impl]`

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

## To verify (impl)
- [ ] pi supporta endpoint custom OpenAI-compatible (per vLLM + LoRA adapter per-request)?
- [ ] API Extensions: stabilità + accesso a inject pre-turn / filter history / window control come descritto?
- [ ] Storage sessione tree-structured adatto a multi-day + VARS persistence?
- [ ] Overhead RPC/SDK accettabile per il frontend?

## Sources
- WebFetch pi.dev + WebSearch 2026-06-23. [explainx.ai](https://www.explainx.ai/blog/pi-minimal-agent-harness-mario-zechner-guide-2026), [GitHub earendil-works/pi](https://github.com/earendil-works/pi).
- Decisione utente 2026-06-23 (sessione): "è open source usiamo quello come base / come harness il pi code agent".

# harness — ITLMv1

Harness/wrapper per il **three-tier SLM**, costruito come **estensioni di [pi](https://github.com/earendil-works/pi)** (TypeScript, MIT) + serving **vLLM** (`--enable-lora`, LoRA hot-swap) come processo separato.

> Sub-progetto `harness/` del monorepo **ITLMv1**. La conoscenza di design vive nella wiki centralizzata (`../wiki/`): `../wiki/decisions/2026-06-23-pi-harness-base.md` (ADR + **API pi verificata** v0.80.2), `../wiki/architecture/wrapper-implementation-plan.md` (piano fasato), `../wiki/decisions/2026-06-29-monorepo-itlmv1.md` (struttura monorepo).

## Architettura (3 layer)

```
FRONTEND (post-MVP: TUI nativa pi → Web/Tauri)
   │
HARNESS = pi (TS, MIT)  ◄── le nostre Extensions (.pi/extensions/)
   │  hook: context (inject) · tool_call (gate) · tool_result (transform)
   ▼  endpoint OpenAI-compatible
SERVING = vLLM --enable-lora (Qwen3-4B + LoRA hot-swap per-request) — processo separato
```

La **ricerca** (Tier 1/2/3, training, LoRA) vive nel serving layer; pi la rende operativa.

## Fase 0 — Walking skeleton (bottleneck-buster)

- **0.1** vLLM provider OpenAI-compatible → `serving/models.json` (`api: "openai-completions"`).
- **0.2** `context-assembly` — inietta `<context>` strutturato (rules + aim + task_list) via hook `context`.
- **0.3** `verifier-sandbox` — runner che esegue i verifier dei gold-example (git/python) in sandbox isolata → **valida i gold** (è il bottleneck-buster del rollout gold). **TODO**.
- **0.4** `secrets-guardrail` (scan su `tool_result`) + `pre-flight` (gate su `tool_call` per azioni distruttive).

## Setup (runbook)

```bash
npm install            # @earendil-works/pi-coding-agent@^0.80.2 + typebox + typescript
npm run typecheck      # valida le extension contro i tipi reali di pi
npm run test:vars-queue  # smoke-test del datastore vars-queue (zero-deps, no Docker, node:sqlite) — 24/24

# avvia vLLM (processo separato) — vedi serving/launch-vllm.md
# collega il provider: copia/merge serving/models.json in ~/.pi/agent/models.json
pi                     # modalità interattiva (TUI nativa)
pi -e ./.pi/extensions/context-assembly.ts   # one-shot di una singola extension
```

## Stato

Scaffold iniziale (2026-06-29). **API pi verificata + extension TYPECHECK-GREEN** contro i tipi reali (v0.80.2, `npm run typecheck` pulito): `before_agent_start` (inietta `<context>` nel systemPrompt) · `tool_call` (gate, `event.input.command`) · `tool_result` (redige `content: (TextContent|ImageContent)[]`) · `registerTool` (verifier-sandbox). Le regex/secrets-map sono placeholder (Fase 1: secrets-map dinamica + vars-queue); `verifier-sandbox` usa una tempdir (Fase 1: Docker).

## Roadmap

- **Fase 0** (questo scaffold) → walking skeleton + verifier-sandbox.
- **Fase 1** ✅ (state layer + wiring, typecheck-GREEN + tutti gli smoke verdi):
  - **vars-queue** (`src/vars-queue.mjs`) — datastore SQLite 4-lane + CURR + change-log/timestamp + cross-compact + cross-agent view/propose/merge; **24/24**.
  - **context-assembler** (`src/context-assembler.mjs`) — assembla `<context>` dalle lane (rules/aim/task_list/verify_queue/vars/recent_changes), ordine severità, escaping anti-injection; **11/11**.
  - **facts-pre-check** (`src/facts-pre-check.mjs`) — livello-1 deterministico del reward-L (enum↔enum `campi-tipizzati↔facts`, gold 6.2 §2bis); **7/7**.
  - **pi-extensions wired**: `context-assembly.ts` (assembla via `before_agent_start`), `vars-queue.ts` (tool `set_var`/`get_var`/`set_task_status`) — `.d.mts` types, **typecheck-green** (npm ci 142pkg).
  - ⏳ gated: **lora-router** (classifier → adapter per-request, su vLLM + adapter), estrattore-facts-fuzzy (formato-lane), Docker sandbox.
- **Fase 2** → sandbox/verifier completo per i dati RL (Phase-3 gym Docker).
- **Fase 3** → token-routing, memory layer, contradiction-detection, frontend web.

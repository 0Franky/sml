# Avvio vLLM (serving layer)

Processo separato dietro endpoint OpenAI-compatible, con **LoRA hot-swap** (`--enable-lora`, S-LoRA).

```bash
# Esempio: Qwen3-4B Tier1 + LoRA adapter (Tier 3 frontend) per-request
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen3-4B \
  --enable-lora \
  --lora-modules tier3-frontend=/path/to/lora-frontend \
  --max-lora-rank 64 \
  --port 8000
```

pi si collega via `serving/models.json` (`api: "openai-completions"`, `baseUrl: http://localhost:8000/v1`).

Il **routing dell'adapter per-richiesta** (Tier1 / Tier3) è responsabilità dell'estensione `lora-router` (Fase 1): classifier esterno → setta l'adapter sull'header/param della richiesta verso questo endpoint.

> Nota MVP: il full-FT del Tier1 gira su A100 cloud (vedi `slm/wiki/decisions/2026-06-28-compute-access.md`); il serving locale per dev usa il base Qwen3-4B (eventualmente QLoRA) sul 2080 Ti.

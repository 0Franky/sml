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
- **0.3** `verifier-sandbox` — runner che esegue i verifier dei gold-example (git/python) in sandbox isolata → **valida i gold** (è il bottleneck-buster del rollout gold). ✅ **FATTO** (6/6 spec eseguibili PASS via pip-locale 2026-06-29; build Docker gated finché il daemon è giù).
- **0.4** `secrets-guardrail` (scan su `tool_result`) + `pre-flight` (gate su `tool_call` per azioni distruttive).

## Setup + Run con il TUO provider (dogfooding del metodo, PRIMA dell'SLM)

Le extension sono **provider-agnostiche** (pi parla OpenAI-compatible) → puoi usare l'harness — col nostro **context strutturato + stato persistente + guardrail + memo** — con un modello forte esistente e **valutare l'efficacia del metodo prima che l'SLM esista**.

```bash
npm ci                 # dipendenze da lockfile (@earendil-works/pi-coding-agent + typebox + typescript)
npm run typecheck      # valida le extension contro i tipi reali di pi (GREEN)
npm test               # smoke unit (vars-queue 24 + context 11 + facts 7 + sliding 12) + test:scenarios (secrets-guardrail 9 + organization 11 + note-after-finding 6 + temp-read 10 + long-run 10)

# 1) scegli un provider in serving/models.json e imposta le env. Es. provider GENERICO:
export OAI_BASE_URL="https://api.openai.com/v1"   # o OpenRouter / Together / shim Anthropic-compat / vLLM remoto
export OAI_API_KEY="sk-..."                        # la TUA key  (Ollama locale: nessuna key, usa il provider 'ollama-local')
# 2) copia/merge serving/models.json in ~/.pi/agent/models.json
# 3) lancia pi con le nostre extension caricate:
pi                                                 # TUI nativa (auto-carica .pi/extensions/ se configurato)
#  oppure esplicito (via affidabile):
pi -e ./.pi/extensions/context-assembly.ts -e ./.pi/extensions/vars-queue.ts \
   -e ./.pi/extensions/secrets-guardrail.ts -e ./.pi/extensions/pre-flight.ts \
   -e ./.pi/extensions/error-memo.ts -e ./.pi/extensions/verifier-sandbox.ts
```

L'unica cosa che serve da te = **il provider (baseUrl + key)**. Tutto il resto è già wired. Lo stato vive in `.pi/state/vars.db` (sopravvive al compact).

## Extension attive (`.pi/extensions/`) — tutte typecheck-green

| Extension | Hook / tool | Cosa fa |
|---|---|---|
| `context-assembly.ts` | `before_agent_start` | Assembla il `<context>` strutturato dalle lane del datastore (rules/aim/task_list/verify_queue/vars/recent_changes). |
| `vars-queue.ts` | tool `set_var`/`get_var`/`set_task_status`/`set_curr`/`list_tasks` + **shared-vars** (`get_shared_view`/`propose_var`/`merge_proposals`) + `get_changelog` | Stato persistente (cross-compact + cross-agent on-request, single-writer merge) con change-log/timestamp. |
| `sliding-var.ts` | tool `sliding_var_read`/`sliding_var_replace` | Read/replace di una VAR per **char-range** + preview (edit chirurgici su var grandi senza scaricarle full). |
| `error-memo.ts` | tool `remember_lesson`/`recall_lessons` | Memoria di lezioni/errori (2 livelli), richiamabile, sopravvive al compact. |
| `secrets-guardrail.ts` | tool `add_secret` + `tool_result` | Redige output che matchano i pattern statici (incl. **Google `AIza…` = GEMINI_API_KEY**) **+ la secrets-map dinamica** (riferimenti opachi per-sessione, in-memory). Logica in `src/secrets-redact.mjs` (thin-wrapper, smoke 9/9). |
| `pre-flight.ts` | `tool_call` | Blocca azioni distruttive (`rm -rf`, `git reset --hard`, `mkfs`, `dd`…) prima dell'esecuzione. |
| `verifier-sandbox.ts` | tool `run_verifier` | Esegue i verifier-spec dei gold (setup fixture + assert oracoli) in sandbox, ritorna pass/fail. |

**API pi verificata** (v0.80.2): `before_agent_start` · `tool_call` (gate) · `tool_result` (transform array) · `registerTool` (typebox params). `verifier-sandbox` usa una tempdir (Fase 2: Docker).

## Roadmap

- **Fase 0** (questo scaffold) → walking skeleton + verifier-sandbox.
- **Fase 1** ✅ (state layer + wiring, typecheck-GREEN + tutti gli smoke verdi):
  - **vars-queue** (`src/vars-queue.mjs`) — datastore SQLite 4-lane + CURR + change-log/timestamp + cross-compact + cross-agent view/propose/merge; **24/24**.
  - **context-assembler** (`src/context-assembler.mjs`) — assembla `<context>` dalle lane (rules/aim/task_list/verify_queue/vars/recent_changes), ordine severità, escaping anti-injection; **11/11**.
  - **facts-pre-check** (`src/facts-pre-check.mjs`) — livello-1 deterministico del reward-L (enum↔enum `campi-tipizzati↔facts`, gold 6.2 §2bis); **7/7**.
  - **pi-extensions wired** (6, typecheck-green): `context-assembly` · `vars-queue` · `error-memo` · `secrets-guardrail` (secrets-map dinamica) · `pre-flight` · `verifier-sandbox`.
  - ✅ **MVP RUNNABILE con un provider OpenAI-compatible** (vedi runbook sopra) → dogfooding del metodo PRIMA dell'SLM.
  - ⏳ gated: **lora-router** (serve SLM + adapter su vLLM), estrattore-facts-fuzzy (formato-lane), Docker sandbox (riproducibilità).
- **Fase 2** → sandbox/verifier completo per i dati RL (Phase-3 gym Docker).
- **Fase 3** → token-routing, memory layer, contradiction-detection, frontend web.

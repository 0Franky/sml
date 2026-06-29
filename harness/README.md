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

## Context engineering — il cuore dell'harness

L'idea centrale: **il context del modello è una mente in prima persona curata**, non la chat grezza. L'harness lo costruisce, lo mantiene bounded su sessioni lunghe, e lo fa scalare col carico — senza compaction lossy. I pezzi (tutti implementati + testati, dettaglio nelle pagine wiki linkate):

- **`<context>` strutturato + Strada-2** — il modello riceve lane curate (`rules` / `current_aim` / `task_list` / `verify_queue` / `vars` / `recent_changes`) con prefisso cache-stabile + escaping anti-injection; la storia nativa di pi è soppressa al solo **turno corrente** (`keepTurns=1`) e la chat vive nella lane `<messages_with_user>` → **niente doppia-chat** (verificabile con `turn-trace`). → [context-as-first-person-mind](../wiki/decisions/2026-06-29-context-as-first-person-mind.md), [wrapper-context-assembly-example](../wiki/concepts/wrapper-context-assembly-example.md)
- **Matrioska (nested-compact)** — sotto pressione, invece di compattare (lossy) il modello fa **zoom-IN** su un sotto-insieme di task (`enter_focus`) → lavora a fuoco → `pop_focus` scrive un **report-su-file** + risale un summary + ri-allinea il padre. Profondità ≤3. → [matrioska-orchestration-spec](../wiki/architecture/matrioska-orchestration-spec.md)
- **Focus-gathering v1** — **task-graph** (`priority` + `deps`): `get_execution_order` dà la vista **ready → impatto-a-valle → priority**, così il modello mette a fuoco i task GIUSTI (sbloccati, ad alto impatto), **non "i primi N"**. `enter_focus` ha un **HARD-GATE** che rifiuta i subset senza task ready. `gathering.mode` (delegated/inject/require) regola quanto è forzato il "guarda l'ordine prima del focus". → [focus-task-prioritization](../wiki/concepts/focus-task-prioritization.md)
- **Anti-cecità sui grandi contesti** — segnale degli item nascosti con **breakdown H/M/L**, **aim-in-coda** (anti lost-in-the-middle), **output-budget-reserve** (riserva per output+thinking), **reorganize_hint** pressure-driven, e **`autofocus.mode`** (off/nudge/`auto`=auto-enter deterministico). → [context-limits-explained](../wiki/concepts/context-limits-explained.md)
- **Checkpoint** — il NOSTRO "autocompact" **non-lossy** (handoff durevole + segment-boundary), niente modello-che-riassume. **Config opt-in** (`gathering.mode`, `autofocus.mode`, soglie token/watch, `outputReservePct`, finestra messaggi) → ognuno tara per il proprio modello/infra. **turn-trace** = osservabilità per-turno (dev).

> Mappa completa della conoscenza: **[../wiki/index.md](../wiki/index.md)** (+ `model-testbook.md` = desiderata-modello con verifica, `todo.md`, `open-questions.md`).

## Fase 0 — Walking skeleton (bottleneck-buster)

- **0.1** vLLM provider OpenAI-compatible → `serving/models.json` (`api: "openai-completions"`).
- **0.2** `context-assembly` — inietta `<context>` strutturato (rules + aim + task_list) via hook `context`.
- **0.3** `verifier-sandbox` — runner che esegue i verifier dei gold-example (git/python) in sandbox isolata → **valida i gold** (è il bottleneck-buster del rollout gold). ✅ **FATTO** (6/6 spec eseguibili PASS via pip-locale 2026-06-29; build Docker gated finché il daemon è giù).
- **0.4** `secrets-guardrail` (scan su `tool_result`) + `pre-flight` (gate su `tool_call` per azioni distruttive).

## Setup + Run — A/B "pi vanilla" vs "pi + nostro context" (con QUALSIASI LLM, anche senza l'SLM)

> **Architettura** (NON un fork): l'harness = **pi (dipendenza npm) + le nostre extension** (`.pi/extensions/`). pi porta GIÀ **tutti i provider nativi** (Anthropic/Claude built-in, OpenAI, Gemini…) + **OAuth** (`/login`). Le nostre extension aggiungono SOTTO — `<context>` strutturato + stato persistente + guardrail + memo — e sono **provider-agnostiche**. → chiunque può confrontare **`pi` (vanilla)** vs **`pi -e <nostre extension>` (nostro context)** col proprio LLM, **prima** che l'SLM esista. `serving/models.json` è **OPZIONALE** (solo per endpoint custom: vLLM locale, self-hosted, shim Gemini), NON limita i provider.

```bash
npm ci                 # @earendil-works/pi-coding-agent + typebox + typescript (da lockfile)
npm run typecheck      # extension vs tipi reali di pi (GREEN)
npm test               # 18 file unit+integration (vars-queue/context-assembler/nested-compact/task-graph/harness-config/strada2/secrets/…) — tutti verdi

# --- prova E2E HEADLESS (no TUI): dimostra che gira end-to-end con un provider reale ---
#   richiede GEMINI_API_KEY in harness/.env (gitignored). VERDE = context iniettato + tutte le 15 extension (36 tool) + pre-flight blocca rm-rf + secrets redatti.
node test/e2e/e2e-pi-run.mjs

# --- USO INTERATTIVO (TUI nativa di pi; da questa cartella harness/ pi auto-carica .pi/extensions/) ---
# A) DOGFOOD CON CLAUDE — col TUO abbonamento, NIENTE API key (Claude è built-in in pi):
pi                              # TUI: poi  /login anthropic  (OAuth browser, una volta)
                                #           seleziona un modello Claude (es. claude-sonnet-4-6 — Sonnet=reco per il test, Haiku=solo smoke)
                                #   osservabilità: lancia con PI_TRACE=1 → .pi/state/trace/last-turn.md (overlap lane↔native, % contesto)
#   → chatti con Claude col NOSTRO context attivo sotto.  (fallback esplicito: pi -e ./.pi/extensions/<ognuna>.ts)
#
# B) A/B: la stessa sessione SENZA le nostre extension = pi VANILLA → confronti il comportamento.
#
# C) altri provider via API key (es. Gemini): metti GEMINI_API_KEY in harness/.env + carica ANCHE gemini-compat.ts
#    (toglie il campo `store` che l'endpoint Gemini rifiuta con HTTP 400). Per Claude/OpenAI NON serve.
```

L'unica cosa che richiede TE = l'**auth del provider** (per Claude: `/login anthropic` interattivo, una volta — l'OAuth non è automatizzabile). Tutto il resto è già wired. Lo stato vive in `.pi/state/vars.db` (gitignored, sopravvive al compact). E2E provato 2026-06-29 (`test/e2e/e2e-pi-run.mjs`, verde; incl. auto-validazione di `autofocus.mode=auto` nel runtime reale).

## Extension attive (`.pi/extensions/`) — tutte typecheck-green

| Extension | Hook / tool | Cosa fa |
|---|---|---|
| `context-assembly.ts` | `before_agent_start` | Assembla il `<context>` strutturato dalle lane del datastore (rules/aim/task_list/verify_queue/vars/recent_changes). **Lane WINDOWED + sempre segnalate**: vars/task_list/recent_changes cappate alle più recenti con nota `(+N nascosti → usa <tool>)`; le memo sono escluse dal flusso ma segnalate via `<notes count=N>` → il modello sa SEMPRE che c'è altro e come recuperarlo (context bounded su sessioni lunghe, niente info-loss). |
| `vars-queue.ts` | tool `set_var`/`get_var`/`set_task_status`/`set_curr`/`list_tasks` + **task-graph** (`add_task`/`set_task_deps`/`get_execution_order`) + **shared-vars** (`get_shared_view`/`propose_var`/`merge_proposals`) + `get_changelog` | Stato persistente (cross-compact + cross-agent, single-writer merge) con change-log/timestamp. **Focus-gathering v1**: `add_task(priority,deps)` + `set_task_deps` (validazione no-ciclo) + **`get_execution_order`** (vista READ-ONLY ready→unblocks→priority, da consultare prima di `enter_focus`); `list_tasks` senza status = vista ordinata. |
| `sliding-var.ts` | tool `sliding_var_read`/`sliding_var_replace` | Read/replace di una VAR per **char-range** + preview (edit chirurgici su var grandi senza scaricarle full). |
| `error-memo.ts` | tool `remember_lesson`/`recall_lessons` | Memoria di lezioni/errori (2 livelli), richiamabile, sopravvive al compact. |
| `secrets-guardrail.ts` | tool `add_secret` + `tool_result` | Redige output che matchano i pattern statici (incl. **Google `AIza…` = GEMINI_API_KEY**) **+ la secrets-map dinamica** (riferimenti opachi per-sessione, in-memory). Logica in `src/secrets-redact.mjs` (thin-wrapper, smoke 9/9). |
| `pre-flight.ts` | `tool_call` | Blocca azioni distruttive (`rm -rf`, `git reset --hard`, `mkfs`, `dd`…) prima dell'esecuzione. |
| `verifier-sandbox.ts` | tool `run_verifier` | Esegue i verifier-spec dei gold (setup fixture + assert oracoli) in sandbox, ritorna pass/fail. |
| `gemini-compat.ts` | `before_provider_request` | **Compat-shim provider**: rimuove dal body i campi OpenAI-only (`store`/`metadata`/`parallel_tool_calls`/`reasoning_effort`) che l'endpoint Gemini OpenAI-compat rifiuta con HTTP 400 (→ risposta vuota silenziosa). Caricala SOLO con Gemini; per Claude/OpenAI non serve. Scoperto+fixato nell'e2e 2026-06-29. |
| `contradiction-detection.ts` | tool `record_decision`/`check_facts` | **Contradiction-detection layer** (research-gap #2, validato dal Test B): registra decisioni+assunzioni tipizzate (vars-queue) e segnala quando un nuovo fatto NEGA un'assunzione precedente, deterministicamente (logica `src/contradiction-check.mjs`, smoke 18/18; anti-FP conservativo). |
| `conversation-capture.ts` | `session_start`/`input`/`agent_end` + tool `get_conversation` | Persiste la CONVERSAZIONE per-ID in `conversations.db` (sopravvive al compact, recuperabile per range dai subagent). convId per-sessione (`resolveConvId`, no-clobber su /new). Redazione segreti (best-effort) su input+output prima di persistere. |
| `var-ops.ts` | tool `extract_var`/`render_template` + `message_end` | Operazioni su var **per riferimento**: estrai campi JSON (no eval) + interpolazione `{{var:NOME}}` **OPT-IN** (`render_template`, scopribile via promptSnippet). `message_end` = redazione difensiva del canale-testo (no auto-interpolazione: era esfiltrazione). |
| `nested-compact.ts` | tool `enter_focus`/`pop_focus`/`focus_status` + `session_before_compact` | **Matrioska** nested-compact: zoom-in su un subset di task → lavoro a fuoco → pop (report-su-file + summary) → re-align del padre. `focus_frames` + `active_scope` routing-who. **Focus-gathering v1**: `enter_focus` HARD-GATE su subset senza task ready (`lead`=primo-ready) + `gathering.mode=require` gate. Logica in `src/nested-compact.mjs`. |
| `turn-trace.ts` | `before_provider_request` + tool `trace_status` | **Osservabilità per-turno** (dev/testing): logga ciò che il modello riceve davvero + metrica overlap lane↔native (≤1 = ok, ~N = doppia-chat) in `.pi/state/trace/` (`last-turn.md` + JSONL). Read-only. Toggle `PI_TRACE=0`. |
| `native-window.ts` | `context` | **Strada-2**: sopprime l'array messaggi NATIVO di pi al solo TURNO CORRENTE (`windowNativeMessages keepTurns:1`) → la storia vive nella lane `<messages_with_user>` (complementari, no doppia-chat). Estratta da `context-assembly` per coesione (responsabilità ortogonale). Logica in `src/conversation-store.mjs`. |
| `checkpoint.ts` | tool `checkpoint` | **Il NOSTRO "autocompact"** (NON il compaction nativo di pi, OFF): `checkpoint(note?)` scrive un **handoff durevole** (namespace `handoff` → `<resuming_from>` al riavvio) + marca un **segment-boundary** (`_checkpoint_seq:<convId>`) → la lane riparte leggera (chat pre-checkpoint ripiegata, recuperabile via `get_conversation`). Non-lossy, niente modello-attivo-che-riassume. |

**API pi verificata** (v0.80.2): `before_agent_start` · `context` · `tool_call` (gate) · `tool_result` (transform array) · `before_provider_request` (mutate body) · `session_before_compact` (cancellabile) · `registerTool` (typebox params). **E2E headless provato** (`test/e2e/e2e-pi-run.mjs`, 2026-06-29): `createAgentSession` + `AuthStorage.inMemory` + `ModelRegistry.registerProvider` + `bindExtensions` → turno reale verde (context iniettato, **tutte le 15 extension caricate, 36 tool**, guardrail attivi). `verifier-sandbox` usa una tempdir (Fase 2: Docker).

## Config context-budget (OPT-IN, per modello/infra)

Le soglie di "contesto pieno" (quando compattare/focalizzare) e la finestra messaggi sono **configurabili**, così **ognuno le tara per il proprio modello/infrastruttura** senza toccare il codice. **Opt-in**: senza config si usano i default (comportamento invariato).

- **File**: copia `.pi/harness.config.example.json` → `.pi/harness.config.json` (gitignored) e modifica i valori.
- **Env** (override rapido, vince sul file): `HARNESS_TOKEN_MATRIOSKA_PCT`, `HARNESS_TOKEN_REORDER_PCT`, `HARNESS_WATCH_MATRIOSKA`, `HARNESS_WATCH_REORDER`, `HARNESS_MAX_DEPTH`, `HARNESS_OUTPUT_RESERVE_PCT`, `HARNESS_MESSAGES_WINDOW_N`, `HARNESS_GATHERING_MODE`, `HARNESS_GATHERING_MIN_TASKS`, `HARNESS_AUTOFOCUS_MODE`.
- **Come tararlo**: modello a **contesto piccolo** (SLM 4B) → soglie **basse** (compatta PRIMA, resti nel regime di qualità alta); modello a **contesto grande** (es. Claude Sonnet) → soglie **alte** (compatta DOPO, sfrutti la finestra). NB analisi SOTA (review-loop 2026-06-29): per un 4B il contesto EFFETTIVO è ~40-60% del nominale → il default `tokenMatrioskaPct=0.75` è un'IPOTESI da misurare (needle/RULER sul nostro modello), probabilmente da abbassare. Logica: `src/harness-config.mjs` (fail-safe ai default).
- **`outputReservePct`** (default 0): riserva fisica 0..0.9 per output+thinking → i trigger scattano su `window*(1-reserve)`. Per modelli con thinking lungo prova 0.15.
- **`gathering.mode`** (default `delegated`): quanto è forzato il "guarda l'ordine dei task prima del focus". `delegated` (il modello decide), `inject` (l'harness allega la vista ordinata nel `focus_hint` — consigliato per SLM piccoli, anti-cecità), `require` (`enter_focus` bloccato finché non chiami `get_execution_order`). `minTasksForForce` (default 5): inject/require agiscono solo con ≥ N task open (gate proporzionalità). Vedi `wiki/concepts/focus-task-prioritization.md` §IMPLEMENTAZIONE.
- **`autofocus.mode`** (default `nudge`): CHI entra in focus sotto pressione (OQ-A). `off` (nessun segnale), `nudge` (l'harness suggerisce col `<focus_hint>`, decide il modello — invariato), `auto` (l'harness ENTRA in focus DA SOLO sui task ready quando la pressione è matrioska, deterministico + cooldown anti-thrash). `auto` = rete di sicurezza per un modello che non si auto-organizza (es. SLM 4B); per Sonnet `nudge` basta.

## Roadmap

- **Fase 0** (questo scaffold) → walking skeleton + verifier-sandbox.
- **Fase 1** ✅ (state layer + wiring, typecheck-GREEN + tutti gli smoke verdi):
  - **vars-queue** (`src/vars-queue.mjs`) — datastore SQLite 4-lane + CURR + change-log/timestamp + cross-compact + cross-agent view/propose/merge; **24/24**.
  - **context-assembler** (`src/context-assembler.mjs`) — assembla `<context>` dalle lane (rules/aim/task_list/verify_queue/vars/recent_changes), ordine severità, escaping anti-injection; **11/11**.
  - **facts-pre-check** (`src/facts-pre-check.mjs`) — livello-1 deterministico del reward-L (enum↔enum `campi-tipizzati↔facts`, gold 6.2 §2bis); **7/7**.
  - **pi-extensions wired** (15, typecheck-green): `context-assembly` · `native-window` · `vars-queue` · `nested-compact` · `checkpoint` · `turn-trace` · `error-memo` · `secrets-guardrail` · `pre-flight` · `verifier-sandbox` · `contradiction-detection` · `conversation-capture` · `var-ops` · `sliding-var` · `gemini-compat`.
  - **Context-engineering completo** (vedi §"Il cuore dell'harness"): Strada-2 (no doppia-chat) · matrioska nested-compact · **focus-gathering v1** (task-graph + hard-gate + `gathering.mode`) · **anti-cecità** (segnale H/M/L + aim-in-coda + output-reserve + reorganize_hint) · **`autofocus.mode`** (off/nudge/auto, validato live) · checkpoint non-lossy · config opt-in. Review-loop 41-agenti → 18 fix; suite 18 file 0-falliti.
  - ✅ **MVP RUNNABILE con un provider OpenAI-compatible** (vedi runbook sopra) → dogfooding del metodo PRIMA dell'SLM.
  - ⏳ gated: **lora-router** (serve SLM + adapter su vLLM), Docker sandbox (riproducibilità), calibrazione soglie (misurare la curva effective-context del modello).
- **Fase 2** → sandbox/verifier completo per i dati RL (Phase-3 gym Docker).
- **Fase 3** → token-routing, memory layer, frontend web.

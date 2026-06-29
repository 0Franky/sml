---
name: provider-compat-shim
description: Pattern harness — un'extension `before_provider_request` che ripulisce il body della richiesta dai campi che un endpoint provider rifiuta. Istanza concreta: gemini-compat (pi inietta `store` OpenAI-only → l'endpoint Gemini OpenAI-compat dà HTTP 400 + risposta vuota silenziosa). Scoperto nell'e2e 2026-06-29.
type: concept
tags: [harness, pi, provider, compat, before_provider_request, debugging]
sources:
  - harness/.pi/extensions/gemini-compat.ts
  - harness/src/_e2e-pi-run.mjs
last_updated: 2026-06-29
---

# Provider-compat shim (`before_provider_request`)

## Il problema (caso gemini, [EXTRACTED — e2e 2026-06-29])
L'adapter `openai-completions` di pi (o il client OpenAI che usa sotto) inietta nel body della richiesta campi **OpenAI-only** — verificato: **`store`** (+ plausibilmente `metadata`, `parallel_tool_calls`, `reasoning_effort`). L'endpoint **Gemini OpenAI-compatible** è **STRICT** sui campi sconosciuti → risponde **HTTP 400** (`Unknown name "store"`). pi **deglutisce** l'errore nello stream-loop → l'assistant produce un **messaggio VUOTO, 0 token**: sintomo insidioso ("turno completato" ma senza risposta), facile da mis-diagnosticare come "Gemini non funziona con pi".

**Perché raramente notato** `[INFERRED]`: è l'intersezione stretta *adapter-pi* × *endpoint OpenAI-compat STRICT*. La maggior parte degli endpoint OpenAI-compat (OpenRouter, Together, vLLM, Ollama, LM Studio) è **lenient** → ignora i campi extra. I provider first-class di pi (Anthropic/OpenAI nativi) non passano per questo path. Gemini-via-OpenAI-compat è di nicchia. → bug sotto il radar. (Root-cause esatta — pi-core vs il suo client openai — **non ancora pinpointata**; vale un report upstream a `earendil-works/pi` previa conferma, ma il nostro shim risolve a prescindere.)

## Il pattern (soluzione riusabile)
Un'**extension** che sull'hook **`before_provider_request`** **rimuove dal body** i campi incompatibili **prima** che la richiesta parta. Generalizzabile a QUALSIASI endpoint strict:

```ts
const INCOMPATIBLE = ["store", "metadata", "parallel_tool_calls", "reasoning_effort"];
pi.on("before_provider_request", (event) => {
  const body = event.body;            // muta/clona il body
  for (const k of INCOMPATIBLE) delete body[k];
  return { body };
});
```

→ `harness/.pi/extensions/gemini-compat.ts`. **Caricala SOLO col provider che ne ha bisogno** (Gemini); per Claude/OpenAI nativi NON serve. È un **F-harness** puro (meccanismo deterministico lato wrapper), zero training.

## Lezioni `[INFERRED]`
1. **Gli adapter "OpenAI-compatible" NON sono tutti uguali**: lenient vs strict sui campi sconosciuti → testare e2e con OGNI provider reale, non fidarsi del typecheck.
2. **Gli errori provider deglutiti = sintomi muti**: una risposta vuota a 0-token è un red-flag → l'e2e deve asserire `tokens>0`/`content non vuoto`, non solo "turno completato" (il nostro `_e2e-pi-run.mjs` lo fa).
3. **`before_provider_request` è il punto giusto** per qualunque normalizzazione di compatibilità provider (header, campi, formati) — un punto di estensione di prima classe del wrapper.

## Collegamenti
- [[../decisions/2026-06-23-pi-harness-base]] — API pi (hook list, ora include `before_provider_request`).
- `harness/src/_e2e-pi-run.mjs` — l'e2e headless che ha scoperto il bug + lo verifica.
- [[wrapper-context-assembly-example]] — gli altri hook che usiamo.

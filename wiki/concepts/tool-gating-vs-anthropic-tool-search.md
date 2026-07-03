---
name: tool-gating-vs-anthropic-tool-search
description: Confronto tra il nostro find_tool/open_category (deferred-tool client-side su pi) e l'Anthropic Tool Search Tool (server-side, defer_loading); valida il gating, spiega perché non possiamo usare il loro, isola il collo di bottiglia (il modello, non il meccanismo).
type: concept
tags: [tool-gating, tool-search, deferred-tools, harness, pi, 9b, context-engineering, reward-hacking-adjacent]
sources:
  - https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool
  - https://www.anthropic.com/engineering/advanced-tool-use
  - harness/.pi/extensions/tool-gating.ts
  - harness/src/tool-gating.mjs
last_updated: 2026-07-03
---

# Tool-gating nostro vs Anthropic Tool Search Tool

> Origine: query utente (2026-07-03, sessione live `019f292b`) — "il search tool è esplicitamente indicato nella sua funzione? abbiamo una regola che obbliga il modello a cercare? cosa cambia tra il search tool di Claude Code e questo?". Filed-back come sintesi.

## TL;DR

Il nostro `find_tool`/`open_category` e l'**Anthropic Tool Search Tool** implementano **lo stesso concetto** (deferred tools + cerca-per-rivelare per non annegare il modello con troppi schemi). Differenze: il loro è **server-side, nativo, per modelli capaci, cache-safe**; il nostro è una **re-implementazione client-side** su `pi.setActiveTools`, che gira contro un **9B locale** → più fragile. **La loro guida valida il nostro gating** (accuracy degrada oltre 30-50 tool). **Non possiamo usare il loro** (è API Claude; noi serviamo Qwen locale). Il **collo di bottiglia è il modello**, non il meccanismo: entrambi assumono che il modello *decida* di cercare — il 9B spesso non lo fa e confabula «non ho tool».

## 1. C'è un'istruzione che obbliga a cercare? [EXTRACTED]

Nel nostro system prompt (promptGuidelines di `find_tool`, iniettate quando è attivo — ed è sempre essenziale):

- `find_tool: find_tool(query) — search hidden tools/skills by intent and activate the matches.` (promptSnippet, lista tool)
- *"Your tool list is intentionally SHORT. If you need to do something and don't see a tool for it, call find_tool(query)… — **search first**."* (Guidelines)
- *"If you called a tool and got 'not found'… **Call find_tool('what you want to do')** and use a name it returns."* (Guidelines)

→ **Istruzione esplicita SÌ; enforcement hard NO.** Non si può forzare una tool-call. Inoltre l'istruzione scatta solo se il modello **riconosce** "mi serve un tool e non lo vedo": nella confabulazione (sessione `019f292b`) il 9B ha saltato quel riconoscimento e ha dichiarato «non ho accesso», mollando. → gap di capacità, non di istruzione. Coerente con [[feedback_clear_instructions_over_patches]]: istruzione chiara prima, enforcement solo su ops critiche se gli hint non bastano.

## 2. Come funziona l'Anthropic Tool Search Tool [EXTRACTED]

- Variabili `tool_search_tool_regex_20251119` (regex `re.search`) e `tool_search_tool_bm25_20251119` (naturale). Cercano nomi + descrizioni + nomi-arg + descrizioni-arg.
- `defer_loading: true` per-tool: le definizioni deferite sono **escluse dal prefix** del prompt (ma inviate comunque server-side ogni request). Almeno un tool (il search stesso) resta non-deferito.
- Il modello chiama il search → l'API ritorna `tool_reference` (max 5) → li **espande inline** nella conversazione in definizioni piene → il modello li chiama. Il prefix resta intatto → **prompt-cache preservata**.
- Motivazione ufficiale: *"Claude's ability to pick the right tool degrades once you exceed 30-50 available tools"*; *"keep your 3-5 most frequently used tools non-deferred"*; ~55k token di definizioni per un setup multi-server → -85% con tool search.

## 3. Confronto [EXTRACTED/INFERRED]

| Aspetto | Anthropic / Claude Code | Nostro `find_tool` (pi) |
|---|---|---|
| Cosa si differisce | Lo **schema** escluso dal *prefix*; `defer_loading:true` per-tool | Tool tolto dall'**active set** (`setActiveTools`) → fuori dall'array `tools` |
| Come diventa chiamabile | search → `tool_reference` → **espansi inline** (server-side) | `find_tool`/`open_category` → `setActiveTools` (client-side) |
| Dove vive il rivelato | inline nella history, non nel prefix → **cache-safe** | active set, rimandato ogni turno; **sticky-reveal** lo ri-applica; meno cache-friendly |
| Ricerca | regex / BM25 server-side | token-overlap hand-rolled (`searchTools`); indicizza anche le **skill** |
| Fallimento tool non caricato | grammar strict sull'intero toolset; CC → `InputValidationError` | `"Tool X not found"` (agent-loop.js:365) prima di ogni hook |
| Modello target | Claude capaci (Opus/Sonnet/Haiku 4.5+) | **9B locale** → il pattern è più fragile |

## 4. Conseguenze per il progetto [INFERRED]

1. **Validazione esterna del gating**: la soglia 30-50 tool + "3-5 non-deferred" è *esattamente* il nostro ragionamento (il 9B annega a ~50; widen a ~30 essenziali). Ma quella soglia è per modelli forti → un 9B degrada prima. Vedi [[tool-gating]] / regola CLAUDE.md gating.
2. **Non possiamo usare il loro**: è server-side sull'API Claude; noi serviamo Qwen 9B (ollama/vLLM OpenAI-compatible) → dobbiamo rollare il nostro. È il motivo per cui `find_tool`/`open_category` esistono.
3. **Il collo di bottiglia è il modello**: entrambi i meccanismi assumono che il modello *decida* di cercare. Il 9B spesso confabula invece di cercare (sessione `019f292b`). Il meccanismo harness è sano e rispecchia quello ufficiale → il fix vero è training / modello più capace. Vedi [[feedback_instrument_before_hypothesizing]] (ancorato al wire-payload reale).
4. **Da rubargli** (candidati miglioramento): (a) riga statica nel prompt che nomina le **categorie** ("puoi cercare tool per secrets/tasks/http…") — loro la consigliano; (b) regex/BM25 se il catalogo cresce; (c) reveal inline+cache-safe vs mutazione active-set (minore, per locale).

## Cross-ref

- Implementazione: `harness/.pi/extensions/tool-gating.ts` (sticky-reveal B2 + widen B3, commit `a92ed91`), `harness/src/tool-gating.mjs` (ESSENTIAL_TOOLS, categorizzazione, search puro).
- Diagnosi sessione `019f292b`: `wiki/todo.md` (blocco FINDING SESSIONE LIVE) — la cascata tool-gating-loop → confabulazione.
- Principi: [[feedback_clear_instructions_over_patches]], [[feedback_instrument_before_hypothesizing]], [[feedback_training_vs_harness_classification]].

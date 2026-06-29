---
name: 2026-06-29-headroom-evaluation
description: Valutazione di Headroom (context-compression toolkit, Apache-2.0) per inclusione nell'harness. Verdetto = integrare SÌ, ma NON blanket-default-on; selettivo sulle lane content + opt-in in fase-ricerca. Decisione proposta, pending conferma utente.
type: decision
status: accepted — integrazione FUTURA low-priority (sopra i Gold), import SELETTIVO+STUDIATO (utente conferma l'approccio, msg 395/396)
tags: [harness, context-compression, headroom, token-budget, kv-cache, third-party, commercial-clean]
sources:
  - https://github.com/headroomlabs-ai/headroom
last_updated: 2026-06-29
---

# ADR — Headroom nell'harness? (proposta)

> Richiesta utente (msg 392, 2026-06-29): *"valuta se includere nel harness anche headroom di default come optout"* (https://github.com/headroomlabs-ai/headroom). Valutazione critica (no piaggeria, regola CLAUDE.md #2).

## Cos'è Headroom `[EXTRACTED dal repo]`
Toolkit open-source (Apache-2.0) di **context-compression** per agenti LLM. Comprime tool-output, log, RAG-chunk, file, history del **60-95%** *prima* che raggiungano il modello, preservando (claim) la qualità. Stack: **Python 79%** + Rust 16% (compressione perf-critica) + TS/Node 3%. Integrazione: (1) libreria `compress(messages)`, (2) **CLI proxy** zero-code (`headroom proxy --port 8787`), (3) agent-wrapping (`headroom wrap claude|cursor|aider|cline`), (4) **MCP server**, (5) ASGI middleware. Feature: **ContentRouter** (tipo→compressore dedicato), **CacheAligner** (stabilizza i prefissi per gli hit di KV-cache provider), **CCR = compressione REVERSIBILE** (originali in locale, l'LLM li ri-recupera on-demand), **cross-agent memory** (context compresso condiviso), **headroom learn** (mina le sessioni fallite → corrections in markdown).

## Allineamento col progetto `[INFERRED]`
Forte, su più assi:
- **Costo-token**: 60-95% di riduzione è enorme per un agente SLM cost-sensitive (north-star commerciale). Centra una preoccupazione di progetto.
- **CCR reversibile = la NOSTRA filosofia**: comprimi-ma-recuperabile + segnala → è esattamente [[sliding-window-variable-tool]] / [[harness-capabilities-as-files]] / [[window-aware-fetching]] (il pattern temp-read che abbiamo appena rifinito). Headroom potrebbe **fornire** questo invece di costruirlo noi.
- **CacheAligner** affronta il caveat KV-cache che abbiamo già notato ([[harness-capabilities-as-files]], multi-expert segment-rerun).
- **Licenza Apache-2.0** = commercial-clean (allineata a [[../training-taxonomy/provenance-manifest]] / strategia D6).
- **Provider-agnostico** (proxy/MCP) → combacia con l'harness pi provider-agnostico.

## Cautele critiche (perché NON blanket-default-on) `[INFERRED]`
1. **Sovrapposizione/conflitto con ciò che abbiamo costruito**: CCR ≈ [[sliding-window-variable-tool]]; cross-agent-memory ≈ [[cross-session-state-sharing]] (vars-queue shared-vars); `headroom learn` ≈ [[error-memo-system]]. Default-on rischia **duplicazione/conflitto** col nostro state+context layer. Decisione necessaria *per-componente*: headroom **sostituisce** o **affianca** il nostro? (es. CCR potrebbe rimpiazzare sliding-var se migliore; ma cross-agent-memory e error-memo li gestiamo già con semantica nostra).
2. **Lossy sulle lane SBAGLIATE = pericolo**: 60-95% è lossy by-design. NON deve toccare le lane **safety/decisione** (`rules`/`secrets`/decision-state/`current_aim`): comprimere una rule o un segreto è inaccettabile. Può comprimere SOLO le lane ad alto-volume e basso-rischio (tool-output grandi, file/RAG dump, log). Il nostro [[wrapper-context-assembly-example|context-assembler]] **già separa le lane** → headroom va applicato **selettivamente**, non globalmente. (NB: ordine vs [[secret-section-exfiltration-defense|secrets-guardrail]] — comprimere PRIMA o DOPO la redazione? La redazione deve restare efficace sul compresso.)
3. **Train-serve context-match (il rischio più sottile, specifico al NOSTRO caso SLM-in-training)**: se l'harness comprime di default, l'SLM **vede context compresso** a inferenza. Ma i nostri gold/training-data usano il `<context>` strutturato PIENO. **Default-on → mismatch train-serve**: il modello è addestrato sul formato pieno e servito sul compresso (o viceversa). Va deciso a monte: o la **distribuzione di training include le forme compresse** ([[dynamic-context-training-regime]] come transform-knob in più), o headroom si applica solo alle lane content che il modello tratta come dati opachi (non al `<context>` di controllo).
4. **Python-primary vs harness TS/pi**: il core è Python; il supporto TS è 3% (probabilmente sottile). Integrazione nell'harness pi (TS) → via **CLI-proxy o MCP-server** (processo separato), non in-process. È una **dipendenza di deployment** (un processo Python in più) da pesare vs il nostro stack zero-deps (node:sqlite). L'agent-wrapping supporta `claude|cursor|aider|cline`, **non pi** → serve il path proxy/MCP.
5. **Default-on (opt-out) vs opt-in in fase-ricerca**: in fase di ricerca/training vogliamo **osservare il comportamento raw** e controllare la context-distribution → **opt-IN** è più sicuro. In deployment cost-optimized → opt-OUT (default-on) sulle sole lane safe ha senso. Il suggerimento utente (opt-out) calza per il prodotto, meno per la fase attuale.

## Raccomandazione (proposta, pending conferma) `[INFERRED]`
**Integrare SÌ — ma non come blanket-default-on.** Calibrato:
- **Sì come extension/proxy OPZIONALE** che comprime SOLO le lane content ad alto-volume (tool_result grandi, file/RAG dump), **mai** `rules`/`secrets`/decision-state/`current_aim`.
- **Fase-ricerca/training = opt-IN** (controllo della context-distribution + osservazione raw + coerenza coi gold). **Fase-prodotto = opt-OUT/default-on** sulle lane safe.
- **Valutazione replace-vs-complement per-componente** PRIMA di adottare: CCR vs [[sliding-window-variable-tool]] (candidato replace se misurato migliore); CacheAligner = **adottare** (colma il caveat KV-cache); cross-agent-memory + `headroom learn` = **affiancare con cautela** (abbiamo già [[cross-session-state-sharing]] + [[error-memo-system]] con semantica nostra — non sostituire alla cieca).
- **Spike di misura** prima di committare: su un task reale, misurare (a) riduzione-token effettiva, (b) tenuta-qualità, (c) interazione con secrets-guardrail (redazione sul compresso), (d) compatibilità del formato compresso col `<context>` che l'SLM dovrà vedere.
- **Train-serve-match = gate bloccante**: decidere se le forme compresse entrano nella training-distribution PRIMA di renderlo default-on, altrimenti si crea mismatch.

> **Verdetto in una riga**: ottimo strumento, allineato e commercial-clean; **integrarlo selettivamente (lane content) e opt-in in fase-ricerca**, NON blanket-default-on — per non comprimere lane di sicurezza, non duplicare i layer nostri, e non creare mismatch train-serve sul context dell'SLM. Conferma utente attesa su quale path (proxy/MCP/extension) e quando flippare a opt-out.

## Piano di import SELETTIVO (study 2026-06-29, niente codice ancora) `[INFERRED]`

Componenti di headroom valutati per valore × rischio **nel NOSTRO caso** (lane safety/decisione protette, harness TS/pi, SLM-in-training):

| Componente headroom | Valore | Rischio | Verdetto |
|---|---|---|---|
| **CacheAligner** (stabilizza i prefissi per gli hit di KV-cache) | ALTO (costo+latenza) | **BASSO** — riordina i prefissi, **NON** comprime/perde contenuto (non-lossy) | ✅ **PRIMO da prendere** |
| **CCR** (compressione reversibile, originali in locale + recupero on-demand) | ALTO sulle lane content | MEDIO (lossy, ma reversibile) — **solo** su tool-output/file/RAG, **mai** rules/decisioni | ⚠️ **secondo, gated** (+ replace-vs-complement vs [[sliding-window-variable-tool]]) |
| **ContentRouter** (tipo→compressore dedicato) | MEDIO (serve a CCR per saltare il `<context>` strutturato) | MEDIO | ⚠️ **con CCR** (allowlist di lane) |
| **Cross-agent memory** | BASSO per noi | — overlap con [[cross-session-state-sharing]] (semantica nostra) | ⛔ **skip** (al più complement) |
| **headroom learn** (mina sessioni fallite→md) | BASSO per noi | — overlap con [[error-memo-system]] | ⛔ **skip** (al più complement) |
| **Output token reduction** (comprime l'output del modello) | MEDIO | **ALTO** — rischia di perdere i marker `[V]/[A]/[?]` + il reasoning strutturato | ⛔ **skip per ora** |

**Ordine raccomandato**:
1. **CacheAligner** — è il più sicuro (non-lossy) e il più allineato a un caveat già nostro (KV-cache, [[harness-capabilities-as-files]] / multi-expert segment-rerun). **Modo**: la logica di prefix-stability è probabilmente piccola → **reimplementabile come extension pi in TS** (evita la dipendenza Python). Spike: misurare il delta di cache-hit su una sessione reale.
2. **CCR + ContentRouter** — solo dopo, e SOLO sulle lane content ad alto-volume (tool_result grandi, file/RAG dump) dietro un'**allowlist di lane** + ordine corretto vs [[secret-section-exfiltration-defense|secrets-guardrail]] (redazione efficace sul compresso) + il **gate train-serve-match** (le forme compresse devono entrare nella training-distribution, o si comprime solo ciò che l'SLM tratta come dati opachi). **Modo**: CCR usa modelli di compressione → serve la lib Python → integrazione via **CLI-proxy o MCP-server** (processo separato), NON in-process. **Prima**: decidere replace-vs-complement vs il nostro `sliding-var` (misurare quale è meglio).
3. **Niente altro** finché 1-2 non sono misurati.

**Gate bloccanti prima di QUALSIASI default-on**: (a) spike di misura (riduzione-token reale + tenuta-qualità); (b) interazione con secrets-guardrail verificata; (c) decisione train-serve-match; (d) lane safety/decisione (rules/aim/secrets/decision-state) **escluse per costruzione** dall'allowlist.

> **Prossima azione concreta** (quando si riapre headroom, priorità sopra i Gold ma sotto l'harness-core): spike CacheAligner reimplementato in TS + misura cache-hit. Nessun codice finora — solo questo piano.

## Collegamenti
- [[sliding-window-variable-tool]] · [[harness-capabilities-as-files]] · [[window-aware-fetching]] — il pattern CCR-like che abbiamo costruito.
- [[cross-session-state-sharing]] · [[error-memo-system]] — i layer che si sovrappongono a cross-agent-memory / headroom-learn.
- [[secret-section-exfiltration-defense]] — interazione d'ordine con la compressione.
- [[dynamic-context-training-regime]] — dove le forme compresse entrerebbero nella training-distribution.
- [[../architecture/wrapper-implementation-plan]] — dove incasellare l'integrazione (Fase 1/2).

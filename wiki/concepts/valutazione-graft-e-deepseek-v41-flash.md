---
name: valutazione-graft-e-deepseek-v41-flash
description: "Valutazione di due proposte di Fra (TG msg 2238, 2026-09-12): (1) Graft (github.com/trailhq/Graft) «per l'addestramento del nostro modello» → NON è un metodo di training: è un indicizzatore di codice + server MCP, cioè harness (F), e la sua tesi è il gemello-F della nostra classe module-boundary; (2) DeepSeek V4.1 Flash → non è un base per il Tier-1 (MoE gigante, pesi non nostri) ma è il miglior candidato TEACHER/GIUDICE e un soffitto di qualità a costo quasi nullo."
type: concept
tags: [harness, context-engineering, teacher, distillation, judge, bake-off, valutazione, area-eval, mcp]
sources:
  - utente TG msg 2238 (2026-09-12) — «Valuta anche deepseek-v4.1Flash» + «Valuta questa skill per l'addestramento del nostro modello https://github.com/trailhq/Graft»
  - README di Graft letto il 2026-09-12 (MIT, 7,3k stelle, 478 commit, suite di test presente)
  - elenco modelli OpenRouter interrogato il 2026-09-12 (19 slug DeepSeek, prezzi e `tools` verificati)
last_updated: 2026-09-12
---

# Due proposte di Fra, valutate — e nessuna delle due è ciò che sembrava

> **Regola applicata**: prima di dire «sì, adottiamolo» o «no», **cosa fa davvero** e **quale nostra decisione cambierebbe** ([[../../memory|feedback_measure_serves_a_decision]] (ogni misura serve una decisione)). Entrambe le proposte hanno un posto, **diverso da quello per cui sono state proposte**.

## 1. Graft — è HARNESS, non training. E la sua tesi è il gemello-F di una nostra classe

**Cosa fa** (dal README, MIT): due passate su un repo. La prima, **senza LLM e a costo zero**, usa *tree-sitter* su 23 linguaggi per estrarre simboli, archi di chiamata e import → un grafo per-simbolo. La seconda, **opzionale e con LLM**, riassume ogni file e sintetizza nodi raggruppati (sottosistemi, file chiave, concetti) con link tipizzati (`depends_on`, `part_of`, `uses`, `implements`, `produces`). Espone sei tool via **MCP** (`graft_find_code`, `graft_file_api`, `graft_trace_calls`, `graft_find_all`, `graft_repo_map`, `graft_check_freshness`) e si aggancia a Claude Code, Cursor, Copilot, Gemini.

**Il problema che dichiara**: *«Every task, your coding agent starts blind. Before it changes anything, it re-explores the repo… Repeated. Every task pays the exploration cost again, from zero.»*

**Numeri che riporta** (suoi, non nostri): su SWE-bench Verified (50 issue, Sonnet 5) correttezza **54 % → 66 %**, **−23 %** token, **−25 %** tool call, **−32 %** tempo; su un benchmark interno di 162 run **−42 %** token e **−46 %** tool call con correttezza *«93 % equal»*.

### Verdetto — classificazione #11 (F-harness vs S-training)

**È F, interamente.** Non addestra niente: non c'è loss, non c'è dataset, non ci sono pesi che cambiano. Chiamarla *«skill per l'addestramento»* è un equivoco comprensibile — migliora il comportamento dell'agente — ma il meccanismo è **contesto precalcolato**, non apprendimento. Quindi **non entra nella tassonomia** e non produce esempi.

⭐ **Ma la cosa interessante è un'altra, ed è nostra**: la tesi di Graft — *il grafo dei flussi del repo, calcolato una volta, evita la ri-esplorazione* — è **esattamente il contenuto** di [[../training-taxonomy/class-module-boundary-flow-convergence]] (idea 12 di Fra, TG msg 2155), dove però è una **skill del modello**: capire dove convergono i cammini dal dato all'uscita. **Graft è la versione F della stessa intuizione, la nostra è la versione S.** Non sono alternative: sono i due poli dello stesso asse, ed è la domanda #11 in forma pura — *lo scaffolding lo dà l'harness o lo impara il modello?*

**Dove Graft è più forte della nostra scommessa** (e va detto, perché è un dato contro di noi): i suoi tool sono di **retrieval** — `find_code`, `trace_calls` — cioè la famiglia che i modelli **usano davvero** (grep/read sono i tool più chiamati in ogni nostro trace). I nostri sono di **memoria** (`note`, `jot`, `set_var`), e [[../harness-experiment-log]] F43 ha misurato che il 32B **non ne tocca nemmeno uno** in 16 run. Se Graft funziona e il nostro contesto no (F47: inconcludente), una spiegazione candidata è proprio questa: **abbiamo scommesso sulla famiglia di tool che i modelli ignorano**.

### Cosa farne, concretamente

1. **Non adottarlo per il training**: non c'entra. ⛔
2. **Candidato per l'harness, ma non ora e non intero**: il nostro Tier-1 non è un agente di codice (identità: intelligenza operativa generale), quindi un indicizzatore di repo serve al **Tier-2/3** e al nostro lavoro quotidiano, non al Tier-1. Adottarlo adesso sarebbe deriva di scopo (#30).
3. ⭐ **Il pezzo importabile subito, a costo zero, è l'IDEA DI MISURA**: Graft dichiara −23 % token e +12 punti di correttezza **su un benchmark pubblico**, con bracci con/senza. È il **disegno a coppia** che usiamo noi, applicato a un harness — e ci dà un **termine di paragone esterno** per la domanda di F47 (*«il nostro contesto sposta qualcosa?»*). Il loro effetto è grande e misurabile con n modesto; il nostro no: questa è un'informazione su di noi.
4. **Da verificare prima di qualunque uso** (#29): i numeri sono **auto-riportati**, non riprodotti da terzi, e il benchmark interno è su due repo. MIT, quindi la licenza non è un ostacolo.

## 2. DeepSeek V4.1 Flash — non un base, ma il miglior TEACHER/GIUDICE disponibile

**Verificato il 2026-09-12 sull'API OpenRouter** (19 slug DeepSeek): `deepseek/deepseek-v4.1-flash` esiste, **ctx 1.048.576**, **$0,15/M input · $0,60/M output**, `tools=true`. Per confronto nella stessa famiglia: `deepseek-v4-flash-0731` **$0,04/$0,08**, `deepseek-v4-pro` $1,60/$3,20, e il nostro `qwen3.6-27b` $0,30/**$2,00**.

**Perché NON è un candidato base per il Tier-1**: la famiglia V4 è **MoE gigante** — fuori dalla finestra 27-36B dense che il dossier fissa, e soprattutto **non abbiamo i pesi**: senza pesi non c'è full-FT, non c'è LoRA, non c'è hot-swap. Il dossier lo classifica già così (*«MoE giganti / fuori-scope»*). Questo **non cambia** con la 4.1.

**Dove invece è il candidato migliore che abbiamo:**
- **TEACHER di distillazione** — il ruolo è già deciso ([[../../memory|project_teacher_deepseek_v4]]: *teacher = DeepSeek V4 lite/pro*), e la 4.1 Flash è **la versione più recente e la più economica** con tool e 1M di contesto: generare tracce agentiche costa **~4× meno** del nostro stesso candidato base. ⚠️ **Gate #29 prima di usarla**: i ToS di DeepSeek vanno letti **sull'USO degli output nel training**, non sull'accesso — è la regola [[../../memory|feedback_training_data_compliance]], e **non l'ho verificata** (residuo dichiarato).
- **GIUDICE** dove non c'è oracolo deterministico: [[../decisions/2026-06-28-decisions-d1-d5]] §D5 aveva già scelto *DeepSeek-V4-Flash*; la 4.1 è il successore naturale. ⚠️ Coerente con la proposta [[../decisions/2026-09-12-prm-appreso-escluso-proposta]] **solo come etichettatore offline**, mai come reward in loop.
- ⭐ **SOFFITTO DI QUALITÀ sulle nostre scene, a costo quasi nullo**: è la cosa che possiamo fare **subito**. La open question #19 chiedeva da giugno un *ceiling* di riferimento (allora: Sonnet). Con $0,60/M in output, girare le 4 scene a n=2 costa **~0,06 $** (il 3.6-27b ne è costato 0,20). Ci dice **quanto è alto il tetto** delle nostre scene: se un frontier le passa tutte, misurano una skill reale e i 27B sono indietro; se **cade anche lui** dove cadono i 27B (documento non aggiornato, innesco non lasciato), allora **le scene sono dure per tutti** — ed è un'informazione che cambia il modo in cui leggiamo F45/F46.

## Links
[[../training-taxonomy/class-module-boundary-flow-convergence]] (la versione S della tesi di Graft) · [[../harness-experiment-log]] (F43 i tool di memoria ignorati · F47 l'effetto dell'harness inconcludente) · [[../entities/base-model-candidates-2026-07]] (perché i MoE giganti sono fuori rosa) · [[../decisions/2026-06-28-decisions-d1-d5]] (D5: il giudice) · [[../decisions/2026-09-12-prm-appreso-escluso-proposta]] · [[training-vs-harness-classification]] (#11) · [[../../memory|feedback_training_data_compliance]] (ToS sugli output usati nel training)

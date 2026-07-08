---
name: harness-wins-validation-protocol
description: Protocollo execute-ready per LA validazione critica dell'harness — trovare/dimostrare il regime long-horizon in cui l'harness (context-assembly + lane + task-digest + keepTurns) BATTE il vanilla invece di essere overhead. Include la scelta-di-design (su cosa deve vincere) da confermare con l'utente (regola #18) + i comandi reali.
type: concept
tags: [harness, evaluation, long-horizon, validation, benchmark, memory, gate]
last_updated: 2026-07-08
status: Regime-A CONFERMATO (E12 2026-07-08 — overflow qwen-ctx16k×he12: ours-digest recall 100% vs vanilla 25%)
---

# Protocollo — "dove l'harness VINCE" (la validazione che dà senso all'harness)

> **Perché questa pagina** (utente msg 1386: *"concentrati sull'harness, iniziano a portare i risultati"*): l'harness è **funzionalmente completo** ma **non abbiamo ancora un setup dove dimostrabilmente VINCE** — su sessioni < finestra-nativa è stato **overhead** (Modo-2, [[harness-benchmark-versions]] §Modo-2: keep6 recall 100% = come vanilla, ma 8-11× token). Questo è il **gate** che dà senso all'intero investimento harness. Qui: perché Modo-2 non ha mostrato una vittoria, i **3 regimi candidati** di vittoria, il **protocollo runnable** (infra già esistente `eval/run-session-ab.mjs`), e la **scelta-di-design** da confermare. Stato: **proposta** (regola #18: propongo → utente approva prima di consumare quota).

## Perché Modo-2 NON ha mostrato una vittoria (diagnosi)

Modo-2 testava **recall di nomi-funzione** su una sessione **corta** (6 task HumanEval). In quel regime:
- **vanilla** tiene TUTTA la storia nativa → recall 100% "gratis" (la finestra nativa del modello non è mai stata superata).
- **ours@6** tiene solo 6 turni nativi + le lane → recall 100% **ma pagando** context-assembly ogni turno = 8-11× token.

→ Con la finestra-nativa **mai saturata**, la memoria-harness è **ridondante**: replica ciò che vanilla ha già gratis. **L'harness può vincere SOLO in un regime dove la memoria nativa di vanilla FALLISCE o COSTA più delle lane compatte.** Modo-2 non era quel regime.

## LIVE FINDING (E12, 2026-07-08) — conferma empirica: serve l'OVERFLOW

Matrice modello×feature in corso (`eval/run-matrix.mjs`). Dati long-horizon (humaneval-30) su **gemini-3.1-flash-lite** (context ~1M):

| arm | pass% | recall% | token |
|---|---|---|---|
| vanilla | 100 | **100** | 403K |
| ours base@keep6 | 100 | 77 | 662K |
| ours base@keep8 | 100 | 77 | 813K |

→ **Conferma la diagnosi**: 30 task = ~403K token < finestra 1M → vanilla **non va MAI in overflow** → ricorda tutto gratis (recall 100%); ours (finestra nativa ridotta + lane) fa **PEGGIO** (77%) e costa di più = **overhead**. Su un modello a contesto enorme l'harness-memoria è ridondante *a qualunque scala pratica di task*.

**Implicazione operativa**: la vittoria (Regime A) è dimostrabile SOLO dove la finestra va in **overflow reale**. Con Gemini serve una sessione da >1M token (impraticabile). Il banco giusto = **modelli locali con `num_ctx` limitato** (es. `qwen-ctx16k` = num_ctx 16384): a ~12 task la finestra **satura** → vanilla perde l'early-context → ours con **task-digest** (fatti early pinned) **vince sul recall**. [Nota infra: i locali via Ollama servono con num_ctx di default ~4096 → il braccio ours (system-prompt grande) veniva troncato; risolto con varianti Modelfile `PARAMETER num_ctx 16384`, `eval/_Modelfile-*-ctx`. num_ctx=8192 è insufficiente per il braccio ours multi-task → api-error dopo il task-0; num_ctx=16384 = valido.]

## ⭐ REGIME A DIMOSTRATO (E12, 2026-07-08) — l'harness VINCE in overflow

Test decisivo **`qwen-ctx16k` (num_ctx 16384) × he12** (12 task, stessa sessione, probe di recall valida su entrambi):

| arm | keepTurns | task-ok | **recall** | digestFacts | token |
|---|---|---|---|---|---|
| vanilla | (nativo pieno) | 12/12 | **25%** (3/12) | 0 | 516K |
| **ours digest** | **1** | 11/12 | **100%** (12/12) | **11** | 682K (1.3×) |

→ **+75pt di recall a 1.3× token.** Il punto forte: **keepTurns=1** = il modello vede nativamente **un solo turno** (~zero storia) → senza harness recall≈0; la sola lane **task-digest** (11 fatti file-write catturati deterministicamente da `digestFactFromCall`, pinnati a importance MAX in `<facts>`) gli dà **100% recall**. Vanilla, con la finestra nativa PIENA, resta al **25%** perché 12 task la fanno overfloware (~516K ≫ 16K) e l'early-context cade fuori. **La memoria deterministica dell'harness batte la finestra nativa quando la sessione va in overflow** — esattamente la promessa del progetto. **Meccanismo**: la cattura scatta solo su write-tool strutturati (path+content); il modello che scrive via `bash echo>` o inline bypasserebbe il digest (robustezza da estendere). **Caveat**: n=1/cella, 9B locale (banco); direzione netta, da riconfermare n≥3 + sul target ≥27B.

**Contrasto coi regimi NO-overflow** (stessa matrice E12, gemini-flash-lite 1M): he6 recall 100%=100% ma harness 2.6× token (overhead); he30 recall 77%<100% (harness PEGGIORA). → **Il valore dell'harness è REGIME-DIPENDENTE**: overhead/dannoso quando la finestra tiene la sessione, decisivo quando la finestra satura. **Config-produzione = ADATTIVA** (vedi sotto + [[harness-experiment-log]] §F32).

## Config di PRODUZIONE consolidata (E12, risposta a msg 1395/B)

La matrice modello×feature dà una regola **adattiva**, non un set fisso — perché il valore dell'harness dipende dal rapporto **contesto-modello ÷ lunghezza-sessione**:

| condizione | keepTurns | task-digest | context-views | razionale |
|---|---|---|---|---|
| **finestra tiene la sessione** (modello a contesto grande e/o sessione corta; es. flash-lite 1M su task normali) | **alto/illimitato** (= vanilla) | **off** | off | le lane sono ridondanti → puro overhead (E12: he6 2.6× tok, he30 recall −23pt). Non pagare ciò che il contesto nativo dà gratis. |
| **sessione va in overflow** (finestra piccola O sessione lunga/agentica che satura; es. target ≥27B su SWE-scale multi-file, long-horizon) | **basso** (1–6) | **on** | valutare | il digest deterministico **rescue** la memoria oltre la finestra (E12: recall 100% vs 25% a 1.3× token). Qui l'harness è **essenziale**. |

**Default operativo**: poiché il **target reale** (≥27-32B su sessioni agentiche lunghe con molti file-write — SWE-bench scale) **cadrà nel regime di overflow**, la config di produzione base è **task-digest ON + keepTurns basso**, con **auto-disattivazione** quando l'harness stima che la sessione stia comodamente dentro la finestra nativa (evita l'overhead sui task corti). Il `laneMemoryHintLevel: lean` resta preferito (E10: −16% token a parità). **Robustezza da estendere**: la cattura digest oggi vede solo write-tool strutturati (path+content) → aggiungere il riconoscimento delle scritture via bash/inline perché il rescue valga anche lì.

## I 3 regimi candidati di vittoria (la scelta-di-design)

Bisogna decidere **su COSA** l'harness deve vincere — sono ipotesi diverse, con esperimenti diversi:

### Regime A — Context-overflow → vanilla PERDE recall, ours RETAIN
Sessione abbastanza lunga da **superare la finestra di contesto REALE del modello** → vanilla deve troncare la storia → **recall/accuratezza sui task EARLY crollano**; ours mantiene i fatti-chiave in lane compatte (task-digest pinned, `<facts>`) → **recall regge**. **Metrica di vittoria**: `recall_early(ours) > recall_early(vanilla)` e/o `task_success_late(ours) > vanilla` quando il task tardivo **dipende** da un fatto early.
- ⚠ Costo: con un modello a contesto enorme (gemini-3.1-flash-lite ~1M) servono sessioni **enormi** per saturare → quota-heavy. **Più efficiente su un modello a contesto piccolo** (es. un 9B/Gemma con finestra ridotta, o forzando `HARNESS_MODEL_CTX` basso se supportato).

### Regime B — Iso-recall a COSTO MINORE (efficienza, non capacità)
Non "vanilla perde", ma **ours ottiene lo STESSO outcome a MENO token** perché le lane compatte (digest 1-riga/soluzione) sostituiscono la ri-lettura della storia grezza. **Metrica di vittoria**: `recall(ours) ≈ recall(vanilla)` **E** `token(ours) < token(vanilla)` su sessione lunga. Ribalta il verdetto Modo-2 (dove ours costava DI PIÙ) — richiede sessioni dove la storia grezza di vanilla supera in token la lane compatta di ours (cioè tante interazioni verbose).

### Regime C — Anti-deragliamento / task-success (non memoria)
L'harness vince perché **le difese** (pre-flight, secrets-guardrail, structured-context, anti-fixation) fanno **completare più task / evitare errori catastrofici** su sessioni lunghe e rumorose — indipendentemente dal recall. **Metrica**: `pass-rate(ours) > vanilla` su un task-set lungo con trappole (file critici, segreti, fissazioni). Allineato a H6 ([[harness-benchmark-versions]]) ma cercando il lato in cui lo scaffold AIUTA invece di diluire.

> **DECISIONE UTENTE (regola #18)**: quale regime perseguiamo per primo? **Reco = A** (è la tesi centrale "l'harness estende la memoria oltre la finestra nativa"; è ciò che il progetto promette). B è un fallback di efficienza; C è ortogonale (difese, non memoria).

## Protocollo runnable (infra ESISTENTE — nessun nuovo codice)

`eval/run-session-ab.mjs` già: lancia {vanilla, ours@k} sugli stessi N task, isola per-config (`HARNESS_STATE_DIR` + workdir — [[../harness/tools/drive-qwen]] validato 2026-07-08), grada le soluzioni (verifier HumanEval) e **auto-grada la probe** (recall nomi + ordine, LIS).

**Per il Regime A** servono 3 ingredienti, di cui 2 mancanti:
1. ✅ Runner + probe (esistono).
2. ⬜ **Task-set lungo** che saturi la finestra: `EVAL_TASKS_FILE=eval/data/humaneval-30.jsonl` (o SWE-scale). Generare con `eval/fetch-humaneval.mjs` (estendere a N≥30) — **artefatto dati, non-gated, generabile ORA**.
3. ⬜ **Modello a finestra saturabile** a costo sostenibile: o (a) sessione lunga su gemini (quota), o (b) modello locale a contesto piccolo — **ma il driver-locale è bloccato dal drift nome-modello** (models.json `qwen3.5:9b` vs installato `jaahas/qwen3.5-uncensored:9b`, vedi [[todo]]). Sbloccare = prerequisito del path locale/quota-free.

**Comando (Regime A, esempio)**:
```
EVAL_TASKS_FILE=eval/data/humaneval-30.jsonl EVAL_ARMS=vanilla,ours EVAL_KEEPS=8 \
  MODEL_ID=<modello-a-finestra-piccola> node eval/run-session-ab.mjs
```
**Win-condition**: la probe tardiva (fatto early richiesto tardi) ha `recall(ours@8) > recall(vanilla)` con vanilla in calo per troncamento. Se vanilla resta 100% → la finestra non è satura → aumentare N o ridurre il ctx.

## Prossimi passi (ordine)
1. **Utente**: conferma il **regime** (reco A) + sblocca il **drift nome-modello** (abilita il path locale quota-free o si usa quota gemini).
2. **Io (non-gated ORA)**: generare `humaneval-30.jsonl` (+ eventuale scenario con dipendenze early→late esplicite) + definire la probe di **dipendenza** (non solo recall di nomi, ma un task che FALLISCE senza il fatto early).
3. **Run** appena c'è compute → primo verdetto "harness vince/perde" su long-horizon.

## Link
[[harness-benchmark-versions]] · [[harness-experiment-log]] · [[architecture/lane-persistence-redesign]] · [[concepts/context-window-sizing]] · [[todo]] · [[../harness/eval/run-session-ab.mjs]]

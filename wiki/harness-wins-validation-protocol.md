---
name: harness-wins-validation-protocol
description: Protocollo execute-ready per LA validazione critica dell'harness — trovare/dimostrare il regime long-horizon in cui l'harness (context-assembly + lane + task-digest + keepTurns) BATTE il vanilla invece di essere overhead. Include la scelta-di-design (su cosa deve vincere) da confermare con l'utente (regola #18) + i comandi reali.
type: concept
tags: [harness, evaluation, long-horizon, validation, benchmark, memory, gate]
last_updated: 2026-07-08
status: proposta-da-approvare
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

**Implicazione operativa**: la vittoria (Regime A) è dimostrabile SOLO dove la finestra va in **overflow reale**. Con Gemini serve una sessione da >1M token (impraticabile). Il banco giusto = **modelli locali con `num_ctx` limitato** (es. `qwen-ctx16k` = num_ctx 16384): a 30 task la finestra **satura** → vanilla perde l'early-context → ours con **task-digest** (fatti early pinned) dovrebbe finalmente **vincere sul recall**. **Il test decisivo è `qwen-ctx16k` × humaneval-30** (in coda). [Nota infra: i locali via Ollama servono con num_ctx di default ~4096 → il braccio ours (system-prompt grande) veniva troncato; risolto con varianti Modelfile `PARAMETER num_ctx 16384`, `eval/_Modelfile-*-ctx`.]

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

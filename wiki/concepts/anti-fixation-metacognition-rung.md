---
name: anti-fixation-metacognition-rung
description: "Scaffold TRIGGERED su stagnazione per rompere la fissazione del modello sui task hard (HE/145: permuta il sintomo per 10 turni senza riquestionare l'assunzione). Rung escalante decompose→questiona-assunzione→diversifica, note-ledger durabile, outcome-anchored, auto-estinguente via training. Sintetizza le idee utente 1045/1056/1057."
type: concept
tags: [agentic-robustness, metacognition, stagnation, error-memo, reward-hacking, rl-training, escalation-rung, h6]
last_updated: 2026-07-05
sources:
  - "Diagnosi tracciata HE/145 (harness/eval/, 2026-07-05): fissazione sul tie-breaking, 10 turni"
  - "Utente TG msg 1045 (note dopo errori), 1056 (hypothesis-todo, lateral-thinking+revert), 1057 (decompose+notes+verification-loop hint), 2026-07-04"
---

# Anti-fixation metacognition rung — scaffold triggered su stagnazione

## Problema [EXTRACTED — diagnosi tracciata HE/145]

I modelli piccoli si **FISSANO** sui task hard: su HE/145 il modello ha permutato il **tie-breaking per ~10 turni** senza MAI riquestionare il `digit_sum` sbagliato (la causa vera). Ha il FEEDBACK (vede i fail ogni turno) ma manca la **METACOGNIZIONE**: (a) riconoscere la stagnazione, (b) fare step-back e questionare l'ASSUNZIONE, (c) decomporre + verificare per parti. Aggravante **H6**: iniettare un grande scaffolding-memoria (12.7K char, in gran parte vuoto/irrilevante su task self-contained) diluisce il budget di ragionamento del modello piccolo. Vedi [[concepts/adaptive-context-injection]].

## Design: rung metacognitivo TRIGGERED su stagnazione

Escalante · outcome-anchored · auto-estinguente. **Principio-chiave**: intervieni sul SEGNALE (stagnazione), NON su ogni task (anti-H6/optimization-first). Zero costo-contesto finché non scatta.

### 1. Detector di stagnazione (deterministico, wiring-level, cheap)
- Traccia per-task: **fail consecutivi della verifica/test SENZA miglioramento** (stessa assert che fallisce / pass-count che non sale / output che non converge). Soglia `X` config (~3).
- ⚠️ Trigger su **"task non progredisce"**, NON "stesso comando 2×": su HE/145 il modello variava il comando ogni volta → un trigger su comando-identico lo **mancherebbe**.
- Nessuna model-call né contesto iniettato finché non scatta.

### 2. Nudge ESCALANTE, iniettato SOLO su stagnazione (conciso 2-4 righe, effimero solo-quel-turno)
Ladder (stesso pattern-rung dell'eviction-checkpoint: nudge→inject→require):
- **Rung 1 (X fail) — externalize + DECOMPOSE** (utente 1057 + 1045): *"Hai fallito N volte. STOP alle varianti. Nelle note scrivi (a) cosa hai provato e perché è fallito, (b) DECOMPONI il problema in sotto-parti. Poi attacca UNA sotto-parte alla volta, verificando ciascuna."*
- **Rung 2 (più fail) — questiona l'ASSUNZIONE** (mirato alla fissazione HE/145): *"I tuoi tentativi variano la STESSA dimensione. Elenca le tue ASSUNZIONI su questo problema; quale potrebbe essere FALSA? (es. la tua helper/formula è corretta, non solo l'ordinamento?)"*
- **Rung 3 (stagnazione profonda) — diversifica/lateral + verification-loop hint** (utente 1056 + 1057): *"L'APPROCCIO non funziona. Proponi 1 approccio FONDAMENTALMENTE diverso che mette in dubbio l'assunzione centrale; provalo. Se non batte il tuo miglior tentativo in M turni, torna al migliore. Debug sistematico: isola il caso che fallisce, stampa i valori intermedi, testa la helper in isolamento."*

### 3. Notes-ledger durabile + potabile (utente 1057 + 1045)
La decomposizione + i tried-and-failed vanno nelle **note** (error-memo + subtask/hypothesis-ledger); il modello le **pota** quando una sotto-parte è risolta o non più utile. Estende [[concepts/harness-capabilities-as-files]] / error-memo-system.

### 4. Due layer (framing professionale, coerente con tutto il progetto)
- **Harness rung (ORA)**: funziona su QUALSIASI modello subito (scaffold), triggered + cheap → utile anche sullo stand-in 9B/gemini.
- **Training signal (il fix VERO)**: ogni stagnazione + nudge + esito → dato RL. Reward **OUTCOME-anchored** (ha rotto la stagnazione & risolto), NON cerimonia. Il modello impara a fare step-back DA SOLO → lo scaffold RECEDE (require→inject→nudge→off), misurato da "frazione di stagnazioni auto-corrette". Crutch **auto-estinguente**.

### 5. Guardie non-negoziabili
- **Anti-H6 / optimization-first**: nudge triggered-only + concisi + effimeri. Meglio ancora: **LEAN il contesto base** (togli lo scaffolding-memoria vuoto) E aggiungi il nudge solo quando serve → il net-context può SCENDERE. [[concepts/adaptive-context-injection]]
- **Anti-reward-hacking** ([[feedback_reward_hacking_principle]], regola #10): premia l'ESITO, MAI il rito (aver elencato ipotesi / chiamato note).
- **Validazione empirica**: A/B "harness+rung vs harness-plain" sui task-fissazione (HE/32, HE/132, HE/145) → pass-rate + token. NON spedire per fede.

## Valutazione delle idee utente (analizza / riorganizza / valida)

| Idea utente | Verdetto | Come |
|---|---|---|
| "note dopo ≥2 fail" (1056) | ✅ ADOTTATA | Rung-1, ma trigger su *task-non-progredisce* non *comando-identico-2×* (HE/145 variava il comando). = error-memo. |
| "hypothesis-todo-list ALWAYS-ON" (1056, *"troppo estrema?"*) | ❌ come always-on → ✅ rimodellata | Always-on viola H6 (ceremony/context-bloat), è gameable, e non garantisce l'ipotesi GIUSTA (HE/145 non avrebbe elencato "digit_sum sbagliato"). **La tua intuizione "troppo estrema" è CORRETTA.** → diventa Rung-1/2 TRIGGERED (decompose + assumption-audit). |
| "lateral / considera-alternative + revert-se-non-aiuta" (1056) | ✅ Rung-3 | Nudge = facile; auto-revert = medio (traccia best-so-far + confronta pass-count). v1: nudge diversificazione, revert gestito dal modello/confronto. |
| "decomponi + salva-in-note + attacca-pezzo-per-pezzo" (1057) | ✅ CUORE del Rung-1 | — |
| "hint verification-loop / debugging dopo X fail" (1057) | ✅ Rung-3 | debug sistematico (isola, stampa intermedi, testa helper). |

## Reorganizzazione di TUTTI i thread (una figura sola)

1. **LEAN il contesto** (togli scaffolding-memoria vuoto sui self-contained) — fix H6 → [[concepts/adaptive-context-injection]]
2. **PULL non push** (tool on-demand `Read temp file`) — abbassa il floor → [[concepts/harness-capabilities-as-files]]
3. **RUNG metacognitivo triggered** (stagnazione → decompose/questiona/diversifica + note) — *questa pagina*
4. **TRAIN-IT-IN** (regime-aware keepTurns + metacognizione via RL, outcome-anchored) — il fix vero → [[concepts/adaptive-context-injection]] §asse-3

> **Principio unificante**: contesto e comportamento **ADATTIVI e TRIGGERED da SEGNALI** (stagnazione · rilevanza-memoria · regime), MAI always-on; l'harness fa da scaffold ORA, il training lo internalizza, **tutto outcome-anchored**.

## Stato / validazione [EXTRACTED]
- **Diagnosi**: VALIDATA (trace HE/145).
- **Fattibilità**: ALTA — hook `context` esistente (inject on-demand), error-memo già a concept, pattern-escalation già usato (eviction-checkpoint).
- **EFFICACIA**: ⚠️ DA VALIDARE con l'A/B — NON ancora provato che il rung aiuti davvero. Prima si prototipa + A/B sui task-fissazione, poi si decide.

## Situational table + abilità-da-addestrare IMPRESCINDIBILE (utente msg 1072)

**La capacità di mantenere/gestire il contesto in modo affidabile è un'abilità da ADDESTRARE nel nostro modello in modo IMPRESCINDIBILE** (utente 1072) — non un nice-to-have. Il rung + l'awareness sono lo SCAFFOLD che la insegna finché il modello non la interiorizza (poi recede via estensione `slm`, [[decisions/2026-07-05-slm-scaffolding-extension]]).

**Situational table** (utente 1072: "spiegare al modello ESATTAMENTE come funziona, quando conviene, quando no, quando evitare; fargli riconoscere segnali che qualcosa non va → riduci i turni ecc."). È la forma CONDENSATA e teachable della metacognizione: mappa **segnale-auto-osservato → significato → azione**. Bozza [AMBIGUOUS — ogni riga va OUTCOME-validata, non hard-coded a intuizione]:

| Segnale auto-osservato | Significato probabile | Azione |
|---|---|---|
| Stesso test fallisce dopo ~3 tentativi variando solo piccoli parametri | fissazione sul sotto-problema sbagliato | step-back → questiona l'assunzione centrale, decomponi |
| Turni che crescono senza progresso (pass-count fermo) | thrashing | riduci scope, isola il caso che fallisce, debug sistematico |
| Contesto grande ma task self-contained | rumore-scaffolding (H6) | fidati del tuo ragionamento, non over-leggere le lane |
| Task genuinamente multi-step/stateful e perdo il filo | serve working memory | persisti stato nelle note / (se addestrato) alza keepTurns |
| Sto per dire "primo messaggio"/"non ho memoria" | hai le lane | controlla `<messages_with_user>`/`<last_tool_calls>` prima |

**Valutazione (regola #2 + anti-hack)**: ✅ è il posto giusto per "spiegare al modello quando conviene fare cosa" (risolve la Cautela-2 del keepTurns-control: distinguere "stateful→più memoria" da "fissazione→step-back"). ⚠️ **Caveat**: (a) va nell'estensione `slm` + on-demand/toggle, NON in core sempre-on (altrimenti ri-gonfia il contesto = H6); (b) rischio pattern-matching RITUALE sui segnali di superficie → il reward premia l'ESITO del cambio-comportamento, non l'aver "consultato la tabella"; (c) **ogni riga è un'IPOTESI da validare empiricamente** (l'azione Y su segnale X migliora davvero l'outcome?) — non hard-coded a naso. → è insieme awareness-`slm` E curriculum di training.

## Links
[[concepts/adaptive-context-injection]] · [[decisions/2026-07-05-slm-scaffolding-extension]] · [[architecture/ab-eval-harness]] · [[architecture/context-pressure-mechanism]] · [[concepts/harness-capabilities-as-files]] · [[feedback_reward_hacking_principle]] · [[feedback_training_vs_harness_classification]] · [[feedback_optimization_first]]

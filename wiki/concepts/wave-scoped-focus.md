---
name: wave-scoped-focus
description: "Proposta utente (msg 1129): forzare la task-list in WAVE piccole (3-5 task) e all'attivazione di una wave entrare in focus (auto o nudge). Analisi punto-per-punto: sposta il focus da PRESSIONE-driven a STRUTTURA-driven. Sensato per un SLM MA con 3 condizioni (proporzionalità, revisabilità, co-design col rung anti-fissazione) — altrimenti peggiora la fissazione."
type: concept
tags: [task-list, focus, wave, context-management, slm, multi-agent, anti-fixation, h6, proposal]
last_updated: 2026-07-05
status: proposal-under-evaluation
sources:
  - "Utente TG msg 1129 (2026-07-05)"
---

# Wave-scoped focus — focus guidato dalla STRUTTURA del lavoro (non dalla pressione)

> **Proposta (utente msg 1129):** riprogettare la task-list per **forzare la suddivisione in Wave piccole (max 3-5 task)**;
> quando il modello **attiva** una wave → entra in **focus/concentrazione** (automatico o consigliato, da valutare).
> Domande: ha senso? come cambia il sistema multi-agente? migliora/peggiora, ne vale la pena?

## 0. L'intuizione centrale (cosa cambia davvero)

Oggi il focus è **PRESSIONE-driven**: si entra a fuoco quando il contesto è già sotto pressione (soglia matrioska,
[[architecture/context-pressure-mechanism]]) → **reattivo**, e *a quel punto il contesto è già diluito* (il ragionamento
del modello piccolo è già degradato — è H6, [[harness-experiment-log]] F7). La proposta lo rende **STRUTTURA-driven**: si
entra a fuoco quando si **inizia un chunk di lavoro bounded** (la wave) → **proattivo**, *prima* che la pressione salga.

Questo è il vero valore dell'idea: **non è "un altro trigger di focus", è spostare il focus da sintomo (pressione) a
causa (struttura del lavoro)**. Per un SLM a contesto-effettivo piccolo, iniziare ogni wave in un contesto LEAN e
focalizzato è allineato con tutto il progetto (disciplina di contesto, H6, [[concepts/adaptive-context-injection]]).

## 1. Perché MIGLIORA (dove ha senso)

1. **Working-set bounded = match col contesto effettivo dell'SLM.** 3-5 task = il modello non tiene mai in testa più di
   un piccolo insieme → meno diluizione, meno "perdo il filo". È la stessa logica di `nativeKeepTurns` ma sull'asse *task*.
2. **Focus proattivo batte focus reattivo (anti-H6).** Entri nel regime pulito PRIMA del degrado, non dopo. Coerente con
   "lean il contesto sui task self-contained" (F7): ogni wave parte lean.
3. **Decomposizione = identità del Tier-1.** Il base model è addestrato a *decomporre/operare* ([[project_base_model_intelligence]]).
   Forzare wave è lo **scaffold** di quella skill (poi interiorizzata dal training → recede). Non un vincolo estraneo: è la cosa giusta.
4. **Confini semantici per memoria e reward.** Il fine-wave è un boundary NATURALE per (a) persistere il digest nelle note
   (meglio del boundary turn-count dell'[[concepts/eviction-checkpoint|eviction-checkpoint]]) e (b) dare un
   **reward a grana-wave** (la wave ha raggiunto il suo sotto-obiettivo?) → segnale RL più fine e outcome-anchored.
5. **Regola teachable.** "Quando attivi una wave, focalizza" è semplice, spiegabile nella situational-table
   ([[concepts/anti-fixation-metacognition-rung]] §situational), a differenza dell'opaco "focalizza quando la matrioska sale".

## 2. Perché PEGGIORA / rischi reali (critica oggettiva)

1. **⚠️ TENSIONE COL RUNG ANTI-FISSAZIONE (il punto più affilato).** Abbiamo appena diagnosticato (#145) che l'SLM
   **FISSA**: tunnel-vision sul sotto-problema sbagliato. Entrare in focus all'attivazione della wave **restringe** il
   contesto → può **PEGGIORARE la fissazione**: il modello si chiude in una wave e perde la capacità di step-back ("questa
   *intera wave* è l'approccio sbagliato"). Il rung ([[concepts/anti-fixation-metacognition-rung]]) vuole ALLARGARE quando
   si stagna; il wave-focus RESTRINGE. **Sono in conflitto se non co-progettati, complementari se sì**: il focus scopa
   l'attenzione nel caso normale; il detector di stagnazione deve operare ATTRAVERSO il confine di wave e poter dire
   "esci dalla wave, ri-pianifica". Focus = lente, MAI gabbia.
2. **Cerimonia se non PROPORZIONALE (anti optimization-first, [[feedback_optimization_first]], regola #8).** Forzare wave
   su una lista di 2 task = overhead. Il cap 3-5 è arbitrario: alcuni chunk coerenti sono 1 task, altri 8. Hard-coddare
   3-5 rischia di **frammentare lavoro coerente** o **imbottire lavoro banale**. → deve scattare solo sopra una soglia
   (riusa `gathering.minTasksForForce`, [[architecture/context-pressure-mechanism]]).
3. **Decomposizione CONGELATA-e-sbagliata.** Il modello pianifica le wave *prima* di fare il lavoro, quando sa di meno —
   è lo stesso difetto della "hypothesis-todo always-on" che l'utente ha giustamente bocciato come "troppo estrema"
   ([[concepts/anti-fixation-metacognition-rung]] tabella-idee). Una wave-structure imposta all'inizio inchioda una
   decomposizione forse sbagliata. → le wave devono essere **REVISABili in corsa**, non frozen.
4. **Costo-rebase se le wave sono troppo piccole.** Entrare in focus **ri-basa** il contesto (temporal-anchoring rebase,
   [[feedback_temporal_anchoring]]). Wave piccole+frequenti = rebase frequente = costo di ricostruzione ripetuto → può
   thrashare. Il 3-5 deve bilanciare costo-rebase vs beneficio-diluizione.

## 3. Impatto sul sistema MULTI-AGENTE (domanda 2 dell'utente)

Nel three-tier ([[project_three_tier_idea]]), **chi possiede la wave?**
- **Wave = output di decomposizione dell'orchestratore (Tier-1).** Fit naturale con la sua identità.
- **Due regimi di delega**: (a) l'orchestratore fa ogni wave DA SÉ in focus (single-agent, focus sequenziale); (b)
  **dispatcha ogni wave a un sub-agente / LoRA-expert** (multi-agente vero). La proposta è agnostica ma abilita (b):
  **la wave diventa l'unità di hand-off**.
- **✅ Vantaggio multi-agente**: confini di wave = punti di hand-off PULITI → ogni sub-agente riceve un brief bounded e
  focalizzato (esattamente il contesto lean che un expert vuole). Reward a grana-wave = credito per-expert più pulito.
- **⚠️ Rischio multi-agente**: ogni confine di wave è un **punto di possibile AMNESIA** — il sub-agente non vede il quadro
  intero → *buchi di conoscenza/timeline* (proprio ciò che l'A/B-harness è progettato a scovare, [[architecture/ab-eval-harness]]).
  Mitigazione: **digest fine-wave persistito** nella memoria condivisa (note/vars) e passato alla wave/agente successivo.
  Il valore netto dipende da quanto è buono questo passaggio-di-stato (è il collo di bottiglia noto: context-assembly + memoria).

## 4. auto vs consigliato (nudge)?

Dato (i) l'SLM non si auto-organizza (rete di sicurezza `autofocus:auto` esiste apposta) MA (ii) il rischio-fissazione del
focus-automatico, la raccomandazione è **`nudge` (consigliato) di default, `auto` come safety-net configurabile** — stessa
filosofia dell'`autofocus` esistente. Auto-focus-on-wave-start rischia di **inchiodare un modello debole in una wave
sbagliata**; il nudge lo lascia entrare quando è d'accordo. (Config: estendere `autofocus` con un trigger `wave-activation`
oltre a `pressure`.)

## 5. Verdetto — ne vale la pena?

**Sì, come idea di fondo è SANA e probabilmente MIGLIORE del focus pressione-driven per un modello piccolo** — ma il valore
è **condizionato a 3 cose**, senza le quali peggiora:
1. **Proporzionalità**: wave forzate solo sopra soglia (riusa `minTasksForForce`); sotto → task-list piatta, zero cerimonia.
2. **Revisabilità**: wave ri-pianificabili in corsa, non congelate all'inizio.
3. **Co-design col rung**: il focus scopa l'attenzione, ma il detector di stagnazione opera ATTRAVERSO il confine di wave e
   può forzare l'uscita/ri-pianificazione. Focus = lente, non gabbia. (Risolve la tensione §2.1.)

**Non spedire per fede** (stessa disciplina del rung, regola #14): è un **candidato-meccanismo da PROTOTIPARE + A/B**. E la
domanda misurabile — "il focus a grana-wave migliora il completamento long-horizon e riduce i buchi-di-conoscenza vs
lista-piatta?" — è **esattamente il test long-horizon che non abbiamo ancora inchiodato** ([[harness-benchmark-versions]]
§Modo-2): quindi questa proposta è anche un buon *mechanism-under-test* per il regime dove l'harness deve finalmente pagare.

**Skill trainabile (regola #18)**: "decomporre in wave della dimensione giusta + sapere quando USCIRE dalla wave" è essa
stessa una skill (harness scaffolda ora, training interiorizza). Candidata classe-training se il prototipo regge.

## Links
[[concepts/anti-fixation-metacognition-rung]] · [[architecture/context-pressure-mechanism]] · [[concepts/adaptive-context-injection]] · [[project_three_tier_idea]] · [[project_base_model_intelligence]] · [[architecture/ab-eval-harness]] · [[feedback_temporal_anchoring]] · [[feedback_optimization_first]] · [[harness-benchmark-versions]]

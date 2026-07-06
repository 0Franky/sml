---
name: class-subgoal-hijacks-task
description: Classe di training (figlia di consequence-intention-conflict, sotto metacognitive-self-audit) — riconoscere quando un SOTTO-OBIETTIVO / azione strumentale (salvare, loggare, verificare, preparare, ottimizzare un proxy) ha DIROTTATO l'obiettivo VERO (rispondere, consegnare il risultato) e ri-centrarsi sul FINE. Origine: F24 (il modello, over-condizionato a salvare, alla probe "elenca le funzioni" risponde "ho salvato tutto, pronto per il summary" invece di elencarle → recall 0%).
type: training-class
tags: [reasoning, metacognition, means-ends, subgoal-hijack, self-audit, area-04, child-class, held-out]
last_updated: 2026-07-06
---

# Classe (figlia) — SUB-GOAL che DIROTTA il task (deflessione mezzi-fini)

> **Ruolo**: figlia di [[class-consequence-intention-conflict]] (coerenza mezzi-fini) sotto [[class-metacognitive-self-audit]] (radice: audita il proprio processo contro il ground-truth). *(Parente: consequence-intention = "la CONSEGUENCE tradisce l'intenzione / incentivo perverso"; qui = "il MEZZO si SOSTITUISCE al fine". Entrambe facet di means-ends coherence — candidato sub-parent comune se il pattern cresce, regola #20.)*
> **Origine**: **F24** ([[../harness-experiment-log]]) — over-condizionato dall'hint forte a SALVARE, alla probe *"elenca in ordine le funzioni implementate"* il modello risponde *"I have ensured all progress is captured in `session_progress` ... I am ready for the final summary request"* → ha perseguito il **MEZZO** (salvare) e **droppato il FINE** (rispondere) → recall **0%** con `apiError=false` (non era un'incapacità: era una deflessione).

## La skill-target (segnale, preciso e falsificabile)

Il modello **riconosce quando un'azione strumentale / sotto-obiettivo** (salvare, loggare, verificare, preparare, indicizzare, ottimizzare un proxy) **ha preso il posto dell'obiettivo VERO** e **ri-centra sul fine**: alla richiesta *X*, produce *X* — NON sostituisce *"ho preparato/salvato/organizzato per fare X"* al **fare X**.

**Falsificabile**: la risposta soddisfa la **richiesta effettiva** (l'end) o no. Un report-del-mezzo al posto dell'end = FAIL, anche se il mezzo era corretto.

**Classificazione training-vs-harness** ([[../concepts/training-vs-harness-classification]], CLAUDE.md #11): **S** puro (giudizio metacognitivo: "sto rispondendo al fine o al mezzo?"; stato-senza-training **DEGRADATO** — F24 lo mostra su un modello capace). Doppio scopo (regola #18): il finding-harness (F24, che ha originato la cattura deterministica) ↔ questa classe-training si rinforzano.

## Esempi POSITIVI (cross-dominio — regola #19; dal banale al sistemico)

- **[A · tech/agentico, il caso generalizzato held-out]** richiesta: "elenca cosa hai fatto". Gold: elenca gli item. Anti-gold: "ho salvato tutto nel log, chiedi pure il summary" (F24).
- **[B · vita quotidiana]** "a che ora è la riunione?" → gold: "alle 15:00". Hijack: "l'ho messa in calendario" (il MEZZO logging ha soppiantato il FINE dire-l'ora).
- **[C · business]** "quanto è il fatturato Q3?" → gold: il numero. Hijack: "ho costruito una dashboard per tracciarlo".
- **[D · project mgmt]** "la feature è pronta?" → gold: sì/no + stato. Hijack: "ho creato i ticket".
- **[E · cucina]** "è pronta la cena?" → gold: sì/tra 5 min. Hijack: "ho preparato tutti gli ingredienti".
- **[F · studio]** "qual è la risposta alla domanda 5?" → gold: la risposta. Hijack: "ho evidenziato il capitolo giusto".

## Esempi NEGATIVI (regola #21 — il CONFINE: quando riportare-il-mezzo È corretto / NON è hijack)

I negativi rendono il segnale discriminativo (anti over-correzione "rispondi sempre subito saltando i passi necessari"):

- **[N1 · il mezzo È ciò che si chiede]** domanda: "l'hai salvato?" → "sì, salvato in X" è CORRETTO (l'end È il mezzo). Reward: riportare il mezzo quando è l'oggetto della richiesta.
- **[N2 · passo necessario dichiarato onestamente]** l'end richiede davvero uno step prima ("devo prima eseguire i test, un attimo") → riportare il progresso onesto NON è hijack, è calibrazione. Il FAIL è solo se il progress-report SOSTITUISCE la risposta dovuta.
- **[N3 · over-correzione]** saltare uno step strumentale genuinamente necessario pur di rispondere in fretta (dà la risposta sbagliata perché non ha verificato) = il fallimento SPECULARE → anch'esso penalizzato. Equilibrio.

## Reward (ANCORATO all'OUTCOME + SIMMETRICO)

- **Positivo** sse la risposta soddisfa la **richiesta effettiva (il FINE)**. Un report-del-mezzo che non risponde = 0, anche se il mezzo era eseguito bene.
- **Simmetrico**: premia riportare-il-mezzo **quando il mezzo È l'oggetto** (N1) e fare-lo-step-necessario **quando serve** (N3). Né "riporta-sempre-il-mezzo" né "salta-sempre-gli-step".
- **Hack-check**: "ho fatto la cosa strumentale" (participation) NON è reward; conta solo l'end soddisfatto. ([[../feedback_reward_hacking_principle]])

## Label-generation (mutation/oracle)

Coppie (richiesta-di-END, risposta) dove l'oracolo verifica se la risposta contiene l'**END** richiesto (es. i nomi da elencare, il numero, il sì/no) e NON un mero report-del-mezzo. **Fixture self-contained** (regola #22): il contenuto dell'end è dato nel setup → verità-per-costruzione. **Mutazioni**: generare la variante-hijack (sostituisci l'end con "ho preparato/salvato per l'end") come anti-gold; N1 (rendi il mezzo l'oggetto della domanda); N2/N3 (step necessario). Riusa [[../../harness/verifiers/deceptive-task-gen]].

## Decontaminazione (regola #18)

L'**istanza F24** (elenca-funzioni → deflessione-salvataggio) è **held-out di validazione**, NON nel training. Il training usa i transfer §positivi/§negativi cross-dominio. Se il modello impara la coerenza mezzi-fini, a valle risolve F24 per **transfer**.

## Links
[[class-consequence-intention-conflict]] (padre) · [[class-metacognitive-self-audit]] (radice) · [[class-prospective-memory]] · [[../harness-experiment-log]] (F24) · [[../architecture/lane-persistence-redesign]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[area-04-context-metacognition]]

---
name: class-async-dispatch-and-prioritization
description: Classe di training (figlia di action-execution-optimization) — durante l'interazione, riconoscere quando una parte del lavoro è LUNGA e INDIPENDENTE → lanciarla in ASINCRONO/background, rispondere SUBITO sulle parti immediate, riconciliare il risultato async al completamento, e PRIORITIZZARE correttamente (specie sotto deadline / utente-che-stacca). NON bloccare l'intero flusso. Capire cosa/quando conviene l'async e cosa NO.
type: training-class
tags: [planning, agentic, async, non-blocking, prioritization, latency, area-01, area-08, area-15, held-out]
last_updated: 2026-07-08
---

# Classe di training — ASYNC DISPATCH & PRIORITIZATION (non bloccare il flusso)

> **Stato**: creata su direttiva utente (msg 1369, 2026-07-08: *"io chiedo spiegazioni su una cosa + ricerca. Deve capire che può lanciare la ricerca in BG e intanto rispondermi, poi appena la ricerca è conclusa mi risponde anche su quella. Ma almeno non blocca tutto il flusso specie se l'utente deve staccare. Quindi capire cosa e quando conviene mandare in asincrono e dare priorità alle cose giuste."*).
> **Padre**: [[class-action-execution-optimization]] (asse *modalità sync/async + ordine di consegna*, regola #20). **Sorelle**: le foglie parallelization/scheduling di [[area-01-organization-planning]] (planning statico del DAG). Attraversa Area-1 (planning) + Area-8 (tool BG-dispatch) + Area-15 (interazione).

## Il gap

Data una richiesta **multi-intento** (es. "spiegami X **e** cerca Y"), il modello la esegue **serialmente e in-foreground**: parte dalla ricerca lunga, l'utente resta **bloccato** ad aspettare anche la parte che era già pronta (la spiegazione), e se l'utente deve staccare perde tutto. Non è un buco di conoscenza: è **mancata pianificazione della modalità di esecuzione** — non riconosce che i due intenti sono *separabili per latenza e dipendenza* e che uno può procedere **in background** mentre l'altro viene consegnato subito.

## La skill (imparata una volta)

Prima di eseguire una richiesta multi-parte, fare un **triage di esecuzione** su ogni sotto-intento e poi schedulare:

1. **Classifica ogni sotto-task** su 4 assi:
   - **latenza**: immediata (rispondibile ora) vs lunga (ricerca, build, job, attesa esterna).
   - **dipendenza**: la risposta immediata **dipende** dal risultato lungo? (se sì, non è separabile).
   - **input-utente**: richiede una DECISIONE/approvazione dell'utente prima di procedere?
   - **reversibilità/rischio**: ha side-effect irreversibili? (allora non fire-and-forget).
2. **Dispatch asincrono** delle parti **lunghe + indipendenti + non-rischiose**: lanciale in background e **continua** (non aspettare).
3. **Rispondi SUBITO** sulle parti immediate — non trattenerle in ostaggio della parte lunga.
4. **Riconcilia**: al completamento dell'async, consegna il suo risultato e integralo con quanto già detto.
5. **Prioritizza** sotto vincolo: se l'utente **sta per staccare** o c'è una **deadline** → front-load (i) ciò che richiede l'utente (domande/approvazioni, altrimenti stalla tutto), (ii) ciò che l'utente può **consumare subito**; scarica il resto in background e riferisci al ritorno.

Regola pratica: *"c'è una parte pronta ORA e una parte che fa aspettare? Non incatenarle: consegna la prima, manda la seconda in background."* + *"se l'utente deve andare, cosa DEVE avere da me prima di andare?"*

## Gold example (HELD-OUT di validazione — istanza osservata, NON nel training)

**Questa sessione** (msg 1361-1366): l'utente chiede più cose (push, ricerca-provider, riepilogo-todo) e poi scrive *"Mi rispondi? vorrei andare.."* — segnale che stava **bloccato in attesa** mentre io processavo in serie. Comportamento gold: riconoscere subito che il **riepilogo-todo (C)** era già rispondibile e consegnarlo **immediatamente** (front-load, l'utente sta staccando), mentre la ricerca-provider e il push proseguivano; NON far aspettare l'utente sulla catena intera. Tenuto **held-out**: se il modello impara la skill deve gestire questo pattern via transfer, non per averlo memorizzato ([[../feedback_intelligence_gap_to_training_class]], decontaminazione).

## Transfer examples (domini DIVERSI — OBBLIGATORIO cross-campo, NON solo software)

> **Regola di generalizzazione** (utente msg 1186, CLAUDE.md #19, [[../feedback_transfer_always_cross_domain]]): il transfer NON deve concentrarsi in un'area (men che meno solo software) → altrimenti il modello impara "async = cosa dei programmi" e **localizza** la skill. La logica astratta — *"avvia il processo lungo-e-indipendente, non stare fermo ad aspettarlo, consegna subito ciò che è pronto"* — vale ovunque (è il principio di **pipelining / overlap** e di **latency hiding**).

Ogni task presenta ≥2 sotto-intenti con latenza/dipendenza diverse; l'oracolo misura se lo scheduling **sblocca la parte pronta senza aspettare la lunga** E consegna comunque la lunga a completamento E rispetta le dipendenze.

### A — Software / agentic (dove è nato)
1. **Spiegazione + ricerca** (il caso dell'utente): rispondi la spiegazione ORA, lancia la ricerca in BG, consegna la ricerca al termine.
2. **Build/CI lungo + code-review**: avvia la CI (async), intanto fai la review del diff; riconcilia quando la CI finisce — non fissare il terminale.
3. **Query DB pesante + preparazione report**: lancia la query lunga (async), intanto imposta la struttura del report con i dati già noti; inserisci i risultati al ritorno.
4. **Deploy che impiega minuti + scrittura changelog**: avvia il deploy (async, ma **monitorane** l'esito perché ha side-effect — non fire-and-forget cieco), scrivi il changelog nel frattempo.

### B — Vita quotidiana (scelte basilari)
5. **Cucina**: metti l'acqua a bollire (async) e **intanto** taglia le verdure — non restare a fissare la pentola. Al bollore, butti la pasta (riconciliazione).
6. **Lavanderia + spesa**: avvia la lavatrice (async, 1h) e vai a fare la spesa; torni a stenderla quando è pronta. Non aspettare seduto davanti all'oblò.
7. **Telefonata in attesa**: sei in attesa al call-center (async, vivavoce) → intanto sistemi la scrivania; rispondi quando l'operatore arriva.
8. **Forno + apparecchiare**: inforna l'arrosto (async, 40min) e nel frattempo apparecchia e prepara il contorno.

### C — Scelte complesse cross-dominio (sanità · edilizia · business · progetti)
9. **Medico**: ordina gli esami di laboratorio (async, risultati domani) e **prosegui la visita** con anamnesi ed esame obiettivo; rivedi i referti quando arrivano — non sospendere la visita in attesa del laboratorio.
10. **Cantiere / edilizia**: ordina **per primi** i materiali a lungo-lead (async, settimane di consegna) e intanto fai gli scavi e le opere che non li richiedono; assembli quando arrivano. Ordinarli tardi blocca l'intero cantiere.
11. **Business / procurement**: manda la richiesta-preventivo a un fornitore lento (async) all'inizio, prosegui il resto del progetto, integra l'offerta al ritorno.
12. **Project management (deadline/persona che stacca)**: se un membro del team deve uscire, **sblocca prima la sua approvazione sul critical-path** (altrimenti stalla tutti domani), poi lascia proseguire il lavoro parallelo in background.

> Dal banale (pentola) al sistemico (critical-path di un progetto) la logica astratta è identica: **avvia presto il lungo-indipendente, non bloccarti ad aspettarlo, consegna subito il pronto, prioritizza chi sblocca gli altri.**

## Esempi NEGATIVI (il CONFINE — quando NON mandare in async, regola #21)

> I negativi insegnano il confine e rendono il segnale discriminativo (CLAUDE.md #21, [[../feedback_negative_examples_and_dataset_completeness]]). Senza, "async-sempre" diventa un hack.

- **N1 — dipendenza reale**: *"cerca il prezzo di X e dimmelo"*. NON c'è una parte pronta da anticipare: la risposta **È** il risultato della ricerca. Backgroundare-e-rispondere-vuoto è sbagliato; qui si esegue e si aspetta (o si dice "sto cercando"). La skill è *separare*, non *rimandare tutto*.
- **N2 — task fast**: *"quanto fa 12×8 e spiegami la ricorsione"*. Entrambi immediati → l'async aggiunge solo overhead di coordinamento. Fai inline.
- **N3 — serve una decisione prima**: l'utente deve scegliere fra 2 opzioni **prima** che qualunque lavoro abbia senso → la priorità è **fargli la domanda subito** (specie se sta staccando), NON lanciare lavoro di background che potrebbe essere buttato.
- **N4 — side-effect irreversibile**: un'azione async con effetti distruttivi/costosi che l'utente potrebbe voler annullare → non fire-and-forget; conferma/monitora ([[class-consequence-intention-conflict]] + criticality [[area-02-criticality-safety]]).
- **N5 — over-parallelizzazione**: spezzare 5 micro-task indipendenti da 1s in 5 job di background → il costo di dispatch/riconciliazione supera il guadagno. Batchali inline (cross con la sorella *batching*).

## Reward (ANCORATO all'OUTCOME)

- **OUTCOME**: verificato da un oracolo sull'esito reale dello scheduling — (i) la **parte immediata è consegnata prima** del completamento della parte lunga (latency-to-first-useful-response ridotta); (ii) la parte lunga **è comunque consegnata** a completamento (nessun task perso); (iii) **nessuna dipendenza violata** (non risponde una parte che dipendeva dall'async prima che l'async finisse); (iv) sotto deadline/utente-che-stacca, ciò-che-sblocca-l'utente è **front-loaded**. Un piano che serializza tutto in-foreground **fallisce** l'oracolo (i); uno che backgrounda una dipendenza **fallisce** (iii).
- **MAI** premiare la *cerimonia* ("lo mando in background…", "intanto rispondo…" a parole senza che lo scheduling reale cambi l'esito): il credito esige lo scheduling che *dimostrabilmente* sblocca prima e non perde nulla ([[../feedback_reward_hacking_principle]], CLAUDE.md #10).

## Label-generation

- **Oracolo IMPLEMENTATO**: [[../../harness/verifiers/async-schedule-gen]] (`harness/verifiers/async-schedule-gen.mjs`, test 13/0). `optimalDecision(scenario)` = SSOT della politica (slow+indip+safe→async · fast+indip→inline-immediata · dipende-da-non-risolto→deferred · needsUserInput→ask-first · risky→sync-monitored); `scoreSchedule(scenario, candidate)` = oracolo ancorato-all'OUTCOME che boccia con codici {task-lost · user-blocked · dependency-violated · blocks-on-backgroundable · input-not-surfaced · risky-fire-forget}; `scenarioBank()` = canonico + N1-N5 come **distrattori** (dove l'async è SBAGLIATO); `badSchedule()` = schedule errati per i test di discriminazione. Sotto-task etichettati {latency · dependsOn · needsUserInput · risky} + `userLeaving` (deadline). Self-contained (rule #22: fatti in-fixture, si testa il ragionamento).
- **Estensione futura**: generare la superficie testuale delle richieste (mutation di frasi multi-intento con dipendenza NON-ovvia dalle parole) sopra gli scenari strutturati dell'oracolo; SFT su traiettorie che mostrano il triage a 4 assi + dispatch + risposta immediata + riconciliazione; RL sull'outcome dell'oracolo.
- **Difficoltà**: la dipendenza NON deve essere ovvia dalle parole — il modello deve derivare dal contenuto se la parte "immediata" dipende davvero dalla parte "lunga" (N1) o no (transfer 1).
- **Demo SFT**: traiettorie che mostrano il triage a 4 assi + il dispatch async + la risposta immediata + la riconciliazione; RL sull'outcome sopra le demo.

## Hack-check (OBBLIGATORIO)

- **Async-sempre** (backgroundare tutto per sembrare "reattivo") → neutralizzato dai negativi N1/N2/N5: l'oracolo penalizza il rispondere-vuoto su una dipendenza e l'overhead su task fast.
- **Cerimonia** ("intanto lancio in background" senza scheduling reale) → 0.
- **Task perso** (backgrounda e poi **non** riconcilia il risultato) → fallisce l'oracolo (ii) → penalità forte (è il modo-di-fallimento peggiore: peggio del serializzare).
- **Over-fitting all'istanza** (riconoscere solo "spiegazione+ricerca") → mitigato: il caso-utente è held-out; il training è su domini disgiunti A/B/C.

## Links
[[class-action-execution-optimization]] (padre) · [[area-01-organization-planning]] (parallelization statica — sorella) · [[area-08-tool-use-agentic]] (dispatch BG) · [[class-consequence-intention-conflict]] (N4 side-effect) · [[area-02-criticality-safety]] (async rischioso) · [[../feedback_optimization_first]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_negative_examples_and_dataset_completeness]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]]

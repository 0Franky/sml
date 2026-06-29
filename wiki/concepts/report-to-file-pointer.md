---
name: report-to-file-pointer
description: Regola di sistema — quando un livello di esecuzione (sub-agente, sotto-task, matrioska-pop) COMPLETA e restituisce il controllo verso l'alto, NON inietta un summary inline grande. Scrive un REPORT completo (anche lungo) su FILE e fa risalire al chiamante solo un SUMMARY breve + il PATH al report esteso. Mantiene la cornice padre snella (anti context-rot), il report durevole/auditable, e recuperabile on-demand (window-aware-fetching).
type: concept
tags: [harness, context, return-protocol, report, summary, pointer, matrioska, subagents, anti-context-rot, by-reference, train-serve]
sources:
  - user TG msg 453 (2026-06-29)
  - "[[decisions/2026-06-29-context-as-first-person-mind]] §principio-5 (matrioska)"
last_updated: 2026-06-29
---

# Report-to-file + summary-pointer (protocollo di ritorno)

> **Regola dei nostri sistemi** `[EXTRACTED — utente TG msg 453, 2026-06-29]`: *"nessun summary diretto […] preferisco report fatto bene anche lungo su file e poi viene passato un summary breve con path per il report esteso."*

## La regola

Quando un livello di esecuzione **completa il proprio scope e restituisce il controllo al chiamante** — un **sub-agente** che ritorna all'orchestratore, un **sotto-task** che chiude, una **matrioska** che fa *pop* alla cornice padre — il ritorno **NON** è un summary inline che si riversa nel context del padre. È invece:

1. **REPORT completo su FILE** — scritto bene, **anche lungo**: tutto il lavoro, le decisioni, gli artefatti, i dettagli. Durevole, auditable, indirizzabile per path.
2. **SUMMARY breve risalito al padre** — poche righe con l'esito load-bearing + **il PATH al report esteso**. È l'unica cosa che entra nella cornice padre.

Il padre, di default, lavora sul summary; **recupera il report pieno solo se e quando serve** (apre il file per path). È [[window-aware-fetching]] applicato al ritorno: marker/pointer in context, contenuto pieno on-demand.

## Perché (catena why → problema → soluzione) `[INFERRED]`

- **Why**: il chiamante ha bisogno dell'**esito** per decidere il passo successivo, non del *processo* completo del livello figlio.
- **Problema**: un summary inline grande che risale **gonfia la cornice padre** ad ogni pop/ritorno → context-rot, prefisso instabile, e — per un SLM **che addestriamo** — rumore che compete con lo stato durevole. E un summary *lossy* fatto al volo rischia di **droppare vincoli/decisioni** che servivano al padre.
- **Soluzione**: **separare i due bisogni**. Il report-su-file conserva *tutto* (niente perdita, niente lossy-by-necessity); il summary-pointer dà al padre *esattamente* l'esito + come recuperare il resto. Il padre resta snello e può sempre ricostruire il pieno per riferimento (non per copia). È lo stesso principio di [[variable-operations-by-reference]] (manipola per riferimento, non inlinando) e [[sliding-window-variable-tool]] (finestra + recupero-per-id), qui applicato al **protocollo di ritorno tra livelli**.

## Forma del ritorno `[EXTRACTED (struttura) + INFERRED (campi)]`

```
return = {
  summary: "<poche righe: esito + cosa è cambiato + eventuale follow-up>",
  report_path: "<path repo-relative, forward-slash, al report completo>"
}
```

- Il **report_path** è un riferimento stabile (file su disco / artefatto per-ID), non il testo.
- Convenzione path: **repo-relative + forward-slash**, OS-agnostic (CLAUDE.md Fase-5). Il report vive sotto un'area dedicata (es. `harness/.pi/state/reports/<scope-id>.md`) — `[AMBIGUOUS]` la dir esatta, da fissare nel build.
- Vale anche **cross-agent**: un sub-agente fa risalire `{summary, report_path}`; l'orchestratore legge il path solo se la decisione lo richiede.

## Due meccaniche del pop (utente TG msg 456/457, 2026-06-29) `[EXTRACTED]`

### (a) Re-align dopo il pop — il padre risincronizza il context allo stato attuale
*"Quando si fa pop poi l'agente deve riallineare il suo contesto allo stato attuale."* Il pop non è solo "integra il report del figlio": mentre il figlio (zoom-in) lavorava, **lo stato è evoluto** → la "foto mentale" del padre è **stantia**. Quindi, ricevuto `{summary, report_path}`, il padre **ri-allinea il proprio workspace allo stato ATTUALE** prima di proseguire: ri-legge lo stato durevole (aim/decisioni/vincoli + var `shared` + task), promuove l'esito del figlio in step-fatti/decisioni, toglie dal watch-list ciò che il figlio ha chiuso. È l'**auto-curazione** ([[../decisions/2026-06-29-context-as-first-person-mind]] §principio-2, [[../model-testbook|TB-03]]) applicata **al confine del pop**. Senza re-align il padre rischia di decidere su una visione superata (vincoli risolti dal figlio ancora "aperti", o viceversa).

### (b) Il report deriva dalle decisioni dell'agente — floor F per-idAgente
*"Avrebbe senso ottenere tutte le scelte prese da un determinato agente tramite idAgente?"* → **Sì.** Il substrato esiste già: il change-log dello store ([[agent-wrapper-vars-queue]]) registra `who`=idAgente su **ogni** mutazione. Promosse a prima classe le **decisioni** (`recordDecision`: scelta + razionale + agente), il report-su-file del figlio è **derivabile deterministicamente** da:
- `getDecisionsByAgent(idFiglio)` — le scelte prese dal figlio (con razionale),
- `getChangesByAgent(idFiglio)` — tutte le mutazioni che ha attribuito.

→ Questo è il **floor F** del protocollo: l'harness può assemblare un report/summary **mai vuoto** (decisioni + cambiamenti del figlio) senza modello; la **S** è la salienza/narrazione (cosa è load-bearing per il padre). Doppio uso oltre al pop: **audit cross-agent** "chi ha deciso cosa". *(Implementato in `harness/src/vars-queue.mjs`: tabella `decisions` + `recordDecision`/`getDecisionsByAgent`/`getChangesByAgent`, test unit block-8.)*

## Relazione con la matrioska-compact

È il **meccanismo concreto della nuance #4 "ritorno-risultati"** di [[decisions/2026-06-29-context-as-first-person-mind]] §principio-5: a sotto-task chiuso, il sub-context (zoom-in) deve **riconciliare** i risultati nella cornice esterna (zoom-out). Questa pagina dice *come*: **non** riversando lo zoom-in nella cornice, ma scrivendo il report-su-file e risalendo summary+pointer. Nota dell'utente: *"alcune cose potrebbero essere condivise"* tra figlia e madre `[EXTRACTED]` → lo stato durevole condiviso (aim/decisioni/vincoli + var `shared` di [[cross-session-state-sharing]]) **non** ha bisogno di essere "riportato": è già visibile a entrambe; il report-su-file copre ciò che è **specifico dello scope figlio** e non già condiviso.

## Classificazione F/S (CLAUDE.md #11) `[INFERRED]`

- **F (harness, deterministico)** — *PIENA senza training*: il **meccanismo** del ritorno (a fine-scope: scrivi report su file, restituisci `{summary, report_path}`; il padre può aprire il path) + il **re-align** del padre (ri-lettura stato durevole). L'harness emette un **summary-floor deterministico** derivato da `getDecisionsByAgent`/`getChangesByAgent` (decisioni + cambiamenti del figlio, §b) → mai un ritorno vuoto.
- **S (politica addestrata)** — *DEGRADATA-MA-UTILE col floor*: **cosa** mettere nel summary breve (salienza: i fatti load-bearing che servono al padre per decidere) + **quando** il padre apre il report pieno. Il buon summary è una skill (non droppare un vincolo critico; non inlinare ciò che è recuperabile).

## Verifica (outcome-anchored, anti reward-hacking) `[INFERRED]`

Su un pop/ritorno di scope completato:
- (a) esiste un **file-report** col contenuto pieno; (b) il messaggio risalito è **bounded** (corto) e contiene un **path valido** al report; (c) il padre **ricostruisce la decisione corretta** dal summary (+ fetch se serve).
- **Outcome** = il padre decide bene / nessuna perdita di vincoli; **MAI** premiare "ha prodotto un summary" o "ha scritto un file" come cerimonia. Held-out negativo: scope minuscolo il cui esito sta in una riga → **non** servono file+pointer (proporzionalità: per ritorni banali il summary inline corto basta).

## Collegamenti
- [[decisions/2026-06-29-context-as-first-person-mind]] — principio 5 (matrioska), nuance #4 ritorno-risultati: questa pagina ne è il meccanismo.
- [[window-aware-fetching]] — il padre riconosce il pointer e recupera on-demand (stesso pattern, lato consumatore).
- [[variable-operations-by-reference]] · [[sliding-window-variable-tool]] — by-reference vs inline; finestra + recupero-per-id.
- [[cross-session-state-sharing]] — lo stato `shared` (le "cose condivise" madre/figlia) non va riportato, è già visibile.
- [[agent-wrapper-vars-queue]] — il change-log (`who`=idAgente) + lane `decisions`: substrato del floor-F per-agente.
- [[task-decomposition-adhoc-context]] — decomposizione gerarchica del context (la matrioska).
- [[../model-testbook]] — TB-06 (verifica del protocollo di ritorno sul modello).

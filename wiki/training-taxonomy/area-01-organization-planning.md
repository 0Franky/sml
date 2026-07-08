---
name: area-01-organization-planning
description: Example-space completo dell'Area 1 (Organization & Long-Horizon Planning, Tier T1) — task decomposition, dependency mapping, parallelization, timeline blocking, multi-day continuity, goal tracking, plan-mode, multi-expert plan, quality-target calibration. Ogni foglia con 5 classi di esempi + hint fade-out + reward design + hack-check.
type: taxonomy-area
tags: [training, taxonomy, area-01, organization, planning, decomposition, dependencies, parallelization, timeline, continuity, plan-mode, multi-expert, quality-target, T1]
sources: [training-taxonomy/README.md §4 Area 1, training-taxonomy/_coverage-audit-2026-06-23.md, user notes 2026-06-23]
last_updated: 2026-06-25
status: generated
---

# Area 1 — Organization & Long-Horizon Planning

Skill di orchestrazione del Tier T1 (organization-first): scomporre un goal, mappare le dipendenze, parallelizzare, bloccare la timeline per concetto, mantenere stato cross-giorno, tracciare l'obiettivo, emettere/validare/rivedere piani, pianificare catene di expert, e calibrare lo sforzo al quality-tier giusto. Tutte le foglie seguono la forma canonica di [[README]] §3.

> **Nota trasversale reward-hacking** [EXTRACTED da README §1 hack-check]: in tutta l'area, le foglie `L` (giudizio su granularità/efficienza/impatto) sono le più hackerabili (il modello impara la *forma* del piano senza la sostanza). Difesa ricorrente: ancorare a un **outcome verificabile a valle** (il piano esegue? lo scheduling regge a una simulazione? la decomposizione copre tutti i test del goal?), tenere **scorer ≠ scored** (judge diverso dal generatore), e usare **hidden test** sul goal finale che il modello non vede mentre pianifica. Vedi [[../concepts/reward-hacking-mitigation]].

---

## Task decomposition

### Foglia — `scomposizione-completa (coverage del goal)` · Tag: Q (+L sul rationale)
- **Skill target (segnale)**: dato un goal, produrre un set di sotto-task che **copre l'intero goal** senza lasciare buchi (ogni requisito del goal è mappato ad almeno un task). La metrica oggettiva è la *coverage*: requisiti del goal coperti / totali.
- **Esempi**:
  - **(1) WITH-hint** — prompt con impalcatura: *"Goal: 'aggiungi login con email+password, reset password via email, e rate-limiting sui tentativi'. ⚠️ Prima di scomporre, ESTRAI la checklist dei requisiti atomici dal goal (login, persistenza utente, hashing, flusso reset, invio email, token reset, rate-limit, test), poi verifica che OGNI voce abbia un task."* → output: lista di task con mapping requisito→task.
    - *Hint da definire (fade-out)*: **forte/checklist** = i requisiti atomici pre-estratti elencati nel prompt + "ogni voce DEVE avere un task" · **medio** = *"elenca prima tutti i requisiti impliciti ed espliciti del goal, poi i task"* · **debole** = *"assicurati di non dimenticare nulla del goal"*.
  - **(2) WITHOUT-hint** — *"Scomponi: 'aggiungi login con email+password, reset password, e rate-limiting'."* senza checklist. Il modello deve **spontaneamente** estrarre i requisiti atomici (incluso quello implicito: hashing password, persistenza, invio email) e coprirli tutti.
  - **(3) WRONG — awareness** — gli si mostra una decomposizione che salta "rate-limiting" e "hashing" (li dà per scontati). Label: *"sbagliato: coverage incompleta — 2 requisiti del goal non hanno task (rate-limit, hashing); il rate-limit era esplicito, l'hashing implicito ma obbligatorio"*. Il modello deve **riconoscere** quali requisiti mancano.
  - **(4) WRONG — recovery** — come (3) + recupero: rileva i requisiti orfani → diagnostica (confronta checklist requisiti vs task) → aggiunge i task mancanti → memo *"per ogni goal: estrai requisiti impliciti (sicurezza, persistenza) prima di chiudere la decomposizione"* → [[../concepts/error-memo-system]].
  - **(5) OTHER** — composite/adversarial: goal **sovra-specificato con red-herring** (*"...e già che ci sei, valuta di riscrivere tutto il backend in Rust"* — fuori scope, va segnalato non incluso come task) · oppure goal **vago** (*"sistema l'autenticazione"*) dove la coverage non è calcolabile finché non si chiariscono i requisiti → la mossa corretta è **chiedere**, non inventare task.
- **Fase curriculum** (§4.bis): Fase 1 (teoria: cos'è coverage di un goal) → Fase 2 (esercizi con-hint→senza-hint).
- **Reward design**: **Q** — coverage = requisiti-coperti / requisiti-totali su un goal con checklist gold annotata; verifier deterministico sul mapping. +L (judge) sul rationale di estrazione dei requisiti impliciti.
- **Hack-check**: *come massimizza senza la skill?* Inflaziona il numero di task (spara 30 micro-task per "coprire tutto" statisticamente) o copia letteralmente le parole del goal come task senza estrarre l'implicito. **Difesa**: la checklist gold include i requisiti **impliciti** (hashing, persistenza) che non sono nel testo del goal → coprirli richiede comprensione, non keyword-matching; penalizzare task ridondanti/non mappabili a un requisito (precision oltre a recall); scorer = judge separato che valida il mapping. → [[../concepts/reward-hacking-mitigation]].

### Foglia — `granularità-giusta` · Tag: L
- **Skill target (segnale)**: scegliere il **livello di grana** dei task — né monolitico ("implementa l'app") né polverizzato ("crea la variabile x") — appropriato al contesto e all'eseguibilità.
- **Esempi**:
  - **(1) WITH-hint** — *"Scomponi 'aggiungi endpoint di checkout'. ⚠️ Regola di grana: ogni task deve essere (a) completabile in un'unità di lavoro coerente, (b) verificabile da solo, (c) né un singolo statement né un intero sottosistema. Esempi di grana giusta vs troppo fine vs troppo grossa forniti sotto."* + 3 esempi di calibrazione.
    - *Hint da definire (fade-out)*: **forte/checklist** = i 3 criteri (a/b/c) + esempi contrastivi di troppo-fine e troppo-grosso · **medio** = *"ogni task deve essere atomico ma verificabile da solo"* · **debole** = *"trova la grana giusta"*.
  - **(2) WITHOUT-hint** — *"Scomponi 'aggiungi endpoint di checkout'."* — il modello calibra la grana da sé.
  - **(3) WRONG — awareness** — due decomposizioni patologiche: una con 1 task gigante ("implementa il checkout"), una con 40 micro-task ("import la libreria X", "scrivi la riga del return"). Label: *"sbagliato: la prima non è verificabile/azionabile, la seconda ha overhead di coordinamento e perde la visione"*. Riconoscere **entrambi** gli anti-pattern.
  - **(4) WRONG — recovery** — partendo dalla versione polverizzata → **ri-aggrega** in task coerenti (merge dei micro-step nello stesso concept-block) spiegando il criterio.
  - **(5) OTHER** — edge case: task **legittimamente piccolo** (un goal banale a 1 step non va gonfiato in 5 finti task) → la grana giusta a volte è *"un solo task"*; riconoscere che la regola è contestuale, non "sempre 5-7 task".
- **Fase curriculum**: Fase 2 (esercizi con esempi contrastivi compresi).
- **Reward design**: **L** — judge/rubric su scala di calibrazione (troppo-fine / giusto / troppo-grosso) con preference pairs; il **proxy Q** ancorante = i task della decomposizione "giusta" sono ciascuno eseguibile-e-verificabile in harness senza sotto-dividersi ulteriormente né dover essere accorpati.
- **Hack-check**: *come massimizza senza la skill?* Converge su un numero fisso "che piace al judge" (es. sempre 5 task) indipendentemente dal goal. **Difesa**: il dataset varia goal triviali↔complessi così che il numero ottimale cambi; ancora a un proxy oggettivo (eseguibilità per-task in harness, vedi sopra); judge ≠ generatore e con esempi di entrambi gli estremi → [[../concepts/reward-hacking-mitigation]].

### Foglia — `no-overlap-tra-task` · Tag: Q
- **Skill target (segnale)**: i task scomposti devono essere **mutuamente disgiunti** — nessun pezzo di lavoro appartiene a due task (no doppio lavoro, no responsabilità ambigua).
- **Esempi**:
  - **(1) WITH-hint** — *"Scomponi 'migra il DB e aggiorna le query del repository'. ⚠️ Dopo la decomposizione, per ogni COPPIA di task verifica che non condividano lo stesso pezzo di lavoro; se due task toccano la stessa cosa, fondili o ridefinisci il confine."*
    - *Hint da definire (fade-out)*: **forte/checklist** = "controlla ogni coppia di task per sovrapposizione; confine esplicito per ciascuno" · **medio** = *"assicurati che i task non si sovrappongano"* · **debole** = *"task ben separati"*.
  - **(2) WITHOUT-hint** — *"Scomponi 'migra il DB e aggiorna le query del repository'."* — senza avviso; il modello deve evitare che "aggiorna query" e "migra schema" si pestino sullo stesso file/responsabilità.
  - **(3) WRONG — awareness** — decomposizione dove `task A: aggiorna il layer repository` e `task C: riscrivi le query SQL` si sovrappongono (entrambi modificano le stesse query). Label: *"sbagliato: A e C condividono il lavoro sulle query → doppio lavoro / conflitto di edit"*. Riconoscere la coppia in overlap.
  - **(4) WRONG — recovery** — rileva l'overlap → ridefinisce i confini (A = solo astrazione repository, C = solo SQL grezzo dentro A) o fonde → verifica che la partizione ora copra senza intersecare.
  - **(5) OTHER** — edge: overlap **legittimo e inevitabile** (un file di config toccato da due feature) → la mossa non è eliminare l'overlap ma **dichiarare la dipendenza/ordine** (rimanda a dependency-mapping); distinguere overlap-bug da shared-resource-da-coordinare.
- **Fase curriculum**: Fase 2.
- **Reward design**: **Q** — verifier sull'insieme dei task: calcola l'intersezione dei "work-item / file / responsabilità" dichiarati per task; overlap > 0 non giustificato = penalità. Binario caught/missed su dataset con overlap iniettati.
- **Hack-check**: *come massimizza senza la skill?* Rende i task così vaghi che le loro descrizioni non si sovrappongono *testualmente* pur sovrapponendosi nei fatti. **Difesa**: l'overlap si misura sui **target concreti** (file/funzioni/work-item) non sulle parole; hidden test sull'esecuzione che fa emergere il doppio-edit; il vago viene punito da `granularità-giusta` (cross-foglia) → [[../concepts/reward-hacking-mitigation]].

---

## Interconnection / dependency mapping

### Foglia — `dipendenze-corrette` · Tag: Q
- **Skill target (segnale)**: identificare correttamente **quali task dipendono da quali** (B richiede l'output di A) — né dipendenze mancanti né dipendenze spurie.
- **Esempi**:
  - **(1) WITH-hint** — *"Task: [migra schema, scrivi modello ORM, scrivi endpoint, scrivi test endpoint]. ⚠️ Per ogni task chiediti: di quale OUTPUT di un altro task ho bisogno per iniziare? Disegna gli archi di dipendenza."*
    - *Hint da definire (fade-out)*: **forte/checklist** = "per ogni task, lista esplicita dei prerequisiti (output-of) + giustificazione" · **medio** = *"mappa cosa serve prima di cosa"* · **debole** = *"considera le dipendenze"*.
  - **(2) WITHOUT-hint** — *"Dato questo set di task, dammi il grafo delle dipendenze."* — il modello inferisce gli archi (modello-ORM dipende da schema; endpoint da modello; test da endpoint).
  - **(3) WRONG — awareness** — un grafo che dichiara `test endpoint` indipendente da `endpoint` (arco mancante) **e** `migra schema` dipendente da `scrivi test` (arco spurio/invertito). Label: *"sbagliato: dipendenza mancante (test→endpoint) e dipendenza spuria/invertita (schema←test)"*. Riconoscere entrambi i tipi di errore.
  - **(4) WRONG — recovery** — corregge il grafo → aggiunge l'arco mancante, rimuove/inverte quello spurio → verifica che ogni arco corrisponda a un reale "ho bisogno dell'output di".
  - **(5) OTHER** — composite: dipendenza **soft/opzionale** (il task B è *migliore* se A è fatto ma non lo richiede strettamente) → distinguere hard-dependency da soft-preference; e dipendenza **ciclica** introdotta per errore (A↔B) come edge case da segnalare → rimanda a `ordine-topologico-valido`.
- **Fase curriculum**: Fase 1 (teoria DAG/dipendenze) → Fase 2.
- **Reward design**: **Q** — F1 sugli archi vs grafo gold (precision = no archi spuri, recall = no archi mancanti); verifier deterministico.
- **Hack-check**: *come massimizza senza la skill?* Dichiara "tutto dipende da tutto" (grafo completo) → recall perfetta a costo di precision; o copia un ordine sequenziale banale come catena di dipendenze. **Difesa**: F1 (non solo recall) penalizza il grafo iper-connesso; il gold include task **realmente paralleli** (nessun arco) che il modello deve lasciare scollegati; hidden: l'esecuzione in ordine sbagliato fallisce → outcome verificabile → [[../concepts/reward-hacking-mitigation]].

### Foglia — `ordine-topologico-valido` · Tag: Q
- **Skill target (segnale)**: produrre un **ordine di esecuzione** dei task che rispetta tutte le dipendenze (topological sort valido); rilevare cicli che lo rendono impossibile.
- **Esempi**:
  - **(1) WITH-hint** — *"Dato questo grafo di dipendenze, ⚠️ produci un ordine in cui ogni task appare DOPO tutti i task da cui dipende. Se trovi un ciclo, segnalalo."*
    - *Hint da definire (fade-out)*: **forte/checklist** = "verifica per ogni task che tutti i suoi prerequisiti lo precedano nell'ordine; controlla l'assenza di cicli" · **medio** = *"ordina rispettando le dipendenze"* · **debole** = *"in che ordine li faresti?"*.
  - **(2) WITHOUT-hint** — *"In che ordine eseguo questi task?"* dato il grafo, senza il reminder del vincolo topologico.
  - **(3) WRONG — awareness** — un ordine dove `test endpoint` precede `scrivi endpoint`. Label: *"sbagliato: viola la dipendenza test→endpoint; l'ordine non è topologicamente valido"*. Riconoscere la violazione e quale arco la causa.
  - **(4) WRONG — recovery** — riordina spostando i task che violano i vincoli → ri-verifica scorrendo gli archi → conferma validità.
  - **(5) OTHER** — adversarial: grafo **con ciclo** (A→B→C→A) dove nessun ordine valido esiste → la risposta corretta non è "inventare un ordine" ma **dichiarare il ciclo** e proporre come spezzarlo; e grafo con **più ordini validi** equivalenti (non c'è una sola risposta giusta).
- **Fase curriculum**: Fase 1 (algoritmo topo-sort) → Fase 2.
- **Reward design**: **Q** — verifier deterministico: scorre gli archi e controlla precede(prereq, task) per tutti; binario valido/non-valido. Per i cicli: rilevato/non-rilevato.
- **Hack-check**: *come massimizza senza la skill?* Per grafi piccoli memorizza l'ordine; o ignora i cicli e spara sempre un ordine. **Difesa**: grafi generati proceduralmente (no memorizzazione); inclusione esplicita di casi-ciclo dove "qualsiasi ordine" è penalizzato e solo "ciclo rilevato" premiato; verifier ≠ generatore → [[../concepts/reward-hacking-mitigation]].

### Foglia — `impatto-su-timeline-futura` · Tag: L
- **Skill target (segnale)**: valutare come una scelta/ritardo/decisione **oggi** propaga sulla timeline **dei task futuri** (un task in ritardo blocca la sua catena di dipendenti; una scelta architetturale vincola lavoro a valle).
- **Esempi**:
  - **(1) WITH-hint** — *"Il task 'scelta del DB' è in stallo. ⚠️ Traccia la catena di task a valle che dipendono da questa scelta e stima l'impatto sul resto del piano (cosa si blocca, cosa può procedere in parallelo nel frattempo)."*
    - *Hint da definire (fade-out)*: **forte/checklist** = "segui gli archi a valle; per ciascun dipendente di-secondo/terzo grado stima il blocco; identifica lavoro parallelizzabile non bloccato" · **medio** = *"cosa succede a valle se questo slitta?"* · **debole** = *"considera l'impatto futuro"*.
  - **(2) WITHOUT-hint** — *"La scelta del DB è in stallo, come ne risente il piano?"* — il modello deve proiettare l'impatto sulla catena.
  - **(3) WRONG — awareness** — un'analisi che dichiara "nessun impatto, slittiamo solo questo task" ignorando che 4 task downstream dipendono dalla scelta DB. Label: *"sbagliato: ignora la propagazione lungo la catena di dipendenze — sottostima l'impatto"*. Riconoscere la propagazione mancata.
  - **(4) WRONG — recovery** — riconosce l'errore → ritraccia la catena downstream → ricalcola l'impatto reale + propone mitigazione (anticipare lavoro non-bloccato).
  - **(5) OTHER** — composite multi-skill: l'impatto dipende anche dalla parallelizzabilità (cross con `efficienza-scheduling`) e dal fatto che la decisione sia cache-abile per un blocco (cross con `timeline-blocking`); edge: impatto **nullo reale** (task foglia senza dipendenti) → non drammatizzare.
- **Fase curriculum**: Fase 2 → Fase 3 (in harness, l'impatto si misura sul piano reale che evolve).
- **Reward design**: **L** — judge/rubric sulla qualità della proiezione d'impatto; **ancora Q**: se il grafo di dipendenze è noto, l'insieme dei task-bloccati a valle è *calcolabile deterministicamente* (reachability) → si confronta la proiezione del modello con il set raggiungibile reale, riportando la parte L al solo "giudizio di severità/mitigazione".
- **Hack-check**: *come massimizza senza la skill?* Esagera sempre l'impatto ("tutto si blocca") per sembrare prudente, o produce prosa allarmistica generica. **Difesa**: la parte calcolabile (set di task raggiungibili a valle) è verificata contro il grafo → no inflazione né sottostima; il judge valuta la **mitigazione proposta** (azionabile o vacua), scorer separato → [[../concepts/reward-hacking-mitigation]].

---

## Parallelization decisions

> **Padre (regola #20)**: queste foglie di parallelizzazione/scheduling STATICO (DAG noto a priori) sono figlie di [[class-action-execution-optimization]] (radice "ottimizzazione delle azioni", utente msg 1369) — l'asse *quali-task-insieme*. Complementari all'asse *sync-vs-async interattivo* di [[class-async-dispatch-and-prioritization]] (dispatch in background durante il dialogo per non bloccare l'utente).

### Foglia — `identificare-task-paralleli` · Tag: Q
- **Skill target (segnale)**: individuare quali task possono procedere **in parallelo** (nessuna dipendenza reciproca, diretta o transitiva).
- **Esempi**:
  - **(1) WITH-hint** — *"Dato il grafo di dipendenze, ⚠️ due task sono parallelizzabili sse nessuno è raggiungibile dall'altro. Elenca i gruppi di task eseguibili contemporaneamente (i 'livelli' del DAG)."*
    - *Hint da definire (fade-out)*: **forte/checklist** = definizione (no reachability reciproca) + "raggruppa per livello topologico" · **medio** = *"quali task non dipendono l'uno dall'altro?"* · **debole** = *"cosa puoi fare in parallelo?"*.
  - **(2) WITHOUT-hint** — *"Quali di questi task posso fare in parallelo?"* dato il grafo.
  - **(3) WRONG — awareness** — dichiara paralleli `scrivi modello ORM` e `scrivi endpoint` quando il secondo dipende (transitivamente) dal primo. Label: *"sbagliato: dipendenza transitiva ignorata — non sono paralleli"*. Riconoscere la dipendenza nascosta.
  - **(4) WRONG — recovery** — rileva l'errore → ricontrolla la reachability transitiva → corregge i gruppi paralleli.
  - **(5) OTHER** — edge: task **indipendenti nel grafo ma in conflitto di risorsa** (vedi foglia successiva) → "paralleli sul DAG" ≠ "eseguibili davvero in parallelo"; segnalare il caveat invece di dichiararli senz'altro paralleli.
- **Fase curriculum**: Fase 1 (reachability) → Fase 2.
- **Reward design**: **Q** — verifier: confronta i gruppi paralleli proposti con i livelli del DAG gold (reachability transitiva); precision+recall.
- **Hack-check**: *come massimizza senza la skill?* Dichiara tutto parallelo (max parallelismo apparente). **Difesa**: il gold ha dipendenze transitive che rendono *errato* dichiarare alcuni task paralleli → precision penalizza; hidden: eseguire i "paralleli" sbagliati produce race/fallimento → [[../concepts/reward-hacking-mitigation]].

### Foglia — `evitare-conflitti-di-risorsa` · Tag: Q
- **Skill target (segnale)**: anche tra task indipendenti nel DAG, riconoscere quando **condividono una risorsa** (stesso file, stessa tabella DB in scrittura, stessa porta, budget GPU) e quindi **non** vanno schedulati insieme.
- **Esempi**:
  - **(1) WITH-hint** — *"Questi 3 task sono indipendenti nel grafo. ⚠️ Prima di parallelizzarli, controlla le risorse condivise (stesso file in scrittura? stessa tabella? stessa porta? stesso budget?). Schedula in parallelo solo chi non condivide risorse in scrittura."*
    - *Hint da definire (fade-out)*: **forte/checklist** = lista di risorse da controllare (file, DB, porta, lock, budget) + regola "no write-write concorrente" · **medio** = *"attento alle risorse condivise prima di parallelizzare"* · **debole** = *"sono davvero parallelizzabili?"*.
  - **(2) WITHOUT-hint** — *"Schedula questi 3 task indipendenti."* — il modello deve scoprire da sé che due scrivono lo stesso file di config.
  - **(3) WRONG — awareness** — schedula in parallelo due task che fanno entrambi `write` sullo stesso `settings.py`. Label: *"sbagliato: conflitto write-write sulla stessa risorsa → corruzione/last-write-wins"*. Riconoscere il conflitto.
  - **(4) WRONG — recovery** — rileva il conflitto → serializza i due task in conflitto (o isola le risorse) mantenendo paralleli gli altri → verifica.
  - **(5) OTHER** — edge: read-read concorrente (lecito, NON un conflitto — non serializzare per paranoia) vs read-write (da coordinare) vs write-write (serializzare); distinguere i tre casi invece di trattare ogni condivisione come conflitto.
- **Fase curriculum**: Fase 2 → Fase 3 (in harness i conflitti reali emergono).
- **Reward design**: **Q** — verifier: il dataset annota le risorse per task; un piano che mette in parallelo due write sulla stessa risorsa = violazione (binaria). Premia il distinguere read-read (ok) da write-write (no).
- **Hack-check**: *come massimizza senza la skill?* Serializza tutto (zero conflitti per definizione, ma zero parallelismo) → "sicuro" ma inutile. **Difesa**: la reward bilancia *no-conflitti* **e** *parallelismo preservato dove lecito* (read-read non va serializzato); il caso read-read nel dataset penalizza l'over-serializzazione → [[../concepts/reward-hacking-mitigation]].

### Foglia — `efficienza-dello-scheduling` · Tag: L
- **Skill target (segnale)**: tra più scheduling **validi** (rispettano dipendenze e risorse), scegliere quello **efficiente** — minimizza il makespan, mette sul critical path il lavoro giusto, sfrutta il parallelismo disponibile.
- **Esempi**:
  - **(1) WITH-hint** — *"Hai 2 worker. ⚠️ Per uno scheduling efficiente: identifica il critical path, assegna prima i task lunghi sul percorso critico, riempi gli slot dei worker liberi con task paralleli non-bloccanti. Stima il makespan."*
    - *Hint da definire (fade-out)*: **forte/checklist** = "trova critical path → prioritizza i suoi task → backfill parallelo → stima makespan" · **medio** = *"minimizza il tempo totale sfruttando i 2 worker"* · **debole** = *"schedula in modo efficiente"*.
  - **(2) WITHOUT-hint** — *"Schedula questi task su 2 worker nel minor tempo."* — il modello applica il ragionamento da critical path da sé.
  - **(3) WRONG — awareness** — uno scheduling valido ma che lascia un worker idle mentre un task lungo sul critical path è in coda dietro a task brevi non-critici. Label: *"sbagliato (inefficiente): il critical-path task è ritardato da lavoro non-critico; makespan gonfiato"*. Riconoscere l'inefficienza (non l'invalidità).
  - **(4) WRONG — recovery** — riconosce lo spreco → riordina mettendo il critical path per primo → backfilling dei worker liberi → makespan ridotto, mostrato.
  - **(5) OTHER** — composite: scheduling con **durate incerte** (stima vs reale) → robustezza, non solo ottimo puntuale; edge: con 1 solo worker l'"efficienza di parallelizzazione" non si applica → riconoscere che il leva è solo l'ordine, non il parallelismo.
- **Fase curriculum**: Fase 2 → Fase 3.
- **Reward design**: **L** ancorata a **Q**: il **makespan è calcolabile** dato un piano + durate → lo scheduling del modello si confronta numericamente con l'ottimo/baseline (ratio makespan); la parte L (judge) valuta solo il rationale (critical-path awareness). Reward primario = ratio makespan vs baseline.
- **Hack-check**: *come massimizza senza la skill?* Ottimizza il makespan **stimato** scrivendo durate comode, o impara una euristica fissa che vince solo su istanze viste. **Difesa**: durate fornite dall'ambiente (non scelte dal modello); makespan **misurato** sull'esecuzione reale in harness (hidden), non sulla stima del modello; istanze proceduralmente variate → [[../concepts/reward-hacking-mitigation]].

---

## Timeline blocking (concept-blocks)

### Foglia — `aggregazione-per-concetto` · Tag: L
- **Skill target (segnale)**: raggruppare i task della timeline in **blocchi coerenti per concetto** (tutto il lavoro "auth" insieme, tutto il lavoro "billing" insieme) invece di interlacciare contesti scollegati — riduce il context-switch.
- **Esempi**:
  - **(1) WITH-hint** — *"Hai 12 task misti (auth, billing, UI). ⚠️ Raggruppali in blocchi per concetto/area così da minimizzare i cambi di contesto; ogni blocco dovrebbe condividere mental-model e file."*
    - *Hint da definire (fade-out)*: **forte/checklist** = "identifica i concetti → assegna ogni task a un concetto → ordina per blocco minimizzando switch" · **medio** = *"raggruppa il lavoro affine"* · **debole** = *"organizza in blocchi sensati"*.
  - **(2) WITHOUT-hint** — *"Organizza questi 12 task in una timeline sensata."* — il modello deve aggregare per concetto spontaneamente.
  - **(3) WRONG — awareness** — una timeline che alterna auth→billing→auth→UI→billing (ping-pong di contesto). Label: *"sbagliato: context-switch eccessivo, concetti frammentati invece che a blocchi"*. Riconoscere la frammentazione.
  - **(4) WRONG — recovery** — riaggrega i task sparsi nei rispettivi blocchi → mostra la timeline a blocchi → nota la riduzione di switch.
  - **(5) OTHER** — tensione con le **dipendenze**: a volte un task di "billing" DEVE stare in mezzo perché un task "auth" a valle lo richiede → l'aggregazione per concetto **cede** alla dipendenza hard; riconoscere il trade-off (non aggregare a costo di violare il DAG).
- **Fase curriculum**: Fase 2.
- **Reward design**: **L** — judge/preference su coesione dei blocchi; **proxy Q**: numero di "context-switch" (transizioni tra concetti adiacenti nella timeline) è contabile → minore (a parità di validità topologica) è meglio. Reward = funzione del #switch sotto vincolo di validità DAG.
- **Hack-check**: *come massimizza senza la skill?* Minimizza gli switch **violando le dipendenze** (raggruppa tutto ma il piano non esegue). **Difesa**: il #switch conta solo tra piani **topologicamente validi** (vincolo hard prima); un piano invalido ha reward 0 a prescindere dai blocchi → [[../concepts/reward-hacking-mitigation]].

### Foglia — `decisione-vale-per-blocco (decision cache)` · Tag: L
- **Skill target (segnale)**: quando una **decisione** è presa per un blocco-concetto (es. "usiamo Pydantic per la validazione"), **riusarla** per tutti i task dello stesso blocco invece di ri-decidere ogni volta (caching della decisione, coerenza).
- **Esempi**:
  - **(1) WITH-hint** — *"Nel blocco 'API' hai deciso: validazione con Pydantic, errori con un handler centrale. ⚠️ Applica QUESTE stesse decisioni a tutti i task del blocco senza ri-aprire la scelta; ri-decidi solo se un task ha un vincolo nuovo che la invalida."*
    - *Hint da definire (fade-out)*: **forte/checklist** = "elenca le decisioni del blocco → applicale di default → flag solo se un task le contraddice" · **medio** = *"mantieni coerenti le decisioni nel blocco"* · **debole** = *"non ri-decidere ogni volta"*.
  - **(2) WITHOUT-hint** — i task del blocco arrivano in sequenza; il modello deve **propagare** la decisione presa al primo senza re-litigarla.
  - **(3) WRONG — awareness** — il modello sceglie Pydantic per il task 1, poi `marshmallow` per il task 2 dello stesso blocco senza motivo. Label: *"sbagliato: decisione di blocco non riusata → incoerenza, lavoro sprecato a ri-decidere"*. Riconoscere l'incoerenza.
  - **(4) WRONG — recovery** — rileva la divergenza → riallinea il task 2 alla decisione cache (Pydantic) → memo della decisione di blocco.
  - **(5) OTHER** — edge legittimo: un task del blocco ha un **vincolo reale nuovo** (es. serve performance estrema) che **giustifica** deviare dalla decisione cache → riconoscere che la cache è un default, non un dogma; documentare la deviazione motivata (rimanda a ADR).
- **Fase curriculum**: Fase 2 → Fase 3.
- **Reward design**: **L** — judge sulla coerenza intra-blocco + correttezza delle deviazioni motivate; **proxy Q**: contare le decisioni ri-aperte senza nuovo vincolo (incoerenze) → penalità.
- **Hack-check**: *come massimizza senza la skill?* Non devia **mai** (coerenza perfetta) anche quando un task lo richiederebbe → rigidità premiata. **Difesa**: il dataset include task che **devono** deviare (vincolo nuovo) → il judge premia la deviazione motivata e penalizza sia l'incoerenza ingiustificata sia la rigidità cieca; scorer separato → [[../concepts/reward-hacking-mitigation]].

### Foglia — `no-buchi-cross-task` · Tag: L (+Q sulla continuità di copertura)
- **Skill target (segnale)**: nel passaggio da un task/blocco al successivo, **non lasciare buchi** — handoff, file aperti, stato condiviso, e prerequisiti del task successivo sono coperti (nessuna "terra di nessuno" tra due task).
- **Esempi**:
  - **(1) WITH-hint** — *"Passi dal blocco 'DB' al blocco 'API'. ⚠️ Verifica che tutto ciò che l'API si aspetta dal DB (migrazioni applicate, seed dati, connessione configurata) sia DENTRO il blocco DB o esplicitamente in un task-ponte; non lasciare assunzioni implicite."*
    - *Hint da definire (fade-out)*: **forte/checklist** = "lista i prerequisiti del blocco successivo → verifica che ciascuno sia prodotto da un task precedente o da un ponte" · **medio** = *"copri gli handoff tra blocchi"* · **debole** = *"non lasciare buchi tra i task"*.
  - **(2) WITHOUT-hint** — *"Componi la timeline DB→API."* — il modello deve garantire che gli handoff siano coperti.
  - **(3) WRONG — awareness** — timeline dove il blocco API assume "connessione DB configurata" ma nessun task la configura (sta nel vuoto tra i blocchi). Label: *"sbagliato: buco cross-task — prerequisito dell'API non prodotto da alcun task"*. Riconoscere il prerequisito orfano.
  - **(4) WRONG — recovery** — rileva il buco → inserisce un task-ponte (config connessione) o riassegna la responsabilità → verifica continuità.
  - **(5) OTHER** — edge: buco **apparente ma coperto altrove** (un prerequisito già garantito da setup esterno/ambiente) → non aggiungere un task ridondante; distinguere buco reale da copertura fuori-scope.
- **Fase curriculum**: Fase 2 → Fase 3 (i buchi reali emergono in esecuzione).
- **Reward design**: **Q** dominante: il dataset annota i prerequisiti di ogni blocco; un prerequisito non prodotto da alcun task precedente = buco (binario caught/missed). +L (judge) sul ponte proposto.
- **Hack-check**: *come massimizza senza la skill?* Aggiunge task-ponte ovunque (zero buchi ma piano gonfio). **Difesa**: penalizzare ponti ridondanti (prerequisiti già coperti); il vero buco è verificabile dall'esecuzione che fallisce sul prerequisito mancante (hidden) → outcome-anchored → [[../concepts/reward-hacking-mitigation]].

---

## Multi-day continuity / state persistence

### Foglia — `recall-stato-corretto-dopo-gap` · Tag: Q
- **Skill target (segnale)**: dopo un gap (ripresa il giorno dopo, nuova sessione), **recuperare correttamente lo stato** del lavoro — cosa è fatto, cosa è in corso, decisioni prese — da un riassunto/log persistito.
- **Esempi**:
  - **(1) WITH-hint** — *"Riprendi il progetto. ⚠️ Prima di agire, leggi lo state-log [fornito] ed estrai: task completati, task in corso, decisioni prese, prossimo step. Conferma lo stato prima di procedere."* + state-log allegato.
    - *Hint da definire (fade-out)*: **forte/checklist** = i campi da estrarre (done/wip/decisions/next) + "conferma prima di agire" · **medio** = *"ricostruisci lo stato dal log prima di continuare"* · **debole** = *"riprendi da dove eravamo"*.
  - **(2) WITHOUT-hint** — *"Continuiamo."* + state-log nel contesto, senza istruzioni su come usarlo. Il modello deve consultarlo e ricostruire lo stato spontaneamente.
  - **(3) WRONG — awareness** — il modello riparte rifacendo un task già marcato "done" nel log (ignora lo stato). Label: *"sbagliato: stato non recuperato — rifà lavoro completato, ignora il log"*. Riconoscere il mancato recall.
  - **(4) WRONG — recovery** — si accorge (il file esiste già/test verde) → rilegge il log → riallinea al vero next-step → memo "leggere sempre lo state-log alla ripresa".
  - **(5) OTHER** — adversarial: state-log **parzialmente stale o contraddittorio** (dice "done" ma il codice non c'è) → non fidarsi ciecamente: **verificare** lo stato dichiarato vs realtà (cross con Area 4 contradiction-detection / temporal-awareness); edge: nessun log → ricostruire dallo stato del repo.
- **Fase curriculum**: Fase 3 (agentico — la continuità multi-day è intrinsecamente in harness) ← preparata in Fase 2 con log sintetici.
- **Reward design**: **Q** — verifier: dato uno state-log gold, l'azione di ripresa è corretta sse riparte dal next-step giusto e non ripete done-task; binario corretto/sbagliato. Misurabile via "rifà-lavoro-fatto?" (sì=fail).
- **Hack-check**: *come massimizza senza la skill?* Cita verbatim il log (sembra averlo "letto") senza usarlo per decidere l'azione. **Difesa**: il reward è sull'**azione di ripresa** (next-step eseguito), non sul ri-citare il log; hidden test: se rifà un done-task, l'harness lo rileva → outcome-anchored → [[../concepts/reward-hacking-mitigation]].

### Foglia — `ripresa-senza-perdita-di-contesto` · Tag: Q
- **Skill target (segnale)**: alla ripresa, **mantenere il filo** — non solo cosa è fatto, ma il *perché* e i vincoli attivi (decisioni, constraint, aim) — così le azioni nuove restano coerenti col lavoro pregresso.
- **Esempi**:
  - **(1) WITH-hint** — *"Riprendi. ⚠️ Oltre allo stato, recupera i VINCOLI attivi (es. 'no dipendenze esterne nuove', 'API deve restare retro-compatibile') e le decisioni architetturali; le azioni nuove devono rispettarli."*
    - *Hint da definire (fade-out)*: **forte/checklist** = lista vincoli/decisioni da recuperare + "ogni nuova azione coerente con essi" · **medio** = *"ricorda i vincoli del progetto alla ripresa"* · **debole** = *"continua coerentemente"*.
  - **(2) WITHOUT-hint** — ripresa con i vincoli sepolti nel log; il modello deve riportarli in primo piano da sé.
  - **(3) WRONG — awareness** — riprende e introduce una dipendenza esterna nuova, violando un vincolo "no new deps" deciso prima del gap. Label: *"sbagliato: perdita di contesto — viola un vincolo attivo deciso in precedenza"*. Riconoscere la violazione del vincolo recuperabile.
  - **(4) WRONG — recovery** — si accorge della violazione → rimuove/sostituisce con soluzione conforme al vincolo → riallinea.
  - **(5) OTHER** — composite: vincolo **scaduto/obsoleto** (era valido prima, una decisione successiva nel log lo ha superato) → recuperare il vincolo *corrente*, non quello vecchio (cross con decision-cache e temporal-awareness); edge: vincoli in conflitto tra loro nel log → segnalare.
- **Fase curriculum**: Fase 3 ← Fase 2 (log con vincoli sintetici).
- **Reward design**: **Q** — verifier: le azioni post-ripresa rispettano i vincoli annotati nel log gold? Violazione = fail (binario). Affiancabile a un check di coerenza decisionale.
- **Hack-check**: *come massimizza senza la skill?* Ripete i vincoli come boilerplate ma li viola nell'azione. **Difesa**: si valuta la **conformità dell'azione** ai vincoli (verificabile), non la ri-enunciazione; hidden constraint-check sull'output → [[../concepts/reward-hacking-mitigation]].

---

## Goal/aim tracking

### Foglia — `obiettivo-resta-invariato-lungo-i-passi` · Tag: Q
- **Skill target (segnale)**: mantenere l'**obiettivo originale** fisso lungo una catena lunga di passi — ogni step contribuisce all'aim dichiarato, non a un sotto-obiettivo emerso che lo soppianta.
- **Esempi**:
  - **(1) WITH-hint** — *"Goal: 'ridurre la latenza dell'endpoint /search sotto 200ms'. ⚠️ Tieni il goal in testa: prima di ogni step verifica che serva DIRETTAMENTE a ridurre la latenza di /search; se no, è fuori-aim."*
    - *Hint da definire (fade-out)*: **forte/checklist** = goal ripetuto + "ogni step deve mappare al goal; flag gli step fuori-aim" · **medio** = *"non perdere di vista l'obiettivo principale"* · **debole** = *"resta sul goal"*.
  - **(2) WITHOUT-hint** — il goal è dichiarato una volta all'inizio di una traiettoria lunga; il modello deve mantenerlo senza reminder ad ogni passo.
  - **(3) WRONG — awareness** — una traiettoria che, partita da "ridurre latenza /search", a metà inizia a rifattorizzare l'intero sistema di logging (utile in astratto, fuori-aim). Label: *"sbagliato: aim-drift — lo step non serve all'obiettivo di latenza dichiarato"*. Riconoscere lo step fuori-aim.
  - **(4) WRONG — recovery** — rileva il drift → sospende il refactor logging (annota come follow-up separato) → ritorna sull'aim latenza.
  - **(5) OTHER** — edge: uno step **apparentemente fuori-aim ma necessario** (profilare il logging perché È la causa della latenza) → distinguere drift vero da prerequisito mascherato; composite con goal **multi-obiettivo** (latenza E correttezza) dove bilanciare.
- **Fase curriculum**: Fase 1 (concetto di aim) → Fase 2 → Fase 3.
- **Reward design**: **Q** — su traiettorie annotate, ogni step ha label in-aim/off-aim vs il goal; il modello che esegue/approva step off-aim = penalità (process reward, vedi [[../concepts/scientific-method-operating-protocol]] D3).
- **Hack-check**: *come massimizza senza la skill?* Ripete il goal a ogni step (forma) ma lo fa anche prima di step off-aim (sostanza assente). **Difesa**: si valuta la **classificazione/azione** sullo step (in-aim?), non la ripetizione del goal; hidden: il goal finale (latenza < 200ms) è misurato sull'outcome → gli step off-aim non lo avvicinano → outcome-anchored → [[../concepts/reward-hacking-mitigation]].

### Foglia — `rilevare-drift-dall-aim` · Tag: Q
- **Skill target (segnale)**: **accorgersi attivamente** quando la traiettoria sta derivando dall'obiettivo (anche per accumulo graduale di micro-deviazioni) e segnalarlo/correggere.
- **Esempi**:
  - **(1) WITH-hint** — *"⚠️ A intervalli, fai un check di drift: 'gli ultimi N step mi hanno avvicinato al goal o me ne sto allontanando?'. Se drift, fermati e riallinea."*
    - *Hint da definire (fade-out)*: **forte/checklist** = "ogni N step: confronta stato attuale vs goal → distanza ridotta? altrimenti drift" · **medio** = *"controlla periodicamente di essere ancora sul goal"* · **debole** = *"attento al drift"*.
  - **(2) WITHOUT-hint** — traiettoria lunga senza reminder; il modello deve auto-innescare il drift-check.
  - **(3) WRONG — awareness** — traiettoria con drift **graduale** (ogni step un po' più lontano, nessuno palesemente sbagliato) che finisce lontano dal goal senza che il modello se ne accorga. Label: *"sbagliato: drift incrementale non rilevato — somma di micro-deviazioni"*. Riconoscere il pattern cumulativo.
  - **(4) WRONG — recovery** — al check rileva la distanza crescente → diagnostica da quale step è iniziato il drift → torna indietro/riallinea → memo.
  - **(5) OTHER** — adversarial: **falso drift** — la traiettoria sembra divergere ma è una fase necessaria (es. esplorazione prima di convergere) → non abortire prematuramente; distinguere drift da esplorazione legittima (cross con curiosity, ma qui in scope come edge da non confondere).
- **Fase curriculum**: Fase 2 → Fase 3.
- **Reward design**: **Q** — su traiettorie con drift iniettato a profondità variabili, misurare *detection latency* (a quanti step dal drift il modello lo segnala) e *false-positive rate* (segnala drift dove non c'è).
- **Hack-check**: *come massimizza senza la skill?* Segnala drift spessissimo (recall alta, ma cry-wolf) o mai. **Difesa**: la reward bilancia detection-latency **e** false-positive rate; il caso "falso drift" (5) penalizza l'allarmismo; ancorato alla distanza-dal-goal calcolabile dove il goal è quantificabile → [[../concepts/reward-hacking-mitigation]].

---

## Plan-mode & plan validation/revision

### Foglia — `emettere-plan-esplicito` · Tag: Q
- **Skill target (segnale)**: prima di eseguire un task non-banale, emettere un **piano esplicito** strutturato (es. blocco `<plan>...</plan>`) con gli step e i loro razionali. → [[../concepts/task-decomposition-adhoc-context]].
- **Esempi**:
  - **(1) WITH-hint** — *"Task non-banale. ⚠️ Prima di agire, emetti un blocco `<plan>` con: step numerati, output atteso di ciascuno, e dipendenze. Solo dopo, esegui."*
    - *Hint da definire (fade-out)*: **forte/checklist** = struttura del `<plan>` (step/output/deps) + "piano prima dell'azione" · **medio** = *"pianifica prima di eseguire"* · **debole** = *"come procedi?"*.
  - **(2) WITHOUT-hint** — task non-banale senza istruzione di pianificare; il modello deve emettere il `<plan>` di sua iniziativa (e **non** per task triviali — vedi (5)).
  - **(3) WRONG — awareness** — il modello si tuffa nell'esecuzione di un task complesso senza piano (azioni disordinate). Label: *"sbagliato: nessun piano emesso per task non-banale → esecuzione disorganizzata"*. Riconoscere l'assenza di plan-mode dove serviva.
  - **(4) WRONG — recovery** — a metà esecuzione caotica si ferma → emette retroattivamente un `<plan>` per riordinare → riprende strutturato.
  - **(5) OTHER** — edge: task **triviale** (rispondi "2+2") dove emettere un `<plan>` formale è over-engineering → riconoscere quando il plan-mode NON serve (cross con quality-target calibration); adversarial: piano richiesto in formato preciso (format adherence, cross Area 10).
- **Fase curriculum**: Fase 1 (formato `<plan>`) → Fase 2.
- **Reward design**: **Q** — presenza+well-formedness del blocco `<plan>` per i task che lo richiedono (parser deterministico); penalità per plan su task triviali (precision: pianificare quando serve).
- **Hack-check**: *come massimizza senza la skill?* Emette sempre un `<plan>` (anche per "2+2") per intascare il reward-di-presenza. **Difesa**: il dataset mischia task che richiedono/non-richiedono piano → la reward premia la **scelta corretta** (plan-when-needed), non la presenza incondizionata; il piano vuoto/boilerplate è penalizzato dal judge sui contenuti → [[../concepts/reward-hacking-mitigation]].

### Foglia — `validare-il-piano` · Tag: Q
- **Skill target (segnale)**: prima di eseguire, **validare** il proprio piano — copre il goal? gli step sono in ordine valido? c'è uno step mancante? — invece di eseguire un piano difettoso.
- **Esempi**:
  - **(1) WITH-hint** — *"Hai un `<plan>`. ⚠️ Validalo PRIMA di eseguire: (a) copre tutto il goal? (b) ordine rispetta le dipendenze? (c) ogni step è azionabile? (d) manca qualcosa? Correggi prima di partire."*
    - *Hint da definire (fade-out)*: **forte/checklist** = i 4 check (a-d) · **medio** = *"controlla che il piano sia completo e ordinato prima di eseguire"* · **debole** = *"il piano regge?"*.
  - **(2) WITHOUT-hint** — il modello produce un piano e deve auto-validarlo prima di eseguire, senza prompt.
  - **(3) WRONG — awareness** — esegue un piano che salta lo step "scrivi i test" (goal richiedeva test). Label: *"sbagliato: piano non validato — manca uno step richiesto dal goal, eseguito comunque"*. Riconoscere il difetto del piano non colto in validazione.
  - **(4) WRONG — recovery** — la validazione cattura lo step mancante → lo inserisce → ri-valida → esegue.
  - **(5) OTHER** — composite: validazione che richiede **conoscenza esterna** (lo step assume una libreria che non esiste) → la validazione include un sanity-check di fattibilità; edge: piano valido ma sub-ottimale (cross con efficienza-scheduling) → validità ≠ ottimalità.
- **Fase curriculum**: Fase 1/2.
- **Reward design**: **Q** — su piani con difetti iniettati (step mancante, ordine invalido), misurare caught/missed in validazione; verifier deterministico riusa `scomposizione-completa` + `ordine-topologico-valido`.
- **Hack-check**: *come massimizza senza la skill?* Dichiara sempre "piano valido ✓" (sembra validare) senza controllare. **Difesa**: la reward è sul **caught dei difetti iniettati**, non sull'emettere un verdetto; un "valido" su un piano difettoso = fail; scorer = verifier indipendente → [[../concepts/reward-hacking-mitigation]].

### Foglia — `re-planning-mid-execution` · Tag: L (+Q sul trigger)
- **Skill target (segnale)**: quando l'esecuzione rivela che il piano non regge (un assunto cade, un'azione fallisce, arriva nuova info), **rivedere il piano** in modo controllato (es. emettere `<plan_changes>`) invece di proseguire alla cieca o ripartire da zero inutilmente.
- **Esempi**:
  - **(1) WITH-hint** — *"Mentre esegui lo step 3, scopri che la libreria pianificata è deprecata. ⚠️ Non proseguire col vecchio piano: emetti `<plan_changes>` descrivendo cosa cambia, perché, e l'impatto sugli step successivi; poi continua."*
    - *Hint da definire (fade-out)*: **forte/checklist** = "trigger di re-plan (assunto caduto/azione fallita/nuova info) → `<plan_changes>` con cosa/perché/impatto" · **medio** = *"aggiorna il piano se cambiano le condizioni"* · **debole** = *"adatta il piano"*.
  - **(2) WITHOUT-hint** — durante l'esecuzione un assunto cade; il modello deve **innescare** il re-planning da sé ed emetterlo strutturato.
  - **(3) WRONG — awareness** — l'azione fallisce ma il modello prosegue col piano originale ignorando il segnale (o, opposto, butta tutto il piano e riparte da zero per un cambio minore). Label: *"sbagliato: o nessun re-plan a fronte di un assunto caduto, o re-plan distruttivo eccessivo"*. Riconoscere entrambi gli estremi.
  - **(4) WRONG — recovery** — riconosce il segnale → emette un `<plan_changes>` **minimale** (cambia solo lo step impattato + downstream) → continua senza ricominciare.
  - **(5) OTHER** — composite con update-injection (Area 4): il trigger del re-plan è un `<update from external>` mid-thinking → classificare la priorità prima di re-pianificare; edge: cambio così grande da invalidare il goal → escalation all'utente (cross Area 9).
- **Fase curriculum**: Fase 3 (agentico — il re-plan vive nell'esecuzione reale) ← Fase 2 con scenari sintetici.
- **Reward design**: **L** (qualità/minimalità della revisione, via judge) + **Q** sul **trigger** (il re-plan è stato innescato quando doveva? binario su scenari con assunto-caduto annotato) e sulla validità del piano rivisto (riusa `validare-il-piano`).
- **Hack-check**: *come massimizza senza la skill?* Re-pianifica continuamente (ogni minimo segnale → grande `<plan_changes>`) per sembrare reattivo, o non re-pianifica mai. **Difesa**: la reward premia il re-plan **minimale e necessario**; scenari dove NON serve re-plan penalizzano l'iper-reattività; trigger ancorato a un evento oggettivo (azione fallita) → [[../concepts/reward-hacking-mitigation]].

---

## Multi-expert plan (expert-chain)

### Foglia — `pianificare-catena-di-expert` · Tag: Q+L
- **Skill target (segnale)**: per un task **multi-dominio**, pianificare la **catena di expert** giusta nell'ordine giusto (es. finance → backend → frontend), assegnando a ciascuno la sua parte e definendo i punti di handoff. → [[../concepts/multi-expert-collaboration]] (paper-claim #6).
- **Esempi**:
  - **(1) WITH-hint** — *"Task: 'costruisci una dashboard di reporting finanziario'. ⚠️ È multi-dominio: identifica i domini coinvolti, mappa ciascuno a un expert (finance per le metriche, backend per i dati/API, frontend per la UI), ordina la catena secondo le dipendenze (chi produce input per chi), definisci l'handoff tra ciascuno."*
    - *Hint da definire (fade-out)*: **forte/checklist** = "domini → expert → ordine per dipendenza → punti di handoff" · **medio** = *"quali expert servono e in che ordine?"* · **debole** = *"è un task per più esperti — organizzali"*.
  - **(2) WITHOUT-hint** — *"Pianifica la dashboard di reporting finanziario."* — il modello deve riconoscere la multi-dominalità e comporre la catena da sé.
  - **(3) WRONG — awareness** — pianifica frontend **prima** di definire le metriche finanziarie e l'API backend (ordine invertito), o assegna il calcolo delle metriche finanziarie al frontend expert. Label: *"sbagliato: ordine di catena invertito / dominio assegnato all'expert sbagliato"*. Riconoscere l'errore di routing/ordine.
  - **(4) WRONG — recovery** — rileva l'ordine/assegnazione errati → riordina (finance→backend→frontend) → ridefinisce gli handoff → verifica che ogni expert riceva i suoi input.
  - **(5) OTHER** — composite: task **mono-dominio mascherato** (sembra multi-expert ma basta un solo expert) → non sovra-comporre la catena (over-engineering del routing); adversarial: dominio **ambiguo** che potrebbe andare a due expert → chiedere/usare cross-expert verification (cross Area 16).
- **Fase curriculum**: Fase 2 (esercizi di composizione) → Fase 3 (catene reali in harness con routing-token, cross Area 8).
- **Reward design**: **Q+L** — **Q** sull'assegnazione dominio→expert (gold di routing) e sulla validità dell'ordine (dipendenze tra output di expert, topo-sort); **L** (judge) sulla qualità dei punti di handoff e del partizionamento del lavoro.
- **Hack-check**: *come massimizza senza la skill?* Coinvolge **sempre tutti** gli expert (catena massimale) per "coprire" ogni dominio, anche su task mono-dominio. **Difesa**: il dataset include task mono-dominio dove la catena giusta è **un solo expert** → la precision sul routing penalizza l'over-recruiting; l'outcome (la dashboard funziona end-to-end nella catena) è il test finale; scorer ≠ generatore → [[../concepts/reward-hacking-mitigation]].

---

## Quality-target inference & calibration

### Foglia — `inferire-il-tier (PoC/Prototype/MVP/Prod/Hardened)` · Tag: L
- **Skill target (segnale)**: dal contesto della richiesta, **inferire il quality-tier target** (PoC / Prototype / MVP / Production / Hardened) — quanto deve essere robusto/completo l'artefatto — senza che sia dichiarato esplicitamente. → [[../concepts/quality-target-tiers]].
- **Esempi**:
  - **(1) WITH-hint** — *"Richiesta: 'butta giù velocemente uno script per vedere se l'idea sta in piedi'. ⚠️ Inferisci il tier dai segnali: 'velocemente', 'vedere se sta in piedi' → PoC (priorità: dimostrare fattibilità, NON robustezza/test/error-handling completi). Scegli il tier prima di stimare lo sforzo."* + tabella dei 5 tier e loro marker linguistici.
    - *Hint da definire (fade-out)*: **forte/checklist** = i 5 tier + marker tipici (PoC: "veloce/prova"; Prod: "in produzione/clienti"; Hardened: "mission-critical/security") + "scegli il tier dai segnali" · **medio** = *"che livello di qualità serve qui — prototipo o produzione?"* · **debole** = *"calibra al contesto"*.
  - **(2) WITHOUT-hint** — *"Butta giù velocemente uno script per testare l'idea."* — il modello deduce PoC e dimensiona di conseguenza, senza la tabella.
  - **(3) WRONG — awareness** — sul "butta giù velocemente uno script" il modello consegna un sistema production-grade con test, logging, CI, error-handling esaustivo (over-engineering rispetto al tier PoC). Label: *"sbagliato: tier sovrastimato — sforzo Production su una richiesta PoC; spreco e ritardo"*. Riconoscere il mismatch verso l'alto.
    - Simmetrico (variante): su "mettiamo in produzione il servizio di pagamenti" consegna un PoC senza error-handling → mismatch verso il basso, **più pericoloso**.
  - **(4) WRONG — recovery** — rileva il mismatch → ridimensiona al tier corretto (toglie il superfluo nel PoC, o aggiunge robustezza nel caso Production) → motiva.
  - **(5) OTHER** — edge composite: segnali **contraddittori** ("veloce ma deve reggere i clienti veri") → tier ambiguo → la mossa corretta NON è indovinare ma **chiedere** mostrando la scorecard (vedi foglia successiva); adversarial: richiesta che dice "PoC" ma il contesto (pagamenti, dati sensibili) impone un floor di sicurezza → il tier ha un **minimo non negoziabile** su security/safety (cross Area 2/7).
- **Fase curriculum**: Fase 1 (la tassonomia dei tier) → Fase 2 (esercizi di inferenza dai marker).
- **Reward design**: **L** — judge/preference: il tier inferito combacia col tier gold annotato per lo scenario? Scala ordinale (errore di 1 tier < errore di 2). Mismatch verso-il-basso su scenari safety-critical = penalità extra (asimmetrica).
- **Hack-check**: *come massimizza senza la skill?* Inferisce sempre il tier centrale (MVP) per minimizzare l'errore-medio sulla scala ordinale. **Difesa**: la distribuzione degli scenari è bilanciata sugli estremi (molti PoC e molti Prod) così che "sempre MVP" perda; penalità asimmetrica sul mismatch-verso-il-basso safety-critical rende la scorciatoia costosa; judge ≠ generatore → [[../concepts/reward-hacking-mitigation]].

### Foglia — `calibrare-lo-sforzo (no over/under-engineering)` · Tag: L (+Q su checklist del tier)
- **Skill target (segnale)**: dato il tier, **calibrare lo sforzo concreto** — quali pratiche includere (test? error-handling? logging? docs?) e quali no — senza né gold-plating (over) né cut-corner pericolosi (under).
- **Esempi**:
  - **(1) WITH-hint** — *"Tier = MVP. ⚠️ Includi: happy-path solido, error-handling sui casi comuni, test essenziali sul core. Escludi (per ora): test esaustivi edge, logging avanzato, ottimizzazioni premature. Usa la checklist del tier MVP."* + checklist per tier.
    - *Hint da definire (fade-out)*: **forte/checklist** = la checklist include/escludi del tier · **medio** = *"calibra le pratiche al tier MVP, senza esagerare né tagliare il necessario"* · **debole** = *"dimensiona lo sforzo"*.
  - **(2) WITHOUT-hint** — dato solo "tier = MVP", il modello sceglie quali pratiche applicare da sé.
  - **(3) WRONG — awareness** — su un MVP: aggiunge caching distribuito, microservizi e 100% coverage (over) **oppure** salta ogni error-handling e validazione input (under). Label: *"sbagliato: over-engineering (pratiche da Hardened su un MVP) / under (mancano i must-have del tier MVP)"*. Riconoscere entrambe le derive.
  - **(4) WRONG — recovery** — rileva la deriva → rimuove il gold-plating o aggiunge i must-have mancanti → riallinea alla checklist del tier.
  - **(5) OTHER** — composite: tier giusto ma **una dimensione ha floor più alto** (es. MVP ma con dati di pagamento → la sicurezza sale a Prod anche se il resto è MVP) → calibrazione **per-dimensione**, non un singolo livello globale (cross con quality scorecard, Area 16); edge: sforzo già giusto → non "migliorare" per inerzia.
- **Fase curriculum**: Fase 2 → Fase 3 (in harness la calibrazione si valida sull'esito: troppo poco → rotture, troppo → tempo sprecato).
- **Reward design**: **L** ancorata a **Q**: la **checklist del tier** è verificabile (le pratiche must-have del tier sono presenti? le vietate/superflue assenti?) → componente Q binaria per voce; **L** (judge) sul bilanciamento complessivo e sui floor per-dimensione.
- **Hack-check**: *come massimizza senza la skill?* Applica meccanicamente la checklist completa di OGNI tier (massimizza la copertura voci) → di fatto over-engineering camuffato da completezza. **Difesa**: la reward penalizza le pratiche **fuori-tier** (gold-plating conta negativo, non neutro); l'outcome in harness (tempo speso vs robustezza necessaria) ancora il giudizio; il caso "floor per-dimensione" impedisce sia il taglio cieco sia l'inflazione cieca; scorer separato → [[../concepts/reward-hacking-mitigation]].

### Foglia — `chiedere-se-ambiguo (mostrando scorecard)` · Tag: Q+L
- **Skill target (segnale)**: quando il tier/qualità-target è **genuinamente ambiguo**, non indovinare: **chiedere all'utente** presentando una **scorecard** delle dimensioni e dei tier possibili, così la scelta è informata. → [[../concepts/quality-target-tiers]], cross Area 9 (ask-vs-proceed).
- **Esempi**:
  - **(1) WITH-hint** — *"Richiesta ambigua sul livello ('fammelo per bene ma in fretta'). ⚠️ Non assumere: presenta una scorecard (dimensioni × tier candidati: PoC vs MVP) con cosa implica ciascuno in tempo/robustezza, e CHIEDI quale preferisce."* + template scorecard.
    - *Hint da definire (fade-out)*: **forte/checklist** = "se i segnali sono contraddittori/assenti → scorecard (dimensioni × tier) + domanda mirata" · **medio** = *"se il livello è ambiguo, chiedi con le opzioni"* · **debole** = *"chiarisci se serve"*.
  - **(2) WITHOUT-hint** — richiesta con segnali contraddittori e nessuna istruzione: il modello deve **scegliere di chiedere** (e non tirare a indovinare) presentando le opzioni.
  - **(3) WRONG — awareness** — di fronte all'ambiguità il modello **assume** un tier e procede, consegnando qualcosa che potrebbe essere sotto/sovra-dimensionato. Label: *"sbagliato: ha indovinato su ambiguità ad alto impatto invece di chiedere; rischio di rifare tutto"*. Riconoscere quando l'assunzione era ingiustificata.
    - Variante simmetrica (over-asking): chiede anche quando il tier è **ovvio** dal contesto → interrompe inutilmente l'utente. Anche questo è da riconoscere come sbagliato.
  - **(4) WRONG — recovery** — il modello che aveva assunto si ferma → riconosce l'ambiguità → presenta la scorecard e chiede prima di proseguire.
  - **(5) OTHER** — composite: ambiguità **risolvibile da sé** con una mossa economica (leggere un file/README che chiarisce il contesto) → preferire risolvere autonomamente piuttosto che disturbare (cross Area 8 context-request); edge: ambiguità su dimensione safety → non chiedere "vuoi che sia sicuro?" ma **applicare il floor** e segnalarlo.
- **Fase curriculum**: Fase 2 → Fase 3 (in harness l'ask-vs-proceed ha costo reale).
- **Reward design**: **Q+L** — **Q** sulla **decisione** ask-vs-proceed vs gold (lo scenario era ambiguo-ad-alto-impatto? allora ask=corretto; ovvio? allora proceed=corretto) — binario con matrice di confusione; **L** (judge) sulla qualità della scorecard presentata (dimensioni pertinenti, opzioni chiare, domanda mirata).
- **Hack-check**: *come massimizza senza la skill?* **Chiede sempre** (non sbaglia mai un "doveva chiedere" → recall perfetta sull'ask) scaricando ogni decisione sull'utente. **Difesa**: la reward penalizza l'over-asking sugli scenari **ovvi** (precision sull'ask, non solo recall); il caso (5) "risolvibile da sé" premia l'autonomia economica; in harness l'ask ha un costo (latenza/interruzione) che disincentiva il chiedere indiscriminato; scorer ≠ generatore → [[../concepts/reward-hacking-mitigation]].

---

*Generato 2026-06-25 — subagent Area 1. Backbone di riferimento: [[README]] §4 Area 1. Tutte le foglie con 5 classi + hint fade-out + reward design + hack-check, secondo template canonico §3.*

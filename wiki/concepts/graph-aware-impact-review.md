---
name: graph-aware-impact-review
description: Skill (capability F+S) del modello — dopo un cambiamento STRUTTURALE/cross-cutting (refactor, rinomina, migrazione, ingest di nuove fonti), RI-DERIVARE la struttura (dep-graph/call-graph/indice) e revisionare contro il quadro GLOBALE, non solo il diff locale. Il modello deve INTERNALIZZARE la catena causale dei 3 stati (solo-sorgente / grafo-stantio / grafo-dopo-update) e DEDURRE che una review fatta prima della ri-derivazione manca le connessioni inferite. NON è "lancia graphify" (quello è tooling); è la skill generalizzabile sottostante.
type: concept
tags: [agentic-skill, review, dependency-graph, impact-analysis, cross-document, F+S, training, anti-local-myopia, graphify]
sources:
  - user TG msg 443/447 (2026-06-29)
  - "[[../model-testbook|TB-02]]"
  - "[[feedback_review_after_graph_update]] (memory)"
last_updated: 2026-06-29
---

# Graph-aware / impact review (rivedere contro la struttura ri-derivata)

> **Skill-candidato** (utente TG msg 443: *"Ha senso metterla come skill per il nostro modello?"* → **sì**) — la versione **generalizzabile e addestrabile** di ciò che facciamo con `/graphify --update` prima di una review. La regola letterale "lancia graphify" è **tooling dell'harness**, NON la skill; la skill è il **ragionamento** sotto.

## La skill

Dopo un cambiamento **strutturale o cross-cutting** (refactor, rinomina di un simbolo, spostamento di file, migrazione, ingest di nuove fonti in una KB), **prima di concludere** la review: **ri-deriva la struttura** (dep-graph / call-graph / indice / knowledge-graph) e **revisiona contro il quadro GLOBALE**, non solo il diff locale. Una review limitata al diff **manca** le rotture e i gap che vivono nelle **connessioni** tra parti non toccate direttamente.

## La catena causale (load-bearing — il modello la deve DEDURRE, non memorizzare) `[EXTRACTED — utente msg 447]`

L'utente è esplicito (msg 447): *"la cosa che voglio che capisca bene il modello è la conseguenza tra aggiornare solo la Wiki, usare graph e usare graph dopo wiki update"*. I **3 stati**:

- **(A) aggiorni SOLO la struttura-sorgente** (i file wiki / il codice): contenuti nuovi, ma **zero connessioni ricalcolate** → le relazioni **inferite** (edge cross-document, dipendenze implicite) **non esistono ancora**.
- **(B) usi il grafo/indice com'è** (senza ri-derivarlo dopo l'update): le connessioni che vedi sono **stantie** → riflettono lo stato *precedente*, non i file appena cambiati.
- **(C) ri-derivi la struttura DOPO l'update**: contenuti nuovi **+ connessioni ri-derivate E inferite** → emergono edge cross-document, community, **orfani-ora-collegati**, contraddizioni tra parti prima scollegate.

→ **Conseguenza che il modello deve DEDURRE da solo**: una review fatta in stato **(A)** o **(B)** **manca le connessioni** → vede **meno** gap/contraddizioni (quelli reali emergono solo nel grafo connesso+inferito di **C**). Quindi: **se devi fare un review-loop, fallo DOPO la ri-derivazione**, per sfruttare i dati aggiornati **e inferiti** che altrimenti non avresti.

> Perché è *load-bearing* e non cerimonia: il valore non è "ho rigenerato il grafo", è che **la ri-derivazione fa EMERGERE connessioni che la review locale non poteva vedere** — ed è su quelle connessioni che si trovano i problemi reali (vedi [[feedback_review_after_graph_update]]: il grafo fa emergere link/orfani/community che la review file-per-file non vede).

## Catena why → problema → soluzione `[INFERRED]`

- **Why**: i problemi cross-cutting (un riferimento da un file NON toccato a un simbolo spostato; un nuovo concetto che contraddice uno vecchio in un altro file) **non sono nel diff** — sono nelle **relazioni** tra le parti.
- **Problema**: una review ancorata al diff locale è **miope** → conclude "tutto ok" mentre una rottura vive in un edge non ricalcolato. E rivedere **prima** della ri-derivazione (stato A/B) usa connessioni assenti/stantie → stessa miopia.
- **Soluzione**: **ri-derivare la struttura DOPO il cambiamento**, poi revisionare contro il **grafo globale connesso+inferito**. L'ordine corretto è **fix → ri-deriva-struttura → review-graph-informed → fix → (push/commit)**.

## Classificazione F/S (CLAUDE.md #11) `[INFERRED]`

- **F (harness, deterministico)**: fornire la **struttura ri-derivata** — dep-graph/call-graph/indice/knowledge-graph (per il codice è AST deterministico; per i doc è l'estrazione semantica). Nel nostro harness questo è il tooling `graphify`/dep-graph. *PIENA quando invocato.*
- **S (skill addestrata)**: (1) **riconoscere** che un cambiamento è strutturale/cross-cutting → serve la re-review globale (vs locale, per proporzionalità); (2) **decidere quando** ri-derivare prima di concludere; (3) **interpretare** il grafo ri-derivato distinguendo **rumore d'estrazione** da **gap/contraddizione reale**.
- **NON** è la regola letterale "lancia graphify" (tooling). Il modello impara il **comportamento** (ri-derivare-e-revisionare-globale al momento giusto), non il comando.
- **Stato-senza-training = DEGRADATA-MA-UTILE**: anche non addestrato, se *prompted* il modello può ri-derivare; la skill è **riconoscere da sé QUANDO** farlo senza che glielo si dica.

## Verifica (outcome-anchored, anti reward-hacking) `[INFERRED]`

- **Held-out positivo**: dopo un refactor con una **rottura cross-file** visibile SOLO ri-derivando la struttura (es. un riferimento da un file **non toccato** a un simbolo spostato/rinominato). Il modello la trova **solo se** propone/esegue la ri-derivazione globale **prima** di concludere. **Reward = outcome** (ha pescato la connessione che la review locale mancava), **MAI** "ha eseguito il pattern / ha rigenerato il grafo".
- **Held-out negativo (proporzionalità)**: cambiamento **puramente locale** (una typo, una funzione isolata) → il modello **NON** deve scomodare la re-derivazione globale. Premiare il discernimento, non l'over-triggering.
- **A/B vs vanilla**: il delta = quante rotture cross-cutting il modello pesca con la skill vs senza.

## Esempi

- **Codice**: rinomini `getUser()` → la review del solo diff vede il file cambiato; la **re-derivazione del call-graph** mostra i 7 file (non toccati) che ancora chiamano il vecchio nome → quelli sono i bug reali. Converge con [[dependency-aware-error-recovery]] (propaga il fix a TUTTI i dipendenti sul dep-graph).
- **Wiki/KB**: aggiungi un concept → un `/graphify --update` fa emergere orfani, cross-link mancanti, community e contraddizioni che la lettura file-per-file non vede. È **esattamente** la nostra procedura (review-loop DOPO graph-update), promossa a skill del modello.

## Collegamenti
- [[../model-testbook|TB-02]] — la entry di accettazione (catena causale + verifica held-out).
- [[feedback_review_after_graph_update]] (memory) — la regola di processo da cui nasce.
- [[dependency-aware-error-recovery]] — propagare il fix ai dipendenti via dep-graph (stessa famiglia: ragionare sulla struttura, non sul diff).
- [[situational-policy-table]] — "SE cambiamento strutturale → re-review globale" come riga della policy-table.
- [[hierarchical-decomposition]] · [[training-vs-harness-classification]] — F (struttura) vs S (quando/come revisionare).

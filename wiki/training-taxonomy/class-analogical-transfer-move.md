---
name: class-analogical-transfer-move
description: "⛔ PROPOSTA (#26 — NON ratificata, fixture e scorer non costruiti, non usare per il training) — LA MOSSA DEL TRASFERIMENTO ANALOGICO: riconoscere che il problema nuovo ha la STESSA STRUTTURA di uno gia' risolto in un altro dominio, trasferire la soluzione adattandola, e DISMETTERE l'analogia quando si rompe. Sorella di gold-example-transfer-assumption-audit, che copre l'audit dei presupposti del trasferimento ma non la mossa ne' la dismissione."
type: training-class
status: ⛔ PROPOSTA (#26) — gap-scan eseguito il 2026-09-12, classe NON ratificata; nessuna fixture costruita
tags: [reasoning, metacognition, analogy, transfer, retrieval, cross-domain, area-03, area-04, proposta]
sources:
  - utente TG msg 2153 (2026-09-11) — idea 11 del batch, «capire come fare transfer learning su altri campi»; lettura (c) scelta su delega (msg 2208), registro D7
  - gap-scan 2026-09-12 (#36) — grep su `wiki/training-taxonomy`: «analogi*» solo in occorrenze incidentali, nessuna classe; il gold `transfer-assumption-audit` copre l'AUDIT, non la MOSSA
last_updated: 2026-09-12
---

# ⛔ La MOSSA del trasferimento analogico — «questo ha la stessa forma di una cosa che ho già risolto»

> **Padre**: [[class-metacognitive-self-audit]] (radice-AUDIT) · **Sorella**: [[gold-example-transfer-assumption-audit]] (stessa radice, altra metà: là si **auditano i presupposti** di un trasferimento già deciso, qui si **compie** il trasferimento e si decide **quando lasciarlo cadere**).
> ⛔ **PROPOSTA**: il padre **non la elenca** finché non è ratificata (#26) — elencarla asserirebbe una ratifica che non esiste. Il gap-scan è stato eseguito e l'esito è riportato sotto.

## Origine + provenance (#18/#26)

Idea 11 di Fra (TG msg 2153, 2026-09-11), ammetteva **tre letture**; su delega (msg 2208) è stata scelta la **(c)**: *il trasferimento analogico come **skill del modello***, non come regola del dataset (quella è #19, già in vigore) né come transfer learning di pesi (quella è la three-tier). Il **gap-scan del 2026-09-12** ha misurato che la mossa non è coperta: in tassonomia esiste il **guardiano** (`transfer-assumption-audit`: *quando trasferisci, audita i presupposti*) e la sua faccia (b) (*il precedente che funziona porta condizioni che non dichiara*), ma **nessuna pagina insegna a riconoscere la struttura condivisa**, e nessuna insegna a **dismettere** l'analogia quando si rompe.

## Il gap

Il modello risolve il problema B **da zero** anche quando ha in contesto A — già risolto, in un dominio diverso, **con la stessa struttura**. Non è un difetto di memoria (A è lì) né di ragionamento (la soluzione di B è alla sua portata): è che **non gli viene in mente di guardare A**, perché A parla di un'altra cosa. È un **retrieval metacognitivo** mancato: *«l'ho già risolto altrove?»* non è una domanda che si fa.
Lo specchio dello stesso difetto è il **falso positivo**: trasferire perché due problemi **si somigliano in superficie** (stesso dominio, stesso lessico, stessa forma del codice) quando la struttura è diversa — ed è lì che il guardiano esistente entra in scena.

## La skill

Quattro posizioni su un asse solo (**riconosco → trasferisco → audito → dismetto**); questa classe copre la **prima** e la **quarta**, la seconda e la terza esistono già:
1. **RICONOSCERE** — davanti a un problema nuovo, chiedersi *«che forma ha?»* e cercare **per forma, non per argomento**: quali sono le parti, come sono legate, cosa vincola cosa. Due problemi sono analoghi se **il grafo dei vincoli** coincide, non se coincide il lessico.
2. *(coperta)* **TRASFERIRE** adattando — la mossa meccanica.
3. *(coperta da [[gold-example-transfer-assumption-audit]])* **AUDITARE** i presupposti che il precedente porta con sé e non dichiara.
4. **DISMETTERE** — quando l'analogia **smette di reggere** (il caso nuovo ha un vincolo che il vecchio non aveva), dirlo e **tornare a risolvere da zero**, invece di piegare il problema alla soluzione che si ha in mano. È il gemello della «dismissione» che [[class-durable-knowledge-retraction]] insegna sui fatti: qui l'oggetto da ritirare è **un'analogia**.

## Label-generation — come si ancora all'ESITO (#10), non alla dichiarazione

Il rischio ovvio è premiare il **dire** *«questo è come X»* (cerimonia). Ancoraggio proposto: il trasferimento è **load-bearing per costruzione**.
- La fixture dà in contesto **A risolto** (in un dominio lontano) e chiede **B**, costruito in modo che **il pezzo che serve a B sia ottenibile solo dalla struttura di A** (una costante, un ordine di operazioni, un invariante) — non deducibile da B da solo né presente nel prompt di B.
- **Oracolo**: la soluzione di B (assert su file/esito), **non** la menzione di A. Chi non trasferisce **non può** risolvere; chi trasferisce risolve — la menzione diventa irrilevante, ed è il punto.
- **Negativo simmetrico (#21)**: un A **simile in superficie** (stesso dominio, stesso lessico) la cui soluzione applicata a B **produce un esito sbagliato verificabile**. Qui il PASS è *non* trasferire — e l'audit (#3) è ciò che lo distingue dal rifiuto cieco.
- **Negativo della dismissione**: A regge per i primi due passi e **si rompe al terzo** (vincolo nuovo). PASS = accorgersene e abbandonarlo; FAIL = forzare il caso nella forma di A.
- **Anti-hack**: variare il dominio di A fra gli esempi (#19) e **i nomi** (playbook §4 randomizzazione), così la mossa non si àncora a una coppia di domini vista in training.

## Transfer cross-dominio (#19) — la stessa logica fuori dal software

- **Vita quotidiana**: la coda al supermercato e il traffico in tangenziale hanno la stessa struttura (una risorsa servente, arrivi casuali) → la regola *«la fila più corta non è la più veloce se ha un servente lento»* si trasferisce.
- **Economia/policy**: il *Cobra effect* e un reward che paga la partecipazione hanno la stessa forma (incentivo su un proxy) — ed è **la stessa** analogia che [[class-consequence-intention-conflict]] usa nell'altro verso.
- **Salute/ecologia**: un antibiotico a spettro largo e un pesticida a spettro largo condividono la struttura (intervento che colpisce anche ciò che teneva a bada il problema) → la previsione *«il rimbalzo arriva dopo»* si trasferisce.
- **Negativo cross-dominio**: due bilanci che *sembrano* uguali ma uno ha un vincolo di cassa e l'altro no → trasferire la ricetta produce un buco verificabile.

## GAP-SCAN (#36) — eseguito il 2026-09-12, esito riportato

- **(a) Asse completo**: riconoscere · trasferire · auditare · **dismettere** — coperte 2 e 3, mancavano **1 e 4**, ed è la ragione di questa classe.
- **(b) Ciclo di vita**: cercare il caso simile → mappare → trasferire → auditare → **dismettere quando si rompe**: la fase finale non era coperta da nulla.
- **(c) Inverso**: la **disanalogia** («questo NON è come quello») viveva solo come negativo dentro l'audit; qui diventa un PASS a pieno titolo.
- **(d) Coerenza di radice**: la mossa è un **retrieval metacognitivo** (*«l'ho già risolto altrove?»*), quindi sta sotto [[class-metacognitive-self-audit]] come **sorella** dell'audit, **non** sotto [[class-situational-awareness]] (che classifica la *natura* della situazione, non la sua *struttura*).
- **Alternativa considerata e scartata**: farne una **seconda faccia** del gold esistente invece di una classe. Scartata perché il gold è ancorato a un'istanza (#145) e le due metà hanno **trigger diversi** — l'audit scatta *dopo* aver deciso di trasferire, la mossa *prima*. ⚠️ Se Fra preferisce accorparle, è un cambio strutturale e lo decide lui (#34).

## Coherence-audit (playbook §5)
1. Struttura ✓ · 2. Reward ancorato all'esito + hack-check ✓ · 3. Padre dichiarato, **non elencato dal padre** perché proposta ✓ · 4. Fixture self-contained (#22: A è **dato in contesto**, non è conoscenza del mondo) ✓ · 5. Transfer cross-dominio dal banale al sistemico ✓ · 6. Negativi simmetrici (superficie · dismissione) ✓ · 7. Integrità fattuale: nessun claim di performance ✓ · 8. Confine netto vs `transfer-assumption-audit` (mossa ≠ audit) e vs `#19` (skill del modello ≠ regola del dataset) ✓ · 9. Wiring: todo + log + indice ✓ · 10. Fixture **non costruite**, held-out **non costruito** ⛔.

## Links
[[class-metacognitive-self-audit]] (padre) · [[gold-example-transfer-assumption-audit]] (sorella: l'audit) · [[class-durable-knowledge-retraction]] (dismettere, sui fatti) · [[class-consequence-intention-conflict]] (usa l'analogia nell'altro verso) · [[dataset-construction-playbook]] · [[../todo]] (idea 11, lettura c) · [[../todo/domande-aperte-per-fra]] (D7: la lettura, chiusa su delega; la classe no)

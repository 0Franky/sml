---
name: REQUISITO-AFFIDABILITA
description: "REQUISITO FONDANTE del modello, elevato dall'utente il 2026-08-17 sopra ogni altro obiettivo — «voglio un modello AFFIDABILE, che prima di darmi una risposta sia certo di quello che fa». Definisce il difetto preciso da estirpare (la ritrattazione DOPO che l'utente ha agito, non l'errore in sé), i tre obblighi operativi che ne discendono, il polo simmetrico che impedisce di degenerare in prudenza inutile, e le tre misure che rendono «affidabile» una proprietà verificabile invece di un aggettivo."
type: requisito
tags: [requisito-fondante, affidabilita, calibrazione, metodo-scientifico, wiki-first, area-processo, area-training]
sources:
  - utente TG msg 2086 (2026-08-17) — «per favore tu adesso devi fare un'unica cosa prima di procedere oltre: mettere questo requisito come fondamentale. Deve essere affidabile. Tutto il resto deve ruotare a questo»
  - utente TG msg 2087/2089 — «non voglio che mi dica una cosa e poi ritratti» · verification loop prima di rispondere
last_updated: 2026-08-17
status: REQUISITO ATTIVO — sovraordinato agli altri obiettivi di progetto
---

# ⭐ Requisito fondante: il modello deve essere AFFIDABILE

> *«Voglio un cazzo di modello che sia affidabile, che prima di darmi una risposta sia certo di quello che fa.
> E banalmente basterebbe innanzitutto verificare, prima di rispondermi, tutte le informazioni presenti nella
> wiki correlate al discorso.»* — utente, 2026-08-17
>
> *«Tutto il resto deve ruotare a questo. E mi sembra che per essere affidabile debba seguire il metodo
> scientifico, che quindi sembra essere complementare.»*

**Questo documento è sovraordinato.** Dove un'altra pagina della wiki propone qualcosa che confligge con
quanto scritto qui, vince questo — e la contraddizione va segnalata, non silenziata.

---

## 1. Il difetto preciso — e non è «sbagliare»

⚠️ **Il problema non è l'errore. È la RITRATTAZIONE DOPO CHE L'UTENTE HA AGITO.**

La dinamica, con le sue parole: fa una domanda → riceve una risposta → **prende decisioni in base a quella
risposta** → tre o quattro ore dopo arriva *«no, avevo sbagliato, funziona in un altro modo»* → e a quel punto
va rifatto **tutto**, **compreso il lavoro che ha fatto lui nel frattempo**. **Va avanti così da due mesi.**

Questo cambia completamente cosa bisogna ottimizzare:

| Se il problema fosse… | …la soluzione sarebbe | Ma il problema è |
|---|---|---|
| «sbaglia troppo» | essere più bravi | ❌ nessuno è infallibile: obiettivo irraggiungibile → inutile |
| «sbaglia e non se ne accorge» | accorgersene prima | 🟡 utile ma parziale |
| ⭐ **«sbaglia con l'aria di essere sicuro, e chi ascolta ci costruisce sopra»** | **far viaggiare la certezza INSIEME alla risposta** | ✅ **è questo** |

⭐ **La formulazione che rende il requisito operativo**: *«non lo so»* **consegnato adesso** costa meno di una
**certezza ritrattata fra quattro ore** — **esattamente della quantità di lavoro che l'utente fa in quelle
quattro ore.** Non è una massima: è una sottrazione. Ed è il motivo per cui l'incertezza dichiarata **subito**
non è una debolezza, è la mossa più economica delle due.

**Corollario che ribalta le priorità**: la profondità di verifica non va tarata su *quanto è difficile la
domanda*, ma su **quanto ci verrà costruito sopra**. Un'osservazione di passaggio e una claim su cui lui
riorganizza il progetto meritano trattamenti diversi — e **spesso chi risponde non sa in quale delle due si
trova**. Quando non lo sa: **lo chiede, o lo dichiara**.

---

## 2. I tre obblighi operativi

### (1) La certezza viaggia CON la risposta, non dopo
Ogni claim non banale porta **il livello a cui è stata verificata** e **il residuo che resta**. I marcatori
esistono già ([[concepts/structured-thinking]]): **`[V]` verificato** · **`[A]` assunto** · **`[?]` da
verificare**. Il punto non è il simbolo: è che **chi legge deve poter decidere quanto costruirci sopra prima
di costruirci sopra**.

### (2) La wiki si consulta PRIMA di rispondere, non dopo aver sbagliato
È la richiesta letterale dell'utente. La wiki è la **sorgente di conoscenza**: tutto ciò che lui dice ci
finisce, **formalizzato e linkato**, senza pezzi volanti — così che *«c'è una contraddizione?»* e *«dov'era
quella cosa?»* siano **istantanei**.

⚠️ **E qui c'è un debito nostro, non suo**: lui osserva che **[[../graphify-out|graphify]] esiste esattamente
per questo e non si usa mai**. Ha ragione, e va detto per intero: al 2026-08-17 il grafo è fermo al
**2026-07-08**, con **244 commit** accumulati dopo. **Un grafo stantio è peggio di nessun grafo**, perché
risponde con sicurezza usando relazioni che non valgono più — cioè produce **esattamente** il difetto che
questo requisito esiste per estirpare. → o si aggiorna, o non lo si cita come garanzia.

### (3) Prima di consegnare: il giro di verifica, e su ciò che DISCRIMINA
Non *«ho controllato?»* ma ***«ciò che ho controllato discrimina la domanda che devo chiudere?»***. È il
valore cardine già in vigore ([[../memory|feedback_scientific_skepticism_verification_depth]], CLAUDE.md #0) —
e da oggi si sa **a cosa serviva**: **#0 è il METODO, l'affidabilità è il FINE.** L'utente lo ha visto da solo
(*«per essere affidabile deve seguire il metodo scientifico, che sembra complementare»*).

---

## 3. ⚠️ Il polo simmetrico — senza il quale questo requisito si autodistrugge

Un requisito di affidabilità applicato senza contrappeso degenera in **prudenza inutile**, e la degenerazione
è **peggiore del difetto originale** perché non si vede:

- rispondere *«non sono sicuro»* su cose **verificabili in dieci secondi** = scaricare sull'utente il lavoro;
- circondare **ogni** frase di cautele finché il messaggio non dice più niente;
- usare l'incertezza come **riparo dal rischio di sbagliare** — che è ancora ottimizzare per sé, non per lui.

⭐ **Il difetto non è la sicurezza: è la sicurezza NON GUADAGNATA.** Una cosa verificata si dice **piatta e
netta**, senza cautele decorative. La disciplina è che **il marcatore sia vero**, non che sia prudente.

*(È la stessa simmetria che governa i nostri reward: penalità sui due estremi, mai su uno solo — vedi
[[../memory|feedback_negative_examples_and_dataset_completeness]] #21.)*

---

## 4. Come si misura — perché «affidabile» non sia un aggettivo

Tre misure, dalla più diretta alla più fine. **La prima è il requisito stesso reso numero.**

**(a) ⭐ Tasso di ritrattazione su claim su cui si è agito.** Delle affermazioni che hanno **cambiato una
decisione a valle**, quante sono state ritrattate dopo? È la metrica che *è* il dolore dell'utente. Si misura
solo **longitudinalmente** — richiede di marcare, al momento della consegna, quali claim sono
decision-bearing. *(Da costruire: oggi non lo registriamo.)*

**(b) Calibrazione.** Quando dice `[V]`, aveva ragione? Quando dice `[?]`, il dubbio era fondato? Un modello
che marca `[?]` **tutto** ha calibrazione pessima quanto uno che marca `[V]` tutto — ed è il motivo per cui la
misura è **distribuzionale** (ECE), non per-esempio (#32).

**(c) La consultazione ha CAMBIATO la risposta?** ⚠️ Il reward **non** va su *«ha consultato la wiki»* — quello
è un atto comunicativo e diventerebbe cerimonia pagata ([[../memory|feedback_reward_hacking_principle]] #10).
Va sull'**esito**: la risposta consegnata **contraddice** ciò che la base di conoscenza già sapeva? Se sì è
fallita, che abbia consultato o no.

---

## 5. Cosa ne discende, e dove vive

Questo requisito **non è una classe di training**: è il criterio che ordina le classi. Quelle che lo servono
direttamente esistono già e vanno **rilette sotto questa luce**, non ri-create (#33):

- [[training-taxonomy/class-confabulation-retrieval-failure]] — rileggere la propria memoria invece di confabulare
- [[training-taxonomy/class-prospective-memory]] — persistere il durevole, perché domani sia consultabile
- [[training-taxonomy/class-metacognitive-self-audit]] — la radice metacognitiva
- [[training-taxonomy/class-ground-truth-integrity]] — in quanti modi il ground-truth smette di esserlo
- [[training-taxonomy/class-durable-knowledge-retraction]] — ritirare, potare, **archiviare**, e non toccare ciò che è corrente
- [[concepts/structured-thinking]] — i marcatori `[V]/[A]/[?]`
- [[training-taxonomy/dataset-construction-playbook]] — dove i reward di cui sopra si formalizzano

⚠️ **Ciò che manca e che questo requisito rende urgente** *(dichiarato, non nascosto — #37)*:
1. **il registro delle claim decision-bearing** senza cui la misura (a) non esiste;
2. **la disciplina wiki-first come comportamento addestrato**, non come buona intenzione — oggi non c'è una
   classe che insegni *«consulta prima di asserire»* con reward sull'esito;
3. **il grafo aggiornato**, o la rinuncia esplicita a citarlo come garanzia.

## 6. Vale anche per chi scrive queste righe

⚠️ **Io sono un'istanza del difetto, e recente.** Il **2026-08-04** ho affermato all'utente che il suo
abbonamento non poteva pilotare l'harness — con sicurezza, per categorie, **senza aprire il codice**. Lui
avrebbe deciso su quella base. **Un'ora dopo ho ritrattato**: la funzione c'era, nativa. Stesso schema esatto:
risposta sicura → decisione dell'utente → ritrattazione.

Non è un aneddoto di contorno: **il modello che stiamo costruendo imita un comportamento, e quel
comportamento in questo progetto lo produco io.** Un assistente che ritratta insegna, dai propri trace, a
ritrattare. Perciò questo requisito **non si applica solo al modello addestrato**: si applica **a ogni risposta
data in questo progetto**, e la prima misura di successo è che l'utente smetta di dover rifare il lavoro.

## Links
[[STATO-2026-08-04]] · [[concepts/structured-thinking]] · [[training-taxonomy/dataset-construction-playbook]] ·
[[harness-experiment-log]] · [[model-testbook]] · [[_private/richiesta-affidabilita-2026-08-17]] *(raw)*

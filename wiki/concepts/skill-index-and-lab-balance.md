---
name: skill-index-and-lab-balance
description: "🔴 MISURA + PROPOSTA (2026-08-18) — Risposta alla richiesta E («indice delle skill da iniettare in training + laboratorio bilanciato su tutte le skill, nessuna propensione»). ⭐ L'indice NON va costruito: e' gia' la tassonomia (74 classi) — costruirne un secondo sarebbe una seconda sorgente che diverge (SSOT #16). Cio' che manca e' la colonna «misurabile?». Misurato: **11 classi su 74** hanno un laboratorio eseguibile. Il laboratorio NON e' bilanciato, ed e' la prima volta che qualcuno lo dice con un numero. ⚠️ E il numero l'ho sbagliato DUE volte prima di azzeccarlo (43 -> 5 -> 11): tre perimetri diversi sulla stessa domanda. La difesa che ha funzionato e' stata cambiare DIREZIONE — contare dai lab verso le classi invece che dalle classi verso i lab."
type: concept
status: 🔴 APERTO — misura fatta, il meccanismo e la definizione di «bilanciato» sono proposte (2026-08-18)
tags: [training, eval, coverage, taxonomy, misura, area-processo]
sources:
  - utente TG msg 2088 (2026-08-17), richiesta E — «indice delle skill da iniettare in training (trasferirle nei pesi + far scegliere al modello) + laboratorio bilanciato su tutte le skill, nessuna propensione»
last_updated: 2026-08-18
---

# 🔴 L'indice esiste gia'. Quello che manca e' sapere quali skill sono MISURABILI

## Prima parte — l'indice non va costruito (#33 prima di #16)

La richiesta chiedeva *«un indice delle skill da iniettare in training»*. **Esiste**: e' `wiki/training-taxonomy/`, **74 classi** con padre, reward, negativi e decontaminazione, piu' le aree `area-NN`. Costruire un secondo elenco significherebbe creare una **terza sorgente** che deve restare coerente con le due da cui nasce — cioe' l'errore che abbiamo inseguito tutto il 2026-08-17 (titoli contro contenuto, indice contro disco).

⭐ **Cio' che manca all'indice non e' l'indice: e' UNA COLONNA** — *questa skill ha un modo di essere misurata?* Senza quella colonna, *«iniettarle tutte nei pesi»* e' un elenco di intenzioni: non si puo' dire quali sono entrate e quali no.

## Seconda parte — la misura, e i due numeri sbagliati che l'hanno preceduta

⚠️ Prima di dare la cifra, come ci sono arrivato — perche' il percorso e' il contenuto (#35b: *ogni conteggio e' una misura e ogni misura ha un perimetro*).

| tentativo | cosa ho contato | risultato | perche' era sbagliato |
|---|---|---|---|
| 1 | classi che citano `verifiers/` | **43/74** | la maggior parte cita un **generatore** (`deceptive-task-gen`, `mcq-distractor-gen`) da **riusare**, non un laboratorio che le misura |
| 2 | classi che citano un file `-lab` | **5/74** | ho guardato **una sola direzione**: la citazione spesso sta **nel lab**, non nella classe |
| ✅ 3 | **per ogni lab, quale classe serve** | **11 lab -> 11 classi distinte** | conta dall'**artefatto che esiste**, non da chi dovrebbe nominarlo |

**La difesa che ha funzionato non e' stata guardare meglio: e' stata cambiare DIREZIONE** e aprire i file. E' la stessa lezione del `ls raw/` (#0): il primo controllo era corretto — rispondeva soltanto a **un'altra domanda**.

### Il verdetto `[V] misurato`

**11 classi su 74 hanno un laboratorio eseguibile** — circa **una su sette**. Piu' **3 lab** che servono un concetto o una famiglia invece di una singola classe (`verification-discipline` -> [[verification-discipline-training]] + il suo gold · `injection-suite` -> resistenza a prompt-injection · `transfer-assumption-audit` -> il transfer sotto stagnazione).

Le 11: `accidental-property-removal` · `assumption-audit-both-directions` · `defect-shape-reading` · `exposure-measurement-before-remedy` · `linkage-classification-compatibility` · `artifact-reachability-completion` · `retroactive-decision-propagation` · `right-effort-for-stakes` · `attentional-scope-exit` · `temporal-awareness` · `situation-classification-continuous`.

→ **Il laboratorio NON e' bilanciato.** Non e' un'opinione ed e' la prima volta che c'e' un numero: **63 classi su 74 non hanno oggi nessun modo di essere misurate**, e finora questo non compariva da nessuna parte.

## ⚠️ Secondo difetto trovato: la reciprocita' lab↔classe e' rotta

Gli 11 lab esistono, ma **solo 5 classi li nominano**. Quindi **aprire la pagina di una classe non dice se e' misurabile** — l'informazione c'e', ma sta solo dall'altro lato.

E' **esattamente** il difetto che [[../../harness/tools/check-hierarchy.mjs]] esiste per impedire sul legame **padre↔figlia** (*«la figlia dichiara il padre, il padre non la elenca»*), su un legame diverso per cui **nessuno ha costruito il controllo**. → **Meccanismo proposto** (#17: la lezione diventa meccanismo, non buona intenzione): un controllo di **reciprocita' lab↔classe** nella stessa famiglia dei quattro esistenti — un lab che nomina una classe che non lo nomina e' un legame a senso unico, e fallisce.

## Terza parte — «bilanciato» va DEFINITO, altrimenti non e' verificabile

*«Nessuna propensione»* non e' ancora un criterio: propensione **rispetto a cosa**? Proposta di definizione **falsificabile**:

> **Il laboratorio e' bilanciato quando la copertura non correla con il TIPO DI REWARD della classe.**

Cioe': se le classi con esito oggettivo (**Q** — passa/non passa, misurabile da un verificatore deterministico) sono coperte molto piu' di quelle a giudizio (**L**), il laboratorio **non misura le skill: misura quelle facili da misurare** — e quella e' una propensione **strutturale**, non un caso. Sarebbe la forma piu' insidiosa, perche' ogni singolo lab resta giustificato: e' solo l'**insieme** a essere sbilanciato.

⚠️ **Non ho verificato se la correlazione c'e'.** Guardando le 11 sembrano esserci sia Q sia L (`right-effort-for-stakes` e' L), quindi **non affermo il difetto**: dico che questa e' la domanda da chiudere, ed e' chiudibile con un conteggio sui tag Q/L delle classi coperte contro quelle scoperte.

**Perche' la definizione e' questa e non «una classe, un lab»**: pretendere un lab per ciascuna delle 74 e' un tetto fisso, ed e' il difetto che [[../training-taxonomy/class-consumption-scale-for-budget]] descrive. Alcune classi si misurano meglio **insieme** (un lab su una famiglia), altre non hanno un esito automatizzabile e la loro misura e' un held-out giudicato. Il criterio giusto non e' il conteggio: e' che **la scelta di cosa misurare non sia decisa dalla comodita' di misurarlo**.

## Reco — nell'ordine, e la prima costa quasi zero

1. **Aggiungere la colonna «misurabile?» alla tassonomia**, derivata **dai lab** (direzione che funziona), non dichiarata a mano nelle classi — cosi' non puo' divergere.
2. **Il controllo di reciprocita' lab↔classe** come quinto checker: rende il legame **visibile da entrambi i lati** e impedisce che si rompa di nuovo.
3. ~~**Chiudere la domanda Q-vs-L** con un conteggio sui tag: e' un'ora di lavoro.~~ 🔴 **PROVATO SUBITO, E NON E' ESEGUIBILE COSI'** — e questo e' il risultato, non un intoppo. **Il tag Q/L non esiste a livello di CLASSE**: sta nelle **foglie delle aree** (`area-01` ne ha 13 Q e 8 L), e **nemmeno uniformemente** (`area-03` non ne ha nessuno in quella forma). Nei 74 file di classe: **zero**. → il conteggio richiede **prima** di assegnare Q/L alle classi, che e' un lavoro di giudizio su 74 pagine, non un `grep`.
   ⚠️ **E sotto c'e' una domanda strutturale piu' grossa, che nomino e non risolvo**: **classi** e **foglie-d'area** sono **due assi diversi senza una mappatura esplicita**. Finche' non si sa quale foglia corrisponde a quale classe, *«copertura per tipo di reward»* non e' definita — e nemmeno *«copertura»* tout court, perche' non e' detto che l'unita' giusta da coprire sia la classe.
4. **Solo dopo**, decidere quali lab costruire — perche' la scelta va fatta guardando **il buco**, non l'elenco di cio' che sarebbe bello avere.

## Cosa la ribalterebbe *(#37)*

- Se molte delle 63 scoperte fossero misurabili **da un lab esistente su un'altra classe** (famiglie che condividono l'oracolo), il buco reale sarebbe **piu' piccolo** di 63 e la reco 1 lo mostrerebbe subito.
- Se per *«skill»* lui intendesse i **documenti-skill esterni** (quelli caricati dall'harness) e non le classi della tassonomia, la prima parte cambia: l'indice da costruire sarebbe **quello dei documenti**, e la mappatura documento -> classe diventerebbe il lavoro vero. 👉 **Ambiguita' reale, non risolta**: le due letture portano a due lavori diversi, e la scelta e' sua.

## Residuo dichiarato

Il **11/74** e' contato dai file e verificato cambiando direzione — ma **non ho aperto tutti e 74** i file a mano: se una classe fosse misurata da un lab che non la nomina **e** non e' nominato da lei, non comparirebbe in nessuna delle due direzioni. La correlazione Q/L e' **una domanda posta, non una misura fatta**.

## Links
[[../training-taxonomy/dataset-construction-playbook]] · [[verification-discipline-training]] · [[../training-taxonomy/class-consumption-scale-for-budget]] · [[../todo]] · [[../GOAL]] · [[../REQUISITO-AFFIDABILITA]]

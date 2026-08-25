---
name: presence-absence-minimal-pair-lab
description: "⛔ VALUTAZIONE CRITICA (2026-08-25) del design-lab dell'utente: per ogni traccia due varianti simili-ma-non-identiche, una in cui l'informazione NON e' recuperabile in alcun modo e una in cui lo e', a livelli crescenti di occultamento (palese -> nascosta -> deducibile dal codice), piu' la formalizzazione in documentazione. VERDETTO: ha senso ed e' lo strumento mancante per class-instrument-epistemic-reach, che con le sue 3 figlie NON ha oggi alcun laboratorio. Ma cinque buchi — (1) 🔴 l'assenza e' INDIMOSTRABILE dall'interno, quindi premiare il verdetto e' branch-reward; (2) ai livelli alti le due tracce diventano indistinguibili senza un tetto di ricerca; (3) la formalizzazione e' una SECONDA skill e va scorata a parte; (4) ⭐ manca il TERZO stato, informazione presente ma OBSOLETA — con due soli stati si insegna «cerca finche' trovi, poi fidati»; (5) la coppia stessa e' una scorciatoia se il gemello e' riconoscibile."
type: concept
status: ⛔ PROPOSTA — valutazione consegnata 2026-08-25, il design attende la sua decisione sui 5 punti
tags: [lab, eval, minimal-pair, calibrazione, reward-design, area-processo, proposta]
sources:
  - utente TG msg 2137/2138 (2026-08-25) — il design del lab + «ci sono buchi, mancanze, contraddizioni o cose che stiamo mancando?»
last_updated: 2026-08-25
---

# ⛔ Il lab a coppie presenza/assenza — verdetto e i cinque buchi

## Il verdetto: ha senso, e colma un vuoto verificato

⭐ **La coppia minimale non e' un device nuovo da noi** (la usano gia' `exposure-measurement-before-remedy`, `compositional-reversibility`, `context-over-parametric-authority`, `static-dynamic-evidence-modality` e la `consumption-scale-for-budget` scritta stamattina). **Il contributo dell'idea e' un altro**: applicarla all'asse **presenza/assenza dell'informazione recuperabile**.

**E li' colma un vuoto misurato**: [[../training-taxonomy/class-instrument-epistemic-reach]] — la cui skill-radice e' *«un risultato NEGATIVO e' una proprieta' dello STRUMENTO finche' non dimostri che e' una proprieta' del MONDO»* — e le sue **tre figlie** **non hanno oggi alcun laboratorio** (verificato: non compaiono fra le 11 classi coperte da `check-lab-coverage`). Questo sarebbe il loro.

⭐ **E si incastra con la risposta sulla calibrazione**: la coppia bilanciata e' **esattamente cio' che rende l'ECE misurabile**. Senza coppie non c'e' distribuzione su cui calcolare la calibrazione, e la riparazione anti-collasso ([[evidence-based-certainty-and-observer-training]] §1) resterebbe teorica.

---

## 🔴 (1) Il buco serio: l'assenza e' INDIMOSTRABILE dall'interno

Nella variante-A l'informazione **non c'e'**. Ma un modello **non puo' provare un'assenza**: puo' solo **esaurire le vie che ha**. Quindi il gold *«dice che non c'e'»* premia una **conclusione** che nel mondo reale sarebbe **una scommessa fortunata** — e un modello che tira a indovinare vince meta' delle coppie senza aver cercato.

⚠️ **Ed e' esattamente la trappola #32**: il ramo *presente/assente* e' ≈ funzione diretta del campo che la fixture usa per costruire la variante → grondarlo per-esempio **re-introduce il branch-reward**.

**Riparazione**:
- **per-esempio** si gronda la **COPERTURA DELLA RICERCA** — quali vie ha battuto, leggibile dal trace, e **se quelle vie erano quelle che discriminano** (una ricerca che non poteva trovarlo comunque non conta) — piu' il **residuo dichiarato** (*«ho cercato in X, Y, Z; se esiste sta fuori da li'»*);
- il **verdetto** presente/assente va al **distribuzionale**: coppie bilanciate + **ECE**.

→ Il gold onesto **non e'** *«non c'e'»*: e' ***«ho esaurito le vie disponibili e dichiaro il residuo»***. Che e' anche, letteralmente, il comportamento che lui vuole da me.

## (2) Ai livelli alti le due tracce diventano indistinguibili — serve un tetto

La scala che propone (palese → nascosta → **deducibile dal codice**) ha un effetto che cresce col livello: **piu' l'informazione e' sepolta, piu' le due varianti costano lo stesso a distinguere**. Al livello massimo, *«sepolta in fondo al codice»* e *«assente»* sono separabili solo esaurendo la ricerca — e il lab finisce per **premiare chi cerca all'infinito**.

**Riparazione**: la fixture dichiara un **tetto di ricerca** (turni/chiamate), e superarlo **senza dichiarare il residuo** e' fallimento. → si aggancia a [[../training-taxonomy/class-consumption-scale-for-budget]]: *quanto vale la pena cercare* e' una decisione di **budget**, e qui diventa parte della misura invece che un fastidio.

## (3) La formalizzazione in documentazione e' una SECONDA skill

*«Una volta presa dal codice va prima formalizzata nella documentazione, se il protocollo di sviluppo lo prevede»* — corretto, ma e' **un'altra classe**: [[../training-taxonomy/class-design-artifact-lifecycle]] (scritta stamattina) e [[../training-taxonomy/class-knowledge-base-curation]].

⚠️ **Metterla nello stesso punteggio confonde due misure**: se il modello perde, non sai se ha sbagliato il **recupero** o la **formalizzazione**. → **due scorer separati sullo stesso trace**, mai un voto unico. *(E la condizione «se il protocollo lo prevede» e' essa stessa un test: nelle fixture in cui il protocollo **non** lo prevede, formalizzare comunque e' **spreco** — il negativo simmetrico, #21.)*

## ⭐ (4) Cosa manca davvero: il TERZO stato — presente ma OBSOLETO

La sua coppia ha due stati: **recuperabile** e **assente**. Manca quello che ci ha morso davvero: **l'informazione c'e', la trovi, ed e' SBAGLIATA** — stantia, superata, contraddetta altrove.

⚠️ **Con due soli stati si insegna: *«cerca finche' trovi, poi fidati»*.** Che e' un difetto peggiore di quello che il lab vuole togliere, perche' produce sicurezza **fondata su un artefatto reale** — la forma piu' difficile da smentire. E' esattamente cio' che e' successo qui il 2026-08-17: intestazioni che dicevano *«ATTENDE»* mentre il corpo diceva *«DECISO»*, e la ricerca **trovava** la riga sbagliata.

→ **Terna, non coppia**: `assente` · `presente-e-valido` · `presente-ma-superato`. Il terzo si aggancia a [[../training-taxonomy/class-context-over-parametric-authority]] e alla faccia *archivia* di [[../training-taxonomy/class-durable-knowledge-retraction]].

## (5) La coppia stessa puo' diventare la scorciatoia

Se le due varianti nascono dallo stesso template, la variante-assente porta una **firma** (una funzione in meno, un file piu' corto, un commento che manca). Il modello puo' imparare a **riconoscere il gemello** invece di cercare — e otterremmo un punteggio alto su una skill che non c'e'.

**Riparazione**: randomizzare la superficie ([[runtime-symbol-randomization-training]], gia' in uso) **e** tenere una quota di **tracce spaiate** (senza gemella), cosi' che *«esiste una variante opposta»* non sia un indizio disponibile.

---

## Cosa NON e' un buco *(dichiarato, per non farlo sembrare un si'-a-tutto)*

L'intuizione centrale — **due situazioni simili possono portare a esiti diversi, e distinguerle richiede di guardare** — e' corretta e ben posta, ed e' il motivo per cui il design regge nonostante i cinque punti. Nessuno dei cinque tocca l'idea: toccano **come si assegna il punteggio** e **quanti stati servono**.

## Residuo dichiarato

**Niente e' stato costruito.** Il vuoto di laboratorio su `instrument-epistemic-reach` e' `[V]` (letto da `check-lab-coverage`). I cinque punti sono **argomenti di design**, non esiti sperimentali (`[A]`), tranne il (4) che ha un'**istanza reale osservata** in questo repo. Il costo: i lab esistenti stanno fra **126 e 186 righe** — questo, con terna + tetto + due scorer, sta **sopra**.

## Links
[[../training-taxonomy/class-instrument-epistemic-reach]] · [[../training-taxonomy/class-consumption-scale-for-budget]] · [[../training-taxonomy/class-design-artifact-lifecycle]] · [[../training-taxonomy/class-durable-knowledge-retraction]] · [[evidence-based-certainty-and-observer-training]] · [[skill-index-and-lab-balance]] · [[runtime-symbol-randomization-training]] · [[../todo]]

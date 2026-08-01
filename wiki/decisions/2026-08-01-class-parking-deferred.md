---
name: 2026-08-01-class-parking-deferred
description: "Waiting-list dinamica delle classi a loss bassa — decisione DELEGATA a me dall'utente (msg 2062, criterio - la performance migliore, altrimenti si lascia stare a priori). Verdetto - NON costruire il parcheggio ora; SÌ al ripasso, che è metà della sua idea ed è pratica standard di cui abbiamo bisogno comunque per il curriculum a 4 fasi. Il prerequisito che entrambe richiedono (valutazione held-out PER CLASSE) va costruito a prescindere, perché senza non sappiamo se un training è riuscito. Riapertura con trigger scritto e falsificabile."
type: decision
status: decisa 2026-08-01 — delega esplicita dell'utente (msg 2062)
tags: [training, curriculum, sampling, overfitting, catastrophic-forgetting, eval, area-training, decisione-delegata]
sources:
  - utente TG msg 2019 (2026-07-31) — l'idea originale + richiesta di grill-me
  - utente TG msg 2059 — spiegazione estesa del meccanismo (parcheggio + rotazione 1 item/epoca)
  - utente TG msg 2062 — delega - "l'obiettivo è sempre avere la performance migliore, se non la garantisce o non ha neanche una chance la lasciamo stare a priori. Dimmi tu"
last_updated: 2026-08-01
---

# Parcheggio dinamico delle classi apprese — rinviato, con il ripasso adottato

> **Decisione delegata**, non presa d'iniziativa: *«se ci sono tecniche migliori allora usiamo
> quelle … l'obiettivo è sempre avere la performance migliore; se non la garantisce o non ha
> neanche una chance, la lasciamo stare a priori. Dimmi tu su questo»* (msg 2062).

## L'idea, come l'ha formulata l'utente

Durante il training alcune classi convergono prima (loss bassa) mentre altre hanno ancora bisogno.
Continuare su tutte indistintamente rischia di **sovra-addestrare** le prime. Proposta: togliere le
classi già apprese dall'insieme attivo, metterle in una **lista d'attesa**, e a ogni epoca mostrarne
**un item** a rotazione come rinfresco, mentre le classi ancora acerbe continuano il training pieno.

## Verdetto — e la separazione che lo rende utile

**La sua idea contiene due meccanismi distinti, con destini diversi.**

| | Cosa fa | Decisione |
|---|---|---|
| **PARCHEGGIO** — togliere una classe dal training | speculativo, con 5 modi di rompersi (sotto) e dominato da alternative più economiche | ⛔ **non ora** |
| **RIPASSO** — tenere una piccola quota di dati già appresi nel mix | pratica **standard** contro la dimenticanza, e ci serve **comunque** per il curriculum a 4 fasi già pianificato | ✅ **adottato come default** |

⭐ **La separazione è il contributo vero di questa analisi**: metà della sua idea non è speculativa
affatto — è ciò che si fa normalmente e che noi **dovremo fare a prescindere**, perché un curriculum
a fasi dimentica le fasi precedenti se non le ripassa. L'altra metà è il macchinario.

## Perché il parcheggio non ora

1. **Il trigger non regge.** *Loss bassa ≠ capacità acquisita*: la loss misura la predizione di
   **quel testo**, e scende anche per memorizzazione — che è massima proprio nelle epoche avanzate,
   cioè quando decideresti di parcheggiare. Su classi di **ragionamento** un modello può riprodurre
   la catena gold quasi verbatim e fallire un held-out.
2. **Il rischio è invertito.** Togliere una classe non la protegge dall'overfitting: le toglie il
   gradiente che la teneva ferma, mentre i pesi condivisi continuano a muoversi per le altre. Il
   pericolo reale è la **dimenticanza**, non l'eccesso di apprendimento.
3. **La rotazione non scala.** Con ~70 classi, 20 parcheggiate significano un ripasso ogni 20
   epoche. Non tiene nulla.
4. **Le loss non sono confrontabili fra classi** (lunghezza del target, entropia del formato) → non
   esiste una soglia unica.
5. **Ciò che si parcheggia smette di dare segnale** → non ci si accorge se degrada; e con una soglia
   sola il sistema entra/esce in continuazione (serve isteresi — stesso difetto già **misurato** da
   noi in [[../harness-experiment-log]] F39 sul flip-flop di `adaptiveKeepTurns`).

**E soprattutto è dominato**: contro il sovra-addestramento le leve standard sono **meno epoche**,
**early-stopping su held-out** e **dosaggio del mix deciso a monte**. Quest'ultima ottiene gran parte
dello stesso effetto — non serve un sistema dinamico per smettere di sovra-addestrare una classe, se
quella classe non ha una quota sproporzionata del dataset fin dall'inizio.

## Cosa si costruisce invece (e serve comunque)

⭐ **Valutazione held-out PER CLASSE, generativa.** Non è il prerequisito del parcheggio: è il
prerequisito di **tutto**. Senza non sappiamo se un training è riuscito, non possiamo fare
early-stopping, non possiamo dosare il mix, e non sappiamo se una classe è appresa. È l'unica misura
di cui *entrambi* i rami hanno bisogno — quindi si costruisce **prima della decisione**, e la
decisione poi si prende sui dati anziché a parole. *(Regola: una misura si costruisce quando serve a
una decisione — qui ne serve almeno quattro.)*

## Condizione di riapertura (falsificabile, scritta ora)

> Si riapre **se e solo se**, con le curve held-out per classe in mano, si osserva che un
> **sottoinsieme non trascurabile** di classi ha smesso di migliorare mentre altre stanno ancora
> salendo in modo apprezzabile — cioè le curve sono **sfalsate**, non solo di rumore.

Se le curve si muovono insieme, l'idea non serviva. Se sono sfalsate, il parcheggio si guadagna la
propria complessità **e** avrà finalmente un trigger affidabile (l'accuratezza, non la loss).
*(Soglie numeriche volutamente non fissate: sceglierle adesso sarebbe inventare un oracolo prima di
avere i dati. Si fissano guardando la dispersione reale delle curve.)*

## Cosa NON dice questa decisione

- **Non** dice che l'idea sia sbagliata: dice che oggi non ha un trigger affidabile né un vantaggio
  dimostrabile sulle alternative economiche, e che il suo mezzo-fratello (il ripasso) è già adottato.
- **Non** è misurata: nessun esperimento è stato eseguito. È una valutazione di progetto sulla base
  di come funzionano loss e curriculum, dichiarata come tale.

## Links
- [[../todo]] — voce di tracciamento + il trigger di riapertura
- [[../harness-experiment-log]] F39 — l'isteresi mancante, già pagata una volta
- [[../training-taxonomy/dataset-construction-playbook]] — dove finirà il dosaggio del mix

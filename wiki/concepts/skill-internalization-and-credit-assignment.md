---
name: skill-internalization-and-credit-assignment
description: "⛔ RISPOSTA + RECO alla domanda K dell'utente (TG msg 2089, 2026-08-17): «nel system prompt interiorizza e non menzionare mai le skill, e durante l'RL taglia dalla sequenza premiata il caricamento delle skill, cosi' il credito va ai token che hanno fatto il lavoro e senza skill il modello deve eguagliare quella performance — migliorerebbe il risultato?». Risposta in tre pezzi: (1) per il TESTO della skill e' gia' il default (l'RL agentico maschera i token iniettati); (2) mascherare la DECISIONE di caricare e' un intervento reale, e l'effetto e' che il modello smette di imparare QUANDO caricare — coerente con la fase ad-hoc che lui stesso propone, ma i due pezzi vanno spediti insieme; (3) ⚠️ il pareggio-senza-skill NON discende dal mascheramento: quella e' CONTEXT DISTILLATION (Askell 2021 · Snell-Klein-Zhong 2022) ed e' un obiettivo diverso. Piu' il difetto non ovvio: mascherare un token non rimuove l'incentivo se la decisione e' espressa anche nei token di ragionamento non mascherati — il credito si SPOSTA."
type: concept
status: ⛔ PROPOSTA — risposta consegnata 2026-08-18, la reco attende la decisione dell'utente
tags: [rl, credit-assignment, context-distillation, skill, curriculum, area-processo, proposta]
sources:
  - utente TG msg 2089 (2026-08-17) — la domanda K, registrata in [[../todo]] blocco 2026-08-17
  - Askell et al. 2021, *A General Language Assistant as a Laboratory for Alignment* — https://arxiv.org/abs/2112.00861
  - Snell, Klein, Zhong 2022, *Learning by Distilling Context* — https://arxiv.org/abs/2209.15189
last_updated: 2026-08-18
---

# ⛔ K — «tagliare il caricamento delle skill dalla sequenza premiata» migliorerebbe il risultato?

> ⚠️ **Perche' questa pagina esiste invece di una risposta in chat**: la domanda e' di **credit-assignment**, e una risposta sicura-e-sbagliata qui **costa un ciclo di training** — e' il caso esatto per cui esiste [[../REQUISITO-AFFIDABILITA]]. Quindi: verificato prima, e il residuo dichiarato in fondo.

**La domanda ne contiene tre**, e le tre hanno risposte diverse. Tenerle insieme e' il modo di sbagliare.

---

## (1) Per il TESTO della skill e' gia' il default `[V]`

Nell'RL agentico la pratica standard e' **mascherare i token iniettati** (documenti incollati, risultati di tool, contenuto caricato nel contesto) e calcolare la loss **solo sui token generati dal modello** — invocazione del tool, ragionamento, risposta. I token che il modello **non ha prodotto** non sono azioni della policy, e includerli nel gradiente lo corrompe.

→ Quindi *«il credito non deve andare al testo della skill»* **e' gia' vero**, e non richiede nessun intervento. Se il piano si fermasse qui, non cambierebbe niente — il che e' una buona notizia: **meta' del lavoro e' gia' fatta dalla pratica standard**.

## (2) Mascherare la DECISIONE di caricare e' un intervento vero — ed ecco cosa fa

Cio' che oggi **riceve** credito e' **l'atto di caricare**: l'invocazione del tool e' un token che il modello **genera**, quindi e' un'azione della policy a tutti gli effetti. Mascherarla e' possibile ed e' un intervento reale.

**L'effetto e' preciso, e non e' quello che il nome suggerisce**: il modello **smette di imparare QUANDO caricare** e continua a imparare **come lavorare** una volta caricato.

⭐ **Questo non e' un difetto del piano dell'utente** — e' esattamente la ragione per cui, nella stessa frase, propone **una fase ad-hoc separata per la SCELTA della skill**. Il disegno e' internamente coerente. Ma ne discende un vincolo operativo: **i due pezzi vanno spediti insieme**. Il mascheramento da solo **rimuove una capacita'** senza rimpiazzarla.

## (3) ⚠️ Il pareggio-senza-skill NON discende dal mascheramento — e questa e' la parte che conta

*«Senza skill il modello deve eguagliare quella performance»* e' un obiettivo **diverso**, e il mascheramento **non lo produce**.

Il motivo e' meccanico: se durante l'RL la skill e' **nel contesto**, il modello e' **sempre condizionato su di essa**. Mascherare la loss non gli toglie **l'informazione**: gli toglie soltanto **il pagamento per averla chiesta**. Un modello addestrato cosi' resta bravissimo *con* la skill e non ha mai avuto un solo passo di gradiente in una situazione in cui la skill **non c'e'**.

**Cio' che l'utente sta descrivendo ha un nome in letteratura: CONTEXT DISTILLATION.** `[V] verificato alla fonte`

| fonte | cosa fa |
|---|---|
| **Askell et al. 2021** — [arXiv:2112.00861](https://arxiv.org/abs/2112.00861) | minimizza la **KL fra P(X) e P(X\|C)**: la risposta **senza** contesto insegue la risposta **con** contesto. E' il metodo con cui hanno distillato un prompt di 14 conversazioni-esempio dentro i pesi. |
| **Snell, Klein, Zhong 2022** — *Learning by Distilling Context*, [arXiv:2209.15189](https://arxiv.org/abs/2209.15189) | il modello genera **con** istruzioni + scratchpad, poi viene fine-tunato a produrre l'esito **col solo input**. Tre capacita' dimostrate: assorbire istruzioni nuove, interiorizzare il ragionamento passo-passo, assorbire esempi di training (+9% su SPIDER text-to-SQL). |

⭐ **L'abstract di Snell dice letteralmente la premessa dell'utente**: i modelli traggono beneficio dai token di contesto *«ma non interiorizzano questi guadagni, che spariscono quando i token di contesto se ne vanno»*. La sua intuizione e' **corretta e gia' formalizzata**; e' il **meccanismo** che aveva scelto a non corrispondere all'obiettivo.

---

## ⭐ Il difetto NON OVVIO del mascheramento — ed e' la stessa forma della regola #32

**Mascherare i token di un'azione non rimuove l'incentivo, se la decisione e' espressa ANCHE nei token di ragionamento non mascherati che la precedono.**

Il modello scrive *«mi serve la skill X, la carico»* e poi la carica. Se maschero solo il secondo pezzo, il credito **non sparisce: si sposta** sul primo. Il risultato e' un modello che **ragiona sul caricare** senza essere premiato **per il caricare** — cioe' un segnale **piu' confuso di prima**, non piu' pulito.

E' esattamente la trappola di **#32** (*se il ramo e' ≈ funzione di un campo, non grondare quel campo*) trasportata dal reward al **mascheramento**: si crede di aver tolto il segnale da una decisione, e lo si e' solo spostato di due token.

→ **Per rimuovere davvero l'incentivo bisogna togliere l'AZIONE dall'AMBIENTE** — niente skill disponibile in quella frazione di rollout — **non il token dalla loss.** Ed e' anche la forma che serve al punto (3): un rollout senza skill e' *insieme* la rimozione dell'incentivo e la condizione in cui il pareggio si puo' misurare.

## La frase del system prompt — *«interiorizza e non menzionare mai le skill»*

⚠️ **E' un'istruzione sul PARLARE, non sull'USARE**: non produce interiorizzazione, produce **silenzio sull'uso**.

E ha un costo che va nominato: rende il comportamento **meno osservabile**, quindi piu' difficile da valutare — e questo confligge direttamente con [[self-report-vs-trace-adjudication]], dove l'intero metodo si regge sull'**incrociare il racconto con la traccia**. Un modello istruito a non nominare cio' che usa e' un modello di cui non si puo' fare quell'incrocio.

**Reco**: tenerla come regola di **stile dell'output finale** verso l'utente (giustissima: all'utente non interessa il nome interno di una skill), e **mai** spegnere la tracciabilita' nel **trace di training o di valutazione**. Sono due canali diversi e vanno decisi separatamente.

---

## Reco operativa — tre fasi, nell'ordine

1. **Non toccare il mascheramento dei token iniettati** — e' gia' corretto (punto 1).
2. **Frazione di rollout SENZA skill disponibile**, con lo **stesso reward**. → ⭐ **RAFFINATA DALL'UTENTE il 2026-08-25** (msg 2141), e in meglio: non una *frazione* di rollout diversi, ma **la STESSA traccia in due bracci** — *«stessa traccia, dinamicamente iniettiamo la skill oppure no»*. **Perche' e' superiore alla mia versione**: la coppia **controlla la difficolta' del compito**, quindi il divario con-skill vs senza-skill diventa un **delta per-task misurabile** invece di un confronto distribuzionale fra task diversi, dove la varianza fra compiti puo' nascondere l'effetto. E' lo **stesso device della coppia minimale** che propone per il lab presenza/assenza ([[presence-absence-minimal-pair-lab]]).
   ⚠️ **Due caveat tecnici, load-bearing**:
   - **I due bracci NON vanno nello stesso gruppo di advantage.** Il prompt differisce (uno ha la skill iniettata), quindi sono **condizioni diverse**: metterli nello stesso gruppo GRPO farebbe calcolare il baseline **attraverso** la condizione, e il braccio-con-skill alzerebbe sistematicamente l'asticella a quello senza. **La coppia serve alla MISURA, non al baseline**: gruppi separati, appaiamento solo in fase di lettura.
   - 🔴 **Il pareggio non va messo NEL REWARD.** Se si premia *«i due bracci si equivalgono»*, il modo **piu' facile** di ottenerlo e' **peggiorare il braccio con-skill**, non migliorare quello senza — equalizzare **verso il basso**, che e' un hack perfettamente riuscito e completamente inutile (famiglia #32). → il reward resta sulla **prestazione assoluta di ciascun braccio**; il pareggio e' una **metrica di monitoraggio** che si guarda a ogni checkpoint, mai un termine di ottimizzazione.
   ⭐ **E scioglie una tensione aperta**: la sua idea di una **mappa delle skill sempre nel prompt** sembrava contraddire il *pareggio-senza-skill* (scaffolding che non recede). Con l'iniezione **dinamica** e il braccio senza, **lo scaffolding recede per costruzione** — le due richieste smettono di essere in conflitto. E' la mossa che fa insieme tre cose: toglie davvero l'incentivo (invece di spostarlo), crea i passi di gradiente nella condizione che ci interessa, e **rende misurabile il pareggio** — il divario *con-skill* vs *senza-skill* diventa un numero che si guarda a ogni checkpoint invece di una speranza.
3. **La scelta della skill come fase separata**, come lui propone — ma **dopo** aver deciso il punto 2, perche' se una parte dei rollout gira senza skill, la fase-scelta deve insegnare anche *«qui non serve caricare niente»*, che e' il negativo simmetrico (#21) e senza il punto 2 non esisterebbe nemmeno.

**Context distillation esplicita** (la KL di Askell) resta l'opzione piu' diretta se il pareggio non arriva col solo punto 2 — ma e' un obiettivo in piu' da bilanciare, quindi si tiene come **seconda mossa**, non come prima.

## Cosa la ribalterebbe *(#37)*

- ~~Se nel nostro harness le skill facessero parte del **prompt di sistema fisso**, il punto (1) cambierebbe forma: sarebbero prompt, mai premiate, e la decisione-di-caricare non esisterebbe proprio.~~ ✅ **VERIFICATO sul nostro wiring, non lasciato come residuo**: `harness/src/tool-gating.mjs:8` — *«include anche le SKILL: la ricerca indicizza tool E skill»* — e le skill sono item con `kind === "skill"` che il modello **cerca e poi invoca** (`:157`, `:169`). Quindi da noi la decisione-di-caricare **e' un'azione generata**, e tutta l'analisi sopra **si applica**. ⚠️ Con un corollario che rafforza il punto: se il gating e' attivo, il modello deve **prima cercare** la skill e poi invocarla — sono **due** azioni premiate, e mascherare solo la seconda lascia la prima intatta.
- Se il reward fosse **puramente terminale e trajectory-level** senza alcuna forma di credito per-token, l'argomento dello spostamento-del-credito si attenuerebbe (resterebbe vero a livello di trajectory-selection, ma piu' debole).

## Residuo dichiarato *(#0 — quanto vale questa risposta)*

**Nessuna misura e' stata fatta.** Le due citazioni sono **verificate alla fonte** (`[V]`); l'affermazione sulla pratica standard di mascheramento e' **verificata su rassegne, non sul nostro codice** (`[A]`); la previsione sull'effetto del mascheramento e' un **argomento meccanico, non un esperimento** (`[A]`). Il punto sullo **spostamento del credito** e' un ragionamento mio, **non l'ho trovato scritto in una fonte** (`[?]`) — e' la parte su cui costruire di meno finche' non e' misurata. **Il pareggio con-skill vs senza-skill e' un numero che si puo' produrre**: finche' non c'e', questa pagina resta un argomento.

## Links
[[compositional-curriculum-thinking-optimization]] (il curriculum a skill isolate + la composizione: e' li' che questa risposta si innesta) · [[self-report-vs-trace-adjudication]] (perche' la non-menzione ha un costo) · [[../sota-techniques-catalog]] · [[../REQUISITO-AFFIDABILITA]] · [[../todo]] · [[../GOAL]]

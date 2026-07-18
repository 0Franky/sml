---
name: class-static-dynamic-evidence-modality
description: Classe (figlia (b) di instrument-epistemic-reach) — la MODALITA' dell'evidenza. Leggere il codice risponde a un ∀ approssimato (vale per ogni esecuzione, ma solo per cio' che il testo mostra); eseguirlo risponde a un ∃ esatto (questo e' successo davvero, ma solo su questo campione). Sono domande DIVERSE, e nessuna delle due si converte nell'altra. Tre facce - D1 statico-letto-come-dinamico (GIA' COPERTO, si riusa la fixture FX-dynamic del gold area02-3.2, #16); D2 dinamico-letto-come-universale, cioe' "non si riproduce quindi non c'e' il bug" (ZERO occorrenze in tassonomia - il buco vero); D3 il polo POSITIVO pro-statica, quando dimostrare chiude e eseguire no (senza il quale "esegui sempre" e' l'hack che passa). Origine - roadmap 2026-07-16 B3, ristrutturazione ratificata utente ("sono d'accordo", opzione 2).
type: training-class
tags: [reasoning, metacognition, instrument-reach, static-analysis, dynamic-analysis, reproducibility, negative-result, area-03, area-05, area-13, child-class, held-out, proposta]
last_updated: 2026-07-18
---

> # ⛔ NON VALIDATA — **PROPOSTA**, mai revisionata (giro-0)
> **NON usare per il training.** Scritta il **2026-07-18**. La **ratifica utente** del 2026-07-16
> (*"sono d'accordo"*, opzione 2) copre **l'esistenza di questa figlia e il suo posto nell'albero** — **non**
> il contenuto, che nessuno ha letto (#26). Le classi sorelle hanno prodotto findings a **ogni** giro fino al
> terzo: l'aspettativa corretta qui non e' *"e' pulita"*, e' *"non e' ancora stata guardata"*.
> Un difetto qui **si stampa nei pesi** (#22).

# Classe (figlia b) — LO STRUMENTO RISPONDE A UN'ALTRA DOMANDA (statico ⇄ dinamico)

> **Ruolo** (#20): **Padre**: [[class-instrument-epistemic-reach]] — questa ne e' la **figlia (b)**, la
> posizione **MODALITA'** del suo asse. **Sorella**: [[class-tool-perception-fidelity]], posizione **RISOLUZIONE**.
> **Il discriminante, in una riga** (il contratto e' nel padre): la' il rimedio e' **guardare MEGLIO** (stesso
> oggetto, strumento piu' fedele); **qui** e' **guardare ALTROVE** (oggetto diverso). Test:
> *"con risoluzione infinita la questione sarebbe chiusa?"* — la' **si'**, qui **no**, perche' l'informazione
> non e' nell'oggetto che sto osservando.

---

## Il gap

Il codice e' **due oggetti**, non uno:

- il **testo del programma** — finito, interamente leggibile, e cio' che se ne ricava vale (in linea di
  principio) per **ogni** esecuzione: un `∀` **approssimato** (approssimato perche' il testo non determina da
  solo cio' che accadra': stringhe, riflessione, input, ambiente, tempo);
- l'**insieme delle sue esecuzioni** — infinito, campionabile, e cio' che se ne ricava e' **esatto** ma vale
  solo per il campione osservato: un `∃`.

**Non si convertono.** Nessuna quantita' di lettura produce un `∃` (*"e' successo davvero"*); nessuna quantita'
di esecuzioni produce un `∀` (*"succede sempre / non succede mai"*). Il fallimento e' **convertirli in
silenzio** — prendere il risultato di una modalita' come risposta alla domanda dell'altra.

### Le tre facce, e quanto ciascuna e' gia' coperta

- **D1 — statico letto come dinamico** (*"il grep non trova ⇒ nessuno lo usa"*). ✅ **GIA' COPERTO, e bene.**
  **NON lo riscrivo** (#16): vive nella fixture **`FX-dynamic`** di
  `gold-example-area02-3.2-dep-check.expanded.md:81` («ma via dispatch string-based pinnato») — `parse` non e'
  importato staticamente ma risolto per stringa via `getattr`, e l'oracolo del danno **esegue il dispatch**:
  `gold-example-area02-3.2-dep-check.expanded.md:87` («il verifier *esegue* il dispatch, non si fida del grep
  statico»). Questa classe **eredita quella fixture** come istanza-ancora di D1 e **non ne genera di nuove**
  finche' non serva. *(La stessa faccia compare anche in `gold-example-area02-criticality.expanded.md:488` e
  nei template `area02-leaf-*.delta.md`: coperta in piu' punti, non da duplicare.)*
- **D2 — dinamico letto come universale** (*"non si riproduce ⇒ non c'e' il bug"*). 🔴 **VUOTO. E' il buco
  vero.** Verificato eseguendo su `wiki/training-taxonomy/` (`grep -rn -i "non si riproduce\|non riproducibile\|irriproducibile\|heisenbug\|non riesco a riprodurre"` su `class-*.md gold-*.md area-*.md`): **4 hit, 0 pertinenti** — bug-triage per componente, scope di una pipeline dati, *"un secret non si RIPRODUCE mai in chiaro"*, e un deadlock di migrazione (che tratta il non-determinismo come **rischio**, mai come **problema epistemico del negativo**). `[EXTRACTED]`
- **D3 — il polo POSITIVO pro-statica** (*quando dimostrare CHIUDE e eseguire no*). 🔴 **VUOTO.** E non e' un
  completamento cosmetico: **senza D3, `"esegui sempre"` e' l'hack che passa** — una policy fissa a
  intelligenza zero che prende D1 e D2 in pieno e non richiede alcun giudizio. La roadmap lo dice esattamente
  cosi': `wiki/roadmap-2026-07-16.md` («classe nuova confermata (48 classi, zero la nominano)»).

**Logica astratta condivisa dalle tre**: *ogni modalita' di evidenza risponde a un quantificatore. Prima di
concludere, chiedi quale quantificatore ti serve — e non farti dare un `∃` quando ti serve un `∀`, ne'
viceversa.*

---

## Cosa dice DAVVERO la wiki oggi (verificato eseguendo, non riportato)

- 🔴 **0 classi su 50** nominano l'asse statico/dinamico. Verificato:
  `ls class-*.md | wc -l` → **50**; `grep -rln -i "analisi statica\|statico vs dinamico\|statica vs dinamica" class-*.md` → **0 file**. `[EXTRACTED]`
- ✅ **D1 e' coperto in 4 punti** e la copertura e' **eseguibile**, non narrata (§Il gap, D1). Per questo la
  classe **non lo ri-costruisce**: il budget va su D2/D3.
- 🟡 **Adiacenti che NON coprono D2**: [[class-stagnation-recovery]] (insistere dopo che lo strumento ha
  risposto) tocca il *dopo*, non il *significato del negativo*; [[class-confabulation-retrieval-failure]]
  (recupero fallito) e' il negativo di una **memoria**, non di una **misura**;
  [[class-independent-verification-integrity]] e' l'integrita' del **canale** di verifica, non la **portata**
  dello strumento. Nessuna e' sbagliata; nessuna insegna che *"non si riproduce"* e' un dato sullo strumento.

**Distinzione richiesta dalla REGOLA ZERO**: quanto sopra e' **assente / non-enumerato / adiacente-ma-altro**.
**Nulla e' attivamente sbagliato** — non ho trovato una riga che insegni il contrario, e non lo affermo.

---

## La FIXTURE-MADRE — eseguita, non ipotizzata

> Tutto cio' che segue e' stato **eseguito** (Python 3.10.11, Windows) prima di essere scritto (#22). I numeri
> sono misure, non stime. Gli script vivono nello scratchpad di sessione, **non nel repo** → vanno
> **ri-materializzati** in `harness/verifiers/` prima di generare a volume (→ §Caveat, TODO tracciato).

Un contatore condiviso incrementato da 4 thread, `30000` iterazioni ciascuno, atteso `120000`.
L'incremento e' un **read-modify-write non sincronizzato** — **racy per costruzione, dimostrabile leggendo**.

Due varianti, **semanticamente identiche**: cambia **solo dove cadono gli a-capo**.

```python
def w_oneline():                       def w_threelines():
    for _ in range(N):                     for _ in range(N):
        v = box[0]; v = v + 1; box[0] = v      v = box[0]
                                               v = v + 1
                                               box[0] = v
```

**Matrice eseguita** (5 ripetizioni per cella, processi indipendenti):

| | senza strumento (`plain`) | sotto `sys.settrace` (`traced`) |
|---|---|---|
| **`w_oneline`** (racy) | race osservata **0/5** | race osservata **0/5** |
| **`w_threelines`** (racy) | race osservata **0/5** | race osservata **5/5** |

*(Il polo `traced`+`w_threelines` e' stabile: **15/15** su 3 processi indipendenti — valori osservati
`~44000/120000`, cioe' **oltre il 60% degli incrementi perduti**. Il polo `plain` e' altrettanto stabile:
**0/20**.)*

### Perche' questa matrice e' il cuore della classe

1. **Entrambe le funzioni hanno lo STESSO bug** — lo dice la lettura del codice, ed e' vero per costruzione.
2. **`plain` dice «nessun bug» su entrambe.** → chi conclude *"non si riproduce ⇒ non c'e'"* sbaglia **due
   volte su due**. **Questo e' D2, misurato.**
3. **`traced` dice «bug catastrofico» su una e «nessun bug» sull'altra.** Il verdetto dello strumento **non
   traccia la correttezza: traccia la formattazione del sorgente** — `settrace` emette un evento *per riga
   fisica*, quindi tre righe aprono fra `read` e `write` una finestra che una riga non apre. **Il verdetto
   dinamico e' funzione di una variabile semanticamente irrilevante.**
4. **Quindi nessuna delle due esecuzioni chiude la questione.** A chiuderla e' l'**argomento statico**:
   *RMW non sincronizzato su stato condiviso mutabile ⇒ racy per ogni interleaving, osservato o meno.*
   **Questo e' D3**, e arriva dalla stessa fixture che produce D2.

> ⚠️ **REGOLA ZERO, istanza mia, dentro questo file.** La mia **prima** ipotesi era l'opposta —
> *"lo strumento SOPPRIME la race"* (Heisenbug classico: il debugger rallenta, la finestra si chiude) — e la
> prima esecuzione sembrava confermarla. Era **falsa**: `settrace` non sopprime la race, la **fabbrica**.
> Poi due script che credevo equivalenti hanno dato `5/5` e `0/10`, e la tentazione era chiamarlo *"rumore
> stocastico"*. Non lo era: era una **differenza di formattazione**, isolata con un esperimento a variabile
> singola (`fmt.py`). **Se mi fossi fermato al primo numero che confermava** avrei costruito l'intera classe su
> un meccanismo inesistente. E' il livello-2 di #0: una misura reale, che rispondeva a un'altra domanda.

---

## La skill-target (segnale preciso e falsificabile)

**Trigger**: sto per convertire il risultato di **una** modalita' di evidenza in una conclusione che
appartiene all'**altra**.

### (i) D2 — un negativo dinamico non e' un universale
*"Non si riproduce"* / *"il test passa"* / *"in produzione non e' mai successo"* dice: **su questo campione,
in queste condizioni, non l'ho osservato.** Le ipotesi ammissibili sono **due**:
- (a) il difetto non c'e' → *(possibile! → N3)*;
- (b) **il mio campione non copre la condizione che lo scatena** (timing, input, ambiente, scala, carico,
  ordine) → l'unica cosa che puo' rispondere e' un **argomento sul meccanismo**, non un'altra esecuzione.

Il difetto non e' ignorare che le race esistano: e' **non generare mai l'ipotesi (b)** e chiudere il ticket.

### (ii) D3 — quando la statica e' LA risposta (e l'esecuzione non lo e')
Eseguire **non e' sempre disponibile ne' sempre corretto**. La lettura/dimostrazione e' la modalita' giusta,
non un ripiego, quando:
- serve un **∀** (*"per OGNI input"*, *"in OGNI ordine"*, *"su OGNI ambiente"*) — nessun campione lo da';
- serve un'**enumerazione esaustiva** (tutti i punti da toccare in un refactor, tutti i chiamanti, tutti i
  rami di un `match`);
- eseguire e' **impossibile** (non compila, manca l'ambiente/il segreto, il sistema e' in produzione),
- **pericoloso** (l'esecuzione ha effetti irreversibili: la migrazione, il `--force`, il pagamento),
- **costoso** (ore di run, budget, o — vedi la fixture-madre — **l'osservazione altera il fenomeno**).

### (iii) La mossa completa
Non *"esegui"* ne' *"leggi"*: **nomina il quantificatore che ti serve, scegli la modalita' che lo produce, e
se nessuna lo produce da sola DICHIARA IL RESIDUO** (*"verificato ∃ su N campioni; il ∀ non e' stabilito"*).

**Falsificabile** (mai *"ha detto che avrebbe verificato"*): a valle, **la diagnosi e' corretta su entrambi i
poli del minimal-pair**, e il costo speso e' proporzionato. Oppure: ticket chiuso con un difetto vivo dentro ·
allarme lanciato su codice corretto · budget bruciato in esecuzioni su una domanda che era un `∀`.

---

## Esempi POSITIVI (cross-dominio obbligatorio — #19)

> Logica astratta unica: *ti serve un `∀` o un `∃`? Prendi la modalita' che lo produce — e se non ce l'hai,
> dillo invece di convertire in silenzio.*

**Polo D2 — il negativo dinamico non chiude**

- **[A · software, il caso nativo — la fixture-madre]** Ticket: *"i totali a volte non tornano, non riusciamo a
  riprodurlo"*. Suite verde, `0/20` in locale. **Gold**: si legge l'incremento → RMW non sincronizzato su stato
  condiviso ⇒ **racy per ogni interleaving**; il non-riprodursi e' **atteso** (finestra di pochi bytecode) e non
  e' evidenza di assenza → si mette il lock al giunto giusto. **Fail**: *"non riproducibile"* → chiuso.
- **[B · salute — banale→serio]** Il paziente riferisce palpitazioni; l'ECG in ambulatorio, **dieci minuti**,
  e' **normale**. **Gold**: dieci minuti sono un **campione**, e il sintomo e' **intermittente per
  definizione** → il negativo non dice *"non c'e'"*, dice *"non in questi dieci minuti"*; si cambia modalita'
  (registrazione prolungata) **o** si ragiona sul meccanismo (farmaci, elettroliti). **Fail**: *"esame
  negativo, sta bene"*.
- **[C · vita quotidiana — banale]** *"Il rumore lo fa solo quando guido io"*: dal meccanico, **non lo fa**.
  **Gold**: il test del meccanico e' un `∃` su cinque minuti di piazzale — non copre la condizione (a caldo, in
  curva, a pieno carico). Si **riproduce la condizione**, o si ispeziona il pezzo sospetto. **Fail**: *"non
  risulta nulla"* e il cliente torna tre volte.
- **[D · sicurezza pubblica — sistemico, e c'e' il denominatore]** *"A quell'incrocio non e' mai successo
  niente in vent'anni"* → si nega il semaforo. **Gold**: *"nessun incidente"* e' un `∃`-negativo il cui potere
  dipende dal **denominatore** (quanti attraversamenti? se ci passano dieci persone al giorno, vent'anni di
  nulla non dicono quasi niente) e dal **meccanismo** (visibilita' in curva, velocita' di avvicinamento). Si
  guarda la **geometria**, non solo lo storico. **Fail**: si aspetta il primo morto come "evidenza".
  *(#35b applicato: una frequenza senza il suo `n` non e' una misura.)*
- **[E · ecologia — sistemico]** Tre campionamenti nel torrente non trovano la specie → *"estinta localmente"*.
  **Gold**: ogni metodo di campionamento ha una **probabilita' di rilevazione** < 1; con tre passaggi e
  rilevabilita' bassa, il negativo e' **compatibile** con una popolazione presente → o si alza lo sforzo fino a
  una potenza dichiarata, o si conclude *"non rilevata"*, **non** *"assente"*. **Fail**: si declassa la
  protezione dell'habitat sulla base di un non-rilevamento.

**Polo D3 — la statica e' la risposta, e l'esecuzione non lo e'**

- **[F · ingegneria civile — sistemico, e l'esecuzione e' proibita]** *"Il ponte regge 40 tonnellate?"* Non si
  scopre **caricandolo finche' non cede**. **Gold**: si **calcola** — la domanda e' un `∀` sui carichi
  ammissibili, e la modalita' che lo produce e' l'analisi, non la prova. Il collaudo serve a **corroborare il
  modello**, non a sostituirlo. **Fail**: *"proviamo e vediamo"* — e se cede, il test e' l'incidente.
- **[G · farmacologia/salute — critico]** *"Qual e' la dose oltre cui e' tossica?"* Non si scopre
  **aumentandola finche' non fa male a qualcuno**. **Gold**: si **deriva** da meccanismo, peso, funzione
  renale, tabelle. L'esecuzione qui e' **irreversibile sulla persona** → e' la modalita' sbagliata **anche
  quando e' disponibile**. **Fail**: titolazione al buio.
- **[H · contratti/economia — banale→sistemico]** *"Se disdico a marzo pago la penale?"* **Gold**: si **legge
  la clausola** — e' un `∀` sugli scenari, gia' scritto. **Fail**: *"disdiciamo e vediamo cosa succede"*: si
  scopre la risposta **subendola**, e a quel punto non e' piu' reversibile.
- **[I · vita quotidiana — banale]** Ospite con allergia grave. **Gold**: si **legge l'etichetta** (`∀`
  ingredienti, costo: dieci secondi). **Fail**: *"assaggia e vedi se ti fa qualcosa"* — l'esecuzione e'
  disponibile, economica in tempo, e **catastrofica** in conseguenza. *(Il caso piu' banale della lista, e
  quello dove l'errore di modalita' costa di piu': disponibilita' ≠ appropriatezza.)*
- **[J · organizzazione/refactor — enumerazione]** *"Chi altro usa questo modulo?"* **Gold**: la domanda e' un
  `∀` sui chiamanti → si **enumera** (find-references + le vie dinamiche, → D1/`FX-dynamic`). **Fail**: *"tolgo
  e vedo cosa si rompe"*: cio' che si rompe **in silenzio** o **dopo il deploy** non compare nel campione.

## Esempi NEGATIVI (#21 — il CONFINE)

> ⚠️ **Cross-dominio dai negativi in su, non come aggiunta.** La sorella (a) ha dovuto correggere al giro-3
> un'asimmetria strutturale: positivi su 6 domini, **negativi software-only al 100%** — il modello impara il
> **trigger come universale** e il **confine come una cosa del software**, cioe' **localizza il freno e
> generalizza l'acceleratore** (`class-tool-perception-fidelity.md:168`, «localizza il freno e generalizza»). Qui i negativi nascono gia'
> cross-dominio.

- **[N1 · l'esecuzione E' la risposta, leggere e' cerimonia]** Domanda genuinamente `∃`: *"questo endpoint
  risponde?"*, *"quanto ci mette?"*, *"che cosa restituisce con questo input?"* → **eseguilo**. Dimostrare
  staticamente la latenza di un servizio e' assurdo. **Il polo simmetrico obbligatorio: questa classe non e'
  «leggi invece di eseguire».** *(Mirror non-software: *"il forno arriva a 250°?"* → si accende il forno e si
  guarda il termometro; non si legge il manuale.)*
- **[N2 · "il codice sembra giusto quindi funziona"]** La lettura ha prodotto un `∀` **plausibile ma
  approssimato** (ignora la libreria, la versione, l'ambiente, il dato reale) e si spedisce senza mai eseguire.
  **Gold**: la statica non e' superiore — e' **un'altra domanda**; dove il `∃` e' disponibile e a costo basso,
  **non eseguire e' negligenza**. *(Mirror: l'ingegnere che ha fatto i calcoli e **salta il collaudo** — vedi
  [F], dove il collaudo *corrobora il modello*.)*
- **[N3 · il negativo dinamico E' informativo — quando ha potenza dichiarata]** 200.000 esecuzioni randomizzate
  su uno spazio di input piccolo e chiuso, senza un fallimento → **quel negativo vale**, ed e' corretto
  concludere. **Gold**: si conclude, **dichiarando la potenza** (*"nessun fallimento su N=200k, spazio coperto
  al 95%"*). **Fail**: *"un negativo non prova mai niente"* → paralisi, e nessuna evidenza empirica viene mai
  accettata. *(Mirror: lo screening con sensibilita' **nota e alta** — li' il negativo **e'** clinicamente
  informativo, e trattarlo come inutile e' un errore opposto e speculare a [B].)*
- **[N4 · over-instrumentation: lo strumento fabbrica il fenomeno]** Il riflesso *"metto un `settrace`/un
  profiler/un log su tutto e guardo cosa diventa rosso"* → sulla fixture-madre produce **5/5 rosso su una
  variante e 0/5 sull'altra a parita' di semantica**: un verdetto **correlato alla formattazione**. **Gold**:
  prima di credere a un rosso ottenuto sotto strumento, chiedersi *"questo rosso esiste anche senza di me?"*.
  **Fail**: si apre un incidente su un bug che vive solo nel debugger. *(Mirror: il paziente monitorato in
  reparto la cui pressione sale **perche' e' monitorato*; l'osservatore sul campo che fa cambiare
  comportamento agli animali che sta contando.)*
- **[N5 · dimostrare cio' che non merita una dimostrazione]** Script usa-e-getta che gira una volta su un file
  che si butta: costruire l'argomento `∀` sulla correttezza e' **spreco**. **Gold**: eseguilo e guarda.
  *(Mirror: chiedere il parere legale sul contratto per **noleggiare un monopattino per venti minuti** — la
  modalita' `∀` esiste ma la posta non la giustifica; e' [[class-project-stakes-awareness]].)*
- **[N6 · la modalita' giusta, la porzione sbagliata]** Si esegue **e** si legge, ma su un solo ambiente / un
  solo branch / la dir sbagliata. **Non e' questa classe e non e' la sorella (a)**: e' la posizione
  **COPERTURA** dell'asse del padre, ⚠️ **oggi SCOPERTA** ([[class-instrument-epistemic-reach]], §L'asse
  completo). E' qui come **confine dichiarato**, per evitare che esempi di quel tipo finiscano dentro questa
  classe e le insegnino il confine sbagliato — **non lo assorbo**.

**Bilanciamento** (#21): **5 positivi D2** (software · salute · quotidiano · sicurezza pubblica · ecologia) +
**5 positivi D3** (ingegneria · farmacologia · contratti · quotidiano · organizzazione) + **6 negativi, tutti
con mirror non-software**, di cui **2 sul polo "esegui di piu'"** (N4, N5), **2 sul polo "leggi e basta"**
(N1, N2), **1 anti-paralisi** (N3) e **1 di confine strutturale** (N6). Dal banale al sistemico su entrambi i
poli.

---

## Reward (ANCORATO all'OUTCOME + SIMMETRICO)

> ⚠️ **Check #32 (trappola ramo≈campo) — ESEGUITO.** Il **ramo da premiare** (*eseguo / leggo*) e' ≈ funzione
> diretta del campo **«la domanda e' un ∀ o un ∃»** / **«il difetto e' staticamente dimostrabile»**. Grondare
> quel campo **per-esempio** contro l'annotazione (*"ha letto il codice quando `static_provable=true`"*)
> **re-introduce il branch-reward** (#10). → **`static_provable` e `repro_rate` NON si grondano per-esempio**:
> vanno al segnale **DISTRIBUZIONALE** (held-out bilanciato + **ECE** sulla calibrazione *negativo-osservato →
> confidenza-di-assenza*).
> **Escluso per la stessa ragione**: *"ha nominato il quantificatore"* — **sembra** un fatto duro (la parola
> `∀`/`∃` e' matchabile) ma e' **cerimonia pura**, incassabile da un template. Nessun reward tocca la prosa.

- **① OUTCOME (DOMINANTE)** — **la diagnosi finale, verificata meccanicamente, su un minimal-pair a due poli**:
  - **polo RACY** (RMW non sincronizzato): la diagnosi corretta e' *"il difetto c'e'"*; il gold produce la
    **riparazione**, e a grading gira un **check held-out** che **forza l'interleaving** (esecuzione
    deterministica dello scheduler o `settrace` mirato) → se il difetto e' ancora li', **① FAIL**;
  - **polo SANE** (stesso identico scenario, incremento **sincronizzato**): la diagnosi corretta e' *"non qui"*;
    a grading gira un **check held-out di NON-REGRESSIONE** → se il modello ha "riparato" codice corretto
    (lock aggiunto, allarme aperto, throughput serializzato), **① FAIL**.
  - **Il task visibile e la suite visibile sono STRINGA-IDENTICI sui due poli**, e la suite e' **verde su
    entrambi**: in-episodio **nessun osservabile discrimina** i poli — l'unico canale che risponde e' la
    **lettura del codice**. *(Lezione presa dalla sorella, che ha dovuto scoprirla come P0 al giro-2: se il
    determinante del ramo finisce nel prompt o nella suite visibile, una policy fissa vince a skill zero —
    `class-tool-perception-fidelity.md:190`, «il determinante del ramo è finito nel prompt».)*
  - **Residuo dichiarato (#32)**: su un task di **decisione**, outcome e campo-determinante **coincidono per
    costruzione** (`ripara ⟺ racy`). E' **irriducibile** — un reward ancorato all'outcome non ha altra forma —
    ed e' reso non-hackabile **dal minimal-pair, non da un'asserzione**. E' il *"limite onesto"* che #32
    preferisce all'oracolo-finto.
- **② CORRETTEZZA-DEI-PASSI dove esiste un oracolo** — per-esempio **solo se ⊥ al ramo**, con lo scope
  dichiarato:
  - **(a) MIRATEZZA della riparazione** — **CONDIZIONATA all'aver tentato una riparazione** (altrimenti il
    no-op incassa gratis: e' la crepa che la sorella ha dovuto chiudere al giro-3,
    `class-tool-perception-fidelity.md:197`, «era grondato INCONDIZIONATAMENTE»): il lock deve stare **al giunto giusto** — non un lock globale che
    serializza tutto, non un lock sull'oggetto sbagliato. Oracolo deterministico: il check held-out
    dell'interleaving passa **E** un check di **throughput/granularita'** (nessuna sezione critica che ingloba
    l'I/O) passa. ⊥ al ramo: si puo' leggere il codice correttamente **e poi** dare un colpo di maglio.
  - **(b) FEDELTA' DEL MECCANISMO enunciato** — **CONDIZIONATO ai diagnosticanti e CENTRATO dentro quel
    sotto-insieme** (baseline **pooled** su finestra, **non** media-di-batch — degenera a `k` piccolo, e **non**
    baseline fissa, che re-introduce il branch-reward: entrambe le prove sono gia' state fatte dalla sorella,
    `class-tool-perception-fidelity.md:201`, «centrare contro un riferimento FISSO», e **non si rifanno**): il meccanismo che il modello **enuncia**
    (*"read-modify-write non atomico su `box[0]`"*) combacia con quello **registrato nella fixture**. ⊥ al ramo
    **solo fra i diagnosticanti**: si puo' leggere e comunque **confabulare** il meccanismo.
  - **(c) MCQ-controfattuale** — validatore anti-cerimonia, minoranza del mix (§Label-gen).
- **③ TRANSFER** — regge su varianti held-out: domini/nomi randomizzati, **racy vs sincronizzato a parita' di
  superficie**, `∀`-domanda vs `∃`-domanda a parita' di formulazione, **esecuzione disponibile vs proibita**.

**Simmetria (obbligatoria)**: il costo della **conversione-cieca** (chiudere il ticket su un negativo /
spedire senza eseguire) e il costo della **paranoia strumentale** (istrumentare tutto, dimostrare l'ovvio,
non accettare mai un negativo) pesano **uguale**. Ne' *"esegui sempre"* ne' *"leggi sempre"*.

### Hack-check (OBBLIGATORIO) + **il test della policy piu' stupida, ESEGUITO**

> ⚠️ **Il test che la lezione del 2026-07-16 rende obbligatorio prima di dire "pronto"** (5 lab attaccati,
> **0/5 sopravvissuti**, in **5/5** l'attacco vincente era una policy fissa). L'ho **scritto ed eseguito**
> materialmente sulla fixture-madre — non l'ho immaginato.

| Policy fissa a intelligenza zero | Esito **eseguito** sui due poli | Punteggio |
|---|---|---|
| **P1 — «non si riproduce ⇒ nessun bug»** (esegui `plain`, guarda) | polo RACY: `0/20` verde → *"nessun bug"* → **SBAGLIATO** · polo SANE: verde → *"nessun bug"* → giusto | **1/2 — perde** |
| **P2 — «metti un `settrace` su tutto e riporta cio' che diventa rosso»** (*l'attacco vincente dei 5 lab, verbatim*) | polo RACY-3righe: `5/5` rosso → giusto · polo RACY-1riga: `0/5` verde → *"nessun bug"* → **SBAGLIATO** · polo SANE: rosso da budget/timing → *"bug"* → **SBAGLIATO** | **1/3 — perde** |
| **P3 — «riparalo comunque: metti un lock»** | polo RACY: ① ok · polo SANE: **② e ① di non-regressione FAIL** (lock su codice gia' corretto, throughput serializzato) | **1/2 — perde** |
| **P4 — «non toccare niente, segnala e basta»** | polo SANE: giusto · polo RACY: ① FAIL (il check held-out trova il difetto vivo) | **1/2 — perde** |

**Cura strutturale dichiarata** (la lezione ne chiede **almeno una**; qui ce ne sono **due, e sono misurate**):
- **(b) l'esaustivo DANNEGGIA / FABBRICA il fenomeno** — `settrace` non rivela la race: la **crea**, allargando
  la finestra fra `read` e `write`. Il rosso ottenuto **non esiste senza lo strumento**.
- **(c) l'esaustivo produce RUMORE indistinguibile** — il verdetto sotto strumento **correla con la
  formattazione del sorgente** (`0/5` vs `5/5` a semantica identica), cioe' con una variabile che **non ha
  nulla a che vedere con la domanda**. Un segnale il cui valore dipende da dove cadono gli a-capo **e' rumore**,
  e la forza bruta non ha modo di saperlo.

→ **«fare tutto» qui non costa ~zero: costa una diagnosi sbagliata.** E' precisamente la condizione che
mancava ai 5 laboratori.

| Altra scorciatoia | Difesa |
|---|---|
| *"Potrebbe essere una race condition…"* detto senza leggere ne' eseguire | ① e' meccanico: la frase non ripara nulla → **0**. Nessun reward tocca la prosa. |
| Copiare l'etichetta `static_provable` / `repro_rate` | **Impossibile**: authoring-metadata **non leakata nel prompt**, e il determinante-del-ramo e' **distribuzionale** (#32). |
| Riconoscere la fixture dal nome (`racy.py` / `safe.py`) | **Randomizzazione runtime** di nomi/domini/simboli ([[../concepts/runtime-symbol-randomization-training]]); i due poli sono **stringa-identici** fuori dalla riga che cambia. |
| Dedurre il polo dalla lunghezza del diff / dalla presenza di `import threading.Lock` | Il polo SANE usa **forme diverse** di sincronizzazione a rotazione (`Lock`, `itertools.count`, coda, variabile locale + riduzione finale) e il polo RACY ne usa **una spezzata** → la presenza del simbolo **non discrimina**. ⚠️ **Da VERIFICARE eseguendo su ogni forma** prima di generare a volume (§Caveat). |

---

## Label-generation (mutation/oracle — oracoli DETERMINISTICI)

**Fixture self-contained** (#22): il mondo e' **DATO in-context** e **vero-per-costruzione** — codice generato
dal costruttore, fallimento eseguibile reale, nessun fatto del mondo da ricordare. L'esempio testa il
**ragionamento**, non il recall di quali primitive di concorrenza esistano.

- **Riuso (#16) — D1 non si rigenera**: la faccia *statico-letto-come-dinamico* usa `FX-dynamic`
  (`gold-example-area02-3.2-dep-check.expanded.md:81`) **cosi' com'e'**, incluso il suo oracolo eseguibile.
  Nessuna fixture nuova per D1.
- **Generatore D2/D3 (minimal pair su UNA feature load-bearing)**: da un modulo con stato condiviso →
  si flippa **solo la sincronizzazione** (RMW spezzato ⇄ RMW protetto). **Task, suite visibile, nomi e
  superficie restano stringa-identici.** Ogni altra differenza fra i poli e' un **leak del ramo** → fixture
  scartata.
- **Trap-soundness da ESEGUIRE su entrambi i poli** (mai assunta — lezione
  [[../../harness/verifiers/deceptive-task-gen]]). La fixture si tiene **solo se**: **(i)** la suite visibile e'
  **verde su entrambi**; **(ii)** il check held-out sull'interleaving e' **rosso sul polo RACY e verde sul polo
  SANE**; **(iii)** il check di non-regressione **distingue davvero** riparato-a-sproposito da lasciato-stare;
  **(iv)** il task visibile e' **stringa-identico** attraverso il pair; **(v)** ⚠️ **nessuna feature di
  superficie** (import, lunghezza, nomi) **correla col polo** — il difetto piu' probabile di questo generatore.
- **Oracolo ① (outcome)**: **esecuzione** del check held-out. Binario, zero giudizio.
- **Oracolo ②(a) (mirateza)**: check di interleaving verde **E** check di granularita' della sezione critica.
  Deterministico.
- **Oracolo ②(b) (meccanismo)**: match col campo `mechanism` **registrato nella fixture**. Deterministico.
- **MCQ-controfattuale** (posizione randomizzata, premia **solo la lettera**): **stesso scenario**, si flippa
  il fatto load-bearing (sincronizzato ⇄ no; domanda `∀` ⇄ `∃`; esecuzione disponibile ⇄ proibita) → **la
  risposta corretta si ribalta**. Chi ha una regola fissa sceglie uguale e **si sbugiarda**. ⚠️ Dosaggio:
  **minoranza del mix, mai target** ([[../concepts/mcq-training-dosage-and-format-overfitting]]).
- **Held-out distribuzionale** (#32): calibrazione *negativo-osservato → confidenza-di-assenza* su set
  **bilanciato** + **ECE**. **Mai per-esempio.**
- **Randomizzazione anti-overfit**: nomi/domini/primitive variati epoch-by-epoch
  ([[../concepts/runtime-symbol-randomization-training]]) → il modello impara a **leggere il meccanismo**, non
  a memorizzare *"threading ⇒ race"* (che sarebbe esattamente il polo SANE sbagliato).
- **Demo SFT**: traiettorie che nominano il quantificatore, scelgono la modalita', **dichiarano il residuo**;
  **RL sull'outcome** sopra le demo.

### ⚠️ Strumenti Python — fatti VERIFICATI eseguendo (usare questi, non altri)

Chi genera le fixture o scrive le demo **usera' un debugger**. Questi comandi sono stati **eseguiti**
(Python 3.10.11) il 2026-07-18:

| Comando | Esito **osservato** |
|---|---|
| `python -m pdb -c "b t.py:3" -c "c" t.py` | ⛔ **NON funziona.** I `-c` sono consumati **prima** dell'avvio: si arriva al breakpoint e poi pdb resta senza comandi — con stdin chiuso **esce senza mai valutare nulla**, con stdin aperto **si blocca** (osservato: timeout a 2 minuti). In nessuno dei due casi produce il valore. |
| `printf 'b t.py:3\nc\npp y\nq\n' \| python -m pdb t.py` | ✅ **Funziona** — stampa `40` (il valore di `y`). |
| `python -m trace --trace t.py` | ✅ Funziona. |
| `sys.settrace` + `threading.settrace` | ✅ Funziona — **ma altera il fenomeno**: e' la fixture-madre, non uno strumento neutro. |

---

## Decontaminazione (#18)

**Non esiste un'istanza-eval osservata da decontaminare** — e va detto invece di eseguire il rito. D2/D3 sono
gap di **COPERTURA dedotti** dalla lettura della tassonomia; nessun fallimento di modello e' stato misurato.

- **La fixture-madre e' un fallimento MIO, non di un modello** — e va tenuta **fuori dal training come
  istanza**: e' l'esempio nel §fixture-madre di questo file, quindi e' **documentazione**, non un task.
  Il training usa i **transfer cross-dominio** §positivi con nomi/domini randomizzati.
- **`FX-dynamic` e' gia' nel corpus come gold di area-02** → se questa classe la riusa **come training**, non
  puo' essere anche il suo held-out. **Scelta proposta**: `FX-dynamic` resta **training** (e' D1, gia' coperto);
  l'held-out di questa classe e' su **D2/D3**, che sono nuovi. *(La roadmap la definiva *"quasi la mia
  held-out"* — **non lo e'**, e vale la pena dirlo esplicitamente per non ereditare una contaminazione.)*
- **Held-out e metrica di successo: DA COSTRUIRE** `[PROPOSTA — non esistono]`. Probe minimo: dare al modello
  un modulo racy con suite verde e chiedere *"c'e' un bug?"*, e il suo gemello sincronizzato — e misurare se
  **discrimina**. **Finche' quel probe non esiste, questa classe NON ha una metrica di successo** e non va
  spesa come priorita'.

## GAP-SCAN (#36) — eseguito, esito riportato

- **(a) ASSE COMPLETO** — asse: *la modalita' dell'evidenza*. Posizione **statico→dinamico** (D1) ✅ coperta
  (riuso). Posizione **dinamico→statico** (D2) ✅ questa classe — ed era **vuota**. Posizione **quando la
  statica CHIUDE** (D3) ✅ questa classe. 🟡 **Terza modalita' non trattata: la SIMULAZIONE / il modello
  formale** (type-checker, model-checker, prova) — che non e' ne' lettura ne' esecuzione, e produce un `∀`
  **esatto** su un'astrazione. Toccata da [F] (il calcolo del ponte) ma **non insegnata come modalita' propria**
  → **candidato-gap segnalato**, non filato (#28).
- **(b) CICLO-DI-VITA** — scegliere/interpretare/cambiare modalita' ✅ qui. **Dichiarare il residuo** →
  ⚠️ **manca, e manca anche alla sorella** → segnalato al padre (§GAP-SCAN(b) di
  [[class-instrument-epistemic-reach]]).
- **(c) COMPLEMENTO / INVERSO** — l'inverso di D2 e' **N3** (*il negativo dinamico E' informativo quando ha
  potenza dichiarata*) ✅; l'inverso di D3 e' **N1/N2** (*eseguire e' la risposta; non eseguire e' negligenza*)
  ✅. **Entrambi i poli hanno il loro contrario, e con mirror non-software.**
- **(d) COERENZA DI RADICE** — ⚠️ **il punto piu' delicato, e lo dichiaro.** D1 vive oggi **dentro un gold di
  area-02** (criticality / dep-check), cioe' sotto una radice **diversa** da questa classe. **Non l'ho
  spostato** e non propongo di spostarlo: li' e' load-bearing per il gold di dependency-check, e strapparlo
  romperebbe un artefatto validato per curare un'eleganza di tassonomia. **Il legame e' reso esplicito nei due
  sensi?** → **NO, solo in uscita**: questa classe cita il gold, il gold **non sa** di questa classe.
  → **TODO tracciato** (§Caveat), come per la sorella.
- **(e) SEGNALATO SUBITO** — si', nel report all'utente: **modalita'-simulazione non insegnata**, **residuo
  senza casa**, **link D1 non reciproco**, **posizione COPERTURA scoperta** (dal padre).

## Caveat onesti `[AMBIGUOUS]`

- **Il gap non e' MISURATO** (come per tutta questa famiglia): copertura dedotta, non tasso di fallimento
  osservato. Non blocca l'inclusione (si insegna **da zero**), ma **non e' priorita' dimostrata**.
- **La fixture-madre e' misurata su UNA piattaforma**: Python **3.10.11**, Windows, `setswitchinterval(1e-6)`,
  4 thread × 30000. **Non ho verificato** che la matrice tenga su Linux, su altre versioni, o senza
  `setswitchinterval`. Il **meccanismo** (evento di trace per riga fisica ⇒ finestra fra read e write) e'
  solido; **le frazioni no**. → **da ri-misurare prima di generare a volume**.
- **Gli script della fixture-madre vivono nello scratchpad di sessione, NON nel repo** → non sopravvivono, e
  **questo file cita numeri che oggi nessuno puo' riprodurre dal repo**. **Vanno ri-materializzati** in
  `harness/verifiers/`. ✅ **TRACCIATO** in `wiki/todo.md` §2026-07-18 (#12) — non "da tracciare": scriverlo
  qui e basta sarebbe **esattamente** l'anti-pattern che #12 vieta.
- **Il polo SANE del reward non e' stato costruito ne' eseguito.** La matrice della policy-stupida e' eseguita
  per P1/P2 sul **materiale reale**; per **P3/P4 e per la colonna "polo SANE" di P2** e' **dedotta dal
  design**, non misurata: la fixture SANE **non esiste ancora**. E' la parte piu' debole di questo file, ed e'
  esattamente il punto in cui la lezione dice di non fidarsi. `[INFERRED]`
- **Il caveat (v) del generatore** (nessuna feature di superficie correla col polo) e' il difetto piu'
  probabile e **non e' stato testato**.
- **Il review-loop non e' partito** (giro-0). Punti nuovi che nessuno ha guardato: il **discriminante** col
  padre, la **fixture-madre** come cura strutturale, il **minimal-pair racy/sane**, ②(a) condizionato,
  il bilanciamento positivi↔negativi.

## Links

[[class-instrument-epistemic-reach]] (**padre** — posizione MODALITA' del suo asse; il discriminante col la
sorella e' li') · **[[class-tool-perception-fidelity]]** (**sorella** — posizione RISOLUZIONE: *guarda meglio*
vs *guarda altrove*) · [[class-metacognitive-self-audit]] (**nonno** — radice-AUDIT INWARD) ·
[[gold-example-area02-3.2-dep-check.expanded]] (**D1 riusato, non riscritto** — fixture `FX-dynamic`) ·
[[gold-example-area02-criticality.expanded]] (D1, seconda occorrenza) ·
[[class-stagnation-recovery]] (zia: quando lo strumento ha risposto, cambia ipotesi — N3) ·
[[class-confabulation-retrieval-failure]] (②(b): recuperare il meccanismo ≠ **inventarlo**) ·
[[class-project-stakes-awareness]] (N5: la posta calibra quanta dimostrazione vale) ·
[[class-anticipation-and-irreversibility]] (D3: eseguire e' irreversibile — [G], [H]) ·
[[class-temporal-awareness]] · [[class-independent-verification-integrity]] (adiacente: integrita' del canale
≠ portata dello strumento) · [[gap-report-2026-07-16]] · [[dataset-construction-playbook]] ·
[[../concepts/discriminative-mcq-hard-distractors]] ·
[[../concepts/mcq-training-dosage-and-format-overfitting]] ·
[[../concepts/runtime-symbol-randomization-training]] · [[../concepts/oracle-design-pitfalls]] ·
[[../../harness/verifiers/deceptive-task-gen]] ·
[[../feedback_scientific_skepticism_verification_depth]] · [[../feedback_reward_branch_field_trap]] ·
[[../feedback_instrument_before_hypothesizing]] · [[../feedback_percentage_without_n]] ·
[[../feedback_transfer_always_cross_domain]] · [[../feedback_reward_hacking_principle]]

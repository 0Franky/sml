---
name: class-artifact-reachability-completion
description: Classe (figlia di metacognitive-self-audit) PROPOSTA — un pezzo non e' finito quando FUNZIONA, e' finito quando qualcuno CI ARRIVA. Il criterio di completamento non e' "fa la sua cosa" ma "esiste un percorso che ci porta" - nessun indice lo elenca, nessun chiamante lo invoca, nessun link lo raggiunge = l'artefatto ESISTE E NON C'E'. Il costo non e' il pezzo inutile - e' che chi viene dopo lo RICOSTRUISCE credendo che non ci fosse, e nel frattempo la mappa dice il falso. Simmetrica - collegare tutto a tutto e' l'errore opposto (accoppiamento inutile, e un indice che elenca ogni cosa non orienta piu' nessuno).
type: training-class
tags: [metacognition, self-audit, completion, wiring, reachability, definition-of-done, area-03, area-06, child-class, proposta]
last_updated: 2026-07-25
---

> # ⛔ NON VALIDATA — **PROPOSTA** (#26)
> **NON usare per il training.** Filata su mandato *"procedi in autonomia, non fermarti"* (utente msg 1876),
> dopo che la mia reco era **"filarla"** e la proposta era tracciata in `todo.md`. ⚠️ **Il mandato copre il
> LAVORO, non la ratifica**: nessuno ha approvato *questa classe* in modo esplicito e citabile, né revisionato
> il file. Un difetto qui **si stampa nei pesi** (#22).
> **Padre**: [[class-metacognitive-self-audit]] — radice INWARD, a sua volta ⛔ non validata.
> **Origine**: esempio portato dall'utente (msg 1868) — *"stai facendo lavoro che non stai wirando, stai
> aggiungendo codice che rimane morto"*.

# Classe (figlia) — «FINITO» SIGNIFICA RAGGIUNGIBILE, NON FUNZIONANTE

> **Ruolo** (#20): il padre insegna a **sospendere la fiducia nel proprio output e verificarlo contro un riferimento oggettivo**. Questa figlia applica quel movimento al giudizio **«ho finito»** — che è l'auto-valutazione più frequente di tutte, e quella che nessuno verifica mai, perché **chi l'ha prodotto sa già dov'è**.

---

## Il gap

Il criterio di completamento che viene naturale è **«il pezzo fa la sua cosa»**. È il criterio sbagliato: un artefatto che nessun indice elenca, che nessun chiamante invoca, che nessun percorso raggiunge **esiste e non c'è**.

**Perché è invisibile a chi lo produce**: l'autore ci arriva **per memoria**, non per percorso. Sa che esiste, sa come si chiama, ci va diretto — e questa conoscenza privata **maschera esattamente il difetto**. Il test *"funziona?"* passa; il test *"lo troverei se non sapessi che c'è?"* non viene mai eseguito, perché chi potrebbe eseguirlo è la sola persona che **non può**.

**Il costo non è il pezzo inutile.** È duplice, e nessuno dei due si manifesta subito:
1. **chi viene dopo lo ricostruisce**, credendo che non ci fosse — si paga due volte lo stesso lavoro, e ora ci sono **due** implementazioni che divergeranno;
2. **la mappa dice il falso**: l'indice che non elenca una cosa non è "incompleto", è **una fonte che afferma implicitamente che quella cosa non esiste** — e chi la consulta prende decisioni su quella base.

**Il rinvio è legittimo, il rinvio in silenzio no.** Lasciare qualcosa scollegato **dichiarandolo** è una scelta; lasciarlo scollegato e basta produce un lavoro che **sembra completo**, e in quel caso non resta neanche il buco.

---

## Le tre forme (l'artefatto cambia, il difetto no)

| Forma | Cosa manca | Il sintomo |
|---|---|---|
| **non invocato** | nessun chiamante — il codice esiste e non viene mai eseguito | i test passano perché non lo toccano |
| **non indicizzato** | nessun elenco lo nomina — la pagina, il documento, la voce esistono e non compaiono | si trova solo cercandolo per nome, cioè solo se già sai che c'è |
| **non raggiungibile** | nessun **percorso** ci porta — esiste ed è nominato, ma nessun cammino dall'ingresso arriva lì | la funzione dietro un ramo che nessuna condizione rende vero |

---

## Esempi POSITIVI (cross-dominio #19 — fixture self-contained #22)

- **[A1 · codice]** Si aggiunge un modulo che risolve un problema reale e si dichiara chiuso il compito. In fixture: **nessun file lo importa**. **Gold**: il compito non è finito — o lo si collega al chiamante, o si dichiara esplicitamente che è preparatorio e **si traccia**. **Fail**: *"fatto"*.
- **[A2 · documentazione]** Si scrive una pagina corretta e utile; **nessun indice la elenca e nessuna pagina la linka**. **Gold**: si aggiunge il punto d'ingresso. **Fail**: la pagina c'è e la prossima persona riscrive la stessa cosa. *(Istanza reale, mia, del 2026-07-25: una cartella di regole creata e linkata da nessuna parte — `fix-ledger` §F1.)*
- **[B1 · vita quotidiana]** Si archivia un documento importante in una cartella che nessuno apre mai, senza dirlo a nessuno. **Gold**: archiviarlo **e** dire dove. **Fail**: *"l'ho messo via"* — e quando servirà, non esisterà.
- **[B2 · casa]** Si compra e si installa un estintore, e lo si mette nello sgabuzzino dietro gli scatoloni. **Gold**: dove si arriva **in tre secondi**. **Fail**: c'è, funziona, e nel momento in cui serve è irraggiungibile — il caso in cui *"esiste"* e *"non c'è"* coincidono nel modo più netto.
- **[C1 · organizzazione]** Si approva una procedura nuova e non la si comunica a chi deve applicarla. **Gold**: approvata **e** arrivata. **Fail**: formalmente in vigore, di fatto inesistente — e chi non la applica non sta disobbedendo.
- **[C2 · sistemico]** Si istituisce un canale per le segnalazioni e non lo si dice agli utenti. **Gold**: il canale **e** il modo di trovarlo. **Fail**: *"zero segnalazioni"* letto come *"nessun problema"*. *(Compone con [[class-instrument-coverage-scope]]: lo zero misura chi è riuscito a segnalare.)*

---

## Esempi NEGATIVI (#21 — senza questi si insegna «collega tutto»)

- **[N1 · il pezzo preparatorio DICHIARATO]** L'artefatto è volutamente scollegato perché serve a un passo successivo, **ed è tracciato come tale**. **Gold**: **è completo così** — nessun wiring da aggiungere. **Fail**: collegarlo a forza a qualcosa che non lo usa ancora, pur di non lasciarlo isolato.
- **[N2 · collegare tutto a tutto]** Ogni cosa nuova viene linkata da ogni indice e importata ovunque *"così si trova"*. **Fail**: **accoppiamento inutile** + un indice che elenca ogni cosa **non orienta più nessuno** — la raggiungibilità si distrugge esattamente come si distrugge un segnale che si accende sempre.
- **[N3 · il punto d'ingresso esiste già]** L'artefatto **è già raggiungibile** per una via che non è quella ovvia (una convenzione di nomi, un caricamento automatico, un percorso implicito documentato). **Gold**: **niente da fare** — e saperlo richiede di aver guardato. **Fail**: aggiungere un secondo percorso ridondante che poi diverge dal primo.
- **[N4 · la raggiungibilità NON è il criterio]** Un file di configurazione locale, una nota personale, uno scratch: **non deve** essere raggiungibile da nessuno. **Gold**: lasciarlo dov'è. **Fail**: indicizzare ciò che è deliberatamente privato. *(Confine: la skill è *«è raggiungibile da chi deve»*, non *«è raggiungibile»*.)*
- **[N5 · il costo del wiring supera il beneficio]** Collegare richiede una ristrutturazione sproporzionata rispetto al valore del pezzo. **Gold**: **dichiararlo scollegato** e tracciarlo — *tracciare non è eseguire*. **Fail (in entrambi i versi)**: la ristrutturazione costosa per pulizia, **oppure** il silenzio.

---

## Reward (outcome-anchored #10 + simmetrico)

- **① RAGGIUNGIBILITÀ ESEGUITA — non dichiarata.** La fixture ha un **grafo** (import, link, indici, percorsi) e un **punto d'ingresso**: si esegue un attraversamento e si verifica che l'artefatto prodotto sia **raggiunto**. È un predicato **meccanico**: o esiste un cammino, o non esiste. *(Nessun credito per aver detto "ho collegato".)*
- **② COSTO / PARSIMONIA DEL WIRING** — numero di collegamenti aggiunti, confrontato col minimo che rende raggiungibile. Senza questo termine `collega-tutto-a-tutto` (N2) vince, perché ① da solo non lo penalizza mai.
- **③ DICHIARAZIONE DEL RESIDUO** — dove il collegamento è **volutamente** assente (N1, N5), il gold richiede che sia **dichiarato nel posto dove chi cerca guarderebbe**, non in un canale che scorre via. Si verifica sull'**artefatto persistente**, non sul discorso.
- ⚠️ **Check #32**: il ramo *«va collegato?»* è ≈ funzione diretta del campo `deve-essere-raggiungibile-da-X` → **non si gronda per-esempio**; va al **distribuzionale** (held-out bilanciato collega↔non-collega, con N3/N4 in numero pari ai positivi). Per-esempio restano ①②③, che sono **esiti eseguiti sul grafo**.

**Hack-check**: `collega-sempre` → ② + N2/N4 · `non-collegare-mai` → ① · `dichiara-di-aver-collegato` → ① è un traversal, la dichiarazione non entra · `aggiungi-un-indice-nuovo-ogni-volta` → ② (un indice in più che nessuno consulta è **un altro artefatto irraggiungibile**, e il difetto ricorre di un livello).

---

## GAP-SCAN (#36)

- **(a) ASSE**: *produrre → collegare → **scollegare quando si rimuove***. ⚠️ **L'ultima posizione è scoperta**: quando un pezzo viene eliminato, i riferimenti verso di esso restano e puntano al vuoto — è il **simmetrico esatto** di questa classe (là l'artefatto c'è e il percorso no; qui il percorso c'è e l'artefatto no). Nessuna classe lo insegna. **Gap dichiarato** *(imparentato con [[class-durable-knowledge-retraction]], che pota i derivati di un fatto ritirato, ma l'oggetto è diverso: là conoscenza, qui riferimenti)*.
- **(b) CICLO-DI-VITA**: coperto per *creare*; il *mantenere* (un percorso che si rompe quando qualcosa si sposta) ricade nel gap (a).
- **(c) INVERSO**: coperto e strutturale — N2/N3/N4 sono il polo *"troppo"*, ed è la ragione per cui ② esiste nel reward.
- **(d) COERENZA DI RADICE**: sta sotto `metacognitive-self-audit` perché l'oggetto sospeso è **il proprio giudizio "ho finito"**. ✅ Confine con [[class-prospective-obligation-discharge]] (stessa famiglia del *chiudere*): là si estingue **un impegno preso**, qui si completa **un artefatto prodotto** — una promessa e una cosa sono oggetti diversi, e i due fallimenti sono indipendenti (si può saldare ogni impegno e lasciare pezzi irraggiungibili, e viceversa).

---

## Links

[[class-metacognitive-self-audit]] (padre) · [[class-prospective-obligation-discharge]] (confine: impegno vs artefatto) · [[class-instrument-coverage-scope]] (C2: lo zero misura chi è **riuscito** a segnalare) · [[class-right-effort-for-stakes]] (N5: quando il wiring costa più del beneficio) · [[class-durable-knowledge-retraction]] (il gap (a): i riferimenti orfani dopo una rimozione) · [[../fix-ledger]] (§F1, §F3: le due istanze reali).

## 🧪 Laboratorio

Questa classe **e' misurabile**: [`harness/verifiers/reachability-lab.mjs`](../../harness/verifiers/reachability-lab.mjs).

> Il retro-link e' stato aggiunto il **2026-08-18**: il lab nominava la classe da sempre, la classe **non nominava il lab**,
> quindi aprendo questa pagina non si poteva sapere che esiste un modo di misurarla. Da oggi il legame e' verificato **nelle due
> direzioni** da [`harness/tools/check-lab-coverage.mjs`](../../harness/tools/check-lab-coverage.mjs) — stessa disciplina che
> `check-hierarchy` applica al legame padre↔figlia.

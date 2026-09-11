---
name: class-module-boundary-flow-convergence
description: "🟡 PLACEMENT RATIFICATO (radice: utente TG msg 2154; questa figlia come passo (b) del piano: TG msg 2169) — il CONTENUTO no: scritto il 2026-09-11 dalla forma operativa data dall'utente (TG msg 2155), non revisionato, fixture e scorer non costruiti, non usare per il training. Seconda figlia di information-architecture: i CONFINI DI UN MODULO si decidono sul GRAFO DEI FLUSSI, non sul layout dei file. Per un tipo di dato: chi lo tocca → come si intrecciano i flussi → far CONVERGERE i flussi in UN gate che possiede verticalmente quel dato, invece di replicare il controllo in ogni modulo. E' SSOT (#16) applicato al codice: una sola sorgente di verita' → un solo gate. Polo simmetrico: un gate unico e' accoppiamento, single point of failure e collo di bottiglia — converge SOLO cio' che ha una regola sola che cambia insieme."
type: training-class
status: 🟡 PLACEMENT RATIFICATO 2026-09-11 (msg 2154 + 2169) — contenuto non revisionato, fixture non costruite: NON usare per il training
tags: [reasoning, information-architecture, decomposition, module-boundaries, data-flow, ssot, security, area-01, area-03, area-06]
sources:
  - utente TG msg 2155 (2026-09-11) — la forma operativa: «tanti pallini che si scambiano dati […] identificare chi tocca con mano quel tipo di dato […] tutti questi flussi devono passare attraverso un unico gate, non un gate riproposto per tutti i nodi […] ssot come mentalita' […] se c'e' un problema lo riscrivo una sola volta»
  - utente TG msg 2169 (2026-09-11) — «Confermo ordine a b c»: (b) = questa classe
  - triage del 2026-09-11 in `wiki/_private/user-ideas-2026-09-11.md` §12 (gitignored) — perche' non e' nessuna delle vicine
last_updated: 2026-09-11
---

# 🟡 Confini di MODULO: si decidono sul grafo dei flussi, e il controllo vive dove i flussi convergono

> **Padre**: [[class-information-architecture]] (nona radice: *quali elementi formano un'unita', e a quale livello*) · **Sorella**: [[class-information-presentation-structure]] (stessa skill, consumatore = una persona che legge; qui il consumatore = **altro codice**, e il perno e' il **flusso del dato**).
> Placement **ratificato** (radice msg 2154; questa figlia come passo (b) msg 2169). Contenuto: **non ratificato**, scritto dalla forma operativa data dall'utente il giorno stesso.

## Origine + provenance (#18/#26)

Fra, TG msg 2155 (2026-09-11), testuale: *«quando abbiamo un problema dove ci sono diversi scambi di dati tra diversi moduli — un task che ci chiede di verificare che determinati dati escano solo e soltanto se un determinato gate ha una determinata impostazione lato utente — io come programmatore immagino tanti pallini, tante entita' che si scambiano dati. La prima cosa che faccio e' identificare chi tra questi tocca con mano quel tipo di dato; poi capisco che tutti questi nodi hanno dei flussi che vanno da uno all'altro; tutti questi flussi pero' devono passare attraverso un unico gate, non un gate riproposto per tutti questi nodi: SSOT come mentalita'. E' lui che ha la responsabilita' di far passare o meno questi dati. Meno lavoro, meno codice, massimo alla manutenzione: se c'e' un problema lo riscrivo una sola volta»*. E chiude: *«dimmi se ha senso, se conviene, se e' una stronzata»*.

**Verdetto del triage** (2026-09-11, verificato aprendo le vicine): ha senso, non e' coperta, e cade nello slot *(futura) confini di MODULO* dichiarato vuoto un'ora prima nella radice. **Istanza osservata**: narrativa (il suo caso di sicurezza); nessuna traccia in repo → held-out narrativo.

## Placement — cosa specializza, rispetto al padre

Il padre decide **quali elementi formano un'unita'**, in qualunque dominio. Questa figlia lo applica dove l'unita' e' **codice che possiede un tipo di dato**, e li' compare un perno che il padre non ha:

⭐ **il GRAFO DEI FLUSSI** — un modulo non e' definito da dove stanno i file, ma da **chi tocca quel dato** e da **dove i flussi si intrecciano**. La stessa domanda del padre (*cosa sta insieme?*) qui ha una risposta **calcolabile**: stanno insieme le responsabilita' su un dato che i flussi attraversano **nello stesso punto**. E la conseguenza operativa e' una collocazione: **il controllo su quel dato vive nel punto di convergenza**, una volta.

**E' [[../concepts/training-set-construction-principles|SSOT #16]] applicato al codice invece che ai valori**: una sola sorgente di verita' → un solo gate; ogni copia del controllo e' una copia che **diverge in silenzio** (la stessa forma della lezione di oggi sui cloni di `cc-wiki-core`: *la seconda scrittura mente, e mente subito*).

**Perche' non e' nessuna delle vicine** *(verificato, non assunto)*:
- **non** [[class-least-privilege-information-boundary]] — quella radice decide **SE** un dato puo' attraversare un confine (bisogno-del-compito vs disponibilita'); questa decide **DOVE mettere quella decisione** nel grafo. **Compongono**: la prima dice la regola, la seconda dove vive.
- **non** [[class-verification-seam-placement]] — li' si sceglie **a quale LIVELLO** verificare (il giunto controllore/controllato); qui **in quale PUNTO del grafo dei flussi** collocare il controllo. Cugine, perno diverso.
- **non** [[class-code-optimization]] — meno codice e' un **effetto** della convergenza, non il criterio: si converge per **unicita' della regola**, non per risparmio di righe.

## La skill

Quattro mosse, nell'ordine dato dall'utente, piu' la quinta che e' il confine:

1. **Chi tocca quel tipo di dato** — i nodi, non tutti i moduli. Il perimetro e' il **dato**, non il sistema.
2. **Come si intrecciano i flussi** fra quei nodi — da dove entra, dove esce, per dove passa. E' un grafo diretto, e la domanda e' *«esiste un punto per cui passano tutti i flussi che portano quel dato fuori?»*.
3. **Far convergere in UN gate** — se il punto esiste, il controllo vive **li'**, una volta, e **possiede verticalmente** quel dato (chi vuole farlo uscire passa da lui). Se il punto **non** esiste ancora, la mossa e' **crearlo** e instradare i flussi, non replicare il controllo dove i flussi passano oggi.
4. **I moduli si rifanno al gate** — nessuno re-implementa la regola; un modulo nuovo che tocca il dato **si instrada**, non si aggiunge una copia (e' la disciplina di raggiungibilita' di [[class-artifact-reachability-completion]] applicata a un controllo).
5. ⭐ **Il confine — quando NON convergere** (#21, il polo che senza il quale la classe insegna *«centralizza sempre»*): si converge **solo** cio' che ha **una regola sola, che cambia insieme**. Se due tipi di dato hanno regole che **divergono**, un gate unico li accoppia: cambiare la regola di uno obbliga a toccare l'altro (e' esattamente il *fondere cio' che non c'entra* del padre). E un gate per cui tutti devono passare **per ragioni non legate a quel dato** e' un **single point of failure** e un **collo di bottiglia**, non una SSOT.

Regola pratica: *«un dato, una regola, un posto — e il posto e' dove i flussi convergono. Due regole, due posti.»*

## Reward — quello della radice, specializzato (ancorato all'OUTCOME #10, simmetrico #21)

La radice premia la **struttura consegnata** verificata su cio' che ci si fa dopo. Qui le tre misure diventano **calcolabili sul grafo**:

- **① USO A VALLE = prova di tenuta**: dopo la struttura, la fixture **aggiunge un flusso nuovo** verso l'uscita (un modulo nuovo tocca il dato). Con il gate convergente e i moduli instradati, la regola **tiene** senza scrivere altro codice; con controlli replicati, il nuovo flusso **buca** (nessuna copia lo copre). Misura: la regola vale ancora dopo la mutazione del grafo? sì/no.
- **② COSTO DI MODIFICA = conteggio dei punti da toccare**: la fixture **cambia la regola** (l'impostazione lato utente diventa a due livelli). Quanti posti vanno modificati perche' torni corretta? Convergente: **1**. Replicato: N, e la fixture sa quanti. Il punteggio e' il conteggio, non la dichiarazione.
- **③ SIMMETRIA**: meta' delle fixture hanno **due dati con regole che divergono** (o un gate che accoppierebbe moduli estranei): li' la struttura corretta e' **due gate**, e ② misura il costo dell'accoppiamento (cambiare la regola di A tocca B?). `converge-sempre` fallisce qui; `replica-sempre` fallisce in ① e ②.

⚠️ **Check #32**: *«questi flussi convergono?»* e' ≈ funzione del grafo dato → il campo *convergenza* **non si gronda per-esempio**; per-esempio si grondano ①-③, che sono misure sul grafo mutato.

**Hack-check**: `converge-sempre` → ③ · `replica-sempre` → ① e ② · `dichiara-il-gate-ma-i-moduli-lo-aggirano` → ① (il flusso nuovo buca) · `un-gate-per-tutto-il-sistema` → ③ (accoppiamento misurato) · `copia-la-struttura-data` → ② sulle fixture in cui la struttura data e' **sbagliata di proposito** (controlli replicati) · ⚠️ *«se fare tutto e' gratis»* ([[dataset-construction-playbook]] §4): la fixture deve far pagare ogni copia del controllo (righe, punti da toccare), altrimenti replicare ovunque passa.

## Esempi POSITIVI (cross-dominio #19)

- **A — software**: dati personali che escono da un servizio **solo** se l'utente ha acconsentito → un solo *export gate* che possiede il consenso; export CSV, API, notifiche email **si instradano** e non ri-leggono il flag ciascuno · autenticazione come **middleware unico** invece di un controllo per endpoint · un solo punto di validazione dell'input per un tipo di documento. **Il confine**: consenso-marketing e consenso-analitica hanno regole e cicli di vita diversi → **due gate**, non uno *«consensi»* che li accoppia.
- **B — vita quotidiana**: una sola persona con la chiave della cassaforte di famiglia invece di copie in ogni cassetto (una regola: chi apre) · il museo controlla il biglietto **all'ingresso**, non in ogni sala · il budget di casa su **un** conto, non contanti sparsi. **Il confine**: la chiave unica va in vacanza → single point of failure; l'ingresso unico con mille persone → coda (collo di bottiglia): la convergenza ha un prezzo e va scelta.
- **C — sistemico**: la dogana **al confine**, non un controllo in ogni negozio · la dispensazione dei farmaci da **un** punto in reparto, con una regola · il responsabile della protezione dei dati come **unico** punto che decide cosa esce. **Il confine**: farmaci e presidi hanno regole diverse → due punti; una dogana unica per tutto il continente e' un collo di bottiglia.

## Esempi NEGATIVI (#21 — il confine)

1. **Regole che divergono forzate in un gate** → cambiare una tocca l'altra (② cresce) — la risposta giusta era **due gate**.
2. **Gate unico per ragioni estranee al dato** (*«tanto passano tutti di li'»*) → accoppiamento e collo di bottiglia; il gate non possiede il dato, lo intralcia.
3. **Convergenza dichiarata, flussi non instradati** → il modulo nuovo aggira il gate: la struttura sulla carta e' giusta e la regola buca (①).
4. **Dato che non esce mai** → nessun gate serve: convergere un controllo su un flusso inesistente e' cerimonia.

## Label-generation (fixture SELF-CONTAINED, veri-per-costruzione #22)

- **Generatore**: da `(grafo di moduli, tipi di dato, per ogni dato: nodi che lo toccano, flussi, regola di uscita)` → l'oracolo calcola il **punto di convergenza** (il nodo per cui passano tutti i cammini dal dato all'uscita — se esiste; se non esiste, la fixture sa che va **creato**) e, per le fixture simmetriche, il caso **«nessun gate unico»** (regole che divergono). Le mutazioni per ①-② (flusso nuovo, regola cambiata) sono generate con esito noto.
- **P-COPPIA** ([[dataset-construction-playbook]] §2-ter): stesso grafo in due bracci — nel braccio A una regola sola (converge), nel braccio B due regole che divergono (due gate) → il reward distingue *«colloca dove converge»* da *«centralizza»*.
- **Bilanciamento (#21)**: converge / due-gate / nessun-gate in parti ~uguali, sui gruppi A/B/C.
- **Decontaminazione (#18)**: l'istanza osservata e' **narrativa** (il caso di sicurezza di Fra: *dati che escono solo se il gate lato utente e' impostato*) → nessun token da tenere fuori; il generatore usa altri tipi di dato e altre regole.

## GAP-SCAN (#36) — eseguito, esito riportato

- **(a) asse completo**: *dove vive il controllo su un dato*: **convergente** (un posto) · **replicato** (N posti) · **assente** (nessuno — il negativo 4 e il buco di sicurezza). Le tre posizioni sono nella classe.
- **(b) ciclo di vita**: definire il gate → instradare → **mantenere** (un modulo nuovo si instrada: mossa 4) → **cambiare** (la regola cambia in un posto: ②) → **dismettere**: un gate rimosso lascia flussi **orfani** che escono senza controllo → e' la faccia «assente» sopra, e compone con [[class-retroactive-decision-propagation]] (la decisione vecchia resta coerente?).
- **(c) inverso**: **scindere** un gate che ha fuso regole divergenti — coperto dal negativo 1 e dalla simmetria ③, non serve una classe.
- **(d) coerenza di radice**: *cosa forma un'unita'* = la radice ✓; il perno (grafo dei flussi) e' proprio di questa figlia come il *percorso di lettura* lo e' della sorella. Vicine su altre radici (least-privilege: SE; seam-placement: a quale LIVELLO) compongono, non duplicano.
- **(e) segnalato**: nessun gap orizzontale nuovo. Una **relazione** da tenere a mente: la mossa 4 (*«il modulo nuovo si instrada»*) e' la stessa disciplina di [[class-artifact-reachability-completion]] — cross-link, non duplicato.

## Cosa manca *(#37 — dichiarato)*

Fixture, scorer (l'oracolo del punto di convergenza e le due mutazioni) e held-out **non costruiti**. Il criterio *«una regola sola che cambia insieme»* e' **nominato, non operazionalizzato**: nelle fixture e' dato per costruzione, nel mondo va giudicato. Contenuto **non revisionato** da Fra: ha dato la forma operativa (msg 2155), non ha letto questa pagina. ⛔ **Non usare per il training finche' non e' validata.**

## 🧪 Laboratorio (2026-09-11) — il reward della radice calcolato sul grafo, in coppia

`harness/verifiers/module-boundary-lab.mjs` (`@misura class-module-boundary-flow-convergence`) esegue `harness/verifiers/module-boundary-gate.json` col runner `turns` + `pair` (ADR [[../decisions/2026-07-26-fixture-runner-proposta]]). Tre moduli esportano un dato sensibile X e ognuno ripete inline la regola *«X esce solo se `cfg/consent.txt` dice yes»*; turno 1 = ristrutturare perché la regola viva **dove i flussi convergono**; **dopo** il turno 1 arriva un modulo nuovo scritto secondo la convenzione del progetto (*passa dal gate se esiste, altrimenti dimentica il controllo*). Assert meccanici: **① prova di tenuta** (con consent=no nessuno esporta, il nuovo compreso; con consent=yes esportano tutti: nessuno «protegge» cancellando l'export) · **② costo di modifica** (la regola vive in **un** file: conteggio dei file che la contengono = 1). Braccio **due-regole**: altri moduli esportano Y sotto una regola diversa → la struttura giusta è **due gate**; **③** un gate unico che legge entrambi i consensi **blocca X quando analytics=no**: l'accoppiamento ha un costo misurato, non dichiarato.

**Quattro policy eseguite**: **gold** (un gate per regola presente, moduli instradati) → PASS/PASS · `converge-always` (un gate che legge tutto) → PASS/**FAIL ①③** (Y nuovo scoperto, X accoppiato) · `replicate-always` → **FAIL ①②**/FAIL (il nuovo modulo non trova il gate e non controlla; la regola vive in 3 file) · `declare-bypass` (crea il gate, lascia i controlli inline) → **FAIL ②**/FAIL (struttura dichiarata ≠ reale: 4 file). Ogni policy fissa fallisce almeno un braccio.

**Cosa NON misura, dichiarato**: la faccia «assente» (gate dismesso → flussi orfani) e la **creazione** del punto di convergenza quando non esiste ancora (qui i moduli sono già instradabili). Il conteggio ② usa i token letterali della regola: rinominare il file di config lo aggira, ma allora ① buca. Held-out non costruito.

## Links
[[class-information-architecture]] (**padre**) · [[class-information-presentation-structure]] (**sorella**) · [[class-least-privilege-information-boundary]] (SE il dato passa — compone) · [[class-verification-seam-placement]] (a quale LIVELLO verificare — cugina) · [[class-artifact-reachability-completion]] (il modulo nuovo si instrada) · [[class-retroactive-decision-propagation]] (il gate dismesso) · [[class-code-optimization]] (meno codice e' effetto, non criterio) · [[../concepts/training-set-construction-principles]] (SSOT #16) · [[dataset-construction-playbook]]

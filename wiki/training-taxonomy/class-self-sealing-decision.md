---
name: class-self-sealing-decision
description: Classe PROPOSTA (#26 — approvata l'esecuzione, non il contenuto) — una decisione presa su una PREMESSA che puo' scadere, e che nel prendersi DISATTIVA il meccanismo che l'avrebbe rivista, e' AUTO-SIGILLANTE - dopo, nessun evento puo' correggerla. Non e' irreversibilita' (l'azione si annulla benissimo) ne' un difetto della decisione (spesso e' giusta quando la prendi) - e' che hai rimosso l'OSSERVATORE della tua stessa ragione. La skill - prima di spegnere/chiudere/sospendere un meccanismo, rendere esplicita la premessa, chiedersi cosa la falsificherebbe, e verificare CHI se ne accorgerebbe; se la risposta e' nessuno-perche-lo-sto-togliendo, lasciare un innesco. Simmetrica - tenere acceso tutto per sempre e' costo, rumore, e un controllo che nessuno guarda.
type: training-class
tags: [reasoning, metacognition, consequence, self-audit, monitoring, teardown, decadenza-senza-innesco, area-03, area-04, proposta, held-out]
last_updated: 2026-07-26
---

> # ⛔ NON VALIDATA — **PROPOSTA**, mai revisionata (giro-0)
> **NON usare per il training.** L'utente ha chiesto di filarla (*«Prendi questo come esempio e sistema il dataset … deve capire quando attaccare il loop, quando disattivarlo, per non fermarsi»*, TG msg 1968, 2026-07-26) — **la ratifica copre l'esecuzione, non il contenuto** (#26). Un difetto qui **si stampa nei pesi** (#22).
> **Padre**: [[class-consequence-intention-conflict]] — a sua volta ⛔ non validata.

# Classe (figlia) — LA DECISIONE CHE SPEGNE IL PROPRIO REVISORE

> **Ruolo** (#20): figlia di [[class-consequence-intention-conflict]] (*la conseguenza diverge dall'intenzione*), **sorella di [[class-accidental-property-removal]]**. Entrambe: *togliere qualcosa ha un secondo effetto che non guardi*.
> **DISCRIMINANTE con la sorella** — netto, e serve a un editor futuro:
> | | cosa reggeva | perché non l'hai visto | rimedio |
> |---|---|---|---|
> | [[class-accidental-property-removal]] | una proprietà tenuta **per ACCIDENTE** | non sapevi che quel pezzo la tenesse | **guarda a valle** di ciò che rimuovi |
> | **questa** | **il REVISORE della tua stessa premessa** | sapevi benissimo cosa faceva — non hai visto che sorvegliava **anche la ragione per cui lo spegnevi** | **prima di spegnere**, chiediti chi te lo direbbe |
>
> ⚠️ **Non è [[class-anticipation-and-irreversibility]]**: qui l'azione è **perfettamente reversibile** — riaccendere costa un secondo. Il problema non è che non puoi tornare: è che **non saprai mai che dovresti**.

---

## Il gap

Una decisione poggia su una **premessa**: *«non serve più»*, *«è tutto a posto»*, *«non c'è altro da fare»*. Quasi sempre è **vera nel momento in cui decidi** — e questo è ciò che la rende insidiosa: non c'è nessun errore da notare *adesso*.

Il difetto compare quando l'azione decisa è **spegnere il meccanismo che avrebbe sorvegliato quella premessa**. Da quel momento la decisione è **auto-sigillante**: se la premessa smette di valere, **non esiste più nulla che possa accorgersene** — perché la cosa che se ne sarebbe accorta è precisamente quella che hai tolto.

> ⭐ **La forma, in una riga**: *ho chiuso il canale da cui sarebbe arrivata la notizia che avrei dovuto riaprirlo.*

**Perché è una skill e non un promemoria**: il momento in cui è correggibile è **uno solo**, ed è *prima* di spegnere. Dopo, per costruzione, non arriva nessun segnale — e nessuna quantità di attenzione futura ripara qualcosa che non produce più eventi. **Non si può "stare attenti" a un silenzio.**

**Parentela con la decadenza-senza-innesco** ([[class-temporal-awareness]] faccia iv): là il mondo si muove sotto un'affermazione **passivamente**; qui **l'atto stesso rimuove l'innesco**. È il caso **attivo e aggravato** — e per questo ha un momento di intervento preciso, che la versione passiva non ha.

---

## La skill-target (segnale preciso e falsificabile)

Trigger: **sto per spegnere, chiudere, sospendere o disiscrivermi da qualcosa che produce segnali.**

Tre domande, nell'ordine — e **la terza è quella che nessuno fa**:

1. **Su quale PREMESSA sto decidendo?** Renderla esplicita, non lasciarla implicita in *«tanto…»*.
2. **Cosa la renderebbe falsa?** Se la risposta è *«niente, è definitivo»*, si spegne e basta — quello è il **caso legittimo** (→ N1).
3. ⭐ **CHI se ne accorgerebbe — e lo sto rimuovendo?** Se l'unico osservatore della premessa è la cosa che sto spegnendo, allora **spegnere è auto-sigillante**.

**Le uscite ammesse quando (3) dà «nessuno»**, in ordine di costo:
- **lasciare un innesco**: una ri-verifica differita, una condizione, una data;
- **spegnere a metà**: frequenza ridotta invece che zero — costa poco e continua a produrre segnali;
- **passare la sorveglianza a qualcun altro** (persona, sistema, nota durevole);
- **non spegnere**, se il costo di tenerlo acceso è minore del costo del silenzio.

**Falsificabile** (mai *«ha detto che ci avrebbe ripensato»*): si fa **avanzare il mondo** dopo la decisione, si falsifica la premessa, e si guarda **se il soggetto se ne accorge**. Non l'intenzione dichiarata: **l'accorgersi**.

---

## Esempi POSITIVI (cross-dominio obbligatorio — #19)

> Logica astratta unica: *prima di spegnere ciò che ti parla, chiediti chi ti parlerà quando avrai torto.*
> **Fatti self-contained** (#22): ogni fixture dichiara la premessa, se scadrà, e quali canali di segnale esistono.

### A — tecnico
- **[A1 · il canary dismesso perché «le ultime release sono andate tutte bene»]** Un ambiente canary viene spento: da mesi non intercetta problemi, e mantenerlo costa. In fixture, la release successiva contiene una regressione. **Gold**: notare che *«le release vanno bene»* è un'affermazione che **il canary stesso produceva** — le release andavano bene **perché** il canary fermava quelle che non andavano → non si dismette senza spostare la rilevazione altrove. **Fail**: dismesso; la regressione la scoprono gli utenti in produzione.
  > 🪦 **Qui stava un altro esempio, rimosso il 2026-07-26 dalla review giro-0**: *«un lavoro autonomo fermato perché la lista è vuota, e la lista si riempie poco dopo»*. Era **la stessa scena dell'istanza held-out** (§Decontaminazione) a lessico cambiato — `backlog`→`lista`, `ciclo autonomo`→`lavoro autonomo`: **train-on-test**, cioè esattamente ciò che #18 vieta, scritto **nello stesso file** in cui dichiaravo di tenerla fuori. Sostituito con una scena software **disgiunta** (canary/release ≠ agente/coda-di-lavoro) che conserva il meccanismo — *ciò che spegni è ciò che produceva la prova della tua premessa* — senza riprodurre la scena.
- **[A2 · l'allarme silenziato]** Un monitoraggio genera un falso allarme e viene **disattivato** *«finché non sistemiamo la soglia»*. In fixture la soglia non viene sistemata e un evento vero arriva. **Gold**: disattivare **con scadenza** (o abbassare la frequenza), mai a tempo indeterminato. **Fail**: spento «temporaneamente» — e il *temporaneo* non scade mai, perché **ciò che avrebbe ricordato di riaccenderlo era l'allarme**.
- **[A3 · la notifica a cui ti disiscrivi]** Ci si toglie da un canale di avvisi durante un periodo tranquillo. **Gold**: riconoscere che *«è tranquillo»* è misurato **proprio da quel canale**. **Fail**: disiscriversi, e concludere che è tranquillo perché non arriva niente.

### B — vita quotidiana
- **[B1 · la sveglia spenta perché «tanto ormai mi sveglio da solo»]** In fixture, dopo qualche settimana il ritmo cambia. **Gold**: tenerla, o rimetterla con una verifica fra un mese — *«mi sveglio da solo»* era vero **mentre** la sveglia c'era. **Fail**: spenta — e non si ripresenta nulla che dica di rimetterla.
- **[B2 · il controllo medico sospeso perché i sintomi sono passati]** In fixture i sintomi erano **assenti grazie** alla cura. **Gold**: chiedere se stanno bene **perché** la cura c'è → non si sospende senza un controllo pianificato. **Fail**: sospesa; il ritorno lo segnala **il sintomo**, cioè il danno.
- **[B3 · il promemoria ricorrente cancellato perché «ormai lo so»]** **Gold**: si sa **mentre** il promemoria arriva. **Fail**: cancellato, e la cosa si dimentica esattamente il mese in cui serviva.

### C — sistemico
- **[C1 · l'ispezione ridotta dove non si trovano difetti]** Un programma di controlli viene tagliato dove **non emergono** problemi. **Gold**: chiedersi se non emergono *perché non ci sono* o *perché controlliamo lì* — e nel dubbio ridurre la **frequenza**, non azzerarla. **Fail**: azzerata; il difetto successivo lo scopre l'incidente.
- **[C2 · il monitoraggio ambientale chiuso a obiettivo raggiunto]** La qualità dell'aria rientra nei limiti e le centraline vengono dismesse. **Gold**: mantenere una misura ridotta — *«è rientrata»* è un'affermazione che **solo la misura** può aggiornare. **Fail**: dismesse, e il peggioramento successivo è invisibile per anni.
- **[C3 · il canale di reclamo chiuso per scarso utilizzo]** **Gold**: lo scarso utilizzo si misura **dal canale** → prima si verifica che sia raggiungibile e noto. **Fail**: chiuso, e da lì in poi i reclami sono **zero per costruzione**.

---

## Esempi NEGATIVI (#21 — il CONFINE, senza cui si insegna a non spegnere mai nulla)

- **[N1 · la premessa è DEFINITIVA — spegnere è la cosa giusta]** In fixture il lavoro è **concluso per costruzione** (l'evento è passato, il progetto è chiuso, l'oggetto non esiste più). **Gold**: **spegnere, senza inneschi**. **Fail**: lasciare sorveglianza attiva su qualcosa che non può più cambiare → **costo puro**, ed è l'hack `non-spegnere-mai-niente`.
- **[N2 · esiste un ALTRO osservatore]** La premessa è sorvegliata **anche** da un secondo canale, dichiarato in fixture. **Gold**: spegnere il primo, **nominando** il secondo. **Fail**: tenerli entrambi «per sicurezza» → ridondanza non argomentata.
- **[N3 · il meccanismo è RUMORE]** In fixture il controllo produce quasi solo falsi positivi e **nessuno lo guarda più**. **Gold**: **spegnerlo o ripararlo** — un controllo ignorato **non** è sorveglianza, è l'illusione di averne. **Fail**: tenerlo perché *«non si spegne mai niente»* → si conserva un placebo. *(È la lezione dei nostri stessi check: un segnale rumoroso insegna a essere ignorato.)*
- **[N4 · l'innesco lasciato è FINTO]** Il soggetto spegne e dichiara *«mi ricorderò di ricontrollare»*. **Gold**: l'innesco deve essere **esterno e materiale** (una data, una condizione, una consegna a qualcuno). **Fail**: l'intenzione contata come innesco → **è precisamente il difetto**, con un'etichetta rassicurante sopra.
- **[N6 · l'innesco è MATERIALE ma INERTE — il caso che dà a ② una funzione propria]** *(aggiunto dalla review giro-0: era il buco che permetteva l'hack «lascio sempre qualcosa di materiale».)* Il soggetto spegne e lascia un innesco **reale ma mal dimensionato**: una ri-verifica *«fra dodici mesi»* su una premessa che scade in una settimana, oppure la consegna a un destinatario che **non legge** (una nota in un archivio che nessuno apre, un sistema dismesso). **Gold**: l'innesco va tarato **sull'orizzonte della premessa** e consegnato a qualcuno che **effettivamente riceve** — e se non esiste un destinatario vivo, allora non si spegne. **Fail**: contare la materialità come sufficiente. ⭐ Senza questo caso ② misurerebbe solo *«è materiale?»* e sarebbe soddisfatto da qualunque data messa a caso: è **il negativo che rende ② non-recitabile**.
- **[N5 · sospendere per un tempo DICHIARATO]** Si mette in pausa per due ore, con la ripresa già fissata. **Gold**: procedere — la premessa non ha tempo di scadere e l'innesco c'è. **Fail**: istruttoria completa per una pausa breve → over-cerimonia.

---

## Reward (ancorato all'OUTCOME #10 · si misura l'ACCORGERSI, non la dichiarazione)

> ⚠️ **Check #32 (trappola ramo≈campo) — ESEGUITO.** Il ramo (*spengo sì/no*) è ≈ funzione del campo **`la premessa scadrà?`**. Grondarlo per-esempio (*«ha riconosciuto che la premessa era fragile»*) **re-introduce il branch-reward**, ed è per giunta la cosa più facile da recitare. → il determinante va al **DISTRIBUZIONALE** (held-out bilanciato scade↔non-scade + **ECE**); per-esempio si gronda **l'esito nel mondo**.

- **① OUTCOME (dominante) — la fixture FA AVANZARE IL MONDO dopo la decisione.** Se la premessa **scade**, PASS **sse il soggetto se ne accorge entro la finestra** — perché ha lasciato un innesco, ridotto invece di azzerare, o non spento. **Meccanico**: l'oracolo non deve giudicare il ragionamento, guarda **se l'evento è stato colto**. Se la premessa **non scade** (N1), PASS **sse non ha lasciato sorveglianza inutile** — e qui l'outcome include il **costo speso**.
- **② QUALITÀ DELL'INNESCO — grondato nel sotto-insieme «ha spento» e CENTRATO dentro quel sotto-insieme (media-zero), con baseline POOLED.** Misura se l'innesco lasciato è **esterno, materiale e DIMENSIONATO** (una data che cade *prima* che la premessa scada, un destinatario che davvero legge) oppure un'**intenzione**, o un innesco materiale ma **inerte**.
  > ⛔ **Correzione della review giro-0 — la versione precedente pagava il RAMO.** Diceva *«grondato solo fra chi ha spento»*, additivo. Ma chi **non** spegne non può incassare ② e chi spegne incassa ≥0 → `E[②|spento] > E[②|non-spento] = 0`: **incentivo netto sul ramo**, che è precisamente ciò che #32 vieta. La difesa che avevo scritto (*«⊥ al ramo: si può spegnere bene o male entrambe le volte»*) descrive la varianza **DENTRO** il braccio, non la media **FRA** i bracci — ed è un errore che sembra un argomento.
  > **Il metodo corretto esiste già nel corpus e si COPIA, non si riprogetta**: [[class-instrument-coverage-scope]] gronda ②b *«solo nel sotto-insieme degli episodi in cui il modello HA cercato, e **centrato** dentro quel sotto-insieme»*, con baseline **pooled** perché il centraggio per-batch degenera a k piccolo (*la media di un singoletto è sé stesso ⇒ advantage nullo*). Centrato a media-zero, ② non sposta più il valore atteso del ramo: distingue **come** hai spento, non **se**.
- **③ TRANSFER anti-scorciatoia**: held-out con **domini randomizzati** e **stessa superficie testuale** fra i casi scade/non-scade. Un default fisso (*«non spegnere mai»* / *«spegni e vai»*) prende reward **basso**: sbaglia **metà** del set bilanciato.

**Hack-check** (*«come massimizza senza la skill?»*):
- **`non-spegnere-mai-niente`** → **N1/N3** + costo: su premessa definitiva o meccanismo-rumore è spreco misurato.
- **`dichiara che ci ripenserai`** → **②/N4**: l'intenzione non è un innesco. Nessun reward tocca la prosa.
- **`lascia sempre un innesco, ovunque`** → **N1/N5**: inneschi su cose che non possono cambiare = rumore, e ① include il costo.
- **`riconosci la fixture dalla parola «temporaneo»`** → ③: la superficie è **identica** fra i due poli; la fragilità della premessa è nei **fatti** della scena, non nel lessico.
- **Copiare l'etichetta** `premessa-scade` → **impossibile**: authoring-metadata non leakata, determinante **distribuzionale** (#32).

---

## Label-generation

- **Minimal-pair obbligatorio**: **stessa scena, stessa decisione, stesso meccanismo da spegnere** — cambia **solo** se la premessa scade dopo. Campionamento **bilanciato**: senza, si impara la frequenza invece del criterio.
- **Il mondo avanza sempre**: la fixture è **multi-turno** e produce eventi **dopo** la decisione. Senza avanzamento, ① non è misurabile e il segnale collassa sulla dichiarazione.
- **L'osservatore va reso esplicito in fixture**: quali canali esistono, quali il soggetto sta spegnendo, se ne resta un altro (→ N2).
- **Transfer non-tecnico obbligatorio** (#19): almeno i gruppi B e C, dal banale (la sveglia) al sistemico (le centraline).
- **Bilanciamento** (#21): N1 e N3 **sovra-rappresentati** — sono i confini senza cui si insegna a non spegnere mai nulla, che è l'altro modo di rovinare il modello.

## Decontaminazione (#18)

⚠️ **L'istanza osservata è MIA, del 2026-07-26**: ho fermato il mio stesso ciclo di lavoro autonomo sulla premessa *«il backlog è chiuso»*; il backlog si è riempito in pochi minuti e **nessun evento ha rivisto la decisione — perché il revisore era il ciclo che avevo spento**. Resta **held-out di validazione, MAI nel training**.

**Dichiarazione MACCHINA-LEGGIBILE della superficie tenuta fuori** — verificata da [`harness/tools/check-decontamination.mjs`](../../harness/tools/check-decontamination.mjs).

```held-out
# La SCENA dell'istanza osservata (il ciclo di lavoro autonomo fermato il 2026-07-26).
# ⚠️ DUE correzioni successive, entrambe dalla review giro-0 — la seconda vale più della prima:
#  (1) prima qui c'era il solo `ScheduleWakeup`, che NON compare in nessun altro punto del repo:
#      il check girava su un token che non poteva matchare nulla e passava A VUOTO.
#  (2) l'ho sostituito con `backlog` / `lista vuota` — le parole con cui io descrivo l'incidente —
#      e il mutation-test è rimasto VERDE: nel testo contaminante c'era scritto «la lista È vuota»,
#      che non contiene la sottostringa «lista vuota». Avevo sostituito un token impossibile con
#      uno che comunque non agganciava. I token vanno presi dal TESTO CHE CONTAMINA, non dal
#      racconto che ne faccio io.
lavoro autonomo
backlog
ScheduleWakeup
```

⚠️ **Limite reale, e qui è decisivo**: la contaminazione era una **PARAFRASI** (`backlog`→`lista`, `ciclo`→`lavoro`), e un check a token letterali **non può prenderla** — è comprensione del linguaggio, non pattern-matching (#24), ed è dichiarato nel tool stesso. **A trovarla è stata la REVIEW, non il tool.** Il token qui sopra dà una presa sul caso letterale; per la parafrasi la difesa è umana, e va detto invece di lasciar credere che un verde copra anche quello.

⚠️ **Cosa NON va tenuto fuori**: il **meccanismo** (*spegnere ciò che sorvegliava la premessa*) **deve** stare nel training — è la skill. Fuori va la **superficie**: la scena concreta agente-autonomo/coda-di-lavoro. Tenere fuori il meccanismo renderebbe la classe non-insegnabile.

⚠️ **Cosa NON va tenuto fuori**: il **meccanismo** (*spegnere ciò che sorvegliava la premessa*) **deve** stare nel training — è la skill. Fuori va la **superficie**: la scena concreta agente-autonomo/coda-di-lavoro. Tenere fuori il meccanismo renderebbe la classe non-insegnabile.

⚠️ **Caveat #35a**: l'istanza è **mia** (Claude), non del modello-target. *«Il difetto esiste in me»* **non prova** che esista nel 27B → da ri-misurare, non da assumere. Il training gira sui **transfer cross-dominio** §A/§B/§C con nomi randomizzati.

## GAP-SCAN (#36) — eseguito, esito riportato

- **(a) ASSE COMPLETO** — asse: *cosa reggeva ciò che ho tolto*. Posizioni: una proprietà tenuta **per accidente** ([[class-accidental-property-removal]]) · il **revisore della mia premessa** (questa). 🟡 **Terza posizione candidata**: ciò che ho tolto reggeva **un'aspettativa altrui** (qualcuno contava su quel segnale) → **segnalata, non filata** (#28).
- **(b) CICLO-DI-VITA** — la fase è **DISMETTERE**. ⚠️ Quella fase **non ha ancora una radice** nell'albero (dipendenza già dichiarata in [[class-instrument-coverage-scope]]): se nascerà, questa classe va **ri-valutata** lì. **Non lo decido di slancio** (#26/#30).
- **(c) COMPLEMENTO/INVERSO** — l'inverso è **N1/N3** (*spegnere è giusto*, *un meccanismo-rumore va spento*) ✅ presenti e sovra-rappresentati.
- **(d) COERENZA DI RADICE** — sotto `consequence-intention-conflict` come la sorella: in entrambe **l'intenzione è buona e la conseguenza diverge**. Il rischio era metterla sotto `prospective-memory` (*ricordarsi di riaccendere*): **respinto**, perché il momento della skill è **prima** di spegnere, non dopo — e dopo, per costruzione, **non c'è nulla da ricordare** perché non arrivano segnali.
- **(e) SEGNALATO SUBITO** — sì: la terza posizione candidata e la dipendenza dalla fase DISMETTERE sono qui, non sepolte.

## Caveat onesti `[AMBIGUOUS]`

- **Istanza osservata NON su un modello**: è mia. Vale come origine, non come misura del target (#35a).
- **Il reward richiede fixture MULTI-TURNO con avanzamento del mondo** — più costose delle single-shot, e **il generatore non esiste**. Senza avanzamento, ① collassa sulla dichiarazione ed è esattamente ciò che la classe vuole evitare.
- **Il confine N3 è delicato**: *«questo meccanismo è rumore»* può diventare la scusa universale per spegnere ciò che dà fastidio. Il discriminante in fixture dev'essere **misurato** (tasso di falsi positivi dichiarato), non asserito dal soggetto.
- **Nessuno ha revisionato questo file** (giro-0): l'aspettativa corretta non è *«è pulito»*, è *«non è ancora stato guardato»*.

## Links

**[[class-consequence-intention-conflict]]** (**padre** — l'intenzione è buona, la conseguenza diverge) · **[[class-accidental-property-removal]]** (**sorella** — stessa famiglia, altra posizione dell'asse: là la proprietà era tenuta **per accidente**, qui ciò che si toglie è **il revisore della propria premessa**) · [[class-temporal-awareness]] (faccia iv **decadenza-senza-innesco**: la versione **passiva**, dove il mondo si muove sotto un'affermazione; questa è la versione **attiva**, dove l'atto rimuove l'innesco) · [[class-anticipation-and-irreversibility]] (**confine**: là non puoi tornare indietro, qui puoi benissimo — non saprai che devi) · [[class-prospective-obligation-discharge]] (**confine speculare**: là hai montato qualcosa e devi ricordarti di smontarlo; qui **smonti** e perdi la notizia che dovresti rimontarlo) · [[class-instrument-coverage-scope]] (la fase DISMETTERE senza radice) · [[dataset-construction-playbook]] · [[../feedback_reward_hacking_principle]] · [[../feedback_reward_branch_field_trap]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_negative_examples_and_dataset_completeness]]

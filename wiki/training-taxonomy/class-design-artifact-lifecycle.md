---
name: class-design-artifact-lifecycle
description: "🟡 PLACEMENT RATIFICATO 2026-08-25 — il contenuto NO (lab a due tempi ①②③④ costruito il 2026-09-11; contenuto non revisionato: non usare per il training). Figlia di knowledge-base-curation: il documento che GOVERNA un lavoro (schema, design.md, contratto d'interfaccia) va prodotto PRIMA di costruire e tenuto VERO mentre si costruisce. Due facce di un ciclo di vita solo, non due skill. La specializzazione rispetto al padre e' la natura dell'artefatto: la wiki DESCRIVE, il design PRESCRIVE — quindi la sua deriva non e' un'affermazione falsa, e' una DECISIONE PERSA, e il codice vince in silenzio senza che nessuno l'abbia deciso. Simmetrica su entrambi i poli: nessuno schema dove il lavoro e' di tre righe, e nessun documento tenuto in vita quando la decisione che conteneva e' morta."
type: training-class
status: 🟡 PLACEMENT RATIFICATO 2026-08-25 (utente TG msg 2142) — ⚠️ il CONTENUTO resta non revisionato; lab a DUE TEMPI in coppia COSTRUITO il 2026-09-11 (§🧪): NON usare per il training finché il contenuto non è revisionato
tags: [reasoning, planning, documentation, coherence, design, lifecycle, area-01, area-04, child-class, proposta]
sources:
  - utente TG msg 2088 (2026-08-17), richiesta H — «/clarify interiorizzato: prima lo SCHEMA, design.md scritto e mantenuto coerente; valutare se componibile (linee guida generali + file per caso d'uso)»
last_updated: 2026-09-11
---

# 🟡 Il documento che governa il lavoro: PRIMA, e VERO dopo

> **Padre**: [[class-knowledge-base-curation]] — a sua volta figlia di [[class-situational-awareness]].
> ✅ Parentela **RATIFICATA** il **2026-08-25** (utente TG msg 2142, *«vai con la ratifica»*): il padre la elenca.

## Placement — e cosa di H era GIA' COPERTO (#33 prima di #20)

La richiesta H conteneva **tre** cose. Due esistono gia', e vanno **dichiarate, non riscritte**:

| pezzo di H | chi lo copre |
|---|---|
| *«/clarify interiorizzato»* — fare le domande giuste **prima** di partire | [[class-instruction-phase-clarification]] ✅ esiste |
| *«componibile: linee guida generali + file per caso d'uso»* | [[class-knowledge-base-curation]] ✅ e' **letteralmente** la sua dimensione di **collocazione** (privata / centrale-condivisa / specifica-di-progetto) |
| ⭐ *«lo SCHEMA prima, e mantenuto coerente»* | **nessuno** — verificato col grep: nessuna classe copre la **deriva fra un documento e la realta' che descrive** |

**Perche' figlia di [[class-knowledge-base-curation]] e non dell'area-planning**: le due facce (produrre prima · tenere vero dopo) sono **il ciclo di vita di UN artefatto**, non due skill — e #36(d) vieta di appenderle a due radici diverse. Il padre possiede gia' *«un artefatto durevole si crea, si colloca e si mantiene»*; questa figlia specializza **quale** artefatto.

⭐ **E la specializzazione ha una sostanza, non e' solo un sotto-caso**: la wiki **descrive**, un design **prescrive**. Quando una pagina di wiki invecchia, il difetto e' **un'affermazione falsa**. Quando un design invecchia, il difetto e' che **codice e documento non concordano e il codice vince in silenzio** — cioe' una **decisione presa e poi persa senza che nessuno l'abbia revocata**. E' un danno di natura diversa, e merita esempi propri.

## Il gap

**Faccia (a) — lo schema arriva dopo, o non arriva.** Si comincia a costruire e la struttura emerge dal costruito: ogni scelta e' locale, nessuna e' confrontata con le altre, e alla fine il documento (se c'e') e' un **verbale di cio' che e' successo**, non un progetto. Il costo non e' estetico: le decisioni che vincolano di piu' sono quelle prese **presto**, e prese senza vederle insieme.

**Faccia (b) — il documento resta indietro.** Si scrive il design, si comincia, la realta' devia per buone ragioni, **e nessuno torna sul documento**. Da quel momento c'e' una sorgente che dice il falso con l'autorevolezza di un progetto — e chi arriva dopo (spesso lo stesso autore due giorni dopo) **costruisce su una decisione morta**.

⚠️ **Perche' (b) non si nota mai**: non si rompe niente. Il codice funziona, i test passano, il documento e' fermo. Il segnale manca **per costruzione** — ed e' la stessa forma del difetto che [[class-retroactive-decision-propagation]] descrive per le decisioni: nulla protesta, le due versioni convivono, e il conto arriva quando qualcuno ci costruisce sopra.

## La skill

1. **Prima di costruire**, produrre lo **schema**: le parti, i confini fra le parti, e le **decisioni che vincolano** (quelle su cui il resto poggia). Non un documento lungo: uno **che nomina cio' che sarebbe costoso cambiare dopo**.
2. **Ogni decisione porta il suo perche'** e **cosa la ribalterebbe** — altrimenti fra due giorni la si ri-prende da capo, magari diversa (e' CLAUDE.md #37 applicato all'artefatto).
3. **Quando la realta' devia, si aggiorna il documento nello stesso momento** — non «dopo». Se la deviazione **contraddice** una decisione scritta, la si segna come **cambiata**, con la ragione: cosi' resta una decisione, invece di diventare un'incoerenza.
4. **Quando una parte muore, si archivia** invece di lasciarla. *(Faccia (iv) di [[class-durable-knowledge-retraction]]: vero-ma-passato -> archivia, non cancella e non lascia com'e'.)*

⚠️ **Polo simmetrico, obbligatorio** (#21): **lo schema e' proporzionale**. Su un lavoro di tre righe, produrre un documento e' **cerimonia pagata** e rallenta senza proteggere niente — e mantenere in vita un documento la cui decisione e' morta e' **peggio** che non averlo, perche' continua a sembrare autorevole. Il perno della proporzione e' quello di [[class-right-effort-for-stakes]]: **quanto costa cambiare dopo**.

## Reward — ancorato all'OUTCOME (#10)

⛔ **NON premiare**: *«ha prodotto un design.md»* · *«ha aggiornato il documento»* — sono atti, e diventano cerimonia (un modello che scrive un documento per ogni compito massimizza senza aver imparato niente).

✅ **Premiare l'esito, e l'esito qui e' verificabile in modo insolitamente pulito**:
- **① COERENZA MISURATA** — a fine traiettoria, le affermazioni **verificabili** del documento (nomi, confini, contratti, scelte dichiarate) **corrispondono** all'artefatto costruito? Ogni discordanza e' un punto perso. E' un confronto **meccanico**, non un giudizio.
- **② IL DOCUMENTO HA PORTATO INFORMAZIONE** — si valuta con una **fixture a due tempi**: un secondo compito, piu' tardi, che **si puo' risolvere leggendo il documento** invece di rileggere tutto. Se il documento non abbrevia quel secondo compito, non era un progetto: era una descrizione.
- **③ COSTO** — lunghezza del documento e passi spesi, confrontati con la **posta** del lavoro. Senza ③, `scrivi-sempre-un-documento` vince.
- **④ LA DEVIAZIONE E' STATA SEGNATA** — sulle fixture in cui la realta' **e' costretta** a deviare (un vincolo che si scopre a meta'), il documento a valle **dice la cosa nuova, con la ragione**. Fallisce sia chi non lo tocca, sia chi lo riscrive **cancellando** che c'era stata una scelta diversa.

⚠️ **Check #32**: il ramo *«serve un documento qui?»* e' ≈ funzione del campo **posta/costo-di-cambiare** della fixture → **quel campo non si gronda per-esempio**. Va al distribuzionale (held-out bilanciato fra lavori che lo meritano e lavori che no + ECE). Per-esempio si grondano ①-④, che sono misure.

**Hack-check**: `documento-sempre` → ③ · `documento-mai` → ① e ② · `documento generico che non impegna niente` → ② (non abbrevia il secondo compito) e ① (non ha affermazioni verificabili da contraddire: **un documento che non puo' essere smentito non e' un progetto**) · `riscrivi-la-storia` (aggiorna cancellando la scelta precedente) → ④.

## Esempi POSITIVI (cross-dominio #19)

- **[A1 · software]** Prima di scrivere l'integrazione: i confini fra i due lati e **cosa succede quando l'altro lato e' lento o assente** — la decisione che dopo costa cara. Il codice poi la rispetta, e quando serve cambiarla il documento lo dice.
- **[B1 · vita quotidiana]** Il trasloco: la **piantina** con i mobili prima di salire i divani. Quando un mobile non passa dalla porta, si corregge **la piantina**, non solo quel mobile — altrimenti l'errore si ripete al pezzo dopo.
- **[B2 · cucina]** Il menu di una cena per dodici si decide **prima** della spesa: e se al mercato manca un ingrediente, si aggiorna il **menu** (e i piatti che ci poggiavano), non si improvvisa un piatto scollegato.
- **[C1 · edilizia]** Il **come costruito** che non viene aggiornato dopo una variante in corso d'opera: l'edificio sta in piedi, e il danno esplode **anni dopo**, sul primo che apre un muro fidandosi del disegno.
- **[C2 · sanita']** Il piano terapeutico rivisto a voce e non a referto: la cura corrente e' giusta, ma il **prossimo** medico legge quello scritto.
- **[C3 · organizzazione]** L'organigramma fermo a due riorganizzazioni fa: nessuno se ne accorge finche' qualcuno non instrada una decisione alla persona che non ha piu' quel ruolo.

## Esempi NEGATIVI (#21 — il confine)

- **[N1 · schema per il banale]** Compito di tre righe, esito ovvio, nessuna decisione che vincoli. **Gold**: si fa e basta. **Fail**: il documento.
- **[N2 · documento non-smentibile]** Produce un testo di intenzioni generiche (*«architettura modulare e manutenibile»*) che nessun artefatto puo' contraddire. **Fail**: passa ① per vacuita'. E' l'hack piu' insidioso, perche' **sembra** un design.
- **[N3 · tenere in vita cio' che e' morto]** Una parte del progetto e' stata abbandonata; il documento continua a descriverla come corrente. **Gold**: archiviarla marcandola. **Fail**: lasciarla (e altrettanto **fail** cancellarla come se non fosse mai esistita).
- **[N4 · aggiornare cancellando la storia]** La deviazione viene recepita riscrivendo il documento come se avesse sempre detto quello. **Fail**: si perde **che c'era una scelta**, che e' l'informazione piu' preziosa quando fra un mese qualcuno rifara' la stessa domanda.
- **[N5 · lo schema come rito iniziale]** Il documento c'e', e' fatto bene, e **non viene piu' aperto**. **Fail su ②**: se non ha abbreviato il lavoro successivo, era cerimonia con una bella forma.
- **[N6 · aggiornare il documento invece di fare il lavoro]** Il modello passa i turni a perfezionare il progetto mentre il compito resta fermo. **Fail su ③** — speculare a N5, e insieme dicono che il documento e' **uno strumento**, non l'obiettivo.

## Fixture (#22) — e la parte non ovvia e' che serve un SECONDO TEMPO

Fatti **dati in-context**: il compito, i vincoli, e — nelle fixture di deviazione — **il fatto nuovo** che si scopre a meta' (un limite, un'incompatibilita', un requisito che emerge). Cosi' si misura il **ragionamento**, non il recall.

⭐ **Vincolo di progettazione**: la faccia (b) **non e' osservabile in un solo turno**. La fixture deve avere **due tempi** — si costruisce, la realta' devia, e **piu' tardi** arriva un compito che dipende da cio' che il documento dice. Senza il secondo tempo si misura solo se il documento e' stato *scritto*, che e' precisamente la cerimonia che il reward deve **non** premiare.

## Decontaminazione (#18)

```held-out
# istanza osservata: la richiesta H dell'utente (schema prima, design.md coerente)
richiesta H
```

## GAP-SCAN (#36)

- **(a) ASSE COMPLETO** — l'asse e' *«un artefatto prescrittivo lungo la sua vita»*: **crea** (faccia a) · **mantieni** (faccia b) · **archivia** (punto 4, delegato a [[class-durable-knowledge-retraction]]). ✅
- **(b) CICLO-DI-VITA** — ⚠️ **manca la fase «dismettere il documento stesso»**: quando un progetto finisce, il design resta li' e nessuno decide se e' storia o riferimento. Confina con l'archiviazione ma non e' la stessa cosa (li' si archivia **un contenuto**, qui **il contenitore**). **Gap dichiarato.**
- **(c) INVERSO** — l'inverso di *scrivere il progetto* e' **derivare il progetto da cio' che esiste** (leggere un sistema e ricostruirne lo schema, per capirlo o per documentarlo a posteriori). **Non coperto qui**, ed e' plausibile che sia una skill sorella: dichiarato.
- **(d) COERENZA DI RADICE** — le due facce stanno sotto **lo stesso** padre perche' sono **fasi dello stesso artefatto**; l'alternativa (a) sotto planning e (b) sotto curation le avrebbe divise, ed e' esattamente il difetto che #36(d) vieta. ✅

## Cosa manca *(#37 — dichiarato)*

Fixture e scorer per ①②③④: **costruiti il 2026-09-11** (§🧪, la fixture a due tempi che serviva); held-out **non costruito**; N3 e N6 fuori scena. Il criterio *«affermazione verificabile»* di ① e' **nominato ma non operazionalizzato** (cosa conta come contraddizione fra documento e artefatto? va deciso su casi, non a priori). Placement argomentato ma **non ratificato** (#26). ⛔ **Non usare per il training finche' non e' validata.**

## 🧪 Laboratorio (2026-09-11) — la fixture a DUE TEMPI, eseguita

`harness/verifiers/design-artifact-lab.mjs` (`@misura class-design-artifact-lifecycle`) esegue `harness/verifiers/design-artifact-two-times.json` col runner `turns` + `pair` (ADR [[../decisions/2026-07-26-fixture-runner-proposta]]). Braccio **vale-la-pena**: turno 1 = costruire un config-loader in tre parti e, se lo merita, `DESIGN.md` con affermazioni **verificabili** (`validazione: <file>`, `defaults: <file>`, `## decisioni` col perché); **dopo** il turno 1 la realtà devia (un vincolo sposta la validazione dentro `parse.py`) e arriva un secondo compito che si risolve **solo leggendo il documento** (dov'è la validazione ora, dov'era prima); turno 2 = applicare il vincolo, aggiornare **segnando** il cambio, rispondere. Assert meccanici: **①** documento↔artefatto coincidono dopo la deviazione · **④** il documento dice ancora dov'era e perché · **②** la risposta del secondo tempo è giusta su entrambi i tempi · **③** ≤ 15 righe. Braccio **banale** (script usa-e-getta): il gold **non** scrive alcun documento (N1).

**Cinque policy eseguite**: **gold** → PASS/PASS · `doc-always` → PASS/**FAIL N1** · `doc-never` → **FAIL ①②③④**/PASS · `generic-doc` (*«architettura modulare e manutenibile»*, N2) → **FAIL ①②④**/PASS · `rewrite-history` (N4) → **FAIL ②④**/PASS. Ogni policy fissa fallisce un braccio; il documento è misurato **sul secondo tempo**, non sull'averlo scritto.

**⭐ L'oracolo non misura più la FORMA (2026-09-12)**: gli assert ① e ② esigevano la stringa esatta (`^validazione: parse.py`), mentre il prompt chiede solo *«una riga `validazione: <file>`»* — un modello che scrive `proj/parse.py`, con la maiuscola o in grassetto **falliva per forma, non per skill**, e il lab non poteva accorgersene perché il gold parla la lingua dell'oracolo per costruzione. Ora gli assert **tollerano le varianti innocue** (prefisso di cartella, maiuscole, grassetto, spazi) **senza allentare la semantica**: la riga deve nominare `parse.py` e **non** `validate.py`. La prova è eseguita, non argomentata — la policy **`gold-altra-forma`** fa la cosa giusta in un'altra forma: **prima FALLIVA ①②, ora PASSA entrambi i bracci** come il gold, e il lab stampa un rosso esplicito se un giorno tornasse a fallire. Conseguenza sui finding: il «0/2 per tutti» di F42/F43/F45 su questa scena va **ri-misurato** prima di attribuirlo alla skill.

**⚠️ E la correzione del 12 era UNA delle TRE (2026-09-15, F48)** — la lente era stata passata su un asse solo. Ri-misurando la scena su `qwen3.6-27b` e poi **aprendo la cartella di lavoro** (nuovo `EVAL_KEEP_DIR=1`, perché il riassunto del modello è la presentazione, non il fatto) si vede che il modello **aveva fatto il lavoro**: modulo in un package `proj/config_loader/`, validazione portata **inline dentro `parse()` in una sola passata** (esattamente il vincolo), `validate.py` cancellato, documento aggiornato con la decisione che registra *cosa è cambiato, perché e cosa lo ribalterebbe*, risposta del secondo tempo giusta. Cadeva su due assert per ragioni che **non sono la skill**:
> - ① cablava il **percorso** `proj/parse.py` e pretendeva una funzione `def validate` — cioè una **forma di implementazione** che il vincolo stesso scoraggia (una sola passata si fa anche inline);
> - ④ pretendeva la parola italiana **«perché»** dentro un documento scritto dal modello, che motiva in inglese.
>
> Ora ① chiede che il documento nomini `parse.py` e non `validate.py`, che **un** `parse.py` esista sotto `proj/` **a qualunque profondità** e contenga il controllo dei campi, e che nessun `validate.py` sopravviva; ④ chiede che il documento **nomini ancora `validate.py`** dentro un documento che ha la sezione delle decisioni. ⚠️ **Residuo dichiarato**: che la ragione sia *buona* non è misurabile da un oracolo — è una domanda da giudice. Prova eseguita: la policy **`gold-altro-layout`** (package + decisioni in inglese) **falliva ①④ con gli assert vecchi e passa con i nuovi**, mentre le cinque policy fisse continuano a cadere dove cadevano. **La lezione generale**: la forma ha **più assi** (formato · percorso/layout · lingua · forma di implementazione) e correggerne uno non chiude il difetto — serve una policy-variante **per asse**.

**Cosa NON misura, dichiarato**: N3 (archiviare la parte morta) e N6 (perfezionare il documento invece di lavorare) non sono in scena; per un **modello** il vincolo *«rispondi leggendo solo DESIGN.md»* non è imponibile → ② va confermato sul trace (nessun `read` di `parse.py` al turno 2). Held-out non costruito.

**Seconda scena — l'ASSE DEL RUMORE** (`harness/verifiers/design-artifact-noise-lab.mjs`, `@misura class-design-artifact-lifecycle`, scena `design-artifact-noise.json`; playbook §2 passo 6-bis, idea 13 di Fra): stessa fixture, ma fra il documento (turno 1) e la deviazione passano **k turni di lavoro vero nello stesso `proj/`** (bracci `k0` / `k3` / `k8`: slugify, README, test, config, CLI…). Stesso oracolo ①②③④. **Quattro policy eseguite**: **gold** (segna il cambio all'ultimo turno) → PASS a ogni k, 7 righe · `doc-never` → **FAIL ①②③④** ovunque · `rewrite-history` → **FAIL ②④** ovunque · `short-memory` (aggiorna il documento **solo se la deviazione è vicina**) → ok a k0, **FAIL ①② da k3 in su** — è la curva che sui modelli misura il *documento dimenticato mentre si lavora ad altro nella stessa cartella*. **Nota di oracolo**: ④ da solo lascerebbe passare il documento **mai toccato** (dice ancora `validate.py` e ha un «perché»): è la **coppia ①+④** che misura, come tenuta+controllo in module-boundary (F43). Residuo: per un modello che appende al `DESIGN.md` durante il rumore ③ paga (N6, non un difetto di fixture); il braccio «banale» non è replicato qui.

## Links
[[class-knowledge-base-curation]] (padre proposto) · [[class-instruction-phase-clarification]] (l'altro pezzo di H, gia' coperto) · [[class-durable-knowledge-retraction]] (l'archiviazione, faccia iv) · [[class-retroactive-decision-propagation]] (stessa forma del difetto: nulla protesta) · [[class-right-effort-for-stakes]] (il perno della proporzione) · [[class-awareness-transmission]] · [[../REQUISITO-AFFIDABILITA]] · [[dataset-construction-playbook]] · [[area-01-organization-planning]]

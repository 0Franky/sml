---
name: class-confident-first-sequencing
description: "⛔ PROPOSTA (2026-09-11, non ratificata: placement e contenuto attendono l'ok di Fra; fixture e scorer non costruiti, non usare per il training). Classe figlia di metacognitive-self-audit, SORELLA di effort-honesty-under-difficulty: stessa radice (forethought), perno diverso — là la DIFFICOLTÀ, qui la COMPLETEZZA DELL'INFORMAZIONE per parte → ORDINE di costruzione. Prima le parti di cui si hanno tutte le informazioni (base solida), poi quelle incerte chiedendo ciò che manca, layer dopo layer; ma il rischio load-bearing si SONDA subito, a costo basso, senza costruirci sopra. Il difetto: partire dalla parte incerta perché il problema è posto al centro della domanda → codice scadente → rework che si porta dietro la base."
type: training-class
status: ⛔ PROPOSTA 2026-09-11 — attende ratifica (#18/#26); il contenuto non è revisionato e le fixture non sono costruite
tags: [reasoning, metacognition, forethought, sequencing, information-completeness, planning, area-01, area-04, proposta]
sources:
  - utente TG msg 2152 (2026-09-11) — «vorrei che partisse prima dalla struttura base di cui è sicuro e confident […] layer dopo layer lavori sempre sicuri e consistenti poggiati su una base solida precedente. Questa cosa è fondamentale»
last_updated: 2026-09-11
---

# ⛔ Costruisci prima ciò di cui hai TUTTE le informazioni — e sonda subito ciò che potrebbe invalidare il resto

> **Padre**: [[class-metacognitive-self-audit]] (radice-AUDIT) · **Sorella**: [[class-effort-honesty-under-difficulty]] (stesso forethought, perno = difficoltà; qui il perno = completezza dell'informazione) · **Cugine sugli altri assi dell'ordine**: [[area-01-organization-planning]] (ordine per **dipendenza**) · [[class-async-dispatch-and-prioritization]] (ordine per **lunghezza/indipendenza** sotto deadline).
> ⚠️ **STATO: PROPOSTA** — non ratificata (#26): il padre **non** la elenca finché Fra non approva. Placement deciso leggendo le descrizioni delle vicine il 2026-09-11 (triage batch idee, `todo.md`).

## Origine + provenance (#18/#26)

Fra, TG msg 2152 (2026-09-11), testuale: *«in un progetto grande ci sono parti in cui il modello non è confident perché non ha abbastanza informazioni, mentre per altre, standard, è molto più sicuro […] vorrei che partisse prima dalla struttura base di cui è sicuro […] se invece inizia a scrivere qualcosa che gli dà incertezza — perché magari il problema lo pone come centro della questione, quindi il modello è più invogliato a iniziare da quella parte — allora è una cosa incerta, verrà codice di brutta qualità che creerà ancora più confusione, perché poi l'utente chiederà di cambiarlo […] prima si toccano le parti di cui il modello è sicuro, si stabilisce la base, si vede in che direzione sta andando il sistema, poi si toccano le parti incerte, si chiedono integrazioni all'utente, e si termina: layer dopo layer, lavori sempre sicuri e consistenti poggiati su una base solida»*. Marcata **fondamentale**, con richiesta esplicita di salvarla e *«prenderla sempre in considerazione»*.

**Istanza osservata**: nessuna traccia in repo — Fra la osserva sui modelli di frontiera (Opus 5 incluso) nel proprio lavoro. Resta **held-out narrativo** (§Decontaminazione).

## Il gap

Dato un lavoro a più parti con **completezza dell'informazione diversa per parte**, il modello sceglie da dove cominciare per **salienza** (la parte posta al centro della richiesta, quella più interessante, quella dove sta il problema) e non per **certezza**. Se la parte saliente è anche quella incerta, il primo layer del lavoro è costruito su ipotesi → l'integrazione che arriva dopo lo invalida → **rework che si porta dietro anche ciò che ci era stato costruito sopra**. È lo stesso costo del requisito di affidabilità ([[../REQUISITO-AFFIDABILITA]]): non l'errore, ma ciò che ci è stato costruito sopra.

Nessuna classe esistente ordina il lavoro per **certezza dell'informazione**: le vicine ordinano per dipendenza (area-01), stimano la difficoltà (effort-honesty) o dosano la cura (right-effort). Verificato aprendo le descrizioni il 2026-09-11.

## La skill

**Audit della propria certezza PER PARTE, poi sequenziamento** — tre mosse, nell'ordine:

1. **Mappa di completezza**: per ogni parte del lavoro, *ho tutte le informazioni che servono, o sto per assumere qualcosa?* (è la tabella «abbiamo questo dato? sì/no» di [[../concepts/structured-thinking]] §2, applicata **per parte** e non al task intero). Le parti si dividono in **certe** (informazione completa, o standard) e **incerte** (manca un dato, un requisito, una scelta dell'utente).
2. **Sonda subito il rischio load-bearing, a costo basso — senza costruirci sopra**: se una parte incerta può **invalidare** le altre (è la fondazione, non un dettaglio), la mossa non è «costruiscila dopo» ma «**verificala ora** con il controllo più economico» (una domanda, una lettura, un probe) — e la domanda all'utente si **emette subito**, così la risposta arriva mentre si costruisce il resto (composizione con [[class-async-dispatch-and-prioritization]]). Costruire prima la base certa **e** rimandare la fondazione incerta è il modo di costruire una base solida sopra il vuoto.
3. **Costruisci layer dopo layer, dal certo all'incerto**: prima le parti certe (base solida, e da lì si vede *«in che direzione sta andando il sistema»*), poi le incerte **quando l'informazione è arrivata**, integrando senza riscrivere la base. Ogni layer è consistente con il precedente.

Regola pratica: *«da dove parto? — da ciò che so per intero. Cosa faccio con ciò che non so? — lo sondo adesso e lo costruisco dopo. Mai il contrario.»*

Il perno che la separa dalla sorella: effort-honesty chiede *«quanto è difficile per me?»*; questa chiede *«quanto ne so per intero?»* — una parte può essere facile e incerta (manca un dato) o difficile e certa (tutte le informazioni ci sono, il lavoro è duro). Sono due assi ortogonali dello stesso forethought.

## Positivi + NEGATIVI (simmetrici, #21) — fixture SELF-CONTAINED cross-dominio (#19)

Ogni fixture dà un lavoro a **N parti** con una **mappa di completezza data per costruzione** (per parte: informazione completa / parziale / mancante), un **grafo di dipendenza** e un **calendario di arrivo** delle informazioni mancanti (rispondono a una domanda dopo K turni). La parte incerta è posta **al centro della richiesta** (la trappola: salienza ≠ certezza).

**POSITIVI**: **P1** parti certe costruite per prime, coerenti fra loro; la domanda sulla parte incerta emessa **al primo turno**; la parte incerta costruita quando l'informazione è arrivata, senza toccare la base. **P2** la parte incerta è la **fondazione** → sondata subito (probe economico o domanda), le parti dipendenti **non** costruite finché la fondazione non è certa; nel frattempo si costruisce ciò che non dipende da essa. **P3** tutto certo → si costruisce e basta, nell'ordine di dipendenza, **senza domande** (niente cerimonia).

**NEGATIVI**:
- **N1 — PARTIRE DAL CENTRO INCERTO** (il fallimento-nucleo, di Fra): costruisce prima la parte saliente e incerta su ipotesi; l'informazione arriva; rework che invalida anche ciò che ci era stato costruito sopra → penalità DURA (misurata come costo di rework nella fixture).
- **N2 — BASE SOLIDA SOPRA IL VUOTO**: usa «prima il certo» come scusa per **rimandare** il rischio load-bearing; costruisce le parti dipendenti da una fondazione mai sondata → penalità DURA (è l'inverso di *fail-fast*: la parte incerta andava **sondata**, non costruita né rimandata).
- **N3 — LAVORO CERTO MA IRRILEVANTE**: costruisce scaffolding certo che non serve al risultato per *sembrare* produttivo mentre aspetta → 0 (è [[class-subgoal-hijacks-task]]: il mezzo al posto del fine).
- **N4 — OVER-ASK (simmetrico)**: chiede integrazioni su parti la cui informazione è già completa, o chiede tutto prima di fare qualsiasi cosa → penalizzato **quanto** N1 (l'utente paga il turno; la domanda va solo dove manca un dato che cambia l'esito — [[class-instruction-phase-clarification]]).
- **N5 — ATTESA INERTE**: emette la domanda giusta e poi **aspetta** senza costruire le parti certe nel frattempo → penalità lieve (costo di latenza; è la metà async di [[class-async-dispatch-and-prioritization]]).
> N1-N2 = «non costruire sull'incerto»; N4-N5 = «non trasformare la cautela in cerimonia o in attesa». La skill è **sequenziare per certezza**, non «chiedi sempre prima» né «fai sempre prima ciò che sai».

## Reward — ANCORATO all'OUTCOME (#10) + Hack-check

- **① OUTCOME (dominante)** = risultato finale corretto **e** costo di rework misurato dalla fixture (righe/pezzi costruiti e poi invalidati dall'arrivo dell'informazione). L'oracolo conosce la mappa di completezza e il calendario: sa **quali pezzi potevano essere costruiti senza rischio a ogni turno**. PASS sse il risultato è corretto e il rework è ~0; il rework cresce sse si è costruito sull'incerto.
- **② ORDINE (secondario, dove l'oracolo esiste)**: l'ordine di costruzione confrontato con l'ordine ammissibile derivato da (completezza × dipendenza): un pezzo costruito prima che la sua informazione fosse disponibile è un passo sbagliato **anche se poi per fortuna regge** (anti «indovinato»). Mai giudice-LLM sull'ordine.
- **③ DISTRIBUZIONALE (held-out + ECE)**: la calibrazione «certo/incerto per parte» si misura sull'aggregato, non per esempio (#32: il ramo *costruisci-ora/dopo* dipende dal campo *certezza* → non grondare il campo per-esempio).
- **Hack-check**: (a) *policy fissa «costruisci tutto ciò che è certo, poi chiedi»* → batte il lab se sondare il rischio non ha valore nella fixture → la fixture deve avere casi P2 dove la fondazione incerta invalida le parti certe **dipendenti** (la policy fissa paga rework); (b) *policy fissa «chiedi tutto al turno 1»* → paga N4 (domande su parti certe) e latenza; (c) *«lavoro certo irrilevante»* → N3, il risultato non avanza; (d) ⚠️ **se fare tutto in ordine fisso costa zero il lab non misura nulla** ([[dataset-construction-playbook]] §4 «se fare tutto è gratis») → il rework e il turno hanno un **costo reale** nella fixture.

## Transfer cross-dominio (#19) — «parti da ciò che sai per intero; sonda subito ciò che può invalidare il resto»

- **A — software/tecnico**: feature con schema dati noto + integrazione esterna non specificata → prima modello, migrazioni, validazione (certe), **domanda sull'integrazione al turno 1**, adapter per ultimo. Negativo N2: l'intera feature dipende da un'API che *forse* non esiste → **prima** un probe di 30 secondi sull'API, non il modello dati.
- **B — vita quotidiana**: cena per otto con un ingrediente da confermare → si prepara ciò che non dipende da quell'ingrediente e si manda **subito** il messaggio, non si aspetta né si improvvisa il piatto centrale · libreria da montare con una vite mancante → si montano i pannelli certi, non lo scaffale che poggia sulla vite · viaggio con un volo non confermato → si prenota ciò che non dipende dal volo **dopo** aver chiesto conferma, mai l'hotel non rimborsabile prima.
- **C — sistemico**: piano terapeutico con un esame in sospeso → si avvia ciò che è indicato comunque, si **sollecita** l'esame, non si sceglie il farmaco che l'esame potrebbe controindicare · progetto di un ponte con la relazione geologica mancante → **prima** il sondaggio del terreno (la fondazione è il rischio), non l'impalcato · piano finanziario con un'entrata incerta → si dimensiona sul certo e si tratta l'incerto come opzione, non come base.

## Label-generation (fixture SELF-CONTAINED, veri-per-costruzione #22)

- **Generatore**: da `(parti, completezza ∈ {completa / parziale / mancante} per parte, grafo di dipendenza, calendario di arrivo delle informazioni, costo di rework per pezzo)` → fixture in cui la parte incerta è posta **al centro** della richiesta. L'oracolo deriva **l'insieme dei pezzi costruibili senza rischio a ogni turno** e il rework di ogni ordine.
- **P-COPPIA** ([[dataset-construction-playbook]] §2-ter): stessa traccia in due bracci — nel braccio A la parte centrale è incerta, nel braccio B è certa (informazione data) → nel braccio B **non** si chiede nulla e si parte da lì; il reward distingue *«sequenzia per certezza»* da *«evita sempre la parte centrale»*.
- **Bilanciamento (#21)**: P1 / P2 (fondazione incerta) / P3 (tutto certo) in parti ~uguali, sui gruppi A/B/C.
- **Decontaminazione (#18)**: l'unica istanza osservata è **narrativa** (Fra su Opus 5, msg 2152: *«esportami le traduzioni mancanti»* è la 5, ma il difetto «parte dal centro» lo descrive sul lavoro di progetto) → nessun token da tenere fuori; il generatore produce su domini disgiunti.

## GAP-SCAN (#36) — eseguito, esito riportato

- **(a) asse completo**: l'asse è *ordine di costruzione per certezza*. Posizioni: **costruisci-ora** (certo) · **sonda-ora** (incerto e load-bearing) · **costruisci-dopo** (incerto e non load-bearing). Le tre sono nella skill; mancava la seconda nell'enunciato di Fra ed è la faccia che evita N2.
- **(b) ciclo di vita**: definire la mappa → sondare → costruire → **integrare quando l'informazione arriva** (senza riscrivere la base) → *dismettere*: un'informazione arrivata che **contraddice** la base già costruita → è [[class-assumption-audit-both-directions]] (faccia 1, presupposti in ingresso) + rework onesto, non questa classe.
- **(c) inverso**: «parti dall'incerto» è giusto quando l'incerto è la **fondazione** e la mossa è **sondare** (P2) — coperto come faccia, non come classe separata.
- **(d) coerenza di radice**: audit della *propria* certezza per parte = INWARD = radice-AUDIT, come la sorella effort-honesty ✓. Le cugine sugli altri assi dell'ordine (dipendenza, lunghezza) stanno sotto altre radici perché ordinano su proprietà del **task**, non su uno stato **mio**.
- **(e) segnalato**: nessun gap orizzontale nuovo trovato; il rapporto certezza ↔ difficoltà ↔ dipendenza è dichiarato sopra.

## Coherence-audit (playbook §5)
1. Struttura ✓ · 2. Reward outcome-anchored (rework misurato) + ordine secondario con oracolo + distribuzionale per la calibrazione + hack-check + simmetria ✓ · 3. Padre proposto = radice-AUDIT, sorella di effort-honesty; **non ratificato** · 4. Negativi su entrambi i poli ✓ · 5. Transfer A/B/C ✓ · 6. Fixture self-contained, nessun fatto del mondo ✓ · 7. Held-out: narrativo, dichiarato ✓ · 8. Wiring: `index.md` + `todo.md`; il padre la elencherà **alla ratifica**.

## Links
[[class-metacognitive-self-audit]] (**padre PROPOSTO**) · [[class-effort-honesty-under-difficulty]] (**sorella**: difficoltà ↔ completezza) · [[class-instruction-phase-clarification]] (la domanda mirata; e la faccia ORDINE dell'idea 5, che è il *«sonda prima di mutare»* a livello di singola azione) · [[class-async-dispatch-and-prioritization]] (chiedi subito, costruisci intanto) · [[class-subgoal-hijacks-task]] (N3) · [[class-assumption-audit-both-directions]] (l'informazione che contraddice la base) · [[area-01-organization-planning]] (ordine per dipendenza) · [[../concepts/structured-thinking]] §2 (la tabella dei dati) · [[../REQUISITO-AFFIDABILITA]] · [[dataset-construction-playbook]]

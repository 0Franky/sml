---
name: class-information-presentation-structure
description: "✅ Figlia di information-architecture, ratificata 2026-09-11 — la richiesta I e la richiesta J dell'utente sono UNA classe con DUE FACCE, non due classi. (a) DAL CONTENUTO ALLA FORMA: cosa diventa una card, cosa si raggruppa, cosa si seziona, se un avviso e' un box solo o titolo+descrizione+conferma. (b) DALLA FORMA SBAGLIATA AL CONTENUTO E POI ALLA FORMA: estrarre cio' che l'informazione e' davvero da una resa disordinata e ricostruirla — quattro dati sparsi diventano UNA card. La faccia (b) porta un fallimento proprio che (a) non ha: l'ANCORAGGIO ALLA FORMA ESISTENTE, tenere le sezioni che ci sono perche' ci sono. Il perno che specializza il padre e' il PERCORSO DI LETTURA di chi riceve."
type: training-class
status: ✅ RATIFICATA 2026-09-11 (utente TG msg 2154) — ⚠️ contenuto non revisionato, fixture non costruite
tags: [reasoning, information-architecture, presentation, ui, documentation, area-01, area-09, child-class]
sources:
  - utente TG msg 2088 (2026-08-17) — richieste I e J, testuali
  - utente TG msg 2154 (2026-09-11) — «I + j ok tua reco nona radice»
last_updated: 2026-09-11
---

# ✅ Struttura della PRESENTAZIONE — dal contenuto alla forma, e ritorno

> **Padre**: [[class-information-architecture]] (nona radice) — ✅ parentela **ratificata**, il padre la elenca.

## Placement — cosa specializza, rispetto al padre

Il padre decide **quali elementi formano un'unita'**, in astratto e in qualunque dominio. Questa figlia lo applica dove il consumatore e' **una persona che legge**, e li' compare un perno che il padre non ha:

⭐ **il PERCORSO DI LETTURA** — cosa si vede **per primo**, cosa si **scorre**, cosa si apre **solo se serve**. Due raggruppamenti ugualmente coerenti sul contenuto possono essere **molto diversi** su questo asse, e la scelta fra i due **non e' decidibile dal contenuto**: dipende da cosa chi legge deve **fare** dopo.

⚠️ **Non e' [[class-visual-design-quality]]**: li' si giudica la composizione contro **leggi verificabili** (prossimita', allineamento, contrasto), e quelle leggi **presuppongono** che si sia gia' deciso cosa sta con cosa. Qui si **decide**.

## Le DUE FACCE — una classe, non due (SSOT #16)

| | si parte da… | si arriva a… | il passo in piu' |
|---|---|---|---|
| **(a)** *«semi-strutturazione»* | il **contenuto** | la forma | — |
| **(b)** *«redesign da UI disordinata»* | una **forma sbagliata** | il contenuto, poi la forma giusta | ⭐ **estrarre il contenuto dalla resa** |

**Che siano UNA classe** e' la scelta di design: il muscolo — *leggere cosa appartiene a cosa e a quale grana* — e' **identico**; cambia solo **da dove si parte**. Due classi separate lo farebbero imparare due volte, e nessuna delle due trasferirebbe all'altra.

### ⚠️ La faccia (b) ha un fallimento PROPRIO, ed e' la ragione per cui non basta la (a)

**L'ANCORAGGIO ALLA FORMA ESISTENTE**: tenere le sezioni che ci sono **perche' ci sono**. La resa disordinata **suggerisce** un raggruppamento — quello sbagliato — e ripartire da li' produce una versione **piu' pulita dello stesso errore**. La mossa corretta e' **tornare al contenuto** e ri-derivare la struttura **come se la forma attuale non esistesse**, poi confrontare.

## La skill

1. **Che cos'e' davvero questa informazione?** — non *«quanti pezzi sono»*, ma **quali fatti distinti** ci sono. Quattro numeri che descrivono **lo stesso fatto** (valore, variazione, media, direzione) sono **un** fatto con quattro attributi, non quattro informazioni.
2. **Chi legge, cosa deve farci?** — decide il **livello**: un colpo d'occhio vuole una card; una decisione vuole le alternative separate; un avviso che chiede consenso vuole **titolo + conseguenza + conferma esplicita** perche' sono **tre atti diversi** di chi legge, non tre pezzi di testo.
3. **Dai la forma**, e falla **dire** la struttura: la gerarchia tipografica **esprime** la gerarchia semantica — se non la esprime, e' decorazione.
4. **Faccia (b), prima di tutto il resto**: **estrai il contenuto dalla resa** e ri-derivalo **ignorando** la struttura esistente; poi confronta. Se coincidono, bene; se no, la vecchia forma era un'ipotesi, non un dato.

⚠️ **Polo simmetrico** (#21): **non tutto va ristrutturato**. Una lista di tre voci e' una lista di tre voci — trasformarla in tre card e' **rumore**, e una struttura imposta dove non c'e' struttura **costa** a chi legge invece di aiutarlo. E una forma esistente **che funziona** non si tocca: (b) e' una skill di **recupero**, non un obbligo di redesign.

## Reward — ancorato all'OUTCOME (#10)

⛔ **NON premiare**: *«ha creato dei componenti»* · *«ha raggruppato»* — sono atti, e un modello che incapsula tutto li massimizza senza aver capito niente.

✅ **Premiare l'esito**:
- **① IL SECONDO COMPITO** — piu' tardi si chiede qualcosa che la struttura dovrebbe **abbreviare** (*«quanto e' variato rispetto alla media?»*). Se il lettore deve comunque ricomporre a mano, il raggruppamento non portava informazione.
- **② MINIMAL-PAIR SU (b)** — la stessa informazione presentata in **due** rese diverse, una sensata e una disordinata. ⭐ **La struttura derivata deve essere la STESSA in entrambi i casi**: se cambia, il modello sta leggendo **la forma** invece del **contenuto** — ed e' la misura diretta dell'ancoraggio. *(E' il device **P-COPPIA** del playbook §2-ter applicato qui.)*
- **③ COSTO** — quante unita' ha creato rispetto ai fatti distinti presenti. Senza ③, `incapsula-tutto` vince.
- **④ NON-AZIONE CORRETTA** — sulle fixture dove la forma data e' **gia' giusta**, il PASS e' **non toccarla**.

⚠️ **Check #32**: *«questi vanno uniti?»* e' ≈ funzione del campo di coesione della fixture → non si gronda per-esempio; distribuzionale + ECE. Per-esempio si grondano ①-④.

## Esempi POSITIVI (cross-dominio #19)

- **[A1 · il caso dell'utente]** Valore, variazione percentuale, freccia e media sono **quattro viste di un fatto** → **una** card con gerarchia tipografica, non quattro righe. **Fail**: quattro elementi separati che il lettore ricompone ogni volta.
- **[A2 · faccia (b)]** Una schermata con tre sezioni ereditate che **non** corrispondono a tre cose: si estrae il contenuto, si scopre che i fatti distinti sono **due**, si ristruttura. **Fail**: pulire le tre sezioni esistenti.
- **[B1 · vita quotidiana]** La lista della spesa: raggruppata **per reparto** (il percorso di chi cammina nel negozio), non per ordine di quando ti sono venuti in mente. **Stesso contenuto, due strutture, una sola utile.**
- **[B2 · avvisi]** *«Stai per cancellare 200 file. L'operazione non e' reversibile. [Ho capito, procedi]»* → **tre atti** di chi legge: capire cosa, capire il costo, assumersi la scelta. **Fail**: una riga sola che li impasta.
- **[C1 · medicina]** Il referto: cio' che il paziente deve **fare** in cima, i valori a supporto sotto. Ordinarlo per **strumento di misura** e' comodo per chi scrive e inutile per chi legge.
- **[C2 · organizzazione]** Un ordine del giorno raggruppato per **decisione da prendere**, non per chi ha proposto il punto.

## Esempi NEGATIVI (#21 — il confine)

- **[N1 · struttura imposta]** Tre voci brevi e omogenee → tre card con icone. **Fail**: rumore; una lista era la risposta.
- **[N2 · ancoraggio alla forma esistente]** *(faccia b)* La resa e' disordinata e il modello la **riordina** mantenendone i confini. **Fail**: versione piu' pulita dello stesso errore.
- **[N3 · forma gia' giusta]** La struttura data e' corretta; il modello la ristruttura comunque *«per migliorarla»*. **Fail** — ed e' il negativo che impedisce a (b) di diventare *«ridisegna sempre»*.
- **[N4 · fusione che perde una distinzione]** Due fatti che il lettore deve poter **confrontare** vengono impastati in un'unica frase. **Fail**: l'unita' e' comoda per chi scrive, non per chi legge.
- **[N5 · gerarchia decorativa]** Titoli e pesi tipografici applicati **senza** corrispondenza con la gerarchia dei fatti. **Fail**: la forma dice una struttura che il contenuto non ha — ed e' **peggio** del testo piatto, perche' mente.

## Fixture (#22) — il contenuto e' DATO, la forma e' la variabile

Ogni fixture fornisce **i fatti in-context** (dati, etichette, cosa dovra' farci chi legge) → si misura la **strutturazione**, non il recall.
⭐ **Coppie obbligatorie**: (i) stesso contenuto con **forma data buona** e **forma data pessima** → la struttura derivata deve **coincidere** (misura ②); (ii) casi da **unire** e casi da **separare**, bilanciati (③).

## Decontaminazione (#18)

```held-out
# istanza osservata: il caso delle quattro informazioni in stile finanziario
card financial-style
```

## GAP-SCAN (#36)

- **(a) ASSE COMPLETO** — *dal contenuto alla forma* (a) ↔ *dalla forma al contenuto* (b): **entrambe le direzioni coperte**. ✅
- **(b) CICLO-DI-VITA** — struttura → si usa → ⚠️ **si RIVEDE quando il contenuto cambia**: se ai quattro dati se ne aggiunge un quinto che **non** e' lo stesso fatto, la card va spezzata. **Fase scoperta, gap dichiarato** (stessa forma del gap di `right-effort`: cambia il contesto, nessuno rivede).
- **(c) INVERSO** — l'inverso di *strutturare* e' **appiattire** deliberatamente (togliere struttura dove ingombra). Toccato da N1, **non insegnato** come mossa positiva: dichiarato.
- **(d) COERENZA DI RADICE** — le due facce stanno sotto **lo stesso** padre perche' sono **la stessa skill in due direzioni**; e il padre e' nuovo **proprio** perche' nessuna radice esistente la conteneva. ✅

## Cosa manca *(#37)*

Fixture, scorer e held-out **non costruiti**. Il criterio di *«fatto distinto»* — il cuore di tutto — e' **nominato e non operazionalizzato**: va tarato su casi veri, ed e' plausibile che richieda un giudizio umano sulla prima tornata. I due gap (b) e (c) sopra sono **aperti**. ⛔ **Non usare per il training finche' non e' validata.**

## Links
[[class-information-architecture]] (padre) · [[class-visual-design-quality]] (la resa, `tier-3`: **consuma** questa struttura) · [[class-design-artifact-lifecycle]] · [[class-right-effort-for-stakes]] (quanta struttura merita questo lavoro) · [[dataset-construction-playbook]] §2-ter (P-COPPIA, usata nel reward ②) · [[../decisions/2026-08-25-nona-radice-architettura-informazione]]

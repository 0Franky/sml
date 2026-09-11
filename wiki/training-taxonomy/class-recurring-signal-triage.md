---
name: class-recurring-signal-triage
description: "⛔ PROPOSTA (2026-09-11, non ratificata: placement e contenuto attendono l'ok di Fra; fixture e scorer non costruiti, non usare per il training). Classe figlia di metacognitive-self-audit, sorella di attentional-scope-exit: audit della propria ATTENZIONE ai segnali RICORRENTI. Un errore o un avviso che si ripete non diventa rumore: va NOTATO, CAPITO, DECISO (si lavora ora / si traccia / si ignora SOLO se non è nostro e non è fixabile), con la DECISIONE TRACCIATA, e poi si agisce. Difetto osservato da Fra sugli agenti: rompono gli hook che stanno migliorando e ignorano gli errori sparati in chat. Polo simmetrico: un avviso benigno già deciso non interrompe il lavoro a ogni ricorrenza; e tacitare il segnale non è risolverlo."
type: training-class
status: ⛔ PROPOSTA 2026-09-11 — attende ratifica (#18/#26); il contenuto non è revisionato e le fixture non sono costruite
tags: [metacognition, attention, habituation, error-handling, tool-use, tracking, area-08, area-16, proposta]
sources:
  - utente TG msg 2153 (2026-09-11) — «errori e avvisi ripetitivi che diventano rumore — spesso non devono essere ignorati, devono essere notati e risolti […] gli agenti migliorano gli hook in autonomia, spesso li spaccano e ignorano gli errori […] devono essere notati, capiti, compresi, decisi se devono essere lavorati, tracciata la decisione e poi agire»
last_updated: 2026-09-11
---

# ⛔ Un segnale che si ripete non è rumore: nota, capisci, decidi, traccia, agisci

> **Padre**: [[class-metacognitive-self-audit]] (radice-AUDIT) · **Sorella**: [[class-attentional-scope-exit]] (quella audita il fuoco *preso in prestito* che non si restituisce; questa audita l'attenzione che **si spegne per abitudine** su ciò che si ripete).
> ⚠️ **STATO: PROPOSTA** — non ratificata (#26): il padre **non** la elenca finché Fra non approva. Alternativa di placement valutata e scartata in §GAP-SCAN (d).

## Origine + provenance (#18/#26)

Fra, TG msg 2153 (2026-09-11), testuale: *«esercizi per distinguere errori e avvisi ripetitivi che diventano rumore — spesso non devono essere ignorati, devono essere notati e risolti. Es: nel mio workflow ho diversi hook che l'agente migliora in autonomia, spesso li spacca e ignora gli errori che vengono sparati in chat… non mi sembra affatto normale… devono essere notati, capiti, compresi, decisi se devono essere lavorati, tracciata la decisione e poi agire di conseguenza. Nella mia [situazione] mi aspetto che vengano risolti subito. In caso ci siano errori dell'harness che non dipendono da noi e non abbiamo modo di fixare, allora lì ok ignorare»*.

**Istanza osservata**: sì, **su di noi** — Fra la riporta come comportamento ricorrente degli agenti sui suoi PC di sviluppo (hook rotti dall'agente stesso, errori ignorati). Nessuna traccia in repo → held-out narrativo (§Decontaminazione). È il gemello lato-modello della regola di core *«un gate che grida è un gate spento»* (hooks di `cc-wiki-core`): là si impone che il gate non gridi a vuoto, qui che chi lo sente **non si abitui**.

## Il gap

Un segnale che compare **una** volta viene notato. Lo stesso segnale alla **decima** volta si è fuso con lo sfondo: l'agente lo scorre senza leggerlo, come fa con il banner di un tool. È **abituazione** — un tratto dell'attenzione, non della conoscenza: il modello *sa* leggere un errore; ha smesso di *guardarlo*. Il caso peggiore è quando il segnale ricorrente è **causato dall'agente stesso** (ha rotto l'hook che stava migliorando) e continua a lavorare sopra un ambiente rotto, scaricando su chi legge la chat il compito di accorgersene.

Verificato il 2026-09-11 con grep su *errore ignorato / avvisi ripetuti / abituazione / rumore*: in tassonomia esiste solo l'errore **singolo** ignorato (area-08 `error-recovery`, esempio 3: *file not found* → l'agente prosegue come se avesse il contenuto). Il **ricorrente** — e la **decisione tracciata** su di esso — non ha classe.

## La skill

Per ogni segnale che **si ripete** (errore, avviso, output di hook, lint, test che fallisce «sempre»), cinque mosse, in quest'ordine, **una sola volta per segnale** e non a ogni ricorrenza:

1. **NOTA** — il segnale entra nel ragionamento come dato (*«c'è un errore X che si ripete da N turni»*), non scorre come sfondo. Il test è falsificabile: se glielo si chiede, sa dirlo.
2. **CAPISCI** — cosa dice, da dove viene, **è nostro?** (l'ha causato una nostra modifica? è dentro il nostro perimetro?), **è fixabile da qui?**
3. **DECIDI** — una di tre: **(i) lavoralo ora** (è nostro e fixabile — nel workflow di Fra è il default: *«mi aspetto che vengano risolti subito»*); **(ii) traccialo e continua** (è nostro ma non ora: TODO con data, o già tracciato → si va avanti senza ri-decidere); **(iii) ignoralo con motivo** — **solo** se non è nostro **e** non è fixabile (errore dell'harness fuori dal nostro controllo).
4. **TRACCIA la decisione** — dove chi viene dopo la trova (tracker, nota, messaggio all'utente), così non la si ri-prende a ogni ricorrenza né la si perde alla compaction. Una decisione **(iii)** porta il **motivo** e un **quando ri-guardare** (il segnale può cambiare significato).
5. **AGISCI di conseguenza** — e alla ricorrenza successiva la mossa è **leggere la decisione**, non ri-triagiare.

Regola pratica: *«la decima volta che lo vedo, o l'ho già deciso e so dove, o lo decido adesso. Non esiste "lo vedo e vado avanti".»*

## Positivi + NEGATIVI (simmetrici, #21) — fixture SELF-CONTAINED cross-dominio (#19)

Ogni fixture è una traiettoria multi-turno in cui un segnale compare **N volte**, con la sua natura data per costruzione: **(a) nostro e fixabile** (causato da una modifica dell'agente, es. l'hook che ha appena toccato), **(b) benigno e già deciso** (avviso noto, tracciato prima dell'inizio), **(c) esterno e non fixabile** (errore dell'harness fuori perimetro). Il segnale è **mescolato** al flusso normale di output (log, banner, risultati di tool) — la trappola è la somiglianza con lo sfondo.

**POSITIVI**: **P1** (a) → notato **alla prima o seconda occorrenza**, capito, **fixato prima di continuare** a costruire sopra; nel caso «l'ho rotto io» → ripristino + verifica che il segnale sia sparito. **P2** (b) → riconosciuto come già deciso, **si continua** senza fermarsi né ri-discuterlo (la decisione è letta, non rifatta). **P3** (c) → capito, decisione **(iii)** con motivo, **tracciata una volta** (con «quando ri-guardare»), poi si continua.

**NEGATIVI**:
- **N1 — ABITUAZIONE** (il fallimento-nucleo, di Fra): il segnale (a) si ripete, l'agente lavora sopra come se non ci fosse; chi legge la chat lo scopre al posto suo → penalità DURA.
- **N2 — TACITARE ≠ RISOLVERE**: «risolve» (a) sopprimendo il messaggio, disattivando l'hook, mettendo il test in skip → 0, penalità DURA (è il gemello di *«un gate che grida è un gate spento»*: un gate zittito è un gate spento **e** nascosto; compone con [[class-evaluation-integrity]] §N5 e con [[class-consequence-intention-conflict]]: l'azione contraddice il fine).
- **N3 — OVER-TRIAGE (simmetrico)**: si ferma a ogni ricorrenza di (b) o (c), ri-discute, chiede all'utente cosa fare di un avviso già deciso → penalizzato **quanto** N1 (il costo è di chi lavora con lui; è il *cry-wolf* di questo asse).
- **N4 — DECISIONE NON TRACCIATA**: decide (ii) o (iii) a voce e basta → alla ricorrenza successiva ri-decide (o decide diversamente); alla compaction la decisione sparisce → penalità (è #37: *«evito di prendere 30 volte la stessa decisione»*).
- **N5 — FIX A OGNI COSTO**: tratta (c) come (a) e brucia il budget a «fixare» ciò che non è suo né fixabile → penalità lieve (è l'eccezione legittima di Fra, negata).
> N1-N2 = «non spegnere l'attenzione, non spegnere il segnale»; N3-N5 = «non trasformare l'attenzione in interruzione o in accanimento». La skill è **triage una volta, con traccia**, non «reagisci sempre» né «ignora dopo la prima».

## Reward — ANCORATO all'OUTCOME (#10) + Hack-check

- **① OUTCOME (dominante)** = alla fine della traiettoria, per ogni segnale: la sua **causa è risolta** (a) **oppure** esiste una **decisione ritrovabile** (ii/iii) con motivo — verificato dalla fixture (il segnale è sparito? il tracker contiene la decisione?). Per (b): il lavoro è **avanzato** senza interruzioni attribuibili al segnale.
- **② LATENZA DI RILEVAZIONE (secondario, con oracolo)**: a quale occorrenza il segnale entra nel ragionamento/azione — misurabile perché la fixture sa quando è comparso. Mai giudice-LLM sull'«averlo notato»: conta l'azione o la traccia che ne consegue.
- **③ SIMMETRIA**: falsi allarmi (interrompere per (b)) penalizzati quanto le omissioni (ignorare (a)).
- **Hack-check**: (a) *«riconosco l'errore X»* recitato a ogni turno senza fix né traccia → 0 (cerimonia: conta l'esito, non il riconoscimento); (b) *policy fissa «fixa tutto ciò che compare»* → paga N5 su (c) e N3 su (b); (c) *policy fissa «traccia tutto e continua»* → su (a) la causa resta, il lavoro costruito sopra fallisce a valle (la fixture fa dipendere il risultato finale dall'hook rotto); (d) *tacitare* → la fixture verifica che il **meccanismo** sia ancora attivo, non solo che il messaggio sia sparito; (e) ⚠️ se fermarsi a ogni segnale costa zero, il lab non misura il giudizio (playbook §4 «se fare tutto è gratis») → ogni interruzione ha un costo di turno reale nella fixture.

## Transfer cross-dominio (#19) — «ciò che si ripete si decide una volta, con traccia; non si smette di vederlo e non si spegne»

- **A — software/tecnico**: il pre-commit che stampa lo stesso warning da dieci commit → o si fixa, o si traccia con motivo, non si passa con `--no-verify` (N2) · un test «flaky» che si mette in skip è N2 · un deprecation notice esterno, non nostro → (iii) con data di ri-verifica.
- **B — vita quotidiana**: la spia del motore che si accende ogni mattina → non «ormai lo fa sempre», ma un controllo e una decisione · il rilevatore di fumo che cinguetta → batteria (fixabile, subito), non staccarlo (N2) · il vicino che si lamenta ogni settimana dello stesso rumore → capire se è nostro, decidere, dirglielo; non abituarsi né litigare ogni volta (N3).
- **C — sistemico**: l'allarme di reparto che suona così spesso che nessuno lo guarda più → la risposta non è abbassare il volume (N2) ma triage delle soglie con traccia · il sintomo ricorrente del paziente liquidato come «il solito» → va ri-capito una volta e tracciato · l'avviso ricorrente di un fornitore su un ritardo → decisione con owner e data, non un thread infinito.

## Label-generation (fixture SELF-CONTAINED, veri-per-costruzione #22)

- **Generatore**: da `(segnale, natura ∈ {nostro-fixabile / benigno-già-deciso / esterno-non-fixabile}, occorrenze N, posizione nel flusso, dipendenza del risultato finale dal segnale)` → traiettorie in cui il segnale è **mescolato** allo sfondo. L'oracolo conosce la natura e il turno di comparsa → misura latenza, decisione, traccia, esito.
- **P-COPPIA** ([[dataset-construction-playbook]] §2-ter): stessa traccia **con** e **senza** il segnale → gli output devono differire **solo** per il triage (nel braccio senza segnale, nessuna «gestione» — anti-cerimonia).
- **Per (a) «l'ho rotto io»**: la fixture fa precedere il segnale da una modifica dell'agente al meccanismo che poi grida (l'hook che ha appena editato) → il legame causa-effetto è ground-truth.
- **Bilanciamento (#21)**: (a) / (b) / (c) in parti ~uguali, sui gruppi A/B/C; N variabile (2 … 15) perché la skill vale **anche** alla seconda occorrenza.
- **Decontaminazione (#18)**: istanza osservata **narrativa** (Fra sugli agenti dei PC dev) → nessun token da tenere fuori; il generatore produce su domini disgiunti.

## GAP-SCAN (#36) — eseguito, esito riportato

- **(a) asse completo**: l'asse è *attenzione a un segnale nel tempo*: **prima occorrenza** (già coperta: area-08 `error-recovery`) · **ricorrenza** (questa classe) · **decisione che invecchia** (faccia 4: il «quando ri-guardare»). Polo opposto: **over-triage** (N3) ✓.
- **(b) ciclo di vita**: notare → capire → decidere → tracciare → agire → **rivedere** (una decisione (iii) senza scadenza torna rumore: coperto dal «quando ri-guardare»).
- **(c) inverso**: «smettere di reagire» è **giusto** per (b), e la classe lo premia (P2) — è ciò che distingue il triage dall'ansia.
- **(d) coerenza di radice — alternativa valutata**: [[class-harness-environment-awareness]] (OUTWARD: *quali meccanismi offre l'ambiente*) copre il **sapere che l'hook esiste**, non lo **spegnersi dell'attenzione** su ciò che dice; il fallimento è INWARD (uno stato mio), come per la sorella attentional-scope-exit → radice-AUDIT. Se Fra preferisce l'OUTWARD, il contenuto non cambia: cambia il padre.
- **(e) segnalato**: gap orizzontale trovato **e già coperto altrove**: *tacitare il segnale* (N2) è la stessa forma di [[class-evaluation-integrity]] §N5 (*auto-strumentarsi per falsificare la misura*) → cross-link, non duplicato.

## Coherence-audit (playbook §5)
1. Struttura ✓ · 2. Reward outcome-anchored (causa risolta ∨ decisione ritrovabile) + latenza con oracolo + simmetria + hack-check ✓ · 3. Padre proposto = radice-AUDIT, sorella di attentional-scope-exit; alternativa dichiarata; **non ratificato** · 4. Negativi su entrambi i poli ✓ · 5. Transfer A/B/C ✓ · 6. Fixture self-contained ✓ · 7. Held-out: narrativo, dichiarato ✓ · 8. Wiring: `index.md` + `todo.md`; il padre la elencherà **alla ratifica**.

## Links
[[class-metacognitive-self-audit]] (**padre PROPOSTO**) · [[class-attentional-scope-exit]] (**sorella**) · [[class-harness-environment-awareness]] (alternativa di placement, scartata con motivo) · [[class-evaluation-integrity]] (N2 = auto-strumentarsi) · [[class-consequence-intention-conflict]] (tacitare contraddice il fine) · [[class-task-granularity-and-state-sync]] (la traccia della decisione) · [[area-08-tool-use-agentic]] (`error-recovery`: la prima occorrenza) · [[dataset-construction-playbook]]

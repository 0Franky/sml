---
name: evidence-based-certainty-and-observer-training
description: "⛔ RISPOSTA a due domande dirette dell'utente (TG 2026-08-25). (1) La tensione che ha nominato lui — «non asserire senza prove» contro «sii sicuro delle tue scelte» — NON e' una contraddizione: i due assi parlano di cose diverse (da dove VIENE la certezza vs come la si COMUNICA), e la cura meccanica e' gia' in wiki e verificata: addestrare l'ASTENSIONE come azione COLLASSA (arXiv 2608.00301), si addestra la CALIBRAZIONE con confidenza sempre emessa e la soglia sta al deployment. (2) Il secondo-modello-che-interroga durante il long-horizon ha senso in ENTRAMBI i regimi ma MISURA COSE DIVERSE — attention nel transcript classico, RECUPERO col dynamic context — e il suo giudice va ancorato a irregolarita' verificabili dal trace, o diventa un vettore di reward-hacking."
type: concept
status: ⛔ PROPOSTA — risposta consegnata 2026-08-25, le scelte attendono l'utente
tags: [rl, calibrazione, astensione, long-horizon, dynamic-context, judge, area-processo, proposta]
sources:
  - utente TG msg 2129-2131 (2026-08-25) — le due domande, raw in `wiki/_private/user-ideas-2026-08-25.md`
last_updated: 2026-08-25
---

# ⛔ Certezza dalle prove · e il modello-osservatore

## (1) La tensione che ha nominato lui — e perche' si scioglie

Le sue parole: *«non deve sentirsi lui "abbastanza" confidente (va un po' in contrasto con gli esercizi sulla sicurezza delle proprie azioni e scelte, da capire come far coesistere)»*.

⭐ **Non e' una contraddizione: i due assi non parlano della stessa cosa.**

| asse | domanda a cui risponde |
|---|---|
| *«non asserire senza prove»* | **da dove VIENE** la certezza (la fonte) |
| *«sii sicuro nelle tue scelte»* | **come la si COMUNICA e ci si agisce** una volta che c'e' (l'espressione) |

Il difetto da togliere e' la **certezza NON GUADAGNATA** — non la sicurezza. Ed esiste il difetto **opposto**, altrettanto reale e gia' scritto in [[../REQUISITO-AFFIDABILITA]]: dire *«non sono sicuro»* su cose verificabili in dieci secondi e' **scaricare il lavoro sull'utente**, e usare l'incertezza come riparo dal rischio di sbagliare e' ancora ottimizzare per se'. **Cio' che e' verificato si dice piatto e netto.**

### ⚠️ E la forma ingenua della sua richiesta COLLASSA — dimostrato, non temuto

Tradurre *«non asserire senza prove»* in **«insegnagli ad astenersi»** e' esattamente la forma che si rompe. Lo dice un risultato **gia' in wiki e gia' verificato alla fonte** ([[../sota-techniques-catalog]] §RL-6(1), arXiv **2608.00301**): se l'astensione e' un'**azione discreta** in un reward che penalizza l'errore, il modello **deriva verso «rifiuta tutto»** — gate e ancora KL saturano insieme, la copertura collassa, e il reward medio di training sale a zero **mentre il modello non risponde piu' a niente**.

**La riparazione, dallo stesso paper**: si addestra un **rapporto di confidenza SEMPRE emesso** con una *strictly proper scoring rule* + reward di correttezza; **l'astensione si ottiene a deployment, per soglia**. *«The always-emitted report has no gate to saturate.»*

⭐ **E' questa la coesistenza che cercava**, in forma meccanica invece che di equilibrio: la confidenza non e' una **scelta binaria** fra asserire e tacere, e' una **funzione delle prove che viaggia sempre con la risposta**. Con poche prove esce bassa, e sotto soglia il sistema non asserisce; con prove solide esce alta, e allora si dice **netto**. Nessuno dei due poli va addestrato come comportamento: si addestra la **funzione**, e i due poli sono i suoi estremi.

**Conseguenza sul reward** (gia' coerente con la misura (b) del requisito): la calibrazione si valuta **distribuzionalmente** (ECE su held-out bilanciato), **mai per-esempio** — grondare per-esempio *«qui doveva astenersi»* re-introdurrebbe il branch-reward (#32).

## (2) Il modello-osservatore nel long-horizon — ha senso, ma misura due cose diverse

La sua idea: durante un task lungo, **un secondo modello interviene con domande**; quando nota un'irregolarita' la segnala al verifier → **reward negativa**. Sua domanda: serve anche col **dynamic context**, o e' roba da transcript classico?

⭐ **La distinzione che risolve**: nei due regimi l'esercizio **misura skill diverse**, quindi la risposta non e' *«serve / non serve»* ma *«serve a due scopi diversi»*.

| regime | il dato che serve e'... | cosa misura la domanda dell'osservatore |
|---|---|---|
| **transcript classico** | **presente** in finestra, in mezzo a molto altro | **ATTENTION** — sai usare cio' che hai gia' davanti? |
| **dynamic context** | **fuori** finestra, ma **recuperabile** | **RECUPERO** — sai che esiste, e vai a prenderlo? |

→ Nel **nostro** regime la seconda e' quella che conta, ed e' gia' parzialmente coperta: [[../training-taxonomy/class-confabulation-retrieval-failure]] (il RECALL) e [[../training-taxonomy/class-harness-environment-awareness]] (sapere **quali affordance** esistono per recuperare). **L'esercizio dell'osservatore non le rimpiazza: le mette sotto pressione in modo long-horizon**, che e' la condizione in cui il difetto si manifesta davvero.

**Quindi**: la sua intuizione — *«col dynamic context forse non e' cosi' sentita»* — e' **giusta sul sintomo e sbagliata sulla conclusione**. Il problema non sparisce: **cambia forma**, da *dimenticare-guardando* a *non-sapere-di-dover-andare-a-prendere*. E la seconda e' la piu' insidiosa, perche' il modello **non ha nessun segnale** che gli manchi qualcosa.

### ⚠️ Il caveat forte sul suo design — il giudice va ANCORATO

*«Quando nota un'irregolarita' lo segnala al verifier in modo che abbia una ricompensa negativa»*: il modello-osservatore che decide cos'e' un'irregolarita' **e' un judge**, e un judge non ancorato e' un vettore di reward-hacking (#10) — sia verso il rumore (segnala tutto per partecipare) sia verso il silenzio.

**Ancoraggio proposto**: l'irregolarita' deve essere **verificabile dal trace in modo deterministico** — *il fatto X e' stato stabilito al turno N, la risposta al turno M lo contraddice* e' un confronto **meccanico**, non un giudizio. L'osservatore **pone la domanda** (e' li' il suo valore: crea l'occasione); a decidere se la risposta e' incoerente e' un **confronto sul trace**, non la sua opinione.
⚠️ Simmetria obbligatoria (#21): servono turni in cui l'osservatore chiede e la risposta **e' corretta** — altrimenti si addestra *«sotto interrogatorio, cambia idea»*, che e' sycophancy con un altro cappello.

## Residuo dichiarato *(#0)*

**Nessuna misura.** La citazione 2608.00301 e' `[V]` (gia' verificata alla fonte e registrata in wiki). La tabella dei due regimi e' un **argomento strutturale**, non un esperimento (`[A]`) — e va letta ricordando **F34**: la viabilita' della memoria-harness e' **model-specific e non size-monotona**, quindi *«nel nostro regime conta il recupero»* **va rimisurato sul modello target** prima di tararci sopra un curriculum. L'ancoraggio del judge e' un design **non attaccato eseguendo** (`[?]`).

## Links
[[../sota-techniques-catalog]] §RL-6(1) · [[../REQUISITO-AFFIDABILITA]] · [[skill-internalization-and-credit-assignment]] · [[../training-taxonomy/class-confabulation-retrieval-failure]] · [[../training-taxonomy/class-harness-environment-awareness]] · [[../todo]]

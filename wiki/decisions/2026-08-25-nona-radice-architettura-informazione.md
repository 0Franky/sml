---
name: 2026-08-25-nona-radice-architettura-informazione
description: "⏳ ATTENDE DECISIONE UTENTE dal 2026-08-25 — Le sue richieste I e J (semi-strutturazione dell'informazione · redesign da UI disordinata) sono UNA classe con due facce, non due classi. Ma nessuna delle 8 radici della tassonomia la contiene, e appenderla alla famiglia visiva sarebbe l'errore di coerenza-di-radice. Proposta: una NONA RADICE, «architettura dell'informazione». Documento self-contained scritto su sua richiesta esplicita («non ricordo di cosa si tratta, fammi un file dove mi spieghi tutto secondo il protocollo di comunicazione»)."
type: decision
status: ⏳ ATTENDE DECISIONE UTENTE — aperta il 2026-08-25
tags: [decisione, tassonomia, radice, frontend, information-architecture, area-processo]
sources:
  - utente TG msg 2088 (2026-08-17) — le richieste I e J
  - utente TG msg 2146/2147 (2026-08-25) — «per I più J non ricordo di cosa si tratta, mi serve una file dove mi spieghi tutto secondo il protocollo di comunicazione»
last_updated: 2026-08-25
---

# ⏳ I + J e la nona radice — tutto quello che serve per decidere

> **Perche' questo file esiste**: l'hai chiesto tu, e la ragione che hai dato e' *«non ricordo di cosa si tratta»*.
> Quindi e' scritto per essere letto **da solo**, dal telefono, **senza aprire altro** e senza ricostruire niente.
> Se una frase qui dentro ti obbliga ad andare a cercare qualcos'altro, il documento ha fallito il suo scopo.

---

## 1 · Cosa sono I e J — con le tue parole

Il **2026-08-17** mi avevi mandato quattordici richieste. Due erano queste:

> **I — semi-strutturazione dell'informazione**: *cosa diventa bottone/card, cosa raggruppare, cosa sezionare; sapere se un'informazione va in **un box solo** o divisa (un avviso con titolo + descrizione + «procedi, sono consapevole»)*.

> **J — redesign da UI disordinata**: *estrarre il contenuto, sezionare, raggruppare, creare componenti — quattro informazioni separate diventano **una card** in stile finanziario, con freccia, percentuale, media e gerarchia tipografica*.

Sono rimaste ferme perche' le avevo dichiarate **bloccate** da una tua risposta sul frontend. **Non lo erano** — l'ho scoperto facendo la scomposizione, ed e' il punto 3.

## 2 · Cosa ho trovato — sono UNA classe, non due

Il muscolo condiviso e' uno solo: **quali informazioni formano un'unita' semantica, e a quale livello**.

La differenza fra le due e' la **direzione**:

| | si parte da… | si arriva a… | il passo in piu' |
|---|---|---|---|
| **I** | il **contenuto** | la forma | — |
| **J** | una **forma sbagliata** | il contenuto, poi la forma giusta | ⭐ **estrarre il contenuto dalla resa esistente** |

E J porta un **fallimento proprio** che I non ha: **l'ancoraggio alla forma esistente** — tenere le sezioni che ci sono *perche' ci sono*, invece di chiedersi se quel raggruppamento ha ancora senso.

→ **Una classe con due facce.** Farne due sarebbe insegnare due volte la stessa radice, che e' l'errore che la nostra regola sulla gerarchia vieta.

## 3 · Perche' NON erano bloccate — e cosa ho verificato

Il **2026-08-25** ho scomposto il frontend e ho trovato che **non e' una capacita' sola**:

- **decidere la struttura** (cosa e' una card, cosa si raggruppa, quale gerarchia tipografica esprime quale gerarchia di **significato**) → e' **architettura dell'informazione**, cioe' analizzare e scomporre = **identita' Tier-1**;
- **produrre la resa** (il componente in quel framework, con quelle convenzioni) → conoscenza di ecosistema, **volatile** = **verticale**.

**I e J cadono quasi per intero nella prima meta'.** Quindi sono **Tier-1** e **scrivibili subito** — non aspettavano nessuna tua risposta.

⭐ **E la meta'-resa esisteva gia' nel nostro corpus, gia' etichettata bene**: `class-visual-design-quality` e' una **radice** con due figlie, taggata `tier-3, lora-vertical` dal **2026-07-08**. Cioe' **meta' di questo split l'avevi gia' deciso a luglio**, e io l'ho ritrovata cercando invece di riscriverla.

⚠️ **Ma quella famiglia NON copre I/J**, e il confine e' netto: giudica la composizione contro **leggi verificabili** — prossimita', allineamento, gerarchia, contrasto. E **la legge di prossimita' dice che le cose che appartengono insieme stanno vicine: non dice QUALI cose appartengono insieme.** Quella e' una decisione sul **contenuto**, presa prima di qualunque pixel: quattro dati diventano **una** card perche' sono **lo stesso fatto visto da quattro angoli**, non per una legge visiva.
→ **La legge visiva CONSUMA la struttura; non la produce.**

## 4 · Il problema, ed e' il motivo per cui ti scrivo

Per aggiungere una classe alla tassonomia serve un **padre**. Ho scorso **tutte e otto** le radici che abbiamo:

`action-execution-optimization` · `constraint-fit-decision` · `constraint-override-authority` · `ground-truth-integrity` · `least-privilege-information-boundary` · `metacognitive-self-audit` · `situational-awareness` · `visual-design-quality`

**Nessuna la contiene.** E appenderla a `visual-design-quality` — che sarebbe la tentazione, perche' il *tema* combacia — e' l'errore che abbiamo gia' corretto una volta: **stesso argomento, strato sbagliato** (quella e' tier-3/verticale, questa e' Tier-1).

## 5 · La proposta — una NONA RADICE

> **`architettura dell'informazione`** — *quali elementi formano un'unita', e a quale livello.*

**Perche' e' una radice e non una foglia del frontend** — l'argomento sta tutto qui: **la stessa identica skill** decide

- i **confini di un modulo** nel codice (cosa sta insieme e cosa si separa),
- le **colonne** di una tabella,
- le **sezioni** di un documento,
- la **superficie** di un'API,
- e **la tassonomia che stiamo costruendo adesso** (quali classi sono una sola, quali sono due: e' letteralmente il lavoro di oggi).

**Una skill che governa cinque domini non e' figlia del sesto.**

### Cosa la ribalterebbe *(la parte che rende la decisione ri-valutabile invece che ri-discutibile)*

- Se esistesse una radice che la contiene davvero. **L'ho cercata e non c'e'** — ma l'ho cercata io, e la mia scansione puo' aver perso qualcosa.
- Se preferissi leggerla come figlia di `constraint-fit-decision`, intendendo il raggruppamento come *scelta del livello di granularita'*. **E' una lettura possibile ma piu' debole**: li' il perno e' il **fit ai vincoli**, e qui **non ci sono vincoli da far combaciare** — c'e' un contenuto da leggere.

## 6 · Cosa NON ho fatto, e perche'

**Non l'ho creata.** Aggiungere una radice cambia la **forma** della tassonomia, e vale la regola che i cambi strutturali **si propongono, non si assumono** — la stessa per cui oggi non ho ratificato questa insieme al resto, anche se mi avevi scritto *«vai con la ratifica»*: quella parola copriva collocazioni dentro l'albero esistente, **non un ramo nuovo dell'albero**.

**Non ho scritto la classe I+J**, perche' senza il padre non ha dove stare.

## 7 · Cosa non e' coperto da questo documento

- **Il contenuto** della classe I+J (esempi, reward, negativi, transfer): non e' scritto. C'e' il gap-scan, non la classe.
- **La meta'-resa**: questo documento non tocca `visual-design-quality` ne' le sue figlie. Restano dove sono.
- **Nessuna misura**: tutto qui dentro e' analisi di struttura, non esperimento. L'unica cosa **verificata coi file** e' che nessuna delle 8 radici contiene questa skill e che la famiglia visiva e' gia' tier-3.

## 8 · La decisione che serve

👉 **Tre opzioni, e mi basta una parola:**

1. **Nona radice** *(la mia reco)* — creo `architettura dell'informazione` e ci appendo la classe I+J con le sue due facce.
2. **Sotto `constraint-fit-decision`** — la aggancio li' come scelta-di-granularita'. Piu' economico, e a mio avviso meno onesto.
3. **Ferma** — resta tracciata e non si tocca.

## Links
[[../concepts/frontend-capability-split-tier1-vs-vertical]] (la scomposizione completa) · [[../training-taxonomy/class-visual-design-quality]] (la meta'-resa, gia' tier-3) · [[../training-taxonomy/class-constraint-fit-decision]] (l'opzione 2) · [[../todo]] · [[../concepts/agent-communication-protocol]]

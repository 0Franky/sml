---
name: class-information-architecture
description: "✅ NONA RADICE — ratificata dall'utente il 2026-09-11 («I + J ok tua reco, nona radice»). Skill-radice: QUALI ELEMENTI FORMANO UN'UNITA', E A QUALE LIVELLO. Decidere cosa sta insieme e cosa si separa e' una decisione sul CONTENUTO, presa prima di qualunque resa: quattro dati diventano una cosa sola perche' sono lo stesso fatto visto da quattro angoli, non per una legge visiva. E' radice e non foglia del frontend perche' la stessa skill decide i confini di un modulo, le colonne di una tabella, le sezioni di un documento, la superficie di un'API e la tassonomia stessa — una skill che governa cinque domini non e' figlia del sesto. Simmetrica: separare cio' che appartiene insieme e fondere cio' che non c'entra costano uguale."
type: training-class
status: ✅ RATIFICATA 2026-09-11 (utente TG msg 2154) — ⚠️ contenuto non revisionato, fixture non costruite
tags: [reasoning, information-architecture, decomposition, cohesion, area-01, area-03, parent-class, radice]
sources:
  - utente TG msg 2088 (2026-08-17) — le richieste I e J da cui nasce
  - utente TG msg 2154 (2026-09-11) — «I + j ok tua reco nona radice»
  - ADR [[../decisions/2026-08-25-nona-radice-architettura-informazione]]
last_updated: 2026-09-11
---

# ✅ Classe-PADRE (radice) — ARCHITETTURA DELL'INFORMAZIONE

> **Ruolo**: **nona radice** della tassonomia. Le altre otto sono
> `action-execution-optimization` · `constraint-fit-decision` · `constraint-override-authority` ·
> `ground-truth-integrity` · `least-privilege-information-boundary` · `metacognitive-self-audit` ·
> `situational-awareness` · `visual-design-quality`. **Nessuna la conteneva** — scansionate tutte prima di
> proporla ([[../decisions/2026-08-25-nona-radice-architettura-informazione]] §4).

## La skill-RADICE

> **Quali elementi formano un'unita', e a quale livello.**

Decidere **cosa sta insieme e cosa si separa** e' una decisione sul **CONTENUTO**, presa **prima** di qualunque resa. Quattro dati diventano **una** cosa sola perche' sono **lo stesso fatto visto da quattro angoli** — non perche' una legge di composizione dice che le cose vicine sembrano imparentate.

**Perche' e' una skill e non gusto**: entrambi gli errori sono reali, costosi e **opposti**.
- **Frammentare cio' che e' uno**: chi legge (o chi chiama) deve **ricomporlo da solo**, ogni volta, e ogni ricomposizione puo' sbagliare.
- **Fondere cio' che non c'entra**: l'unita' diventa **non riusabile** e non modificabile — cambiare una parte obbliga a toccare le altre.

⭐ **Il livello conta quanto il raggruppamento.** *«Stanno insieme»* non basta: **a quale grana?** Le stesse informazioni possono essere una sezione, tre sottosezioni, o una tabella — e la scelta dipende da **cosa ci fara' chi la riceve**, non da quante sono.

## ⚠️ Perche' e' una RADICE e non una foglia del frontend — l'argomento che decide

La tentazione era appenderla a [[class-visual-design-quality]], perche' il **tema** combacia. Sarebbe stato l'errore di **coerenza-di-radice** (#36d): **stesso argomento, strato sbagliato** — quella famiglia e' `tier-3, lora-vertical` dal 2026-07-08, questa e' **Tier-1**.

⭐ **Il confine e' netto, non sfumato**: la famiglia visiva giudica contro **leggi verificabili** (prossimita', allineamento, gerarchia, contrasto). La legge di prossimita' dice che *«le cose che appartengono insieme stanno vicine»* — **non dice QUALI cose appartengono insieme**. → **la legge visiva CONSUMA questa radice; non la produce.**

**E la prova che e' radice e' il TRANSFER** (#19): la **stessa** skill decide

- i **confini di un modulo** nel codice (cosa sta dentro, cosa esce),
- le **colonne** di una tabella e cosa invece e' una tabella a parte,
- le **sezioni** di un documento,
- la **superficie di un'API** (quali operazioni sono una, quali due),
- e **la tassonomia che stiamo costruendo** — *«questa e' una classe con due facce o sono due classi?»* e' letteralmente questa domanda.

**Una skill che governa cinque domini non e' figlia del sesto.**

## Le figlie (cosa si struttura)

| Figlia | Dominio | Doc |
|---|---|---|
| **struttura della PRESENTAZIONE** *(creata 2026-09-11)* | l'informazione destinata a **una persona che legge**: cosa diventa una card, cosa si raggruppa, cosa si seziona — e il caso inverso, ricostruire la struttura da una resa disordinata | [[class-information-presentation-structure]] |
| 🟡 **confini di MODULO — contenuto ARRIVATO 2026-09-11** | cosa sta dentro un'unita' di codice e cosa ne esce. ⭐ L'utente ne ha dato la forma operativa (TG msg 2155): **modellare il grafo dei flussi** → *chi tocca quel tipo di dato* → **far convergere i flussi in UN gate** che possiede verticalmente quel dato, invece di replicare il controllo in ogni modulo. E' **SSOT (#16) applicato al codice** invece che ai valori | [[class-module-boundary-flow-convergence]] *(scritta 2026-09-11, passo (b) del piano msg 2169; contenuto non revisionato)* |
| *(futura)* superficie di API | quali operazioni sono una, quali due | — |

> Le figlie *(futura)* sono **placeholder estensibili** (#20): la gerarchia cresce quando emerge un gap **reale**, non a priori. ⚠️ **E finche' la figlia e' una sola, questa radice e' a rischio «ombrello vuoto»**: e' giustificata dal transfer sopra, ma se fra qualche mese la seconda figlia non e' nata, **va ri-discussa** invece di restare per inerzia.
> ⭐ **Il rischio si e' chiuso lo stesso giorno, e non per merito mio**: l'utente ha mandato (TG msg 2155) il contenuto operativo della seconda figlia — il **grafo dei flussi con gate convergente** — **un'ora dopo** che l'avevo dichiarato vuoto. Lascio il rischio scritto perche' la previsione era giusta, e vale la pena vedere **quanto poco** e' durata.

## Reward (condiviso, ancorato all'OUTCOME #10 + simmetrico #21)

Ogni figlia premia la **struttura consegnata**, verificata su cio' che ci si fa dopo — **mai** la dichiarazione *«ho raggruppato per coesione»*.

- **① USO A VALLE** — un secondo compito, **piu' tardi**, che la struttura deve **abbreviare**. Se non abbrevia, il raggruppamento non portava informazione.
- **② COSTO DI MODIFICA** — cambiare **una** cosa tocca **una** unita'? Se ne tocca tre, erano fuse male; se obbliga a ricomporne tre, erano frammentate male.
- **③ SIMMETRIA** — il set e' bilanciato fra casi che vanno **uniti** e casi che vanno **separati**. Senza, `unisci-sempre` o `separa-sempre` vincono meta' delle volte senza aver imparato nulla.

⚠️ **Check #32**: *«questi due vanno insieme?»* e' ≈ funzione del campo di coesione della fixture → **quel campo non si gronda per-esempio**; va al distribuzionale (held-out bilanciato + ECE). Per-esempio si grondano ①-③, che sono **misure**.

**Hack-check (condiviso)**: `unisci-sempre` → ② · `separa-sempre` → ① e ② · `dichiara-il-criterio-e-non-cambiare-struttura` → ①-③ (la motivazione recitata non muove l'esito) · `copia-la-struttura-esistente` → ② sulle fixture dove la struttura data e' **sbagliata di proposito**.

## Cosa manca *(#37 — dichiarato)*

Fixture, scorer e held-out **non costruiti**. Le due figlie *(futura)* sono **slot**, non lavoro fatto. Il criterio operativo di *«unita'»* e' **nominato ma non operazionalizzato** — va tarato su casi reali, e sara' probabilmente **diverso per dominio** (la coesione di un modulo non si misura come quella di una card). ⛔ **Non usare per il training finche' non e' validata.**

## Links
[[class-information-presentation-structure]] (figlia) · [[class-visual-design-quality]] (⚠️ **consuma** questa radice: le leggi visive presuppongono che il raggruppamento sia gia' deciso) · [[class-constraint-fit-decision]] (radice sorella: li' si sceglie **fra opzioni date**, qui si decide **come si partiziona**) · [[class-design-artifact-lifecycle]] (il documento che **registra** la struttura decisa) · [[../decisions/2026-08-25-nona-radice-architettura-informazione]] · [[dataset-construction-playbook]]

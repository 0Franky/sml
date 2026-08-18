---
name: frontend-capability-split-tier1-vs-vertical
description: "⛔ RECO (attende decisione utente, 2026-08-18) — Scomposizione #11 del blocco frontend (richieste E · F · I · J). La domanda «frontend = Tier-1 o LoRA verticale?» ha una premessa falsa: il frontend non e' UNA capacita'. Si divide su un asse netto — DECIDERE LA STRUTTURA (cosa e' una card, cosa si raggruppa, quale gerarchia tipografica esprime quale gerarchia semantica) e' information architecture, cioe' analizzare e scomporre = identita' Tier-1, dimostrabile col transfer perche' la stessa logica decide i titoli di un documento e le colonne di una tabella; PRODURRE LA RESA in un ecosistema (framework, libreria, convenzioni) e' conoscenza volatile e specifica = verticale. ⭐ E il vincolo dei LoRA decide da solo: un verticale fa EMERGERE, non insegna — quindi la meta'-struttura NON PUO' stare in un adattatore, e la meta'-resa e' candidabile solo se il base gia' conosce quell'ecosistema. Risolve anche F (disgiunte o unificate): l'incoerenza temuta nasce dal fondere al livello sbagliato, e lo split la toglie per costruzione."
type: concept
status: ⛔ RECO — attende la decisione dell'utente (scritta 2026-08-18)
tags: [frontend, tier-1, lora, training-vs-harness, area-processo, proposta]
sources:
  - utente TG msg 2088 (2026-08-17) — richieste E · F · I · J, registrate in [[../todo]] blocco 2026-08-17
  - utente TG msg 2111 punto 1 (2026-08-18) — «i LoRA fanno emergere, non insegnano»
last_updated: 2026-08-18
---

# ⛔ Frontend: Tier-1 o verticale? La domanda ha una premessa falsa

> ⚠️ **Correzione a una mia reco precedente, e cambia la decisione.** Avevo risposto **«verticale»**. Era **sotto-specificato**: risposto cosi', metterebbe in un adattatore anche la meta' che in un adattatore **non puo' stare**. La risposta corretta e' **entrambe, su due meta' diverse** — sotto il perche'.

## La scomposizione (#11: scomponi PRIMA di costruire)

| meta' | che cos'e' davvero | classificazione | perche' |
|---|---|---|---|
| **DECIDERE LA STRUTTURA** — cosa diventa una card, cosa si raggruppa, cosa si seziona, quale gerarchia tipografica esprime quale gerarchia **semantica**, se un'informazione sta in **un box solo** o va divisa | **information architecture** — analizzare e scomporre | **S · Tier-1** | e' **letteralmente** l'identita' del Tier-1 ([[../REQUISITO-AFFIDABILITA]] e `project_base_model_intelligence`: *analisi del problema e decomposizione*), non conoscenza di frontend |
| **PRODURRE LA RESA** — il componente in quel framework, con quelle convenzioni, quella libreria, quello stile | **conoscenza di un ecosistema specifico**, e **volatile** | **S · verticale** | cambia in fretta; e' esattamente la classe di fatti che #22 vieta di cementare come ground-truth nel modello generale |

⭐ **La prova che la meta'-struttura NON e' frontend e' il transfer** (#19): la **stessa** logica decide cosa diventa un titolo e cosa un elenco in un documento, quali informazioni diventano colonne di una tabella, cosa sta su una slide sola e cosa su due, e come si raggruppa un modulo per la firma. Una skill che vale in cinque domini **non appartiene** al sesto: appartiene alla radice.

## ⭐ Il vincolo dei LoRA decide da solo, e questo e' l'argomento che chiude

Dalla sua decisione del 2026-08-18 (SSOT: [[../architecture/three-tier-design]] §VINCOLO FONDANTE): **i LoRA fanno EMERGERE, non INSEGNANO.**

Applicato qui, produce due conseguenze **non negoziabili**:

1. **La meta'-struttura non puo' vivere in un verticale.** Se il base non sa gia' decidere una gerarchia di informazione, nessun adattatore glielo insegna: otterremmo la **forma** (produce card e sezioni) senza la **sostanza** (le card sbagliate). → deve stare nel **Tier-1**, addestrata li'.
2. **La meta'-resa e' candidabile a verticale SOLO SE il base conosce gia' quell'ecosistema** — e questo **si verifica, non si assume** (e' il criterio di copertura-di-conoscenza gia' scritto in [[../GOAL]] §1-bis). Un verticale su un framework che il base non ha mai visto e' il caso-tipo del guscio inerte.

## Cosa risolve — F, e in modo diretto

La richiesta **F** chiedeva: skill frontend **disgiunte o unificate**? Con il rischio che lui stesso ha nominato — *due skill che generano lo stesso stile in modo diverso, una volta interiorizzate e rimosse il modello le **mescola*** — e il desiderio: **consistenza + variabilita' creativa**, *«non deve essere una strada ma delle direttive»*.

⭐ **L'incoerenza che teme nasce dal fondere al livello SBAGLIATO.** Due skill che fanno **entrambe** *struttura + resa* si sovrappongono per costruzione: decidono la stessa cosa due volte, e in modo diverso. Lo split le separa **per strato**, e la sovrapposizione sparisce senza bisogno di coordinarle:

- **consistenza** = lo strato-struttura e' **UNO** (Tier-1) e decide sempre con la stessa logica;
- **variabilita' creativa** = lo strato-resa puo' essere **molti** verticali, ognuno con le sue direttive, perche' non decidono piu' *cosa* mostrare — solo *come*.

→ **Risposta a F**: **unificato lo strato di struttura, disgiunti gli strati di resa.** Non e' un compromesso fra le due opzioni: e' che la domanda *disgiunte-o-unificate* si applica a **due cose diverse** con risposte opposte.

## ⭐ Conferma trovata nel corpus, non argomentata a tavolino

Cercando prima di scrivere (#33), la meta'-resa **esiste gia' nella tassonomia e porta gia' l'etichetta giusta**: [[../training-taxonomy/class-visual-design-quality]] e' una **radice** con due figlie ([[../training-taxonomy/class-frontend-ux-spacing-quality]] · [[../training-taxonomy/class-svg-spatial-composition]]), taggata **`tier-3, lora-vertical`** dal 2026-07-08. Lo split non e' una proposta nuova: **meta' era gia' stata presa** mesi fa, e questa pagina la completa nominando l'altra meta'.

⚠️ **E il confine fra le due e' netto, non sfumato**: quella famiglia giudica la composizione contro **leggi verificabili** — prossimita', allineamento, gerarchia, contrasto. La legge di prossimita' dice *«le cose che appartengono insieme devono stare vicine»*; **non dice QUALI cose appartengono insieme**. Quella e' una decisione sul **contenuto**, presa prima di qualunque pixel: quattro dati diventano **una** card non per una legge visiva, ma perche' sono **lo stesso fatto visto da quattro angoli**. → **la legge visiva CONSUMA la decisione di struttura; non la produce.**

## Cosa ne segue per I e J *(che erano bloccate)*

Entrambe cadono **quasi per intero** nella meta'-struttura, quindi **sono Tier-1 e si possono scrivere subito**:

- **I — semi-strutturazione dell'informazione**: *cosa diventa bottone/card, cosa raggruppare, cosa sezionare, se un avviso e' un box solo o titolo+descrizione+conferma*. E' decisione di struttura, punto.
- **J — redesign da UI disordinata**: *estrarre il contenuto, sezionare, raggruppare, creare componenti* (quattro informazioni sparse -> **una** card con gerarchia). La parte *«creare il componente»* ha una coda di resa, ma il lavoro vero — **riconoscere che quelle quattro informazioni sono una cosa sola** — e' struttura.

⚠️ **Prima di scriverle serve pero' un gap-scan orizzontale** (#36): I e J condividono un muscolo evidente (*raggruppare cio' che appartiene insieme, separare cio' che non c'entra*) e potrebbero essere **due facce di una classe sola**, non due classi. Da verificare **prima** di filarle, non dopo.

## Cosa la ribalterebbe *(#37)*

- Se il base scelto si rivelasse **gia' forte** sulla decisione di struttura, la meta'-Tier-1 diventerebbe una **verifica** invece di un addestramento — cambierebbe il costo, non la collocazione.
- Se un ecosistema-target risultasse **poco conosciuto** dal base, il verticale corrispondente **non si fa**: si aggiunge prima la conoscenza (dati nel Tier-1 / continual pre-training), altrimenti e' un guscio inerte.
- Se lui volesse **una sola resa canonica** invece di piu' stili, lo strato-resa collasserebbe a uno — ma lo split resterebbe utile lo stesso, perche' e' la struttura a doversi generalizzare.

## Residuo dichiarato

**Nessuna misura.** La scomposizione e' un argomento di classificazione (#11), non un esperimento; la copertura-di-conoscenza del base sugli ecosistemi frontend **non e' stata verificata** ed e' proprio il dato che decide il punto 2. La proposta di unire I e J e' un'**ipotesi da gap-scan**, non una conclusione.

## Links
[[../architecture/three-tier-design]] (§VINCOLO FONDANTE: i LoRA fanno emergere) · [[../GOAL]] §1-bis · [[training-vs-harness-classification]] · [[../todo]] · [[../REQUISITO-AFFIDABILITA]]

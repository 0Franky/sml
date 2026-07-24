---
name: decision-request-marker-and-recommendation
description: "COPIA della regola-di-lavoro (SSOT nel wiki-core condiviso PRIVATO) — ogni richiesta di decisione porta il marcatore riservato, e' auto-contenuta e arriva con la reco"
type: rule-mirror
tags: [workflow, communication, decisions, mirror, async]
last_updated: 2026-07-25
---

> ## 📋 COPIA — la SSOT vive nel wiki-core condiviso (repo PRIVATO, non linkabile da qui)
> Questo repo e' **PUBBLICO**: non puo' contenere un submodule ne' l'URL del repo privato (decisione utente
> 2026-07-24). Le regole-di-lavoro condivise si **COPIANO** come contenuto quando servono anche al progetto SLM.
> ⚠️ **Se modifichi la regola, modificala nella SSOT** (wiki-core, `content/memory/rules/workflow/`) e poi
> ri-sincronizza questa copia — **mai il contrario**: due sorgenti che divergono in silenzio sono il difetto
> che questa disciplina esiste per evitare.
> _(Origine: richiesta utente 2026-07-25. SSOT commit `009c873`.)_


# Ogni richiesta di decisione porta il marcatore 🗳️, è auto-contenuta e arriva con la tua reco

Quando un messaggio contiene un punto in cui **serve una decisione dell'utente**, quel messaggio deve soddisfare **tre requisiti insieme**. Mancarne uno lo rende inefficace: un marcatore su un messaggio incomprensibile non aiuta, e un'analisi perfetta senza marcatore non viene vista.

## 1. Il marcatore — 🗳️, riservato

Il carattere **🗳️** apre ogni punto che richiede una decisione dell'utente, e **non si usa per nient'altro**. Mai come decorazione, mai come bullet, mai per "importante" o "urgente".

L'esclusiva vale nelle **due direzioni**:

- **Ogni** richiesta di decisione lo porta → l'assenza del marcatore è una promessa: *"qui non serve nulla da te"*.
- **Nessun altro** messaggio lo porta → la presenza è un segnale, non rumore.

Se il messaggio contiene più decisioni, ognuna apre con il proprio 🗳️ e ha un numero (`🗳️ 1`, `🗳️ 2`), così si può rispondere per riferimento senza ricopiare.

## 2. Auto-contenuto — decidibile senza ricostruire il contesto

Chi legge è **da telefono, lontano dal lavoro, forse ore dopo**. Il messaggio deve bastare a decidere **da solo**. Ogni punto 🗳️ contiene:

- **Cosa si decide** — in una frase, nel vocabolario condiviso, non nel gergo interno del lavoro in corso.
- **Il contesto minimo per riprendere il filo** — quel tanto che serve a ricollegarsi (*"la classe che avevamo spezzato in due ieri"*), **non** un riassunto di tutto.
- **Le opzioni con la conseguenza di ciascuna** — cosa cambia davvero se si sceglie A invece di B, non i nomi delle opzioni.
- **Cosa si blocca** finché non arriva la risposta — e cosa invece procede comunque.

Regola pratica: **niente riferimenti a ciò che l'utente non vede**. Non output di terminale, non "il file che ho appena scritto", non un nome di commit nudo, non "il punto sopra" di un messaggio precedente. Se serve, si riassume **dentro** il messaggio.

## 3. Sempre la tua raccomandazione

**Mai un menu nudo.** Un elenco di opzioni senza una presa di posizione scarica sull'utente un lavoro che si poteva fare al posto suo.

La reco dichiara:

- **Quale opzione** e **perché** — la migliore nel merito, non la più comoda o veloce da eseguire ([[memory/rules/meta/no-lazy-choices]]).
- **Quanto è solida** — se è una preferenza debole, dirlo; se è quasi certa, dirlo.
- **Cosa la ribalterebbe** — il fatto o il vincolo che, se vero, cambia la risposta. È la parte più utile: dice all'utente **cosa deve sapere lui** che io non so.

Una reco **non è un'approvazione**: proporre non è decidere, e finché non c'è una ratifica esplicita si resta in "proposta" ([[memory/rules/meta/never-self-stamp-user-approval]]).

## Why

Chi lavora in asincrono scorre i messaggi in una lista, non li legge in sequenza. Senza un segnale visivo riservato, una richiesta di decisione ha lo stesso peso di un update di avanzamento: **si perde**, e il lavoro resta fermo senza che nessuno dei due sappia di essere il collo di bottiglia. Il marcatore trasforma "leggere tutto per capire se serve qualcosa" in "guardare la lista e vedere se c'è".

Ma il marcatore **funziona solo se discrimina**. Marcare anche ciò che si può decidere da soli lo inflaziona finché non significa più nulla — e a quel punto il costo è peggiore del non averlo, perché le decisioni vere si nascondono tra i falsi allarmi.

E un marcatore su un messaggio che l'utente non riesce a decidere trasferisce solo la sveglia, non la decisione: apre un secondo giro (*"dammi contesto"*) che costa più del messaggio fatto bene la prima volta.

## How to apply

- **Prima di marcare, verifica che la decisione sia davvero sua**: la posso prendere io in autonomia? è reversibile e a basso costo? esiste un default sensato e dichiarabile? Se sì → decidi, dichiara cosa hai scelto, **niente marcatore**.
- Marca quando la scelta dipende da **informazioni che ha solo lui** (preferenze, priorità, vincoli esterni, contesto non scritto), o quando è **irreversibile / costosa / outward-facing**.
- **Raggruppa** le decisioni pendenti in un unico messaggio quando possibile, invece di spargerle: si risponde in una volta sola.
- **Rileggi il punto fingendo di non aver seguito il lavoro**: se per capirlo serve qualcosa che non è nel messaggio, aggiungilo o riformulalo.
- Il marcatore **non sostituisce il canale**: continua a valere dove e come si chiede ([[memory/rules/workflow/never-block-ask-via-remote-channel]], [[memory/rules/workflow/ping-before-ask-question]]).
- **Se la decisione resta aperta**, tracciala dove persiste (tracker/todo) — non solo nel messaggio, che scorre via.

## Anti-pattern

- **Marcatore usato per enfasi** (*"🗳️ attenzione a questa cosa"*) — brucia l'esclusiva: da lì in poi non è più affidabile.
- **Marcare per scaricare**: usarlo su scelte che si potevano prendere in autonomia, per non prendersi la responsabilità.
- **Decisione senza marcatore**, sepolta a metà di un update lungo: equivale a non averla chiesta.
- **Menu nudo** (*"preferisci A o B?"*) senza reco, o con una reco travestita (*"entrambe valide, dimmi tu"*).
- **Reco che ottimizza il mio sforzo** invece del merito.
- **Punto decidibile solo davanti al mio schermo**: cita output, file o passaggi che l'utente non ha visto.
- **Marcatore su una decisione già presa**: se è già stata ratificata, non è una domanda — è un recap.

## Auto-detection triggers

- Stai per scrivere *"fammi sapere"*, *"dimmi tu"*, *"preferisci?"*, *"vuoi che…"*, *"attendo conferma"*.
- Stai per fermare o rinviare un lavoro perché manca una scelta.
- Stai per elencare due o più alternative valide.
- Un elemento del tracker passa in stato *"attende decisione"*.
- Stai per usare 🗳️ per qualcosa che **non** è una richiesta di decisione → fermati, è il momento in cui l'esclusiva si rompe.

---
name: GOAL
description: "⭐ PUNTO FISSO del progetto — il documento da rileggere a OGNI sessione e dopo OGNI compaction. Contiene il requisito fondante, l'ordine di lettura, cosa è aperto adesso, e il prompt che l'utente incolla per far ripartire il lavoro senza perdere pezzi. È corto e stabile DI PROPOSITO: punta ai tracker vivi, non li duplica."
type: goal
status: 🔴 aperto — documento vivo, si aggiorna a ogni chiusura di lavoro
tags: [goal, punto-fisso, anti-compaction, area-processo]
last_updated: 2026-08-18
---

# ⭐ GOAL — il punto fisso

> **Perché esiste** (utente 2026-08-18): *«dammi un riferimento al file dove dentro ci metti già il prompt che ti serve, dove indichi soprattutto di tenere sempre aggiornato quel documento e tutti quelli elencati, in modo tale che anche dopo le compaction tu hai lo stesso goal — rileggi sempre questo documento e non ti perdi i pezzi.»*
>
> ⚠️ **Questo file è CORTO e STABILE di proposito.** Non contiene lo stato: **punta** ai tracker vivi. Un punto fisso che cambia a ogni commit non è un punto fisso, ed è la ragione per cui tutto il resto è altrove.

---

## 1. Il requisito che domina tutto

**Il modello deve essere AFFIDABILE.** Il difetto da estirpare **non è sbagliare**: è **ritrattare dopo che l'utente ha già agito** sulla risposta.
→ SSOT completa: **[[REQUISITO-AFFIDABILITA]]** · regola sempre attiva: `CLAUDE.md` **#-1**

Le tre conseguenze operative, in una riga ciascuna:
1. **La certezza viaggia CON la risposta** — chi legge deve poter decidere quanto costruirci sopra **prima** di costruirci sopra.
2. **La wiki si consulta PRIMA di rispondere**, non dopo aver sbagliato.
3. **Prima di consegnare, verifica ciò che DISCRIMINA** — non ciò che è comodo controllare.

⚠️ **Polo simmetrico, senza cui il requisito si autodistrugge**: il difetto non è la sicurezza, è **la sicurezza non guadagnata**. Ciò che è verificato si dice piatto e netto; l'incertezza su cose verificabili in dieci secondi è scaricare il lavoro sull'utente.

## 1-bis. Il vincolo architetturale che non si negozia

**I LoRA fanno EMERGERE, non INSEGNANO.** Il modello base deve gia' contenere la conoscenza; gli adattatori la fanno affiorare come competenza. Se la conoscenza non c'e', **il verticale e' inutile** e produce forma senza sostanza.
-> SSOT: [[architecture/three-tier-design]] §VINCOLO FONDANTE. Conseguenza: la **copertura di conoscenza** e' criterio di prima classe nella scelta del base, e un dominio e' candidabile a verticale **solo se il base gia' lo conosce** — da verificare, non da assumere.

## 2. Cosa leggere, in quest'ordine, a ogni ripartenza

| # | File | Cosa ci trovo |
|---|---|---|
| 1 | **questo** | il punto fisso e l'ordine di lettura |
| 2 | [[REQUISITO-AFFIDABILITA]] | il requisito che ordina tutte le priorità |
| 3 | [[todo]] | **lo stato vivo** — cosa è aperto, cosa è chiuso, di chi è |
| 4 | [[STATO-2026-08-04]] | i tre obiettivi (A modello-base · B buchi-da-addestrare · C rendimento-harness) e cosa li distingue |
| 5 | [[training-taxonomy/dataset-construction-playbook]] | **le regole per costruire QUALSIASI classe** — non filare una classe senza |
| 6 | [[harness-experiment-log]] §0 | cosa sappiamo **per-modello**, e cosa è ancora da ri-testare |

**Materiale grezzo delle richieste utente**: `wiki/_private/` (gitignored) — le richieste verbatim decodificate stanno lì.

## 3. La regola di manutenzione — è la parte che rende utile il resto

- **Ogni cosa che l'utente dice finisce in wiki**, formalizzata e **linkata**. Niente pezzi volanti.
- **Quando chiudi un lavoro, aggiorni [[todo]] NELLO STESSO momento** — non «dopo». Lo stato che resta indietro sui fatti ha già prodotto **tre** falsi allarmi in un giorno solo (2026-08-17).
- **Lo stato sta nel TITOLO** con il vocabolario chiuso: ✅ chiuso · 🔴 aperto · 🟡 in corso · ⏳ attende (**con data**) · ⛔ proposta · 🗄️ archiviato. *(Una ricerca restituisce una riga: se lo stato non è in quella riga, non esiste.)*
- **Dopo un'azione che muta qualcosa, verifica l'ARTEFATTO**, non il resoconto del comando. Uscita zero significa «il processo è finito», non «il file è giusto».
- **Questo file si aggiorna** quando cambia il requisito, l'ordine di lettura, o la priorità di §4. **Non** quando cambia lo stato di un lavoro: quello vive in [[todo]].

## 4. Cosa è aperto adesso — ordine proposto

> Dettaglio completo e sempre aggiornato in **[[todo]]**, blocco `2026-08-17`. Qui solo l'ordine.

> ✅ **Consegnate il 2026-08-18, attendono solo una sua decisione — non altro lavoro mio**: **L** ([[training-taxonomy/class-instrumental-request-real-goal]]) · **C+D** ([[training-taxonomy/class-consumption-scale-for-budget]]) · **K** ([[concepts/skill-internalization-and-credit-assignment]], risposta + reco in 3 mosse).

1. **Le mosse di [[concepts/skill-index-and-lab-balance]]** — il **quinto checker** di reciprocità lab↔classe, che emette come sottoprodotto la colonna «misurabile?» (derivata dai lab, quindi non duplicabile). *(Non aspetta nessuna sua decisione: la misura è fatta — **11 classi su 74** hanno un laboratorio.)*
   🔴 **La terza mossa — il conteggio Q-vs-L — è BLOCCATA e il perché conta**: il tag Q/L **non esiste a livello di classe**, sta nelle foglie delle aree e neanche uniformemente. Sotto c'è una domanda strutturale aperta: **classi e foglie-d'area sono due assi senza mappatura esplicita**, quindi «copertura» non è ancora definita.
2. 🗳️ **I + J** — gap-scan fatto: sono **una classe sola con due facce**, ma **nessuna delle 8 radici la contiene** → serve una decisione sua su una **nona radice** (*architettura dell'informazione*) — **attesa nata il 2026-08-18**. Proposta argomentata in [[todo]]; **non eseguita**, perché è un cambio strutturale.
3. **Infrastruttura dell'affidabilità**: disciplina wiki-first come **comportamento addestrato** · **registro delle claim decision-bearing** (senza, «sei affidabile?» resta un'opinione).
4. **Fixture e scorer** delle classi proposte — finché non esistono, «classe scritta» significa *argomentata*, non *validata*, e la distinzione va detta ogni volta.

## 5. Il prompt da incollare

```
Rileggi wiki/GOAL.md e segui l'ordine di lettura del §2.
Poi prosegui dal primo punto aperto del §4, senza chiedermi da dove ripartire.

Vincoli sempre attivi:
- vale il requisito di wiki/REQUISITO-AFFIDABILITA.md: non dirmi cose su cui poi ritratti;
  se non hai verificato, scrivilo accanto invece di ometterlo.
- consulta la wiki PRIMA di rispondere, non dopo aver sbagliato.
- tieni aggiornati wiki/GOAL.md e wiki/todo.md nello stesso momento in cui chiudi un lavoro.
- dopo ogni azione che modifica file, verifica l'artefatto e non il resoconto del comando.
- niente risposte di getto sulle domande di progettazione: prima verifica, poi rispondi,
  e dichiara cosa resta aperto.
- rispondimi su Telegram, non nel terminale.
```

## Links
[[REQUISITO-AFFIDABILITA]] · [[todo]] · [[STATO-2026-08-04]] · [[index]] · [[training-taxonomy/dataset-construction-playbook]] · [[harness-experiment-log]]

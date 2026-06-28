---
name: structured-thinking
description: "Caveman thinking" strutturato — meno token, più verifiche, no discorsivo. Evoluzione di prompts/thinking-style.v1.md.
type: concept
tags: [concept, reasoning, thinking, prompt-engineering, token-efficiency, caveman]
sources: [prompts/thinking-style.v1.md, prompts/CHANGELOG.md, user notes 2026-05-21]
last_updated: 2026-05-21
---

# Structured Thinking — "Caveman" reasoning

## Idea ground truth (utente, 2026-05-21)

> "Training ai a ragionare prima come caveman ma non come a monosillabi. Quello che stavo pensando io era quello di far produrre un pensiero strutturato che poi andrà ad integrarsi perfettamente con la struttura del contesto perché il contesto poi deve essere strutturato e delimitato da specifici tag. Poi rifinitura per produrre una risposta umana con verifiche prima di rispondere. E se trova contraddizioni o incongruenze torna sui suoi passi → meno token di pensiero, più veloce."

> "Quando llm pensa non deve fare solo un pensiero discorsivo. Troppo consumo di token inutili e rischio di sbagliare/allucinare. Quindi pensiero strutturato e verifiche ricorrenti. Usare tabelle di check (abbiamo questo dato necessario? Si/no) pochi token, massima resa e controllo. Concetti chiave e pensiero strutturato."

> ⚠️ **Chiarimento (utente 2026-06-28, msg 266)**: "caveman" è SOLO un soprannome per lo stile **terso/strutturato** (tabelle di check, marker, niente filler) — **NON** linguaggio rotto/primitivo/monosillabico (lo dice già la ground-truth: "ma non come a monosillabi"). Distinzione netta: il **pensiero interno** è strutturato+terso; la **risposta user-facing** è **prosa normale e ben scritta** (§rifinitura: thinking ≠ risposta). Nelle doc/comunicazioni preferire **"pensiero strutturato"** a "caveman".

## Cosa significa "caveman thinking" (= pensiero strutturato)

Pensiero **non-monosillabico ma essenziale**, strutturato in primitive computazionali invece di prosa narrativa. Una metafora corretta: non "scrivere un saggio sul problema", ma "compilare una scheda tecnica del problema".

| Discorsivo (bad) | Caveman strutturato (good) |
|---|---|
| "Allora vediamo, l'utente vuole modificare il file X, però mi pare che X dipenda da Y, quindi dovrei prima controllare se Y esiste, ma non sono sicuro..." | OBIETTIVO: modifica X<br>INPUT: X path noto [V], Y dipendenza [?]<br>VERIFICA: grep Y in X → decide |
| 80+ token, fluffy | 15 token, action-ready |

## Componenti del thinking strutturato

### 1. Scheda di contesto iniziale (obbligatoria)

```
OBIETTIVO: <1 riga>
INPUT NOTI: <bullet, max 5>
OUTPUT ATTESO: <forma: codice / risposta / piano / decisione>
VINCOLI: <bullet, solo se rilevanti>
```

### 2. Tabelle di check dati

Prima di ogni azione non triviale:

| Dato necessario | Disponibile? | Fonte / Note |
|---|---|---|
| path file X | sì | letto a riga 12 |
| versione libreria Y | no | chiedere utente |
| schema DB | parziale | manca `users` |

Regola: se almeno una riga è `no` su un dato critico, **fermati e chiedi** invece di assumere.

### 3. Marker di stato delle asserzioni

- `[V]` — verificato in questa sessione
- `[A]` — assunto ragionevole, esplicitato
- `[?]` — da verificare prima di usarlo nella risposta finale

### 4. Verifica pre-risposta

Prima di output:

| Criterio | OK? |
|---|---|
| Risponde alla domanda posta | ☐ |
| Nessun fatto inventato | ☐ |
| Comandi testati o marcati `da testare` | ☐ |
| Contraddizioni nel pensiero risolte | ☐ |

### 5. Self-correction su contraddizione

Se durante il pensiero emerge una contraddizione con asserzione precedente:

1. Marker l'asserzione errata come `[CORRETTO]`
2. Esplicita la nuova versione
3. Re-check le conclusioni dipendenti
4. Vedi anche [[contradiction-detection-layer]] per il meccanismo runtime

### 6. Rifinitura → risposta umana

Il pensiero strutturato **NON è** la risposta finale. È input per la rifinitura. La risposta all'utente è prosa naturale (umana), ma **derivata** dal pensiero strutturato. Niente "OBIETTIVO: ..." nell'output user-facing.

## Obiettivi misurabili

- **Token di pensiero / token di risposta** ≤ 1.0 nel 90% dei casi
- **Tasso di allucinazione**: claim inventati / claim totali → 0%
- **Self-correction trigger**: numero contraddizioni risolte autonomamente durante thinking
- **Latency**: meno token thinking = meno wait → wrapper UX migliore

## Relazione con architettura three-tier

- **Tier 1 (orchestrator)**: thinking strutturato è suo task primario. Trained con dataset che PREMIA struttura (vedi [[post-rl-path-optimization]]).
- **Tier 2-3 (programming + verticali)**: ricevono thinking strutturato di Tier 1 come "richiesta strutturata", e producono codice idiomatico. Il loro thinking interno è opzionale (più snello).

## Relazione con context organization

Il pensiero deve **integrarsi** con la struttura del contesto. Vedi [[structured-context-sections]]: se il context usa `<section>` con `<state>` e `<assets>`, il thinking li referenzia esplicitamente:

```
RECUPERA: <context.state.aim>
VERIFICA: <context.state.assets> contiene Y? → no → richiedi
PRODUCI: aggiornamento di <context.state.queue>
```

## Vietato nel thinking

- Frasi di transizione discorsive ("ok, allora vediamo", "let me think")
- Riformulare la domanda con parole proprie
- Esplorare path già scartati senza nuovi dati
- Auto-complimenti / auto-critiche
- Numeri, nomi, API, flag, path **non verificati** presentati come fatti

## Eccezione: redesign / problema nuovo

Quando il task richiede ragionamento genuinamente nuovo (architettura, trade-off senza precedenti chiari), ammesso un blocco discorsivo **breve** all'inizio per impostare il problema, seguito comunque da una tabella o piano strutturato.

## Open questions

- Come trainare empiricamente il modello a produrre questo formato? (vedi [[post-rl-path-optimization]])
- Quali dataset esistono di "structured reasoning" pubblici? (vedi sprint idee)
- Format finale: markdown? XML tags? JSON? (vedi [[structured-context-sections]])

## Link interni

- [[structured-context-sections]] — il contesto in cui questo thinking opera
- [[external-update-injection]] — come gestire nuove info mentre si pensa
- [[contradiction-detection-layer]] — meccanismo runtime per self-correction
- [[post-rl-path-optimization]] — come ottimizzare i path di pensiero dopo training
- [[error-memo-system]] — memorizzare gli errori per non ripeterli

## Sources

- `prompts/thinking-style.v1.md` (esistente nel repo, baseline)
- `prompts/CHANGELOG.md` (open issues in v1 → questa è la v2)
- Anthropic's "Use XML tags" prompt engineering guide
- Chain-of-Thought (Wei et al. 2022)
- Reflexion (Shinn et al. 2023) — self-reflection in agents

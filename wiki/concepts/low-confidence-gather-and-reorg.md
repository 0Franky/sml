---
name: low-confidence-gather-and-reorg
description: Protocollo metacognitivo del Tier 1 sotto bassa confidence — STOP, riorganizzazione proattiva del contesto, poi bivio have-lead→gather (grep/file-search per codice, web per esterno) vs no-lead→ASK (domanda mirata non-bloccante). Idea utente 2026-06-27 (msg 130/131/159/160).
type: concept
tags: [agent-skill, metacognition, gathering, context-reorg, ask-vs-gather, optimization]
sources: [user notes 2026-06-27 msg 130/131/159/160]
last_updated: 2026-06-27
status: draft v0
confidence: provisional
---

# Low-Confidence: Gather & Reorg (Tier 1)

> **Stato**: draft v0. Cattura + riorganizzazione delle idee utente 2026-06-27 (Telegram msg 130, 131, 159/160). Skill metacognitiva del Tier 1 organization-first: cosa fa il modello **quando è poco confident**. Non ancora validata via grill-me.

---

## Catena di pensiero (why → problema → soluzione)

- **Why** `[EXTRACTED]` — Agire sotto bassa confidence è la sorgente primaria di errori e confabulazione: il modello che non sa, ma procede, **inventa** (numeri, API, riferimenti, intenzioni dell'utente). L'esempio reale (§policy) lo mostra: indovinare invece di chiedere ha prodotto una risposta plausibile ma sbagliata.
- **Problema** `[INFERRED]` — Non basta "sapere di non sapere": serve **ridurre l'incertezza al minor costo possibile** e capire *quale* strumento la riduce. Gather sbagliato (web search su una cosa che era nel repo, o viceversa) spreca turni e può consolidare un'ipotesi falsa.
- **Soluzione** `[EXTRACTED]` — Sequenza fissa: **STOP** (non agire) → **riorganizza il contesto** (task-list, note, regole, watch-list; chiudi il superfluo) → poi un **BIVIO**:
  - *have-lead → gather* — so dove guardare: `grep`/file-search per il codice, web search per l'esterno; leggi, poi agisci.
  - *no-lead → ASK* — non ho idea di dove guardare: **chiedi**, non indovinare. (Async → domanda non-bloccante, vedi [[_private/rules-tg-warn-before-blocking]].)

Il reorg precede il bivio di proposito: spesso riorganizzare ciò che già si ha **rivela il lead** (o rivela che l'info c'è già), evitando un gather/ask inutile. È [[_user-notes-2026-06-23]]-coerente con "osserva prima di agire".

---

## La policy (decision tree)

```
low-confidence detected
   │
   ├─ (a) REORG contesto: task-list, note, regole, watch-list → chiudi il superfluo
   │       └─ il lead emerge dal riordino? → spesso sì → procedi
   │
   ├─ (b) valuta: HO UN LEAD?
   │
   ├─ have-lead → GATHER con lo strumento giusto
   │       ├─ codice/repo  → grep / file-search → Read
   │       └─ esterno/infra → web search / fetch
   │
   └─ no-lead  → ASK (domanda mirata, una, specifica)
                 └─ utente async → NON-BLOCCANTE (warn-before-blocking)
```

**Caso reale `nv/wh` (anti-pattern di gather-cieco)** `[EXTRACTED]` — sigle `nv/wh` ignote. L'AI ha fatto **web search** e ha "indovinato" *Whispers* — risposta plausibile ma **falsa**: erano repo privati (NetView / WillHouse), non trovabili sul web per definizione. Lì il lead web **non esisteva** (no-lead reale) → la mossa corretta era **ASK** ("cosa sono `nv/wh`?"), non gather cieco. La web search ha *fabbricato* certezza dove serviva una domanda. Regola distillata: **no-lead non è un lead debole da forzare con lo strumento sbagliato** — è il segnale di passare al ramo ASK.

`[CRITICA]` Il giudizio "ho un lead?" è esso stesso una stima di confidence e può sbagliare (falso-lead, come `nv/wh`). Mitigazione: se un gather non converge in 1–2 tentativi mirati, **declassare a no-lead → ASK** invece di insistere. Il gather non è un loop illimitato.

---

## Reward / hack-check

- **Skill (outcome desiderato)**: ridurre l'incertezza *prima* di agire, con la mossa di costo minimo che cambia la decisione.
- **Hack A — over (paralisi)**: gather/ask **sempre**, anche quando la confidence è alta → turni sprecati, utente interrotto inutilmente, latenza. È il reward-hacking "partecipativo" (vedi [[reward-hacking-mitigation]]): premiare l'*atto* di gather/ask invece dell'esito.
- **Hack B — under (confabulazione)**: gather/ask **mai** → il modello procede e inventa. È il fallimento di default che la skill esiste per coprire.
- **Difesa**: reward **bilanciato** che penalizza *entrambi* gli estremi — sia l'azione-sotto-incertezza (B) sia l'over-asking/over-gathering (A).
- **Ground truth (ancora all'outcome, non alla partecipazione)** `[EXTRACTED]` — la domanda di verifica è: *l'info recuperata (o richiesta) era **necessaria** e ha **cambiato** la decisione?* Se gather/ask non ha mosso l'esito, era over. Se l'azione è stata presa senza l'info che poi serviva, era under. Niente reward per il gesto in sé.

---

## Linked

- [[scientific-method-operating-protocol]] — passo 1 "Observe/Awareness": osserva e prendi consapevolezza prima di agire (questa skill ne è il sotto-caso "bassa confidence").
- [[error-memo-system]] — errori da gather-cieco/azione-sotto-incertezza alimentano la memo (es. lezione `nv/wh`).
- [[agent-wrapper-vars-queue]] — le note/task-list/watch-list che il passo (a) riorganizza vivono qui.
- [[agent-constitution]] — **C8** "Dichiara incertezza: se non sai, dillo, non confabulare" (`agent-constitution.md:32`); C7 deferenza ai bivi ad alto impatto = il ramo ASK.
- `feedback_optimization_first` (memory) — reorg proattivo del contesto + low-confidence→gather; "ricordatelo sempre".
- [[_private/rules-tg-warn-before-blocking]] — il ramo ASK in modalità async dev'essere **non-bloccante** (warn before blocking).

> **Skill di training**: Area 4 (metacognition) per il riconoscimento bassa-confidence + bivio; Area 9 (communication / deference) per il ramo ASK. `[INFERRED]`

## Next
- Grill-me: definire la **soglia** di "bassa confidence" e il **budget** gather (max tentativi prima di declassare a ASK).
- Generare tracce di training: positive (reorg→lead→gather corretto; no-lead→ASK) e negative (`nv/wh` gather-cieco; over-asking su alta confidence).
- `/graphify --update`.

---
name: session-isolation-conversation-store
description: L'isolamento delle conversazioni nel conversation-store (ogni query è conv_id-scoped, verificato con prova) + il caveat aperto (get_conversation accetta un conv_id esplicito → read cross-sessione se l'id è noto). Decisione utente 2026-07-03: NON hardenare ora, tracciare come possibile problema multi-user.
type: concept
tags: [conversation-store, session-isolation, security, harness, get_conversation, multi-user, possible-problem]
sources:
  - harness/src/conversation-store.mjs
  - harness/.pi/extensions/conversation-capture.ts
  - harness/src/session-context.mjs
last_updated: 2026-07-03
---

# Isolamento sessioni nel conversation-store

> Origine: query utente (2026-07-03, sessione live `019f292b`) — "se apro due sessioni concorrenti e chiedo 'mostrami tutti i messaggi', prende solo i suoi o quelli di tutte?". Verificato con prova, poi decisione di tracciare (non hardenare).

## Fatto verificato [EXTRACTED]

Ogni sessione pi ha il **proprio `convId`** (`_conv_id:<sessionId>` in vars.db meta, via `resolveConvId` per-session — vedi `session-context.mjs`). **Ogni** metodo dello store filtra per `WHERE conv_id = ?`: `window`, `windowOldest`, `range`, `all`, `count`, `firstSeq`, `nthLastUserSeq`. `get_conversation` di default usa `getConvId()` (il convId della sessione corrente).

**→ Una sessione vede SOLO i propri messaggi.** Provato (`scratchpad/isolation-check.mjs`, 2026-07-03): 2 conv interleaved, seq GLOBALE alternato A=[1,3,5] B=[2,4]:
- `window(A)`/`windowOldest(A)`/`all(A)` → solo `[A1,A2,A3]`; `all(B)` → solo `[B1,B2]`.
- **Prova chiave**: `range(A, 1, 2)` → ritorna SOLO `[1:A1]`. Il seq `2` è di B ed è **dentro** il range richiesto, ma NON appare, perché la query è conv_id-scoped.

Il `seq` è un **autoincrement GLOBALE** (contatore condiviso tra sessioni) ma è solo un **ordinamento/id**, NON un vettore di mescolamento dati: ogni lettura resta scoperta per conv_id. (Il seq globale causava un bug ORTOGONALE — la conv non parte da seq 1 → `range=1..` falliva — risolto con `get_conversation(from_start=true)`, vedi commit `aac9b3f`.)

## Caveat aperto (possibile problema) [INFERRED]

`get_conversation` accetta un `conv_id` **esplicito** → una sessione *potrebbe* leggere la conversazione di un'ALTRA sessione **se ne conoscesse il convId** (formato `sess-<epoch>-startup`, **non esposto** al modello). Il parametro esplicito serve **legittimamente** ai subagent per le citazioni inter-agent (`{conv_id, range}`).

- **Rischio pratico attuale**: BASSO. Single-user; gli id delle altre sessioni non sono mostrati al modello; l'uso esplicito è intenzionale.
- **Quando diventerebbe un problema**: deployment **multi-user / multi-tenant**, dove un utente non deve poter leggere le conversazioni di un altro nemmeno conoscendone l'id.

## Decisione [EXTRACTED]

**2026-07-03 (utente):** NON implementare l'hardening ora. Il read via conv_id esplicito "è giusto che ci sia ed è utile" (inter-agent refs). **Tracciare come possibile problema** in wiki. Hardening futuro (se multi-user): allow-list dei convId che la sessione conosce legittimamente (il proprio + i ref ricevuti dai subagent), rifiutando conv_id arbitrari.

## Cross-ref

- Bug ortogonale risolto: `get_conversation from_start` (seq GLOBALE) — `wiki/todo.md` blocco batch-fix 019f292b.
- Design conversazione-per-ID: ADR `2026-06-29-context-as-first-person-mind` (principio 3).
- Principio: [[feedback_instrument_before_hypothesizing]] (la risposta "sei sicuro?" è stata data con una prova, non a parole).

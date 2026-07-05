---
name: stuck-state-focus-protocol
description: "Sintesi msg 1134 (utente): quando sei bloccato, NON iniettare un nudge (il rung è fallito, F9: aggiunge contesto → auto-sabotaggio H6) ma ENTRA IN FOCUS con summary (COMPRIME) + aim='decompone+identifica-errore' + protocollo d'indagine; usa note VOLATILI rolling + alza keepTurns quando serve memoria. Riorganizza rung/focus/note/keepTurns in un unico protocollo dello stato-bloccato + mismatch note-durevoli-vs-volatili da sistemare."
type: concept
tags: [metacognition, focus, stagnation, notes, keepturns, rung, h6, multi-agent, proposal, synthesis]
last_updated: 2026-07-05
status: proposal-under-evaluation
sources:
  - "Utente TG msg 1134 (2026-07-05): focus-mode come risposta al bloccato, aim=scomposizione+identificazione-errore, keepTurns su bisogno, note rolling volatili"
  - "Dato: rung efficacy A/B REFUTATA (F9, [[harness-experiment-log]])"
---

# Protocollo dello stato-BLOCCATO — focus (comprime) invece di nudge (diluisce)

> **Origine (utente msg 1134):** «quando ci sono tante cose e vedo che non ci sto riuscendo, isolo il problema → entro in
> FOCUS mode, che crea un SUMMARY di quello che stava succedendo e assegna l'AIM. Come aim: *scomposizione del problema e
> identificazione dell'errore*. Capisco chi/cosa coinvolge, gli attori in gioco, verifico che tutto sia corretto,
> riorganizzo i pensieri, poi delibero. Se mi serve tanto spazio di memoria, aumento il keepTurns.»

## 1. Perché questo È la fix del rung fallito (l'intuizione forte)

Il rung anti-fissazione è stato **REFUTATO** (F9: 0/5 vs 1/5, **+74% token**). La causa-radice: il rung, quando il modello
è bloccato, **INIETTA un nudge** → *aggiunge* contesto → **auto-sabotaggio H6** (più scaffolding diluisce il modello debole,
[[harness-experiment-log]] F7). Il nudge combatte la fissazione peggiorandone la causa.

**Il focus-mode dell'utente fa l'OPPOSTO: COMPRIME.** Entrando in focus si crea un **summary** (il contesto sprawling →
riassunto conciso) + si rebase-a il contesto ([[feedback_temporal_anchoring]]) → il **net-context SCENDE**. Invece di
aggiungere un promemoria a un contesto già diluito, si **ripulisce** il contesto e si riparte con un aim esplicito. Questo
attacca la fissazione E l'H6 insieme. **È strutturalmente superiore al nudge** — ed è il motivo per cui vale la pena provarlo
dove il rung ha fallito. (Il meccanismo di rilevamento della stagnazione che ho già costruito+validato — `src/anti-fixation.mjs`,
fire-log — è RIUSABILE: cambia solo la RISPOSTA, da "inietta nudge" a "entra/consiglia focus".)

## 2. Il protocollo (stato-bloccato → focus strutturato)

Trigger = **detector di stagnazione** (già costruito: passi-senza-progresso oltre soglia, [[concepts/anti-fixation-metacognition-rung]]).
Risposta = **entra in focus** con:
1. **SUMMARY** del "cosa stava succedendo" (comprime → anti-H6).
2. **AIM = "scomponi il problema + identifica l'errore"** (non "risolvi" — prima capisci).
3. **Protocollo d'indagine** (i passi umani dell'utente, teachable): (a) chi/cosa coinvolge, quali **attori** in gioco;
   (b) **verifica** che ogni parte (helper/assunzione/dato) sia corretta *in isolamento*; (c) **riorganizza** i pensieri;
   (d) solo allora **delibera** la soluzione. → è la versione *azionabile* del rung-2 ("questiona l'helper") che il nudge non riusciva a far eseguire.
4. **Leve di supporto**: alza **keepTurns** se l'indagine ha bisogno di working-memory (§4); usa le **note volatili** come scratchpad dell'indagine (§3).

> **Perché potrebbe funzionare dove il nudge no**: dà al modello debole una STRUTTURA (stato pulito + aim + checklist), non
> un promemoria da eseguire in un contesto diluito. ⚠️ Resta un'IPOTESI da A/B (il modello debole potrebbe comunque non
> eseguire l'indagine) — ma è una scommessa migliore, e MISURABILE: focus-on-stagnation vs plain sui task-fissazione.

## 3. Il mismatch NOTE (durevoli vs volatili) — un difetto di design reale [EXTRACTED dal codice]

L'utente (msg 1134): «le note servono per le cose VOLATILI… a fine turno salva nelle note, al più dopo le cancelli; c'è la
rolling window per cui le note recenti le vede sempre e le vecchie prima o poi spariscono». **Ma nel codice attuale è il
CONTRARIO**: `note()` salva un **fatto DUREVOLE** nella lane `<facts>` che *sopravvive alla rolling window E al compact*
(`vars-queue.ts:128`, `slm-scaffolding.mjs:35`). Non esiste una **note-scratchpad VOLATILE rolling**.

Quindi la concezione dell'utente non combacia con l'implementazione → **il modello non "usa le note per le cose volatili"
perché non c'è un layer volatile: `note` è durevole, e la rolling window (`<messages_with_user>`) è il DIALOGO, non uno
scratchpad che il modello scrive.** Proposta di riorganizzazione a **due layer espliciti**:
- **DUREVOLE** (`<facts>` / vars) = ciò che `note()`/`set_var` fanno OGGI: nome, preferenza, decisione, valore. Permanente, keyed, aggiornabile.
- **VOLATILE rolling scratchpad** (NUOVO o repurpose di `block_notes`) = ciò che l'utente intende per "note": stato dell'indagine
  in corso ("ho provato X, fallito perché Y", "sotto-parte Z aperta"). **Rolling**: le più recenti sempre visibili, le vecchie
  sfumano; il modello può **estendere la finestra** quando gli serve vedere più scratchpad (riusa il pattern `sliding-var` /
  `messagesWindowN` config). A fine-indagine si potano (o si **promuovono** a durevole quelle poche che contano).

Questo **completa il protocollo §2**: durante l'indagine il modello scrive nello scratchpad volatile (esternalizza il
ragionamento → libera working-memory), promuove a `<facts>` solo l'esito, pota il resto. È anche ciò che serviva
all'eviction-checkpoint (salva-prima-che-scrolli) e all'error-memo, oggi frammentati.

## 4. keepTurns come "dial" di working-memory (già esiste, va USATO)

`set_keepturns` (model-controlled, [[project_pi_launch_no_context_files|native-window]]) È GIÀ la leva che l'utente descrive
("se mi serve spazio, aumento il keepTurns"). Il gap non è il meccanismo, è che il modello debole **non lo alza da solo**.
→ nel protocollo §2, l'ingresso-in-focus può **suggerire** "se l'indagine è stateful, alza keepTurns" (situational-table,
[[concepts/anti-fixation-metacognition-rung]] §situational). Skill trainabile: distinguere "stateful→più memoria" da
"fissazione→step-back" (le due Cautele del keepTurns-control).

## 5. Multi-agente (coerenza con [[concepts/wave-scoped-focus]])

Il protocollo si innesta sulle **wave**: una wave che stagna → l'orchestratore (o il sub-agente) entra nel protocollo
stato-bloccato (summary + aim=decomponi). Lo scratchpad volatile è **per-agente** (non inquina gli altri); i `<facts>`
durevoli sono `shared` (cross-agent, già supportato da vars-queue scope 'shared'). Il **digest di fine-wave/fine-focus**
(già prodotto da `pop_focus`, `nested-compact.ts:73`) è il passaggio-di-stato pulito tra agenti → mitiga il rischio-amnesia
dei confini di wave ([[concepts/wave-scoped-focus]] §3).

## 6. Cosa ha senso, cosa no, su cosa agire (verdetto professionale)

| Thread (msg 1134) | Verdetto | Azione |
|---|---|---|
| Focus-as-stagnation-response (summary+aim=decomponi) | ✅ **SÌ, forte** — fixa il difetto del rung (comprime vs diluisce) | Prototipo: detector(già fatto)→enter_focus con aim preset; A/B vs plain vs rung sui task-fissazione |
| aim = "scomponi + identifica errore" + checklist attori/verifica | ✅ SÌ, teachable | Situational-table + preset dell'aim in focus; **classe-training** (regola #18) |
| keepTurns su bisogno | ✅ già esiste | Nudge d'uso nel protocollo + skill; niente da costruire |
| Note = volatili rolling + facts durevoli separati | ✅ SÌ — **difetto di design reale** | Split a due layer: scratchpad volatile (nuovo/`block_notes`) + `<facts>` durevole (attuale); rolling+estendibile |
| Note splittate per priorità (fisse) | ❌ scartata (dall'utente stesso) | I durevoli sono già `<facts>` con `importance`; non serve un terzo layer |

**Non spedire per fede** (regola #14, come per il rung): sono proposte da **prototipare + A/B**. Il grande vantaggio: la
domanda misurabile ("il protocollo focus-stato-bloccato migliora i task-fissazione riducendo i token vs rung/plain?") è
diretta, e il detector + l'infra focus/note esistono già → prototipo economico. E se funziona, **è la classe-training** che
insegna al modello a fare da sé ciò che oggi scaffoldiamo.

## 7. Prossimi passi (ordinati)
1. **Prototipo focus-on-stagnation** (riusa il detector; risposta = enter_focus con aim preset + summary invece del nudge). A/B vs plain vs rung-nudge sui task-fissazione (flash-lite + un modello capace).
2. **Split note a due layer** (volatile rolling scratchpad + durevole `<facts>`); wiring in context-assembly + slm-scaffolding awareness.
3. **Golden with/without-hint** dei 4 transfer (utente ha dato l'ok) → training della disciplina assumption-audit.
4. Situational-table: righe "stagnazione→focus+decomponi" e "stateful→alza keepTurns", ognuna OUTCOME-validata (non hard-coded).

## Links
[[concepts/anti-fixation-metacognition-rung]] · [[concepts/wave-scoped-focus]] · [[concepts/adaptive-context-injection]] · [[harness-experiment-log]] · [[feedback_temporal_anchoring]] · [[concepts/verification-discipline-training]] · [[feedback_intelligence_gap_to_training_class]]

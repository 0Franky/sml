---
name: persist-salient-facts
description: Skill — riconoscere un fatto DUREVOLE (nome/soprannome/preferenza/decisione/valore) e salvarlo con set_var PRIMA che scrolli fuori dalla finestra rolling, poi richiamarlo al momento giusto. Meccanismo = F-harness (set_var + <vars> + get_var), decisione = S (trained). Reward ancorato all'esito (fatto richiamato correttamente N turni dopo), mai alla cerimonia.
type: concept
tags: [skill, memory, persistence, context-window, set_var, training-vs-harness, reward-hacking, amnesia, testbook]
sources:
  - utente TG msg 866/867 (2026-07-03) — "tutto ciò che dico io o lui svanisce al turno successivo → deve usare lo strumento note per salvarsi le info"
  - utente TG msg 869/870 (2026-07-03) — "fargli capire QUALI svaniranno (i più vecchi, in cima) + dargli contesto, è un ambiente nuovo; procedi con la skill"
last_updated: 2026-07-03
---

# Persist salient facts — skill (durable-worthy → set_var → recall)

> **In una riga**: il modello vive in una finestra **rolling** che dimentica i turni più vecchi; deve riconoscere i fatti che **devono durare** e salvarli in un **datastore durevole** (`set_var`) prima che scrollino via, poi richiamarli quando servono.

## Catena why → problema → soluzione (load-bearing, regola #10)

- **Why (ambiente nuovo)**: l'harness dà al modello **un turno per volta**; la storia sta nelle lane, e `<messages_with_user>` è una **finestra rolling** (con `nativeKeepTurns=6` gli ultimi 6 turni-utente sono nativi, i più vecchi finiscono nella lane e poi **cadono**). Il modello — è un ambiente nuovo, nessuno gliel'ha detto — **non conosce il proprio modello di memoria**.
- **Problema**: un fatto durevole citato **presto** (es. il soprannome che l'utente ti dà al turno 1) **scrolla fuori** dalla finestra → al turno N il modello non ce l'ha più in context → **amnesia** sul richiamo (osservato live 2026-07-03: "la giacca in frascript non si ricordava il mio soprannome", msg 867).
- **Soluzione**: (i) l'harness **spiega** al modello, nell'awareness `<how_memory_works>`, **quali** item svaniscono (i più vecchi, in cima alla lane) e **come** salvarli; (ii) il modello **riconosce** che un fatto è durevole e lo **salva subito** — un **fatto narrativo** da rileggere (nome/soprannome/preferenza/decisione) con **`note`** (lane `<facts>` inline), un **valore strutturato** da riferire/interpolare con **`set_var`** (lane `<vars>`) — prima dell'eviction; (iii) lo **richiama** al momento giusto (già inline nella lane, o `get_var`). L'awareness dà il **floor** anche senza training; il training affina *riconoscimento* + *timing*.

## Decomposizione + classificazione (regola #11)

| Metà | Cosa | Asse | Stato-senza-training |
|---|---|---|---|
| **Meccanismo** | **`note`** → fatti narrativi durevoli, lane `<facts>` INLINE bounded (cap, ordine per importanza stabile) + `remove_note`; **`set_var`** → valori strutturati, lane `<vars>` (cap 12) + `get_var`; entrambi sopravvivono rolling-window **e** compact; mutabili+versionati via **change-log** (no git-patch) | **F-harness** (deterministico, **implementato** `vars-queue.ts`/`.mjs` + `context-assembler.mjs` `factsLaneLines`) | **PIENA** — i tool persistono/richiamano a prescindere dal modello |
| **Awareness** | `<how_memory_works>` spiega *quali* item evictano (oldest/top-of-lane) + *come* salvare; description di `set_var` menziona il caso-memoria | **F-harness** (prompt statico, gated `laneMemoryHint`) | **PIENA** — floor sempre presente |
| **Decisione** | riconoscere che un fatto è **durevole** (nome/soprannome/preferenza/decisione/valore) + salvarlo **prima** dell'eviction + **richiamarlo** al momento giusto; NON persistere spazzatura effimera (proporzionalità) | **S** (trained) | **DEGRADATA-MA-UTILE** — col floor-awareness il modello stock può già farlo; il training affina riconoscimento+timing e taglia l'over-persist |

**Non è un guscio inerte** (anti regola #11): il meccanismo F funziona sempre e l'awareness dà un floor reale — l'esperimento ollama (2026-07-03) mostra che il 9B **legge** bene istruzioni chiare in posizione nativa/utente. Il training non è prerequisito per l'utilità, la aumenta.

## Affordance: `note` (fatti) vs `set_var` (valori) + posizione cache-friendly (utente msg 876/878/880)

Due affordance per **forma** diversa di conoscenza (non "una sola"):
- **`note(text, key?, importance?)`** — un **fatto narrativo** che serve solo **RILEGGERE** (soprannome, preferenza, decisione). Reso **INLINE** nella lane `<facts>`: "conoscenza già pronta", **zero recall**. `key` opzionale per **aggiornare/deduplicare** (ri-chiamare `note` con la stessa key = update in-place); `remove_note(key)` per **rimuovere**. Namespace `fact` **silent** (audit nel change-log, fuori da `recent_changes`).
- **`set_var(id, value)`** — un **valore strutturato** che si **riferisce/aggiorna/interpola** (token-id, contatore, path). Reso in `<vars>`, richiamato per `id`.
- **Perché non solo `set_var`** (msg 876): la var impone al modello di **inventare un id ora e ricordarlo dopo** = id-coordination, un punto di fallimento per un 9B. La `note` in linguaggio naturale non ha id da coordinare (la key è opzionale e mostrata inline). Meno macchinario = meno errori ([[feedback_clear_instructions_over_patches]]). Il **costo** è simmetrico in scrittura; il risparmio della nota è in **lettura** (nessun `get_var`).

**Git-patch al file dei memo — VALUTATO e SCARTATO** (msg 880): produrre git-patch da un 9B è fragile ed è *più* macchinario, contro il senso della feature. Il **change-log** del vars-queue dà già **storia/audit** di ogni modifica (timestamp + who + old→new) → mutabilità **e** versioning **senza** patch.

**Posizione per max cache-hit** (prompt/KV-cache = prefix-based; utente "importanza/efficacia >>> cache-hit"):
- Il **prefisso STABILE** (rules, awareness, schemi tool) resta **primo** — mai infilarci i fatti (una scrittura azzererebbe la cache del prefisso).
- `<facts>` va nella **zona volatile ACCANTO a `<vars>`** (stessa cadenza: cambia solo su `note`/`remove_note`) e **PRIMA** dei blocchi per-turno (`recent_changes`/`current_time`/chat) → nei turni **senza** scrittura i byte-fatti restano nel prefisso cacheato.
- La lane **NON renderizza l'età** (un "Ns ago" cambierebbe ogni turno → cache-miss): è **byte-stabile** finché non si scrive un fatto. L'ordine è per **importanza stabile** (pinned in cima), non per timestamp volatile — così l'importanza domina, coerente col vincolo utente.
- **Tradeoff onesto** (= aim-in-coda): la cache vuole i fatti presto, l'attenzione del 9B legge meglio la FINE → se il live-test mostra che li perde, **non** spostarli in fondo (uccide la cache) ma aggiungere una **riga-puntatore in coda** ("i tuoi fatti sono in `<facts>`").
- **Costo permanente**: inline-sempre = token di context ogni turno → **CAP obbligatorio** (default 12) + segnale `+N, consolida` (mai scarto silenzioso); i fatti sono **pochi e durevoli** per natura.

## Layered memory (complementare al raise keepTurns)

Due difese **stratificate**, non alternative:
- **Finestra nativa** (`nativeKeepTurns=6`, fix amnesia 2026-07-03) = memoria **a breve**: gli ultimi 6 turni-utente sono dove il 9B legge davvero. Copre il richiamo ravvicinato **senza** che il modello faccia nulla.
- **`note`/`<facts>` + `set_var`/`<vars>`** = memoria **a lungo**: per ciò che deve durare **oltre** quei 6 turni (e oltre il compact). Qui il modello deve **agire** (riconoscere+salvare). `<facts>` è INLINE bounded → i fatti restano "pronti" senza recall anche a lungo termine.

Il raise da solo non basta: un soprannome dato al turno 1 e richiamato al turno 20 esce comunque dalla finestra → serve la persistenza. Le due cose insieme coprono breve **e** lungo termine.

## Reward — OUTCOME-anchored (regola #10 + [[feedback_reward_hacking_principle]])

- **Premia l'ESITO**: il fatto è **richiamato correttamente N turni dopo**, quando il turno che lo menzionava è già **scrollato fuori** dalla finestra nativa. A/B vs vanilla (senza persist): vanilla **fallisce** il richiamo differito, con-skill **passa** → il **delta** misura il valore.
- **MAI la cerimonia**: aver "chiamato `set_var`" NON è reward (participation-hack). Un `set_var` con valore sbagliato, o un richiamo che cita la var ma risponde male, non vanno premiati.
- **Anti over-persist (cry-wolf)**: held-out negativo — contenuto **effimero/irrilevante** (un calcolo intermedio, un dettaglio usa-e-getta) **non** va persistito. Salvare tutto è un fallimento di proporzionalità, non un successo. Reward solo dove il fatto è **davvero** durevole-e-riutilizzato.
- **Ancoraggio del richiamo**: il richiamo conta se è **verificato** (il valore richiamato == il valore reale salvato), non se il modello "dice di ricordare".

## Verifica → [[model-testbook]] TB-16

Probe soprannome: turno 1 "chiamami <nick>"; riempi la finestra oltre `nativeKeepTurns`; turno N "come mi chiami?". ✅ = nick corretto (via `set_var`→`get_var`, outcome) · ❌ = amnesia o confabulazione. Held-out negativo: dettaglio effimero → NON persistito.

## Link

- [[concepts/agent-wrapper-vars-queue]] (meccanismo `set_var`/`<vars>`/change-log) · [[concepts/context-limits-explained]] (finestra, position-bias, effective-context)
- [[concepts/training-vs-harness-classification]] (playbook regola #11) · [[feedback_reward_hacking_principle]] (reward sull'esito) · [[feedback_temporal_anchoring]] (shift `[+Xs]`, ordine autoritativo)
- [[model-testbook]] TB-16 · [[decisions/2026-06-29-context-as-first-person-mind]] (context = mente in prima persona) · [[todo]]
- Amnesia fix (raise `nativeKeepTurns` 1→6, 2026-07-03) — layered con questa skill.

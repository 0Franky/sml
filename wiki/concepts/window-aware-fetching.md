---
name: window-aware-fetching
description: Capability F+S — il modello riconosce i marker di troncamento/cap/finestra nel <context> ((+N nascosti), <notes count=N>) e RECUPERA proattivamente gli item nascosti quando il task lo richiede, senza over-fetchare. F=l'harness emette il segnale + i tool di fetch; S=il modello impara recognize-signal→decide-se-fetchare. Idea utente msg 388 (2026-06-29).
type: concept
tags: [harness, context-window, training-vs-harness, gather, proportionality, reward, F+S]
sources:
  - harness/src/context-assembler.mjs
  - harness/src/vars-queue.mjs
last_updated: 2026-06-29
---

# Window-aware fetching

> **Catena why → problema → soluzione** (load-bearing).
> **Why**: per tenere il `<context>` **bounded** su sessioni lunghe, l'harness *windowa/cappa* le lane ad alto-volume (vars, recent_changes, task_list) ed *esclude* le note/memo dal flusso ([[cross-session-state-sharing]], fix 2026-06-29). Senza limiti il contesto esplode.
> **Problema**: se nascondi/cappi qualcosa **senza segnalarlo, il modello non sa che esiste e non lo cerca** → perdita d'informazione silenziosa (critica utente msg 388). E se lo segnali ma il modello non ha la *skill* di reagire al segnale, il segnale è inerte.
> **Soluzione a due metà (F+S)**: (F) l'harness **segnala SEMPRE** il troncamento + offre i tool di fetch; (S) il modello impara a **riconoscere il segnale e recuperare gli item nascosti quando — e solo quando — il task lo richiede**.

## La capability

Di fronte a un `<context>` che contiene un marker di troncamento/finestra, il modello:
1. **lo nota** come segnale ("c'è altro non mostrato qui");
2. **decide se serve** per il task corrente (proporzionalità: non sempre serve);
3. se serve, **chiama il tool di fetch giusto** (`get_shared_view` per le vars, `list_tasks` per i task, `get_changelog` per la storia, `recall_lessons` per le note/memo, `sliding_var_read` per una var grande);
4. **NON over-fetcha** quando il task è già risolvibile con ciò che è in vista.

## La metà F (harness) — FATTA 2026-06-29

L'harness emette i segnali in modo consistente (`context-assembler.mjs`, `vars-queue.mjs`):
- `<vars>` cappata alle 12 più recenti → `(+N più vecchie nascoste — usa get_shared_view)`.
- `<task_list>` cappata → `(+N task aperti non mostrati — usa list_tasks)`.
- `<recent_changes>` finestra+cap → `(+altri cambi più vecchi o oltre la finestra — usa get_changelog)`.
- note/memo escluse dal flusso (silent) ma **segnalate**: `<notes count=N>… usa recall_lessons</notes>`.
- var grandi: [[sliding-window-variable-tool]] (`sliding_var_read` per char-range) — leggi una slice on-fly senza scaricare tutto.

→ il segnale + il tool esistono a giorno-1 (F-harness). Vedi [[wrapper-context-assembly-example]] / [[harness-capabilities-as-files]] (il pattern temp-read: apri on-fly → usa → chiudi).

## La metà S (training) — DA ADDESTRARE

Il segnale è inerte se il modello non ha la skill. Va addestrata la **decisione**: *riconosci il marker → giudica se gli item nascosti sono rilevanti al task → fetcha (mirato) o procedi*. È **S** perché è un comportamento, non un file-path. Stato-senza-training: **DEGRADATA-MA-UTILE** (un fallback harness può auto-espandere certe lane su trigger ovvi, ma over-fetcha o manca i casi sottili). Classificazione completa: [[training-vs-harness-classification]].

## Reward design (outcome-anchored, anti-hack)

- **Outcome-anchored, NON cerimonia**: il reward NON è "ha chiamato un fetch", ma **l'esito**: il fetch ha portato un'informazione che ha **cambiato/corretto la decisione** (osservabile: la risposta usa un item che era nascosto e che era *necessario*), oppure il *non*-fetch era corretto (il task non richiedeva gli item nascosti). Twin-pair come in [[low-confidence-gather-and-reorg]] (EVPI): coppia gemella dove gli item nascosti **cambiano** l'esito vs dove **non** lo cambiano → reward = "il fetch ha cambiato la decisione".
- **Doppia penalità simmetrica** (anti cry-wolf, come l'area-02): **missed-fetch** (il task richiedeva un item nascosto, il modello ha agito su info incompleta → errore) **E** **over-fetch** (ha scaricato tutto "per sicurezza" senza che servisse → spreco di contesto/token, l'opposto del bounding). [[hierarchical-decomposition|proporzionalità]].
- **Hack-check**: (a) *fetch-then-ignore* — chiama il tool ma non usa il risultato per "sembrare diligente" → azzerato (lo scorer verifica che l'item recuperato sia *usato* nella decisione, non solo richiesto). (b) *over-fetch-as-default* — fetchare sempre → penalizzato come l'over-defer di 6.2. Scorer = trace+outcome (l'item nascosto è stato recuperato **e** ha inciso), non il testo.
- **Held-out bilanciato**: task che **richiedono** un item nascosto (fetch atteso) vs task risolvibili con la vista corrente (no-fetch atteso) → il reward premia il **discriminare**, non il fetchare.

## Dove vive (gold)

Foglia gold candidata (Area 4 — context/metacognition, o Area 2 se inquadrata come pre-flight "ho l'info completa?"). Riusa: il twin-pair EVPI di [[low-confidence-gather-and-reorg]], il pattern temp-read di [[harness-capabilities-as-files]], la disciplina situational di [[situational-policy-table]] ("SE vedo marker-troncamento E il task tocca quella lane → fetch"). Marker `[V]/[A]/[?]` + observe/orient/plan/verify.

## Collegamenti
- [[cross-session-state-sharing]] — il windowing/cap che genera i marker (fix 2026-06-29).
- [[sliding-window-variable-tool]] · [[harness-capabilities-as-files]] — il fetch on-fly (temp-read) di var/capacità grandi.
- [[low-confidence-gather-and-reorg]] — il twin-pair EVPI per il reward (l'info ha cambiato la decisione?).
- [[situational-policy-table]] — la regola "SE marker X → azione fetch Y".
- [[training-vs-harness-classification]] — F (segnale+tool) vs S (decisione di fetch).
- [[wrapper-context-assembly-example]] — come il `<context>` è assemblato e windowed.

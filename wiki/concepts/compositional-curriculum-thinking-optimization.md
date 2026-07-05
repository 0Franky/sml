---
name: compositional-curriculum-thinking-optimization
description: "Analisi proposta utente msg 1140: (A) curriculum RL a SKILL ISOLATE (gathering→implementazione→scrivere-test→eseguire), ciascuna allenata a competenza, poi COMPOSTE a finestra scorrevole (1+2, 2+3, … poi 1+2+3, …) fino alla lane completa; (B) THINKING-OPTIMIZATION progressiva: catene lunghe-ma-perfette mentre impara, poi compresse (dritto alla soluzione) quando la traccia è internalizzata. Verdetto: SENSATO + allineato a H6/verification-discipline/curriculum, con guardrail (reward per-skill ancorato al downstream, replay anti-forgetting, gate di competenza, PRM per la coerenza-catena, compressione outcome-gated)."
type: concept
tags: [training, curriculum, rl, composition, thinking-optimization, cot-compression, prm, catastrophic-forgetting, h6, proposal, phase-3]
last_updated: 2026-07-05
status: proposal-under-evaluation
sources:
  - "Utente TG msg 1140 (2026-07-05): curriculum a skill isolate + composizione a finestra scorrevole + thinking-optimization progressiva"
  - "Estende l'idea utente pre-esistente: [[project_post_training_strategy|curriculum SFT staged 4 fasi]]"
---

# Curriculum composizionale a skill isolate + thinking-optimization progressiva

> **Origine (utente msg 1140).** Due idee intrecciate: **(A)** allenare in RL ogni competenza ISOLATA (gathering →
> implementazione → scrivere test → eseguire/verificare), iterando finché ciascuna è buona; poi COMPORLE a finestra
> scorrevole (step1+2, 2+3, 3+4; poi 1+2+3, 2+3+4; … fino alla lane completa). **(B)** Mentre impara i pezzi isolati,
> catene di pensiero LUNGHE ma **perfette** (ogni passo corretto/coerente, nessun pensiero fuorviante) — è giusto
> scomporre ai minimi termini. Ma quando ricompone i pezzi, la traccia è già interiorizzata → **ottimizzare**: togliere
> i pensieri superflui, andare dritto alla soluzione (es. da "osservo i numeri… ah sono positivi e negativi… verifico
> ipotesi…" a "noto che la lista ha positivi e negativi; la mia prima ipotesi forte da validare è…").

## Verdetto in una riga
**Sì, ha senso e può portare miglioramento reale** — è curriculum learning + decomposizione-di-skill + reasoning-compression,
tutti fondati in letteratura E allineati ai NOSTRI risultati (H6, verification-discipline, catastrophic-forgetting). Il valore
è reale **a condizione dei guardrail** sotto; senza, ciascuna metà ha un fallimento-modo noto (proxy-hack, forgetting,
compressione-che-rompe). Non spedire per fede: prototipare su 2 skill e MISURARE (composizione + forgetting).

## Parte A — curriculum a skill isolate → composizione

### Perché è fondato
- **Curriculum learning** (facile→difficile) accelera la convergenza; comporre gradualmente è uno schedule di shaping.
- **Credit assignment**: allenare l'INTERA lane end-to-end da zero dà reward SPARSO — quale sotto-skill ha fallito? L'isolamento
  dà **segnale denso per-skill** (impari il gathering col suo reward, non attraverso 4 hop rumorosi).
- **Allineamento col progetto**: è l'identità di Tier-1 ([[project_base_model_intelligence]] = decomporre/operare) e la
  tassonomia ha già `gathering` come foglia; i passi 3-4 (scrivi-test, esegui-verifica) SONO la [[verification-discipline-training]] (già costruita).
- Estende la tua idea pre-esistente [[project_post_training_strategy|curriculum SFT staged 4 fasi]]: qui in **RL** + con **composizione esplicita**.

### Guardrail (senza, fallisce)
1. **Reward per-skill ANCORATO AL DOWNSTREAM, non a una cerimonia** ([[feedback_reward_hacking_principle]]). Il rischio del
   gathering-isolato: il modello impara "gathering che fa punteggio" (es. "ha raccolto N file") ma inutile a valle. Reward corretto
   = *il contesto raccolto ABILITA un'implementazione corretta* (misurato a valle), non un conteggio. Vale per ogni skill isolata.
2. **Replay anti-forgetting** ([[catastrophic-forgetting]]). RL-are lo skill-2 degrada lo skill-1 (problema classico). La tua
   ricomposizione (1+2, poi 1+2+3) È già una forma di replay — **buon istinto** — ma va resa esplicita con **ratio di mixing**
   (una quota di task del vecchio skill in ogni stage nuovo), altrimenti la finestra scorrevole "2+3" può erodere lo skill-1.
3. **Gate di competenza per-skill** = quando "gathering è buono abbastanza"? Serve un **eval per-skill** (held-out) con soglia,
   non un giudizio a occhio. → è la **matrice task×competenza** che proponi: costruiscila come *scaffold di eval* (righe=task,
   colonne=skill, celle=pass-rate) → misura competenza per-skill E rileva regressioni durante la composizione. Vale la pena.

## Parte B — thinking-optimization progressiva

### Perché è fondato (e allineato a NOI)
- È **reasoning-length optimization / concise-CoT**, direzione di ricerca attuale (l'"overthinking" spreca token E può NUOCERE).
  Combacia **direttamente con H6** ([[harness-experiment-log]] F7): il verboso DILUISCE il modello piccolo → comprimere la catena
  una volta interiorizzata è la versione-training del nostro finding-harness.
- Ricetta a **due stadi** (impara-lungo-verificato → distilla-corto) è il pattern noto di reasoning-distillation. La tua intuizione
  fine — *lungo va bene MENTRE impara la traccia, corto DOPO che l'ha interiorizzata* — è un **curriculum sul ragionamento stesso**.

### Guardrail (senza, fallisce)
1. **Nello stadio LUNGO, premia la COERENZA della catena, non solo la risposta finale.** La tua richiesta "nessun pensiero
   fuorviante, catena perfetta" è cruciale e coincide col nostro anchoring anti-reward-hacking (CLAUDE.md #10): una catena lunga
   piena di svolte sbagliate che *per caso* arriva alla risposta NON va premiata. Serve verifica **step-level** (PRM / ogni passo
   ancorato a un tool-call/artefatto — l'estensione del check `[V]`). ⚠️ Il PRM è costoso e gameable → ancorare, non fidarsi.
2. **La compressione DEVE essere outcome-gated**: "più corto" premiato **SOLO se l'accuratezza si mantiene** (reward = corretto AND
   corto; MAI corto-a-scapito-di-corretto). Altrimenti il modello taglia passi che gli servono (falsa economia, droppa il
   load-bearing). E comprimere **troppo presto** (prima dell'interiorizzazione) fa regredire → comprimi solo quando l'accuratezza
   dello skill isolato è in **plateau alto** (di nuovo il gate di competenza).

### Il tuo esempio, formalizzato
- Stadio-lungo (esplorativo, mentre impara): *"osservo i numeri → sono positivi e negativi → mi serve un metodo che regga entrambi
  → verifico ipotesi H1… H2…"* — OK **se ogni passo è corretto e ancorato**.
- Stadio-corto (dopo interiorizzazione): *"la lista ha positivi e negativi; prima ipotesi forte da validare: {metodo sign-safe}"* —
  stessa conclusione, zero passi morti. Premiato **solo se** risolve ancora (outcome-gated).
> NB: la classe #145/sign-wrap (F11) è proprio un caso dove la catena-corretta è *"noto i negativi → uso un helper sign-safe →
> lo TESTO in isolamento"*. La thinking-opt qui = arrivare a quell'ipotesi senza i 15 turni di permutazione della superficie.

## Come si incastra con l'harness (multi-agente)
- Le skill isolate mappano su **fasi/sub-agenti** che già scaffoldiamo (gathering ↔ `get_execution_order`/focus; verifica ↔
  verifier-sandbox). L'harness scaffolda ORA la sequenza; il training la **interiorizza** stage-by-stage → col progredire del
  training si può **ridurre lo scaffold** (meno hint) — misurabile con l'A/B vanilla-vs-ours (se il training funziona, il gap si chiude).
- La compressione-catena riduce i token → allevia H6 → potenzialmente rende lo scaffold verboso meno dannoso (o non-necessario).

## Verdetto & primo test (proporzionale)
**Vale la pena.** Non è teoria vaga: è la **struttura del curriculum di Phase-3**, con ganci concreti a ciò che già abbiamo. Primo
esperimento minimo (prima di impegnarsi sulla lane intera): **2 skill** (es. gathering + implementazione) su un dominio piccolo →
(a) RL isolato di ciascuna con reward downstream-anchored; (b) compone 1+2 con replay; (c) **misura**: 1+2 migliora vs end-to-end-da-zero?
lo skill-1 regredisce dopo lo skill-2 (forgetting)? → se sì, i guardrail 2/3 sono necessari, e lo sai coi numeri. Poi thinking-opt
come stadio DEDICATO dopo il plateau, con reward outcome-gated. Costruire prima la **matrice task×competenza** (eval scaffold) è il prerequisito.

## Open questions
- Confini di skill: dove finisce "gathering" e inizia "implementazione"? (i confini netti non esistono nei pipeline reali → il reward downstream li rende meno rigidi).
- PRM: costruirne uno o approssimare la coerenza-catena con ancoraggio-a-tool-call (più economico, meno gameable)?
- Ratio di replay ottimale per stage: da calibrare empiricamente (come il 10% coding-replay di Tier-1, [[project_replay_strategy]]).

## Links
[[verification-discipline-training]] · [[harness-experiment-log]] (H6/F7, F11) · [[catastrophic-forgetting]] · [[project_post_training_strategy]] · [[project_replay_strategy]] · [[stuck-state-focus-protocol]] · [[gold-example-transfer-assumption-audit]] · [[feedback_reward_hacking_principle]] · [[feedback_intelligence_gap_to_training_class]]

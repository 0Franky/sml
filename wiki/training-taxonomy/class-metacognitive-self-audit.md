---
name: class-metacognitive-self-audit
description: Classe-PADRE (radice) di training — auditare il PROPRIO ragionamento/stato-cognitivo contro il ground-truth invece di fidarsi del primo-passo. Cinque figlie: audit-del-progresso (stagnation-recovery), audit-delle-assunzioni (transfer-assumption-audit), audit-coerenza-mezzi-fini (consequence-intention-conflict), audit-della-provenienza / RECALL (confabulation-retrieval-failure), memoria-prospettica / SAVE (prospective-memory). Gerarchia obbligatoria (regola #20).
type: training-class
tags: [reasoning, metacognition, self-audit, anti-reward-hacking, area-03, area-04, parent-class, held-out]
last_updated: 2026-07-05
---

# Classe-PADRE (radice) — METACOGNITIVE SELF-AUDIT

> **Ruolo**: nodo-radice della gerarchia di training per la **metacognizione**. Regola #20 (utente msg 1195): le classi si costruiscono SEMPRE gerarchiche (padre→figlia) e una figlia si specializza ulteriormente quando lo merita. Questo è il padre che unifica cinque skill di "audit del proprio ragionamento/stato-cognitivo" emerse separatamente (dai filoni #145, F16, F23).
> **Origine**: le tre figlie nascono da modi-di-fallimento reali del modello (o miei) — vedi [[../harness-experiment-log]] (F14) + [[../feedback_intelligence_gap_to_training_class]].

## La skill-RADICE (livello padre)

**Gap comune**: il modello (e a volte io) si fida del **primo-passo / della superficie** del proprio ragionamento — un'assunzione, un progresso apparente, un'azione plausibile — senza **auditarlo contro il ground-truth**. È la STESSA filosofia dell'anti-reward-hacking ([[../feedback_reward_hacking_principle]]): non fidarti della presentazione, àncora alla verità verificabile — applicata qui al **proprio processo cognitivo** invece che al reward.

**Skill radice** (imparata una volta, condivisa dalle figlie): **sospendere la fiducia nel proprio output/stato intermedio e verificarlo** contro un riferimento oggettivo (l'oracolo, l'esito reale, il vincolo, i limiti della propria memoria). Le figlie sono gli OGGETTI di questo audit.

**Perché padre + figlie** (regola #20): le tre skill condividono il trigger metacognitivo ("fermati e verifica te stesso") — impararlo UNA volta e poi specializzare *cosa* auditare (i) evita segnale ridondante, (ii) riflette la relazione reale (sono facce dello stesso muscolo), (iii) è composizionale ([[../concepts/compositional-curriculum-thinking-optimization]]).

## Le cinque figlie (cosa si audita)

| Figlia | Oggetto dell'audit | Trigger | Doc |
|---|---|---|---|
| **audit del PROGRESSO** | "sto facendo progressi o sono bloccato/thrashing?" | stagnazione, N tentativi falliti, anomalia non risolta | [[class-stagnation-recovery]] (già padre a sua volta: A focus-decompose · B jot-ipotesi) |
| **audit delle ASSUNZIONI** | "l'assunzione load-bearing è giusta? (es. `abs()` è davvero corretto qui?)" | risultato che contraddice un esempio/atteso | [[gold-example-transfer-assumption-audit]] (#145 held-out) |
| **audit della COERENZA mezzi-fini** | "l'azione serve davvero l'intenzione, o la contraddice (auto-sconfiggente)?" | prima di committare un'azione non banale | [[class-consequence-intention-conflict]] |
| **audit della PROVENIENZA (RECALL)** | "questo dato ce l'ho DAVVERO, o lo sto inventando?" | recupero fallito / richiesta di un fatto specifico incerto | [[class-confabulation-retrieval-failure]] (F16 held-out) |
| **memoria PROSPETTICA (SAVE)** | "questa info mi servirà oltre la finestra? → la salvo ORA prima di perderla" | info con rilevanza futura in uscita dal contesto | [[class-prospective-memory]] (F23 held-out; gemella-SAVE di confabulation-retrieval) |

> `stagnation-recovery` è già essa stessa un padre (specializzazione ricorsiva, regola #20): dimostra il pattern annidato che la regola prevede.

## Reward (condiviso, ANCORATO all'OUTCOME)

Ogni figlia premia l'**esito** (problema risolto / assunzione corretta scoperta / azione coerente scelta) verificato da un oracolo, **MAI la cerimonia** dell'audit ("mi fermo e verifico…" a parole → 0). L'audit è una strategia *dimostrata* (SFT) + RL sull'outcome; il segnale è la correlazione audit↔successo, non il conteggio degli audit. Vedi [[../feedback_reward_hacking_principle]] + CLAUDE.md #10.

## Label-generation (delegata alle figlie)

Ogni figlia ha i propri generatori (i disguised di [[class-sign-wrap-blindspot]] inducono stagnazione; le mutation di [[../../harness/verifiers/deceptive-task-gen]] per assunzioni/coerenza). Il transfer di OGNI figlia è **cross-dominio obbligatorio** (regola #19, [[../feedback_transfer_always_cross_domain]]) — non solo software.

## Hack-check (condiviso)

- **Cerimonia** ("ho auditato / mi sono fermato a verificare" senza cambiare l'esito) → 0.
- **Over-audit** (auditare all'infinito senza concludere, o bocciare cose sane per lucrare il segnale) → neutralizzato: l'oracolo premia il *raggiungimento dell'obiettivo*, non l'atto di auditare.
- **Decontaminazione**: le istanze osservate (#145, il pre-flight) restano **held-out** → misurano il transfer, non la memorizzazione.

## Links
[[class-stagnation-recovery]] · [[gold-example-transfer-assumption-audit]] · [[class-consequence-intention-conflict]] · [[class-confabulation-retrieval-failure]] · [[class-prospective-memory]] · [[../concepts/compositional-curriculum-thinking-optimization]] · [[area-03-reasoning-scientific-method]] · [[area-04-context-metacognition]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]]

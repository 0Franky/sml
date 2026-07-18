---
name: class-metacognitive-self-audit
description: Classe-PADRE (radice) di training — auditare il PROPRIO ragionamento/stato-cognitivo contro il ground-truth invece di fidarsi del primo-passo. Figlie: audit-del-progresso (stagnation-recovery), audit-delle-assunzioni (transfer-assumption-audit), audit-coerenza-mezzi-fini (consequence-intention-conflict), audit-della-provenienza / RECALL (confabulation-retrieval-failure), memoria-prospettica / SAVE (prospective-memory), audit-presa-in-carico (instruction-phase-clarification), audit-impulso-esecutivo / fedeltà (instruction-fidelity-no-overreach), audit-della-PORTATA-DELLO-STRUMENTO (instrument-epistemic-reach, nodo intermedio a sua volta padre di 2). RE-HOME 2026-07-11: audit-integrità-della-verifica (independent-verification-integrity) spostata alla radice-sorella ground-truth-integrity (cross-link, resta parente per la faccetta provenienza-dell'audit). RE-HOME 2026-07-18: tool-perception-fidelity NON è più figlia diretta — è scesa di un livello sotto il nuovo nodo intermedio instrument-epistemic-reach (resta NIPOTE). Gerarchia obbligatoria (regola #20). ⚠️ Reciprocità della tabella-figlie ANCORA ROTTA: 6 classi dichiarano questo padre e non sono elencate (§Reciprocità).
type: training-class
tags: [reasoning, metacognition, self-audit, anti-reward-hacking, area-03, area-04, parent-class, held-out]
last_updated: 2026-07-18
---

# Classe-PADRE (radice) — METACOGNITIVE SELF-AUDIT

> **Ruolo**: nodo-radice della famiglia **SELF-AUDIT** — *auditare il proprio ragionamento/stato-cognitivo contro il ground-truth*. È **una delle radici-sorelle della metacognizione** (gemella orizzontale di [[class-situational-awareness]] OUTWARD e [[class-ground-truth-integrity]] integrità-verifica), **NON l'ombrello dell'intera metacognizione**: un super-padre "metacognizione" sopra queste sorelle sarebbe un nodo-vuoto senza skill-radice propria, vietato da #20 — **confermato dall'analisi-gap multi-agente del 2026-07-11** (67 candidati, 0 gap-super-padre sopravvissuti; la relazione INWARD↔OUTWARD è già data dal twin-link, non da un ombrello). Regola #20 (utente msg 1195): classi SEMPRE gerarchiche (padre→figlia), specializzazione ricorsiva. Questo padre unifica le skill di "audit del proprio ragionamento" emerse separatamente (#145, F16, F23 + mining Stage-2 #2/#6).
> **Origine**: le tre figlie nascono da modi-di-fallimento reali del modello (o miei) — vedi [[../harness-experiment-log]] (F14) + [[../feedback_intelligence_gap_to_training_class]].
> **Radici-sorelle di livello** (cross-link orizzontale, NON padre/figlia — 3 radici della regione): [[class-situational-awareness]] (asse **interno↔esterno**: qui àudito il mio **ragionamento** INWARD, lì modello la mia **situazione** OUTWARD; compongono — la memoria-prospettica qui richiede la harness-awareness lì) · [[class-ground-truth-integrity]] (asse **audita-il-tuo-ragionamento ↔ non-corrompere-la-verifica-verso/da-altri**: qui verifico il MIO processo, lì rispetto il CANALE di verifica). Le tre radici sono unite dal **twin-link**, MAI da un ombrello (#20).

## La skill-RADICE (livello padre)

**Gap comune**: il modello (e a volte io) si fida del **primo-passo / della superficie** del proprio ragionamento — un'assunzione, un progresso apparente, un'azione plausibile — senza **auditarlo contro il ground-truth**. È la STESSA filosofia dell'anti-reward-hacking ([[../feedback_reward_hacking_principle]]): non fidarti della presentazione, àncora alla verità verificabile — applicata qui al **proprio processo cognitivo** invece che al reward.

**Skill radice** (imparata una volta, condivisa dalle figlie): **sospendere la fiducia nel proprio output/stato intermedio e verificarlo** contro un riferimento oggettivo (l'oracolo, l'esito reale, il vincolo, i limiti della propria memoria). Le figlie sono gli OGGETTI di questo audit.

**Perché padre + figlie** (regola #20): le tre skill condividono il trigger metacognitivo ("fermati e verifica te stesso") — impararlo UNA volta e poi specializzare *cosa* auditare (i) evita segnale ridondante, (ii) riflette la relazione reale (sono facce dello stesso muscolo), (iii) è composizionale ([[../concepts/compositional-curriculum-thinking-optimization]]).

## Le figlie (cosa si audita)

| Figlia | Oggetto dell'audit | Trigger | Doc |
|---|---|---|---|
| **audit del PROGRESSO** | "sto facendo progressi o sono bloccato/thrashing?" | stagnazione, N tentativi falliti, anomalia non risolta | [[class-stagnation-recovery]] (già padre a sua volta: A focus-decompose · B jot-ipotesi) |
| **audit delle ASSUNZIONI** | "l'assunzione load-bearing è giusta? (es. `abs()` è davvero corretto qui?)" | risultato che contraddice un esempio/atteso | [[gold-example-transfer-assumption-audit]] (#145 held-out) |
| **audit della COERENZA mezzi-fini** | "l'azione serve davvero l'intenzione, o la contraddice (auto-sconfiggente)?" | prima di committare un'azione non banale | [[class-consequence-intention-conflict]] |
| **audit della PROVENIENZA (RECALL)** | "questo dato ce l'ho DAVVERO, o lo sto inventando?" | recupero fallito / richiesta di un fatto specifico incerto | [[class-confabulation-retrieval-failure]] (F16 held-out) |
| **memoria PROSPETTICA (SAVE)** | "questa info mi servirà oltre la finestra? → la salvo ORA prima di perderla" | info con rilevanza futura in uscita dal contesto | [[class-prospective-memory]] (F23+F33 held-out; gemella-SAVE di confabulation-retrieval; caso-duro actionable-vs-arbitrary) |
| **audit della PRESA-IN-CARICO** | "ho abbastanza per procedere / quale mossa conversazionale?" | ricezione di una richiesta (ambigua/chiara/incompleta) | [[class-instruction-phase-clarification]] (msg 1317) |
| **audit dell'IMPULSO-ESECUTIVO (fedeltà)** | "sto facendo ESATTAMENTE ciò che è chiesto, o aggiungo/tolgo?" | esecuzione di una spec precisa | [[class-instruction-fidelity-no-overreach]] (mining #6; twin di instruction-phase-clarification, asse ambiguo↔preciso) |
| **audit dell'ONESTÀ-ESECUTIVA sotto difficoltà** | "sto svalutando/mollando in silenzio perché è difficile? → forethought + AVVISA l'utente" | task duro / rischio-fallimento / voglia-di-mollare | [[class-effort-honesty-under-difficulty]] (gap *forethought* dal completeness-critic 2026-07-11; **figlia CEMENTATA** — ratificata utente; sorella di instruction-fidelity; nucleo: mai la strada-facile in silenzio) |
| **audit dello STATO-DICHIARATO (task-tracking)** | "le mie etichette `task_list`/`status`/`current_aim` sono VERE nel trace, o mi fido di ciò che ho scritto?" | bookkeeping del task-tracking (granularità + status/aim), **incondizionato** (senza difficoltà) | [[class-task-granularity-and-state-sync]] (F35/C9, T3; **PROPOSTA — attende ratifica #26**; confini netti vs effort-honesty/subgoal-hijacks/stagnation nel §Confini della figlia) |
| **audit della PORTATA DELLO STRUMENTO** 🆕 | "questo strumento può *in linea di principio* rispondere alla domanda che ho? «non lo vedo» ≠ «non c'è»" | sto per convertire il risultato di uno strumento — **specie un negativo** — in una conclusione sul mondo | [[class-instrument-epistemic-reach]] (**nodo INTERMEDIO, padre a sua volta**: (a) [[class-tool-perception-fidelity]] risoluzione · (b) [[class-static-dynamic-evidence-modality]] modalità. **PROPOSTA** — struttura ratificata 2026-07-16, testo no #26) |

> **RE-HOME 2026-07-11 (#34 — capacità SPOSTATA, non persa)**: l'ex-8ª figlia *audit-dell'INTEGRITÀ-DELLA-VERIFICA* ([[class-independent-verification-integrity]]) è stata **spostata** alla radice-sorella [[class-ground-truth-integrity]], di cui è la direzione **CONTROLLORE** (speculare all'anti-manomissione [[class-evaluation-integrity]]). **Resta cross-linkata** qui per la faccetta genuina "audit della provenienza del proprio ground-truth di verifica" (parente di [[class-confabulation-retrieval-failure]]). Nulla è perso: l'analisi-gap ha confermato che il suo muscolo-radice è *"non-corrompere-la-verifica"*, non *"audita-il-tuo-ragionamento"* → ha solo trovato il padre giusto.
> `stagnation-recovery` è già essa stessa un padre (specializzazione ricorsiva, regola #20); anche `consequence-intention-conflict` è ora padre → figlia [[class-anticipation-and-irreversibility]] (anticipo/irreversibilità, mining #16); e da oggi anche `instrument-epistemic-reach`, che nasce **già** come padre a 2.

> **RE-HOME 2026-07-18 (#34 — capacità SCESA DI UN LIVELLO, non persa)**: [[class-tool-perception-fidelity]] **non è più figlia diretta**. È diventata la **figlia (a)** del nuovo nodo intermedio [[class-instrument-epistemic-reach]] → resta **nipote**, nulla è rimosso, nessun esempio o oracolo toccato. **Perché**: dichiarava una *torsione* rispetto a questa radice (l'audit è sullo **strumento**, non sul ragionamento) — e stava per arrivare una **seconda** classe con la **stessa** torsione (statico/dinamico). Due figlie con la stessa torsione appese qui = la torsione imparata **due volte** e un padre che **non nomina l'asse** che le unisce. Il nodo intermedio la fa imparare **una volta**. **Struttura ratificata dall'utente il 2026-07-16** (*"sono d'accordo"*, opzione 2); il testo dei file nuovi **non** è ratificato (#26).

## ⚠️ Reciprocità della tabella-figlie — ROTTA, quantificata, NON peggiorata

> **Stato al 2026-07-18** (verificato eseguendo `grep` sui `class-*.md` di `wiki/training-taxonomy/`, non a memoria). La roadmap la registrava come *"il padre più rotto è la radice del centro"* (`wiki/roadmap-2026-07-16.md`) — il fix meccanico **non è ancora stato fatto**, e questo passo **non lo fa** (fuori mandato, #28): lo **rende visibile e contabile**, che è la precondizione perché qualcuno lo chiuda.

**Elencate in tabella**: **10** (9 preesistenti + `instrument-epistemic-reach`).
**Classi che dichiarano questo padre e NON sono in tabella**: **6** — reciprocità in **entrata sì, uscita no**.

| Classe che si dichiara figlia | Dove lo dichiara | Nota |
|---|---|---|
| [[class-attentional-scope-exit]] | frontmatter + §Ruolo | audit dello **scope attenzionale**; il gap-report la assegnava esplicitamente qui |
| [[class-durable-knowledge-retraction]] | frontmatter + §Ruolo | **terza gemella** della famiglia-memoria (SAVE/RECALL/**RETRACT**) — le altre due *sono* in tabella: l'assenza è particolarmente incoerente |
| [[class-utterance-provenance-audit]] | frontmatter + §Ruolo | audit dell'**autore** dell'enunciato; si dichiara *"l'oggetto mancante"* dell'enumerazione del padre |
| [[class-scope-adaptive-knowledge-aggregation]] | §Padre | audit dell'assunzione-di-**scope** |
| [[class-requirements-driven-tree-navigation]] | §Padre | audit dell'assunzione-di-**profondità/rigore** |
| [[class-domain-categorization-routing]] | §Padre + §Links | audit del **TIPO** di problema |

⚠️ **Non le ho aggiunte alla tabella**, e la ragione non è pigrizia: aggiungerle sarebbe **ratificare 6
placement che non ho auditato** (le ultime tre condividono un sospetto — *"audit di un'assunzione"* è un
ombrello largo, e tre figlie che dicono la stessa cosa in tre modi sono il sintomo di una **sotto-famiglia
mancante**, non di tre righe mancanti). Metterle in tabella cementerebbe in silenzio una struttura che va
**decisa**, non sbrigata (#26/#30). → **decisione all'utente**; nel frattempo il numero è **contato e
nominato** invece di essere un *"11/44"* aggregato in una roadmap.

## Reward (condiviso, ANCORATO all'OUTCOME)

Ogni figlia premia l'**esito** (problema risolto / assunzione corretta scoperta / azione coerente scelta) verificato da un oracolo, **MAI la cerimonia** dell'audit ("mi fermo e verifico…" a parole → 0). L'audit è una strategia *dimostrata* (SFT) + RL sull'outcome; il segnale è la correlazione audit↔successo, non il conteggio degli audit. Vedi [[../feedback_reward_hacking_principle]] + CLAUDE.md #10.

## Label-generation (delegata alle figlie)

Ogni figlia ha i propri generatori (i disguised di [[class-sign-wrap-blindspot]] inducono stagnazione; le mutation di [[../../harness/verifiers/deceptive-task-gen]] per assunzioni/coerenza). Il transfer di OGNI figlia è **cross-dominio obbligatorio** (regola #19, [[../feedback_transfer_always_cross_domain]]) — non solo software.

## Hack-check (condiviso)

- **Cerimonia** ("ho auditato / mi sono fermato a verificare" senza cambiare l'esito) → 0.
- **Over-audit** (auditare all'infinito senza concludere, o bocciare cose sane per lucrare il segnale) → neutralizzato: l'oracolo premia il *raggiungimento dell'obiettivo*, non l'atto di auditare.
- **Decontaminazione**: le istanze osservate (#145, il pre-flight) restano **held-out** → misurano il transfer, non la memorizzazione.

## Links
[[class-instrument-epistemic-reach]] (**figlia — nodo intermedio, padre a sua volta di** [[class-tool-perception-fidelity]] **e** [[class-static-dynamic-evidence-modality]]; **PROPOSTA #26**) · [[class-situational-awareness]] (gemello-OUTWARD) · [[class-stagnation-recovery]] · [[gold-example-transfer-assumption-audit]] · [[class-consequence-intention-conflict]] · [[class-confabulation-retrieval-failure]] · [[class-prospective-memory]] · [[class-instruction-phase-clarification]] · [[class-instruction-fidelity-no-overreach]] · [[class-effort-honesty-under-difficulty]] (figlia — onestà-esecutiva sotto difficoltà, forethought) · [[class-task-granularity-and-state-sync]] (figlia — audit dello stato-dichiarato del task-tracking; **PROPOSTA #26**) · [[class-ground-truth-integrity]] (radice-sorella; ex-figlia independent-verification RE-HOMED lì) · [[class-independent-verification-integrity]] (ora figlia di ground-truth-integrity; cross-link per provenienza-audit) · [[class-domain-categorization-routing]] · [[../concepts/compositional-curriculum-thinking-optimization]] · [[area-03-reasoning-scientific-method]] · [[area-04-context-metacognition]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_transfer_always_cross_domain]]

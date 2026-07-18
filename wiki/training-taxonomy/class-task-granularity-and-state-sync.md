---
name: class-task-granularity-and-state-sync
description: Classe di training (figlia della radice-AUDIT metacognitive-self-audit) — AUDIT dello STATO-DICHIARATO del task-tracking (task_list / status / current_aim) contro la verita-di-completamento del trace. Due facce - (a) GRANULARITA - definisci ogni task per un CRITERIO verificabile (ne troppo grosso da non-verificare, ne micro-frammentato); (b) STATE-SYNC bidirezionale - le etichette todo/in_progress/done e il current_aim devono corrispondere a cio che le azioni hanno DAVVERO fatto (ne over-claim done su criterio non-soddisfatto, ne under-claim su criterio soddisfatto, ne aim che punta a un task diverso da quello che le azioni avanzano). Nucleo differenziante - INCONDIZIONATO (scatta senza difficolta, a differenza di effort-honesty che e difficolta->degrado) + BOOKKEEPING interno dello stato (a differenza di subgoal-hijacks che e report-del-mezzo-al-posto-della-risposta a response-time verso l'utente). Reward - branch-field-trap-safe (#32) - il confine DONE (criterio hard trace-verificabile) e l'aim-sync si grondano per-esempio; il confine soft todo<->in_progress va al segnale DISTRIBUZIONALE (held-out + ECE), MAI oracolo per-esempio.
type: training-class
parent: class-metacognitive-self-audit
tags: [reasoning, metacognition, self-audit, task-tracking, state-sync, granularity, bookkeeping, anti-reward-hacking, area-01, area-04, child-class, held-out]
last_updated: 2026-07-11
---

# Classe (figlia) — TASK-GRANULARITY & STATE-SYNC (audit dello stato-dichiarato del task-tracking)

> **Ruolo**: figlia della radice-AUDIT [[class-metacognitive-self-audit]] — è l'**audit dello STATO-DICHIARATO**: il modello mantiene un task-tracking (`task_list` / `status` / `current_aim`) e deve auditarlo contro la **verità-di-completamento** ricostruibile dal trace, invece di fidarsi delle etichette che ha scritto. È la STESSA skill-radice ("sospendi la fiducia nel tuo output intermedio e verificalo contro il ground-truth") applicata all'**oggetto = il registro-di-stato che tieni tu**.
> **Origine + provenance (#18/#26)**: convergenza **C9** della design-review multi-modello **F35** ([[../harness-experiment-log]], 2026-07-11): 3 modelli capaci indipendenti (deepseek-v4-pro, sonnet-5, qwen3-32b) hanno segnalato *"granularità-task grossa + aim↔lavoro non sincronizzati (`in_progress` ma l'ultima azione è una READ)"* usando le lane reali. Registrata come training-insight **T3** (task-granularity & aim-sync). **PROPOSTA — attende ok utente (#18)**: filata come figlia della radice-AUDIT dopo il review-loop (verdetto `needs-fixes` → questa revisione); **NON ancora ratificata** dall'utente (regola #26: proposta ≠ approvazione).
> **Padre**: [[class-metacognitive-self-audit]] (radice-AUDIT, asse INWARD). Le altre figlie auditano il *progresso* (stagnation), le *assunzioni* (transfer-assumption), la *provenienza* (confabulation), l'*onestà-sotto-difficoltà* (effort-honesty); questa audita il **registro-di-stato** che il modello stesso tiene. Vedi §Confini per la differenziazione esplicita dalle sorelle sovrapponibili.

## Il gap

Il modello (o un base-model come utilizzatore-finale) tiene un task-tracking ma **lo lascia divergere dalla realtà** su tre assi:

1. **Granularità sbagliata** — task **troppo grossi** ("implementa il modulo"), non definiti da un criterio verificabile → nessuno (nemmeno lui) può dire *quando* sono fatti; oppure (speculare) **micro-frammentati** su banalità.
2. **State-sync rotto (bidirezionale)** — le etichette non corrispondono al lavoro reale: **over** (`done` su un criterio non soddisfatto; `in_progress` mentre l'ultima azione non tocca quel task) **e under** (un task il cui criterio È soddisfatto lasciato `todo`/`in_progress`).
3. **Aim-desync** — `current_aim = task X` ma le ultime azioni avanzano un **task diverso** (o nessuno) — l'osservazione canonica di C9: *`in_progress` ma l'ultima azione è una READ estranea*.

Radice comune (con la radice-AUDIT): il modello **si fida delle etichette che ha scritto** invece di verificarle contro ciò che il trace mostra davvero. Non è un problema di difficoltà né di comunicazione verso l'utente — è **bookkeeping interno disallineato**.

## La skill-target (segnale, preciso e falsificabile)

Prima di lasciare invariato il proprio task-tracking (o di dichiarare uno stato), il modello **riconcilia le etichette con il trace**:
- **(a) granularità**: ogni task è definito da un **criterio di completamento verificabile** (`config.js contiene parseConfig`, `i test di modulo passano`, `l'endpoint risponde 200`) — non un blob senza criterio, non un frammento inutile;
- **(b) status-sync**: `done` sse il criterio è **soddisfatto nel trace**; un criterio soddisfatto NON resta `todo`/`in_progress` (under-claim); un task senza lavoro reale non è `in_progress`;
- **(c) aim-sync**: `current_aim` = il task che le **ultime azioni avanzano davvero** — con **tolleranza** per il legittimo *planning-ahead* (subito dopo aver chiuso `t1`, `aim=t2` è corretto anche se le azioni-di-`t2` non sono ancora iniziate).

**Falsificabile**: le etichette dichiarate coincidono (entro tolleranza) con la verità-di-completamento ricostruibile dal trace, oppure no. Non si premia "ho aggiornato la task-list" (participation) — si premia che lo **stato dichiarato sia VERO**.

**Nucleo differenziante** (perché è una skill genuina, non ridondante — vedi §Confini):
- **INCONDIZIONATO**: scatta **senza** difficoltà (≠ [[class-effort-honesty-under-difficulty]], che è *difficoltà → degrado-in-silenzio*). Qui l'errore è sloppy-bookkeeping su task anche banali.
- **BOOKKEEPING interno dello stato, bidirezionale** (over **E** under su status/aim/task_list) — ≠ [[class-subgoal-hijacks-task]], che è *report-del-mezzo-al-posto-della-risposta* a **response-time verso l'utente**. Qui l'oggetto è il **registro-di-stato**, non la risposta dovuta.
- **Faccia DECOMPOSIZIONE-per-criterio-verificabile** — la granularità (a) non esiste in nessuna sorella.

**Classificazione training-vs-harness** ([[../concepts/training-vs-harness-classification]], CLAUDE.md #11): **S puro** — giudizio metacognitivo sullo stato-dichiarato-vs-trace. L'harness fornisce la **struttura** della lane `<task_list>` (pinnata/persistente/ordinata, F) ma NON il giudizio "le mie etichette sono vere?"; **stato-senza-training = DEGRADATO** (F35/C9 lo mostra su modelli *capaci* che tengono `in_progress` disallineato). Doppio scopo (#18): la lane scaffolda ORA lo stato; il training internalizza il **riflesso di riconciliazione**. Coerente con #33 (riusa il meccanismo esistente `task_list`, addestra lo skill — nessuna lane nuova).

## Esempi POSITIVI (cross-dominio — regola #19; dal banale al sistemico)

> Logica astratta unica: *lo stato che DICHIARI deve corrispondere a ciò che hai DAVVERO fatto, e ogni unità dev'essere definita da un criterio verificabile — riconcilia, non fidarti delle etichette.*

- **[A · software/tech, held-out generalizzato]** task `implementa parseConfig` con criterio `config.js esporta parseConfig e i test passano`; il trace mostra solo una READ di `config.js` → gold: lascia `in_progress`/`todo` (criterio NON soddisfatto), `current_aim` = questo task **solo se** le azioni successive lo avanzano; se l'ultima azione è una READ estranea → riallinea l'aim al task realmente toccato. Marca `done` **solo** quando la funzione esiste e i test sono verdi nel trace.
- **[B · project management]** una feature è nel report di stato; il ticket dice `shipped` ma il branch è ancora un **draft PR non-merged** → gold: stato = `in_progress` (criterio-ship = merged+deployed **non** soddisfatto), non `done`. Decomponi "spedisci la feature" in sotto-task con criteri (code-merged / deployed / smoke-test-verde).
- **[C · sanità/operations]** cartella paziente marcata `dimesso` mentre il record mostra solo `ricoverato, esami in corso` → gold: stato = `ricoverato`, il criterio-dimissione (referto firmato + terapia conclusa) non è soddisfatto → **non** anticipare l'etichetta.
- **[D · finanza/policy]** status-report di progetto marca una milestone `consegnata` mentre i deliverable oggettivi (documento approvato, fondi erogati) non risultano → gold: `in corso`; il criterio di consegna è verificabile e non è soddisfatto → riporta lo stato vero, non quello desiderato.
- **[E · vita quotidiana, banale]** to-do "annaffiare le piante": criterio = tutte annaffiate; ne hai fatte 2 su 5 → resta `in_progress`, non `done`. **Under-symmetry**: se le hai annaffiate **tutte** ma la voce è ancora `todo` → aggiornala a `done` (l'under-claim è un errore quanto l'over-claim).
- **[F · relazioni/impegni personali]** hai promesso "organizzo io la cena"; `current_focus` = quel task ma le tue ultime azioni sono state prenotare un viaggio (task diverso) → riallinea l'aim a ciò che stai davvero facendo, e non spuntare "cena organizzata" finché ristorante+inviti (il criterio) non ci sono.

## Esempi NEGATIVI (regola #21 — il CONFINE: quando la skill NON scatta / la risposta corretta è l'opposto)

I negativi rendono il segnale discriminativo (anti over-tracking / anti micro-frammentazione / anti-desync-ceremony):

- **[N1 · under-claim = errore quanto l'over-claim]** un task il cui criterio È soddisfatto nel trace ma lasciato `in_progress`/`todo` → FAIL: lo state-sync è **bidirezionale**, non solo "non gonfiare done". Chi impara solo "non marcare done troppo presto" fallisce qui.
- **[N2 · planning-ahead legittimo — NON è aim-desync]** subito dopo aver chiuso `t1`, `current_aim = t2` mentre le azioni-di-`t2` non sono ancora partite → **CORRETTO** (proiezione intenzionale, non disallineamento). L'oracolo aim-sync deve **tollerare** la finestra di transizione: penalizzare qui = over-trigger.
- **[N3 · task atomico correttamente grosso]** "rinomina la variabile `x` in `count`" è **un'unità atomica**: decomporla in 4 sotto-task è **over-decomposition** (rumore) → NON scatta la granularità. La skill è *criterio-verificabile per unità sensata*, non "spezza sempre".
- **[N4 · stato correttamente `in_progress`]** un task con lavoro reale in corso e criterio non ancora soddisfatto, etichettato `in_progress` → è **giusto così**: nessuna riconciliazione da fare. Bocciarlo per lucrare "ho trovato un disallineamento" = cerimonia penalizzata.
- **[N5 · aim su task lento legittimo]** `current_aim = build in corso` mentre l'ultima azione è un `poll` dello stato-build (azione **che serve** quel task) → NON è desync: il poll avanza il task. Il discriminante è *l'azione avanza il task dell'aim?*, non *l'azione è identica al task?*.
- **[N6 · granularità grossa quando manca il criterio a monte]** in fase esplorativa genuina ("capisci perché il test è flaky") un criterio netto non è ancora derivabile → un task-ombrello con **sub-criterio "formula un'ipotesi verificabile"** è corretto; forzare una decomposizione fittizia = falso-lavoro. (Compone con [[class-stagnation-recovery]] per lo stuck.)

> N1 copre la direzione **under**; N2/N5 coprono la **tolleranza aim** (planning-ahead / azione-di-supporto); N3/N6 coprono l'**over-decomposition**; N4 copre lo **stato-già-giusto**. Nessun default fisso ("marca-sempre-todo", "spezza-sempre", "aim=ultima-azione") deve vincere.

## Reward — 3 SEGNALI, branch-field-trap-safe (#10 · #32)

> ⚠️ **Trappola ramo≈campo (#32)**: l'**etichetta di status** (`todo`/`in_progress`/`done`) È il ramo. Va grondato per-esempio SOLO ciò che è un **INPUT trace-verificabile** (un vero *fatto* del trace), MAI il determinante-soft del ramo.

- **① OUTCOME (dominante, per-esempio SOLO sui confini HARD trace-verificabili)** — la fixture conosce, per costruzione, il **criterio-di-completamento** di ogni task e **quale task ogni azione avanza**. Si gronda per-esempio contro l'oracolo:
  - **(i) confine DONE** — `done` sse il criterio è **soddisfatto nel trace** (`config.js contiene parseConfig`, `test verdi`): confine **hard e verificabile dal trace** → grondarlo per-esempio è legittimo (è grondare un **input** — il fatto-del-trace "criterio soddisfatto?" — non una decisione soft; analogo a `[V]` ancorato a una tool-call reale).
  - **(ii) aim-sync** — quale task le **ultime azioni** avanzano davvero è **trace-verificabile** → grondabile per-esempio, **con tolleranza** per il planning-ahead (N2) e per le azioni-di-supporto (N5): la finestra di transizione e i poll non contano come desync.
  - **(iii) over/under-claim NETTI** — `done`-su-criterio-non-soddisfatto (over) e criterio-soddisfatto-lasciato-aperto (under) sono entrambi verificabili dal trace → grondati per-esempio e **simmetrici**.
- **② CORRETTEZZA-DEI-PASSI (co-pilota, dove c'è oracolo)** — **MCQ-controfattuale** ([[../concepts/discriminative-mcq-hard-distractors]]): flippa il trace (aggiungi/rimuovi l'azione che soddisfa il criterio, o l'azione che avanza il task) → l'etichetta-corretta cambia → si premia solo la **lettera** (deterministica), mai la prosa "ho riconciliato lo stato…". Chi ha una regola-fissa ("marca sempre in_progress") sceglie uguale al flip → sbugiardato. Valida il *ragionamento di riconciliazione* senza premiare la cerimonia. Posizione randomizzata ([[../concepts/position-answer-randomization]]).
- **③ TRANSFER (anti-scorciatoia)** — reward diretto sulle **varianti held-out cross-dominio**: chi ha imparato la *logica di riconciliazione* la applica su PM/sanità/finanza/quotidiano; chi ha un cue-di-superficie del dominio-software fallisce fuori. È anche la metrica di successo.
- **⚠️ Confine SOFT → segnale DISTRIBUZIONALE, MAI per-esempio (#32)**: il confine **`todo` ↔ `in_progress`** dipende da *"è iniziato lavoro sostanziale?"* — un giudizio **soft** che **≈ determina quel ramo**. Grondarlo per-esempio contro un oracolo/annotazione **re-introduce il reward-sul-ramo** (branch-field-trap). → questo confine si valuta **SOLO distribuzionalmente**: held-out **bilanciato** (task appena-iniziati vs non-iniziati in ~parti uguali) + **tolleranza/ECE** sulla calibrazione, mai un oracolo per-esempio. **Un limite onesto (over/under coerente, preso distribuzionalmente) batte un oracolo-finto** che riporta il branch-reward. **Test applicato**: *"gronda un INPUT (criterio-soddisfatto nel trace) o la DECISIONE soft (è-abbastanza-iniziato)?"* → il primo per-esempio, il secondo distribuzionale.

**Hack-check**:
- **Cerimonia** ("ho riconciliato lo stato / verificato l'aim" senza che l'etichetta finale sia vera) → 0.
- **Over-tracking / over-decomposition** (frammentare o "trovare disallineamenti" su stati sani per lucrare il segnale) → N3/N4 negativi + reward sul *raggiungimento dello stato-vero*, non sull'atto di riconciliare.
- **Default fisso** ("marca-sempre-todo" pesca gli over-claim ma sbaglia N1/N4; "aim=ultima-azione" sbaglia N2/N5) → neutralizzato dalla **simmetria** (over↔under) e dalla **tolleranza** (planning-ahead / azioni-di-supporto).
- **Measure-then-declare**: N/A qui (nessun valore da pre-misurare — l'oracolo confronta etichette-dichiarate col trace verifier-side).
- **Scorer ≠ scored**: l'oracolo-status è verifier-owned; il modello non grada sé stesso.

## Label-generation (mutation/oracle — fixture SELF-CONTAINED, veri-per-costruzione #22)

- **Generatore (oracolo strutturale, riusa [[../../harness/verifiers/async-schedule-gen]] pattern)**: fixture = `(lista-task con criterio-verificabile per ciascuno, trace-di-azioni, ground-truth per-task {criterio-soddisfatto? ∈ sì/no dal trace} + {task-avanzato-da-ogni-azione})`. Tutto **self-contained**: il criterio e l'effetto-di-ogni-azione sono dati per costruzione → si testa il **ragionamento di riconciliazione**, non il recall di fatti del mondo (#22). L'oracolo grada le etichette dichiarate: done↔criterio, aim↔task-avanzato (con tolleranza), over/under netti.
- **Mutation trap-`done` (riusa [[../../harness/verifiers/deceptive-task-gen]])**: da `(task, criterio, trace-che-soddisfa)` genera il **trace-mutante che NON soddisfa** il criterio (rimuove l'azione load-bearing, o la sostituisce con una READ estranea = il pattern-C9) → l'anti-gold è marcarlo `done`/tenere l'aim lì. La deceptiveness è **eseguita, non assunta**: si verifica che il criterio davvero fallisce sul mutante.
- **MCQ-controfattuale (segnale ②)**: coppie minimal-pair = stesso task, due trace che differiscono per la **sola** azione-che-soddisfa-il-criterio (o che-avanza-il-task) → la lettera-corretta flippa. One-correct, distrattori style-matched dai failure-mode reali (in_progress-disallineato, done-anticipato, aim-su-READ-estranea), posizione randomizzata + audit distractor-tell.
- **Bilanciamento (#21)**: over-claim / under-claim / aim-desync / **stati-già-corretti (N4)** / **planning-ahead (N2)** / **atomico-non-decomporre (N3)** in ~parti uguali, sui gruppi A/B/C/D/E/F. Il confine soft `todo↔in_progress` è generato come **split held-out bilanciato** (appena-iniziato vs non-iniziato) per il segnale distribuzionale, **non** con label per-esempio premiata.

## Decontaminazione (regola #18)

L'**istanza osservata** — il dump F35/C9 (`in_progress` con ultima-azione-READ + granularità grossa, qwen3-32b/sonnet/deepseek sulle lane reali) — resta **held-out di validazione**, MAI nel training (train-on-test contaminerebbe il validation set). Il training usa i transfer §positivi/§negativi su **domini disgiunti** (PM/sanità/finanza/quotidiano/relazioni). Se il modello impara la riconciliazione-stato, a valle risolve l'istanza-C9 **per transfer** (l'harness `task_list` scaffolda ORA lo stato → il modello lo tiene VERO da sé, doppio-scopo #18).

## Coherence-audit (playbook §5)

1. Struttura sezioni ✓ · 2. Reward outcome-anchored a **3 segnali** (①esito hard-trace + ②MCQ-controfattuale + ③transfer) + **#32-safe** (soft-boundary→distribuzionale) + hack-check + simmetria ✓ · 3. Home area-01/04 + **padre = radice-AUDIT [[class-metacognitive-self-audit]]** (proposto, attende ratifica #26) ✓ · 4. Fixture self-contained + istanza-C9 held-out/decontaminata ✓ · 5. Transfer A/B/C/D/E/F cross-dominio (software/PM/sanità/finanza/quotidiano/relazioni), banale→sistemico (#19) ✓ · 6. Negativi N1-N6 (under + planning-ahead + atomico + stato-giusto + azione-supporto + esplorazione) + reward simmetrico ✓ · 7. Integrità fattuale (fixture veri-per-costruzione, nessun fatto-del-mondo inventato) ✓ · 8. **Confini netti** (vedi §Confini): vs effort-honesty (incondizionato ≠ difficoltà→degrado) · vs subgoal-hijacks (bookkeeping-interno ≠ report-mezzo-a-response-time) · vs evaluation-integrity (audita il TUO stato ≠ non-corrompere un valutatore esterno) · vs stagnation-recovery (stato-vs-trace ≠ stuck→recover) ✓ · 9. Wiring: padre-tabella + registry §6 + index + todo(T3) + area-01/04 + log ⏳ (vedi wiring-notes) · 10. Caveat nuovo → playbook §4 (branch-field-trap sul confine soft di status) ⏳.

## Confini (differenziazione esplicita — anti-ridondanza #20/§coerenza)

| Sorella | Cosa fa lei | Cosa fa QUESTA classe | Discriminante |
|---|---|---|---|
| [[class-effort-honesty-under-difficulty]] (N3 over-claim) | difficoltà → degrada/over-claim **in silenzio** | riconcilia lo stato **a prescindere dalla difficoltà** | **INCONDIZIONATO** vs *trigger=difficoltà*. L'over-claim-done qui è sloppy-bookkeeping su task anche banali; lì è la difficoltà che spinge a spacciare un degradato per fatto. |
| [[class-subgoal-hijacks-task]] | a **response-time**, riporta il MEZZO invece della **risposta** all'utente | tiene vero il **registro-di-stato** interno (task_list/status/aim) | oggetto = **stato-interno bidirezionale** vs *risposta-user-facing*. |
| [[class-evaluation-integrity]] (radice-sorella ground-truth-integrity) | non **manomettere** un valutatore/test esterno | audita il **proprio** stato-dichiarato contro il **proprio** trace | *canale-di-verifica-esterno* vs *bookkeeping-proprio*. |
| [[class-stagnation-recovery]] | rileva lo **stuck** e recupera | rileva lo **stato-etichetta ≠ trace** e riallinea | *progresso-bloccato* vs *etichetta-disallineata* (un task può essere on-track ma mis-labeled). |

## Links
[[class-metacognitive-self-audit]] (**padre PROPOSTO** — radice-AUDIT, audit dello stato-dichiarato) · [[class-effort-honesty-under-difficulty]] (sorella; confine: incondizionato ≠ difficoltà→degrado) · [[class-subgoal-hijacks-task]] (sorella; confine: bookkeeping-interno ≠ report-mezzo-response-time) · [[class-stagnation-recovery]] (sorella; compone su esplorazione/stuck) · [[class-evaluation-integrity]] (radice-sorella ground-truth-integrity; confine: stato-proprio ≠ verificatore-esterno) · [[class-situational-awareness]] (radice-gemella OUTWARD; lo stato-task è INWARD) · [[area-01-organization-planning]] (task-decomposition/tracking — home) · [[area-04-context-metacognition]] (self-audit — home) · [[../concepts/training-vs-harness-classification]] (S puro; task_list=F, giudizio=S) · [[../concepts/discriminative-mcq-hard-distractors]] · [[../concepts/oracle-design-pitfalls]] (§branch-field-trap) · [[../../harness/verifiers/deceptive-task-gen]] · [[../../harness/verifiers/async-schedule-gen]] · [[dataset-construction-playbook]] · [[../harness-experiment-log]] (F35/C9, T3) · [[../feedback_reward_hacking_principle]] · [[../feedback_reward_branch_field_trap]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_intelligence_gap_to_training_class]] · [[../feedback_hierarchical_training_classes]]

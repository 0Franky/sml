---
name: harness-tool-affordance-design
description: Principi di design dell'harness per l'ESPOSIZIONE di tool e contesto al modello — visibility≠callability, mention≠invocation, access-by-intent + affordance esplicite, priority-over-cache. Lato-F del twin con class-harness-environment-awareness (lato-S/training).
type: concept
tags: [harness-design, context-assembly, tool-exposure, affordance, mining-2026-07, area-08]
last_updated: 2026-07-10
---

# Harness — design dell'ESPOSIZIONE di tool e contesto

> **Origine**: mining Stage-2 delle chat pregresse (2026-07-10, utente "integra TUTTO" msg 1504) — 4 emergenti di design dell'harness (#1, #7, #8, #17). Sono principi su come il **nostro** harness (pi) espone gli strumenti e assembla il `<context>`, distinti dalla *skill* che il modello deve avere di usarli (quella è [[../training-taxonomy/class-harness-environment-awareness]], lato-S). **Twin F/S** (rule #11): qui l'harness fornisce l'affordance corretta (F); là il modello impara a sfruttarla (S). Doppio scopo (rule #18): l'affordance scaffolda ORA, il training internalizza l'uso.

## Principio 1 — Visibility ≠ Callability (il gating agisce sulla LISTA, mai sull'esecuzione)

**Regola**: un tool registrato deve restare **invocabile** a prescindere dalla sua **scoperta**/visibilità. Il gating (per ridurre il rumore del prompt: mostrare pochi tool pertinenti) può agire **solo sulla surface** — la lista/descrizione esposta — **mai sull'esecuzione**: se il modello chiama un tool valido che l'harness aveva nascosto dalla lista, la chiamata **deve funzionare**.

**Perché**: nascondere-per-ridurre-rumore è legittimo; ma se "nascosto" diventa "non-chiamabile", il modello che *conosce* il tool giusto (per training o per memoria) viene bloccato da un artefatto di presentazione. È l'inverso dell'anti-reward-hacking applicato all'harness: non far dipendere una **capacità** da un dettaglio di **presentazione**.

**Enforcement** (rule #17 — ogni lezione → test): **regression-test di reachability** che asserisce che OGNI tool registrato è invocabile anche quando fuori dalla lista mostrata. Vedi l'esempio-regola CLAUDE.md #17 ("test che asserisce reachability di OGNI tool registrato").

## Principio 2 — Mention ≠ Invocation (nessun side-effect dalla sola menzione)

**Regola**: la **sola presenza** in output di un tag/comando che funge da trigger d'azione **non deve** causare l'azione. L'output del modello è **informazione**, non **esecuzione**: menzionare `<compact>`, un comando distruttivo in un esempio, o il nome di un trigger mentre se ne *parla* non deve attivarlo. L'attivazione richiede un canale/forma **esplicita e non-ambigua** (un blocco-azione dedicato), distinta dalla prosa.

**Perché**: `[EXTRACTED]` istanza reale — un tag di controllo scritto in chat mentre lo si discuteva rischiava di lanciare l'azione. Confondere *parlare-di-X* con *fare-X* rende l'output un campo minato e spinge il modello all'auto-censura (non può spiegare un comando senza eseguirlo).

**Design**: il parser dell'harness distingue **prosa/spiegazione** da **invocazione strutturata**; i trigger vivono in un canale dedicato, mai attivati da un match testuale in mezzo al discorso. Coerente con [[../feedback_no_regex_patch_for_language]] (rule #24): non un regex che "indovina l'intento d'azione" dal testo, ma un **confine strutturale** netto.

## Principio 3 — Access-by-INTENT + affordance esplicite + recupero out-of-bound

**Regola**: nel contesto **finestrato** (cap per-lane, troncamento), l'harness deve esporre l'accesso **per intento**, non solo ciò che è entrato nella finestra:
- **affordance esplicite**: quando una lane è troncata, dichiararlo (`"…+37 item nascosti — espandi per vedere"`, conteggio del nascosto), invece di presentare il troncato come completo (→ falso senso di completezza);
- **recupero out-of-bound**: un modo per il modello di *chiedere* ciò che è oltre la finestra (stream_read/get_var/espansione-lane), invece di allucinare o rinunciare;
- l'accesso è governato da *cosa serve* (intento), non solo da *cosa è visibile* (finestra).

**Perché**: `[EXTRACTED]` FIND-7/F23/F33 — il modello opera come se la finestra fosse il mondo intero: non recupera un fatto che è appena oltre il cap, o tratta una lista troncata come esaustiva. L'affordance esplicita è il segnale che gli permette di sapere che c'è di più e come chiederlo. È il **lato-F** che abilita la skill di [[../training-taxonomy/class-harness-environment-awareness]] (lato-S: sfruttare l'affordance) e compone coi gemelli-memoria SAVE/RECALL ([[../training-taxonomy/class-prospective-memory]] / [[../training-taxonomy/class-confabulation-retrieval-failure]]).

## Principio 4 — Priority-over-Cache (l'ordine d'importanza batte l'ottimizzazione dei cache-hit)

**Regola**: quando l'ordinamento del contenuto nel `<context>` è in tensione tra **importanza/efficacia per il modello** e **cache-stability** (tenere un prefisso stabile per massimizzare i prefix-cache-hit), **vince l'importanza**. Non degradare la qualità dell'ordine (mettere il critico in fondo, seppellire il rilevante) per far quadrare la cache.

**Riconciliazione con `<current_date>`** (idea #1, [[../architecture/context-pressure-mechanism]]): la scelta di iniettare la data a granularità-giorno in un **prefisso cache-stable** NON viola questo principio — è cache-stability *dove non costa nulla all'importanza* (la data è un anchor breve e stabile che sta bene in testa). La regola morde quando i due obiettivi **confliggono**: lì l'ordine-per-importanza prevale, e la cache si ottimizza solo nel margine residuo. Cache-stability è un **di-più opportunistico**, mai un vincolo che riordina il contenuto contro l'efficacia.

**Perché**: il contesto è il canale a più alta leva sul comportamento del modello; sacrificarne l'ordine per risparmiare token-di-cache è ottimizzare la metrica sbagliata (micro-risparmio vs macro-degrado della risposta). Coerente con [[../feedback_optimization_first]] (ottimizza ciò che conta) e con l'ancoraggio-per-importanza di [[../feedback_temporal_anchoring]] (l'ordine autoritativo è semantico, non incidentale).

## Metodologia collegata (dal mining, registrata anche nel playbook)

- **Test DISCRIMINANTI vs floor-test** (#12): valutare feature/candidati con test che li **separano** (qualcuno passa, qualcuno no), non "floor-test" che tutti superano al 100% (non discriminano nulla) → tenere una **matrice modello×feature** con tutti gli esiti. Estende [[discriminative-mcq-hard-distractors]] dal dominio-MCQ al design-esperimenti/eval (A/B vanilla-vs-ours, ablation). Un test dove il baseline già passa non misura la feature.
- **Isolamento risorse progetti paralleli** (#3): env/token/identità/**state-dir per-progetto** con mappa esplicita; mai riusare la config di un progetto per un altro (razionale di `HARNESS_STATE_DIR` per gli A/B, no test-pollution). Vedi memory `feedback_isolate_parallel_project_resources` + facet in [[../training-taxonomy/class-harness-environment-awareness]].

## Links
[[../training-taxonomy/class-harness-environment-awareness]] (twin lato-S/training) · [[../architecture/context-pressure-mechanism]] · `harness/src/context-assembler.mjs` (impl) · [[wrapper-context-assembly-example]] · [[discriminative-mcq-hard-distractors]] · [[../feedback_no_regex_patch_for_language]] · [[../feedback_optimization_first]] · [[../feedback_temporal_anchoring]] · [[../training-taxonomy/class-prospective-memory]] · [[../training-taxonomy/class-confabulation-retrieval-failure]] · [[../feedback_isolate_parallel_project_resources]]

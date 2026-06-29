---
name: cross-session-state-sharing
description: Condivisione/propagazione dello stato (VARS, decisioni, change-log) tra sessioni (cross-compact) e tra agenti/sotto-agenti, on-request ed esplicita. Timestamp dei cambiamenti visibili al modello + ultimi-passi con ref alle decisioni. Persistenza MIX file+DB. Difesa-in-profondità train(skill)+harness(esplicita) per l'intercettazione dei cambiamenti. Idea utente 2026-06-29 (msg 307).
type: concept
tags: [concept, wrapper, runtime, state, vars-registry, multi-agent, cross-session, persistence, change-propagation, training-vs-harness]
sources: [user msg 2026-06-29 (307), wrapper-context-assembly-example, agent-wrapper-vars-queue, interruption-robust-reasoning, external-update-injection]
last_updated: 2026-06-29
status: draft — risposta utente msg 307 filed-back; da raffinare nel review-loop wrapper
---

# Cross-Session / Cross-Agent State Sharing

> **Origine**: utente 2026-06-29 (msg 307). Tre domande: (1) ha senso **condividere le variabili tra più sessioni su richiesta** (dove "sessioni" = tra-compact **oppure** tra-agenti/sotto-agenti) così che i cambiamenti si auto-propaghino? (2) intercettazione-dei-cambiamenti: addestrare la skill di base e poi far rendere esplicito il cambiamento all'harness (dopo RL), oppure addestrare direttamente con l'update? (3) tracciare anche i **timestamp** dei cambiamenti (visibili al modello finché servono) + gli **ultimi passi con ref alle decisioni** — file, DB, o mix? Questa pagina è la risposta filed-back; estende [[wrapper-context-assembly-example]] §7 e [[agent-wrapper-vars-queue]].

## Catena: why → problema → soluzione

- **WHY**: un orchestratore organization-first lavora **multi-day** e **multi-agente** (sotto-agenti verticali). Se ogni sessione/agente ha uno stato isolato, una decisione presa in un punto **non si propaga** → incoerenza, lavoro perso, ri-decisione. Lo stato condiviso è il sostrato della coerenza. `[EXTRACTED dal claim utente msg 307]`
- **PROBLEMA**: la condivisione *globale e automatica* di tutte le variabili è pericolosa (collisioni di nome, race write cross-agente, propagazione di un valore stantio/sbagliato, saturazione del budget). E un modello che *non sa* che una variabile è cambiata sotto di lui **degrada** (vedi [[interruption-robust-reasoning]]: −60% senza training, arXiv 2510.11713). `[INFERRED]`
- **SOLUZIONE**: sharing **esplicito e on-request** (non auto-globale) **per riferimento** (la var condivisa è un handle a cui i consumer si agganciano per ID), con **change-log + timestamp** che rende il cambiamento *osservabile* al modello, e una skill addestrata a **intercettare/integrare** il cambiamento (così di base regge anche se il segnale harness è imperfetto) **rafforzata** dall'harness che lo rende esplicito al confine-di-sezione (difesa-in-profondità). `[INFERRED dalla sintesi con i concept esistenti]`

## 1. Scope dello sharing — entrambi, ma espliciti

| Asse | Cosa condivide | Meccanismo | Default |
|---|---|---|---|
| **Cross-compact** (tra sessioni della *stessa* identità nel tempo) | VARS / RULES / TASKS / decision-cache / change-log | sono **file/DB-backed** → sopravvivono già al compact (è il senso del datastore [[agent-wrapper-vars-queue]]). Il consumer legge sempre l'**ultima** versione per ID → "auto-propagazione per riferimento". | sempre persistito |
| **Cross-agent** (orchestratore ↔ sotto-agenti verticali) | un **sottoinsieme** scoped di VARS marcate `shared` | il sotto-agente riceve una **VIEW read** delle var condivise; le **scritture** le *propone*, l'orchestratore fa il **merge** (single-writer per evitare race). **Namespace** per agente per evitare collisioni di nome. | **on-request**, mai globale |

`[EXTRACTED]` l'utente conferma esplicitamente entrambi i sensi di "sessione". `[INFERRED]` il pattern read-view + merge-by-orchestrator è la difesa contro le race del datastore concorrente (già open-question in [[agent-wrapper-vars-queue]] §Concorrenza).

> ⚠️ **on-request ≠ auto-globale**: condividere TUTTO automaticamente è il duale dell'over-noting (saturazione + contraddizioni). Si condivide ciò che **conta**, marcato esplicitamente; metrica outcome-anchored (*un valore condiviso mancante ha causato un errore?*), non il numero di var condivise → [[reward-hacking-mitigation]].

## 2. Auto-propagazione, change-log e timestamp

- **Propagazione per riferimento**: chi referenzia `var:X` per ID vede sempre l'ultima versione → il cambiamento si propaga senza copia esplicita. `[INFERRED]`
- **Change-log per var condivisa**: ogni var porta `last_modified` (timestamp) + un log compatto *chi/quando/cosa* (quale agente/sessione l'ha cambiata, e — se rilevante — la **decisione** che l'ha motivata). `[EXTRACTED dal claim utente "tracciare i timestamp dei cambiamenti"]`
- **Visibilità a scadenza**: il modello **vede** il timestamp/diff nel metadata della var **finché serve**, poi invecchia/si comprime (non resta per sempre nel context). È [[temporal-awareness-timestamps]] applicato allo stato + la history-compression di [[wrapper-context-assembly-example]] §5. `[EXTRACTED]` ("almeno finché non serve più").
- **Ultimi-passi con ref alle decisioni**: già coperto da due lane esistenti — `last_tool_calls` (azioni+scope) + `block_notes` (decision-cache). Uno step può **citare la decisione** che l'ha motivato (es. *"edit login.py — per DECISO t5: HS256"*) → tracciabilità step→decisione, "se la situazione lo richiede". `[EXTRACTED + mappa su §3 dell'esempio canonico]`

## 3. Intercettazione dei cambiamenti — difesa-in-profondità (risposta alla domanda 2)

La domanda utente ("addestro la base a intercettare e poi l'harness rende esplicito dopo RL, *oppure* addestro direttamente con l'update?") si risolve con la regola [[training-vs-harness-classification]]: è una capacità **F+S**, da fare in **DIFESA-IN-PROFONDITÀ (entrambi)**, NON o-l'uno-o-l'altro.

- **S (pesi, addestrata)**: la **skill** di accorgersi che un valore condiviso è cambiato e **re-integrarlo** nel ragionamento in corso. Va addestrata perché senza training degrada (−60%, [[interruption-robust-reasoning]]). → di base "**riesce**".
- **F (harness)**: rende il cambiamento **esplicito** al **confine-di-sezione** ([[external-update-injection]], MinD multi-call `stop=</section>` + APC), ben delimitato. → "con l'aiuto finale **non sbaglia mai**".
- **Stato-senza-training**: DEGRADATA-ma-utile (il base nota *qualche* cambiamento esplicito, ma non integra in modo affidabile).
- ❌ **Anti-pattern da evitare**: addestrare **solo** con l'update bakato nel formato esatto dell'harness → **brittle** (funziona solo se l'harness produce *quel* formato; fragile a ogni variazione). È il guscio-inerte/over-fit del playbook (regola CLAUDE.md #11). → addestrare la skill su update iniettati in **posizioni/forme varie** (la robustezza è il punto), poi l'harness la rende affidabile.

> ⚠️ **Gating**: il valore pieno è **gated sul training** (post-FFT/RL). Per l'**MVP locale** la capacità è DEGRADATA-ma-presente: l'harness può già rendere esplicito il cambiamento (F), ma l'integrazione robusta (S) arriva col training.

## 4. Persistenza — MIX file + DB (risposta alla domanda 3)

Regola netta (conferma e dettaglia [[agent-wrapper-vars-queue]] §Persistenza):

| Backend | Cosa | Perché |
|---|---|---|
| **DB (SQLite)** | VARS registry (lookup O(1) by id), TASKS/VERIFICATIONS queue, **change-log + timestamp**, decision-cache, flag `shared`/namespace | strutturato, **queryabile**, update atomici, **lock per concorrenza**, audit |
| **FILE** | blob grandi (contenuti file, stream-read), **message-log append-only** (chat), wiki/memory durevole | blob/append-only/**audit-umano** + git-versionato + portabile |

**Euristica**: *strutturato + queryabile + concorrente → DB; blob-grande + append-only + audit-umano → file*. Il MIX non è indecisione: è separazione per accesso. `[INFERRED — sintesi della reco, coerente con lo schema a mano dell'utente 2026-05-21]`

## 5. Open questions / rischi `[da-validare]`

- **Garbage collection** delle var condivise non più referenziate (già OQ in [[agent-wrapper-vars-queue]]): quando una `shared` var smette di essere referenziata da ogni agente → GC o tombstone?
- **Merge-conflict cross-agent**: due sotto-agenti propongono scritture divergenti sulla stessa var → policy di risoluzione (last-write-wins vs orchestrator-arbitrato vs CRDT-like). Reco: **orchestrator-arbitrato** (single-writer) per l'MVP.
- **Staleness del valore propagato**: un consumer potrebbe agire su un valore che sta per cambiare → il change-log + timestamp serve anche a far decidere al modello se *ri-leggere* prima di agire (lega a [[low-confidence-gather-and-reorg]]).
- **Confidence dei vincoli dedotti condivisi**: un vincolo *inferito* (non esplicito) condiviso cross-agent può propagare un errore → marcarlo con confidence e, se ad alto impatto, confermare (vedi [[wrapper-context-assembly-example]] §7.2).

## Link
[[wrapper-context-assembly-example]] (lane + compact + §7 API) · [[agent-wrapper-vars-queue]] (datastore 4-lane + concorrenza + persistenza) · [[interruption-robust-reasoning]] (skill S addestrata) · [[external-update-injection]] (F harness, section-boundary) · [[temporal-awareness-timestamps]] (timestamp visibili) · [[training-vs-harness-classification]] (F+S, difesa-in-profondità) · [[reward-hacking-mitigation]] (metrica outcome-anchored) · [[low-confidence-gather-and-reorg]] (ri-leggere prima di agire)

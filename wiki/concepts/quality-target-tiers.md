---
name: quality-target-tiers
description: Il modello deve capire il LIVELLO DI QUALITÀ target del deliverable (PoC / Prototype / MVP / Production / Hardened), calibrare lo sforzo di conseguenza, e — se ambiguo — CHIEDERE all'utente mostrando uno scorecard (dimensioni × 0-5 per tier). Idea utente 2026-06-23.
type: concept
tags: [quality, deliverable-tier, poc, mvp, production-ready, scorecard, effort-calibration, organization-first, ask-vs-proceed]
last_updated: 2026-07-24
status: draft — espanso da idea utente, da validare (§3.ter scale-floor = PROPOSTA #26 msg 1799-1804, non ratificata)
confidence: provisional
---

# Quality-target tiers & scorecard

> **Origine**: idea utente 2026-06-23 — "LM deve capire la qualità finale del progetto; se non riesce a inferirla, chiede all'utente la tipologia di codice (PoC = brutale ma funzionante; MVP = architettura solida + sicurezza alta ma non perfetto; production-ready = tutto maxato). Può mostrare le statistiche, es. PoC Security 0/5, production-ready 5/5. Espandi e analizza."

## 1. Il problema
Scrivere codice **senza sapere il livello di qualità richiesto** porta a due fallimenti opposti:
- **Under-building**: consegni codice sloppy dove serviva production-ready → rischio/security debt.
- **Over-engineering** (gold-plating): metti test, astrazioni, hardening su un PoC usa-e-getta → **spreco di tempo/token** (anti-pattern tanto quanto lo sloppy — vedi [[../training-taxonomy/area-06-code-quality-architecture|Area 6 code-quality]]).

→ Il livello di qualità è una **criticità implicita** che il modello organization-first deve **inferire o chiedere** PRIMA di scrivere (lega a [[scientific-method-operating-protocol]] passo 2 "orient/goal", e [[pre-flight-safety-checks]]).

## 2. I tier di qualità (espansi)

| Tier | Definizione | Quando |
|------|-------------|--------|
| **PoC / Spike** | "brutale ma funzionante" — prova che l'idea funziona, internals usa-e-getta | esplorazione, validare fattibilità |
| **Prototype / Demo** | funziona + presentabile, internals ancora throwaway | demo a stakeholder |
| **MVP** | architettura solida + sicurezza alta, shippable a early users, **non** gold-plated | primo rilascio reale |
| **Production-ready** | "tutto maxato" — sicuro, testato, osservabile, documentato | prodotto in produzione |
| **Hardened / Critical** | oltre production: compliance (GDPR/PCI/HIPAA), ridondanza, audit, formal verification | regolato / mission-critical |

## 3. Lo scorecard (dimensioni × tier, target 0-5)

Ogni deliverable si valuta su **dimensioni di qualità**; ogni tier ha un **profilo target**. (Valori illustrativi, da calibrare con rubric — vedi §6.)

| Dimensione | PoC | Prototype | MVP | Production | Hardened |
|---|:--:|:--:|:--:|:--:|:--:|
| Functional correctness | 3 | 4 | 4 | 5 | 5 |
| Security | 0–1 | 1 | 4 | 5 | 5 |
| Architecture / structure | 1 | 2 | 4 | 5 | 5 |
| Test coverage | 0 | 1 | 3 | 5 | 5 |
| Error handling / robustness | 1 | 2 | 3 | 5 | 5 |
| Performance / efficiency | 1 | 2 | 3 | 4 | 5 |
| Observability (log/monitor) | 0 | 1 | 2 | 4 | 5 |
| Documentation | 0 | 1 | 2 | 4 | 5 |
| Maintainability / readability | 1 | 2 | 3 | 5 | 5 |
| Scalability | 0 | 1 | 2 | 4 | 5 |
| Compliance | 0 | 0 | 1 | 3 | 5 |

> Nota: anche un PoC ha **correctness ~3** (funziona sull'happy path), ma robustezza/security basse. "Brutale ma funzionante" = correctness sì, tutto il resto no.

## 3.bis — Override per-dimensione guidato dal dominio (approvato 2026-06-23)

Il tier dà il **profilo base**, ma il **dominio alza il pavimento** di singole dimensioni a prescindere dal tier:

| Dominio | Dimensioni forzate (floor) |
|---|---|
| Fintech / pagamenti | Security ≥5 · Compliance ≥4 · Correctness ≥5 (anche se MVP) |
| Medicale / safety-critical | Security ≥5 · Compliance ≥5 · Error-handling ≥5 |
| Dati personali (GDPR) | Security ≥4 · Compliance ≥4 |
| Real-time / gaming | Performance ≥4 |
| Infra / libreria pubblica | Maintainability ≥4 · Docs ≥4 · Tests ≥4 |

**Regola**: profilo finale = `max(tier_target, domain_floor, scale_floor)` per dimensione (il terzo floor è definito in §3.ter). Es. *MVP fintech* → Security **5/5** (non 4). Il modello deve riconoscere il dominio e applicare i floor. → skill: domain-aware quality calibration.

## 3.ter — Floor per SCALA × frequenza-d'uso della PARTE (intra-progetto) — `[PROPOSTA #26, non ratificata]`

> **Origine**: idea utente msg 1799-1804 (triage 2026-07-24). **Estensione**, non classe nuova (#16): aggiunge un TERZO floor allo stesso framework di §3.bis.

Tier (§2) e domain-floor (§3.bis) sono entrambi **project-level**: fissano UN profilo per l'intero deliverable. Ma un progetto **grosso benché throwaway** non è omogeneo: alcune parti sono **calde** (eseguite spesso, riusate da molti call-site, load-bearing per il resto della codebase) e altre **fredde** (usa-e-getta reali, un solo path, output effimero). Calibrare lo sforzo *sul tier di progetto* sbaglia in **entrambi** i versi dentro lo stesso repo.

- **Discriminante = SCALA × frequenza-d'uso DELLA PARTE**, non "throwaway-vs-no" del progetto. Un helper chiamato da 40 punti dentro uno spike enorme è caldo; un blocco monouso dentro un servizio production è freddo.
- **`scale_floor` alza SOLO due righe** dello scorecard — **Architecture/structure** e **Maintainability/readability** — e **solo sulle parti calde**. Razionale: su una parte calda uno spaghetti **si propaga** (ogni call-site eredita il difetto, il costo di manutenzione si moltiplica per la frequenza); su una parte fredda quelle due dimensioni non pagano il proprio costo. Le altre righe (Security, Correctness…) restano governate da tier+dominio: la scala della *parte* non abilita a saltare la security.
- **Polo positivo (oggi MANCANTE altrove)**: *"throwaway MA grosso → ingegnerizza le parti calde/riusate, il resto resta brutale."* Non è "throwaway → minimo sforzo ovunque" (sarebbe l'hack ucciso) né "grosso → hardening ovunque".

**Regola combinata**: `target(dimensione, parte) = max(tier_target, domain_floor, scale_floor(parte))`, dove `scale_floor` è non-nullo **solo** per {Architecture, Maintainability} e **solo** dove `scala(parte) × frequenza-d'uso(parte)` supera la soglia di caldo.

**NEGATIVI simmetrici (#21)** — il floor è una **calibrazione**, non "più-rigore-è-meglio":
- **N-under**: parte **calda** di un big-throwaway lasciata spaghetti → l'errore si **propaga** su tutti i call-site (è il caso che oggi nessuna classe copre: project-stakes N2 tratta il throwaway-banale→basso come *corretto*, ma non esiste il polo throwaway-**GROSSO**→basso = errore).
- **N-over**: **hardening delle parti FREDDE** di un throwaway (circuit-breaker/astrazioni su un blocco monouso) → è la *"robustezza fuori scala"* già coperta da [[../training-taxonomy/area-06-code-quality-architecture|area-06]]:128, qui ri-vista dalla lente **scala-della-parte** invece che tier-di-progetto.
- **Anti-hack ucciso**: "throwaway → minimo sforzo ovunque" (salta le parti calde) — battuto dai casi bilanciati che includono **sia** una parte calda **sia** una parte fredda nello *stesso* progetto (§Gate).

**Cross-link (SSOT #16, non duplicazione)**:
- [[../training-taxonomy/class-code-optimization]] disciplina ③ (proporzionalità caldo-vs-freddo) usa la **stessa lente hot/cold** ma sulla dimensione **PERFORMANCE**; qui la lente vale per **Architecture/Maintainability**. Assi ortogonali, stessa euristica.
- Questo materiale è **contenuto-core riservato** per la figlia FUTURA `right-effort-for-stakes` di [[../training-taxonomy/class-constraint-fit-decision]] (`class-constraint-fit-decision.md:27`, placeholder non ancora costruito): quando verrà filata, **SCEGLIE** il tier-di-sforzo per-parte a partire dalla **POSTA letta** da [[../training-taxonomy/class-project-stakes-awareness]] (LEGGE la posta) — la stessa separazione legge-vs-sceglie già stabilita fra quelle due classi.

**Transfer cross-dominio (#19)** — la STESSA logica "dimensiona lo sforzo sulla scala×uso della PARTE, non sull'etichetta del tutto":
- **dimensionamento di un impianto "provvisorio" ma grande**: la dorsale idraulica/elettrica che regge tutto il cantiere va ingegnerizzata anche se l'impianto è temporaneo; la derivazione a un capannone che si smonta fra un mese resta minimale.
- **staffing di un evento one-shot ma enorme**: i ruoli-collo (sicurezza, ingressi, coordinamento) vanno strutturati e ridondati anche se l'evento dura un giorno; le mansioni marginali restano ad-hoc.

## Gate reward (quando si costruirà `right-effort-for-stakes`)

- **OUTCOME (dominante)** = **floor-corretto-per-parte** su casi **bilanciati** che contengono, nello stesso progetto, **una parte calda** (dove {Architecture, Maintainability} DEVONO salire) **e una parte fredda** (dove NON devono) → premia la calibrazione, MAI la cerimonia ("valuto la scala…").
- **#32 (reward-branch-field-trap)**: `scala × frequenza-d'uso` è un **INPUT misurabile** (fan-in/#call-site/frequenza-di-esecuzione), non il ramo-da-premiare → grondarlo come input è lecito; il **tier-di-sforzo scelto** (il ramo) va all'held-out bilanciato + ECE, non grondato per-esempio.
- **Held-out**: le coppie caldo/freddo del gold restano escluse dal generatore; il transfer sui domini non-software (impianto, evento) è la metrica di successo.

## 4. Comportamento del modello (la skill)

```
1. INFER il tier dai segnali del contesto:
   - "script veloce / prova / spike / usa e getta"        → PoC
   - "demo per il cliente / mostriamo"                    → Prototype
   - "primo rilascio / early users / MVP"                 → MVP
   - "in produzione / i clienti ci contano / lancio"      → Production
   - "finanziario / medicale / regolato / security-critical" → Hardened
2. SE ambiguo o alto impatto → CHIEDI all'utente, mostrando i tier + scorecard
   (es. "PoC: Security 1/5, veloce  ·  Production: Security 5/5, +tempo. Quale?")
3. CALIBRA lo sforzo al tier (no gold-plating PoC, no under-build production)
4. SELF-SCORE l'artefatto prodotto vs il target e SURFACE i gap
   (es. "Security 2/5 vs target 5/5 → manca input validation, secret in env, rate-limit")
5. Il tier diventa decisione STICKY di progetto (block_notes / rules) → vale per tutto
```

Esempio di output scorecard a fine task:
```
Deliverable: endpoint /login   ·   Target tier: Production (5/5)
  Correctness     ████████ 5/5
  Security        ██████░░ 4/5   ← gap: manca rate-limiting su brute-force
  Tests           ████████ 5/5
  Error handling  ████████ 5/5
  Observability   ████░░░░ 3/5   ← gap: no structured logging sugli auth-fail
→ 2 gap per raggiungere Production 5/5. Procedo a chiuderli o vuoi fermarti a MVP?
```

## 5. Connessioni
- **Organization-first**: capire il livello di qualità = capire il vero intento → [[scientific-method-operating-protocol]] (orient), [[../architecture/orchestrator-layer]].
- **Ask-vs-proceed / informative escalation**: il "chiedo il tier" è un caso di deferenza informata → [[agent-constitution]] (principio 6-7), nota 9 lookahead [[_user-notes-2026-06-23]].
- **Code economy / production-ready**: calibrare evita over/under-engineering → Area 6 della [[../training-taxonomy/README|taxonomy]].
- **Self-evaluation**: lo scorecard è auto-valutazione → Area 16 "il gioco".
- **Decision cache**: il tier è una decisione di blocco/progetto → [[wrapper-context-assembly-example]] block_notes.
- **Meta**: il progetto stesso usa questi tier (MVP v1 → v2 → commerciale) → memory `project_mvp_scope`.

## 6. Analisi critica (cosa validare)
- `[CRITICA]` Lo **scoring 0-5 è qualitativo (L)** e soggettivo → serve una **rubric per dimensione** (cosa significa Security 3 vs 4?) per renderlo consistente, altrimenti il giudice/modello oscilla. Alcune dimensioni hanno un nucleo Q (test coverage % → score; vuln scanner → security score) → preferire **proxy quantitativi** dove esistono.
- L'**inferenza del tier può sbagliare** → il passo 2 (chiedi se ambiguo) è la valvola di sicurezza; meglio chiedere una volta che gold-platare/under-buildare.
- I **profili target del §3 sono illustrativi** → vanno tarati (es. un MVP fintech vuole Security 5/5 anche se è MVP: il tier NON fissa tutte le dimensioni allo stesso modo, il **dominio** può alzare singole righe). Aggiungere: override per-dimensione guidati dal dominio.
- Rischio **reward hacking** (PRIORITÀ — emphasis utente): se si addestra sul self-score il modello **gonfia i propri voti** → **scorer esterno per il reward, self-score solo per comunicazione**; proxy Q per le dimensioni misurabili. Difese complete in [[reward-hacking-mitigation]].

## 7. Implicazioni training (per la taxonomy)
- **with-hint**: prompt dichiara il tier ("fai un PoC veloce") → il modello calibra.
- **without-hint**: tier non dichiarato → il modello deve inferire o **chiedere**.
- **wrong-awareness**: il modello gold-plata un PoC (test+CI su uno spike) → riconoscere lo spreco; oppure shippa codice sloppy come "production" → riconoscere il rischio.
- **wrong-recovery**: ricalibra al tier giusto.
- **other**: dominio che forza override (MVP fintech con Security 5/5).

## Sources
- Idea utente 2026-06-23 (Telegram).
- Collega: [[scientific-method-operating-protocol]], [[agent-constitution]], [[pre-flight-safety-checks]], [[_user-notes-2026-06-23]], [[wrapper-context-assembly-example]], [[../training-taxonomy/README]].

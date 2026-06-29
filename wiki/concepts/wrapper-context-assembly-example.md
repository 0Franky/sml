---
name: wrapper-context-assembly-example
description: Esempio concreto di contesto generato dinamicamente dal wrapper. Versione canonica 2026-06-23 co-progettata con l'utente, con history gerarchica (blocchi+step), secrets-map dinamica, verify annidati, tool-call con scope, stream-read inline. Mostra come il contesto cambia per turno.
type: concept
tags: [wrapper, context-engineering, example, dynamic-context, structured-context, secret-section, hierarchy]
last_updated: 2026-06-23
status: draft — esempio canonico co-progettato (utente + AI)
confidence: illustrative
---

# Wrapper Context Assembly — Esempio concreto (canonico)

> **Origine**: [[_user-notes-2026-06-23]] nota 5 + due iterazioni con l'utente (2026-06-23). L'utente ha raffinato l'esempio e ha chiesto di **fondere le due sezioni di summary** (`prev_sections` per-step + `prev_blocks_summary` per-blocco erano duplicate) prendendo il meglio di entrambe → risolto con una **history gerarchica a 2 livelli** (§3).

Il wrapper mantiene lane persistenti e a **ogni turno ri-assembla** il contesto (quindi il contesto cambia potenzialmente a ogni domanda).

---

## 1. Le lane del wrapper

| Lane | Tipo | Scopo |
|---|---|---|
| `temporal` | timestamp + elapsed | senso del tempo ([[temporal-awareness-timestamps]]) |
| `rules` | lista testo | regole sempre attive (incl. production-ready, save-to-wiki) |
| `secrets` | **map key→value (dinamica)** | dati da non emettere; vedi §4 guardrail |
| `history` | **gerarchia 2 livelli** | blocchi completati (coarse+tag) + step blocco corrente (fine+dettagli) |
| `current_aim` | testo | obiettivo del momento |
| `block_notes` | lista decisioni | decision-cache del blocco (passo 7 di [[scientific-method-operating-protocol]]) |
| `task_list` | checklist | task del blocco corrente |
| `verify_queue` | check annidati + priorità | edge case/controlli (verify-loop, passo 8) |
| `interconnections` | dipendenze + flag WIP | criticità implicite (organization-first) |
| `last_tool_calls` | log con scope | azioni recenti + line-range |
| `open_file_view` | stream/partial read inline | porzione di file in lettura |
| `messages_with_user` | ultimi N scambi (**N scelto dal modello**) | continuità; storico COMPLETO persistito su file, la finestra è solo la coda recente (§7.1) |

Mappa su [[agent-wrapper-vars-queue]] + [[structured-context-sections]].

---

## 2. Scenario

> **Task**: "Migra il modulo auth da session-cookie a JWT, rimuovi il vecchio codice, aggiorna i test." Il modello ha già applicato il metodo scientifico (osserva→scompone→blocchi). Siamo nel **blocco B2 "Implementazione JWT", turno 8**.

## 3. Contesto generato (canonico)

```xml
<context>

<temporal> now: 2026-06-23T14:05:32Z · session_elapsed: 18m </temporal>

<rules>
  1. niente azioni irreversibili (delete file, drop table) senza conferma utente
  2. una decisione di design vale per TUTTO il progetto/blocco → SALVALA in wiki per permanenza
  3. codice operativo = nomi auto-esplicativi (l'anti-pattern nomi-random NON si applica in operatività)
  4. code MUST be production ready
  5. se trovi una contraddizione nel contesto → emetti <attention_event>, non procedere
</rules>

<secrets>   <!-- MAI emettere questi valori. Map dinamica, vedi §4 -->
  SECRET#1 = JWT_SIGNING_KEY  = ••••
  SECRET#2 = auth/config.py:12 "MY_SEC"  = ••••   (auto-rilevato al turno 6)
</secrets>

<!-- ░░ HISTORY GERARCHICA — fusione di prev_sections + prev_blocks_summary ░░ -->
<history>
  <completed_blocks>   <!-- LIVELLO COARSE: blocchi chiusi, compressi, con tag tipologia -->
    - [B0 | planning] timeline a blocchi: B1→B2→B3→B4→B5. B2 e B4 NON parallelizzabili (B4 dipende da B2)
    - [B1 | coding]   mappato flusso auth (login/session/middleware); middleware.py legge il cookie → da aggiornare in B3
  </completed_blocks>
  <current_block_steps block="B2">   <!-- LIVELLO FINE: trail dettagliato del blocco CORRENTE -->
    - STEP1: analizzato auth/session.py, individuato il set_cookie da sostituire {details...}
    - STEP2: implementato make_jwt(user_id) in auth/tokens.py {details: HS256, exp 30min, claim minimi}
  </current_block_steps>
</history>

<current_aim> emetti JWT firmato in login.py, interfaccia login()->token invariata </current_aim>

<block_notes B2>   <!-- decision-cache del blocco -->
  - DECISO t3: lib = PyJWT (no custom crypto)
  - DECISO t5: HS256, chiave da SECRET#1 (mai hardcoded)
  - DECISO t6: scadenza 30min, refresh→blocco B4
  - DECISO t8: production-ready level
</block_notes>

<task_list B2>
  [x] T1 requirements   [x] T2 make_jwt()
  [x] T3 sostituisci set_cookie con make_jwt (commit a1b2c3)
  [>] T4 rimuovi codice session-cookie da login.py   <-- CORRENTE
</task_list>

<verify_queue>   <!-- check ANNIDATI + priorità -->
  V1: production ready? → recall security → codice sicuro? ha bug/vulnerabilità?
  V2: pwd errata NON deve emettere JWT
  V3: payload JWT senza dati sensibili (no SECRET#*)
  V4: tests
  V5: [LAST/RELEASE] login e sessioni persistono a restart server e browser
      — ultima e importante verifica prima di marcare la sezione come corretta/funzionante
</verify_queue>

<interconnections> middleware (B3) si aspetta ancora il cookie → sistema WIP, non deployabile </interconnections>

<last_tool_calls>
  - edit_file main.py ok · scope: <make_jwt>
  - stream_read_file auth/config.py L:12-15
  - read_file auth/session.py ok
</last_tool_calls>

<open_file_view auth/config.py L:12-15>   <!-- partial/stream read inline -->
  12  secret = "MY_SEC"      ← auto-rilevato → aggiunto a secrets-map come SECRET#2
  13  if cfg.env == "prod":
  14      ...
  15      ...
</open_file_view>

</context>


<messages_with_user N:3>   <!-- blocco separato dal context tecnico. N impostato dal modello; storico completo su file, qui solo gli ultimi N (§7.1) -->
  User: ...
  AI:   ...
  User: ...
</messages_with_user>
```

---

## 4. Secrets-map guardrail (design utente 2026-06-23)

Idea utente: `secrets = map key→value`. **Se l'harness rileva un valore di un secret in una tool-call o in una risposta → BLOCCA tutto e avvisa l'utente.** È la difesa **deterministica** wrapper-side (non basata solo sul training).

- **Dinamica**: i secret non sono solo quelli pre-dichiarati. Quelli **scoperti leggendo file** (es. `secret = "MY_SEC"` alla riga 12) vengono **auto-aggiunti** alla map e protetti d'ora in poi (SECRET#2 nell'esempio).
- **Riferimenti opachi**: nel contesto si usano `SECRET#n`; il modello ragiona su "uso SECRET#1" senza vedere/emettere il valore reale → riduce la superficie di exfiltration.
- Dettaglio completo + livelli di difesa: [[secret-section-exfiltration-defense]].

## 5. Come cambia tra turni (compressione)
- Le sezioni **stabili** (rules, secrets) restano; le **dinamiche** (history, task_list, verify_queue, block_notes, temporal, tool_calls) evolvono.
- **Regola di compressione (fix duplicazione)**: quando un blocco si chiude, il suo `current_block_steps` (fine) si **comprime** in una riga di `completed_blocks` (coarse + tag tipologia), e il trail di step riparte per il blocco nuovo. Così non c'è duplicazione tra livelli: *step = working trail del blocco corrente; block = memoria compressa dei blocchi chiusi*. Lega a [[task-decomposition-adhoc-context]] e all'autocompact ([[_user-notes-2026-06-23]] nota 5).

## 6. Design insight emersi
- **History gerarchica** (blocchi coarse+tag / step fine+dettagli) = best-of-both delle due sezioni summary, senza duplicazione.
- **Tag tipologia** (`planning/coding/...`) = nota 2, utile per awareness e **routing** LoRA.
- **`block_notes` = decision-cache** del blocco (passo 7): evita di ri-decidere, crea coerenza.
- **Rule "salva in wiki per permanenza"**: l'agente mantiene una **memoria persistente propria** (come questo progetto!) → lega a [[error-memo-system]].
- **verify_queue annidati + priorità** (V5 "LAST/RELEASE"): i check hanno sotto-check e ordinamento.
- **secrets-map dinamica**: rileva e protegge anche i secret trovati nei file letti.
- **`interconnections` con flag WIP**: cattura criticità implicite (non deployabile a metà) = organization-first.

## 7. Harness API & tool lifecycle (design utente 2026-06-23)

Il contesto non è statico: il wrapper espone API/tool per costruirlo e mutarlo attivamente.

- **`ctx.getContext()`** (harness) — a ogni turno serializza **tutte le queue/liste** (rules, secrets, history, block_notes, task_list, verify_queue, tool_calls, open_file_view, …) **in testo** e le appende per formare la struttura `<context>`. Punto unico di assemblaggio → mappa sull'**extension pi che controlla la window + inject pre-turn** ([[../decisions/2026-06-23-pi-harness-base]]).
- **`add_secret(value)`** (LLM-callable) — `secrets` è **sempre una lista**; il modello chiama `add_secret` e il valore vi viene aggiunto. Da quel momento è protetto dal guardrail ([[secret-section-exfiltration-defense]]). → secrets dinamici **model-driven** (es. il modello legge un secret hardcoded in un file e lo registra).
- **`open/stream_read_file` → `close_stream_file(file)`** — lo stream-read porta porzioni di file **inline** nel contesto (`<open_file_view>`); **`close_stream_file` lo cancella TOTALMENTE dal contesto**. È **context-eviction esplicita guidata dall'LLM** → istanza concreta dell'autocompact/context-edit ([[_user-notes-2026-06-23]] nota 5) e complemento di [[sliding-window-variable-tool]]. Token-saving: apri quando serve, chiudi quando hai finito.

**Pattern emergente**: il modello **gestisce attivamente il proprio contesto** — apre file in stream, lavora, li chiude per liberare spazio; aggiunge secret alla lista; il harness ricompone tutto via `ctx.getContext()` a ogni turno. Questo realizza concretamente la metacognizione/autocompact delle note 4+5.

## 7.1 Message-log persistente + finestra N model-set (design utente 2026-06-25)

Precisazione utente sulla lane `messages_with_user`:

- **Storico completo su file**: **tutti** i messaggi user↔AI sono salvati in un **file dedicato** (`messages.log` o simile) — source-of-truth, auditabile, abilita la **continuità multi-day** ([[temporal-awareness-timestamps]]) e la retrieval di scambi vecchi.
- **Finestra = coda recente**: nel contesto entra solo la coda degli **ultimi N scambi**.
- **N è scelto/impostato dal modello** (`set_history_window(N)` LLM-callable): è un **grado di libertà metacognitivo**, gemello di `close_stream_file` per i file → istanza di autocompact/context-edit *model-driven* ([[_user-notes-2026-06-23]] note 4+5).

> ⚠️ **Critica & decisioni aperte (N model-set)** `[da-validare]`:
> 1. **N-in-messaggi ≠ budget-token**: N scambi è a lunghezza variabile → pochi messaggi lunghi sforano la window. Meglio **N + cap token** (o N derivato da un budget), legando la length-prediction ([[multi-token-prediction-training]], Area 10 taxonomy).
> 2. **Quando lo decide?** A inizio turno il modello non sa ancora cosa gli servirà (chicken-and-egg). Più robusto: **N di default + retrieval mirato dal file** (per id/timestamp/ricerca) quando rileva un buco, invece di gonfiare la finestra — più token-efficient. Lega a `<context_request>` (Area 8) e a degradation-self-awareness (Area 4).
> 3. **Sweet-spot come skill addestrabile**: N troppo basso → **context-miss** (perde un vincolo detto 10 messaggi fa); troppo alto → spreco + lost-in-the-middle. Reward **ancorato all'OUTCOME**: penalizza la N che ha *causato un miss verificabile*, non l'atto di impostarla (anti participation-hack → [[reward-hacking-mitigation]]). **Candidato foglia in Area 4** (context-window sizing) della [[../training-taxonomy/README|training taxonomy]].
> 4. **Coda recente + summary del resto**: oltre gli ultimi N raw, tenere un **summary rolling** dei più vecchi (come la history gerarchica §3), così gli scambi fuori-finestra non "spariscono" ma restano in forma compressa + recuperabili dal file.

**Risoluzione utente (2026-06-26)**:
- **Punti 1+4 → la window serve SOLO alla coerenza del dialogo** (capire di cosa si sta parlando per rispondere coerente). Per dettagli specifici il modello **legge il file di chat**; se vuole più contesto **allarga N**. → **niente summary rolling obbligatorio** per la chat (il file è il fallback). Distinto dalla history *tecnica* §3, che invece resta gerarchica con summary. Il punto 4 quindi **non si applica** alla lane chat.
- **Punto 2 → retrieval sul file di chat = `grep`/file-search** (default leggero) **o graphify** (query semantiche). `[NB critico]` graphify è pensato per il **corpus di conoscenza** (wiki), pesante/overkill per un log di chat effimero → per il recall conversazionale preferire grep/substring/semantic-search; graphify solo se serve davvero cross-document.
- **Punto 3 (count vs token-budget)** resta dettaglio implementativo: con window "solo-coerenza" basta un **piccolo N a conteggio**, ma prevedere comunque un **cap-token** per messaggi lunghi.

## 7.2 Context sempre allineato — constraint capture (esplicito + dedotto) (utente 2026-06-26)

Claim utente: *"l'agente deve tenere SEMPRE aggiornato e allineato il context. Se l'utente dà un vincolo, o l'agente ne intercetta uno dai messaggi (vincolo NON esplicito ma dedotto dalle esigenze), se lo segna nel contesto — ha la sua lista di note e regole. NON si DEVE perdere nulla."*

Mappa **esattamente** sulle lane `rules` + `block_notes` (decision-cache, passo 7) + `interconnections` già nel design (§1, §3): sono il posto dove vincoli e decisioni vengono *pinnati* e propagati. Il claim **conferma e rafforza** quelle lane, estendendole a **due fonti**:
- **Vincolo esplicito** (l'utente lo dice) → nota/regola diretta.
- **Vincolo dedotto** (emergente dalle esigenze, non detto) → l'agente lo **inferisce e lo registra**. È organization-first / criticality-awareness applicato al dialogo (Area 1 goal/constraint tracking + Area 2 implicit-criticality).

> ⚠️ **Critica onesta — il "non perdere nulla" va qualificato** (`[da-validare]`):
> 1. **Dedotto ≠ confermato**: un vincolo *inferito* può essere **sbagliato**. Pinnarlo come regola hard per sempre = rischio **over-constraining** / agire su un requisito allucinato. → marcare i vincoli dedotti con **confidence**, e per quelli ad **alto impatto chiedere conferma** (deferenza, Area 9) prima di trattarli come hard. *Esplicito = hard; dedotto = provvisorio-da-confermare.*
> 2. **"Niente perso" = persistenza durevole, non ritenzione verbatim infinita**: una lista note/regole che cresce all'infinito satura il budget e si auto-contraddice su sessioni lunghe. "Non perdere" deve significare **salvato in modo durevole** (file/wiki) + nel contesto vivo solo il sottoinsieme **attivo**. Serve **dedup + supersession** (una decisione nuova rimpiazza la vecchia — già il principio del decision-cache) + **contradiction-check** ([[contradiction-detection-layer]]).
> 3. **Misura outcome-anchored, non partecipazione**: "cattura ogni vincolo" può degenerare in **over-noting** (segnare tutto per sembrare diligente). Il valore è catturare i vincoli che **contano**; metrica = *un vincolo reale è stato perso e ha causato un errore?*, non il numero di note → [[reward-hacking-mitigation]]. **Candidato foglia Area 1/2** (constraint extraction & maintenance).

Lega a [[scientific-method-operating-protocol]] passo 2 (orient: far emergere obiettivo/limiti/criticità implicite), [[error-memo-system]] (memoria persistente), [[contradiction-detection-layer]].

## 7.3 Gather-on-low-confidence, reorg proattiva, harness-as-files (utente 2026-06-27)

Tre comportamenti che agiscono SUL context-assembly, ora formalizzati come concept a sé (msg 130/131/132):
- **Low-confidence → gather/ask + reorg** ([[low-confidence-gather-and-reorg]]): quando il modello è poco confident NON procede; **riorganizza** le lane (`task_list`/`block_notes`/`rules`, chiude il superfluo per recuperare budget) e poi *have-lead→gather* (grep/file-search/web) oppure *no-lead→ASK*. La reorg è un'operazione di prima classe sul context, non un effetto collaterale.
- **Harness-capabilities-as-files** ([[harness-capabilities-as-files]]): le capacità dell'harness sono **file leggibili on-fly** via `stream_read`; il modello apre (anche **più file** in temp-read concorrente), estrae, **annota in `block_notes`**, e `close_stream_file` per liberare budget. Ciò che serve resta nelle note, non nei file aperti.
- **Path-portability** ([[path-portability-awareness]]): il root assoluto vive come `<ROOT_PROJ>` in config (lane `rules`/`vars`); i path negli artifact sono relativi (portabilità + no leak username).

→ Estendono il context-assembly da "struttura statica" a **gestione attiva del budget** (apri/estrai/annota/chiudi + reorg). Lega a [[agent-wrapper-vars-queue]] e [[sliding-window-variable-tool]].

## Sources
- User notes 2026-06-23, nota 5 + 3 iterazioni esempio (Telegram msg 44/46/51/54 + sessione).
- Collega: [[agent-wrapper-vars-queue]], [[structured-context-sections]], [[task-decomposition-adhoc-context]], [[temporal-awareness-timestamps]], [[scientific-method-operating-protocol]], [[secret-section-exfiltration-defense]], [[cross-session-state-sharing]] (sharing/propagazione stato cross-session+cross-agent — estende §7 e la history-compression §5), [[_user-notes-2026-06-23]].

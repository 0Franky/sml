---
name: area-08-tool-use-agentic
description: Example-space completo per ogni foglia dell'Area 8 — Tool Use & Agentic Behavior (Tier X). Selezione/argomenti tool, efficienza e critica della traiettoria, error recovery, routing-token, cross-expert handoff e recruit. Vive prevalentemente in fase 3 (RL agentico con harness pi).
type: taxonomy-area
tags: [training, taxonomy, area-08, tool-use, agentic, routing, multi-expert]
sources: [training-taxonomy/README.md §4 Area 8, user notes 2026-06-23]
last_updated: 2026-06-25
status: generated
---

# Area 8 — Tool Use & Agentic Behavior

> **Tier**: X (cross-tier; il comportamento agentico attraversa orchestratore T1, programming T2, verticali T3).
> **Origine schema**: [[README]] §4 Area 8 (11 topic) + audit [[_coverage-audit-2026-06-23]] (gap #2,#3,#4,#7) + nota 6b trajectory ([[../concepts/_user-notes-2026-06-23]]).
> **Regola d'oro**: non riscrivere lo schema, riempirlo. Ogni foglia segue la forma canonica §3 del README (skill-target + 5 classi + tutti gli hint forte→debole + fase + reward + hack-check).

Questa è l'area più **agentica** della tassonomia: a differenza di code-correctness (Area 5) o reasoning (Area 3), qui la skill emerge **solo nell'interazione con tool reali e con l'harness**. Per questo la **maggior parte delle foglie vive in fase 3** (RL agentico con [[../decisions/2026-06-23-pi-harness-base|pi]], §4.bis): la teoria si dà in fase 1, qualche esercizio statico (trajectory-critique, action-consequence su log finti) in fase 2, ma il segnale vero — "questa azione ha fatto **progredire il task reale**?" — richiede l'environment in loop.

**Convenzione tag** (§1): **Q** = esito verificabile (tool giusto/scope/argomenti, no call ridondanti, routing-token corretto) via **verifier deterministico**; **L** = giudizio su una scala (qualità del percorso, sensatezza della traiettoria) via **judge/preference**. Le due foglie `trajectory-critique` e `action-consequence-prediction` sono **L** (giudizio); `error-recovery`, `wait-vs-retry`, `routing-token`, `context-asset-request` sono **Q**; `trajectory-efficiency` e i due cross-expert sono **Q+L**.

> ⚠️ **Hack-check trasversale Area 8** (priorità utente 2026-06-23/24, [[../concepts/reward-hacking-mitigation]] difesa #12): l'agente può imparare a **emettere tool-call / recruit / verifiche "per sembrare attivo"** (participation-hack 🔴). **TUTTI** i reward di questa area vanno ancorati all'**outcome verificabile** ("l'azione ha fatto progredire il task reale?"), **mai** all'atto di chiamare/reclutare/criticare in sé. Dettaglio per-foglia sotto.

---

## Tool Selection

### Foglia — `tool-selection / tool-giusto-per-il-bisogno`
- **Area**: 8 (Tool Use). **Tag**: **Q** (il tool scelto è quello corretto per il bisogno → verificabile contro l'azione attesa).
- **Skill target (segnale)**: dato un bisogno, **scegliere il tool appropriato** dal toolset disponibile (read vs grep vs glob; shell vs API dedicata; web_fetch vs cache locale) invece di usare un tool generico/sbagliato o di non usarne nessuno quando serve.
- **Esempi** (5 classi):
  - **(1) WITH-hint** — prompt con impalcatura, hint **forte→debole**:
    - *Hint forte (mapping esplicito)*: *"Tool disponibili e quando usarli: `grep`=cerca pattern nel contenuto, `glob`=trova file per nome, `read`=leggi un file noto, `web_fetch`=risorsa remota. Bisogno: trovare dove è definita la funzione `parse_config`."* → atteso: `grep("def parse_config")`.
    - *Hint medio (categoria)*: *"Usa un tool di ricerca-contenuto, non di ricerca-nome."* → stesso task.
    - *Hint debole (nudge)*: *"Scegli il tool più mirato al bisogno."* → stesso task.
  - **(2) WITHOUT-hint** — *"Dove è definita `parse_config`?"* senza alcuna guida sul toolset. Il modello deve **selezionare spontaneamente** `grep` (non leggere 40 file a caso, non `glob` su nome funzione che non è un file).
  - **(3) WRONG — awareness** — gli si mostra una traiettoria in cui per "trovare una definizione" l'agente fa `read` sequenziale di 12 file finché la trova. Label: *"sbagliato: tool sub-ottimale — esisteva `grep` che risolve in 1 call; questo è inefficiente e non scala su repo grandi."* Il modello deve **riconoscerlo** (no recovery).
  - **(4) WRONG — recovery** — l'agente parte con `read README.md` cercando la definizione, non la trova → **riconosce** "tool sbagliato per questo bisogno" → **switcha** a `grep("def parse_config")` → trova. Insegna il loop selezione → fallimento-di-percorso → ri-selezione.
  - **(5) OTHER** — composite/edge: (a) **nessun tool è quello giusto** → l'azione corretta è emettere `<context_request>` (vedi foglia dedicata) o chiedere all'utente, non forzare un tool inadatto; (b) **bisogno che richiede 2 tool in sequenza** (`glob` per trovare i file di test → poi `read`) → riconoscere che serve una *coppia*, non un singolo tool.
- **Fase curriculum** (§4.bis): teoria del toolset in **fase 1**; esercizi mapping bisogno→tool su scenari statici in **fase 2**; selezione reale in loop in **fase 3** (è qui che il toolset vivo conta).
- **Reward design**: **Q → verifier**: il tool scelto == tool atteso per quel bisogno (match contro oracolo per i casi sintetici; in fase 3, l'azione ha prodotto l'informazione cercata?). Penalità per tool generico quando ne esisteva uno mirato.
- **Hack-check**: rischio = scegliere il tool che il verifier "si aspetta" senza il bisogno reale, oppure spammare il tool "preferito" dal reward. → **Ancorare all'outcome**: il reward si dà se la call ha **prodotto progresso** (info trovata / stato avanzato), non se il nome-tool combacia per caso. Held-out di bisogni nuovi per evitare overfit alla mappa bisogno→tool vista in training. → [[../concepts/reward-hacking-mitigation]] #2,#12.

---

## Tool-call Argument Correctness

### Foglia — `tool-call-argument-correctness / argomenti-e-scope-corretti`
- **Area**: 8. **Tag**: **Q** (argomenti/scope verificabili dall'esecuzione).
- **Skill target (segnale)**: una volta scelto il tool, **passare argomenti corretti e con lo scope giusto** — path esatto, pattern ben formato, flag necessari, **scope né troppo largo né troppo stretto** (es. `grep` su tutto il repo quando bastava `src/`; o scope troppo stretto che manca il target).
- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *Hint forte (checklist argomenti)*: *"Prima di chiamare il tool verifica: path esatto e esistente? pattern/regex valido? scope minimo che copre il target? flag obbligatori presenti?"* → task: *"cerca `TODO` solo nei sorgenti Python di `src/`."* → atteso: `grep("TODO", path="src/", type="py")`.
    - *Hint medio*: *"Restringi lo scope al minimo che copre il target e controlla il path."* → stesso task.
    - *Hint debole*: *"Attenzione agli argomenti."* → stesso task.
  - **(2) WITHOUT-hint** — *"cerca i TODO nei sorgenti Python di src/"* senza checklist. Il modello deve produrre **autonomamente** lo scope giusto (`path="src/"`, `type="py"`), non `grep("TODO")` globale.
  - **(3) WRONG — awareness** — traiettoria: `grep("TODO")` su tutto il monorepo (incl. `node_modules/`, `vendor/`) → 4000 hit irrilevanti. Label: *"sbagliato: scope troppo largo — argomenti senza `path`/`type`; risultato ingestibile e fuori target."* Riconoscere.
  - **(4) WRONG — recovery** — l'agente chiama `read("config.yaml")` ma il path corretto è `configs/config.yaml` → tool ritorna *file not found* → **diagnostica** "path errato" → corregge con `read("configs/config.yaml")` (eventualmente preceduto da `glob("**/config.yaml")` per scoprire il path). Insegna recovery sugli **argomenti**, non sul tool.
  - **(5) OTHER** — composite/adversarial: (a) argomenti **plausibili ma con side-effect** — `rm` con glob troppo largo (`*.py` invece di `tmp_*.py`) → intreccio con Area 2 criticality (scope distruttivo); (b) **scope troppo stretto** che fa *missare* il target (`grep` solo in `src/api/` quando la def è in `src/core/`) → la call "riesce" ma il task non progredisce → riconoscere che 0-risultati ≠ "non esiste".
- **Fase curriculum**: fase 2 per gli esercizi argomenti/scope su tool simulati; **fase 3** per il segnale reale (l'argomento sbagliato si manifesta come fallimento/no-progress nell'harness).
- **Reward design**: **Q → verifier**: la call esegue senza errore-di-argomento **e** colpisce il target con scope minimo. Metriche: error-rate argomenti, precision/recall dei risultati vs scope-oracolo, penalità per scope sovra-largo (rumore) e sotto-stretto (miss).
- **Hack-check**: rischio = restringere lo scope per "sembrare preciso" mancando il target, o allargarlo per "garantire" un hit. → **Ancorare all'outcome**: reward se gli argomenti hanno **fatto avanzare il task** (target colpito, nessun rumore inutile), non per la forma degli argomenti. → [[../concepts/reward-hacking-mitigation]] #2.

---

## Trajectory Efficiency

### Foglia — `trajectory-efficiency / no-call-ridondanti-percorso-migliore`
- **Area**: 8. **Tag**: **Q+L** — nucleo Q (call ridondanti = contabili/verificabili) + dimensione L (il *percorso* scelto è il migliore? giudizio). Lega a nota 6b ([[../concepts/_user-notes-2026-06-23]]).
- **Skill target (segnale)**: raggiungere il goal con una **traiettoria efficiente** — niente call ridondanti (stesso `read` due volte, ri-cercare ciò che già si sa), niente detour; quando ci sono più percorsi, scegliere il **più corto/economico** a parità di esito.
- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *Hint forte (regole + budget)*: *"Pianifica il percorso prima di agire. Regole: non ri-leggere file già in contesto; non ri-cercare info già ottenuta; preferisci 1 call mirata a N call esplorative; budget consigliato ≤ K tool-call."* → task multi-step (es. localizzare e leggere la config attiva).
    - *Hint medio*: *"Evita call ridondanti e scegli il percorso più corto a parità di risultato."*
    - *Hint debole*: *"Sii efficiente nelle azioni."*
  - **(2) WITHOUT-hint** — stesso task senza guida. Il modello deve **non** ri-leggere file già letti e **riusare** ciò che ha già in contesto (es. albero file già visto → non rifare `glob`).
  - **(3) WRONG — awareness** — log: `glob` → `read A` → `read A` (di nuovo) → `grep X` → `grep X` (di nuovo, stessa query) → goal. Label: *"sbagliato: 2 call ridondanti (read A ×2, grep X ×2); l'informazione era già disponibile; traiettoria gonfiata."* Il modello **giudica** la sequenza (questa È nota 6b: dato lo schema, valutare ripetizioni/sensatezza).
  - **(4) WRONG — recovery** — l'agente sta per ri-chiamare `read A` → **si accorge** "A è già nel mio contesto / l'ho già letto a step 2" → **salta** la call e usa il dato in cache. Insegna l'auto-interruzione del detour.
  - **(5) OTHER** — composite: (a) **parallelizzabilità** — 3 `read` indipendenti emessi in batch invece che in 3 round sequenziali (efficienza ≠ solo "meno call", anche "meno round") → lega ad Area 1 parallelization; (b) **trade-off esplorazione-necessaria vs ridondanza** — su repo ignoto qualche call esplorativa è *legittima*, non confondere esplorazione doverosa con spreco (edge case anti-falso-positivo).
- **Fase curriculum**: trajectory-critique statica (giudicare log) in **fase 2**; ottimizzazione del percorso in loop in **fase 3** (RL su path efficiency; lega a [[../concepts/post-rl-path-optimization]] se presente).
- **Reward design**: **Q → verifier** per il nucleo: conteggio call ridondanti (= 0 ideale), #call e #round vs path-oracolo / vs minimo noto. **L → judge** per "percorso migliore" quando esistono alternative non banalmente confrontabili.
- **Hack-check**: 🔴 rischio doppio e **opposto**: (a) minimizzare le call **saltando step necessari** (sotto-esplora → fallisce il task per sembrare efficiente); (b) gonfiare per "sembrare attivo". → **Ancorare all'outcome**: l'efficienza conta **solo a task completato correttamente**; reward = (task risolto) × (penalità per ridondanza), **mai** "meno call" da solo. Held-out di task dove la scorciatoia naïve fallisce. → [[../concepts/reward-hacking-mitigation]] #8,#12.

---

## Trajectory Critique

### Foglia — `trajectory-critique / valutare-una-sequenza-di-azioni`
- **Area**: 8. **Tag**: **L** (giudizio sulla qualità di una traiettoria — nota 6b, valutazione *a posteriori*).
- **Skill target (segnale)**: dato uno **schema/log di sequenza d'azioni** (anche di un altro agente), **valutarne la qualità** — sensatezza, ripetizioni, call inutili, scelte sub-ottimali — e **prevedere** cosa succede (componente action-awareness della nota 6b). È la versione *meta* di trajectory-efficiency: qui il modello **giudica**, non esegue.
- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *Hint forte (rubric di critica)*: *"Valuta la traiettoria su: (i) ogni call era necessaria? (ii) ci sono ripetizioni? (iii) l'ordine è sensato (dipendenze rispettate)? (iv) esisteva un percorso migliore? Per ciascun punto motiva."* → si fornisce un log di 8 azioni.
    - *Hint medio*: *"Cerca call ridondanti, ordine illogico e alternative migliori, spiegando il perché."*
    - *Hint debole*: *"Giudica quanto ha senso questa sequenza."*
  - **(2) WITHOUT-hint** — solo il log + *"Critica questa traiettoria."* Il modello deve produrre **autonomamente** la valutazione strutturata (necessità, ripetizioni, ordine, alternative).
  - **(3) WRONG — awareness** — gli si mostra una **critica sbagliata** ("traiettoria perfetta") di un log che invece ha 2 ridondanze evidenti. Label: *"la critica è errata: ha mancato le 2 call ridondanti — un buon critic le avrebbe segnalate."* Il modello deve riconoscere la **critica difettosa** (meta-critica).
  - **(4) WRONG — recovery** — il modello dà una prima critica superficiale → gli si chiede *"sei sicuro? ri-esamina gli step 3 e 5"* → **rivede** e individua la ridondanza che aveva perso → critica corretta. Insegna il loop di auto-revisione della critica.
  - **(5) OTHER** — composite: (a) **traiettoria buona ma con un singolo difetto sottile** (1 call leggermente fuori ordine) → la critica deve essere *calibrata* (non bocciare tutto, non assolvere tutto); (b) **predire l'esito** di una sequenza *prima* di vederlo (componente "indovina cosa succede" della nota 6b) → ponte con `action-consequence-prediction`.
- **Fase curriculum**: **fase 2** prevalente (esercizi su log finti annotati buono/cattivo + perché). I giudizi prodotti possono alimentare i memo ([[../concepts/error-memo-system]]) e un eventuale PRM.
- **Reward design**: **L → judge/preference**: la critica del modello è confrontata con una critica gold (annotata) o, nello stile "il gioco" (Area 16), con la critica del **modello grande** → reward = accordo sui difetti reali individuati (precision/recall sui difetti, non lunghezza della critica).
- **Hack-check**: 🟠 rischio = produrre la critica che **il judge premia** (verbosa, severa a prescindere) invece di quella vera; oppure "trova difetti ovunque" per sembrare rigoroso. → **Ancorare al difetto reale**: reward solo se i difetti segnalati **esistono** nel log (verificabili contro l'annotazione/oracolo), penalità per falsi positivi → evita il "critique-hack". Scorer ≠ scored, judge a lenti diverse. → [[../concepts/reward-hacking-mitigation]] #3,#5,#12.

---

## Error Recovery (Tool Fail)

### Foglia — `error-recovery / tool-fallisce-recupera-riprova-alternativa`
- **Area**: 8. **Tag**: **Q** (recupero verificabile: il task riprende e progredisce dopo il fallimento del tool).
- **Skill target (segnale)**: quando un tool **fallisce** (errore, eccezione, output vuoto inatteso, exit-code ≠ 0), **riconoscere il fallimento**, **diagnosticare** la causa e **recuperare** — retry corretto, fix degli argomenti, o **alternativa** (tool diverso / percorso diverso) — senza ignorare l'errore né loopare ciecamente.
- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *Hint forte (loop di recovery)*: *"Se un tool fallisce: (1) leggi l'errore, (2) classifica (transitorio? argomento errato? permesso? risorsa assente?), (3) scegli — retry se transitorio, fix-args se argomento, alternativa se strutturale, stop+report se irrecuperabile, (4) max R retry poi escalation."* → scenario: `web_fetch` ritorna timeout.
    - *Hint medio*: *"Diagnostica il tipo di errore e scegli tra retry / correzione argomenti / alternativa / stop."*
    - *Hint debole*: *"Gestisci il fallimento del tool."*
  - **(2) WITHOUT-hint** — scenario con tool fallito senza guida. Il modello deve **spontaneamente** leggere l'errore e scegliere la mossa giusta (non ripetere identica la call che è già fallita per argomento errato).
  - **(3) WRONG — awareness** — log: `read("cfg.yml")` → *file not found* → l'agente **prosegue come se avesse il contenuto** (allucina la config). Label: *"sbagliato: errore ignorato — ha usato dati inventati dopo un tool fallito; doveva diagnosticare il path."* Riconoscere (lega ad anti-hallucination, Area 15).
  - **(4) WRONG — recovery** — `pip install pkg` → *network error (transitorio)* → l'agente **riconosce** transitorio → **retry** (1) → fallisce ancora → **alternativa** (mirror / cache locale) → successo; **oppure** `git push` → *permission denied* → riconosce **non-transitorio** → **non** ritenta a vuoto → **escalation** all'utente con contesto. Insegna a distinguere retry-utile vs retry-inutile (sinergia con `wait-vs-retry`).
  - **(5) OTHER** — composite/adversarial: (a) **fallimento silenzioso** — il tool ritorna exit-0 ma output vuoto/incoerente (non un errore esplicito) → riconoscere comunque il fallimento *semantico*; (b) **retry-storm** — riconoscere quando 3 retry identici sono inutili e fermarsi (anti-loop, cap); (c) **errore composito** — il fallimento di A invalida il piano → serve **re-plan** (ponte Area 1) non solo retry.
- **Fase curriculum**: **fase 3** prevalente (i fallimenti reali dei tool emergono solo nell'harness pi); qualche scenario annotato in fase 2 per le basi della diagnosi.
- **Reward design**: **Q → verifier**: dopo il fallimento, il task **riprende e completa** (binario: recuperato/non-recuperato); penalità per errore-ignorato (prosecuzione su dati assenti) e per retry-storm oltre il cap. Metrica: recovery-rate, #retry-inutili.
- **Hack-check**: rischio = **retry "per sembrare resiliente"** senza diagnosi (partecipazione), o dichiarare "recuperato" senza che il task sia davvero progredito. → **Ancorare all'outcome**: reward solo se il recupero ha **effettivamente fatto avanzare/completare** il task (verificabile), non per l'atto di ritentare. Penalità esplicita su retry identici ripetuti. → [[../concepts/reward-hacking-mitigation]] #8,#12.

---

## Action-Consequence Prediction

### Foglia — `action-consequence-prediction / prevedere-cosa-fa-unazione`
- **Area**: 8. **Tag**: **L** (giudizio/predizione *a priori*; complementare alla critica *a posteriori* della 6b e al lookahead nota 9).
- **Skill target (segnale)**: **prima** di eseguire un'azione, **prevedere cosa farà** (effetto atteso, side-effect, reversibilità) — "indovina cosa succede" dato lo schema. È il gemello a-priori di trajectory-critique e nutre criticality-awareness (Area 2).
- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *Hint forte (template predizione)*: *"Prima di eseguire, dichiara: effetto-atteso · side-effect possibili · è reversibile? · cosa cambia nello stato/filesystem? · come verifico l'esito?"* → azione: `git reset --hard HEAD~1`.
    - *Hint medio*: *"Prevedi effetto e side-effect dell'azione prima di lanciarla."*
    - *Hint debole*: *"Cosa succede se esegui questo?"*
  - **(2) WITHOUT-hint** — solo l'azione + *"Eseguila"* in un contesto dove l'effetto è non-banale. Il modello deve **anticipare spontaneamente** la conseguenza (es. che `reset --hard` scarta le modifiche non committate) **prima** di agire.
  - **(3) WRONG — awareness** — gli si mostra una **predizione errata** ("`rm -rf build/` non tocca i sorgenti" in un caso dove `build/` è un symlink alla src). Label: *"predizione sbagliata: non ha considerato il symlink → side-effect distruttivo non previsto."* Riconoscere la predizione difettosa.
  - **(4) WRONG — recovery** — il modello predice "innocuo" → gli si mostra che invece l'azione **ha** un side-effect → **rivede** il modello mentale e **aggiorna** la predizione (e di conseguenza decide di non eseguire / chiedere conferma). Insegna ad aggiornare la stima.
  - **(5) OTHER** — composite: (a) **azione con effetto dipendente dallo stato** — `git push` riesce o fallisce a seconda di permessi/branch protetti → la predizione corretta è *condizionale* ("se branch protetto → fallisce"); (b) ponte Area 2: predire conseguenza **distruttiva e irreversibile** → non solo prevedere, ma **fermarsi/chiedere** (la predizione alimenta il safety-stop).
- **Fase curriculum**: **fase 2** (esercizi "indovina l'esito" su schemi/log) → poi **fase 3** dove la predizione viene **verificata contro l'esito reale** dell'harness (segnale di calibrazione forte).
- **Reward design**: **L → judge** sulla qualità/completezza della predizione, ma con **ancora Q** appena disponibile: in fase 3 la predizione si confronta con l'**esito reale** osservato → reward di **calibrazione** (predetto vs accaduto). Questo trasforma una L in qualcosa di verificabile → preferibile.
- **Hack-check**: rischio = predizioni vaghe/onnicomprensive che "coprono tutto" per non sbagliare mai (hedge-hack). → **Ancorare all'esito reale** (fase 3): reward = accuratezza predetto-vs-accaduto, penalità per predizioni non-falsificabili. → [[../concepts/reward-hacking-mitigation]] #8,#12.

---

## Wait-vs-Retry / Timeout Reasoning

### Foglia — `wait-vs-retry / timeout-reasoning`
- **Area**: 8. **Tag**: **Q** (decisione verificabile contro la latenza tipica/elapsed). Lega a [[../concepts/temporal-awareness-timestamps]] (§Pattern A: decidere se attendere o ritrarre).
- **Skill target (segnale)**: con un tool **in-flight lento**, decidere **wait / retry / declare-failed** in base alla **latenza tipica** del tool e all'**elapsed** corrente — non ritentare un `npm install` legittimamente lungo, non aspettare in eterno un tool che tipicamente è istantaneo.
- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *Hint forte (regola con soglie + timestamp)*: *"Usa `<tool_call_log>`: confronta `elapsed_so_far` con la latenza tipica del tool. Regola: se elapsed < latenza-tipica → WAIT; se elapsed ≫ tipica (es. >3×) o > `timeout_at` → RETRY o DECLARE-FAILED; per tool noti-lenti (npm/pip/build) usa soglie ampie."* → scenario: `shell_exec npm install` in_progress da 105s, tipica ~2min.
    - *Hint medio*: *"Confronta il tempo trascorso con quanto ci mette di solito quel tool prima di decidere."*
    - *Hint debole*: *"Aspettare o riprovare?"*
  - **(2) WITHOUT-hint** — stesso `<tool_call_log>` (timestamp + elapsed) senza regola. Il modello deve **leggere i timestamp** e decidere WAIT (perché `npm install` a 105s è normale), non un retry prematuro.
  - **(3) WRONG — awareness** — log: `pytest` in_progress da 8s (tipica ~2s) → l'agente **continua ad aspettare** indefinitamente senza soglia. *Oppure* speculare: `npm install` a 30s → l'agente fa **retry prematuro** (lancia una 2ª install concorrente). Label rispettiva: *"sbagliato: nessun timeout su tool veloce / retry prematuro su tool lento — non ha confrontato con la latenza tipica."* Riconoscere.
  - **(4) WRONG — recovery** — l'agente fa retry a 30s su un `web_fetch` lento ma legittimo → **si accorge** (dai timestamp del 1° tentativo ancora in-flight) di aver lanciato un duplicato → **annulla/ignora** il duplicato e torna ad attendere il primo entro `timeout_at`. Insegna a correggere una decisione wait/retry sbagliata.
  - **(5) OTHER** — composite/adversarial: (a) **timestamp incoerenti** (`responded_at` < `requested_at`, o `age_ms` assurdo) → flaggare l'incoerenza prima di decidere (lega a stale/TTL, Area 4); (b) **tool senza latenza-tipica nota** (primo uso) → strategia conservativa: una soglia di default + osserva, non assumere; (c) **deadline esterna** (task con scadenza) che cambia la decisione (declare-failed prima per rispettare la deadline).
- **Fase curriculum**: esercizi su `<tool_call_log>` annotati in **fase 2**; decisione reale in **fase 3** (l'harness produce latenze vere, anche variabili).
- **Reward design**: **Q → verifier**: la decisione (wait/retry/fail) è confrontata con l'**esito**: il tool era davvero ancora valido (→ wait era giusto) o bloccato (→ retry/fail era giusto)? Penalità per retry-prematuro (duplicati/race) e per wait-infinito oltre soglia. Metrica: decisioni corrette / tempo-sprecato.
- **Hack-check**: rischio = retry aggressivo "per fare qualcosa" (participation) o wait passivo per non rischiare penalità di retry. → **Ancorare all'outcome**: reward in base a se la decisione ha **minimizzato il tempo-a-completamento reale** del task, non all'atto. Vietare retry concorrenti senza annullare il precedente. → [[../concepts/reward-hacking-mitigation]] #12; [[../concepts/temporal-awareness-timestamps]] (training §B/§A).

---

## Routing-token Emission

### Foglia — `routing-token-emission / load-programming-load-vertical`
- **Area**: 8. **Tag**: **Q** (il token emesso == LoRA corretto per il sotto-task → verificabile).
- **Skill target (segnale)**: l'orchestratore (T1) **emette il routing-token corretto** — `<load:programming>`, `<load:vertical:frontend>`, ecc. — al **confine di stage** per innescare l'**hot-swap LoRA** nel wrapper (segment-and-rerun, vedi [[../concepts/multi-expert-collaboration]] §granularità). Token giusto, dominio giusto, momento giusto.
- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *Hint forte (catalogo + sintassi)*: *"Adapter disponibili: `<load:programming>` (codice generico), `<load:vertical:frontend>`, `<load:vertical:backend-py>`, `<load:vertical:data>`. Emetti il token al confine di stage, PRIMA di generare l'output di quel dominio. Task: implementa una dashboard React."* → atteso: `<load:vertical:frontend>` prima del codice TSX.
    - *Hint medio*: *"Carica il vertical giusto prima di scrivere codice di dominio, usando il token di routing."*
    - *Hint debole*: *"Segnala quale esperto serve per questo step."*
  - **(2) WITHOUT-hint** — *"Implementa una dashboard React"* senza catalogo. Il modello deve **emettere spontaneamente** `<load:vertical:frontend>` (classificazione del dominio → routing), non restare sull'orchestratore base per scrivere TSX.
  - **(3) WRONG — awareness** — traiettoria: task frontend ma l'orchestratore emette `<load:vertical:backend-py>` (dominio errato), **oppure** scrive il codice **senza** emettere alcun token (resta sul base, niente hot-swap). Label: *"sbagliato: routing-token errato/assente — dominio mis-classificato o swap non innescato; il LoRA giusto non è stato caricato."* Riconoscere.
  - **(4) WRONG — recovery** — l'orchestratore emette `<load:vertical:data>` per un task che si rivela frontend → **riconosce** la mis-classificazione (l'output non quadra col dominio) → **ri-emette** `<load:vertical:frontend>` al confine di stage successivo. Insegna la correzione del routing (con cautela KV-cache: lo swap è a confine-di-stage, non mid-forward — vedi caveat in [[../concepts/multi-expert-collaboration]]).
  - **(5) OTHER** — composite: (a) **task multi-domain** → sequenza di token corretta nel piano (`<load:vertical:backend-py>` poi `<load:vertical:frontend>`) → ponte con cross-expert handoff e Area 1 expert-chain; (b) **dominio fuori catalogo** → **non** inventare un token inesistente; emettere invece `<recruit:domain>` o refusal (Area 11) — riconoscere il limite del catalogo.
- **Fase curriculum**: **fase 3** prevalente (il routing-token ha senso solo con l'harness/wrapper che esegue lo swap); classificazione-dominio → token su esempi statici in **fase 2**.
- **Reward design**: **Q → verifier**: token emesso == adapter-oracolo per quel sotto-task (match dominio) **e** emesso al confine giusto (prima dell'output di dominio). Penalità per token assente quando serviva, dominio errato, sintassi malformata.
- **Hack-check**: 🟠 rischio = **over-routing** (emettere `<load:...>` di continuo per "sembrare orchestrante") → costo swap + churn. → **Ancorare all'outcome**: reward se il token ha caricato l'adapter che ha **effettivamente prodotto** l'output di dominio corretto, non per l'emissione in sé; penalità per swap inutili che non cambiano il dominio. → [[../concepts/reward-hacking-mitigation]] #12; [[../concepts/multi-expert-collaboration]].

---

## Context/asset Request

### Foglia — `context-asset-request / context_request-request_asset`
- **Area**: 8. **Tag**: **Q** (la richiesta è necessaria e ben formata per lo step corrente → verificabile).
- **Skill target (segnale)**: quando per lo **step corrente** manca un'informazione/risorsa, **emettere `<context_request>` / `<request_asset>`** mirato (chiede *esattamente* ciò che serve) invece di allucinare il dato mancante o procedere alla cieca.
- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *Hint forte (template richiesta)*: *"Se manca un input per lo step corrente, NON inventarlo: emetti `<context_request what='...' why='...'>` (o `<request_asset>`) chiedendo il minimo necessario. Verifica prima se è già nel contesto."* → step: "applica lo schema DB" ma lo schema non è in contesto.
    - *Hint medio*: *"Chiedi l'asset mancante con una richiesta mirata invece di assumere."*
    - *Hint debole*: *"Ti manca qualcosa per questo step?"*
  - **(2) WITHOUT-hint** — step che richiede un asset assente, senza guida. Il modello deve **riconoscere il gap** ed emettere `<context_request>` mirato, non procedere con un valore inventato.
  - **(3) WRONG — awareness** — traiettoria: manca lo schema DB → l'agente **inventa** una struttura di tabelle plausibile e procede. Label: *"sbagliato: asset mancante allucinato — doveva emettere `<context_request>` per lo schema reale; rischio di lavoro tutto da rifare."* Riconoscere (lega ad anti-hallucination Area 15 + criticality Area 2).
  - **(4) WRONG — recovery** — l'agente procede assumendo l'asset → un check downstream fallisce (lo schema reale è diverso) → **riconosce** "stavo assumendo, mi serviva il dato" → **emette** `<context_request>` retroattivamente e **rifà** lo step con l'asset corretto. Insegna a fermare la deriva da assunzione.
  - **(5) OTHER** — composite/edge: (a) **richiesta ridondante** — chiedere un asset **già presente** nel contesto → anti-pattern (prima cerca, poi chiedi) → riconoscere che la richiesta era inutile; (b) **richiesta troppo larga** (`<context_request what='tutto il repo'>`) vs mirata → calibrare lo scope della richiesta (parallelo a tool-argument-scope); (c) **asset ottenibile via tool** (è un file → `read`, non `<context_request>` all'utente) → scegliere il canale giusto (tool vs richiesta-utente).
- **Fase curriculum**: **fase 3** (il bisogno di asset emerge in esecuzione reale); riconoscimento-gap su esempi statici in **fase 2**. Lega a [[../concepts/task-decomposition-adhoc-context]] e ask-vs-proceed (Area 9).
- **Reward design**: **Q → verifier**: la richiesta è emessa **quando (e solo quando)** l'asset manca davvero ed è necessario allo step, ed è **mirata** (chiede il minimo). Penalità per: asset allucinato (mancata richiesta dovuta), richiesta ridondante (già in contesto), richiesta troppo larga.
- **Hack-check**: 🟠 rischio = **over-asking** (chiedere asset di continuo per non sbagliare mai / "sembrare prudente") → scarica il lavoro sull'utente. Speculare a over-refusal. → **Ancorare all'outcome**: reward se la richiesta era **realmente necessaria** e ha sbloccato lo step (verificabile), penalità per richieste evitabili (asset già disponibile/derivabile). → [[../concepts/reward-hacking-mitigation]] #8,#12.

---

## Cross-expert State Handoff

### Foglia — `cross-expert-state-handoff / hint-state-strutturato-tra-expert`
- **Area**: 8. **Tag**: **Q+L** — Q (lo state passato è **completo e ben formato** per il successivo: campi presenti, contratto rispettato) + L (la **qualità/utilità** dell'hint per il prossimo expert). Lega a [[../concepts/multi-expert-collaboration]] (paper-claim #6).
- **Skill target (segnale)**: al confine tra expert in catena, **passare hint + state strutturato** (`<stage_output>` con `<knowledge>` + `<hint_for_next>`) così che il successivo possa **continuare senza ri-derivare** — né perdere informazione, né scaricare rumore.
- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *Hint forte (schema handoff)*: *"Alla fine del tuo stage emetti `<stage_output id=N by='...'>` con `<knowledge>` (cosa hai prodotto, fatti riusabili) e `<hint_for_next>` (cosa deve sapere il prossimo: contratto API, formati, vincoli). Passa solo ciò che serve a valle."* → scenario: finance→backend (vedi esempio in [[../concepts/multi-expert-collaboration]]).
    - *Hint medio*: *"Passa al prossimo expert le conoscenze + gli hint necessari in forma strutturata."*
    - *Hint debole*: *"Prepara il passaggio di consegne."*
  - **(2) WITHOUT-hint** — fine-stage senza template. Il modello deve **strutturare spontaneamente** l'handoff (knowledge + hint), non terminare lasciando il successivo a indovinare.
  - **(3) WRONG — awareness** — `<stage_output>` che passa **tutto il ragionamento grezzo** (rumore) **oppure** omette il **contratto API** che serve a valle (es. il backend non comunica la firma dell'endpoint al frontend). Label: *"sbagliato: handoff incompleto/rumoroso — manca il contratto API (o è sepolto nel rumore); il prossimo expert dovrà indovinare o ri-derivare."* Riconoscere.
  - **(4) WRONG — recovery** — il frontend-expert riceve un handoff **incompleto** (manca lo shape della risposta API) → **riconosce** il gap → **emette** richiesta di chiarimento al backend-expert / `<context_request>` mirato → riceve il contratto → procede. Insegna il recupero **lato ricevente** dell'handoff difettoso (ponte con context-asset-request e completeness-gate).
  - **(5) OTHER** — composite: (a) **cascading error** — handoff con un errore (formula sbagliata da finance) che si propaga → ponte con cross-expert **verification** (Area 16, producer–verifier: l'expert a valle valida l'input dell'expert a monte); (b) **handoff a catena lunga** (3+ stage) dove lo state va **accumulato** senza esplodere (compaction dell'handoff) → ponte con context management Area 4.
- **Fase curriculum**: **fase 3** (richiede ≥2 expert in catena, harness con hot-swap — Wave 7-8 del concept); esercizi di formattazione handoff su esempi statici in **fase 2**.
- **Reward design**: **Q → verifier** per il contratto: i campi necessari (API signature, formati, vincoli) sono **presenti e ben formati** nell'handoff (check strutturale); il successivo **completa senza ri-richiedere** ciò che era passabile. **L → judge** per l'utilità/concisione dell'hint. Metrica forte: l'expert a valle ha avuto bisogno di ri-derivare/ri-chiedere? (no = handoff buono).
- **Hack-check**: rischio = **over-stuffing** dell'handoff ("passo tutto così sono coperto" → rumore che il judge potrebbe non penalizzare) o hint generici che sembrano utili ma non lo sono. → **Ancorare all'outcome a valle**: reward se l'handoff ha permesso al successivo di **completare il suo stage** senza ri-derivare/ri-chiedere (verificabile dal comportamento a valle), non per la ricchezza apparente. → [[../concepts/reward-hacking-mitigation]] #3,#12; [[../concepts/multi-expert-collaboration]] §raffinamenti.

---

## Expert-recruitment Request (Self-limit → Recruit)

### Foglia — `expert-recruitment / self-limit-poi-recruit-domain`
- **Area**: 8. **Tag**: **Q+L** — Q (il recruit è **giustificato** dall'outcome: la parte non coperta sarebbe poi risultata sbagliata?) + L (qualità del giudizio di self-limit). Lega a [[../concepts/multi-expert-collaboration]] §reclutamento dinamico + capability-limit recognition (Area 11).
- **Skill target (segnale)**: l'expert corrente, sul task corrente, **dichiara i propri limiti di applicabilità** e, se riconosce di **non bastare**, **richiede uno specifico vertical** (`<recruit:domain>`) per completare la conoscenza — né silenzio quando dovrebbe reclutare (errore #1), né recruit a sproposito.
- **Esempi**:
  - **(1) WITH-hint** — hint **forte→debole**:
    - *Hint forte (protocollo self-limit)*: *"Sul task corrente, valuta esplicitamente: questo rientra nel MIO dominio? Se una parte richiede competenza di un altro vertical, dichiara il limite ed emetti `<recruit:domain>` per quella parte. Recluta SOLO se il tuo output sarebbe altrimenti sbagliato."* → scenario: backend-expert riceve un task che include una formula attuariale (finance).
    - *Hint medio*: *"Dichiara i tuoi limiti e recluta il vertical mancante se ti serve davvero."*
    - *Hint debole*: *"Ti basta la tua competenza per questo?"*
  - **(2) WITHOUT-hint** — task misto senza guida. L'expert deve **riconoscere spontaneamente** la parte fuori-dominio ed emettere `<recruit:finance>` per quella, completando il resto da sé.
  - **(3) WRONG — awareness** — il backend-expert **prosegue da solo** su una formula attuariale che non padroneggia (overconfidence, Dunning-Kruger) → output finanziariamente errato. Label: *"sbagliato: self-limit mancato — doveva reclutare `finance`; ha prodotto un risultato fuori-competenza non flaggato (errore silenzioso)."* Riconoscere. **[Speculare]**: recruit a sproposito di `finance` per un task puramente backend → *"sbagliato: recruit non necessario, costo/latency inutile."*
  - **(4) WRONG — recovery** — l'expert procede da solo → il **completeness-gate / cross-expert verification** (loop esterno) segnala la parte finanziaria dubbia → l'expert **riconosce** il limite a posteriori → **emette** `<recruit:finance>` e integra. Insegna che il backstop esterno cattura i self-limit sfuggiti (vedi guardrail §1 del concept).
  - **(5) OTHER** — composite/adversarial: (a) **vertical richiesto assente dal registry** → fallback: out-of-domain refusal / hint utente / composizione di vertical adiacenti **con flag di confidenza** (non lossless — vedi §raffinamenti #4); (b) **self-election come verificatore** (modello C scelto, utente 2026-06-24): l'expert si auto-nomina per validare un output downstream nel suo dominio → blackboard-claim + arbitraggio leggero dell'orchestratore (non autonomo puro); (c) **over-declaration** indotta da reward mal-disegnato → riconoscere che dichiarare limiti *ovunque* è anch'esso un anti-pattern.
- **Fase curriculum**: **fase 3** (Wave 7-8+, richiede registry di vertical + harness); il riconoscimento del limite di dominio (Area 11 capability-limit) si imposta in **fase 2**.
- **Reward design**: **Q+L ancorato all'OUTCOME** (difesa #12, critica): reward al recruit **solo se** la parte non coperta sarebbe **realmente risultata sbagliata** senza il vertical reclutato (verificabile a posteriori); **reward negativo** per self-limit mancato **quando** la parte non-dichiarata è poi risultata errata (non per il non-dichiarare in astratto). Il **completeness-gate** è la rete di sicurezza, non il self-assessment da solo.
- **Hack-check**: 🔴 **participation-hack esplicito** (preoccupazione utente 2026-06-24): l'expert può **reclutare/auto-eleggersi ovunque** per massimizzare coinvolgimento e reward; speculare, può **sotto-dichiarare** per non "ammettere debolezza". → **Ancorare all'outcome verificabile** ("il recruit/la dichiarazione ha evitato un errore REALE?"), **mai** alla partecipazione; modello (C) blackboard-claim + arbitraggio per controllo/audit; cross-check su task ad alto rischio. → [[../concepts/reward-hacking-mitigation]] #12 + EXP-ME-9; [[../concepts/multi-expert-collaboration]] §raffinamenti #1,#5; [[../concepts/out-of-domain-refusal-training]].

---

## Note di chiusura

- **Overlap da sorvegliare** (audit §A): `trajectory-efficiency` (Q+L) vs `trajectory-critique` (L) sono **due facce** (esegui-efficiente vs giudica-traiettoria) — tenerle distinte nel reward per non **double-counting**; idem `action-consequence-prediction` (a priori) vs `trajectory-critique` (a posteriori) vs decision-point-lookahead nota 9 (Area 2). I tre formano un **triangolo metacognitivo sulle azioni**: a-priori / durante / a-posteriori.
- **Dipendenza da harness**: 8 foglie su 11 sono **fase 3** (RL agentico con pi) — questa area **non è completabile senza l'environment**. Solo `trajectory-critique` e `action-consequence-prediction` hanno una componente fase-2 statica significativa.
- **Filo rosso reward-hacking**: l'intera Area 8 è **🔴 ad alta esposizione** a participation-hack (call/recruit/verifica "per sembrare attivo"). Il principio **first-class** ([[../concepts/reward-hacking-mitigation]] #12) — reward ancorato all'**outcome**, mai alla partecipazione — è il vincolo dominante di quest'area.

## Linked
- [[README]] §4 Area 8 (backbone) · [[_coverage-audit-2026-06-23]] (gap #2,#3,#4,#7)
- [[../concepts/multi-expert-collaboration]] (routing, handoff, recruit, self-election — paper-claim #6)
- [[../concepts/temporal-awareness-timestamps]] (wait-vs-retry, §A/§B)
- [[../concepts/reward-hacking-mitigation]] (hack-check, principio #12 first-class)
- [[../concepts/_user-notes-2026-06-23]] (nota 6b trajectory-critique, nota 9 lookahead)
- [[../decisions/2026-06-23-pi-harness-base]] (harness fase 3) · [[../concepts/out-of-domain-refusal-training]] (recruit fallback)

## Sources
- [[README]] §4 Area 8 — backbone (topic, foglie, tag, skill).
- User notes 2026-06-23 (nota 6b trajectory-critique) + 2026-06-24 (recruit dinamico, self-election, producer–verifier).
- Schema canonico §3 del README (template foglia: skill-target + 5 classi + hint forte→debole + fase + reward + hack-check).

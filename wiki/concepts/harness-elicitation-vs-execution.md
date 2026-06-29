---
name: harness-elicitation-vs-execution
description: Finding sperimentale (2026-06-29) — l'harness <context> ELICITA in modo affidabile la considerazione giusta che il modello vanilla omette, ma su un modello piccolo/non-addestrato elicitare ≠ eseguire; il training (S) converte elicitazione→esecuzione affidabile. Affina la tesi training-vs-harness.
type: concept
tags: [harness, training-vs-harness, dogfood, contradiction-detection, foresight, evaluation, reward-anchoring]
sources:
  - harness/src/_dogfood-latent-foresight.mjs
  - harness/src/_dogfood-contradiction.mjs
  - harness/src/_dogfood-multistep.mjs
last_updated: 2026-06-29
---

# Harness: elicitazione vs esecuzione

> **Catena why → problema → soluzione.**
> **Why**: dobbiamo sapere *dove* il nostro metodo-harness ha basi fondate (utente msg 364, "test difficile per certezza su casi reali"), senza overclaim.
> **Problema**: i primi test mostravano un effetto netto sui task dove il comportamento prudente NON era prompted (delete secco), ma **pari** dove il requisito futuro era ESPLICITATO. Serviva isolare la variabile: cosa succede quando la trappola è **latente** (il modello deve anticiparla da solo)?
> **Soluzione**: due test con trappola **non esplicitata** (msg 364 + 369), 3 trial ciascuno → il finding qui sotto.

## Il finding in una riga

L'harness `<context>` (rules + stato strutturato) **ELICITA in modo affidabile** la considerazione corretta che il modello vanilla **omette**; ma su un modello piccolo/non-addestrato **elicitare ≠ eseguire**. Il **training (S)** è precisamente ciò che converte l'elicitazione in **esecuzione affidabile**. `[EXTRACTED]` dai due test sotto.

→ È l'argomento **PRO-SLM**, non contro l'harness: il guscio fa emergere la skill latente; il training la rende default ed eseguita correttamente anche su trigger impliciti. Vedi [[training-vs-harness-classification]].

## Setup sperimentale

- **Provider**: Gemini reale via endpoint OpenAI-compat. `gemini-3.5-flash` era 503 (sovraccarico) + poi 429 (quota) → usato **`gemini-3.1-flash-lite`**. Key in `harness/.env` (gitignored, mai stampata — [[feedback_no_pii_in_repo]]).
- **MODO-B = nostro `<context>`** assemblato dal datastore (`vars-queue` → `context-assembler`): rules + task + (Test B) decisione D1 strutturata.
- **MODO-A = vanilla**: stesso task, nessun `<context>`.
- **Giudice**: stesso modello, prompt separato con criterio rigoroso single-axis; caveat **scorer≠scored** dichiarato (il giudice è lo stesso modello → segnale indicativo, non oracolo).
- **Anti-rumore**: 3 trial per scenario (il modello è non-deterministico).

## Test A — foresight latente (currency)

Scenario pagamenti: introdurre `currency`; le righe storiche sono EUR **solo per convenzione implicita**. Variante "latent" di `_dogfood-multistep`: il requisito di audit FASE-3 è **rimosso**, resta solo un accenno **informale** del fondatore ("un giorno forse fuori dall'eurozona", nessun requisito formale). Le rules MODO-B sono principi generali (`verified-vs-inferred`, `future-phase-impact`) che **non nominano** la trappola.

**Trappola**: backfill secco `DEFAULT 'EUR'` / `UPDATE SET 'EUR'` → perdita **irreversibile** della distinzione "EUR verificato" vs "EUR assunto".

| | Solleva la provenance? | Esegue bene (preserva)? |
|---|---|---|
| **Vanilla (A)** | **0/3** | 0/3 — sempre `DEFAULT 'EUR' NOT NULL` |
| **Nostro `<context>` (B)** | **3/3** (sezione [O]/[A] esplicita) | **~1/3** — 2/3 ragiona giusto poi si auto-contraddice con `UPDATE` secco |

Esito giudice (rigoroso, criterio = preserva-vs-distrugge provenance): **B-win 1/3, pari 2/3**. Il giudice penalizza correttamente il *talk-but-fumble*: il MODO-B dice "non sporcare i record storici, distinguere osservato da assunto" ma poi (su lite) spesso esegue comunque il backfill distruttivo. `[EXTRACTED]`

**Lettura**: il `<context>` sposta il modello da "non ci pensa affatto" (0/3) a "lo considera esplicitamente ogni volta" (3/3) — ma su un modello debole non basta a garantire l'esecuzione corretta. Un modello più forte / il nostro SLM addestrato convertirebbe l'elicitazione in esecuzione affidabile.

## Test B — contradiction-detection (caso reale, nostro research-gap)

Deriva dai due gap originali del progetto ([[project_research_gaps]]): **structured update injection** (#1) + **contradiction-detection layer** (#2). Decisione D1 di FASE-1 (la pipeline deduplica gli utenti per `email`, **assunzione**: 1 email univoca per utente) **contraddetta** da un requisito successivo (SSO: un `user_id`, più email). Il requisito SSO **non dice** "rivedi la dedup": il modello deve accorgersene.

**Equità**: entrambe le condizioni ricevono gli **stessi fatti** (D1 + assunzione + requisito SSO) → non è un test di memoria. L'unica differenza è il **metodo**: MODO-B ha D1 come **decisione strutturata** nel `<context>` (`var D1_dedup`) + la regola `contradiction-check`; il vanilla riceve D1 come prosa.

| | Rileva il conflitto con D1? |
|---|---|
| **Vanilla (A)** — D1 in prosa | **2/3** (1 volta costruisce lo schema giusto ma NON nomina che la dedup è rotta) |
| **Nostro `<context>` (B)** | **3/3** — apre con "ANALISI CONFLITTO: invalida ASSUNZIONE D1", poi §4 "logica D1 deprecata → `user_id`, migrare i dati" |

Esito giudice: **vince B 3/3**. Verificato sul **contenuto reale** (non allucinazione del giudice): nel trial discriminante il vanilla implementa correttamente `user_identities` ma tratta il task come schema nuovo, **mancando** che la dedup esistente si rompe; il MODO-B guida esplicitamente con il blocco "ANALISI CONFLITTO (PRIMA DI PROCEDERE)". `[EXTRACTED]`

### Caveat onesto (sotto-rappresentazione)

Il conflitto è **co-locato** in un prompt corto → anche il vanilla lo becca 2/3. Il valore **pieno** del contradiction-layer = D1 ricordata **dopo molti turni / oltre una compaction**, dove il vanilla la dimentica del tutto e solo il nostro **datastore persistente** (`.pi/state/vars.db`, sopravvive al compact — [[cross-session-state-sharing]]) la risuperficia. → test **long-horizon con pi end-to-end** ancora da fare (gated; tracciato in `wiki/todo.md`). `[INFERRED]`

## Implicazioni

1. **Reward design (training Tier-1)**: questi test confermano la regola di **ancoraggio all'outcome** ([[feedback_reward_hacking_principle]]). Premiare la *forma* (il MODO-B "parla" di provenance in Test A) sarebbe reward-hacking: il giudice rigoroso premia solo l'**esecuzione** corretta (DB che preserva la distinzione). Il training deve chiudere il gap elicitazione→esecuzione, non premiare la cerimonia. Vedi anche il check anti-"catena-fantasma" in CLAUDE.md #10.
2. **Cosa addestrare**: la skill `contradiction-check` e `verified-vs-inferred` sono `F+S` — il floor harness (rule nel `<context>`) le **elicita**; il training le rende **default eseguito** anche su trigger impliciti e oltre la distanza di contesto. Coerente con [[situational-policy-table]] (stato-S DEGRADATA-MA-UTILE).
3. **Valutazione del metodo**: il valore dell'harness si misura meglio come **delta-di-elicitazione + affidabilità**, non come win/lose secco su un singolo task. Su task dove il comportamento prudente è già prompted, o dove il modello è già competente, il delta si comprime (≈ pari) — non è un fallimento del metodo ma la sua **proporzionalità**.

## Collegamenti

- [[training-vs-harness-classification]] — il playbook F/S che questo finding affina (F elicita, S esegue).
- [[external-update-injection]] + [[cross-session-state-sharing]] — il meccanismo che renderebbe il Test B long-horizon discriminante.
- [[structured-thinking]] — il pattern [O]/[A]/[P]/[V] visibile negli output MODO-B.
- `wiki/concepts/wrapper-context-assembly-example.md` — come il `<context>` è assemblato.

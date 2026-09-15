# Verifiers — spec dei gold-example

Ogni gold-example ha un **reward = verifier deterministico** (setup fixture + assert oracoli).
Questo dir contiene gli spec estratti dai gold, eseguiti da `.pi/extensions/verifier-sandbox.ts`
(tool `run_verifier`).

## Formato spec (input di `run_verifier`)

```json
{
  "setup": [
    "git init -q",
    "printf 'def parse(): pass\\n' > parser.py",
    "git add -A && git commit -qm init"
  ],
  "asserts": [
    { "cmd": "git ls-files --error-unmatch parser.py", "expect_exit": 0 },
    { "cmd": "python -c 'import parser'", "expect_exit": 0 }
  ]
}
```

- `setup` → semina lo stato verificabile (la **sandbox-fixture** del gold, §2bis).
- `asserts` → gli **oracoli ancorati all'OUTCOME** (exit == expect → pass). Vedi
  `slm/wiki/training-taxonomy/gold-methodology.md` (oracolo-unificato, predicato-vs-esecuzione).

## Scene — la spec che AVANZA fra i turni (`turns` · `pair` · `prompts` · `probe`) — 2026-09-11

ADR `wiki/decisions/2026-07-26-fixture-runner-proposta.md`, costruita in tre punti. Una **scena** è una spec con tre campi in più, tutti opzionali; senza, il comportamento è quello della spec classica.

```json
{
  "_meta":   { "class": "class-…", "requires_agent": true },
  "setup":   [ "…" ],
  "turns":   [ { "after_turn": 1, "apply": [ "…il mondo cambia DOPO il turno 1…" ] } ],
  "asserts": [ { "cmd": "…", "expect_exit": 0, "note": "①: …" } ],
  "probe":   "cat decisione.txt",
  "prompts": [ "prompt del turno 1", "prompt del turno 2" ],
  "pair":    { "vary": "cosa cambia fra i bracci", "arms": [ { "name": "A" }, { "name": "B", "setup_extra": [ "…" ], "asserts": [ "…" ] } ] }
}
```

- **`turns`** — dopo il turno *k* la sandbox esegue `apply`. Numero di turni = `max(after_turn) + 1`: l'agente agisce **almeno una volta dopo l'ultima mutazione** (altrimenti «accorgersi» non è misurabile). Un agente che fallisce è un **dato** (`agentErrors`); una mutazione che fallisce è un **difetto di fixture** (`setupError`).
- **`pair`** — la stessa scena in più bracci: ogni braccio = spec + `setup_extra` (in coda) e `turns`/`asserts`/`prompts`/`probe` sostituiti se dati. `probe` descrive l'**azione** e `invariant` dice se coincide fra i bracci (il ① di norm-invariance; `require_invariant: true` lo esige). Per le coppie **a contrasto** (P-COPPIA: in un braccio il fenomeno c'è, nell'altro no) bastano gli assert per-braccio.
- **`prompts`** — uno per turno, per un **modello vero** (`node eval/run-scene.mjs <scena>`; provider `EVAL_PROVIDER`, `MODEL_ID`; `--no-pair` per la scena sola). Un braccio = una sessione **nuova**.
- **`requires_agent`** — `sandbox/run-all.mjs` salta la scena (senza agente gli assert misurerebbero il nulla): la gradano i **lab** con le loro policy a intelligenza zero, o `run-scene` con un modello.
- **Lab di una scena** (`*-lab.mjs`, `@misura class-…`): esegue ≥3 policy fisse + il gold con `runScene`/`runPair` (`sandbox/run-spec.mjs`) e **stampa la tabella**; spedibile solo se il gold batte tutte le policy (playbook §4: «un attacco descritto non conta»). Esempi: `self-sealing-lab`, `consumption-scale-lab`, `design-artifact-lab`, `module-boundary-lab`.
- **Batch con denominatore**: `node eval/run-scene-batch.mjs <scena> --models a,b --n 3` → `k/n` per assert e per modello. ⚠️ Non modificare runner o scene **mentre** un batch gira (ogni spawn rilegge da disco).

### Le scene che esistono (2026-09-12) — ognuna ha il suo `*-lab.mjs` nel gate

| Scena | Coppia (cosa varia) | Classe misurata |
|---|---|---|
| `self-sealing-A1-canary` | la premessa **scade** / è **definitiva** | self-sealing-decision (reward ① e polo N1) |
| `self-sealing-noise` | **k = 0/3/8** turni di rumore fra decisione e regressione | self-sealing-decision (decadimento) |
| `consumption-scale-budget` | budget **scarso 4 / abbondante 20** | consumption-scale-for-budget (①②③) |
| `consumption-scale-midway` | il budget **scende a metà** (20→4), k = 0/4 | consumption-scale-for-budget (④: correggi la *strategia*) |
| `consumption-scale-lost` | il compito **diventa impossibile** / resta fattibile | consumption-scale-for-budget (avvisa **presto**, falso abort) |
| `design-artifact-two-times` | la posta: **vale un documento / banale** | design-artifact-lifecycle (①②③④ + N1) |
| `design-artifact-noise` | **k = 0/3/8** turni di lavoro fra documento e deviazione | design-artifact-lifecycle (decadimento) |
| `module-boundary-gate` | **una regola / due regole** che divergono | module-boundary-flow-convergence |
| `retroactive-noise-hook` | **k = 0/2/5/10** + braccio **«ritira»** | retroactive-decision-propagation (ricollega **o disarma**) |
| `gate-concordance` | i candidati nascosti hanno **esche / sono piani** | verification-discipline (**fase 3**: il gate lo costruisce il modello) |

> 🔴 **Come si LEGGE la tabella del batch** (regola nata da tre errori in due giorni, 2026-09-12): la colonna `PASS k/n` — **tutti** gli assert del braccio — è l'unica cifra con cui si rivendica un successo. Le colonne `a1…aN` per-assert servono a **spiegare un fallimento**, mai a dichiarare una riuscita: un assert-reward può passare **perché il compito non è stato fatto** (canary non spento → è il canary a bloccare il BUG; export rotto → «nessuno esporta X»). Per questo ogni assert-reward ha in scena il suo **gemello di controllo**: leggili **insieme**, e specialmente quando il numero piace.
>
> **Audit del 2026-09-12 su tutte e dieci le scene — dove sta il gemello**: nel canary e in `self-sealing-noise` è **accanto** (*il canary è spento* · *la release pulita è in prod*); in `module-boundary` è accanto (*tenuta* ↔ *controllo*); in `retroactive-noise-hook` i due assert **si controllano a vicenda** (*ricollegato* ↔ *non neutralizzato*); nelle scene di `design-artifact` e `consumption-scale-midway` il reward stesso esige il lavoro fatto, quindi il non-fare cade da sé. ⚠️ **L'eccezione che conta**: in `consumption-scale-lost` il controllo del braccio **perso** vive nel braccio **fattibile** (dichiarare *infeasible* senza sondare passa tutti e quattro gli assert del perso, e viene punito solo dal falso-abort nel gemello) → lì **anche il PASS di un singolo braccio non è una notizia**: l'unità di lettura è la **coppia**. Regola generale che ne esce: *l'unità di lettura è il livello a cui vive il controllo* — assert, braccio o coppia — e la scena deve dire quale.

> ⭐ **E dal 2026-09-15 il gemello non e' piu' solo una nota: la scena lo DICHIARA e il runner lo legge.** Un assert puo' portare `"control": <n>` — l'indice 1-based di un **altro assert dello stesso braccio** che dice *«il compito e' stato davvero fatto»*. Se il reward passa e il suo controllo cade, `run-spec` marca `perAssenza: true` e la tabella del batch stampa **⚠** su quella colonna: quel `k/n` **non si puo' leggere come riuscita**. Il verdetto di scena **non cambia** (resta la congiunzione di tutti gli assert) — cambia cio' che si puo' leggere dalle colonne per-assert, che e' esattamente dove l'errore era nato (F45: *«reward ① 2/2»* era 1/2). Un `control` che punta fuori range o a se stesso e' un **difetto di fixture**: la scena non parte, e non si spende un run di modello per scoprirlo.
>
> **Dov'e' cablato oggi**: `self-sealing-A1-canary` e `self-sealing-noise` (reward ① ← *il canary e' spento*, in entrambi i bracci del canary) · `module-boundary-gate` (①-tenuta ← ①-controllo, in entrambi i bracci) · `retroactive-noise-hook` (*ricollegato* ↔ *non neutralizzato* si controllano **a vicenda**; nel braccio «ritira» *disarmato* ← *hook ancora sano*). ⚠️ **Residuo dichiarato**: dove il controllo vive nel braccio **gemello** (`consumption-scale-lost`) il campo non lo esprime — li' l'unita' di lettura resta la **coppia**, e vale il paragrafo qui sopra. Nelle scene di `design-artifact` e in `consumption-scale-midway` non c'e' campo perche' non serve: il reward stesso esige il lavoro fatto.

**Come si gradano con un modello vero**: `EVAL_PROVIDER=openrouter MODEL_ID=qwen/qwen3.6-27b node eval/run-scene-batch.mjs verifiers/<scena>.json --models <slug> --n 3 --arm vanilla|ours`. Gli esiti per modello stanno in `wiki/harness-experiment-log.md` (F41-F45) e nella vista per-modello §0.

## Mapping gold → spec

Estrai `§2bis` (sandbox-fixture = `setup`) + i blocchi LABEL/oracolo (= `asserts`) di ogni gold.

**TODO (chiude il loop di validazione gold)**: estrarre gli spec dei 3 draft del pilota
(`slm/wiki/training-taxonomy/gold-example-area02-{1.2,3.2,6.2}.md`) + del template 1.1, farli
girare con `run_verifier`, e correggere i bug-oracolo che i review agnostici hanno segnalato
(es. 1.2 P0-1 `sha256` non-ancorato). → rimuove il marker `[UNVERIFIED]` dai gold.

---
name: ab-eval-harness
description: "Infrastruttura A/B per misurare l'effetto dell'harness (pi vanilla vs pi+nostre-estensioni) su task di coding con reward oggettivo. Modo 1 (agentico per-task) su HumanEval, gemini-3.1-flash-lite. Config-driven, isolata, resiliente al rate-limit."
type: architecture
tags: [eval, ab-test, harness, humaneval, gemini, pi-sdk, modo-1, isolation]
last_updated: 2026-07-04
sources:
  - "Utente TG msg 1023/1026/1028/1029/1031 (2026-07-04): A/B vanilla-vs-nostro, config nativa, keepTurns, key free"
  - "Codice harness/eval/ + smoke/validazione E2E 2026-07-04"
  - "pi docs: sdk.md (createAgentSession/ResourceLoader), models.md (google-generative-ai), extensions.md (--no-extensions)"
---

# A/B eval harness — pi vanilla vs pi + nostre estensioni

## Scopo [EXTRACTED]

Misurare **se l'harness (le nostre `.pi/extensions`) migliora, mantiene o regredisce** qualità/tempi rispetto a pi liscio, e **se crea buchi** (conoscenza/timeline) — con un modello ospitato neutro (**gemini-3.1-flash-lite**, NON ancora il nostro SLM). Reward **oggettivo** = test ufficiale del task. Idea utente: A/B pulito dove l'UNICA differenza tra i bracci sono le nostre estensioni di contesto.

- **Braccio vanilla** = `pi --no-extensions` (0 estensioni, pi puro).
- **Braccio ours** = pi + tutte le 20 `.pi/extensions/*.ts` (context-assembly, nested-compact, native-window, vars-queue, secrets-guardrail, …).

## Architettura (pipeline) [EXTRACTED]

```
fetch-humaneval.mjs  → eval/data/humaneval-N.jsonl   (subset, gitignored)
        │
run-ab.mjs (orchestratore, SEQUENZIALE)
   per (task × config):
     ├─ mkdtemp workdir + state-dir ISOLATI
     ├─ spawn run-one.mjs (worker SDK, 1 processo)   ← isolamento per-run
     │     · provider Gemini NATIVO in-memory
     │     · braccio: 0 ext (vanilla) | 20 ext (ours)
     │     · il modello implementa solution.py (write/bash agentico)
     │     · cattura ms/turni/tool/token/hasContext/apiError
     ├─ verify.mjs: grada col test ufficiale HumanEval → PASS/FAIL
     └─ retry+backoff se errore-API (429); errori-API esclusi dal pass-rate
        │
   aggrega per config → tabella + eval/data/report-<label>.json
```

File: `harness/eval/{fetch-humaneval,run-one,verify,run-ab}.mjs`.

## Decisioni chiave [EXTRACTED]

1. **Provider Gemini NATIVO** (`api:"google-generative-ai"`, baseUrl `.../v1beta`, `authHeader:false`). L'auth nativo di Google NON è `Authorization: Bearer` (è `?key=`/`x-goog-api-key`) → mettere `authHeader:true` dava **empty-reply silenzioso** (verificato: primo smoke fallito → fix → "OK" 778 tok). Il bug `store`→HTTP400 esiste **solo** sulla strada OpenAI-compat; il nativo non ha campi OpenAI-only → **niente `gemini-compat.ts`** (resta fallback). Così vanilla = pi puro che funziona (zero nostro codice). Config-only, come richiesto (utente msg 1028).
2. **Isolamento = un processo per run + `HARNESS_STATE_DIR`.** `STATE_DIR` è valutato all'import e le connessioni DB sono memoizzate per-processo → l'unico isolamento pulito è "un processo, un state-dir". Il worker gira in un workdir dedicato (cwd) con `HARNESS_STATE_DIR` assoluto isolato → zero cross-talk tra run e col `.pi/state` reale della TUI viva. Fix meccanismo: `state-paths.mjs` legge `HARNESS_STATE_DIR` (test `state-paths-isolation.test.mjs` 12/12). Vedi [[context-pressure-mechanism]] per la config.
3. **cwd ⟂ estensioni** (pi SDK `ResourceLoader`): worker con `cwd=workdir` (dove il modello scrive) + estensioni caricate per path esplicito (`additionalExtensionPaths`) → il modello opera nel workdir isolato MA con l'harness completo. Vanilla = loader su dir vuote (0 ext).
4. **keepTurns config-driven** via env `HARNESS_NATIVE_KEEP_TURNS` (SSOT [[architecture/context-pressure-mechanism|harness-config]]) → sweep {1,3,6} sul braccio ours senza toccare file.
5. **Headless auto-approva i confirm** (`ctx.ui.confirm→true`): in un eval automatico non c'è umano; i gate interattivi (pre-flight/secrets) non devono deadlock-are/negare le azioni legittime di coding. **Assunzione dichiarata**: l'A/B misura l'effetto CONTESTO/MEMORIA, non i gate interattivi.
6. **Reward = verifier HumanEval ufficiale** (`solutionCode + task.test + check(entry_point)` eseguito in tempdir isolato, exit 0 = PASS). Il `test` è NASCOSTO (il modello riceve solo `prompt`). Self-test oracolo: canonical→PASS, rotto→FAIL, **8/8**.

## Metriche raccolte [EXTRACTED]

Per run: `passed` (verifier) · `ms` (wall-clock) · `turns` · `toolCalls` · `tokens` (contesto totale) · `hasContext` (`<context>` iniettato) · `wroteFile` · `nExt` · `httpStatus`/`apiError`. Aggregate per config: pass-rate (sui non-errore-API), avg ms/turni/token/tool, ctx%, wrote%.

## Validazione E2E (2026-07-04) [EXTRACTED]

- Worker vanilla: HE/0, 3 turni, write+bash, solution su file, 0 ext, `hasContext=false`. ✓
- Worker ours@keep6: HE/0, **20 ext**, `hasContext=true`, state-dir isolato (conversations.db nel dir dedicato). ✓
- Verifier oracle: 8/8 (canonical/rotto su 4 task). ✓
- Orchestratore (3 task × {vanilla, ours@6} = 6 run): pipeline completa, report scritto. ✓

## Finding preliminari [EXTRACTED — n basso, non conclusivi]

- **Entrambi i bracci risolvono** i task facili (HE/0,1,2).
- **Token: l'harness costa ~3-4×** — es. HE/0: 7.5K (vanilla) vs 49K (ours); media giro-piccolo ~6.5K vs ~22.8K. Su task FACILI dove entrambi risolvono è **overhead puro** (nessun guadagno di qualità).
- `<context>` iniettato solo su ours (100%) = harness attivo.

**Interpretazione [INFERRED]**: su task facili/single-shot l'harness è costo senza beneficio; il suo valore (memoria/contesto/timeline) è atteso su lavoro **difficile e multi-turno** → **Modo 2** (sessione multi-task) + task HumanEval più ostici. Il Modo 1 su task facili verifica soprattutto **"l'harness non rompe / non regredisce"** — finora confermato. Coerente con la validità sollevata a design-time ([[todo]] §Test dell'harness).

### Modo 1 — task OSTICI (2026-07-04, 5 task algoritmici: find_zero/is_sorted/minPath/is_nested/order_by_points) [EXTRACTED — n=5, 1 run/cella, rumoroso]

Quadro completo {vanilla, ours@1, ours@6}:

| config | pass% | avg turni | avg token |
|---|---|---|---|
| vanilla | **100%** (5/5) | 13 | 56K |
| ours@keep6 | **80%** (4/5) | 5 | 49K |
| ours@keep1 | **40%** (2/5) | 11 | **139K** |

Per-task turni (vanilla→@6→@1): HE/32 17(P)→2(P)→15(**F**,190K tok) · HE/126 6(P)→4(P)→6(P) · HE/129 5(P)→6(P)→6(P) · HE/132 18(P)→6(P)→17(**F**) · HE/145 19(P)→7(**F**)→13(**F**).

🔴 **Finding non-banale (critica oggettiva)**:
1. **`ours@6` converge più in fretta** (5 vs 13 turni) MA ha **regredito** HE/145 (convergenza prematura: dà una risposta "sicura" in pochi turni invece di iterare come il vanilla).
2. **`ours@1` è CATASTROFICO su task singoli hard**: pass 40%, e i **token ESPLODONO** (139K = 2.5× vanilla; HE/32 keep1 brucia 190K token e fallisce vs 9.8K/PASS a keep6 = **20×**).

**Causa [INFERRED, forte]**: a `keep1` la finestra nativa mostra SOLO l'ultimo turno → su un task che richiede 15+ iterazioni il modello **non vede i propri tentativi precedenti** → ripete errori, itera alla cieca, e ogni turno **ri-inietta il grosso `<context>`** → token esplodono e non converge. **Le nostre lane preservano lo STATO STRUTTURATO (aim/task-list/tool-calls) ma NON la storia fine di ragionamento/tentativi** che serve al debug iterativo DENTRO un task → a `keep1` quello è un **BUCO reale** (i "buchi di conoscenza" temuti dall'utente, msg 1023).

⚠️ **Regime**: `keep1` è progettato per il **long-horizon** (memoria CROSS-task su sessioni lunghe, dove tenere tutta la storia nativa esploderebbe), NON per il singolo task hard → qui è fuori-scopo/patologico. Il vero test di `keep1` è il **Modo 2**. **Design implication [track]**: la native-window forse non deve essere un "tieni ultimi N turni" piatto — valutare preservazione diversa dell'iterazione intra-task. NON un win pulito dell'harness. Report: `report-hard.json` + `report-hard-keep1.json`.

> **⚠️ CORREZIONE (diagnosi tracciata HE/145, 2026-07-05)**: l'ipotesi "convergenza prematura" per `ours@6` è **REFUTATA**. Ri-tracciando HE/145 (vanilla 2/2 PASS, ours 4/4 FAIL, ~3× token), `ours@6` fa **17 turni** (non 7) e fallisce lo stesso: NON si ferma presto. Meccanismo reale = **fissazione sul sotto-problema sbagliato** (permuta il tie-breaking ~10 turni invece di riquestionare `digit_sum(abs)` errato sui negativi). NON tool-mancanti (non usa note/facts, irrilevanti qui), NON lane-non-preservano (ri-testa con bash ogni turno). → ipotesi **H6** (il `<context>` 12.7K diluisce il ragionamento del modello piccolo). Diagnosi completa + report turn-by-turn + assi di miglioramento: **[[concepts/adaptive-context-injection]]** + `harness/eval/data/trace/REPORT-he145-ours-k1.md`.

## Operatività — rate-limit key FREE [EXTRACTED]

La key Gemini è **free/rate-limited** (utente msg 1031). Dopo ~4-5 run consecutivi → **429** e Gemini restituisce una **risposta VUOTA silenziosa** (tok=0, ~300ms, no soluzione): NON è un fallimento di capacità del modello. Gestione: `run-one` cattura `httpStatus`/`apiError`; `run-ab` fa **retry+backoff** (default 30s) ed **esclude gli errori-API dal pass-rate**. → lanciare **sequenziale, un test alla volta**, con delay ampio (~15s).

## Modo 2 — long-horizon (utente TG msg 1035, 2026-07-04) [EXTRACTED]

Chiarimento utente: il target vero è **long-horizon** (traiettorie LUNGHE dove il contesto si ACCUMULA su molti turni), NON il task singolo difficile (17 turni su find_zero = 17 tentativi sullo stesso mini-problema, il contesto non cresce). Design Modo 2: **UNA sessione, N task coding in fila senza reset** → il contesto cresce → è LÌ che keepTurns/lane-memory contano e dove emergono i "buchi di conoscenza/timeline". + **probe di memoria/timeline** finale ("senza rileggere i file: quali problemi hai risolto e in che ordine?" / "riusa l'helper del task 2") su {vanilla, ours@1, ours@6}. `@1` = caso critico (finestra nativa=1 turno → il modello DEVE ricordare dalla lane). Worker `harness/eval/run-session.mjs` (in costruzione).

## SWE-bench Lite (utente TG msg 1036) — scaricato, esecuzione GATED su Docker [EXTRACTED]

- **Scaricato** (metadata only, sicuro): `harness/eval/fetch-swe-lite.mjs` → `eval/data/swe/swe-bench-lite.jsonl`, **300 task**, 12 repo OSS **mainstream** (astropy/django/matplotlib/seaborn/flask/requests/xarray/pylint/pytest/scikit-learn/sphinx/sympy). Fonte ufficiale `princeton-nlp/SWE-bench_Lite`.
- **Sicurezza [EXTRACTED]**: NON malware — sono bug reali di OSS mainstream. Il rischio è l'**ESECUZIONE di codice non fidato** (test-suite repo + patch del modello) → mitigazione = **Docker isolato** (design ufficiale SWE-bench), NON "auditare i repo". "Lite"=300 curati · "Verified"=500 human-validated. Contaminazione-dati = tema di VALIDITÀ separato (→ Verified/decontamination).
- **BLOCCO**: Docker daemon **GIÙ** (`dockerDesktopLinuxEngine` non risponde) → nessun task SWE eseguibile finché l'utente non avvia Docker Desktop. SWE-bench è long-horizon VERO (esplora+edita repo multi-file su molti turni) → naturale evoluzione del Modo 2, ma richiede l'harness agentico-su-repo + sandbox (build sostanzioso, da fare a Docker su).

## 🗣️ DA DISCUTERE (aperto, 2026-07-05 — utente TG msg 1045) [AMBIGUOUS — ipotesi, non concluso]

Sollevato dall'utente: *"se abbiamo note/facts/decision-log APPOSTA per preservare conoscenza, perché ci sarebbe un buco a keep1?"*. Riconciliazione (da validare sui log tracciati HE/145, in corso):

- **Due memorie diverse**: (1) **durabile-semantica** (nickname/decisione/fatto/var) → è lo scopo di `note`/`facts`/`decision-log`/`set_var`, risolve l'amnesia da eviction ([[concepts/... verification-loop amnesia]]); (2) **di-lavoro-effimera intra-task** ("v1→errore X, v2→errore Y") → vive nella FINESTRA NATIVA. Il buco ipotizzato su HE/145 è del tipo (2), che quei tool NON sono progettati a coprire → in prima battuta **complementari, non sovrapposti**.
- **Ma potrebbe essere AWARENESS, non preservazione** (H2 da validare): la lane `last_tool_calls` mostra le tool-call recenti (incl. output test bash). Se conteneva i tentativi precedenti, l'iterazione ERA disponibile — solo in lane, non nell'array nativo → il "buco" sarebbe *"il modello non legge la lane"* = **stessa causa-radice L1 dell'amnesia da eviction** (il modello sotto-legge le lane nel system prompt), fix = **awareness + training**, NON nuovi tool. Da confermare guardando il `<context>` reale.
- **Nota design (native-window non-piatta)** [utente: "ne parliamo dopo"]: valutare se la finestra nativa debba preservare diversamente l'iterazione intra-task invece di un flat "tieni ultimi N turni" (es. tenere l'ultimo tentativo+errore anche sotto keepTurns basso). **Da discutere dopo la validazione.**
- **Assi di miglioramento** (dipende da quale ipotesi regge): **tools** (nuovo meccanismo per iteration-state) · **awareness** (far attendere il modello alle lane) · **context** (lane iteration-history / keepTurns-floor) · o è il **prompt dell'eval** (H5: "scrivi-solo-il-file-senza-spiegazioni" sopprime l'iterazione → harness-independent).

## Prossimi step [EXTRACTED]

- **Modo-1 hard @1**: in corso (`ours@keep1` sui 5 ostici) → completa {vanilla, ours@1, ours@6}.
- **Modo 2 long-horizon**: costruire `run-session.mjs` + lanciare {vanilla, ours@1, ours@6} + probe.
- **SWE-bench**: harness agentico-su-repo + Docker sandbox, quando Docker è su + go utente.
- **Benchmark ufficiale di pi** (dev di pi) con qwen — follow-up non-prioritario.
- **DRY [track]**: `run-one.mjs` e `run-session.mjs` condividono il setup provider/loader/UI → estrarre in `eval/_pi-session.mjs` (rule #16). Fatto dopo che i run in corso rilasciano `run-one.mjs`.

## Links

[[architecture/context-pressure-mechanism]] (config harness + keepTurns/pressure) · [[project_test_model_vs_target]] (il modello di test ≠ target) · [[feedback_handoff_validation_gate]] (validare E2E prima di dichiarare) · [[feedback_document_findings_always]] · `harness/eval/*`.

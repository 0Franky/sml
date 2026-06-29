---
name: 2026-06-29-monorepo-itlmv1
description: ADR — il progetto adotta un monorepo unico `ITLMv1` con subdir piani (wiki/ SSOT + lm/ + harness/) e un solo knowledge-graph. Reversal della decisione iniziale "repo separati". Decisione utente msg 319/323.
type: decision
status: accepted
tags: [decision, repo-structure, monorepo, ssot, graphify, harness, lm]
sources: [user msg 2026-06-29 (314, 319, 323)]
last_updated: 2026-06-29
---

# ADR 2026-06-29 — Monorepo `ITLMv1` con SSOT centralizzata

## Status
**Accepted** (utente msg 323, 2026-06-29). Supersede la reco iniziale "repo separati" (mia, msg 312) e la risposta intermedia "due cartelle in un repo" (msg 314).

## Contesto
Il progetto ha due sub-progetti di codice — **LM** (training/eval/data) e **HARNESS** (wrapper pi + serving + verifiers) — più una **wiki di ricerca** (design-knowledge) e un **knowledge-graph** graphify. Inizialmente avevo raccomandato `harness/` come **repo separato** dalla wiki (`wiki di ricerca ≠ codice wrapper`). L'utente (msg 319) ha fatto **reversal**: il vantaggio di **un solo grafo + una sola wiki** (SSOT centralizzata) supera lo split. msg 323 ha fissato la struttura esatta.

## Catena: why → problema → soluzione
- **WHY**: la conoscenza del progetto è fortemente intrecciata — un concept wiki (`secret-section-exfiltration-defense`) **è** un'estensione harness (`secrets-guardrail.ts`); una foglia gold (`area02-1.2`) **è** uno spec verifier (`verifiers/area02-1.2.json`). Tenere queste in repo separati spezza i link e **duplica** il grafo. `[EXTRACTED dal claim utente msg 319]`
- **PROBLEMA**: con repo separati servono due grafi graphify (o un grafo che attraversa confini-di-repo, non supportato pulito), due push, due wiki da tenere sincronizzate → drift e doppia manutenzione. È il duale dell'over-noting a livello di repo. `[INFERRED]`
- **SOLUZIONE**: **monorepo `ITLMv1`** con **subdir piani** (non submodule); **tutta** la design-knowledge in `wiki/` (SSOT); `lm/` e `harness/` contengono **solo** codice/config/artefatti; **un solo `graphify-out/`** che indicizza wiki+lm+harness e cattura gli edge `concept↔extension`, `gold↔verifier`. `[EXTRACTED + INFERRED]`

## Decisione
```
ITLMv1/  (cartella locale: slm/ — rinomina cosmetica differita)
├── CLAUDE.md            # schema
├── wiki/                # SSOT — conoscenza di ENTRAMBI i sub-progetti
├── lm/                  # training + eval + data-pipeline + configs (codice, no knowledge)
├── harness/             # wrapper pi (extensions) + serving vLLM + verifiers + sandbox
└── graphify-out/        # knowledge graph UNICO
```
- Repo GitHub `0Franky/sml` → **rinominabile** `ITLMv1` (setting GitHub, non tocca i contenuti). La cartella locale resta `slm/` (cosmetico).
- **Subdir piani** scelti su **submodule**: il grafo unico e il push unico sono il razionale primario; i submodule aggiungono friction (init/update, grafo cross-repo) senza beneficio finché LM/HARNESS non devono versionarsi indipendentemente.
- **Subrepo indipendenti differiti**: se in futuro `lm/` o `harness/` dovranno essere repo a sé (release separata, contributor diversi), si estrarranno con `git subtree split --prefix=<dir>` (preserva la history) o si convertiranno in submodule. La struttura attuale **non lo preclude**. `[EXTRACTED dal claim utente msg 323 "da creare poi i subrepo"]`

## Alternative considerate (protette per la regola idea-utente)
1. **Due repo separati** (`slm/` wiki-ricerca + `slm-wrapper/` codice) — *reco iniziale mia*. Pro: separazione netta codice/ricerca, repo wrapper pubblicabile da solo. Contro: **due grafi, due push, wiki da sincronizzare** → l'utente l'ha respinta per la SSOT. Era lo stato pre-2026-06-29 (`../slm-wrapper` repo locale `fe4c767`).
2. **Submodule** (`ITLMv1` padre con `lm/` e `harness/` come submodule). Pro: history indipendente per sub, possibilità di repo a sé. Contro: friction operativa + il grafo unico diventa scomodo (graphify dovrebbe attraversare i confini submodule). **Differita**: adottabile più avanti via `subtree split` se serve.
3. **Monorepo subdir piani** — **SCELTA**. Pro: grafo+wiki unici, un push, link diretti concept↔codice. Contro: la history del wrapper viene assorbita (mitigato: `../slm-wrapper` resta come backup con la sua history; `subtree split` la ricostruirebbe).

## Conseguenze
- **Migrazione 2026-06-29**: `../slm-wrapper` (23 file tracciati) copiato in `harness/` via `git archive HEAD | tar -x` (solo file tracciati, no node_modules/.git). `../slm-wrapper` **conservato come backup** (non cancellato) finché la migrazione non è verificata e pushata. Rinominato pkg `slm-wrapper`→`itlmv1-harness`.
- **Path**: tutti i riferimenti `slm-wrapper`/`../slm-wrapper` → `harness/` (CLAUDE.md layout, `.graphifyignore`, `.gitignore`, `wrapper-implementation-plan.md`, `harness-feature-catalog.md`, `todo.md`, `gold-methodology.md`). OS-agnostic (repo-relative, forward-slash).
- **graphify**: re-graphify unificato dopo la migrazione (wiki+lm+harness). `.graphifyignore` esclude `harness/{node_modules,dist,package-lock.json}` e gli artefatti di training `lm/`.
- **Gold↔verifier**: gli spec in `harness/verifiers/*.json` ora vivono nello stesso repo dei gold `wiki/training-taxonomy/*` → edge diretto nel grafo.

## Follow-up / aperti
- [ ] Rinomina repo GitHub `sml`→`ITLMv1` (utente, setting GH) + eventuale rinomina cartella locale.
- [ ] Decisione finale su quando/se cancellare `../slm-wrapper` backup (dopo verifica push).
- [ ] Se in futuro serve repo separato: `git subtree split --prefix=harness -b harness-standalone`.

## Link
[[2026-06-23-pi-harness-base]] (ADR harness su pi) · [[../architecture/wrapper-implementation-plan]] · [[../architecture/harness-feature-catalog]] · [[../concepts/cross-session-state-sharing]]

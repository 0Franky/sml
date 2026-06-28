---
name: gold-methodology
description: Convenzioni per produrre i gold-example di training, emerse dal pilota 2026-06-29 + review-loop agnostico. Oracoli, ancoraggio, marker [UNVERIFIED], lunghezza, review-loop obbligatorio. Guida del rollout ~215 foglie.
type: reference
tags: [gold, training-data, methodology, reward, verifier, review-loop]
sources: [pilota gold area-02 2026-06-29, review agnostici, gold-example-area02-criticality]
last_updated: 2026-06-29
---

# Gold-example — metodologia & convenzioni (rollout)

> Estratta dal **pilota 2026-06-29** (3 foglie area-02: 1.2 overwrite Q+L · 3.2 dep-check Q · 6.2 defer L; autori verticali + revisori agnostici). Vale per tutte le ~215 foglie. Template strutturale: [[gold-example-area02-criticality]].

## Review-loop OBBLIGATORIO (regola utente 2026-06-28, msg 274)
Ogni gold: **autore verticale** (esperto di dominio) → **revisore agnostico** (severo, non-attaccato) → integratore finalizza. Il pilota ha dimostrato che il revisore pesca **bug P0 reali** (oracoli non ancorati, coherence-penalty gameabile) che l'autore razionalizza.

## Oracoli (reward Q)
- **Content-preservation** → oracolo **unificato**: "campi-chiave di `H0` ⊆ contenuto-post" (snapshot pre `H0`, verifica inclusione nel post). NON `sha256(file)==H0` quando l'azione legittima cambia il file (merge/append); `sha256` puro SOLO per copie esatte (`.bak`).
- **Recovery** → l'oracolo deve verificare **ENTRAMBI** (vecchio preservato **E** nuovo presente); un check solo-sul-vecchio è gameabile da un `git restore` secco.
- **Ancoraggio esecuzione** → ogni oracolo dev'essere un **predicato eseguibile** ancorato a una fixture (es. `python -c "import ..."` exit 0/1; il dispatch dinamico realmente invocato). Asserire "il verifier esegue X" senza una fixture che esercita X = buco.

## Predicato vs esecuzione (Q e L)
**Definisci il PREDICATO di verifica nel gold anche se l'esecuzione è gated sull'harness.** "Si verifica in fase 3" senza dire *come* = vago. Per le foglie L: definisci la predittività (es. `esito_atteso` vs risultato osservato della tool-call eseguita) come **predicato**; l'esecuzione la fa lo scaffold.

## Reward L (scelte-di-valore)
Vedi [[../concepts/judge-design]] §coherence-anchoring-due-livelli: **NIENTE reward sul ramo**; penalità simmetrica via coerenza `campi↔<env_facts>` (deterministica, pilastro) + `razionale↔campi` (L, complemento). Il pre-check deterministico = solo "contract ben-formato"; il "`conseguenze[]` non-vuoto quando ci sono conseguenze" è **giudizio L**, non pre-check.

## Marker [UNVERIFIED]
I gold i cui output (git/grep/pytest) NON sono stati eseguiti in **sandbox reale** vanno marcati `[UNVERIFIED — format-only, sandbox-execution pending]` in §0/frontmatter. L'esecuzione reale è **gated sullo scaffold verifier-sandbox** (Fase 0.3, [[../decisions/2026-06-23-pi-harness-base]]). ⚠️ Il pilota ha mostrato che gli output non-eseguiti contengono **bug di ragionamento** (oracoli sbagliati): correggi a mano i bug logici ORA; l'esecuzione cattura il resto dopo.

## Lunghezza
Le foglie multi-asse superano legittimamente le 250 righe (il template canonico ne ha 686). **Taglia la prosa ridondante** ("Perché è gold" ripetuti, definizioni triple dell'oracolo), **NON** le istanze di training né gli edge anti-hack. Definisci l'oracolo UNA volta (in §2bis) e referenzialo.

## Omissioni vs template
Se ometti assi del template canonico (es. value-tier/self-versioning/automod su una foglia dove sono inapplicabili), **dichiaralo esplicitamente** col perché (es. "reversibile per costruzione") — niente omissioni silenziose (CLAUDE.md #12).

## Frontmatter
Disambigua `tags:` (lista standard, per graphify) da `reward_tag:` (tipo di reward: Q / L / Q+L). Convenzione: il secondo è **`reward_tag:`**, non `tag:` (evita collisioni di parsing).

## Link
[[gold-example-area02-criticality]] (template) · [[../concepts/judge-design]] · [[../concepts/training-vs-harness-classification]] · [[../concepts/reward-hacking-mitigation]] · [[../decisions/2026-06-23-pi-harness-base]] (scaffold verifier-sandbox)

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

## Template-inheritance: class → subclass → leaf (DECISIONE utente 2026-06-29)
Per non riscrivere ~400 righe quasi-identiche ×215 foglie, i gold si organizzano in **gerarchia a 3 livelli** (DRY di authoring):
1. **Template di gruppo/famiglia** (`reward-family × scenario-group`): lo skeleton condiviso — struttura 5-classi, convenzioni marker, pattern-reward/oracolo della famiglia, framing §0/§1bis. Es. "famiglia Q-distruttive area-02" (Foglie 1.x) vs "famiglia L-deferral" (Foglie 6.x).
2. **Specializzazione di sottoclasse**: pattern-scenario + oracolo specifico della sottoclasse.
3. **Foglia = delta finale**: solo lo scenario concreto + oracolo/hack-check specifici (~50-100 righe).

**Raffinamenti (regole)**:
- ⚠️ **Il modello si addestra sugli esempi ESPANSI** (template + sottoclasse + foglia → istanza completa a piena fedeltà). La gerarchia è **solo authoring-time** (manutenzione DRY), NON ciò che vede il modello → serve uno **step di espansione** che compila il full-gold per il training.
- **Fattorizza al taglio naturale** = `(famiglia-di-reward × gruppo-di-scenario)`, non un template unico per area (Q-deterministiche e L-judged hanno skeleton diversi → template diversi).
- **Slot/override espliciti** (niente eredità ambigua): il template definisce le sezioni; la foglia riempie/override slot specifici.
- **Vantaggi**: duplicazione azzerata, **fix-once-propaga**, **review-loop veloce** (template una volta + delta-foglia).
> Supera la dicotomia compatto-vs-pieno: authoring *compatto-ma-principled*, espanso a piena fedeltà per il training, rollout area-per-area.

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

---
name: lora-initialization-strategy
description: Come inizializzare i LoRA Tier 2/3 per partire dalla conoscenza del Tier 1 base senza danneggiarla. Lo standard (B=0) parte da ZERO perturbazione (output = base), poi impara. Il vero bivio NON è "zero vs non-zero init" (tutti i buoni init partono da zero) ma QUALI direzioni l'adapter impara: standard / MiLoRA (preserva, anti-forgetting) / PiSSA (veloce, più rischio) / LoRA-GA (convergenza). Risposta a domanda utente 2026-06-28.
type: concept
tags: [lora, initialization, catastrophic-forgetting, peft, three-tier, anti-forgetting, milora, pissa]
sources: [user msg 2026-06-28 (243), sota-techniques-catalog Dim-1, catastrophic-forgetting, lora-sizing-methodology]
last_updated: 2026-06-28
status: draft v0
confidence: provisional
---

# LoRA Initialization — partire dalla base senza danneggiarla

> Domanda utente (msg 243): *"quando addestriamo i LoRA, è possibile fare in modo che all'inizio non apportino modifiche (o minime) all'output del Tier 1 base? Meglio partire dalla conoscenza base e poi sistemare i pesi LoRA, oppure partire con pesi random che già cambiano l'output e poi tunare?"*

## Risposta breve `[EXTRACTED]`

**Sì — non solo è possibile, è il comportamento STANDARD del LoRA**, ed è esattamente l'opzione (a) dell'utente (partire dalla base, poi sistemare). L'opzione (b) (pesi random che già cambiano l'output) è **peggiore** e nessuno la usa: corrompe la base allo step 0 e poi devi "ripararla".

## Come funziona (in parole semplici)

Un LoRA aggiunge alla matrice di pesi *congelata* del base model `W` una piccola correzione `ΔW = B·A` (due matrici piccole). L'output diventa `(W + B·A)·x`.
- **Init standard**: `A` = random, **`B` = ZERO**. Quindi allo step 0: `B·A = 0` → `ΔW = 0` → **l'output è ESATTAMENTE quello del base (Tier 1)**, nessun cambiamento.
- Poi il training muove gradualmente `B` (e `A`) lontano da zero → l'adapter inizia a contribuire, *aggiungendo* la nuova competenza sopra il base che resta **intatto** (è congelato).

*Analogia*: il base model (Tier 1) è un foglio già scritto; il LoRA è un **lucido trasparente** che ci appoggi sopra. Init standard = lucido **completamente vuoto/trasparente** → all'inizio vedi solo il base. Il training "disegna" piano sul lucido (la nuova skill), senza toccare il foglio sotto. → L'opzione (b) sarebbe scarabocchiare il lucido a caso fin da subito (degradi quello che vedi) e poi cancellare e ridisegnare: spreco.

## La sottigliezza vera (il bivio reale per NOI) `[INFERRED]`

"Zero perturbazione all'init" non è il vero bivio: **quasi tutti i buoni init partono da output = base** (standard B=0; e anche PiSSA/MiLoRA decompongono `W` in modo che la somma all'init sia ancora `W`). Il bivio reale è **QUALI direzioni** l'adapter è libero di imparare — e questo decide quanto **preserva la conoscenza del Tier 1** (planning/safety/criticality + base coding), cioè quanto evita il [[catastrophic-forgetting]]:

| Init | Cambio all'init | Cosa impara | Effetto sul Tier 1 base | Quando |
|---|---|---|---|---|
| **Standard (B=0, A random)** | **zero** | direzioni low-rank arbitrarie | neutro, "first do no harm" | **default sicuro** |
| **MiLoRA** (SVD minori) | zero | le direzioni a **bassa energia** | **preserva al meglio** la conoscenza principale → meno forgetting | ⭐ il più allineato al nostro scopo |
| **PiSSA** (SVD principali) | zero | le direzioni ad **alta energia** | adatta più in fretta MA perturba le direzioni più importanti → **più rischio forgetting** | se serve adattamento aggressivo |
| **LoRA-GA** | ~zero | allinea il 1° update al gradiente del full-FT | converge vicino al full-FT, più veloce | per tagliare GPU-ore |
| ⚠️ **Random A e B (opzione b)** | **non-zero (degrada!)** | — | corrompe il base allo step 0 | **mai** |

## La mia reco `[reco]`

1. **Default = LoRA standard (B=0)** — zero perturbazione iniziale, parte esattamente dalla conoscenza del Tier 1 e *aggiunge*. È la risposta diretta e production-safe alla tua domanda (opzione a).
2. **Per massimizzare la preservazione del Tier 1** (che è la nostra mente organizzativa, NON vogliamo rovinarla aggiungendo coding): **valutare MiLoRA** nell'ablation-init già pianificato — impara sulle direzioni "minori" lasciando intatta la conoscenza principale → meno catastrophic-forgetting.
3. **Abbinare** allo stack PEFT già deciso (DoRA + RsLoRA + LoRA+) e al **10% replay** ([[../concepts/staged-curriculum-training]] / replay strategy) — due leve aggiuntive anti-forgetting.
4. **Evitare** l'opzione (b) (A e B entrambi random non-zero): degrada il base allo step 0, nessun vantaggio.
5. **Decidere via evidenza**: un mini-ablation cheap (standard vs MiLoRA vs LoRA-GA su 1 task coding piccolo, misurando qualità coding *e* tenuta delle skill Tier-1) — è già nel `wiki/todo.md` (Dim-1, "init-strategy non decisa") e taglia GPU-ore su tutta la Fase F2.

## Note di precisione `[INFERRED]`
- Nel nostro three-tier i LoRA in questione sono **Tier 2/3 (coding)** che vivono **sopra il Tier 1** organization-first. Init B=0 = Tier 2/3 partono come "no-op" → il comportamento org/safety del Tier 1 resta intatto e il coding si aggiunge gradualmente. Esattamente lo scenario che vuoi.
- Distinto da aLoRA / Activated-LoRA (spike D1, pagina futura; briefing 2026-06-28 Decisione 1): quello riguarda il **runtime/KV-cache** (swap senza ricomputo), NON l'inizializzazione dei pesi. Sono due temi diversi.

## Linked
- [[catastrophic-forgetting]] — il rischio che questa scelta mitiga.
- [[lora-sizing-methodology]] — rank/stack PEFT (DoRA+RsLoRA+LoRA+).
- [[lora-stacking]] — composizione runtime degli adapter.
- [[../sota-techniques-catalog]] Dim-1 (LoRA-GA/PiSSA/MiLoRA) + gap "init-strategy non decisa".
- [[staged-curriculum-training]] — replay anti-forgetting.

> **Next**: mini-ablation init (standard vs MiLoRA vs LoRA-GA) in Fase F2 — tracciato in `wiki/todo.md`. Verificare ref PiSSA 2404.02948 / MiLoRA 2410.18035 / LoRA-GA 2407.05000.

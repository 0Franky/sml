---
name: 2026-07-08-tier2-justification-analysis
description: "Analisi (evidence-based, con web research) della domanda utente msg 1312: 'ha senso il Tier-2 o il base assorbe tutto ed è uno spreco?'. Verdetto: Tier-2/3 hanno senso, MA per modularità/skill/isolamento-forgetting, NON come backstop di capacità-di-conoscenza (LoRA inietta MENO conoscenza del base, non di più). Corregge onestamente il razionale dell'utente senza toccare l'idea-protetta three-tier."
type: decision
status: analysis (supporta e RAFFINA la three-tier protetta; non la sovrascrive)
tags: [three-tier, lora, tier-2, knowledge-injection, catastrophic-forgetting, modularity, pre-training, rl]
last_updated: 2026-07-08
sources:
  - user msg 1312 (2026-07-07/08) "ha senso il Tier-2 o il base assorbe tutto?"
  - Biderman et al. 2024 "LoRA Learns Less and Forgets Less" arXiv:2405.09673
  - "Learning Beyond the Surface: continual pre-training with LoRA domain-specific" arXiv:2501.17840
  - "Bring Your Own Knowledge: Survey of LLM Knowledge Expansion" arXiv:2502.12598
  - "More Than Catastrophic Forgetting: Integrating General Capabilities for Domain-Specific LLMs" arXiv:2405.17830
  - "LoRA vs Full Fine-tuning: An Illusion of Equivalence" arXiv:2410.21228
  - Thinking Machines Lab "LoRA Without Regret"
---

# Ha senso il Tier-2? Analisi evidence-based (msg 1312)

> Domanda utente: *"Io sto introducendo questo layer-2 per aggiungere conoscenza specifica di un ambito al modello ma siamo sicuri che ha senso? Oppure il base Tier-1 riesce comunque a immagazzinare tutto e sarebbe uno spreco? Perché se c'è possibilità che non impari bene tutte le conoscenze a livello-1, io delego a livello-2."*
> Critica oggettiva richiesta ([[feedback_objective_critique]]): la three-tier è idea-protetta, ma l'utente stesso la mette in discussione → rispondo con l'evidenza, dritto.

## Verdetto in una riga
**Il Tier-2/3 HA SENSO — ma il razionale dell'utente ("delego a Tier-2 la conoscenza che il base non impara bene") è ROVESCIATO rispetto all'evidenza: la LoRA inietta MENO conoscenza del base, non di più. Il Tier-2/3 va giustificato con MODULARITÀ + ISOLAMENTO-DAL-FORGETTING + SKILL, non come backstop di capacità-di-conoscenza.**

## L'evidenza (perché il razionale va corretto)

1. **"LoRA Learns Less and Forgets Less"** (Biderman et al., arXiv:2405.09673) `[EST]`: aggiornando pochi parametri, la LoRA ha capacità di apprendimento LIMITATA — impara **meno** conoscenza nuova del full-FT, ma in cambio **dimentica meno** (preserva il base). *Imparare conoscenza nuova richiede più capacità che convertire un base in instruction-follower.*
2. **Capacità di iniezione fattuale limitata** `[EST]` (survey arXiv:2502.12598 + arXiv:2501.17840): *"le limitate modifiche della LoRA non possono affrontare efficacemente il continual-pretraining per un adattamento di dominio PROFONDO"*. Una singola LoRA low-rank ha capacità **insufficiente** per iniezione sostanziale di fatti; high-rank può memorizzare ma serve molto più training; low-rank fallisce. È ciò che ha spinto MoRA / Mixture-of-LoRA-Experts.
3. **Conseguenza diretta sul dubbio dell'utente** `[INF]`: **"se il base non impara bene la conoscenza, delego alla LoRA" NON funziona** — la LoRA è un iniettore di conoscenza PEGGIORE del base. Se serve conoscenza profonda e stabile, va nel BASE (continual-pretraining), non in un adapter. La LoRA non "recupera" ciò che il base non ha imparato.

## Ma allora perché il Tier-2/3 HA senso (i razionali GIUSTI, forti ed evidence-backed)

1. **Isolamento dal catastrophic forgetting** `[EST]`: la LoRA *"forgets less"* — aggiungere un dominio via adapter **non degrada l'intelligenza generale del base** (l'identità Tier-1 [[project_base_model_intelligence]]). Stipare TUTTI i domini nel base via full-FT rischia forgetting + **interferenza tra domini** (arXiv:2405.17830 "More Than Catastrophic Forgetting"). Per un modello PICCOLO (27B, capacità finita) questo è ancora più critico → la modularità è PIÙ importante, non meno.
2. **Modularità / hot-swap** `[EST]`: un solo base serve molte specializzazioni senza duplicare il modello (vLLM `--enable-lora`, hot-swap per-richiesta [[project_three_tier_idea]]); ogni verticale si itera indipendentemente senza ri-addestrare il base.
3. **Match con COSA sono davvero Tier-2/3** `[INF]`: nel design, **Tier-2 = "programming generalist" (una SKILL/comportamento), Tier-3 = verticale framework-specifico (pattern/API/stile)**. La LoRA eccelle proprio nell'adattamento di **SKILL/stile/task** e nell'**ELICITARE** capacità esistenti — NON nell'iniettare fatti nuovi profondi. Quindi la three-tier usa la LoRA per ciò in cui è FORTE. (Nota: la LoRA a volte batte pure il full-FT su benchmark tipo MMLU — arXiv:2410.21228 — dipende da task/dati/hyperparam.)

## La regola di divisione che ne deriva (risponde a "dove va cosa")
- **BASE (Tier-1, continual-pretrain + RL minimo)** → conoscenza **foundational, condivisa da tutti i task, STABILE** (ragionamento, teoria, world-model, linguaggio) + **skill agentica** (usare bash/tool/harness, muoversi sul sistema) + **coding MINIMO ma di alta qualità** (abbastanza per agire sul sistema, NON per memorizzare codice). ← esattamente ciò che l'utente vuole (msg 1312).
- **Tier-2 LoRA** → **SKILL** di coding (il "programming generalist"): macro-categorie/strategie di programmazione. La LoRA fa bene le skill.
- **Tier-3 LoRA** → **verticali** stack/framework: pattern/API/convenzioni specifiche, narrow e swappabili → sweet-spot della LoRA.
- **Principio**: *conoscenza-stabile-e-condivisa → base; skill + pattern-verticali-swappabili → LoRA.* Coerente con lo split pre-train/RL già analizzato ([[concepts/training-intelligence-optimization]] §1) E con l'evidenza.

## 🔑 Il tassello che RISOLVE la tensione-capacità (utente msg 1314)
L'utente aggiunge: *"anche il modello base avrà una piccola percentuale di tutto il resto del dataset degli altri tier — un pochetto di tutto deve conoscerlo a priori per avere almeno un ISTINTO verso quell'ambito ed è anche saperlo CATEGORIZZARE (abbiamo esercizi di categorizzazione), poi affiniamo di più con i diversi layer."*

Questo è il pezzo mancante e **scioglie l'obiezione-capacità**: il base **non deve MASTERizzare** ogni dominio (era quello a rischiare interferenza/forgetting), ma tenerne **una piccola % per due funzioni precise**:
1. **ISTINTO di dominio** — riconoscere "questo è un problema di tipo X" abbastanza da orientarsi.
2. **CATEGORIZZAZIONE = ROUTING** — è LETTERALMENTE la funzione dell'orchestratore Tier-1 ([[project_routing_strategy]]): per decidere quale LoRA/verticale invocare, il base deve saper *classificare* il task → serve un po' di tutto + esercizi di categorizzazione espliciti. **La depth la danno le LoRA.**

→ Doppio effetto: (a) la capacità del base NON è sovraccaricata (piccola %, non mastery); (b) l'abilità di categorizzare è ciò che rende il Tier-1 un buon router. È il design PIÙ coerente possibile con l'evidenza: **base = istinto + categorizzazione (breadth sottile) ; LoRA = mastery (depth per-dominio).** Gli "esercizi di categorizzazione" diventano una classe di training del Tier-1 (routing/classification) ancorata all'outcome (label di dominio corretta).

## Quando il Tier-2 SAREBBE uno spreco (onestà)
- Se un adapter Tier-2/3 servisse a iniettare **conoscenza fattuale profonda e nuova** → sbagliato strumento (va nel base pre-train o serve full-FT/high-rank).
- Se il dominio è **ampio, stabile e utile a TUTTI i task** → mettilo nel base; una LoRA sarebbe ridondante.
- Regola pratica: *dominio narrow + swappabile + skill/pattern → LoRA vale; dominio broad + stabile + knowledge-heavy → base.*

## Refinement aperto (non rifiuto)
La granularità "1 LoRA = programming generalist" potrebbe voler diventare **Mixture-of-LoRA-Experts** (routing tra più adapter) man mano che i domini crescono (arXiv MoLE/MoA già in [[reference_papers]]). È un'evoluzione della three-tier, non una negazione. → Open question, non blocca.

## Ricadute sugli altri punti del msg 1312
- **Training set "congelato" + riusabile per un SLM from-scratch futuro** `[INF]`: principio sano, MA caveat — un set per il *continual-pretraining di Qwen* ≠ un corpus *from-scratch*. From-scratch richiede ANCHE il corpus foundational (linguaggio + world-knowledge di base) che Qwen ha già. Il nostro set è la **SPECIALIZZAZIONE**; per un from-scratch va anteposto il foundation-corpus. Quindi "riusabile paro paro" vale per il **layer di specializzazione/comportamento**, con la foundation da aggiungere sotto.
- **RL per l'intelligenza + "labs" + teoria→pratica→ragionamento critico** `[EST/INF]`: **SÌ, ha molto senso.** (a) RL agentico (usare tool/harness, muoversi sul sistema) è tra le leve più forti per l'intelligenza operativa; (b) i "labs" = ambienti RL con task complessi (crea documenti, usa git, meccanismi complessi, "non si incarti") = esattamente RL agentico con reward su outcome (task completato, non-stuck); (c) teoria→pratica via RL costruisce **ragionamento critico sulla teoria** → CoT migliori, PERCHÉ **l'RL ELICITA/affila** ciò che la teoria ha seminato (l'RL non installa da zero — quindi la teoria va nel base PRIMA, poi l'RL la pratica in ragionamento). Caveat: reward ancorato all'OUTCOME (task risolto), mai alla cerimonia del ragionamento (#10) — altrimenti CoT plausibile ma non causale.
- **Organizzazione cartelle per tier**: → [[training-taxonomy]] riorganizzabile in `tier1/` (intelligenza/ragionamento/agentico + coding-minimo) · `tier2/` (macro-categorie/strategie di programmazione) · `tier3/` (foglie verticali). Divisione macro-vs-foglia = **per GENERALITÀ**: Tier-2 = skill cross-cutting; Tier-3 = specifico stack. Reco: **Tier-1 separato** (è un KIND diverso: intelligenza generale); **Tier-2 e Tier-3 sotto una gerarchia comune** (padre=macro-categoria Tier-2, figlie=foglie Tier-3) — coerente con le classi gerarchiche #20 (padre→figlia). Questo risponde al suo "come dividere macro-categoria da foglie".

## Cross-link
[[project_three_tier_idea]] (idea-protetta, QUI supportata+raffinata) · [[project_base_model_intelligence]] · [[concepts/training-intelligence-optimization]] · [[concepts/catastrophic-forgetting]] · [[concepts/lora-stacking]] · [[reference_papers]] · regole #10/#22

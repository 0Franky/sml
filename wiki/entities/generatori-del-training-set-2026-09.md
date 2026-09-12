---
name: generatori-del-training-set-2026-09
description: "CHI può generare il training set (richiesta di Fra, TG msg 2240, 2026-09-12): dossier dei modelli candidati al ruolo di GENERATORE/TEACHER — distinto dal dossier del BASE. Prezzi, contesto e tool verificati sull'API OpenRouter il 2026-09-12; il criterio che decide davvero non è il prezzo ma la LICENZA D'USO DEGLI OUTPUT (#29), e su quel criterio i modelli open-weight che giriamo NOI non hanno il problema."
type: entity
tags: [teacher, distillation, training-data, generator, licenze, tos, costi, bake-off, decision-input]
sources:
  - utente TG msg 2240 (2026-09-12) — «Salva comunque tutte queste info e modelli anche per capire poi chi potrà creare il training set»
  - utente TG msg 2238 — richiesta di valutare DeepSeek V4.1 Flash
  - elenco modelli API OpenRouter interrogato il 2026-09-12 (prezzi $/M, context_length, supported_parameters.tools)
last_updated: 2026-09-12
---

# Chi può creare il training set — dossier dei GENERATORI

> **Perché è una pagina separata dal [[base-model-candidates-2026-07|dossier del BASE]]**: sono due ruoli con criteri **diversi e a tratti opposti**. Il **base** lo dobbiamo poter **possedere e modificare** (pesi aperti, 27-36B, LoRA-friendly). Il **generatore** non deve essere nostro né piccolo: deve essere **bravo, capace di usare i tool, a contesto lungo e a basso costo in OUTPUT** — perché generare dati è un lavoro di **output**, non di input. Confondere i due ruoli è l'errore che questa pagina esiste per impedire.

## ⚠️ Il criterio che decide davvero non è il prezzo

**È la licenza d'uso degli OUTPUT** (regola #29, [[../../memory|feedback_training_data_compliance]]): conta **l'USO** che ne facciamo, non l'accesso. Un modello che costa la metà ma i cui termini vietano l'addestramento di modelli concorrenti **non è più economico: è inutilizzabile**, e scoprirlo dopo aver generato il dataset significa buttare il dataset.

⭐ **E questo ribalta la classifica**, perché esiste una categoria che il problema **non ce l'ha affatto**: i **modelli a pesi aperti che giriamo NOI** (su GPU affittata o in locale). Lì non c'è un fornitore fra noi e gli output: la licenza del *modello* (Apache-2.0, MIT) copre anche ciò che produce. Sono gli stessi candidati del dossier base — Qwen3.6/3.8-27B, Qwen3-32B, Seed-OSS-36B, GLM-4-32B, OLMo-3 — e vanno considerati **anche** come generatori.

| via | problema ToS sugli output | costo | note |
|---|---|---|---|
| **pesi aperti girati da noi** (cloud affittato / locale) | **nessuno**, se la licenza del modello è Apache/MIT | costo **GPU-ora**, non per-token | l'unica via che non lascia un rischio legale sul dataset |
| API commerciale (DeepSeek, Moonshot, MiniMax, Z-AI…) | ⛔ **da leggere per ciascuno, non ancora fatto** | per-token, molto basso | veloce e comodo; il rischio è **sul dataset**, non sulla spesa |
| API di un modello a pesi aperti (es. Qwen via OpenRouter) | zona grigia: la licenza del modello è permissiva, i termini del **servizio** possono non esserlo | per-token | se serve, si rigira lo stesso modello **da noi** e il dubbio sparisce |

## I candidati, con i numeri verificati (API OpenRouter, 2026-09-12)

Ordinati per **costo in OUTPUT**, che è quello che conta quando si genera. `tools=true` è un **requisito**, non un optional: le nostre tracce sono agentiche (il modello deve *chiamare* tool, non descriverli).

| modello | ctx | $/M out | $/M in | tools | ruolo per cui ha senso |
|---|---|---|---|---|---|
| `google/gemma-4-31b-it:free` | 262K | **0,00** | 0,00 | sì | **prototipazione della pipeline** a costo zero (rate-limited, qualità non da teacher) |
| `deepseek/deepseek-v4-flash-0731` | 1311K | **0,08** | 0,04 | sì | il **più economico** con tool e contesto enorme: volume grezzo |
| `deepseek/deepseek-v4-flash` | 1049K | 0,131 | 0,066 | sì | idem, versione corrente |
| `qwen/qwen3-32b` | 131K | 0,28 | 0,08 | sì | non come teacher (F42/F45: fallisce le nostre scene) |
| `google/gemma-4-31b-it` | 262K | 0,34 | 0,09 | sì | il gemello a pagamento del free |
| **`deepseek/deepseek-v4.1-flash`** | 1049K | **0,60** | 0,15 | sì | ⭐ **il candidato teacher indicato da Fra**: recente, 1M ctx, tool, e **~3,3× meno caro in output del nostro candidato base** |
| `z-ai/glm-4.5-air` | 131K | 0,85 | 0,13 | sì | alternativa economica |
| `minimax/minimax-m2` | 205K | 1,02 | 0,255 | sì | alternativa |
| `z-ai/glm-4.6` | 205K | 1,75 | 0,43 | sì | alternativa di qualità |
| `qwen/qwen3.6-27b` | 262K | 2,00 | 0,30 | sì | **è il nostro candidato BASE**: come generatore sarebbe un teacher grande quanto lo studente (v. sotto) |
| `moonshotai/kimi-k2.5` | 262K | 2,25 | 0,45 | sì | alternativa di qualità |
| `qwen/qwen3.8-27b` | 1000K | 2,55 | 0,214 | sì | idem, e **verboso**: F46 ha misurato ~3× i token del 3.6 sulle stesse scene |
| `deepseek/deepseek-v4-pro` | 1049K | 3,20 | 1,60 | sì | il fratello grande: per i casi difficili, non per il volume |

**Ordine di grandezza pratico** (dai nostri run reali, F45/F46): una scena agentica da 12 turni costa **~0,065 $** con un modello a 2,00 $/M in output. Allo stesso lavoro, `deepseek-v4-flash-0731` costerebbe **~0,003 $**, la `v4.1-flash` **~0,02 $**. Cioè: **generare mille tracce agentiche** sta fra i **3 $** (flash-0731) e i **65 $** (qwen3.6-27b). È la differenza fra «si fa» e «si chiede il permesso».

## Come si sceglie il generatore — i tre criteri, in ordine

1. **Può usare i tool?** Senza `tools=true` non genera tracce agentiche, genera testo *su* tracce agentiche — che è il difetto che [[../concepts/phased-reward-and-rh-detection]] chiama catena-fantasma. **Gate binario.**
2. **I suoi output sono usabili nel training?** (#29). **Gate binario, e non verificato per nessuna delle API sopra.** La via che lo aggira è girare pesi aperti da noi.
3. **È abbastanza bravo da essere un maestro?** ⚠️ **E qui c'è un vincolo che il prezzo nasconde**: un teacher deve stare **sopra** lo studente sulle capacità che gli insegna. Le nostre scene (F45/F46) dicono che i 27B **falliscono** quasi tutto: se il generatore è della stessa classe, **stiamo insegnando i nostri stessi errori**. Il teacher va scelto **misurandolo sulle nostre scene**, non sul listino — ed è esattamente la misura del «soffitto» che proponiamo per la `v4.1-flash` a ~0,06 $.

## Cosa va deciso, e da chi

- ⛔ **Da leggere prima di generare qualunque cosa** (io, appena c'è l'ok): i **ToS sull'uso degli output** di DeepSeek e degli altri fornitori che finiscono nella rosa. Finché non è fatto, **nessun dataset generato via API è utilizzabile con sicurezza**.
- 🗳️ **Da decidere (Fra) QUANDO si comincia a generare — non prima** *(nata il 2026-09-12; oggi non blocca niente: il dataset non si sta generando, e chiedere adesso sarebbe anticipare una scelta su lavoro non iniziato, #30)*: se il generatore debba essere **API commerciale** (economico, rischio ToS sul dataset) o **pesi aperti girati da noi** (nessun rischio, costo GPU-ora). È una scelta di **rischio**, non di prezzo, e non la decido io. Il momento in cui va posta è **prima della prima generazione di volume**, non prima delle prove.
- ✅ **Da misurare subito, costa ~0,06 $**: `deepseek-v4.1-flash` sulle nostre 4 scene come **soffitto** — dice insieme (a) quanto è alto il tetto delle scene e (b) se questo modello è davvero *sopra* i 27B, cioè se può fare il maestro.

## Links
[[base-model-candidates-2026-07]] (il ruolo opposto: chi diventa il modello) · [[../concepts/valutazione-graft-e-deepseek-v41-flash]] (la valutazione che ha generato questa pagina) · [[../decisions/2026-06-28-decisions-d1-d5]] (D5: il giudice) · [[../training-taxonomy/dataset-construction-playbook]] (come si costruiscono gli esempi, una volta scelto chi li genera) · [[../harness-experiment-log]] (F45/F46: cosa passano davvero i candidati) · [[../../memory|project_teacher_deepseek_v4]] · [[../../memory|feedback_training_data_compliance]]

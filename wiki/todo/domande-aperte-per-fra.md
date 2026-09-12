---
name: domande-aperte-per-fra
description: "🔴 REGISTRO delle domande aperte per Fra — si scrive QUI prima di mandarle su Telegram (regola sua, 2026-08-23: «segnare sempre le domande prima in locale sul file»). Ogni voce: contesto, fatto misurato, opzioni, reco. Quando risponde, la voce si chiude con la data e il numero del messaggio."
type: tracker
status: 🗳️ 2 aperte (D12 multimodale: lettera o rationale? · D11 PRM appreso fuori dal loop di Wave 6) — 10 chiuse (3 su delega, msg 2208), 1 segnalazione (2026-09-11)
tags: [tracker, decisioni, telegram, area-processo]
last_updated: 2026-09-12
---

# 🗳️ Domande aperte per Fra — 2 al 2026-09-12 (D12, D11) · 10 chiuse (3 su delega)

> Una domanda che vive solo in chat sparisce alla prima compaction, e con lei la risposta quando arriva
> (l'API di Telegram non espone la cronologia). Per questo si scrive **qui prima**, e il hook
> `domanda-prima-sul-file-poi-su-telegram` blocca l'invio se questo file non c'è.
>
> **Canale**: dal **TG msg 2159** (2026-09-11, *«aggiornami qui, non sono più al PC»*) gli aggiornamenti e le risposte vanno su Telegram, non nel terminale.

## Aperte

### D12 · Il vincolo «non serve multimodale» (tuo, 2026-07-24 msg 1808): vale la LETTERA o il RATIONALE? — aperta 2026-09-12 (nata dalla tua domanda sul 3.8, TG msg 2228)

- **Contesto**: il 2026-07-24 hai ratificato *«non serve multimodale»*; la nota registrata dice che è *«un input che penalizza i candidati multimodali»* e archivia **Gemma 4 12B Unified** perché *«la sua natura **encoder-free** multimodale spende parametri su vision/audio non richiesti → peso morto **strutturale**»*, con l'inciso *«cautela su Qwen3.6-27B multimodale»*. Io il 14 agosto ho **escluso Qwen3.8-27B** citando fra i motivi la multimodalità.
- **Fatto misurato (2026-09-12, sui `config.json` reali scaricati da HF)**: `Qwen3.6-27B` e `Qwen3.8-27B` hanno **lo stesso involucro** — classe `Qwen3_5ForConditionalGeneration`, `image_token_id` 248056, `vision_config` — cioè **il criterio non separa il candidato protetto da quello escluso**. In più (F44): in entrambi il **blocco testuale si istanzia da solo** (`AutoModelForCausalLM.from_config(text_config)` → `Qwen3_5ForCausalLM`, 64 layer, 48 GatedDeltaNet + 16 full), cioè l'encoder è **sopra** l'LM, non dentro come nel 12B Unified.
- **Opzioni**: **(A)** vale il **rationale** (peso morto *dentro* l'LM): un encoder separabile non conta → 3.6 e 3.8 restano entrambi candidabili e si scelgono per misura. **(B)** vale la **lettera** (niente vision tower): escono **entrambi** → per il Tier-1 restano Seed-OSS-36B-Instruct e Qwen3-32B, cioè si perde l'unico modello che oggi passa le nostre scene (F45). **(C)** un criterio diverso che decidi tu.
- **Reco**: **(A)** — il costo che il vincolo voleva evitare è misurato e qui non c'è: i pesi del testo restano pesi del testo e l'encoder si lascia a terra. **Cosa la ribalterebbe**: scoprire che tokenizer/layout dei token riservano capacità al visivo anche nel solo LM (verificabile sul tokenizer, non fatto).
- **Nota di processo**: qualunque sia la risposta, **trattare i due diversamente sullo stesso criterio non è difendibile** → nel frattempo il 3.8 è in misura sulle stesse scene del 3.6, così la risposta arriva con i numeri in mano.
- 👉 **Domanda**: (A), (B) o (C)?

### D11 · Wave 6: togliere il PRM APPRESO dal loop di RL e tenere solo gli oracoli deterministici per fase? — aperta 2026-09-12 (⛔ tocca la tua decisione del 2026-05-21, open question #15)

- **Contesto**: la strategia post-training decisa il 2026-05-21 dice *«Wave 6 cloud: ORPO + PRM (process reward model su criticality awareness) + GRPO opzionale»* (memoria `project_post_training_strategy`, ADR [[../decisions/2026-05-21-training-philosophy-roadmap]]). Il PRM è anche il *claim #4* del paper. Da luglio il nostro reward per fase è però un **oracolo deterministico** (concept `phased-reward-and-rh-detection`, D3 del protocollo), e dal 2026-09-11 è eseguito nelle scene a più turni (F41-F44).
- **Fatto misurato (letto il 2026-09-12 nel testo completo, via riassuntore; abstract verificati da me l'11)**: *Reward Under Attack* (arXiv 2603.06621) — RL contro un PRM appreso: reward del PRM a **1,0 entro 100 step** con accuratezza vera a **0 %** (Qwen2.5-Math-PRM-7B), **43 %** del guadagno di reward da **stile**; perimetro: matematica, due PRM piccoli, policy 1,5B, **nessuna mitigazione testata**. *VPR* (arXiv 2605.10325) — oracoli deterministici per turno battono outcome-only e PRM Monte-Carlo (Sudoku 56 % vs 48 % vs 35 %) e trasferiscono; **un oracolo debole fa peggio della base anche fuori dominio**; l'estensione agli ambienti agentici con oracolo su stato è dichiarata aperta (è dove siamo noi).
- **Opzioni**: **(A)** Wave 6 = ORPO + **oracoli deterministici per fase** (le scene/lab) + GRPO opzionale; giudice LLM solo **etichettatore offline** (held-out, ECE), mai reward in loop; gate di qualità dell'oracolo (lab a ≥3 policy fisse + assert gemelli) prima che un oracolo entri nel reward — il claim #4 diventa *«verifiable process rewards per l'operare agentico»*. **(B)** tenere il PRM appreso, ma solo dopo un PRM-BiasBench nostro (8 perturbazioni sulle nostre tracce) e un closed-loop di 100 step con oracolo a fianco. **(C)** lasciare la voce com'è e decidere a Wave 6.
- **Reco**: **(A)** — costo zero (sparisce un componente), difesa dall'hacking che sale, e il nostro lavoro di settembre è già (A). **Cosa la ribalterebbe**: un PRM ≥7B non solo matematico che passi PRM-BiasBench e regga il closed-loop; classi senza oracolo dove il giudice offline non basta (decisione separata, per classe). Dettaglio: [[../decisions/2026-09-12-prm-appreso-escluso-proposta]].
- 👉 **Domanda**: (A), (B) o (C)?

### D10 · La sequenza dei laboratori (msg 2200) — aperta 2026-09-11 · ✅ CHIUSA 2026-09-11 su delega (TG msg 2208 «carta bianca, ratifica come meglio credi»): fasi 0-4 e regola della coppia ratificate; la fase 3 sarà una classe nuova dopo il gap-scan

- **Contesto**: Fra chiede di formalizzare l'ordine dei lab (gathering → aggiornamento → gate che diventano rossi) «per non farsi pestare i piedi a vicenda». Scritta [[training-taxonomy/lab-sequence]]: 5 fasi con dipendenze esplicite, la regola «un lab entra nel curriculum solo con la sua coppia» (prova: il canary a braccio singolo avrebbe insegnato «lascia sempre un innesco»), e la fase 3 come **skill nuova** da gap-scannare (*costruire il proprio gate*).
- **Reco**: ratificare la struttura a fasi e la regola della coppia; la fase 3 va gap-scannata prima di allenarla.
- 👉 **Domanda**: va bene l'ordine 0-1-2-3-4 e la regola della coppia? E la fase 3 (il modello che costruisce i propri gate) la vuoi come classe nuova?

### D9 · Base model — la discussione promessa con (c) (msg 2169) — aperta 2026-09-11 · ✅ CHIUSA 2026-09-11, TG msg 2197 «Sì, riscrivi e salva tutte le info di quel messaggio in wiki»: (B-riformulata) «CPT da base · SFT/RL da instruct», testo-only invariato; spesa OpenRouter autorizzata (msg 2190)

- **Contesto**: la scelta ground-truth (Qwen3.6-27B, protetta) e il bake-off (Seed-OSS-36B-woSyn primario / Qwen3-32B default sicuro) sono fermi da luglio; il metro di inferenza **non discrimina** a questa taglia (§ESITO 2026-07-26: 15/15 e 16/16, zero trappole) e la misura che discrimina — compiti a più passi con oracolo sul percorso — richiede il **fixture-runner R8** (ratificato, non costruito). Il vincolo del 2026-08-18 (i LoRA fanno emergere, non insegnano) rende la **copertura di conoscenza** criterio di prima classe.
- **Fatto misurato oggi (nuovo, decision-critical)**: dall'elenco pubblico dell'API di Hugging Face, **nessun checkpoint `-Base`** esiste per Qwen3-32B, Qwen3.6-27B, Qwen3.8-27B (la domanda del 08-17 era rimasta aperta su un 401 ambiguo). Con la regola «CPT solo da un vero base», **la linea Qwen esce dalla rosa**. Restano, dense + testo + base scaricabile: **Seed-OSS-36B-Base-woSyn** (Apache; MMLU-Pro 60.4, GPQA-D 35.2 — bassi), **GLM-4-32B-Base-0414** (MIT, 32K, substrato sintetico), **OLMo-3-32B** (Apache, dati aperti). Dettaglio: `entities/base-model-candidates-2026-07` §2026-09-11. La key **SiliconFlow è valida** e espone Seed-OSS-36B-**Instruct** (per le probe, non per il CPT).
- **Verifica estesa (TG msg 2184, *«magari non stanno su HF, verifichiamo bene»*)**: API di ModelScope → **404** per tutti e tre i `-Base` (controllo: `Qwen3-32B` **200**); cinque thread HF che chiedono il base del 32B, **senza risposta** dei maintainer; il tech report Qwen3 lo descrive come interno. **Chiuso sui due hub ufficiali.**
- **Opzioni**: (A) tenere la regola del checkpoint → rosa = Seed-OSS-woSyn primario, GLM-Base e OLMo come controlli; Qwen fuori. (B) rilasciare la regola → ammettere il CPT da un post-trained (Qwen3-32B / 3.6-27B): si tiene il modello più forte, al prezzo di un substrato con dentro il post-training altrui. (C) rinviare finché non esce un base Qwen: contraddice il pattern del 08-17 (*il mercato si muove via da ciò che ci serve*).
- **Reco**: **(A)**, con l'ordine: (1) lavoro a spesa zero dentro (c) — fixture-runner R8 (prerequisito del bake-off) + meccanismo CPT+LoRA sul 4B locale; (2) probe API di calibrazione a pochi dollari (MMLU-Pro / GPQA-D su sottoinsiemi + probe di conoscenza per i verticali) su Seed-OSS (SiliconFlow) e GLM/OLMo (OpenRouter) — **solo con il suo ok alla spesa**; (3) CPT bake-off ridotto in cloud sui finalisti, con tetto di spesa suo. Vincolo «testo-only» invariato (la parte visiva è peso morto per il CPT; il world model resta *implementazione futura con cambio probabile di base*, msg 2140).
- **Cosa la ribalterebbe**: un `-Base` Qwen che compare (ricontrollo con la stessa query prima del bake-off), o una sua scelta per (B).
- 👉 **Domande**: (1) (A), (B) o (C)? (2) ok all'ordine e alla spesa di pochi dollari per le probe di calibrazione, quando (1) è pronto? (3) il vincolo testo-only resta?
- **Risposta parziale (TG msg 2190, 2026-09-11 19:48)**: *«su OpenRouter dovrei avere sette dollari di credito almeno: usali al meglio»* → **spesa autorizzata** sul credito OpenRouter (tetto ≈ 7 $, da verificare via API) per le scene sui candidati; in più chiede di provare **anche il braccio `ours`** (il nostro harness e context engineering) e di chiudere la shell ollama se non serve. **Restano aperte** (1) e (3).
- **TG msg 2192 (20:16)**: Fra chiede *«base (pre-instruct) o Qwen3.8-27B dense instruct? cosa cambia, qual è la strada migliore?»* → risposta data (dettaglio in `entities/base-model-candidates-2026-07` §2026-09-11 «Base o instruct?»): la regola presuppone un CPT vero che il piano non ha mai dimensionato; i nostri dati sono di scala SFT/RL; il gap base→instruct (Seed-OSS: +22 MMLU-Pro, +36 GPQA-D) è post-training irriproducibile → **reco: «CPT da base · SFT/RL da instruct»**, Tier-1 da instruct dense, scelta fra instruct per misura (scene prima/dopo SFT ridotto), prerequisito test LoRA sull'ibrido col 4B locale. 👉 chiede a Fra di confermare la riformulazione di (B) e il testo-only.

### D8 · Ratifica delle tre proposte scritte dal batch 2026-09-11 (idee 4, 5, 9) — aperta 2026-09-11 · ✅ CHIUSA 2026-09-11 su delega (TG msg 2208): placement e impianto di 4, 5-faccia e 9 ratificati; il padre le elenca; contenuto non revisionato

- **Contesto**: tre pezzi scritti come ⛔ PROPOSTA: (1) [[training-taxonomy/class-confident-first-sequencing]] (idea 4, «partire dal confident»; padre `metacognitive-self-audit`, sorella di `effort-honesty-under-difficulty`; con una faccia in più rispetto all'enunciato — *sonda subito il rischio load-bearing, senza costruirci sopra* — perché «prima il certo» senza quella faccia diventa «base solida sopra il vuoto»); (2) faccia ORDINE dentro [[training-taxonomy/class-instruction-phase-clarification]] (idea 5, «aspetta, prima conviene X»: PASS solo se il controllo economico precede la prima azione che muta; il *«ah no, dovevo fare X prima»* è fallimento misurato, non recupero); (3) [[training-taxonomy/class-recurring-signal-triage]] (idea 9, errori ripetuti che diventano rumore: nota → capisci → decidi → traccia → agisci, una volta; padre `metacognitive-self-audit`, sorella di `attentional-scope-exit`; alternativa OUTWARD `harness-environment-awareness` dichiarata e scartata con motivo).
- **Cosa ratifica**: il **placement** (padre e sorelle) e l'**impianto** (skill, negativi simmetrici, reward outcome-anchored, label-gen). Il contenuto resta «non usare per il training» finché fixture e scorer non esistono (binario c). Per regola del checker il padre le elenca **solo dopo** la ratifica.
- **Reco**: ratificare tutte e tre; se il padre della 9 non convince, l'alternativa OUTWARD non cambia il contenuto, solo il padre.
- 👉 **Domanda**: ratifichi 4, 5-faccia e 9 così come sono (placement + impianto)? Se sì, il padre le elenca e passo al binario (b).

### D7 · Idea 11 del batch 2026-09-11 — «capire come fare transfer learning su altri campi»: quale delle tre letture? — aperta 2026-09-11 (TG msg 2153) · ✅ CHIUSA 2026-09-11 su delega (TG msg 2208): scelta la lettura (c) — trasferimento analogico come skill — perché (a) e (b) sono già coperte; candidato gap da gap-scannare, non scritto

- **Contesto**: la riga è una sola e ammette tre letture: (a) transfer **degli esempi** cross-dominio nel dataset → già regola #19, in vigore su ogni classe; (b) transfer learning **in senso ML** — riusare pesi/LoRA del Tier 1 su altri verticali → è la three-tier stessa (LoRA verticali); (c) una **skill del modello**: portare attivamente una lezione da un campo a un altro (trasferimento analogico) — in tassonomia c'è il guardiano (`training-taxonomy/gold-example-transfer-assumption-audit`: *quando trasferisci, audita i presupposti*) ma non la mossa.
- **Fatto misurato**: grep «analogi» in `wiki/training-taxonomy` → solo occorrenze incidentali (esempi «ereditati per analogia»), nessuna classe.
- **Reco**: se (c), è un gap probabile e va gap-scannato contro `class-metacognitive-self-audit` e `class-consequence-intention-conflict` prima di scrivere; se (a) o (b), nulla da fare.
- 👉 **Domanda**: intendevi (a), (b) o (c)?

## Chiuse

### D6 · Prossimi passi — aperta con TG msg 2166 («quindi i prossimi passi quali sono? come procediamo?») · ✅ chiusa 2026-09-11, TG msg 2169 «Confermo ordine a b c poi discutiamo sul base model appena ci arrivi»

- **Deciso**: (a) triage delle 11 idee → (b) classe «confini di modulo» dall'idea 12 → (c) fixture + scorer per le classi ratificate, in autonomia e in quest'ordine. Il binario empirico (d) **si apre con la discussione sul base model quando (c) è avviato** — non prima. Nel frattempo niente spesa.
- **Compaction**: con TG msg 2170 (*«se vuoi compact te lo faccio ora»*) Fra ha offerto il `/compact` manuale — accettato (TG msg 2172) a stato tutto persistito; il watcher automatico su questa macchina non è attivo.
- **Stato all'atto della chiusura**: (a) avviato, tre verdetti su undici (5 = innesco che manca · 4 = nuova, padre deciso · 9 = nuova probabile); prossima l'idea 3, poi la 8.


### D3 · `skills/remotion/SKILL.md` non versionato — ✅ chiusa 2026-09-11, TG msg 2165 «3 togli skill»

- **Fatto**: rimossa `~/.claude/skills/remotion/` (era l'unica copia: skill generica per video programmatici con React, 5 KB, 2026-02-04, non citata da nessun manifest né progetto). Copia di sicurezza in `~/.claude/backups/removed-skills-2026-09-11/remotion/`. Dopo la rimozione `check-install-drift` non ha più alcun finding: bundle, copia viva e origin coincidono.


### D5 · L'annuncio su Fable e lo «steering vector» — ✅ risposto 2026-09-11 (TG msg 2160 domanda · 2163 link · risposta corretta su TG)

- **⚠️ Correzione**: la mia prima risposta (TG msg 2161) diceva *«annuncio non trovato»*. **Era una ricerca fallita, non una prova di assenza.** L'annuncio esiste.
- **Fatto verificato** (system card di Claude Fable 5 / Mythos 5, p. 13, citato verbatim dai post di Simon Willison del 10 e 11 giugno 2026 — il PDF da 319 pagine supera il limite del mio fetch): le richieste di *frontier LLM development* — *«building pretraining pipelines, distributed training infrastructure, or ML accelerator design»* — vengono limitate con *«prompt modification, steering vectors, or parameter-efficient fine-tuning (PEFT)»*; in origine *«these safeguards will not be visible to the user»*; portata stimata *«~0.03% of traffic, concentrated in fewer than 0.1% of organizations»*.
- **Il dietrofront (11 giugno 2026)**, Anthropic testuale: *«Starting this week, flagged requests will visibly fall back to Opus 4.8—the same as our safeguards for cyber and bio»* e *«that was the wrong tradeoff. You should have visibility into the safeguards we have in place, and why»*. Il filtro **resta**, ma **visibile**: una richiesta segnalata passa a Opus 4.8 e lo si vede; il motivo esposto anche via API.
- **Cosa significa per noi**: il perimetro colpito è il pretraining di frontiera, l'infrastruttura di training distribuito e il design di acceleratori. Il nostro lavoro — SLM da 27B su base open, SFT/LoRA/RL, harness, tassonomia, laboratori — **non è quello**, ma non posso garantire come classifica il filtro una singola richiesta. Il punto pratico: dopo l'11 giugno il modo in cui si rompe è **visibile** (fallback dichiarato a Opus 4.8), non uno steering silenzioso. Se compare un fallback durante il nostro lavoro, quello è il segnale — e la difesa resta la stessa: verifiche indipendenti dall'onestà del modello.
- **Su «meglio Opus 5?»**: le fonti descrivono la salvaguardia per Fable 5 (classe Mythos); **nessuna fonte** dice che Opus 5 ce l'abbia, e **nessuna** dice che non ce l'abbia. Non lo affermo.
- Fonti: https://simonwillison.net/2026/Jun/10/if-claude-fable-stops-helping-you/ · https://simonwillison.net/2026/Jun/11/anthropic-walks-back-policy/ · https://fortune.com/2026/06/10/anthropic-accu-claude-fable-5-limits-capabilities-ai-researchers-developers/ · system card (PDF): https://www-cdn.anthropic.com/d00db56fa754a1b115b6dd7cb2e3c342ee809620.pdf


### D1 · Allineare il submodule `WillHouse/wiki/_core` a `origin/main` — ✅ chiusa 2026-09-11, TG msg 2163 «1 Ok»

- **Fatto**: fast-forward `dfa22df → 558d140` (= `origin/main` del clone standard), nessun commit locale toccato. WillHouse ha ora il **puntatore del submodule modificato**, da committare lì quando vuole.

### D2 · La decisione `kubectl` di WillHouse nel vecchio file piatto — ✅ chiusa 2026-09-11, TG msg 2163 «2 sposta»

- **Fatto**: la voce `D-21t9lo0` è stata spostata in `~/.claude/state/progetti/WillHouse/decisioni-pendenti.jsonl`; il file piatto globale è **vuoto**. Ricomparirà a fine turno nelle sessioni WillHouse, dove appartiene.

### D4 · `AGENTS.md` non tracciato in slm (62 KB, «per Codex») — ✅ chiusa 2026-09-11, TG msg 2163 «se reputi sia meglio toglierlo fallo»

- **Fatto**: **tolta la copia**, non le istruzioni: `AGENTS.md` è ora **807 byte** che puntano a `CLAUDE.md` e a `wiki/GOAL.md` §2, con scritto perché è corto. Così Codex ha ancora un punto d'ingresso e non esiste un secondo libro di regole che possa divergere. Zero PII; committato nel repo pubblico. Se lo vuole via del tutto, è un `git rm`.

## Segnalazioni ricevute (non domande)

### S1 · «Il wrapper sui PC dev si riavvia all'auto-compact» — TG msg 2163, 2026-09-11

- **Cosa dice**: sulle macchine di sviluppo (nv-dev / wh-dev su Proxmox) il wrapper si **riavvia** quando scatta l'auto-compact. Segnalato da Fra, non osservato da me.
- **Dove appartiene**: al **compact-system** di core (`compact-watcher`, `ensure-compact-watcher`, `start-compact-watcher.sh`), non a SLM. È **coerente** con il finding C5 della revisione avversaria di oggi (il processo del watcher gira col file di quando è partito; `ensure-compact-watcher` tace se è già vivo) — ma il sintomo qui è un **riavvio**, non una copia stantia: potrebbe essere lo starter che riparte a ogni SessionStart post-compact. **Non verificato**: non ho accesso ai PC dev da questa sessione.
- **Da fare**: riprodurre su una macchina dev leggendo `~/.claude/compact-watcher.log` dopo un auto-compact; il fix, se c'è, va in core. Tracciato qui perché il numero di messaggio resti ritrovabile.

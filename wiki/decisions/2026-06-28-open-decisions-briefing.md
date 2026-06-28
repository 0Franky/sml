---
name: 2026-06-28-open-decisions-briefing
description: Briefing per l'utente (non-tecnico) sulle decisioni/ADR aperte — per ciascuna: contesto + come funziona (analogie) + opzioni/trade-off + reco production-ready e sicura + il residuo non-inferibile che richiede l'utente. Include glossario dei concetti poco chiari + la ricerca dataset/licensing (2 agenti). Pre-ADR: una volta decise, diventano ADR datati.
type: decision-briefing
tags: [briefing, decisions, adr, datasets, licensing, glossary, non-technical]
sources: [user msg 2026-06-28 (234/235/238), sota-techniques-catalog review-loop, 2 research agent (coding+instruction datasets)]
last_updated: 2026-06-28
status: open — awaiting decisioni utente
---

# Briefing — Decisioni aperte (2026-06-28)

> **Come leggere** (formato richiesto, msg 238): ho fatto **io** tutto il gathering/ricerca; ti chiedo **solo il residuo che non potevi inferire**. Per ogni punto: *contesto → come funziona (in parole semplici) → opzioni e trade-off → la mia raccomandazione professionale (production-ready + sicura) → cosa serve da te*. Il principio "gather in autonomia, chiedi solo il residuo, presenta ho-cercato-X→trovato-Y→reco-A" è già formalizzato in [[../concepts/low-confidence-gather-and-reorg]] + `feedback_be_autonomous_safe` + [[../concepts/scientific-method-operating-protocol]] — questo documento lo applica.

---

# PARTE 1 — Glossario: i concetti che non erano chiari

### 1.1 "Il nostro GRPO erode la calibrazione" — cosa intendo
- **GRPO** è il metodo di Reinforcement Learning che useremo per "rifinire" il modello: gli dà un **premio binario** (risposta giusta = +, sbagliata = −) e il modello impara a massimizzare i premi.
- **Calibrazione** = la capacità del modello di sapere *quanto è sicuro*. Un modello calibrato che dice "sono sicuro all'80%" ha ragione circa l'80% delle volte.
- **Il problema** `[EXTRACTED ricerca]`: addestrare solo su "giusto/sbagliato" spinge il modello a diventare **troppo sicuro di sé** (overconfident) e a perdere la calibrazione. *Analogia*: uno studente allenato solo con "voto pieno o zero" impara a rispondere sempre con sicurezza assoluta, anche quando dovrebbe dire "non sono sicuro". È un **effetto collaterale strutturale** del RL binario (paper "Taming Overconfidence", arXiv 2410.09724), non un nostro errore.
- **Perché ci riguarda molto**: il nostro Tier 1 deve **sapere quando è incerto** — è ciò che gli permette di fermarsi e fare gathering o chiedere (la skill low-confidence). Se l'RL lo rende overconfident, smette di riconoscere la propria incertezza → confabula invece di chiedere.
- **La soluzione**: aggiungere un **"calibration reward"** (tecnica RLCR/ConfTuner, basata sul *Brier score*) che premia l'**onestà sulla confidenza**, non solo la risposta giusta. E monitorare l'ECE (una metrica di calibrazione) come segnale di stop durante il training. → l'ho segnato come **vincolo cross-pipeline** (nel `todo.md` + area-04).

### 1.2 XGrammar (structured / guided decoding)
- **Cos'è**: una tecnica a livello di *serving* (mentre il modello genera) che **obbliga** l'output a rispettare una grammatica/formato preciso. *Analogia*: un modulo con campi obbligatori — il modello non può scrivere "fuori dai campi".
- **Perché ci serve**: il nostro sistema usa **token speciali e blocchi strutturati** — `<load:frontend>` (routing), marker `[V]/[A]/[?]`, `<plan>`, `<safety_halt>`. Un modello **piccolo (4B)** a volte sbaglia la sintassi → il wrapper non riesce a leggerli e il sistema si rompe. Con XGrammar la sintassi è **garantita**.
- **Costo**: ~0 — è già integrato in vLLM (il nostro motore di serving). Si attiva con un parametro. **Vantaggio extra**: riduce il carico di training (la grammatica forza la *forma*, il training insegna solo il *contenuto*).

### 1.3 Inoculation prompting
- **Cos'è**: una **singola riga** aggiunta al prompt **durante l'addestramento RL** che "vaccina" il modello contro un comportamento dannoso. *Analogia*: un vaccino — esponi il modello al "trucco" (il reward-hacking) in modo controllato, dicendogli "ok, in questo esercizio barare è accettabile". Paradossalmente, questo **riduce del 75-90%** la probabilità che il modello *generalizzi* il barare ad altri contesti (paper Anthropic 2025).
- **Perché ci serve**: il nostro RL premia il modello quando i test passano — è **esattamente** lo scenario in cui un modello impara a "barare sui test". Inoculation lo mitiga a **costo ~0**.

### 1.4 mini-SWE-agent
- **Cos'è**: uno "scaffold" (impalcatura software) **minimale, ~100 righe** che fa girare un agente di coding: il modello legge, esegue comandi bash, vede l'output, ripete.
- **Perché ci interessa**: dimostra che **non serve un'infrastruttura pesante** per un agente di coding efficace — un'impalcatura leggera basta (>74% su SWE-bench con modelli grandi). È un **modello di riferimento** per il nostro harness su pi, perfetto per un modello piccolo. Non lo adottiamo as-is, ne prendiamo la struttura.

### 1.5 GiGPO (Group-in-Group Policy Optimization)
- **Cos'è**: un miglioramento del metodo RL (GRPO) per agenti che fanno **molti passi** (multi-turn).
- **Il problema che risolve** ("credit assignment"): se un agente fa 10 azioni e alla fine ha successo, *quale* azione è stata decisiva? Senza saperlo, l'RL impara male. GiGPO assegna il merito a **2 livelli** (l'intera traiettoria + i singoli passi) **senza costare più memoria** → gira sulla nostra GPU modesta.
- **Perché ci serve**: il nostro Tier 1 è agentico (fa piani multi-step). Un buon credit-assignment è *la* cosa che fa funzionare l'RL agentico a basso budget.

### 1.6 OSS-Instruct / EpiCoder / LESS (tecniche sui DATI)
Tre modi per **generare/selezionare dati di training riducendo il lavoro umano** (il nostro vero collo di bottiglia):
- **OSS-Instruct**: genera esercizi di coding partendo da **pezzi di codice reale** open-source, invece di inventarli → dati realistici, zero authoring umano.
- **EpiCoder**: costruisce un "albero di feature" del codice per **controllare difficoltà e varietà** degli esercizi generati.
- **LESS**: seleziona il **sottoinsieme di dati più "influente"** (quello che insegna di più) invece di usarli tutti → meno dati = meno costo, stessa qualità.

---

# PARTE 2 — Le 6 decisioni aperte

> Per ognuna: l'ho studiata, ecco contesto + come funziona + opzioni + la mia reco. Il **residuo da te** è in fondo a ciascuna.

## Decisione 1 — aLoRA-sequencing (come addestrare gli adapter Tier 2/3)
- **Contesto**: il nostro sistema carica/scambia "adapter" (i LoRA: piccoli moduli che danno competenze specifiche — es. frontend) a runtime. C'è un costo nascosto: quando si scambia un adapter, il modello deve **ricalcolare** parte del contesto (la "KV-cache") → latenza.
- **Come funziona aLoRA** (Activated LoRA): un tipo speciale di adapter che si attiva **solo sui token dopo l'invocazione** → **accetta la cache esistente senza ricalcolarla** (fino a 20-58× più veloce sullo swap). *Analogia*: invece di rifare la valigia da capo a ogni cambio, aggiungi solo lo scomparto nuovo.
- **Il trade-off / rischio**: aLoRA **cambia il modo di addestrare** gli adapter (tecnica "mask-based") → va deciso **PRIMA** di addestrarli, altrimenti vanno ri-addestrati (spreco). E va verificato che la **qualità** tenga quanto un LoRA normale (è più recente, meno battle-tested).
- **La mia reco** `[reco]`: **non bloccare l'MVP su questo**, ma fare uno **spike di validazione** (un test piccolo: addestrare 1 adapter aLoRA vs 1 LoRA normale su un task di coding, confrontare qualità + velocità di swap) **prima** di lanciare la pipeline degli adapter Tier 2/3. Se aLoRA regge la qualità → adottalo (sblocca il multi-expert sequenziale "veloce E auditable", che è un nostro punto di forza). Se no → LoRA standard, accettando la latenza (su locale è latenza, non costo).
- **Residuo da te**: nessuno tecnico — è una scelta di *sequencing* che gestisco io con lo spike. Ti serve solo sapere che **lo decidiamo prima di addestrare gli adapter**, non dopo.

## Decisione 2 — Tokenizer / special-token
- **Contesto**: usiamo token speciali (`<load:...>`, `<section>`, `[V]/[A]/[?]`). Un modello "vede" il testo come una sequenza di **token** (pezzetti). Se un token speciale non è nel suo "vocabolario", lo spezza in pezzetti casuali e il segnale è debole.
- **Come funziona**: si **aggiungono** questi token al vocabolario del modello e si inizializzano i loro "embedding" (la rappresentazione interna) **prima** di iniziare l'addestramento.
- **Il trade-off / rischio**: è una decisione di **setup iniziale, irreversibile a metà training** (se li aggiungi dopo, devi ri-addestrare). Costo ~0 se fatto subito, costoso se dimenticato.
- **La mia reco** `[reco]`: **aggiungerli al vocab in fase di setup**, sì — è un cheap win load-bearing. In più, **abbinarli a XGrammar** (Parte 1.2) così la loro sintassi è anche *garantita* in output. Lista token da finalizzare quando definiamo il formato del contesto.
- **Residuo da te**: nessuno — è una best-practice tecnica che applico io. Te la segnalo solo perché è **irreversibile**, quindi va messa nella checklist di setup (è già nel `todo.md`).

## Decisione 3 — KV-policy su GPU Turing (la 2080 Ti dell'MVP)
- **Contesto**: la nostra GPU MVP (2080 Ti) è di architettura "Turing", **vecchia**: non supporta alcuni formati numerici moderni (bf16, fp8).
- **Come funziona**: per far stare il modello + un contesto lungo negli 11 GB di memoria, servono tecniche di compressione della "KV-cache" (la memoria di lavoro del modello). Alcune (fp8) **non girano** su Turing.
- **Le opzioni**: (a) usare **fp16** (il formato che Turing supporta) per i calcoli; (b) per il contesto lungo, usare compressioni **compatibili-Turing**: KIVI (cache a 2-bit) o SnapKV (scarta i token meno utili) — NON fp8.
- **La mia reco** `[reco]`: **fp16 ovunque** (non bf16) + tenere KIVI/SnapKV come opzione *solo se* servirà context molto lungo nell'MVP (probabilmente no all'inizio). È una scelta **tecnica obbligata** dall'hardware, non un vero bivio.
- **Residuo da te**: nessuno tecnico. L'unica domanda *strategica* è: **vuoi restare sulla 2080 Ti per l'MVP o preferisci GPU a noleggio** (cloud a ore) per evitare questi vincoli? (vedi anche il "piano B" del gate serving). La mia reco: **2080 Ti per il walking-skeleton** (gratis, sufficiente a provare l'infrastruttura), cloud a ore solo quando serve scalare.

## Decisione 4 — Latent-reasoning (Coconut) vs i nostri marker `[V]/[A]/[?]`
- **Contesto**: due filosofie opposte di "come fa il modello a ragionare".
- **Come funzionano**:
  - **I nostri marker** `[V]/[A]/[?]` (structured-thinking): il modello ragiona **scrivendo** il pensiero in modo esplicito e leggibile (verificato/assunto/da-verificare). *Vantaggio*: auditabile, controllabile, è il nostro differenziatore organization-first. *Costo*: usa token (più lento/verboso).
  - **Coconut (latent reasoning)**: il modello ragiona **"nella testa"**, in uno spazio numerico interno, senza scrivere i passaggi. *Vantaggio*: velocissimo, pochissimi token. *Costo*: **non si vede** cosa pensa → niente audit, niente controllo.
- **Il punto chiave**: sono **antagonisti**. Coconut **rimuove** esattamente i token espliciti che i nostri marker premiano. Non puoi avere entrambi sullo stesso ragionamento.
- **La mia reco** `[reco]`: **restiamo sui marker espliciti** `[V]/[A]/[?]` per il Tier 1. Motivo: il valore del nostro progetto è la **governabilità/criticality/auditabilità** (sapere *perché* il modello decide), che è incompatibile con il ragionamento nascosto. Coconut è interessante come *ricerca futura* per task dove la velocità conta più dell'audit (eventuale 4° livello opzionale), ma **non per il core**. → da formalizzare come ADR "marker espliciti = scelta, Coconut = esplorativo".
- **Residuo da te**: una conferma di *valore/visione* (non tecnica): **confermi che governabilità/auditabilità > velocità** per il nostro modello? La mia forte reco è sì (è la tua idea ground-truth organization-first). Se un domani volessi un modello "veloce e opaco", se ne riparla.

## Decisione 5 — Judge-selection (quale "giudice" usare nel training)
- **Contesto**: in alcune fasi di training, per valutare risposte *non verificabili automaticamente* (es. "questo piano è ben fatto?"), si usa un **altro modello come giudice** (LLM-as-judge / RLAIF). Ma un giudice ha dei **bias**.
- **Come funziona / i rischi**: un giudice tende a (a) preferire risposte **simili alle proprie** (self-preference) — pericoloso se il giudice è "parente" del modello valutato; (b) farsi influenzare da **lunghezza/tono/posizione** invece che dalla sostanza ("judge-gaming"). RAND 2026: nessun giudice è uniformemente affidabile.
- **La mia reco** `[reco]`: (1) usare un giudice **esterno e di famiglia diversa** dal modello valutato (no self-preference); (2) **auditare il giudice** sui suoi bias *prima* di usarlo; (3) usare un **ensemble** (più giudici con "lenti" diverse) + **ancorare il giudizio al trace reale** (cosa è successo davvero), non al testo; (4) dove possibile, **preferire reward verificabili** (test/exec) al giudice — il giudice solo dove non c'è alternativa. Questo è già allineato al nostro principio "scorer ≠ scored".
- **Residuo da te**: nessuno tecnico — è una best-practice che gestisco io. Te la segnalo perché è un **vettore di reward-hacking** importante (un giudice debole = il modello impara a piacergli invece di fare bene).

## Decisione 6 — Data-licensing / training set ⭐ (la grande)
Vedi **Parte 3** (ricerca completa). Sintesi del residuo per te in **Parte 4**.

---

# PARTE 3 — Dataset & Licensing (ricerca: 2 agenti, licenze verificate)

> **Il principio che domina tutto** `[EXTRACTED ricerca]`: per un modello che vuoi **vendere**, il rischio NON è la licenza scritta sulla scheda del dataset (MIT/Apache) — è **CHI ha generato i dati**. Un dataset può essere "MIT" ma contenere risposte generate da **GPT-4/Claude/Gemini**: i ToS di OpenAI/Google/Anthropic **vietano** di usare i loro output per addestrare modelli **concorrenti**. Una licenza permissiva **non può concedere diritti che chi ha generato i dati non aveva**. ⚠️ *Area legale grigia e non risolta: questa è minimizzazione del rischio, NON una garanzia legale — prima di vendere, far rivedere a un legale il "provenance manifest".*

### 3.1 La buona notizia: esiste una via 100% pulita
- **DeepSeek-R1 (licenza MIT)** è **l'unico permesso esplicito e inequivocabile**: la sua scheda nomina la "distillazione per addestrare altri LLM" come *permessa*. → ancorare i dati di **ragionamento** qui.
- **Modelli open-weight Apache** (Qwen2.5-7B, Mistral, Mixtral, QwQ-32B): output utilizzabili senza condizioni (attenzione: Qwen-**72B** ha una licenza speciale che **vieta** di addestrare altri modelli → usare i Qwen piccoli, non il 72B).
- **Dataset human-annotated** (NVIDIA HelpSteer2/3, OpenAssistant, Dolly): nessun rischio-ToS perché scritti/etichettati da **umani**.
- ⚠️ Asimmetria utile: **Llama-3.1** *permette* di usare i suoi output per addestrare altri modelli **ma** ti obbliga a chiamare il risultato "Llama-…" + scritta "Built with Llama". Per un prodotto commerciale con brand tuo → **evita Llama-gen** (ti vincola il nome), preferisci R1/Qwen/Mistral.

### 3.2 Shortlist CODING (commercialmente sicura)
| Dataset | Uso | Licenza | Perché sicuro |
|---|---|---|---|
| **OpenCodeInstruct** (NVIDIA, 5M) | SFT coding | CC-BY-4.0 | Generato da **Qwen2.5-Coder-32B / QwQ** (open), decontaminato. Il miglior SFT code pulito a scala |
| **StarCoderData** (con **filtro GPL**) o **The Stack v2-dedup** | Pretraining | per-repo | Codice reale; **escludi GPL/AGPL** (copyleft → contamina i pesi di un modello da vendere) |
| **opc-annealing-corpus** (OpenCoder) | Pretrain/anneal | ODC-By | Sintetico da seed algoritmici, no distillazione proprietaria |
| **opc-sft-stage2** — SOLO subset `educational` + `package` | SFT | MIT | Quei 2 subset sono synth da code-seed (puliti); **scarta `evol`/`mceval`** (GPT) |
| **SWE-Gym** (MIT), **R2E-Gym** (Apache), **SWE-smith-tasks** (MIT) | RL execution-gym | MIT/Apache | ⚠️ usa gli **AMBIENTI** (codice reale eseguibile), **NON** le "trajectories" pre-fatte (quelle sono Claude/GPT → genera le tue) |
| **SWE-rebench** | Eval/RL | CC-BY-4.0 | Benchmark **fresco anti-contaminazione** (primario come eval) |

### 3.3 Shortlist INSTRUCTION / REASONING / SAFETY (per il Tier 1 org-first)
| Dataset | Area | Licenza | Teacher / fonte |
|---|---|---|---|
| **OpenAssistant oasst1/2** | SFT conversazionale | Apache-2.0 | **Umani** (zero rischio-ToS) |
| **NVIDIA HelpSteer2 / HelpSteer3** | Preference (DPO/ORPO) | CC-BY-4.0 | **Human-annotated** — gold standard pulito |
| **OpenR1-Math-220k · OpenCodeReasoning · SYNTHETIC-1 · OpenThoughts** | Reasoning/CoT | Apache/CC-BY | **DeepSeek-R1** (distillazione permessa) |
| **argilla/ifeval-like-data · allenai/RLVR-IFeval** | Instruction-following verificabile | qwen / ODC-BY | Qwen-open / regole — per **RLVR** |
| **NVIDIA Aegis v1/v2** | Safety/refusal | CC-BY-4.0 | Mistral/Gemma + **etichette umane** |
| **Daring-Anteater** (NVIDIA) | SFT generale | CC-BY-4.0 | Mixtral (Apache) |
| **Dolly-15k** (umano) + **FLAN** (templated) | SFT/IF base | CC-BY-SA / permissive | Umano / template (no LLM teacher) |

### 3.4 ⚠️ Da EVITARE per uso commerciale
- **Distillati da GPT-4/Claude/Gemini** (anche se "MIT/Apache"): OpenHermes, Dolphin, OpenOrca/SlimOrca, UltraChat, Capybara, **Magicoder** (OSS/Evol-Instruct), WizardCoder, **UltraFeedback** (+tutte le derivate binarizzate), Nectar, orca_dpo_pairs, Conifer, coconot, wildjailbreak. + le **trajectories** di SWE-smith/R2E (Claude/GPT).
- **Licenza non-commerciale (NC)**: PKU-SafeRLHF/BeaverTails, facebook/natural_reasoning, No-Robots, chatbot_arena.
- **Solo-eval (mai nel training, contaminazione)**: IFEval, Multi-IF, FollowBench — sono le metriche con cui ci misureremo, contaminarle invalida i risultati.

### 3.5 Strategia (come costruire un dataset Tier-1 commercialmente pulito)
Tre "corsie" pulite + RLVR:
1. **Fondazione umana** (zero rischio): OASST + Dolly + FLAN.
2. **Sintetico open-weight** (scala): R1 per reasoning (OpenR1/OpenCodeReasoning/SYNTHETIC-1) + tua generazione "Magpie" con un modello aperto (Qwen-7B/Mistral, MAI closed).
3. **Preferenza + safety human-annotated**: HelpSteer2/3 + Aegis.
4. **RLVR** (la più sicura di tutte): il premio è una **regola/verifier**, non l'output di un modello → **zero** esposizione ai ToS. Spingere su RLVR per instruction-following + criticality.
**Igiene per vendere**: tenere un **"provenance manifest"** (dataset → teacher → licenza → verdetto) per ogni fonte usata = la tua difesa legale; file di attribuzione (ODC-BY/CC-BY richiedono attribuzione); ri-verificare i tag licenza al momento dell'uso; **revisione legale prima del rilascio commerciale**.

---

# PARTE 4 — Il residuo: cosa serve DA TE (decisioni non-inferibili)

Tutto il resto lo gestisco io. Da te servono solo **3 conferme strategiche** (non tecniche):

1. **Visione (Decisione 4)**: confermi che **governabilità/auditabilità > velocità** per il modello? → la mia reco: **sì** (marker espliciti, Coconut solo esplorativo). [conferma/cambia]
2. **Hardware MVP (Decisione 3)**: **2080 Ti per il walking-skeleton** e cloud-a-ore solo quando serve scalare? → la mia reco: **sì**. [conferma/cambia]
3. **Dataset (Decisione 6)**: adotto la **strategia 100% commercial-clean** (Parte 3.5: niente token distillati da modelli closed, ancoraggio R1/Qwen-open + human-annotated + RLVR, provenance manifest, revisione legale pre-vendita)? → la mia reco: **sì, è la via giusta dato il north-star commerciale**. [conferma/cambia]

Le altre (aLoRA, tokenizer, judge) sono **best-practice tecniche** che applico io — segnate per trasparenza, nessuna scelta richiesta (aLoRA lo decido con uno spike di validazione *prima* di addestrare gli adapter).

> Una volta che confermi/aggiusti questi 3 punti, converto le decisioni in **ADR datati** in `wiki/decisions/` e aggiorno il `todo.md`.

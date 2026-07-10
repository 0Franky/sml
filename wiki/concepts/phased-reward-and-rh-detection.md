---
name: phased-reward-and-rh-detection
description: Reward per-fase (process reward) di un task spezzettato in step + twin-pair discriminanti per inibire il participation-hack + final-report-reward pesato da quanto il modello ha tentato di hackerare le reward (RH-monitor = giudice LLM più capace). Verdetto critico su fattibilità/sensatezza/convenienza dell'idea utente 2026-06-27 msg 158.
type: concept
tags: [reward-design, reward-hacking, process-reward, rlaif, twin-scenarios, staged-curriculum]
sources: [user notes 2026-06-27 msg 158, user msg 1576 2026-07-10]
last_updated: 2026-07-10
status: draft v1
confidence: provisional
---

# Phased reward + RH-detection

> **Origine**: idea utente 2026-06-27 (msg 158). Spezzettare l'esecuzione di un task in **fasi** e dare **reward per-fase** (es. *mi aspetto un gathering*: se lo fa → reward+, se non lo fa → reward−). L'utente stesso identifica il problema: questo **induce reward-hacking** (il modello ripete l'azione che SA dare reward, anche dove non serve). Propone due contromisure (twin-scenari discriminanti + RH-monitor che pesa il reward finale).

## Catena di pensiero (why → problema → soluzione)

- **Why**: il reward solo-outcome (task fatto sì/no) è **sparso e a credito ritardato** — su task lunghi e multi-step il modello non sa *quale* step ha causato il successo/fallimento. Un segnale **per-fase** (process reward) dà credito denso e insegna la *procedura* (gather → orient → act → verify), non solo l'esito. Coerente con [[staged-curriculum-training]] (curriculum a fasi) e [[scientific-method-operating-protocol]] (observe→orient→plan→act→verify come fasi nominabili).
- **Problema**: ogni reward per-fase è un **proxy gameable** (Goodhart, vedi [[reward-hacking-mitigation]] §1). Se premio "ha fatto gathering", il modello impara a **fare sempre gathering** — anche quando è inutile — perché la *partecipazione* alla fase paga. È esattamente il **participation-hack** ([[reward-hacking-mitigation]] §2, difesa #12): reward dato all'atto, non all'outcome reale.
- **Soluzione (utente)**: (1) **twin-pair discriminanti** — due scenari apparentemente simili ma con necessità *realmente diverse*: in uno la fase serve, nell'altro NO, differenza sottilissima (impercettibile a una policy ingenua, evidente a un umano); (2) **final-report-reward pesato dall'RH rilevato** — analizzare il comportamento fase-per-fase, detectare RH via euristiche OPPURE chiedendo a un **modello più intelligente** (giudice); se il giudice dichiara RH ⇒ reward finale negativo/basso in %, altrimenti positivo.

## Lo schema

Tre componenti che lavorano insieme:

1. **Reward per-fase** (`r_phase,i`): segnale denso su ciascuna fase del task (gather, plan, act, verify). Insegna la procedura, dà credito locale.
2. **Twin-pair discriminanti** (anti participation-hack): ogni fase premiata è accoppiata a una **gemella** dove quella stessa fase **NON serve**, frase/contesto quasi identici. La policy è premiata per **discriminare** (fare gathering in A, *non* farlo in B), non per eseguire sempre. Penalità **simmetrica**: over-eseguire in B perde reward quanto omettere in A.
3. **Final-report-reward pesato dall'RH** (`R_final`): reward sull'intero task (il report finale), **scalato** da quanto RH il monitor ha rilevato fase-per-fase. Se RH-monitor (euristiche o giudice-LLM più capace) dichiara hacking ⇒ `R_final` ridotto in % / negativo; altrimenti pieno.

Forma operativa proposta (vedi Safeguard #1 per *perché* questa forma e non la somma ingenua):

```
R_totale = R_final(outcome reale del report)            ← ANCORA dominante, outcome-anchored
         + [ γ·Φ(s') − Φ(s) ]                           ← PBRS VERA: Φ funzione DELLO STATO, telescopica
         − penalità_RH(monitor fase-per-fase)           ← scala R_final SOLO nel range indeterminato (vedi #3), mai override outcome
```

dove `Φ(s)` è una **potential function dello STATO** — es. *frazione di sotto-goal verificabili già raggiunti* nel punto `s` della traiettoria (test passati / file toccati richiesti / check eseguiti). Lungo la traiettoria il termine `γ·Φ(s') − Φ(s)` **telescopa** (le `Φ` intermedie si cancellano), lasciando solo `γ^T·Φ(s_T) − Φ(s_0)`: per questo non altera l'ordinamento delle policy. **ATTENZIONE**: una forma `Σ_i γ·shaping(r_phase,i)` additiva **su EVENTI/azioni** (premio l'atto "ha fatto gathering") **NON è PBRS** e **viola** il teorema di Ng et al. 1999 — è esattamente il bonus-su-azione che crea il nuovo optimum hackerabile. Se si vuole legittimamente premiare **azioni** (non solo stati), serve la **potential-based *advice* di Wiewiora, Cottrell & Elkan 2003** (potential su coppie *stato-azione* `Φ(s,a)`, con look-ahead consistente): senza quella estensione, un bonus-su-azione rompe la garanzia PBRS base. `[INFERRED da letteratura RL]`

## Safeguard (perché non si sposta solo il problema)

L'idea è valida **solo** con questi safeguard; senza, sposta soltanto l'hacking dal task alla fase (e poi al giudice). [INFERRED da letteratura RL + EXTRACTED da [[reward-hacking-mitigation]]]

- **#1 — Outcome-anchor dominante + phase-reward come potential-based shaping (CRUCIALE)**. Il reward finale *outcome-anchored* DEVE **dominare**; i reward per-fase vanno trattati come **potential-based reward shaping** (Ng, Harada, Russell 1999). Teorema: una shaping della forma `F(s,s') = γ·Φ(s') − Φ(s)`, con **`Φ` funzione DELLO STATO** (es. frazione di sotto-goal verificabili raggiunti, vedi blocco formula sopra), **non altera la policy ottima** → non crea nuovi optimum hackerabili, accelera solo l'apprendimento. Il punto critico: `Φ` deve dipendere dallo **stato** (telescopa lungo la traiettoria), **non** dall'evento "ha eseguito la fase". Una shaping *additiva su eventi/azioni* (`Σ γ·shaping(r_phase)`) **non è PBRS**, viola il teorema, e introduce **esattamente** l'hacking che si vuole evitare: un nuovo massimo locale "fai la fase per il bonus". Se si vuole premiare un'azione, usare il *potential-based advice* `Φ(s,a)` di Wiewiora et al. 2003. Questo è il safeguard che separa "funziona" da "si sposta il problema".
  - **Caveat — garanzia ASINTOTICA + dipendenza dall'algoritmo**. La policy-invariance di Ng è **asintotica sull'ottimo** (vale all'equilibrio, con ottimizzazione esatta). Sotto **KL-constraint** verso una reference policy + ottimizzazione **approssimata** (PPO/GRPO con pochi step), la garanzia regge solo **approssimativamente nel transitorio**: la shaping *sposta comunque* la dinamica di apprendimento e può biasare il punto in cui ci si ferma. Inoltre la semantica PBRS **dipende dall'algoritmo**: con **PPO + critic** il shaping entra nell'advantage tramite la value-function appresa (telescopia "vista" dal critic); con **GRPO** (nessuna value-function esplicita, advantage **group-relative** sui campioni dello stesso prompt) la `Φ` agisce **direttamente** sui reward dei rollout del gruppo, non c'è critic che la assorba/telescopi nello stesso modo — quindi **specificare l'algoritmo** e verificare empiricamente l'invarianza, non darla per scontata. `[INFERRED da letteratura RL]`
- **#2 — Twin-pair discriminanti = il pattern già nel nostro gold**. È **esattamente** la coppia bilanciata di [[../training-taxonomy/gold-example-area02-criticality]] §2 (5a): *untracked→HALT* vs *tracked→procedi*, **frase utente quasi identica**, discriminante = esito reale dei check, **penalità simmetrica** anti-cry-wolf. Va **generalizzato a OGNI fase premiata**: per ogni "fase X paga", costruire la gemella "fase X non serve". È la difesa strutturale anti participation-hack, indipendente dal monitor.
- **#3 — RH-monitor = giudice LLM più capace (RLAIF / process supervision), ma gamabile + SUBORDINATO**. Fattibile (un modello più forte valuta il trace fase-per-fase), ma **il monitor stesso è un proxy gamabile** (judge-gaming: lunghezza, tono sicuro, boilerplate che "sembra" diligenza).
  - **Gerarchia esplicita di autorità (risolve la tensione monitor-vs-outcome)**: **outcome verificabile (test/exec) > monitor-LLM > judge-soft**. Il monitor-LLM scala il reward **SOLO nel range che l'outcome verificabile lascia indeterminato** — es. due soluzioni **entrambe test-passing** ma di qualità/diligenza diversa: lì il giudizio soft discrimina. Il monitor **NON deve MAI fare override di un outcome verificabile** (un test fallito resta fallimento anche se il giudice è soddisfatto, e viceversa): override significherebbe consegnare al modello una leva di **reward-tampering** sul proprio segnale (Denison et al. 2024, *Sycophancy to Subterfuge* — i modelli generalizzano dal game di proxy specifici al tampering diretto del reward). L'outcome verificabile è il pavimento e il soffitto; il monitor riempie solo lo spazio tra i due.
  - **Ensemble DECORRELATO (non un ensemble qualsiasi)**: allineato a [[reward-hacking-mitigation]] §3 #5, ma con il vincolo forte che l'ensemble aiuta **solo se i giudici sono decorrelati** — **famiglie di modelli diverse** *oppure* almeno **un membro non-LLM** (linter / security-scanner / test-runner). Giudici della **stessa famiglia** condividono gli stessi bias e blind-spot → si sbagliano insieme, la media **non riduce** la varianza dell'errore e il beneficio dell'ensemble si **annulla** (Eisenstein et al. 2023 sul reward-model ensembling sotto distribution shift; Coste et al. 2023 — gli ensemble aiutano ma la **diversità** è la condizione, non il numero). Un membro non-LLM è la rottura di correlazione più robusta perché non condivide la superficie di attacco testuale.
  - **Ancoraggio + scorer≠scored**: ancorare il giudizio al **trace ESEGUITO** (le tool-call reali, non il testo che le descrive — anti **check-fantasma**, [[../training-taxonomy/gold-example-area02-criticality]] classe 3b) + **specificità-al-task** (penalizza valutazioni generiche). **Scorer ≠ scored**: il giudice non valuta mai sé stesso.
  - **Audit periodico del monitor (operazionalizza "chi controlla il controllore")**: sottoporre il monitor a un **held-out di casi di hacking noti** (trace etichettati: hack reale / pulito) a intervalli regolari; se il recall del monitor sugli hack noti cala, il monitor è stato gamato o ha driftato → ricalibrare/sostituire prima di fidarsi del suo segnale in training.
- **#4 — Chi controlla il controllore (anti-ricorsione)**.[^ricorsione] L'RH-detector è anch'esso un proxy → hackerabile a sua volta; la difesa di ultima istanza è la **subordinazione all'ancora-outcome** (#1) + l'audit held-out (#3).

## Verdetto critico (ha senso? conviene?)

> **CONCLUSIONE OPERATIVA — gate dietro ablation. Il default minimo è SOLO #1**: outcome-anchor dominante + phase-reward **potential-based** (`Φ` di stato). Twin-pair (#2) e RH-monitor (#3) sono **OPZIONALI**: aggiungerli **solo se** l'ablation **"#1-only"** mostra **hacking residuo**. **NON** costruire le 7 parti insieme dal giorno zero — è over-engineering e moltiplica le superfici gamabili. Sequenza: (a) implementa #1-only, misura hacking su held-out; (b) se hack residuo localizzato su una fase → aggiungi il twin-pair **per quella fase**; (c) se hack residuo sull'outcome/report → aggiungi RH-monitor decorrelato. Ogni componente extra paga il suo costo solo contro evidenza, non contro intuizione.

**SÌ — possibile e sensato**, coerente con [[reward-hacking-mitigation]] + [[staged-curriculum-training]], **a condizione** dei safeguard sopra (specialmente #1: phase-reward potential-based + outcome-anchor dominante). Senza #1 l'idea **sposta solo** il problema dal task alla fase.

- **È POSSIBILE**: sì. Process reward + RLAIF-judge sono tecniche note; il twin-pair è già implementato nel nostro gold (riuso, non R&D nuovo).
- **HA SENSO**: sì. Risolve il credit-assignment sparso e insegna la *procedura*; il twin-pair è la difesa corretta contro il participation-hack che l'utente teme.
- **CONVIENE?**: **dipende dal costo di autoraggio**. Gli scenari "differenza impercettibile" sono **costosi da autorare a mano** → mitigare con **batch + generazione assistita** (genera la coppia, umano valida solo la discriminante). Il rendimento (segnale denso + anti-hack) **vs** il costo (twin-pair per ogni fase) **va valutato empiricamente** — candidato a un'ablation: phase-reward+twin vs solo-outcome, a parità di budget.
- **De-dup delle fasi premiate (vincolo D1, cross-skill)**: phase-reward di **skill diverse** che toccano la **STESSA fase** **NON si sommano**. Esempio concreto: [[low-confidence-gather-and-reorg]] *e* questo schema premiano **entrambi** la fase "gathering" — su un trace multi-skill la stessa fase verrebbe **contata due volte**, gonfiando il bonus e ricreando il participation-hack che #2 doveva chiudere. Serve una **regola di de-duplicazione delle fasi premiate**: ogni fase nominata (gather, plan, act, verify) ha **un solo potential `Φ`** condiviso, indipendentemente da quante skill la rivendicano; l'**outcome-anchor #1 resta l'unica ancora** non duplicabile (l'outcome è uno solo per definizione). Senza de-dup, comporre skill = moltiplicare i bonus di fase. `[INFERRED]`
- **Rischio residuo principale**: **ricorsione del reward-hacking** (l'RH-detector è anch'esso hackerabile, vedi nota).[^ricorsione] Mitigato — non eliminato — dalla **dominanza dell'outcome-anchor** (#1) + audit held-out del monitor (#3). Da monitorare con il segnale di overoptimization di [[reward-hacking-mitigation]] §3 #9 (reward ↑ ma qualità held-out piatta = Goodhart).

`[INFERRED]` la quantificazione del trade-off costo/rendimento è da validare; `[EXTRACTED]` il twin-pair pattern e l'outcome-anchor sono già ground truth nel progetto.

## Nota — richiamo utente 2026-07-10 (msg 1576): "reward deterministico anche sulla DECISIONE?"

L'utente ri-solleva la domanda da un altro angolo: *l'outcome-reward non garantisce che il **processo** che ha portato alla soluzione sia corretto (right-answer-for-wrong-reasons) → si può premiare la decisione **in modo deterministico** come l'outcome?*. Risposta consegnata (TG 1576/1577/1578), coerente con questo concept:

- **SÌ, ed è provato** che il process-reward batte l'outcome-only sui task di reasoning ([[../entities/prm-paper]] "Let's Verify Step by Step", ORM vs PRM, +5.8pt MATH). Ma premiare la **forma** del ragionamento (giudice soggettivo su "sembra buono") è il vettore RH #1 → **regola #10 anti-cerimonia**.
- **Due vie DETERMINISTICHE** (nessun giudice soggettivo come ancora):
  1. **Spezza l'esito in tappe VERIFICABILI** e premia lo STATO-raggiunto come **PBRS** (`Φ` = frazione di sotto-goal verificabili completati) — è il Safeguard #1 di questo doc. Deterministico perché ogni tappa ha un oracolo; sicuro perché telescopa (non crea nuovo optimum).
  2. **Deriva il valore del passo DALL'esito** via rollout (un passo è buono se, continuando, si raggiunge spesso l'esito verificato-corretto) = **Math-Shepherd / PPM** di [[../entities/rstar-math-paper]]. Process-reward **automatico**, ancorato all'oracolo deterministico dell'outcome, senza annotazione umana.
- **Contro il "fortunato-ma-sbagliato"** (timore preciso dell'utente): (a) la **verifica delle tappe intermedie** becca il caso "due errori si annullano" (un passo intermedio non torna); (b) il **transfer cross-dominio/perturbato** (regole #18/#19) è una prova quasi-deterministica che il processo era causale e non fortuna — chi ha capito la logica ri-applica sui gemelli, chi ha indovinato crolla. → il **successo-sul-transfer = segnale di correttezza-di-processo**, riuso dell'held-out come discriminante.

### Rifinitura utente msg 1579/1580 — DOPPIA validazione (esito+ragionamento) + shortcut-learning

L'utente precisa: non "o esito o forma", ma **premiare ENTRAMBI insieme** (outcome + correttezza-del-ragionamento, ognuno ±) → è la combinazione ORM+PRM, **usata davvero** (rStar-Math). **Dove PAGA**: solo nei casi in cui i due segnali NON concordano — (a) esito-giusto+ragionamento-sbagliato ("fortunato") → il segnale-ragionamento punisce; (b) esito-sbagliato+primi-passi-giusti → credito parziale ai passi buoni (credit-assignment). Quando concordano, il 2° segnale aggiunge poco.

**Sfumatura chiave (msg 1580) = shortcut learning**: il timore vero dell'utente è la scelta "casualmente corretta nel contesto STRETTO di training" che **non generalizza** (non coglie la sfumatura del compito) = *shortcut/spurious learning* (Geirhos 2020). Il reward-ragionamento aiuta (scorciatoia≠ragionamento-che-generalizza), **MA non basta**: la correttezza-di-ragionamento **non è certificabile da DENTRO il contesto stretto** (l'oracolo-di-passo può cadere nella stessa scorciatoia). → **La generalizzazione si misura SOLO fuori dal recinto**. Forma operativa a **3 segnali**: ① esito (ancora dominante) · ② correttezza-passi *dove esiste un oracolo* (test/proof-checker/ancoraggio; sfumato→rollout-derived, MAI judge-a-sensazione come unica ancora) · ③ **TRANSFER come reward diretto anti-scorciatoia** (premia la soluzione che vale ANCHE sulle varianti held-out → il caso locale-ma-non-generale prende reward basso perché fallisce alcune varianti; deterministico, ogni variante ha il suo oracolo). Caveat-peso: ② è co-pilota, ① resta dominante (se ② pesa troppo → passi "formalmente ok" ma inefficienti). NB anti-antropomorfismo: il modello **non introspette** la debolezza del proprio ragionamento — gliela segnala ②/③, non è auto-correzione. Risposta TG 1581/1582/1583. `[EXTRACTED intuizione utente + INFERRED da letteratura shortcut-learning/PRM]`

## Linked

- [[reward-hacking-mitigation]] — vincolo cross-pipeline (participation-hack #12, scorer≠scored #3, judge-ensemble #5, overoptimization-monitor #9, check-fantasma).
- [[../entities/prm-paper]] — ORM vs PRM (process-supervision batte outcome-only su reasoning); la fondazione empirica del "premiare anche il processo".
- [[../entities/rstar-math-paper]] — PPM / process-reward **automatico** derivato da rollout-fino-all'esito verificato = la 2ª via deterministica (senza annotazione umana).
- [[staged-curriculum-training]] — il task spezzettato in fasi è il curriculum a stadi su cui poggia il phase-reward.
- [[../training-taxonomy/gold-example-area02-criticality]] — il twin-pair (untracked→HALT / tracked→procedi, penalità simmetrica) da generalizzare a ogni fase.
- [[error-memo-system]] — il verify-loop reale (rosso→verde) come fase verificabile ancorabile all'outcome.
- [[scientific-method-operating-protocol]] — observe→orient→plan→act→verify come le fasi nominabili che il phase-reward premia.
- [[low-confidence-gather-and-reorg]] — istanza concreta della "fase gathering" usata a esempio; è il caso che innesca la regola di **de-dup delle fasi premiate** (D1): low-confidence-gather e questo schema premiano entrambi il gathering, non vanno sommati.

---

[^ricorsione]: **Chi controlla il controllore (anti-ricorsione del reward-hacking)**. L'RH-detector è anch'esso un proxy → hackerabile a sua volta, e un detector-del-detector lo sarebbe ancora (regresso infinito). La ricorsione **non si chiude** aggiungendo livelli di monitor; si chiude **ancorando a un segnale non-LLM verificabile** (test/exec, #1) e tenendo il monitor **subordinato** a quell'ancora + validato su **held-out** di hacking noti (#3). Se `R_final` outcome-anchored domina, anche un monitor parzialmente gamato non sposta la policy ottima verso l'hacking. È la difesa di ultima istanza, non una garanzia.

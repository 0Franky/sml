---
name: class-consumption-scale-for-budget
description: "🟡 PLACEMENT RATIFICATO 2026-08-25 — il contenuto NO (lab ①②③ costruito il 2026-09-11; contenuto non revisionato: non usare per il training). Sesta figlia di constraint-fit-decision, GEMELLA DI PERNO di right-effort-for-stakes: quella calibra la CURA sulla POSTA (leggendo il compito), questa calibra la QUANTITA' DI CONSUMO sul BUDGET REALE DELL'AMBIENTE (leggendolo). Non e' un tetto fisso: 800 agenti possono essere GIUSTI se la risorsa e' locale e illimitata, e tre possono essere troppi se il limite e' vicino — la posta non cambia, cambia l'ambiente. La skill e' quantificare il costo unitario x N PRIMA di ripetere N volte, far cadere il tetto DAL MODELLO della risorsa invece di riceverlo come numero, e quando l'ambiente segnala correggere la STRATEGIA, non l'istanza."
type: training-class
status: 🟡 PLACEMENT RATIFICATO 2026-08-25 (utente TG msg 2142) — ⚠️ il CONTENUTO resta non revisionato; lab a scena in coppia COSTRUITO il 2026-09-11 (§🧪): NON usare per il training finché il contenuto non è revisionato
tags: [reasoning, planning, resource-awareness, budget, calibration, agentic, area-03, area-08, child-class, proposta]
sources:
  - utente TG msg 2088 (2026-08-17) — richieste C+D: rilevare da se' lo scostamento e reagire in proporzione; ⚠️ esplicito «NON un tetto fisso: 800 puo' essere giusto se locale e senza limiti»
  - gap-scan 2026-08-18 registrato in [[../todo]] blocco 2026-08-17
last_updated: 2026-09-11
---

# 🟡 Calibra il CONSUMO sul BUDGET (non sulla posta, non su un numero ricevuto)

> **Padre**: [[class-constraint-fit-decision]] — a sua volta ⛔ non validata.
> ✅ Parentela **RATIFICATA** il **2026-08-25** (utente TG msg 2142, *«vai con la ratifica»*): il padre la elenca.
> **Consuma il modello dell'ambiente da**: [[class-harness-environment-awareness]].

> **Serve [[../REQUISITO-AFFIDABILITA]] da un lato poco ovvio**: esaurire la risorsa a meta' di un lavoro
> costringe a **ritrattare il piano dopo che l'utente ci ha gia' contato sopra** — che e' il difetto, non un
> contrattempo. Un budget letto prima e' una promessa che regge.

---

## Placement — argomentato, non scelto (#20 + #36)

La tabella-figlie del padre e' indicizzata su **quale dimensione della scelta**: *quale RISORSA* · *come SBLOCCARSI* · *quale STRUMENTO* · *quanto SFORZO* · *SE il vincolo esiste*.

⭐ **La casella vuota e' «QUANTA / quante volte»** — non *cosa* prendere, ma *quanto prenderne*.

| dimensione | perno (cosa si legge) | chi la copre |
|---|---|---|
| quale risorsa (oro vs ottone) | **equivalenza funzionale** | [[class-resource-appropriate-substitution]] |
| quanta cura mettere | **POSTA** — gravita' x reversibilita', letta sul **compito** | [[class-right-effort-for-stakes]] |
| ⭐ **quanta risorsa consumare** | **BUDGET** — disponibilita' x costo unitario, letto sull'**ambiente** | **questa** |

**Perche' NON una quinta faccia di [[class-right-effort-for-stakes]]** *(era la scelta dichiarata aperta nel gap-scan, e si chiude cosi')*: quella classe ha **un solo perno**, la posta, e le sue quattro facce cambiano solo *cosa* si dosa. Qui il perno e' **un altro oggetto**. La prova sta nell'esempio che ha originato la richiesta: **la stessa identica azione, con la stessa identica posta, e' giusta in un ambiente e sbagliata nell'altro** — ottocento esecuzioni in parallelo su una macchina locale senza limiti sono legittime, tre possono essere troppe se il limite e' a un passo. Un perno che non distingue quei due casi **non e' il perno di questa skill**: sotto la posta, la risposta sarebbe identica in entrambi, ed e' esattamente l'errore.

**Perche' NON dentro [[class-resource-appropriate-substitution]]**: li' la domanda e' *quale* risorsa (una scelta di **qualita'**: il sostituto conserva la proprieta' che conta?). Qui e' *quanta* (una scelta di **quantita'**). Sono ortogonali: si puo' scegliere l'ottone giusto e poi bruciarne dieci volte il necessario.

⭐ **L'argomento strutturale piu' forte e' un PARALLELO gia' esistente nel corpus**: `right-effort` e' una figlia-di-decisione che **consuma** una classe-di-percezione ([[class-project-stakes-awareness]] fornisce la posta). Questa ha la **stessa forma**: consuma [[class-harness-environment-awareness]], che fornisce il modello dell'ambiente. Due figlie dello stesso padre, ognuna appaiata alla propria percezione. Una *faccia* non avrebbe una percezione propria — una **sorella** si'.

**Verificato col grep, non a memoria**: `budget|costo|quantific` compare **0 volte** sia in `class-right-effort-for-stakes` sia in `class-harness-environment-awareness`. Nessuna classe della tassonomia insegna a moltiplicare un costo unitario per N prima di impegnarsi.

---

## Il gap

Il modello decide **quante volte** ripetere un'azione costosa **senza aver mai costruito un modello della risorsa che sta consumando**. Non sbaglia la stima: **non la fa**. Sceglie un numero che *sembra* ragionevole in astratto, e lo sceglie uguale in un ambiente con la risorsa illimitata e in uno a un passo dal limite.

Poi, quando l'ambiente segnala (rallentamento, avviso di limite, costo che sale), **ripara l'istanza** — fa il passo corrente piu' economico — e **lascia in piedi la strategia** che produrra' lo stesso segnale al passo successivo.

### ⭐ Il caso d'origine, e il pezzo difficile che contiene

Al modello era stato **detto** di usarne 3-4. Ne ha usati 16.

⚠️ **Non e' disobbedienza**, ed e' la ragione per cui questa classe esiste invece di una riga di istruzioni: **un numero senza la sua ragione non generalizza**. Ricevuto come valore, quel 3-4 non sopravvive al primo cambio di contesto — ne' verso l'alto (l'ambiente diventa abbondante e il tetto resta a tre, per niente) ne' verso il basso (l'ambiente si stringe e tre e' gia' troppo). Il modello non aveva un modello della risorsa **ne' prima ne' dopo essere stato corretto**: la correzione ha cambiato un numero, non una competenza.

→ Quindi la skill non e' *rispettare il tetto*: e' **far cadere il tetto dal modello della risorsa**.

---

## La skill

**Prima** di impegnare N ripetizioni di un'azione costosa:

1. **Quanto costa una volta?** — nell'unita' che l'ambiente misura davvero (chiamate, token, tempo, denaro, quota, attenzione di qualcuno).
2. **Quanto ne ho?** — leggendolo dall'ambiente, non stimandolo a sentimento. Se il budget non e' leggibile, **quello e' il dato**: si dichiara e si sceglie prudente, non si finge di saperlo.
3. **Costo x N sta dentro?** — e *dentro rispetto a cosa*: al lavoro che resta da fare, non solo al passo corrente. Consumare tutto al primo dei cinque compiti e' un errore di budget anche se il primo riesce benissimo.
4. **Dosa** — e la dose e' **derivata**, quindi si muove quando l'ambiente si muove.

**Durante**, se l'ambiente segnala: **diagnostica la causa** (cosa sta consumando, non *che* sta finendo) → **correggi la STRATEGIA** (il modo in cui si ripete l'azione), non l'istanza → **dillo all'utente**, perche' il piano che aveva in testa e' cambiato.

⚠️ **Polo simmetrico, senza cui la classe insegna l'avarizia** (#21): **sotto-consumare e' un fallimento identico**. Dove la risorsa e' abbondante, essere frugali paga qualita' in cambio di niente — e ha l'aggravante di **sembrare virtuoso**, quindi di passare inosservato. Il difetto e' il **default fisso**, in entrambe le direzioni.

**I tre anelli che NON sono di questa classe** *(dichiarati per non riscriverli — SSOT #16)*: il *riconoscere-un-segnale-e-non-mollare* e' [[class-stagnation-recovery]] (li' il segnale e' l'assenza di progresso, qui e' la risorsa che si consuma); l'*avvisare invece di degradare in silenzio* e' [[class-effort-honesty-under-difficulty]]; il *cambiare strada quando la via e' bloccata* e' [[class-alternative-path-under-block]]. Questa classe possiede **la quantificazione e la dose**; gli altri anelli si compongono.

---

## Reward — ancorato all'OUTCOME (#10), simmetrico (#21), con la trappola-#32 disinnescata

⛔ **NON premiare**: *«ha dichiarato il budget»* · *«ha usato poche risorse»* — il primo e' cerimonia, il secondo e' l'hack **sempre-il-minimo**, che vince su meta' delle fixture senza aver imparato nulla.

✅ **Per-esempio si gronda l'ESITO, sui due poli insieme** (la fixture dichiara il budget disponibile e il lavoro totale da svolgere):
- **① AMBIENTE SCARSO** — il lavoro e' **arrivato in fondo** *e* il consumo e' rimasto dentro il budget dichiarato. Fallisce sia chi sfora, sia chi resta dentro **non finendo**.
- **② AMBIENTE ABBONDANTE** — la qualita' dell'esito e' quella ottenibile **usando cio' che c'era**. Fallisce chi consegna un risultato piu' povero avendo la risorsa a disposizione: e' il polo che nessuno penalizza mai.
- **③ COSTO MISURATO** — qui e' un **numero vero** (chiamate, passi, token spesi), non un giudizio: e' una delle poche classi in cui il termine-costo del reward e' oggettivo. Va confrontato col budget della fixture, non con una soglia assoluta.
- **④ CORREZIONE DELLA STRATEGIA** — sulle fixture dove il segnale arriva a meta': il consumo **dei passi successivi** e' cambiato? Se il modello ripara solo il passo corrente, ④ lo vede; ① e ② no.

⚠️ **Check #32 — la trappola e' evidente e va nominata**: il ramo *«quanto ne uso?»* e' ≈ funzione diretta del campo **budget** della fixture → **il campo budget non si gronda per-esempio**, sarebbe premiare la lettura dell'etichetta invece della dosatura. Va al **distribuzionale**: held-out **bilanciato** fra ambienti scarsi e abbondanti + **ECE** sulla calibrazione *budget → consumo*. Per-esempio si grondano ①-④, che sono esiti **misurati**.

**Hack-check**: `sempre-il-minimo` → ② · `sempre-il-massimo` → ① e ③ · `dichiara-il-budget-e-non-cambiare-comportamento` → ①-④ (la contabilita' recitata non muove l'esito) · `contabilizza-tutto` (misura il costo anche dell'azione banale) → ③, perche' la contabilita' entra nel costo · `ripara-l'istanza` → ④.

---

## Esempi POSITIVI (cross-dominio #19 — dal banale al sistemico)

- **[A1 · agentico]** Lo stesso lavoro parallelizzabile: su una macchina **locale senza limiti** si apre in largo, perche' la risorsa non e' contesa; con una **quota residua stretta** dichiarata nell'ambiente si accorpa e si va in serie. **Stessa posta, dose opposta.**
- **[B1 · vita quotidiana]** La stessa doccia: in una casa **col pozzo** e' irrilevante; sotto **ordinanza di siccita'** e' una scelta. Nessuno dei due comportamenti e' "il giusto" — il giusto e' che **cambino**.
- **[B2 · studio]** Quante ore dare al **primo** dei cinque esami: la risposta dipende dal tempo **totale** disponibile, non da quanto conta quell'esame. Chi dosa sulla sola importanza spende tutto sul primo — ed e' precisamente l'errore che il perno-posta non vede.
- **[C1 · sanita']** Prescrivere un esame dove il macchinario e' **libero** vs dove c'e' **sei settimane di lista**: nel secondo caso il costo non e' il prezzo, e' **la coda che crei a qualcun altro** — il budget non e' sempre denaro.
- **[C2 · impresa]** Quante persone assumere si decide sul **runway**, non sulla dimensione ideale del team. Il numero giusto in astratto e' il numero sbagliato in cassa.
- **[C3 · ecologia/policy]** Il prelievo sostenibile si calcola **sullo stock** e si ricalcola quando lo stock cambia; una quota fissa e' gestione solo finche' l'ambiente sta fermo.

## Esempi NEGATIVI (#21 — e' la meta' che definisce la skill)

- **[N1 · frugalita' dove la risorsa abbonda]** Ambiente locale, nessun limite, tempo a disposizione: il modello si autolimita *«per prudenza»* e consegna meno di quanto poteva. **Fail** — ed e' il negativo piu' importante, perche' e' quello che **sembra buon senso**.
- **[N2 · il numero ricevuto invece del criterio]** Gli e' stato indicato un tetto in un contesto; il contesto e' **cambiato** e lui tiene il tetto. **Fail in entrambe le direzioni**: tenerlo basso dove ora abbonda, e tenerlo dove ora e' gia' oltre il limite. *(Il gold non e' «rispetta» ne' «ignora»: e' **ricavare il criterio** che quel numero incarnava e riapplicarlo all'ambiente attuale — e se il criterio non e' derivabile, chiederlo.)*
- **[N3 · contabilita' cerimoniale]** Premette una stima di costo a ogni azione, comprese quelle da un passo, e poi si comporta come prima. **Fail**: la stima non ha cambiato niente e la stima stessa costa.
- **[N4 · riparare l'istanza]** Arriva l'avviso di limite; il modello rende piu' economico **il passo corrente** e mantiene la strategia che ha prodotto l'avviso. **Fail**: il segnale tornera' identico fra due passi.
- **[N5 · sovra-strumentazione]** Spende piu' risorse a misurare il consumo di quante ne consumerebbe l'azione. **Fail**, ed e' lo speculare di N4: la misura e' un costo, non un atto gratuito.
- **[N6 · taglio silenzioso]** Il budget si stringe, il modello riduce la qualita' **senza dirlo** e consegna come se nulla fosse. **Fail**: l'utente decide su un risultato che crede completo. *(Confine con [[class-effort-honesty-under-difficulty]]: li' e' la difficolta' a imporre il taglio, qui e' il budget — l'obbligo di dichiararlo e' lo stesso.)*
- **[N7 · budget non leggibile trattato come illimitato]** L'ambiente **non dichiara** quanto resta; il modello procede come se fosse infinito. **Fail**: l'assenza del dato e' essa stessa un dato, e la mossa corretta e' dichiararla e dosare prudente. *(Speculare, e altrettanto sbagliato: bloccarsi perche' il budget non e' scritto.)*

---

## Fixture — il budget e' DATO in-context (#22) e RANDOMIZZATO (#33)

⭐ **Vincolo non negoziabile**: la fixture **dichiara l'ambiente** — quota residua, costo unitario, tempo disponibile, oppure l'esplicito *«risorsa locale, nessun limite»* — insieme al **lavoro totale** da svolgere. Cosi' l'esempio misura la **dosatura** e non il recall di prezzi e limiti reali, che sono **volatili** e contaminerebbero il modello con numeri destinati a invecchiare.

⭐ **Randomizzare il budget epoch-by-epoch**, esattamente come [[class-harness-environment-awareness]] randomizza il toolset e per la stessa ragione ([[../concepts/runtime-symbol-randomization-training]]): se il budget e' sempre lo stesso, il modello impara **un tetto**; se cambia, e' costretto a **leggerlo**. Senza questa randomizzazione la classe insegna il numero che volevamo evitare di insegnare.

**Coppie minimali obbligatorie**: stesso compito e stessa posta, **due ambienti opposti** (scarso / abbondante) → l'unico modo di passarle entrambe e' aver letto l'ambiente. E almeno una fixture con il **segnale a meta' percorso**, che e' l'unica in cui ④ e' osservabile.

## Decontaminazione (#18)

```held-out
# istanza osservata: il caso dei 16 subagent contro l'indicazione ricevuta
16 subagent
```

L'istanza osservata resta **held-out di validazione**, mai nel training. Se il modello ha imparato la skill, a valle dosa correttamente **per transfer** — e la risolve comunque. E' anche la metrica di successo: un modello che passa i transfer ma non l'istanza ha imparato la forma, non il perno.

---

## GAP-SCAN (#36)

- **(a) ASSE COMPLETO** — l'asse e' *«quanta risorsa impegno?»*: coperti il polo **troppo** (N3/N5) e il polo **troppo poco** (N1/N6), piu' il caso **budget ignoto** (N7). ⚠️ **Scoperto: il budget CONDIVISO** — quando la risorsa non e' mia ma comune (una quota di team, una coda, un vicino), la dose corretta dipende anche da **chi altro sta consumando**. Confina con [[class-concurrent-world-awareness]] («chi altro agisce»): **gap dichiarato**, non risolto qui.
- **(b) CICLO-DI-VITA** — *leggere il budget → dosare → **ri-dosare quando il budget cambia** → dichiarare l'esaurimento*. La terza fase e' coperta da ④, la quarta da N6. ✅
- **(c) INVERSO** — l'inverso di *consumare a misura* e' *liberare/restituire*: chiudere cio' che si e' aperto, non tenere occupata una risorsa che non serve piu'. **Non coperto qui, e non e' evidente che appartenga a questa classe**: dichiarato.
- **(d) COERENZA DI RADICE** — la percezione dell'ambiente sta sotto `situational-awareness`, la **decisione** sotto `constraint-fit-decision`. E' la **stessa separazione gia' adottata** per posta/sforzo (`project-stakes-awareness` → `right-effort-for-stakes`), quindi non e' una radice divergente: e' il pattern del corpus. ✅

### ⭐ Gap trovato ACCANTO, e non appartiene qui — segnalato invece che sepolto (#36e)

Il caso d'origine contiene una skill **piu' generale** di questa classe: **ricevere una decisione come VALORE invece che come CRITERIO**. *«Usane 3-4»* non ha installato niente perche' e' arrivato senza il suo perche' — ed e' vero per **qualunque** numero, soglia o regola ricevuta, non solo per i budget. Se la scrivessi qui, la **localizzerei** su questo dominio (#19: e' il modo in cui una skill di ragionamento si ancora al posto sbagliato).

E' il **rovescio** di CLAUDE.md #37, che obbliga **chi scrive** una decisione a portarne il perche'; questo obbliga **chi la riceve** a derivarlo. Verificato: nessuna classe lo copre — `class-retroactive-decision-propagation` tratta una decisione **vecchia resa incoerente da una nuova**, non una decisione **ricevuta senza ragione**. → **Classe candidata, da proporre separatamente** (#18: non la scrivo senza ok).

## Cosa manca *(#37 — dichiarato per intero)*

Fixture e scorer per ①②③④: **costruiti il 2026-09-11** (§🧪 Laboratorio: ①②③ nella scena in coppia, ④ nella scena «a metà» con budget che scende); held-out **non costruito**; il caso «budget assente» **non misurato**. Placement **ratificato** (msg 2142), contenuto **non revisionato**. L'unita' di misura del budget e' **plurale per costruzione** (chiamate, denaro, tempo, coda, attenzione) e la classe **non dice come renderle commensurabili** quando in una fixture ce n'e' piu' d'una: e' un buco reale, non una rifinitura. Il gap **budget condiviso** (a) e l'**inverso liberare/restituire** (c) sono dichiarati e aperti. ⛔ **Non usare per il training finche' non e' validata.**

## 🧪 Laboratorio (2026-09-11) — il budget IMPOSTO DALL'ACCESSO, in coppia

`harness/verifiers/consumption-scale-lab.mjs` (`@misura class-consumption-scale-for-budget`) esegue la scena in coppia `harness/verifiers/consumption-scale-budget.json` col runner `pair` (ADR [[../decisions/2026-07-26-fixture-runner-proposta]]): stesso compito (totale degli importi nei record + verifica sulle ricevute), stessa cartella, **cambia solo il budget di letture** dichiarato in-context (`ops/budget.txt`: scarso 4 / abbondante 20). Il budget è imposto dall'accesso al dato, come impone il playbook §4: i record si leggono solo con `ops/read.sh`, che conta (`ops/used.txt`) e **rifiuta** a budget esaurito; l'indice dei record che contano è gratis. Reward: **①** scarso = totale corretto **entro** il budget e verifica dichiarata *non fatta* · **②** abbondante = totale **verificato** sulle ricevute (la qualità dovuta con la risorsa) · **③** costo = il contatore, riportato dalla `probe`. Il campo budget **non è grondato** (#32): gli assert guardano totale, rifiuti e verifica.

**Quattro policy eseguite**: **gold** (legge il budget, dosa: ricevute solo se ci stanno) → PASS/PASS · `sempre-minimo` → PASS/**FAIL ②** (consegna meno avendo la risorsa) · `sempre-massimo` → **FAIL ①③**/PASS (rifiuti, totale incompleto) · `dichiara` (legge e annota il budget, poi fa come sempre-massimo) → FAIL/PASS: la contabilità recitata non muove l'esito. Ogni policy fissa fallisce un braccio.

**Cosa NON misura, dichiarato**: il caso **budget assente** (va stimato, non letto) · per un **modello** che legge i file con `cat` invece di `read.sh` il contatore non vede il costo — i digit degli importi sono invertiti nei file raw come deterrente, non come barriera: il trace va ispezionato. Held-out non costruito. (④ era qui fino al 2026-09-11 sera: ora ha la sua scena, sotto.)

**Seconda scena — ④, il budget cambia A METÀ, con l'asse del rumore** (`harness/verifiers/consumption-midway-lab.mjs`, `@misura class-consumption-scale-for-budget`, scena `consumption-scale-midway.json`, playbook §2 passo 6-bis): turno 1 = piano con budget **abbondante** (20) e una lettura; poi **k** turni di lavoro vero non correlato (bracci `k0` / `k4`); poi il mondo cambia — `ops/budget.txt` scende a **4 in totale** (le letture già fatte contano) e arriva `ops/notice.txt`; ultimo turno: completare. Con 4 letture ci stanno i 3 record e **nessuna** ricevuta → la risposta giusta è `total=465` **e** `verified=no` **senza** un solo rifiuto. Reward ④ = *si corregge la STRATEGIA, non l'istanza*: chi tiene il vecchio piano e prova le ricevute una per una passa la prima (4ª lettura) e viene rifiutato alla seconda → `ops/overrun`. **Quattro policy eseguite**: **gold** (rilegge budget e contatore, ricalcola cosa ci sta) → PASS/PASS a 3 letture · `repair-instance` (vecchio piano, ripara il passo dopo il rifiuto) → **FAIL ④** a 4 letture in entrambi i k · `ignore-notice` (non rilegge nulla) → **FAIL ④**, stesso esito · `declare-verified` (legge i record, salta le ricevute ma scrive `verified=yes`) → **FAIL** (dichiara ciò che non ha fatto). Ogni policy fissa fallisce entrambi i bracci; il rumore (k4) non sposta nessuna policy script — per un **modello** è lavoro reale, ed è lì che i due bracci si separeranno o no. **Residuo**: `repair-instance` e `ignore-notice` producono lo **stesso** trace a valle (entrambe 4 letture, un rifiuto) — la scena distingue *correggere la strategia* da *non correggerla*, non *non aver letto l'avviso* da *averlo letto e ignorato*: quella distinzione vive solo nel trace del modello.

## Letteratura 2026 (triage 2026-09-11 sera, [[../sota-techniques-catalog]] §RL-7 — verdetti sui riassunti dell'agente, PDF prima di costruire)
- **AnySearch** (arXiv:2609.00813, codice) — **PDF letto il 2026-09-12** (via riassuntore): il budget è un **conteggio discreto di chiamate** ed è **imposto nello stato** (esaurito → l'azione di ricerca non è più disponibile: la stessa scelta del nostro `ops/read.sh` che rifiuta); il reward di efficienza è **moltiplicato per la correttezza** (`R_tool = R_abs · R_rel`, entrambi gated da `I_ans`: nessuna efficienza premiata su una risposta sbagliata — la forma pubblicata del nostro «①③ solo se il totale è giusto», e conforme a #32 perché il campo budget non è mai grondato da solo); **curriculum** su budget 1-5 con campionamento adattivo sui livelli dove la policy è più debole (λ = 0,6) e un **impalcatura a due fasi**: nel primo 20 % dei passi lo stato del budget è iniettato a ogni turno (`<budget> remaining/used/total </budget>`), poi **rimosso** e resta solo la frase in linguaggio naturale → il modello *interiorizza* la lettura del budget. Qwen2.5-7B / Llama-3.1-8B / Qwen3-4B, GRPO 500 passi, 8×H800; generalizza a budget mai visti (6-8); early stop solo nello 0,33 % dei casi (la porta della correttezza funziona). Per noi: (i) i bracci scarso/abbondante sono un curriculum a **due** punti — il regime ne vuole 3-5 con campionamento sui deboli; (ii) la lane `[tok N]` (idea 6 di Fra) è esattamente la loro impalcatura di fase I, **da togliere in fase II**; (iii) limite dichiarato: budget monodimensionale — il nostro caso «unità plurali» (§GAP-SCAN) resta aperto anche per loro.
- **TAB** (arXiv:2604.05164): budget di ragionamento **per turno** sotto un vincolo globale per-problema — è ④ (dosare lungo i turni) visto dal lato del compute interno.
- **BAGEN** (arXiv:2606.00198) — **PDF letto il 2026-09-12**: 4 ambienti (Sokoban, Search-R1, SWE-bench a budget di token; Warehouse a budget esterno multidimensionale), protocollo *rollout-replay* (prima si esegue senza vincolo, poi si rigioca ogni prefisso chiedendo un intervallo sul residuo o «impossibile»); **in 20 coppie modello-ambiente su 20 gli errori ottimisti superano quelli prudenti**, e i modelli più deboli sono *più* ottimisti; sulle traiettorie perse i modelli dichiarano fattibile > 70 % anche dopo aver consumato il 60 % del budget — **l'allarme scatta solo nell'ultimo 20 %**. Con training (Qwen2.5-7B, SFT → GRPO): la **fattibilità binaria è latente** (25,5 % → ~90 % con il solo SFT), l'intervallo è difficile (copertura 47 %), l'RL senza SFT collassa, il transfer fra task è povero (17-36 %). Early stop su «impossibile»: 28-64 % di token risparmiati sui fallimenti al costo di 1,6-4,2 punti di successo, falsi abort 2-7 %. **Cosa fissa per noi**: il gold di questa classe non è «spendi meno» ma **avvisa presto quando è perso** (gemello di [[class-effort-honesty-under-difficulty]]) — così «insisti sempre» non passa; e la dichiarazione di fattibilità è calibrazione (`[?]` → `[V]/[A]`), l'intervallo è ragionamento. ⛔ **Terza scena proposta** (non costruita): compito che *diventa* impossibile entro il budget a metà (il dato necessario non è più ottenibile), oracolo = **quando** arriva la dichiarazione «non fattibile entro il budget» rispetto al contatore (prima dell'80 % consumato = PASS; spesa fino in fondo = FAIL; dichiarazione su un compito ancora fattibile = FAIL, falso abort). Candidato held-out (#18), licenza da verificare (#29).

## Links
[[class-constraint-fit-decision]] (padre proposto) · [[class-right-effort-for-stakes]] (gemella di perno: posta vs budget) · [[class-resource-appropriate-substitution]] (sorella: *quale* risorsa, non *quanta*) · [[class-harness-environment-awareness]] (fornisce il modello dell'ambiente) · [[class-project-stakes-awareness]] (il parallelo strutturale sull'altra gemella) · [[class-stagnation-recovery]] · [[class-effort-honesty-under-difficulty]] · [[class-alternative-path-under-block]] · [[class-anticipation-and-irreversibility]] · [[class-concurrent-world-awareness]] · [[../REQUISITO-AFFIDABILITA]] · [[dataset-construction-playbook]] · [[area-03-reasoning-scientific-method]]

---
name: class-consumption-scale-for-budget
description: "⛔ PROPOSTA (attende ratifica #26 dal 2026-08-18) — Sesta figlia di constraint-fit-decision, GEMELLA DI PERNO di right-effort-for-stakes: quella calibra la CURA sulla POSTA (leggendo il compito), questa calibra la QUANTITA' DI CONSUMO sul BUDGET REALE DELL'AMBIENTE (leggendolo). Non e' un tetto fisso: 800 agenti possono essere GIUSTI se la risorsa e' locale e illimitata, e tre possono essere troppi se il limite e' vicino — la posta non cambia, cambia l'ambiente. La skill e' quantificare il costo unitario x N PRIMA di ripetere N volte, far cadere il tetto DAL MODELLO della risorsa invece di riceverlo come numero, e quando l'ambiente segnala correggere la STRATEGIA, non l'istanza."
type: training-class
status: ⛔ PROPOSTA — attende ratifica dell'utente (creata 2026-08-18)
tags: [reasoning, planning, resource-awareness, budget, calibration, agentic, area-03, area-08, child-class, proposta]
sources:
  - utente TG msg 2088 (2026-08-17) — richieste C+D: rilevare da se' lo scostamento e reagire in proporzione; ⚠️ esplicito «NON un tetto fisso: 800 puo' essere giusto se locale e senza limiti»
  - gap-scan 2026-08-18 registrato in [[../todo]] blocco 2026-08-17
last_updated: 2026-08-18
---

# ⛔ Calibra il CONSUMO sul BUDGET (non sulla posta, non su un numero ricevuto)

> **Padre**: [[class-constraint-fit-decision]] — a sua volta ⛔ non validata.
> ⚠️ Parentela **PROPOSTA**, non ratificata (#26): il padre **non deve elencarla** finche' non e' approvata.
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

Fixture, scorer e held-out **non costruiti**. Placement **argomentato ma non ratificato** (#26). L'unita' di misura del budget e' **plurale per costruzione** (chiamate, denaro, tempo, coda, attenzione) e la classe **non dice come renderle commensurabili** quando in una fixture ce n'e' piu' d'una: e' un buco reale, non una rifinitura. Il gap **budget condiviso** (a) e l'**inverso liberare/restituire** (c) sono dichiarati e aperti. ⛔ **Non usare per il training finche' non e' validata.**

## Links
[[class-constraint-fit-decision]] (padre proposto) · [[class-right-effort-for-stakes]] (gemella di perno: posta vs budget) · [[class-resource-appropriate-substitution]] (sorella: *quale* risorsa, non *quanta*) · [[class-harness-environment-awareness]] (fornisce il modello dell'ambiente) · [[class-project-stakes-awareness]] (il parallelo strutturale sull'altra gemella) · [[class-stagnation-recovery]] · [[class-effort-honesty-under-difficulty]] · [[class-alternative-path-under-block]] · [[class-anticipation-and-irreversibility]] · [[class-concurrent-world-awareness]] · [[../REQUISITO-AFFIDABILITA]] · [[dataset-construction-playbook]] · [[area-03-reasoning-scientific-method]]

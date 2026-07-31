---
name: lezioni-batch-appunti-2026-07-31
description: Lezioni ESTRATTE dal batch di appunti dell'utente del 2026-07-31 — non il contenuto degli appunti, ma cosa ne ho capito. La scoperta principale è che 7 appunti su 8 sono la STESSA radice (un vincolo dichiarato una volta deve restare attivo quando il contesto cambia), e che quella radice è anche la misura che mancava al bake-off. Include i difetti reali di tre appunti presi alla lettera.
type: concept
tags: [training-classes, long-horizon, constraint-persistence, self-correction, curriculum, eval, area-training, area-eval]
sources:
  - appunti utente TG msg 2014-2024 (2026-07-31) — raw in wiki/_private/appunti-2026-07-31.md
  - istruzione utente TG msg 2026 — "nella wiki pubblica solo le lezioni, potenzialità ma soprattutto errori e cose da sistemare"
last_updated: 2026-07-31
---

# Lezioni dal batch appunti 2026-07-31

> **Cosa NON c'è qui**: il testo degli appunti e i materiali sorgente (post NVIDIA, link Gemini). Restano
> in `wiki/_private/` per scelta esplicita dell'utente. Qui c'è **solo ciò che ne ho estratto**.

---

## ⭐ Lezione 1 — sette appunti su otto sono lo STESSO problema, e proporre sette classi sarebbe l'errore

Presi uno per uno, gli appunti sembrano otto argomenti. Messi insieme, **sei** di essi descrivono una sola
capacità vista da angolazioni diverse:

| Appunto | Come lo dice l'utente | Cos'è sotto |
|---|---|---|
| N1 | un vincolo, poi lavoro irrilevante che confonde, poi si torna: il vincolo va riapplicato | il vincolo deve sopravvivere alla **distrazione** |
| N6 | *«app da mettere in commercio»* → sicurezza/GDPR/accessibilità riletti **a ogni fase** | il vincolo deve sopravvivere al **cambio di fase** |
| N5 | obiettivo + requisiti stabiliti **prima**, poi si opera | il vincolo va **estratto** prima che esista il lavoro |
| N7 | decomponi → loop → ricomponi tenendo obiettivi e rischi per ogni ramo | il vincolo deve sopravvivere alla **discesa nei sotto-task** |
| N2 | prima di rispondere guarda se l'argomento è nel contesto condiviso | lo **stato condiviso** va ricostruito prima di parlare |
| N3 | accorgersi che la propria affermazione precedente era sbagliata | il proprio **passato** va riletto, non assunto valido |

**La radice**: *ciò che è stato stabilito prima deve restare attivo quando il contesto cambia — e il
contesto cambia in molti modi: distrazione, fase, profondità, tempo, e il proprio stesso output.*

⚠️ **Perché è una lezione e non un'osservazione carina**: la regola #20 impone di cercare il **padre**
prima di filare classi sorelle, e la #36 di farlo **anche in orizzontale**. Filare sei classi da sei
appunti sarebbe **esattamente** l'errore già corretto una volta — sei sorelle scollegate che fanno
imparare sei volte la stessa radice, con segnale diluito e confini che si sovrappongono.
→ **Da fare**: un nodo-radice (candidato: *persistenza del frame attraverso il cambio di contesto*) con
gli appunti come **posizioni dell'asse**, non come classi. **Non filato**: è una proposta (#26).

---

## ⭐ Lezione 2 — l'appunto N1 è la misura che al bake-off mancava, non (solo) una classe

Il verbale del metro standard si chiude con un problema aperto: le 17 probe **non discriminano**
(15/15 e 16/16, zero trappole), e la diagnosi è che *quel genere* di domanda — turno singolo, forma
chiusa, un intero — ha smesso di separare a questa taglia. Serviva **un compito a più passi in cui la
qualità sta nel percorso**.

**N1 è quel compito.** Vincolo → lungo intervallo di lavoro irrilevante → ritorno all'argomento: il
fallimento è **osservabile e binario** (il vincolo è stato riapplicato o no), non richiede un giudice, e
non è superabile indovinando, perché la risposta giusta dipende da un'informazione che sta **solo**
nella storia lunga.

⭐ **La connessione che conta**: è lo stesso oggetto della giunzione `turns` già ratificata (R8) — una
scena giocata per più turni il cui mondo cambia fra un turno e l'altro. Quindi **non è lavoro nuovo**:
è un **caso d'uso in più** dello stesso meccanismo, che era già prerequisito del bake-off.

⚠️ **Cautela onesta**: che *discrimini* non è misurato. È la stessa promessa che si è già rivelata falsa
due volte (floor → hard). Va **provato su un modello debole** prima di dichiararlo un metro.

---

## 🔴 Lezione 3 — tre appunti, presi alla lettera, addestrano il difetto opposto

Questa è la parte che vale più delle potenzialità.

### (a) N3 autocorrezione → rischio di fabbricare l'auto-dubbio

L'appunto propone di iniettare un ultimo-messaggio-dell'agente **sbagliato** e premiare chi se ne accorge.
Se **tutti** gli esempi hanno l'errore piantato, la politica vincente non è *«rileggi e valuta»*: è
**«se rileggo il mio messaggio precedente, è sbagliato»**. Si ottiene un modello che ritratta sotto
pressione — cioè il flip-flop che stiamo cercando di eliminare, addestrato di proposito.

→ **Serve il negativo simmetrico (#21)**: casi in cui il messaggio precedente iniettato è **corretto** e
il comportamento giusto è **tenere il punto**, magari a fronte di un'obiezione plausibile. Il segnale da
premiare è la **verifica**, mai la ritrattazione. *(È #22 applicata al proprio passato: si premia l'atto
di verificare, non il contenuto della conclusione.)*

### (b) N1/N6 persistenza del vincolo → ~~rischio di over-triggering~~ **OBIEZIONE RITIRATA il 2026-07-31**

> 🔴 **Ritirata dopo la risposta dell'utente (msg 2029) e una verifica che avrei dovuto fare PRIMA di sollevarla.**
> Avevo scritto: *«se premiamo sempre il riapplicare il vincolo, insegniamo che i vincoli non scadono mai → serve il negativo»*.
> L'utente ha risposto che i vincoli non scadono, **vengono MODIFICATI**: istruzione che cambia un requisito → il modello aggiorna la wiki → ai task successivi rilegge i vincoli **aggiornati** e applica quelli. *«Oppure mi sto perdendo qualcosa?»*
>
> **Non si sta perdendo niente. Me lo stavo perdendo io**, e la verifica lo mostra: quell'anello è **già coperto da cinque classi esistenti**, e il negativo che chiedevo **esiste già**.
>
> | Anello descritto dall'utente | Classe che già lo insegna |
> |---|---|
> | riconoscere che un messaggio **cambia** un requisito, senza che dica «stop» | [[../training-taxonomy/class-live-intent-arbitration]] — faccia (a) *revoca implicita* |
> | aggiornare la base di conoscenza invece di tenerlo in testa | [[../training-taxonomy/class-durable-knowledge-retraction]] (i) + [[../training-taxonomy/class-knowledge-base-curation]] |
> | propagare la modifica a ciò che ci poggiava sopra | `durable-knowledge-retraction` (iii) *truth-maintenance* → [[../training-taxonomy/class-retroactive-decision-propagation]] |
> | al task dopo, applicare il vincolo **documentato** e non quello che ricordo | [[../training-taxonomy/class-context-over-parametric-authority]] |
> | chi ha **titolo** di sciogliere un vincolo | [[../training-taxonomy/class-constraint-override-authority]] (classe-radice) |
>
> ⭐ **E il negativo che invocavo è già scritto**: `class-live-intent-arbitration` è dichiarata **SIMMETRICA** — *«non ogni nuovo messaggio è una revoca»*. È esattamente il contro-esempio che stavo chiedendo di aggiungere.
>
> **La lezione su di me, che è il punto**: ho sollevato un'obiezione di copertura **senza cercare se la copertura esistesse** — la regola #33 (*cerca se esiste già*) applicata al contrario. E l'ho fatto in un documento intitolato *«lezioni»*, il giorno dopo essere stato ripreso per non tenere allineata la conoscenza. **Un'obiezione non verificata costa più di un silenzio**: sposta lavoro vero su una cosa già fatta.
>
> **Cosa sopravvive, in forma diversa e più stretta**: il punto fragile dell'anello non è l'**applicazione** (l'utente ha ragione: rileggere risolve) ma la **DETEZIONE** — accorgersi che una frase ordinaria muta un vincolo durevole. Se non scatta, la wiki resta indietro **in silenzio** e il giro «rileggo e applico» restituisce il vincolo vecchio **con l'autorità del documentato**: un errore che sembra un fatto (valore #0). Anche questo però ha già la sua casa (`live-intent-arbitration` (a)) → **niente classe nuova, semmai più peso lì.**

### (c) N5 «roadmap completa prima di partire» → contraddice due nostre regole, e non avrebbe salvato l'errore che dice di prevenire

Tensione reale con **#30** (non svolgere lavoro dipendente da una scelta ancora aperta): una roadmap
completa progettata in anticipo **è** lavoro dipendente da scelte non ancora fatte.

E c'è una prova diretta contro l'interpretazione letterale: **il fallimento del 2026-07-26 non è nato da
mancanza di piano.** Il piano c'era, scritto, e diceva *«riprodurre MMLU-Pro/GPQA-Diamond»* come cosa da
fare **prima** di decidere. Ho costruito comunque uno strumento mio. Una roadmap più dettagliata non
avrebbe cambiato nulla: la domanda che avrebbe fermato tutto era **«quale decisione serve questa
misura?»**.

→ **Riformulazione proposta** dell'appunto: non *«progetta tutto prima»*, ma **«prima di agire, sappi
cosa DECIDE la cosa che stai per fare»**.

> ## ✅ RISOLTO il 2026-07-31 (utente msg 2029) — la mia obiezione era **incompleta**, non sbagliata
>
> L'utente ha chiarito, e il chiarimento porta un argomento che la mia obiezione **non toccava affatto**:
> il piano ad alto livello serve a vedere la **struttura condivisa fra i siti di lavoro**.
> Parole sue: *«se devo fare la stessa operazione in tre server differenti non mi scrivo tre volte lo
> stesso codice, o peggio tre codici differenti: lo scrivo una volta in un pacchetto condiviso e lo
> richiamo in tutti e tre»*.
>
> **Questo è decisivo e mi mancava**: la decisione *«un pacchetto SSOT invece di tre copie»* è
> prendibile **solo** guardando i tre siti **insieme**, cioè **prima** di iniziarne uno. Non è
> pianificazione difensiva: è **l'unico momento in cui quella scelta è ancora disponibile**. Dopo il
> primo server la si paga in refactoring. *(Ed è la nostra #16 SSOT/DRY vista dal lato del piano.)*
>
> **La forma che vuole, e che adotto**:
> 1. **Piano generale, anche incompleto** — *quali* punti vanno toccati e *dove sono*, non il dettaglio di ciascuno. Serve a far emergere ciò che è comune.
> 2. **Piano di dettaglio per unità**, fatto al momento di lavorarla, e seguito.
> 3. **Memoria di ciò che si è fatto sull'unità precedente** — se una cosa non prevista finisce per servire su più unità, va **retrocessa nel pacchetto condiviso** invece di ri-scritta. *(Aggancia [[../training-taxonomy/class-retroactive-decision-propagation]]: una scelta presa sul server 2 cambia il senso di quella presa sul server 1.)*
>
> **E nomina lui il difetto vero**, meglio di come l'avevo detto io: *«se hai un piano e non lo vedi, è un problema di allineamento operativo … l'ha scritto lui, quindi mi auguro sappia anche dove sia»*. **È esattamente il mio errore del 26/07**: il piano c'era, l'avevo scritto io, e ho costruito altro. Quindi la mia riformulazione **non sostituisce** la sua richiesta — la **completa**: serve il piano generale **e** il riflesso di consultarlo.
>
> ⚠️ **Resta vero il caveat #30**: il piano generale dice *quali punti toccare*, non risolve scelte ancora aperte. Se una scelta è aperta, il piano la **nomina** come nodo, non la anticipa.

---

## 📌 Lezione 4 — N4 (waiting-list per loss bassa): due rischi da portare al grill-me, non da decidere

L'utente ha chiesto esplicitamente `grill-me`. Non decido. Due cose da mettere sul tavolo:

1. **Loss bassa ≠ skill acquisita.** La loss su un esempio di training misura quanto bene il modello
   predice **quel testo**, non se ha imparato la capacità. Scende anche perché l'esempio è facile,
   ripetitivo, o memorizzato. Usarla come segnale di *«questa classe è appresa»* è **un proxy con un
   perimetro** — ed è la specie di errore che ci è già costata più volte. Il segnale onesto sarebbe una
   **valutazione held-out generativa**, che però costa.
2. **Uscire dal giro può far dimenticare.** Ridurre a 1-ogni-round proprio le classi con loss bassa
   sposta la miscela verso le difficili; le "apprese" possono **regredire** senza che nessuno guardi.
   Serve almeno un controllo di non-regressione prima di togliere qualcosa dal giro.

**Non è un no**: il curriculum adattivo è tecnica nota e sensata. È che il **criterio di uscita** va
scelto bene, e la loss di training è il candidato peggiore fra quelli disponibili.

---

## 📉 Lezione 5 — il segnale infra (N8): interessante, ma non cambia niente oggi

**Cosa ho estratto** (non il contenuto dell'annuncio): il collo di bottiglia che quel lavoro attacca è il
**trasferimento dei pesi ai worker di inferenza**. È il costo che rende cara la fase RL online — dopo
ogni aggiornamento della policy i pesi nuovi vanno spinti a chi genera i rollout.

**Potenzialità per noi**: quando arriverà l'RL (rinviato a Wave 6), **l'efficienza della sincronizzazione
dei pesi è un criterio di scelta del framework**, non un dettaglio implementativo. Oggi i nostri
documenti sull'RL non registrano **nessun** prerequisito infrastrutturale.
→ **Cosa sistemare**: annotare il criterio adesso, così a Wave 6 non è una sorpresa.

**Perché NON lo inseguiamo ora** — e vale la pena essere espliciti, perché è il tipo di notizia che fa
partire lavoro inutile:
- è **comunicazione di un fornitore** sul proprio prodotto: il salto dichiarato non ha condizioni di
  partenza dichiarate, quindi non è un numero su cui pianificare;
- **tempo di avvio ≠ costo per token**: non riduce la spesa di training;
- è legato a uno **stack specifico**, mentre il nostro serving è su un altro;
- l'hardware locale è una GPU singola: nulla di tutto questo è applicabile lì;
- **l'RL è rinviato** per decisione già presa.

**Verdetto**: nessuna decisione aperta cambia. Archiviato come criterio per una scelta futura.

---

---

## ⭐ Lezione 6 — l'utente ha chiesto ARCHIVIARE, che è la fase che il nostro albero non ha *(2026-07-31, msg 2029)*

Dentro il chiarimento sul piano c'è una richiesta operativa che vale da sola:

> *«deve mantenere la documentazione stabile e allineata, quindi tutte le cose dated devono essere sempre spostate in archived e mantenere sempre la wiki nello stato aggiornato»*

**Perché è più di una convenzione di ordine**: lo sweep dello stesso giorno ha mostrato che senza questa
disciplina un documento non si limita a invecchiare — **inizia a mentire**, e viene letto come corrente
(un piano che si dichiarava «non eseguito» accanto ai propri risultati; un'attesa vecchia di 71 giorni).
Il costo non lo paga chi scrive: lo paga chi rilegge, che è la stessa persona a cui il modello dovrebbe
risparmiare lavoro.

⭐ **La convergenza che rende questa la scoperta più solida del giro**: la richiesta cade **esattamente**
sul buco che il nostro gap-scan aveva già segnalato per conto suo — *«la fase **DISMETTERE** non ha
radice nell'albero»* (residuo aperto di `class-self-sealing-decision`, dichiarato prima di questi
appunti). Il ciclo di vita che la #36(b) impone di scandire — definire → usare → mantenere → cambiare →
propagare → **dismettere** — è coperto **fino a "propagare"** e **si ferma lì**:
`durable-knowledge-retraction` insegna a **ritirare ciò che è diventato FALSO**, ma non copre ciò che
resta **vero e non è più corrente**. Sono cose diverse: una decisione presa a maggio non è falsa, è
**superata** — e nessuno insegna a spostarla.

→ Due richieste indipendenti (la sua, il nostro scan) che indicano lo **stesso** buco sono il segnale più
forte che abbiamo avuto oggi. **Da affrontare come questione di tassonomia** (dove nasce la radice
*dismettere*), non rattoppando i singoli documenti. **Non filato**: proposta (#26).

---

## Cosa resta da fare

Tracciato in [[todo]] §*BATCH APPUNTI*. In sintesi: **(1)** decidere se la radice comune diventa un
nodo-padre prima di filare qualsiasi classe (#20/#36); **(2)** verificare N7 contro la tassonomia
esistente, come chiesto (*«già definito, verifica»*); **(3)** portare N4 al grill-me; **(4)** i negativi
di (a) e (b) sono **condizione di ammissibilità**, non rifinitura.

## Links
- [[../decisions/2026-07-26-fixture-runner-proposta]] — il meccanismo che N1 riusa
- [[../lab-plan-base-model-metro]] — §ESITO: perché serviva un altro tipo di misura
- [[training-set-construction-principles]] · [[../training-taxonomy/dataset-construction-playbook]]
- [[../training-taxonomy/class-metacognitive-self-audit]] — candidato parente di N3

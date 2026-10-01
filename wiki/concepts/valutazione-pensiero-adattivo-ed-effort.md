---
name: valutazione-pensiero-adattivo-ed-effort
description: "Idea di Fra (2026-10-01): pensiero ADATTIVO come default (il modello sceglie quanto pensare), penalità sulla prolissità senza far fingere sicurezza, e l'effort dichiarato dall'utente che cambia il MODO di affrontare il problema (low = scope minimo per lo scopo di adesso, rimanda e chiedi; high = stesso esito in meno cicli pensa-agisci). Verdetto: ha senso; tre pezzi sono già coperti, due buchi sono veri e nuovi; proposta di cosa cambia a ogni livello di effort."
type: concept
tags: [training, reasoning, effort, overthinking, calibrazione, reward, proposta, area-03]
sources:
  - "Fra, messaggio nel terminale 2026-10-01 — testo integrale in wiki/_private/user-ideas-2026-10-01.md (seconda nota)"
  - "Inverse Scaling in Test-Time Compute — arXiv 2507.14417 (TMLR 12/2025), abstract letto il 2026-10-01"
  - "[[../sota-techniques-catalog]] P6 (arXiv 2601.02972, PDF letto 2026-09-12) e RL-8 (MiMo-V2.6 §4.3.3)"
last_updated: 2026-10-01
---

# Pensiero adattivo, effort e il rischio della falsa sicurezza

> ⛔ **PROPOSTA, non ratificata** (#26). La ratifica è la domanda **D18** in [[../todo/domande-aperte-per-fra]]. Nessuna classe è stata scritta (#18).

## La tua osservazione ha una prova pubblicata

*Inverse Scaling in Test-Time Compute* (arXiv 2507.14417) costruisce compiti dove **ragionare più a lungo peggiora** l'accuratezza, e trova cinque modi in cui succede `[EXTRACTED, abstract]`:
1. distrarsi su informazioni irrilevanti;
2. adattarsi troppo a come è formulato il problema;
3. passare da ipotesi ragionevoli a correlazioni spurie;
4. perdere il filo nelle deduzioni con molti vincoli;
5. amplificare comportamenti preoccupanti.

La raccomandazione degli autori è valutare i modelli **a più lunghezze di ragionamento**. Nel catalogo c'era già l'**U rovesciata** dell'overthinking, più severa sui modelli piccoli ([[../sota-techniques-catalog]] §9). *«Max peggio di high»* quindi non è un'impressione: è un effetto misurato. Ne segue che il livello massimo **non** può voler dire *«pensa più a lungo»*.

## Cosa c'è già

| Pezzo dell'idea | Dove sta | Stato |
|---|---|---|
| pensare quanto serve, fermarsi quando il lavoro è finito | catalogo P6 (arXiv 2601.02972): si penalizza la **frazione di traccia dopo la prima risposta corretta**, zero penalità se nessuna risposta è corretta · **t\*** delle scene (turni dopo che gli assert erano già soddisfatti) | IMPORTA, letto sul PDF |
| penalità di lunghezza che non punisce chi sbaglia | MiMo-V2.6 §4.3.3: riferimento = un quantile dei tentativi **riusciti** dello stesso prompt, penalità **solo ai riusciti** più lunghi, e solo sopra una soglia di pass-rate | IMPORTA |
| ammettere *«non ci arrivo, affrontiamola insieme»* | [[../training-taxonomy/class-effort-honesty-under-difficulty]] (approvata) + l'uscita a tre rami della D14 (riprendi · procedi dichiarando · fermati e passa la mano) | approvata / ratificata |
| sicurezza calibrata, non finta | catalogo RL-6: confidenza **sempre emessa** come funzione delle prove + proper scoring rule; l'astensione premiata come azione **collassa** in «rifiuta tutto» (arXiv 2608.00301) | `[V]` |
| sforzo commisurato alla posta del compito | [[../training-taxonomy/class-right-effort-for-stakes]] | impianto approvato |
| consumo commisurato al budget dell'ambiente | [[../training-taxonomy/class-consumption-scale-for-budget]] | placement ratificato |

## Il punto delicato: la penalità sulla prolissità

Hai già visto il rischio: un modello premiato per essere breve impara a **sembrare** sicuro. Le tre regole che lo evitano, tutte già nel catalogo:
1. **Non si conta la parola, si conta lo spreco.** Penalizzare «aspetta» o «forse dovrei» è un proxy lessicale (#24, #10): il modello impara a non scrivere la parola, non a non girare in tondo. E alcuni ritorni sono **buoni**, cioè l'autocorrezione che cambia la risposta (classe WRONG-recovery). Lo spreco si misura **strutturalmente**: la parte di traccia dopo la prima risposta giusta (P6), e i turni dopo t\* nelle scene.
2. **La penalità tocca solo i successi.** Chi fallisce o si ferma onestamente non viene spinto ad accorciare: altrimenti *«rispondi presto e sicuro»* batte *«dì che non ci arrivi»* (MiMo §4.3.3).
3. **La sicurezza si premia solo se è calibrata.** La confidenza dichiarata si confronta con l'esito tramite una scoring rule, così fingere sicurezza costa. Il *«non riesco»* si premia nei bracci dove davvero non si può, e si **penalizza** dove la risposta era raggiungibile: è la simmetria di effort-honesty.

## I due buchi veri

### A · L'effort dichiarato dall'utente è un contratto di SCOPE, non di lunghezza

Oggi la stessa domanda — *«quanto sforzo?»* — ha due letture in tassonomia: la **posta** letta dal compito (right-effort-for-stakes) e il **budget** letto dall'ambiente (consumption-scale-for-budget). Manca la terza: il budget **dichiarato dall'utente**, letto come segnale d'**intento**. La tua frase lo dice esattamente: *«se mi mette effort low è perché non vuole spendere; se non vuole spendere è improbabile che voglia un progetto gigante»*.

La skill, in ordine:
1. **mappa le aree** del problema anche a effort basso. Si pensa meno, non si vede meno;
2. sceglie il **minimo che serve allo scopo di adesso**;
3. **rimanda** il resto e lo **dichiara** («ho lasciato fuori X e Y; li faccio?»). È awareness-transmission: un piano porta le sue lacune;
4. **chiede** quando lo scopo è ambiguo.

**Confine (negativo obbligatorio, #21)**: un effort basso **riduce lo scope, non abbassa la cura sui passi irreversibili**. Cancellare dati resta un'operazione da fare con attenzione anche a effort low: è il N3 di right-effort-for-stakes. Il low riduce **quante** cose si fanno, non **come** si fa quella che può fare danni.

**Home proposta**: figlia di [[../training-taxonomy/class-constraint-fit-decision]], sorella delle due gemelle sopra. È lo stesso asse letto da una terza fonte, quindi va sotto lo stesso padre (#36d).

**Fixture**: la stessa richiesta (*«crea un progetto che fa X»*, N componenti di cui alcuni non necessari allo scopo dichiarato) a effort low / medium / high. Si premia l'esito **per braccio**:
- **low**: lo scopo minimo funziona, l'elenco del rimandato esiste e nomina i componenti esclusi, nessun passo irreversibile fatto male;
- **high**: copertura piena.

**Hack-check**: *sempre il minimo* perde il braccio high · *sempre tutto* perde il low sul costo · *rimandare senza dirlo* perde l'assert sull'elenco · *a low saltare la cura sull'irreversibile* perde il braccio di confine.

### B · A effort alto, più pensiero prima vuol dire meno cicli di azione

La tua idea: *stesso procedimento e stesso output, ma in meno step*, perché il collegamento fra gli argomenti l'hai già fatto pensando, invece di pensa-agisci-pensa-agisci. Nessuna classe lo insegna: t\* misura il lavoro **dopo** la fine, non i cicli **evitabili prima**.

⚠️ **Il limite, da insegnare insieme** `[INFERRED]`: non tutto si può pensare in anticipo. Il contenuto di un file non letto o l'esito di un comando non si deducono; ragionarci sopra prima di guardare è **speculazione**, cioè il fallimento opposto. La skill vera è separare **ciò che si può sapere pensando** da **ciò che si sa solo agendo**: pensare in anticipo il primo, agire subito per il secondo.

**Misura**: sulla stessa scena, il numero di cicli azione-osservazione per arrivare allo **stesso esito**, a effort diversi. **Braccio di controllo**: una scena dove l'informazione decisiva sta in un file da leggere. Lì meno cicli **non** è meglio, e chi indovina invece di leggere fallisce l'assert.

## Cosa cambia a ogni livello — proposta

| livello | cosa cambia | cosa NON cambia |
|---|---|---|
| **low** | scope minimo per lo scopo di adesso · rimanda e dichiara · chiede se ambiguo · verifica al livello che basta per ciò che si consegna | la cura sui passi irreversibili · l'onestà su ciò che non si è fatto |
| **medium** | scope dichiarato dall'utente, coperto per intero · verifica dei casi principali | idem |
| **high** | copertura piena (sicurezza, casi limite, robustezza) · più pensiero prima → **meno cicli** di azione | non pensa più a lungo «per sicurezza»: niente ritorni senza informazione nuova |
| **max** | come high, più **ampiezza**: alternative di design, casi limite rari, la checklist di rilascio completa | ⚠️ non vuol dire più lunghezza — l'inverse scaling dice che oltre un punto la lunghezza peggiora. Il tetto è la stessa regola: ogni passo deve portare informazione nuova |
| **adattivo** (il tuo default) | il modello sceglie il livello leggendo **posta + budget dell'ambiente + segnale dell'utente**, e può **cambiarlo** in corsa se la confidenza cala (D14 idea 1) | — |

**Come si addestra** `[INFERRED]`: il livello entra come **condizionamento** nel prompt di sistema. Le stesse scene si girano a più livelli, con esiti attesi diversi per braccio: è la regola della coppia (P-COPPIA) estesa a più bracci. Il default adattivo è il braccio **senza** livello dichiarato, giudicato sull'esito e sul costo rispetto ai migliori bracci espliciti. **Valutazione**: ogni scena gira a più livelli e si controlla che l'accuratezza **non cali** passando da high a max. È la raccomandazione dell'inverse scaling, trasformata in un gate.

## Residui dichiarati
- Il condizionamento sul livello di effort è uno schema comune nei modelli commerciali, ma **non ho letto** come lo addestrano. Le tecniche citate (P6, MiMo) controllano la lunghezza, non lo scope.
- Il numero di livelli (quattro più adattivo) è una proposta, non un dato.
- Nel catalogo la voce *Adaptive-depth* attribuisce **2505.10832** a S-GRPO: quell'id è *«Learning When to Think: Shaping Adaptive Reasoning in R1-Style Models via Multi-Stage RL»* (verificato sull'API arXiv il 2026-10-01). Corretto lì.

## Links
[[../training-taxonomy/class-right-effort-for-stakes]] · [[../training-taxonomy/class-consumption-scale-for-budget]] · [[../training-taxonomy/class-constraint-fit-decision]] · [[../training-taxonomy/class-effort-honesty-under-difficulty]] · [[../training-taxonomy/class-awareness-transmission]] · [[valutazione-idee-2026-09-29]] (D14: uscita a tre rami, default rosso) · [[compositional-curriculum-thinking-optimization]] · [[../sota-techniques-catalog]]

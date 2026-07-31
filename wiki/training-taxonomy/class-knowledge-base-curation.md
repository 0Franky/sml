---
name: class-knowledge-base-curation
description: Classe (figlia di situational-awareness) — GENERARE e USARE una knowledge-base (wiki) come facciamo noi, con la sfumatura di COLLOCAZIONE (privata/gitignored vs centrale-cross-progetto vs specifica-di-progetto) e le regole di scrittura (frontmatter, confidence-tag, cross-link, no-duplicati). Idea utente msg 1473 #5. Oracolo CRISPO e verificabile per costruzione - le regole-di-placement sono DATE in-context nella fixture (rule #22) → PASS = bucket corretto + cross-link giusti + (security-critical) nessun PII/segreto in una collocazione condivisibile; il caso USE lega alla gemella anti-confabulazione (consulta la wiki, non citare una pagina inesistente). Reward outcome-anchored + simmetrico (non over-documentare trivia, non duplicare ciò che esiste).
type: training-class
tags: [reasoning, situational-awareness, knowledge-base, wiki, curation, placement, area-04, child-class, held-out]
last_updated: 2026-07-09
---

# Classe (figlia) — CURAZIONE DELLA KNOWLEDGE-BASE (generi e usi la wiki, e sai DOVE va ogni cosa)

> **Ruolo**: 3ª figlia di [[class-situational-awareness]]. Àncora la dimensione **CONOSCENZA**: esiste una base di conoscenza (wiki) da **consultare** prima di confabulare e da **arricchire** quando emerge sapere durevole, con la sfumatura di **DOVE** collocare ogni cosa. È il pattern **Karpathy LLM-Wiki** che usiamo noi (CLAUDE.md Fase 4, [[../../CLAUDE.md]]).
> **Origine**: idea utente **msg 1473 #5** — *"deve saper generare e usare la Wiki come stiamo facendo noi; capire le sfumature: se creare una wiki PRIVATA, una CENTRALIZZATA perché condivisa tra più progetti, mentre altri file vanno nella wiki SPECIFICA per progetto (vedi cc-wiki-core). Migliorare l'awareness situazionale."*

## Il gap

Due modi di fallire, speculari (GENERATE ↔ USE):
- **USE**: davanti a una domanda la cui risposta è **nella knowledge-base**, il modello **confabula** invece di consultarla (o cita una pagina che **non esiste**). È la gemella-RECALL applicata alla wiki ([[class-confabulation-retrieval-failure]]).
- **GENERATE**: emerso un sapere durevole, il modello (a) **non lo persiste** (lo perde — gemello-SAVE, [[class-prospective-memory]]), o (b) lo persiste nel **posto sbagliato** — il caso critico di questa classe: un dato **personale/PII/segreto** finito in una collocazione **condivisibile/pubblica** (violazione di sicurezza, [[../feedback_no_pii_in_repo]]); un fatto **specifico-di-progetto** messo nella wiki **centrale** (inquina il cross-progetto); una pagina **duplicata** quando ne esiste già una da aggiornare (regola #20 "cerca il padre prima di filare").

## La sfumatura di COLLOCAZIONE (il cuore della classe)

Tre bucket, discriminati da **sensibilità** × **scope**:

| Bucket | Quando | Esempio nostro |
|---|---|---|
| **PRIVATO** (gitignored / non-condivisibile) | contiene **PII/segreti/raw personali**, o idee grezze non-pubblicabili | `wiki/_private/` (idee utente, [[../feedback_no_pii_in_repo]]) |
| **CENTRALE** (condiviso tra più progetti) | sapere **trasversale** riusabile ovunque (principi, feedback-di-metodo, reference generali) | la wiki "core" cross-progetto / le mie `memory/*` di metodo |
| **DI-PROGETTO** (specifico, versionato nel repo) | sapere legato a **questo** progetto (design, decisioni, finding) | `wiki/` di ITLMv1 |

> Discriminante primario e **security-critical**: *questo contiene qualcosa di sensibile?* → se sì, **PRIVATO** vince su ogni considerazione di scope (mai PII nel condivisibile). Poi lo scope: *serve solo qui o ovunque?* → di-progetto vs centrale.

### ⭐ Estensione 2026-07-31 (utente msg 2055) — lo scope non è a TRE BUCKET, è una SCALA, e in cima manca un gradino

L'utente: *«se c'è una preferenza a livello utente il modello la deve salvare nella top root, come per Claude può essere `<home>/.claude/*` … mentre le informazioni relative al progetto vanno nella sezione più adeguata, che può essere la wiki nella root del progetto **oppure una sotto-wiki per un server specifico**. In modo tale che anche se l'utente apre una nuova chat, il modello ha sempre le preferenze generiche di partenza.»*

**Due cose che i tre bucket sopra NON coprono, e non sono dettagli.**

**(1) Manca il gradino più alto: la HOME DELL'AGENTE.** Il bucket *CENTRALE* qui sopra fonde due cose diverse — un **repo condiviso** montato nei progetti, e la **home dell'agente** (`~/.claude/…`). Sembrano simili e non lo sono:

| | repo condiviso (montato) | home dell'agente |
|---|---|---|
| Raggiunge | solo i progetti che lo **montano** | **ogni** sessione, sempre |
| In una cartella senza progetto | **non esiste** | c'è comunque |
| In una **chat nuova** su un progetto mai visto | assente | **presente** |

→ Una **preferenza dell'utente** (stile di scrittura, lingua, come vuole essere avvisato) messa in un repo condiviso è **persa** appena si apre una chat altrove. È il caso che l'utente nomina per primo, ed è il più facile da sbagliare perché *«centrale»* suona già abbastanza in alto.

**(2) Sotto il progetto la scala CONTINUA.** *«Una sotto-wiki per un server specifico»*: un fatto vero solo di `nv-dev` non va nella wiki del progetto, va nella sua sotto-sezione. Il bucket *DI-PROGETTO* è **un gradino, non il fondo**.

### La regola che ne esce (più semplice dei bucket, e ricorsiva)

> **Salva al livello PIÙ ALTO in cui il fatto è SEMPRE VERO — e non uno più su.**

`home dell'agente` → `condiviso fra progetti` → `progetto` → `sotto-scope (servizio/server/modulo)`, con **sensibilità che scavalca tutto** (un dato sensibile scende in PRIVATO qualunque sia il suo scope).

**I due errori sono speculari e vanno insegnati entrambi**:
- **troppo in alto** = **inquinamento**: un dettaglio di *questo* server nella home lo fa comparire in ogni progetto, per sempre, dove è rumore o addirittura falso;
- **troppo in basso** = **perdita**: una preferenza permanente dentro un progetto sparisce alla prima chat nuova — e l'utente deve ridirla, che è l'attrito che questa classe esiste per togliere.

⚠️ **Il test che discrimina non è «serve ovunque?» ma «è vero ovunque?»**. Sono diversi: il numero di porta di uno staging *serve* a chiunque tocchi quel server, ma è *vero* solo lì. La domanda giusta è **dove smette di essere vero** — e si sale fin lì, non oltre.

*(Nota di collocazione, applicata a se stessa: questa estensione sta nella classe **esistente** e non in una nuova. L'asse — «dove va collocato un sapere» — è già quello di questa classe; qui gli si aggiunge un gradino in cima e la ricorsione sotto. Filare una classe nuova avrebbe fatto imparare due volte la stessa radice, #20/#36.)*

## La skill-target (segnale, preciso e falsificabile)

- **USE**: prima di rispondere a una domanda coperta dalla knowledge-base, **consultala** (trova la pagina rilevante via indice) e **cita** il path; se la KB **non copre** la domanda → **dillo** (astieniti/cerca-altrove), NON inventare una citazione. 
- **GENERATE**: emerso sapere durevole → **collocalo nel bucket corretto** (sensibilità→scope), con **frontmatter** + **confidence-tag** (`[EXTRACTED]`/`[INFERRED]`/`[AMBIGUOUS]`) + **cross-link** alle pagine correlate; **aggiorna** una pagina esistente invece di duplicarla.

**Falsificabile**: a valle, l'informazione è **ripescabile dal bucket dove è stata messa** e nessun dato sensibile è finito nel condivisibile; la domanda è stata **risolta dalla KB** (o correttamente dichiarata fuori-copertura). Non si premia "ha scritto una pagina" (participation-hack), ma il **placement corretto + la reperibilità + zero-leak**.

**Split training-vs-harness** (CLAUDE.md #11): **F-harness** = fornisce l'**indice** della KB e gli strumenti di scrittura/lettura (l'harness espone `wiki/index.md`, i tool di file, le lane) — stato-senza-training PIENO sul dato (l'indice è consultabile); **S** = *decidere cosa consultare, cosa persistere e DOVE*, INERTE senza training (il modello confabula invece di consultare, o mis-colloca). Doppio scopo (regola #18): l'harness dà indice+tool ORA; il training internalizza il *riflesso curatoriale*.

## Esempi POSITIVI (cross-dominio — regola #19)

> Logica astratta unica: *consulta la base di conoscenza prima di inventare; quando aggiungi sapere, mettilo nel contenitore giusto per sensibilità e ambito, collegandolo e senza duplicare*.

- **[A · il caso nostro, held-out]** emerge una decisione di design di ITLMv1 → **ADR in `wiki/decisions/` (di-progetto)** con frontmatter+cross-link; un principio di metodo riusabile ovunque → **centrale**; un'idea grezza con dettagli personali → **`wiki/_private/` (gitignored)**. Una domanda sul progetto → **consulti `wiki/index.md`** e citi la pagina, non confabuli.
- **[B · lavoro/team]** un documento condiviso col team → **drive condiviso**; un appunto personale → **cartella privata**; un dato **confidenziale** (stipendi, dati cliente) → **repository ad-accesso-ristretto**, MAI nel wiki pubblico del team.
- **[C · biblioteca]** un'opera di consultazione → **sezione reference** (non prestabile); un romanzo → **prestito**; un manoscritto fragile/sensibile → **archivio ristretto**; e per rispondere a un lettore usi il **catalogo**, non "ricordi" a memoria dove sta.
- **[D · azienda/documentazione]** una policy trasversale a tutti i team → **wiki aziendale centrale**; una runbook di **un solo** servizio → **wiki di quel team**; credenziali/segreti → **secret-manager**, mai committati (parità diretta con la nostra regola PII).
- **[E · salute/dati]** un'informazione utile a tutto il team-di-cura → **cartella clinica condivisa**; una nota **sensibile** del paziente → **sezione riservata**; per una domanda clinica **consulti la cartella**, non vai a memoria.
- **[F · la SCALA, dal gradino più alto al più basso — aggiunto 2026-07-31]** l'utente dice *«scrivimi sempre in italiano e senza giri di parole»* → è vero **ovunque e sempre** → **home dell'agente**, così vale anche nella prima chat di un progetto mai visto. *«In questo repo i commit non portano co-autore»* → vero per **questo progetto** → wiki di progetto. *«Su quel server la porta è la 7443»* → vero **solo lì** → sotto-sezione di quel server. Tre fatti, tre gradini, **una sola domanda**: dove smette di essere vero?
- **[G · vita quotidiana, stessa scala]** *«sono allergico alle arachidi»* → vale **sempre**, sta sul documento che porti addosso, non nel quaderno di un singolo ristorante. *«Questo ristorante ha il menù senza glutine»* → vale per quel locale. *«Stasera tavolo alle 21»* → vale per stasera e basta. Metterlo tutto nello stesso posto rende inutile il primo (sepolto) e ingombrante l'ultimo (sopravvive alla sera).

## Esempi NEGATIVI (regola #21 — il CONFINE)

- **[N1 · PII/segreto nel CONDIVISIBILE — security-critical, il negativo più importante]** collocare un dato personale/segreto nella wiki centrale/pubblica o nel repo versionato → **FAIL DURO** (il costo di un leak è alto → [[../feedback_no_pii_in_repo]]). Il bucket corretto è **PRIVATO/gitignored**. Insegna che la **sensibilità batte lo scope**.
- **[N2 · di-progetto messo nel CENTRALE]** un dettaglio valido solo per questo progetto messo nella KB cross-progetto → **inquina** il centrale (rumore per gli altri progetti). Confine di scope.
- **[N3 · duplicato invece di update]** creare una pagina nuova quando **ne esiste già una** sul tema → dovevi **aggiornarla** (regola #20). Duplicati = due sorgenti che divergono (anti-SSOT, [[../feedback_ssot_dry]]).
- **[N4 · over-documentazione di trivia]** creare una pagina-wiki per un dettaglio **effimero/usa-e-getta** → rumore che soffoca il sapere vero (mirror di [[class-prospective-memory]] N1 over-save). Il gold è **selettività**.
- **[N5 · citazione confabulata]** rispondere citando una pagina/uno slug che **non esiste** nella KB → **FAIL** (confabulazione di provenienza, gemella [[class-confabulation-retrieval-failure]]). Se non c'è → **dillo**.
- **[N6 · già coperto]** ri-documentare qualcosa **già presente e corretto** nella KB → ridondanza (prima **consulta** se c'è già).
- **[N7 · TROPPO IN BASSO — la preferenza permanente sepolta in un progetto — aggiunto 2026-07-31]** l'utente esprime una preferenza **sempre valida** (stile, lingua, come vuole essere avvisato) e il modello la salva nella wiki **del progetto in cui si trova**. Sembra corretto — è *sapere durevole, persistito, collegato* — e passa qualunque controllo di forma. **Ma alla prima chat altrove è persa, e l'utente deve ridirla**: è esattamente l'attrito che questa classe esiste per togliere. Bucket corretto: **home dell'agente**. *È il negativo che l'utente ha chiesto per primo (msg 2055).*
- **[N8 · TROPPO IN ALTO — lo speculare di N7, e senza di esso si insegna «nel dubbio, in cima»]** un dettaglio vero **solo di un servizio** (una porta, un percorso, una quirk di quel container) salvato nella **home** *«così non lo perdo»*. Non è un leak e non è un duplicato, quindi nessun controllo di sicurezza protesta — ma da lì in poi **compare in ogni progetto**, dove è rumore e, appena quel servizio cambia, **è falso ovunque**. Bucket corretto: la sotto-sezione di quel servizio. ⭐ **N7 e N8 vanno somministrati insieme**: da soli insegnano rispettivamente *«sali sempre»* e *«resta sempre giù»*, che sono due modi diversi di sbagliare la stessa cosa.

## Reward (ANCORATO all'OUTCOME + SIMMETRICO)

- **Q (nucleo verificabile, ancora il segnale)**: (a) **bucket corretto** vs oracolo (la fixture dà le regole di placement → il bucket giusto è definito per costruzione); (b) **zero-leak** — nessun item sensibile in collocazione condivisibile (violazione = fallimento hard, peso alto); (c) **cross-link presenti** verso le pagine dichiarate-correlate; (d) **no-duplicato** (update se esiste); (e) per USE, la domanda è **risolta dalla pagina giusta** citata (path reale) o **dichiarata fuori-copertura**.
- **L (secondario)**: qualità della pagina (frontmatter completo, confidence-tag corrette, sintesi fedele) — giudizio, subordinato al nucleo Q.
- **Simmetrico**: premia ANCHE il **non-scrivere corretto** (N4 non-over-documentare, N6 non-ri-documentare) e il **non-citare** quando la KB non copre (N5 → astieniti). Né "documenta-tutto" né "confabula-la-citazione".
- **Reward sul PLACEMENT/REPERIBILITÀ, non sulla prosa** (anti-cerimonia): il credito è il *bucket corretto + reperibilità a valle + zero-leak*, non l'atto di scrivere. La sicurezza (N1) è **ancorata all'outcome** con il costo-di-leak (coerente con i gold criticality/secret-hygiene). ([[../feedback_reward_hacking_principle]])

## Label-generation (mutation/oracle)

**Fixture self-contained** (regola #22): la fixture **DÀ in-context la policy di placement** (definizione dei bucket private/central/project + la regola "sensibilità batte scope") + un **item di conoscenza** annotato per costruzione con `[sensibile?]` e `[scope]` → il **bucket corretto è determinato dalle regole date**, non da un fatto-del-mondo (oracolo crispo e verificabile). Oracolo:
- GENERATE → PASS sse bucket==gold ∧ (sensibile ⇒ privato) ∧ cross-link-attesi presenti ∧ non-duplica (dato un indice-KB in fixture).
- USE → PASS sse cita la **pagina reale** che copre la domanda (presente nell'indice-fixture) o **dichiara** fuori-copertura; FAIL se confabula uno slug assente (**N5**).
**Randomizzazione anti-overfit**: variare i **nomi/regole dei bucket** epoch-by-epoch (la policy è data in-context → il modello deve **leggerla**, non memorizzare "privato=_private") → [[../concepts/runtime-symbol-randomization-training]] + [[../concepts/dynamic-context-training-regime]]. Distrattori: item che *sembrano* di-progetto ma sono trasversali (esca di scope); item con PII **nascosta** in mezzo a dati innocui (costringe lo screening di sensibilità). Bilanciamento positivi↔negativi obbligatorio; il negativo **N1 (PII→condivisibile)** sovra-campionato (costo-di-errore alto).

## Decontaminazione (regola #18)

**Dichiarazione MACCHINA-LEGGIBILE della superficie tenuta fuori** — verificata da
[`harness/tools/check-decontamination.mjs`](../../harness/tools/check-decontamination.mjs): fallisce se uno di questi token compare in una sezione che **prescrive il training** (§Label-generation · §Hack-check · §Esempi NEGATIVI). ⚠️ Si dichiara la **SUPERFICIE** (gli identificatori dell'istanza osservata), **mai il MECCANISMO** — tenerlo fuori renderebbe la classe non insegnabile. I token vogliono una **specificità minima**: uno troppo corto combacia dentro parole qualsiasi.
```held-out
# istanza osservata: la NOSTRA curazione-wiki (questi stessi file, la struttura del repo)
ITLMv1
```


Le istanze osservate della NOSTRA curazione-wiki (questi stessi file, la struttura ITLMv1) restano **held-out** — il training usa fixture **sintetiche cross-dominio** con policy randomizzate. Se il modello ha imparato la **curazione**, a valle: consulta prima di confabulare, colloca per sensibilità×scope, non duplica, non leakka PII — **per transfer** su knowledge-base mai viste. È la realizzazione dell'idea #5 (il modello "usa e genera la wiki come noi").

## Links
[[class-situational-awareness]] (padre) · [[class-confabulation-retrieval-failure]] (USE — consulta invece di confabulare; astensione su citazione-assente) · [[class-prospective-memory]] (GENERATE — persisti il durevole) · [[class-harness-environment-awareness]] (sorella — usa l'indice-KB come affordance) · [[../feedback_no_pii_in_repo]] (N1 security-critical) · [[../feedback_ssot_dry]] (N3 no-duplicati) · [[../concepts/runtime-symbol-randomization-training]] · [[../concepts/dynamic-context-training-regime]] · [[../concepts/training-vs-harness-classification]] · [[area-04-context-metacognition]] · [[../feedback_reward_hacking_principle]] · [[../feedback_transfer_always_cross_domain]] · [[../feedback_wiki_pattern]]

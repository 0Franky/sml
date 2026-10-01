---
name: valutazione-giudice-veloce-per-classe
description: "Idea di Fra (2026-10-01): addestrare un giudice piccolo e veloce per classe/sottoclasse, che segnali quando serve un LLM grande per guardare meglio. Verdetto: ha senso come TRIAGE a cascata OFFLINE per le classi senza oracolo, NON come reward nel loop e NON un modello per classe; prerequisiti e misura per decidere quando costruirlo."
type: concept
tags: [reward, judge, cascata, calibrazione, proposta, d11, classi-L]
sources:
  - "Fra, messaggio nel terminale 2026-10-01: «addestrare un open jev like per classe o sottoclasse così abbiamo un giudice veloce … deve segnalare se c'è bisogno di un modello llm per analizzare meglio»"
  - "[[judge-design]] · [[../decisions/2026-09-12-prm-appreso-escluso-proposta]] (D11) · [[../entities/modelli-piccoli-settembre-2026]] §1 GAR e §12 MOPD2"
last_updated: 2026-10-01
---

# Un giudice veloce per classe, che sa quando chiamare quello grande

> ⛔ **PROPOSTA, non ratificata** (#26). `[?]` Il nome «open jev» l'ho letto come *un giudice aperto addestrato* (famiglia JudgeLM/Prometheus); se intendevi un progetto preciso, il verdetto va ricontrollato su quello.

## Cosa resta vero dell'idea

Il bisogno è reale: le classi con tag **L** (senza oracolo deterministico) oggi si possono giudicare solo con un LLM grande, che costa ed è lento. Una **cascata** — un piccolo che decide i casi facili e **passa la mano** su quelli dubbi — è lo schema giusto per quel costo. E l'uscita a due vie che chiedi (*giudico io / serve il grande*) è la stessa forma del **default rosso** del 2026-10-01: nel dubbio non si promuove, si escala.

## Dove NON metterlo — tre confini

1. **Non come reward dentro il loop di RL.** Un giudice appreso nel loop si hackera: *Reward Under Attack* (arXiv 2603.06621) porta il reward di un PRM a 1,0 in 100 step con accuratezza vera a 0 % `[EXTRACTED via riassunto, D11]`. Un giudice **piccolo** è più facile da hackerare, non meno. Nel loop può stare solo **subordinato a un cancello deterministico** — ordina solo ciò che ha già passato l'oracolo, come GAR in MiMo-V2.6 — mai promuovere un fallimento. Al di fuori di quella forma resta **etichettatore offline** (reco A di D11, ancora aperta).
2. **Non un modello per classe.** Le classi sono ~80, con pochi esempi ciascuna: 80 giudici vuol dire 80 set di etichette da costruire, calibrare e tenere aggiornati. La stessa cosa si ottiene con **un solo giudice condizionato** (la rubrica della classe va in input) o, se una famiglia diverge davvero, con un **LoRA per famiglia** sullo stesso piccolo — che è la logica dei tuoi tre livelli applicata al giudice.
3. **Non prima delle sue etichette.** Il piccolo impara da qualcuno: dalle etichette del giudice grande sulle **nostre** fixture. Le classi L oggi non hanno ancora fixture e scorer (binario c). Prima ci sono quelle, poi le etichette, poi il piccolo.

## Il punto difficile: «sapere quando non sa»

Tutto il valore sta nel segnale *«serve il grande»*, e quel segnale vale solo se la **confidenza è calibrata**. Misura, su un held-out etichettato dal grande:
- **richiamo degli errori**: dei casi in cui il piccolo sbaglia, quanti ha mandato al grande? È la metrica che conta: un errore non escalato è un fail-silent;
- **quota escalata**: se il piccolo escala il 90 %, non fa risparmiare niente;
- **ECE** sulla confidenza, per classe.
Scrivi i risultati come frazioni (#35b). E la calibrazione **invecchia**: durante l'RL la policy cambia distribuzione, quindi la misura va rifatta a ogni fase, non una volta.

## Vincoli già decisi che lo toccano

- **Chi etichetta**: niente Claude/GPT/Gemini come fonte delle etichette (ToS, [[judge-design]], D5/D6). Il grande va scelto fra i modelli aperti o fra i teacher ammessi.
- **Base del piccolo**: MiniCPM5-2B (scaricato il 2026-10-01 come modello di test) è un candidato naturale per il primo prototipo — 2,5B, architettura standard, sta sulla 2080 Ti con un LoRA.

## Reco

**Sì all'idea, non adesso.** Tracciata in [[../todo]] come proposta che parte quando: (1) almeno una classe L ha fixture e un giudice grande che la etichetta; (2) il costo del grande pesa davvero sul volume. Il primo esperimento è piccolo: un LoRA su MiniCPM5-2B per **una** classe, con le tre misure sopra contro il grande. **Cosa la ribalterebbe**: se il richiamo degli errori resta basso anche con dati sufficienti, la cascata non regge e si torna al grande per tutto, o a più oracoli deterministici.

## Links
[[judge-design]] · [[oracle-design-pitfalls]] · [[reward-hacking-mitigation]] · [[../decisions/2026-09-12-prm-appreso-escluso-proposta]] · [[../entities/modelli-piccoli-settembre-2026]] · [[valutazione-idee-2026-09-29]] §2 (default rosso)

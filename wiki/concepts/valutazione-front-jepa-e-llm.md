---
name: valutazione-front-jepa-e-llm
description: "Idea di Fra (2026-10-02): un modello frontale veloce (JEPA-like) che prende per primo ogni richiesta, risponde da solo quando basta oppure delega al LLM, e imposta il thinking budget e la configurazione del modello che agirà. Verdetto: il routing esiste già (classifier esterno, ADR 2026-05-21); le due estensioni sono sensate a condizioni precise; JEPA è un candidato per il front, non una base, perché sul linguaggio l'evidenza è mista. È la stessa forma del giudice veloce: si costruiscono come un pezzo solo."
type: concept
tags: [routing, jepa, latenza, effort, cascata, proposta, architettura]
sources:
  - "Fra, messaggio nel terminale 2026-10-02 — testo in wiki/_private/user-ideas-2026-10-01.md (terza nota)"
  - "VL-JEPA, arXiv 2512.10942 — abstract letto il 2026-10-02"
  - "LLM-JEPA, arXiv 2509.14252 — abstract letto il 2026-10-02"
  - "Representation Without Reward: A JEPA Audit for LLM Fine-Tuning, arXiv 2605.15394 — abstract letto il 2026-10-02"
  - "RouteLLM, arXiv 2406.18665 — titolo verificato il 2026-10-02"
last_updated: 2026-10-02
---

# Un modello frontale che risponde, delega e regola lo sforzo

> ⛔ **PROPOSTA, non ratificata** (#26). `[?]` «jev» l'ho letto come **JEPA** (Joint Embedding Predictive Architecture): è la lettura che combacia con *«decide se prendersi carico o delegare»*. Va confermato da Fra.

## Cosa c'è già

Il routing a tre livelli è deciso dal 2026-05-21 ([[../architecture/orchestrator-layer]]):
1. un **classifier esterno** veloce (<50 ms), per esempio un BERT piccolo, che decide la macro-area;
2. i **token speciali** del Tier-1 per le scelte fini;
3. un **fallback sicuro** quando la confidenza è sotto soglia.

L'MVP v1 usa solo il classifier. L'idea di Fra **non** sostituisce questo schema: lo allarga in due direzioni.

## Le due estensioni

### 1. Il front risponde da solo quando basta

Oggi il classifier **smista** e basta: non risponde mai. Fra propone che un modello frontale risponda direttamente alle richieste che non richiedono ragionamento. È lo schema di **cascata** di RouteLLM (arXiv 2406.18665): il modello piccolo dove basta, quello grande dove serve.

**JEPA ci sta bene per una ragione precisa** `[EXTRACTED, abstract VL-JEPA]`: VL-JEPA non genera token uno per uno, **predice un embedding** della risposta. Il decoder di testo si invoca **solo quando serve**, e questa *selective decoding* riduce le operazioni di decodifica di **2,85×** a prestazioni simili. Lo stesso spazio di embedding fa classificazione e retrieval **senza modifiche**. Un front JEPA è quindi un classificatore nativo, che decodifica solo quando deve rispondere davvero.

**Tre condizioni, senza le quali si rompe** `[INFERRED]`:
- **Default rosso, cioè nel dubbio delega.** L'errore pericoloso del front è prendersi un compito che non sa fare: l'utente riceve una risposta **veloce e sbagliata**, ed è un fail-silent. La metrica che decide è la stessa del giudice veloce: dei casi che il front sbaglia, **quanti li ha passati al LLM**. Un front che delega spesso costa solo latenza; uno che trattiene troppo costa fiducia.
- **Il guadagno dipende dalla distribuzione delle richieste, e va misurato.** Il nostro Tier-1 lavora su compiti **agentici** a più passi con tool: lì quasi tutto va al LLM, e il front **aggiunge** latenza invece di toglierla. Conviene solo se una quota misurabile di richieste si chiude senza ragionamento (domande brevi, riconoscimento d'intento, lookup).
- **Il front non decide mai un passo irreversibile.** Può rispondere, non agire.

### 2. Il front imposta il thinking budget e la configurazione

Il front stima **quanto pensare** (0-100) e **con quale configurazione** far partire il modello: livello di effort, LoRA da caricare, tool esposti. Il routing deciso a maggio già carica i LoRA; il **budget** è la parte nuova.

**Rapporto con il pensiero adattivo (D18)**: non sono in conflitto, a una condizione. Il budget del front è un **punto di partenza**, non un tetto: il modello deve poterlo **rivedere** in corsa se la confidenza cala (D14, idea 1). Un budget imposto e non rivedibile riporta il problema della stima fatta prima di vedere il compito. **Come si addestra**: il budget giusto per una richiesta si ricava dalle scene girate a più livelli (D18): è il livello **più basso che raggiunge l'esito del migliore**. Quindi l'etichetta esiste già, non va inventata.

## JEPA: candidato per il front, non una scommessa sulla base

Sul **linguaggio** l'evidenza è mista:
- **a favore**: LLM-JEPA (arXiv 2509.14252) dichiara di battere gli obiettivi standard in fine-tuning e pre-training su più famiglie di modelli `[EXTRACTED, abstract]`;
- **contro**: *Representation Without Reward* (arXiv 2605.15394) prova 22 varianti in fine-tuning LoRA su Llama-3.2-1B e trova un **nullo strutturato**: la geometria degli stati interni cambia, l'accuratezza decodificata resta nel rumore, sia con LoRA sia con full fine-tuning `[EXTRACTED, abstract]`. Esiste anche *The JEPA Paradox in Language* (arXiv 2607.23531), non letto.

Per un **router** questo conta poco, perché un router classifica e non genera. Per la **base del Tier-1** conterebbe molto. Proposta: il front si costruisce prima come **classificatore semplice** (lo schema di maggio), e un front JEPA si prova **contro** quello, sulla stessa metrica.

## È lo stesso pezzo del giudice veloce

[[valutazione-giudice-veloce-per-classe]] (2026-10-01) e questa idea hanno **la stessa forma**: un modello piccolo e veloce che decide da solo i casi facili e **passa la mano** al grande sui dubbi. Cambia solo dove sta: il giudice **dopo** il modello (offline, sui dati), il front **prima** (online, sulle richieste). Si possono costruire con lo stesso metodo (una base piccola, MiniCPM5-2B per il prototipo) e misurare con la stessa metrica, cioè il richiamo degli errori passati al grande.

## Ordine proposto
1. Misurare la distribuzione: quante richieste reali si chiudono senza ragionamento? Senza questo numero il guadagno di latenza è un'ipotesi.
2. Front = classifier di maggio + uscita «budget». Etichette dalle scene a più livelli (D18).
3. Solo dopo: front che risponde da solo, poi JEPA contro classifier.

**Cosa la ribalterebbe**: se la quota di richieste chiudibili dal front è piccola (come ci si aspetta su compiti agentici), il punto 3 non vale il costo, e resta solo il budget.

## Links
[[valutazione-giudice-veloce-per-classe]] · [[valutazione-pensiero-adattivo-ed-effort]] (D18) · [[valutazione-idee-2026-09-29]] (D14) · [[../architecture/orchestrator-layer]] · [[../entities/modelli-piccoli-settembre-2026]] (MiniCPM5-2B)

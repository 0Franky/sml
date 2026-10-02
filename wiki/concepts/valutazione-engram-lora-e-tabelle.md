---
name: valutazione-engram-lora-e-tabelle
description: "Le domande di Fra del 2026-10-01 su Engram: ha ancora senso la LoRA? la divisione pesi = intelligenza · tabella Engram = conoscenza · LoRA = procedura; aggiornare la tabella a caldo e l'hot swap; più conoscenza nella tabella = più intelligenza?; più tabelle degradano?; due tabelle (memoria utente + conoscenza). Risposte dai PDF: la divisione è coerente con la letteratura 2026 (User as Engram la propone quasi alla lettera), ma Engram nasce col pre-training, quindi per il Tier-1 di adesso la LoRA resta; il hot swap per-utente esiste ed è veloce, scrivere bene il contenuto no; più tabella non vuol dire più intelligenza."
type: concept
tags: [architettura, engram, lora, memoria, conoscenza, proposta, modello-futuro]
sources:
  - "Fra, messaggio nel terminale 2026-10-01 — testo in wiki/_private/user-ideas-2026-10-01.md (prima nota)"
  - "Engram, arXiv 2601.07372 v2 — PDF: §4.1, §6.2, §6.3 Fig. 6 (verificato da me il 2026-10-02), Tab. legge a U"
  - "User as Engram, arXiv 2606.19172 — PDF §1, §4.4, §5 (righe sul contenuto verificate da me)"
  - "Engram Adapter, arXiv 2608.29327 — abstract verificato"
  - "Continual Learning via Sparse Memory Finetuning, arXiv 2510.15103 · Memory Layers at Scale, arXiv 2412.09764 — abstract verificati"
  - "BadEngram, arXiv 2609.13478 — abstract verificato"
  - "Qwen3.8-Flash-Next, arXiv 2608.30320 — Tab. 8-9"
  - "ricerca dell'agente del 2026-10-02 (PDF letti dall'agente; i punti decisivi ricontrollati da me come indicato)"
last_updated: 2026-10-02
---

# Engram, LoRA e la divisione dei compiti — risposte alle domande di Fra

> ⛔ **Nessuna scelta qui** (#26, #30): il design del modello futuro è nuovo e segue il workflow a stadi. Sono fatti per la discussione. Tag: `[PDF-io]` verificato da me sul PDF · `[PDF-agente]` letto dall'agente, non ricontrollato · `[abstract]` · `[INFERRED]`.

## 1. La divisione «pesi = intelligenza · Engram = conoscenza · LoRA = procedura» — ha senso?

**Sì, ed è la direzione che sta prendendo la letteratura.** *User as Engram* (arXiv 2606.19172) parte dalla stessa diagnosi: la memoria personale è **due problemi**, il contenuto e l'abilità di ragionarci sopra. Un LoRA per utente li **mescola** in un unico delta globale. La loro architettura è *«content in a memory table, skill in a shared adapter»* (§1) `[PDF-io]`: i fatti come righe della tabella Engram, l'abilità in un adapter condiviso. È la tua divisione, con l'adapter al posto della LoRA di procedura.

**Ma con un confine importante: la separazione non è pulita.** Con Engram **spento** in inferenza:
- i benchmark di **fatti** tengono il **29-44%** (TriviaQA 29%);
- la **comprensione del testo** tiene l'**81-93%** (C3 93%) `[PDF-io §6.3, Fig. 6]`;
- **anche la matematica crolla**: MATH 36%, MGSM 44%, GSM8K 62% `[PDF-agente, dalla figura]`.

Gli autori stessi avvertono che spegnere il modulo dopo l'addestramento crea un'incoerenza fra training e inferenza, e che sui compiti misti il segnale è rumoroso `[PDF-io]`. Quindi Engram **non è un archivio di soli fatti** che si stacca lasciando il ragionamento intatto: il backbone ha imparato **insieme** a lui.

## 2. Ha ancora senso la LoRA?

**Per il Tier-1 di adesso, sì: è l'unica strada.** Engram si addestra **insieme al backbone, da zero, in pre-training** `[PDF-agente]`, e nessun lavoro trovato fa continued pre-training dell'Engram originale. Il Tier-1 parte da un **instruct** già addestrato (deciso il 2026-09-11, memoria `project_tier1_starts_from_instruct`), che Engram non ce l'ha. Le vie per averlo oggi:
- **Engram Adapter** (arXiv 2608.29327): un adapter a memoria condizionale su Qwen3-4B e 8B **congelati**. In dominio fa 2-4 punti **sotto** LoRA, ma conserva circa il 100% fuori dominio, perché si accende solo sugli input del dominio `[abstract + PDF-agente]`. È interessante per i **verticali** (Tier-3), dove l'oblio fuori dominio è proprio il problema.
- **DeepSeek-V4.1-Flash** dichiara pesi pubblici con 196B di Engram, ma è un MoE da 552B, non della nostra taglia. Pesi su HF **non verificati**.

**La divisione intera vale per il modello futuro da zero** (memoria `project_from_scratch_slm_future`), dove Engram si può mettere nel pre-training. Il vincolo fondante di [[../architecture/three-tier-design]] — i LoRA **fanno emergere**, non **insegnano** — è coerente con *LoRA = procedura*.

## 3. Aggiornare la tabella a caldo, e l'hot swap

Distinguere due cose:
- **Lo SCAMBIO è veloce, ed esiste già.** In *User as Engram* il server salva le righe originali, scrive le righe dell'utente, esegue e ripristina, a ogni richiesta: **0,03 ms** per applicarle, 88 KB per utente con 100 fatti `[PDF-agente]`. Le mappe con indirizzi disgiunti si **sommano** senza riaddestrare (§4.4, *«corporate facts + user facts (or any number of domain-specific Engrams) stack additively»*) `[PDF-io]`.
- **SCRIVERE bene il contenuto è la parte difficile.** Una riga non è testo: è un vettore che va **ottimizzato** perché il backbone lo usi. Con **1000 fatti** per utente il recupero top-1 scende al **35%**, per interferenza fra righe attive insieme `[PDF-agente]`. Il paper Engram originale l'aggiornamento **non lo tratta** `[PDF-agente, non trovato]`. Il parente più vicino, lo *sparse memory finetuning* sulle memory layer (arXiv 2510.15103), aggiorna solo gli slot più attivati. Dopo 1000 fatti nuovi la perdita su NaturalQuestions è dell'**11%**, contro **89%** del full fine-tuning e **71%** di LoRA, ma serve generare parafrasi e il costo in tempo non è riportato `[PDF-agente]`.
- **Spostare la tabella su RAM** costa al massimo il **2,8%** di throughput con 100B di parametri, misurato solo a batch su modelli densi `[PDF-agente]`.

## 4. Più conoscenza nella tabella = modello più intelligente?

**No, non in automatico.** Tre ragioni:
1. **Satura.** Aggiungendo memoria senza togliere calcolo, la loss scende sempre, ma i benchmark **si fermano** e alcuni calano rispetto al picco (Engram-40B; Qwen3.8 Tab. 9) `[PDF-agente]`. È la frase di Qwen3.8 che avevo citato: descrive saturazione, non un crollo sotto la baseline.
2. **Il guadagno sul ragionamento viene da come si divide il budget, non dalla quantità di tabella.** Il BBH +5,0 è a **parità** di parametri e calcolo: liberare i primi layer dal ricostruire fatti li rende disponibili per ragionare. Riempire di più la tabella non ripete questo effetto.
3. **Collegare gli argomenti è compito del backbone, non della tabella.** *User as Engram* lo dice in chiaro: la tabella da sola **recupera i fatti ma non li compone** (§5); la composizione arriva dall'adapter di abilità `[PDF-io]`. Più fatti danno più materiale da collegare, ma la capacità di collegarli resta nei pesi.

## 5. Più tabelle degradano? E le tue due tabelle

**Correzione di una mia frase precedente**: non c'è un risultato che dica «più tabelle degradano». Ci sono tre cose diverse:
- **Legge a U a budget fisso**: dato un numero fisso di parametri sparsi, conviene dare a Engram circa il **20-25%**; all'ottimo la loss scende da 1,7248 a 1,7109 rispetto al tutto-esperti, e oltre l'ottimo risale perché si toglie troppo calcolo. Sotto il 40% di quota agli esperti non ci sono misure `[PDF-agente]`. Quindi degrada solo quando la memoria **ruba** calcolo.
- **Più moduli**: Engram ne usa **2** (layer 2 e 15 su 30). Con un modulo solo il layer basso è il migliore; più di 2 non è testato. Qwen3.8 non trova vantaggio da più di un layer `[PDF-agente]`.
- **Saturazione** con la tabella più grande (punto 4).

**Le tue due tabelle** — una piccola per la memoria persistente (preferenze, procedure preferite) e una grande per la conoscenza — **non esistono come due tabelle addestrate separatamente** in nessun lavoro trovato. Esiste però la forma più vicina: **override per-utente sopra la tabella di conoscenza**, che si sommano finché gli indirizzi non si sovrappongono (*User as Engram* §4.4). È la tua idea realizzata come *strato* invece che come seconda tabella, e non costa calcolo in più.

⚠️ **Tre limiti da tenere davanti** `[INFERRED]`:
- **Le preferenze non sono fatti.** «Preferisce i commit in italiano» si scrive come riga, ma «di solito, prima di un deploy, vuole vedere i test» è una **procedura**. Probabilmente sta meglio nella LoRA (o nell'adapter di abilità) che in una tabella indirizzata da n-grammi.
- **Il tetto del 35% a 1000 fatti** rende la memoria utente nella tabella **più debole** di un file di memoria letto nel contesto, che oggi abbiamo già nell'harness. Per ora la tabella non lo sostituisce.
- **Una tabella scrivibile è una superficie d'attacco.** *BadEngram* (arXiv 2609.13478): modificando circa lo 0,019% dei parametri, cioè solo la tabella, si impianta un comportamento nascosto che scatta su un trigger, con successo del 47,8-64% su Qwen3.8 `[abstract + PDF-agente]`. Se la memoria utente si scrive a caldo, chi scrive deve essere controllato come una scrittura di pesi, non come una nota.

## 6. Il vettore dell'ultimo layer rimesso in input

Già trattato: è **Coconut** (arXiv 2412.06769). La tua conclusione è nell'ADR D4 ([[../decisions/2026-06-28-decisions-d1-d5]]): pensiero latente per la parte di ricerca, poi verbalizzazione, con la verifica sempre in token. Su **GPT-6 Astra** il «recurrent depth» ci risulta solo dalla stampa, non da OpenAI. Non ricontrollato il 2026-10-02.

## In una riga, per la discussione sull'architettura

La divisione regge **come principio**, ed è quella che due lavori del 2026 hanno costruito. Ma: Engram si mette in **pre-training**, quindi riguarda il modello futuro; la tabella dà **fatti**, non collegamenti; e una memoria scrivibile ha un **tetto** di qualità e un **rischio** di sicurezza misurati.

## Links
[[../entities/architetture-deepseek-v41-flash-e-qwen38-next]] · [[valutazione-front-jev-e-llm]] · [[../decisions/2026-06-28-decisions-d1-d5]] (D4) · [[catastrophic-forgetting]] · [[lora-stacking]]

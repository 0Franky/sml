---
name: class-prospective-memory
description: Classe di training (5ª figlia di metacognitive-self-audit, gemella-SAVE di confabulation-retrieval) — riconoscere ORA che un'informazione servirà MOLTI turni dopo (oltre la finestra nativa) e SALVARLA proattivamente PRIMA che si perda, in modo DISCRIMINATIVO (ciò che è durevole+utile, non ogni cosa). Origine: F23 (Gemma: 0 note su 5 nudge di eviction → non salva la task-history nemmeno spinto).
type: training-class
tags: [reasoning, metacognition, memory, prospective-memory, self-audit, area-04, child-class, held-out]
last_updated: 2026-07-06
---

# Classe (figlia) — MEMORIA PROSPETTICA (salva-ciò-che-ti-servirà)

> **Ruolo**: 5ª figlia di [[class-metacognitive-self-audit]] (radice: consapevolezza + audit del proprio processo). È il **lato SAVE** del binomio memoria; la **gemella-RECALL** è [[class-confabulation-retrieval-failure]] (*"ce l'ho davvero o lo invento?"*). Insieme formano la **disciplina di memoria** attraverso il bordo della finestra: **salva ciò che outlast-erà** (prospettiva) ↔ **non affermare ciò che non hai salvato/recuperato** (provenienza). *(Se il pattern cresce → candidato sub-parent "memory-discipline"; per ora coppia cross-linkata sotto lo stesso padre — regola #20.)*
> **Origine**: **F23** ([[../harness-experiment-log]]) — l'eviction-checkpoint ha SCATTATO 5× spingendo Gemma a salvare i task in uscita dalla finestra, e Gemma ha fatto **0 note / 0 jot**: non riconosce la task-history come "da salvare". La recall è crollata alla sola finestra nativa (60%). Il modello non ha **memoria prospettica**: non anticipa che gli servirà.

## La skill-target (segnale, preciso e falsificabile)

Mentre lavora, il modello **riconosce che un'informazione avrà rilevanza FUTURA oltre l'orizzonte della finestra** (un vincolo, una decisione, un nome, un valore, un thread aperto, un risultato intermedio che servirà a valle) e la **SALVA proattivamente** (note/set_var / store durevole) **PRIMA** che esca dal contesto e vada persa. **Discriminativo**: salva ciò che è **durevole E servirà**, NON ogni dettaglio (l'over-save è il modo-di-fallire speculare).

**Falsificabile**: a valle, l'informazione salvata o **è ripescabile e viene usata** quando serve (valore prospettico realizzato) o no. Non si premia "ho salvato qualcosa" (participation-hack), ma il fatto che il salvataggio **abbia evitato una perdita reale**.

**Classificazione training-vs-harness** ([[../concepts/training-vs-harness-classification]], CLAUDE.md #11): metà **S** (decidere *cosa* e *quando* salvare = giudizio prospettico; stato-senza-training **INERTE-o-DEGRADATA**: F23 mostra 0-save anche col nudge) + **F-harness** = la **cattura deterministica** (l'harness auto-salva il digest dei turni in uscita, branch F23 "lane da riprogettare"). **Doppio scopo** (regola #18): l'harness scaffolda ORA (cattura deterministica, non dipende dal modello); il training **internalizza** la disciplina → lo scaffold **recede** ([[../feedback_reward_hacking_principle]], L3-anti-pezza).

## Esempi POSITIVI (cross-dominio — regola #19)

- **[A · lavoro/tech, il caso generalizzato held-out]** durante una sessione lunga arriva un **vincolo/decisione** che servirà molti passi dopo → salvalo ora (nel ticket/nota) prima che esca dal contesto; a valle lo ritrovi invece di ri-derivarlo o confabularlo.
- **[B · vita quotidiana]** ti presentano una persona → **annoti il nome** subito (sai che lo dimenticheresti); parcheggi in un garage grande → **segni il piano/settore** prima di allontanarti.
- **[C · viaggio]** all'arrivo **salvi l'indirizzo dell'hotel / il gate** mentre li hai davanti, non "tanto me lo ricordo".
- **[D · salute]** annoti **quando hai preso il farmaco** per non ri-dosare per dimenticanza.
- **[E · ricerca/riproducibilità]** registri il **seed / l'iperparametro** dell'esperimento nel momento in cui lo usi → a valle riproduci invece di indovinare.

## Esempi NEGATIVI (regola #21 — il CONFINE: quando NON salvare / non over-save)

I negativi rendono il segnale **discriminativo** (anti-hoarding, anti participation-hack):

- **[N1 · over-save di trivia]** salvare OGNI dettaglio transitorio (ogni riga di output, ogni passo intermedio irrilevante) → rumore che soffoca ciò che conta. La lane ha capacità finita: over-salvare **spinge fuori** i fatti veri. Il gold è **selettività**, non volume.
- **[N2 · già persistito/disponibile]** l'informazione è **già** nel contesto durevole / recuperabile a comando → ri-salvarla è ridondanza (link [[class-confabulation-retrieval-failure]]: prima verifica se ce l'hai già).
- **[N3 · non servirà]** un dato chiaramente **usa-e-getta** (rilevante solo per il turno corrente) → NON salvarlo; salvarlo "per sicurezza" è cerimonia penalizzata.
- **[N4 · save-di-spazzatura per lucrare il segnale]** salvare qualcosa *solo perché "salvare è premiato"* → **0** (è l'anti-hack esplicito del design eviction-checkpoint: mai premiare il salvare-per-salvare).

## Reward (ANCORATO all'OUTCOME + SIMMETRICO)

- **Positivo** sse l'informazione salvata **(a)** era **durevole e realmente necessaria a valle** E **(b)** il salvataggio ha **evitato una perdita** (a valle è ripescata e usata / avrebbe altrimenti richiesto ri-derivazione o prodotto confabulazione). Verificato sull'**uso-a-valle reale** (oracolo: la probe/task successiva che dipende dall'info riesce), NON sul "ha salvato".
- **Simmetrico**: premia ANCHE il **NON salvare** correttamente (N1-N3 → selettività). Né "salva-sempre" né "non-salvare-mai".
- **Hack-check**: *participation* ("salvo per prudenza" senza necessità reale) → 0; *over-save* (N1/N4) → penalizzato (àncora all'outcome, non al volume); *default fisso* → neutralizzato dalla simmetria. ([[../feedback_reward_hacking_principle]])

## Label-generation (mutation/oracle)

Scenari multi-turno *lunghi* dove un'informazione al turno *t* è **necessaria** al turno *t+K* (K > finestra) — costruiti come **fixture self-contained** (regola #22: fatti veri-per-costruzione, nessuna verità-del-mondo). Oracolo = la task/probe a *t+K* riesce **sse** l'info è stata salvata a *t*. **Mutazioni**: variare K (dentro/fuori finestra → dentro = N3 non-serve-salvare); iniettare distrattori transitori (per generare N1 over-save); rendere l'info già-persistita (N2). Bilanciamento positivi↔negativi obbligatorio. Riusa [[../../harness/verifiers/deceptive-task-gen]] per i distrattori.

## Decontaminazione (regola #18)

L'**istanza osservata** (F23: Gemma / task-history di coding) è **held-out di validazione**, NON nel training. Il training usa i transfer cross-dominio §positivi/§negativi. Se il modello ha imparato la **memoria prospettica**, a valle risolve F23 per **transfer** — ed è anche la **metrica di successo del branch harness→training** (lo scaffold di cattura deterministica può recedere man mano che questo sale).

## Links
[[class-metacognitive-self-audit]] (padre) · [[class-confabulation-retrieval-failure]] (gemella-RECALL) · [[class-stagnation-recovery]] · [[../harness-experiment-log]] (F23) · [[../concepts/training-vs-harness-classification]] · [[../concepts/eviction-checkpoint]] · [[../feedback_reward_hacking_principle]] · [[../feedback_intelligence_gap_to_training_class]] · [[area-04-context-metacognition]]

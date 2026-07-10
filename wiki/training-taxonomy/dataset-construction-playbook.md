---
name: dataset-construction-playbook
description: PLAYBOOK maestro (SSOT operativa) per costruire OGNI classe del training dataset — raccoglie requisiti, regole (#10+#18-#25), workflow, tecniche di label-gen, il CATALOGO delle "cose a cui stare attenti", e il coherence-audit che tiene il dataset coerente con le scelte. Segna-SEMPRE qui ogni osservazione nuova (regola #25, utente msg 1381).
type: playbook
tags: [training, taxonomy, methodology, dataset-quality, coherence, ssot, playbook, meta]
last_updated: 2026-07-09
---

# Playbook di costruzione del dataset — la guida unica

> **Perché** (utente msg 1381): *"assicurati che tutti i requisiti e regole per ogni classe del dataset sia scritta e raccolta in wiki o in una guida/playbook. Specie tutte le osservazioni e cose a cui stare attenti… metti regola che devi segnare sempre queste cose… e tutto il dataset rimane coerente con scelte e impostazione."* Questa pagina è la **SSOT operativa**: chi costruisce una classe parte da qui.
> **Rapporto con le altre pagine**: NON duplica — **indicizza** [[../concepts/training-set-construction-principles]] (mirror #18-#22), [[../concepts/training-set-completeness-audit]] (checklist), [[gold-methodology]] (gold), [[README]] (forma delle foglie) + aggiunge il **§4 Catalogo caveat** e il **§5 Coherence-audit**. La fonte autoritativa delle regole resta `CLAUDE.md`.
> **Regola #25 (segna-SEMPRE)**: ogni osservazione/caveat che emerge (chat, esperimenti, review) va aggiunta al **§4** SUBITO — mai lasciata solo in chat.

---

## §1 — Le regole di costruzione (indice)

Ogni classe si costruisce applicando TUTTE insieme (fonte autoritativa = CLAUDE.md; dettaglio navigabile = colonna Doc):

| # | Regola | In una frase | Doc |
|---|---|---|---|
| **#10** | Reward all'OUTCOME | premia l'errore reale risolto, MAI la cerimonia/partecipazione; hack-check su ogni proxy | [[../feedback_reward_hacking_principle]], [[../concepts/reward-hacking-mitigation]] |
| **#18** | Gap → CLASSE (proponi→approva) | ogni buco osservato → classe astratta + soluzione outcome-anchored; istanza **held-out** | [[../feedback_intelligence_gap_to_training_class]] |
| **#19** | Transfer cross-dominio | ≥3-4 transfer non-tecnici (vita quotidiana→sistemico), mai solo software | [[../feedback_transfer_always_cross_domain]] |
| **#20** | Gerarchia padre→figlia | cerca/crea il padre (skill-radice) e aggancia; ricorsione quando serve | [[../feedback_hierarchical_training_classes]] |
| **#21** | Negativi + completezza | contro-esempi del confine + reward simmetrico + audit completezza/coerenza | [[../feedback_negative_examples_and_dataset_completeness]] |
| **#22** | Integrità fattuale | mai fatti inventati/incompleti; split verificato-citato (I) vs incerto→verify-step (II); fixture self-contained | [[../feedback_training_set_factual_integrity]] |
| **#23** | Aggiorna il manuale | ogni finding → wiki subito (qui, experiment-log, concepts) | [[../feedback_always_update_model_manual]] |
| **#25** | Playbook + coerenza | segna qui ogni osservazione; ogni classe conforme + coherence-audit | questa pagina |

---

## §2 — Workflow per una classe nuova (end-to-end)

1. **Astrai il gap** in una classe (#18) — nome, skill-radice, modo-di-fallimento reale osservato.
2. **Trova/crea il PADRE** e aggancia come figlia (#20); valuta sotto-specializzazioni.
3. **Proponi all'utente** (home taxonomy + reward-tag + label-gen + hack-check) e **attendi l'ok** (#18) prima di filare.
4. **Scrivi il gold** come **HELD-OUT** (istanza osservata, decontaminata #18) — [[gold-methodology]].
5. **Positivi + NEGATIVI** del confine, con **reward simmetrico** (#21).
6. **Transfer cross-dominio** ≥3-4 non-tecnici, banale→sistemico (#19) — gruppi A software / B vita-quotidiana / C sistemico.
7. **Reward = OUTCOME** verificato da oracolo; definisci l'**hack-check** (#10) — *"come massimizza senza la skill? qual è la difesa?"*.
8. **Integrità fattuale** del substrato (#22): fixture self-contained o fatti verificati+citati; incerto→verify-step.
9. **Label-gen** (§3): oracolo/generatore deterministico + distrattori load-bearing.
10. **Coherence-audit** (§5) + **completeness-audit** ([[../concepts/training-set-completeness-audit]]) PRIMA di "pronto".
11. **Wiring** (#12): index + padre-tabella + cross-ref + todo + log; `/graphify --update` al prossimo batch.

---

## §3 — Tecniche di label-generation

| Tecnica | Cosa fa | Modulo |
|---|---|---|
| **Mutation trap-sound** | da `(C corretto, suite)` → mutanti + partizione provided/hidden (deceptiveness eseguita, non assunta) | [[../../harness/verifiers/deceptive-task-gen]] |
| **Oracolo strutturale self-contained** | decisione modellata + `score` outcome-anchored su fixture (testa il ragionamento, non il recall) | [[../../harness/verifiers/async-schedule-gen]] |
| **MCQ hard-distractor a coppie** | 4/6/10/16 opz = minimal-pairs, one-correct, posizione randomizzata + audit tell | [[../../harness/verifiers/mcq-distractor-gen]] · [[../concepts/discriminative-mcq-hard-distractors]] |

Principio comune: l'oracolo è **deterministico** e premia l'**esito**; i distrattori sono **load-bearing** (sbagliati per una ragione reale), **style-matched**, derivati dai **failure-mode reali** del modello.

---

## §4 — CATALOGO "cose a cui stare attenti" (segna-SEMPRE qui — regola #25)

> Raccolta VIVA (sweep-wiki 2026-07-08 + ogni osservazione futura). Formato: **[TEMA]** osservazione — *fonte*. Quando emerge un caveat nuovo → aggiungilo qui SUBITO.

### REWARD (ancoraggio outcome / anti-cerimonia / simmetria)
- **[REWARD]** Ancora SEMPRE all'**OUTCOME** verificabile (errore reale scovato/evitato), MAI alla cerimonia/forma ("valuto le alternative…", "per la legge di prossimità…" → 0). — [[../concepts/reward-hacking-mitigation]], tutte le class-*.
- **[REWARD]** **Simmetrico** obbligatorio: falso-positivo penalizzato quanto falso-negativo → neutralizza gli hack a comportamento fisso (sempre-prudente/cheap/async/batch/astieniti). — ricorrente (resource-substitution, confabulation, domain-routing, secret-hygiene).
- **[REWARD]** **"Participation-hack"**: premiare l'ATTO (critica/verifica/salvataggio/reclutamento) senza esito reale → credito 0; conta solo l'end soddisfatto. — [[class-subgoal-hijacks-task]], [[class-prospective-memory]].
- **[REWARD]** Preferisci reward **Q** (exec/test/exact-match/scanner) a reward **L** (judge) ovunque possibile; **L mai da solo**. — [[README]], reward-hacking-mitigation.
- **[REWARD]** `R_discipline` sempre **SUBORDINATO** a `R_outcome` (non standalone) → non incassi la disciplina spedendo codice rotto. — verification-discipline-training §2.
- **[REWARD]** **Scorer ≠ scored**: il reward L viene da un giudice **indipendente**, MAI dal self-score del modello (il self-score comunica il gap, non è reward). — reward-hacking-mitigation §3.
- **[REWARD-L]** Scelte-di-valore/deferral: NIENTE reward sul ramo; solo penalità simmetrica via coerenza campi-tipizzati↔facts + razionale↔campi. — [[gold-methodology]] §Reward-L.

### HACK-CHECK (come massimizzare senza la skill + difesa)
- **[HACK-CHECK]** **OBBLIGATORIO** per ogni foglia/classe: *"come massimizza il modello senza la skill?"* → elenca gli hack + la difesa che li neutralizza. — [[README]] §1, reward-hacking-mitigation §4.
- **[HACK-CHECK]** **Over-triggering / cerimonia** (bocciare artefatti sani gridando "regressione/disallineato" per lucrare "ho trovato un problema") → cerimonia senza delta-metrico = 0 + negativi su target-validi. — [[class-svg-spatial-composition]], [[class-frontend-ux-spacing-quality]].
- **[HACK-CHECK]** **Over-refusal** = hack dominante di safety/secret ("non emetto mai/redigo tutto/rifiuto tutto") → negativi benigni + reward simmetrico. — [[class-secret-hygiene-under-distraction]], [[class-non-overridable-protection]], [[class-prompt-injection-resistance]].
- **[HACK-CHECK]** **Surface-cue over-fit** (keyword/dimensione/etichetta come proxy del segnale vero) → muta il cue e diventa non-predittivo; la trappola **size≠scope** forza i segnali reali. — [[class-scope-adaptive-knowledge-aggregation]], [[class-requirements-driven-tree-navigation]].
- **[HACK-CHECK]** **Over-fit ai nomi-tecnica** osservati (poesia, homoglyph, Base64…) → non gonfiare sulle forme esotiche se il baseline regge. — class-prompt-injection-resistance.
- **[HACK-CHECK]** **Pixel-diff / copia-verbatim** del ground-truth → reward su relazioni invarianti a traslazione/scala + target held-out a inference. — class-svg-spatial-composition.
- **[HACK-CHECK]** ⚠️ **Object-depiction "sembra-l'oggetto" percettivo + layer-inflation** (facet msg 1535/1545, [[class-svg-spatial-composition]] §Facet-object-depiction): premiare "sembra una rosa" (percettivo/soggettivo) = hack → reward SOLO su predicati **geometrici deterministici** (distribuzione-radiale/connettività/ordine-relativo/contenimento). Il **layer-inflation** (layer vuoti/finti per gonfiare il conteggio-parti) → il conteggio-layer si confronta con le parti-**semantiche** del ground-truth, non un numero assoluto. Simmetria applicata SOLO dove il GT la richiede (oggetti asimmetrici = negativo se forzati). SSOT/DRY: è una **facet** della classe esistente, non un doppione (stesso reward-engine strutturale-non-pixel).

### NEGATIVI / CONFINE (#21)
- **[NEGATIVI]** Contro-esempi dove la skill NON scatta / la risposta corretta è l'opposto o il non-agire; senza, un default fisso "passa" come hack. — #21.
- **[NEGATIVI]** Positivi↔negativi **BILANCIATI** (non 90/10) e il negativo **non-ovvio** (non segnalato da cue lessicale). — [[../concepts/training-set-completeness-audit]] §2.
- **[NEGATIVI]** Confine **dual-use**: su richieste legittime-ma-rischiose il gold DISCRIMINA (analisi + fermati prima del passo weaponizzato + chiedi conferma), non rifiuta in blocco. — class-prompt-injection-resistance (N8).
- **[NEGATIVI]** ⚠️ **Anti-sycophancy simmetrico** (dal mining #5, [[class-context-over-parametric-authority]]): "fatto-utente autorevole" NON è "utente-ha-sempre-ragione" — il negativo obbligatorio è la **claim-utente SBAGLIATA** (non cedere per compiacere) accanto al **fatto-iniettato/avversariale** (non adottare ciecamente). Il gold è l'ARBITRATO verificato, non la deferenza né l'ostinazione. — analogo alla false-block bilanciata.
- **[NEGATIVI]** ⚠️ **Fedeltà bidirezionale** (dal mining #6, [[class-instruction-fidelity-no-overreach]]): la simmetria è a 4 poli — over-reach / under-delivery / obbedienza-al-pericoloso / over-flag-sul-benigno; nessun default fisso ("aggiungi-sempre", "fai-il-minimo", "obbedisci-sempre", "segnala-sempre") deve vincere.
- **[VERIFICA]** ⚠️ **Non-contaminazione del verificatore** (dal mining #2, [[class-independent-verification-integrity]]): quando il gold è una VERIFICA indipendente, la fixture deve permettere al verificatore di raggiungere una conclusione DIVERSA (non passargli l'expected-value del produttore) — altrimenti misura auto-conferma, non audit. Indipendenza proporzionale alla posta (non paranoia su tutto).
- **[NEGATIVI+OUTCOME]** ⚠️ **Proattività calibrata** (msg 1516, [[class-proactive-improvement-proposal]]): il value-add proattivo è una SKILL (soglia `valore × validità × rilevanza`), non "proponi sempre". 3 negativi obbligatori e SIMMETRICI: **over-suggest** (rumore/boilerplate generico) ↔ **under-propose** (valore-mancato) a pari penalità, + penalità DURA per **proposta invalida/confabulata** (peggio del silenzio). Reward ancorato all'**outcome** = il valore promesso si materializza davvero (anti "valore plausibile-a-parole"); hack-check chiave = boilerplate sempre-safe ("aggiungi test/error-handling") → score 0 se non specifico+valido nel contesto. Distinto da over-reach (fatto-invece-di-proposto = [[class-instruction-fidelity-no-overreach]]).

### TRANSFER (#19) & GERARCHIA (#20)
- **[TRANSFER]** SEMPRE ≥3-4 domini lontani (vita quotidiana, economia/policy, ecologia, salute, business) + complessità variabile; MAI concentrato in software → altrimenti il modello **LOCALIZZA** la skill. — #19.
- **[TRANSFER]** La logica astratta vale ovunque (consequence↔intention = Cobra effect in economia) → il cross-campo **costringe l'astrazione** ED è la metrica di successo. — class-consequence-intention-conflict.
- **[TRANSFER]** ⚠️ I gold **pre-2026-07-05** (es. decomposition) mancano del transfer cross-dominio (= FAIL audit) → da retro-fittare. — training-set-completeness-audit.
- **[GERARCHIA]** Cerca/crea il **PADRE** (radice imparata una volta) e aggancia; ricorsione se una figlia merita sotto-figlie; mai sorelle scollegate. — #20.

### INTEGRITÀ-FATTUALE (#22)
- **[INTEGRITÀ]** Ogni fatto = ground-truth: falso o **INCOMPLETO** (mezza-verità) contamina. — #22.
- **[INTEGRITÀ]** Split: (I) verificato+stabile → citato+minimizzato; (II) incerto/volatile → MAI asserito → **verify-step/Discovery**; default in dubbio = (II). — #22.
- **[INTEGRITÀ]** Skill di ragionamento → fatti **self-contained** nella fixture (veri-per-costruzione): testa il ragionamento non il recall. — gold-methodology, class-alternative-path-under-block.
- **[INTEGRITÀ]** Reward sul **comportamento di verifica** (ha risolto il `[?]`), NON sul conoscere-il-fatto (che potremmo aver sbagliato). — #22, verification-discipline-training.

### DECONTAMINAZIONE / HELD-OUT (#18)
- **[DECONTAMINAZIONE]** L'istanza osservata resta SEMPRE **held-out**, MAI nel training (train-on-test contamina il validation). — ricorrente (tag `held-out` nel frontmatter di ogni classe).
- **[DECONTAMINAZIONE]** Traduci la skill in 3-4 esempi su domini **disgiunti**; il transfer sull'held-out È la metrica di successo. Il generatore di label NON deve emettere l'istanza-eval. — class-sign-wrap-blindspot, feedback_intelligence_gap_to_training_class.

### DISCRIMINAZIONE (near-miss / minimal-pairs / MCQ)
- **[DISCRIMINAZIONE]** Near-twin = **mutazione del corretto lungo la SOLA feature load-bearing** (minimal pair), da failure-mode REALI, mai errori superficiali. — [[../concepts/discriminative-mcq-hard-distractors]], class-sign-wrap-blindspot.
- **[DISCRIMINAZIONE]** Distrattori **STYLE-MATCHED** (lunghezza/tono/specificità) + audit distractor-tell (no cue di lunghezza/hedging/"all of the above") → altrimenti impara il **cue di superficie**. — discriminative-mcq-hard-distractors (fix #5).
- **[DISCRIMINAZIONE]** Oracolo **exactly-one-correct**; più opzioni (4→16) abbassa il guess 25%→6.25%. Applica a **2 fasi** (Recognition + Generation self-check); la **generazione resta primaria**. — discriminative-mcq-hard-distractors.
- **[DISCRIMINAZIONE]** Calibro del near-miss: la disguise casca **solo se il dominio NON evoca** l'edge; i domini che lo evocano restano come **controlli-negativi**; ogni candidato validato **girando il modello**. — class-sign-wrap-blindspot.
- **[DISCRIMINAZIONE]** **Discrimination-gate** per il test scritto dal modello: `T(B)=FAIL ∧ T(C)=PASS` (predicato ∀ eseguibile, non "esiste un test") + eseguito dal vivo → un test-placebo = 0. — verification-discipline-training §2-3.

### CoT / ANCORAGGIO
- **[CoT]** **Catena-fantasma**: reasoning plausibile ma NON causale = teatro che soddisfa il judge (rischio alto su foglie L senza artefatto). — reward-hacking-mitigation.
- **[CoT]** Ogni marker **`[V]`** = tool-call/artefatto REALE nel trace; "ho testato" a parole = 0. — verification-discipline-training §3, [[../concepts/structured-thinking]].
- **[CoT]** **Monitor di ablazione**: rimuovi/corrompi una premessa `[V]` → se l'output NON cambia, la catena era teatro → re-tune del reward. — reward-hacking-mitigation (difesa #13).
- **[CoT]** **Proporzionalità**: catena solo dove il ragionamento è non-ovvio; banale = una riga (no rito a 3 heading). Substrato [V]/[A]/[?] terso, ≠ risposta user-facing. — CLAUDE.md #10, structured-thinking.

### RANDOMIZZAZIONE (symbol / position / dynamic-context)
- **[RANDOMIZZAZIONE]** **Posizione SEMPRE randomizzata** su 2 livelli: (a) shuffle per-item, (b) distribuzione ~uniforme delle lettere-corrette a livello **dataset** (auditata) → previene il bias "sempre-C". — discriminative-mcq-hard-distractors (fix #4). *(GAP: manca un concept dedicato cross-cutting — vedi §fine.)*
- **[RANDOMIZZAZIONE]** Etichette/posizioni delle varianti mescolate + optimum condizionato-al-contesto → "prendi sempre la 3ª/l'opzione c" sbaglia una frazione misurabile. — class-frontend-ux-spacing-quality.
- **[RANDOMIZZAZIONE]** Regime symbol-random: knowledge immutabile (formule) → CE-loss memorizzato; codice/strutture → nomi random mai-visti-2-volte per forzare l'attention chirurgica (induction heads). Mix di naming (hash/wordlike/natural) anti shortcut. — runtime-symbol-randomization-training.
- **[RANDOMIZZAZIONE]** Dynamic-context: varia ≥5 dimensioni per sample (length/item-count/needle-position/noise-density/section-order) + 4 tipi di rumore adversariale. — dynamic-context-training-regime.

### ORACOLI / LABEL-GEN
- **[ORACOLO]** Predicato **ESEGUIBILE** ancorato a fixture, quantificato su **TUTTI** gli elementi (∀), non un singolo caso → altrimenti gameabile. Pinna il detector concreto+deterministico (es. `pylint duplicate-code min-similarity-lines=N`), mai "un detector astratto". — gold-methodology.
- **[ORACOLO]** ⚠️ Niente `sha256` su contenuto che passa per git (autocrlf LF→CRLF rompe Win↔Linux) → oracoli **semantici**; fenomeni non-deterministici (race) → **check STATICO** sull'azione proposta, non exit-code. — gold-methodology.
- **[ORACOLO]** Marker **`[UNVERIFIED — format-only]`** sui gold non eseguiti in sandbox; gli output non-eseguiti contengono bug di ragionamento (oracoli sbagliati) → correggi la logica ora. — gold-methodology.
- **[LABEL-GEN]** Mutation **trap-sound** (deceptive-task-gen): la deceptiveness va **verificata ESEGUENDO** (non assunta); il set MISCHIA task-ingannevoli e onesti → il modello impara QUANDO serve verifica, non "scrivi sempre 10 test". — verification-discipline-training §2/§4.

### COMPLETEZZA / COERENZA / PROCESSO
- **[COMPLETEZZA]** Prima di "pronto": audit 7-voci PASS/FAIL con evidenza (copertura/negativi-bilanciati/transfer/coerenza/ancoraggio/decontaminazione/wiring); FAIL → giustificato o TODO. Copertura = sotto-classi + casi-confine (vuoti/zero/boundary) + failure-mode reali. — [[../concepts/training-set-completeness-audit]].
- **[COERENZA]** Due esempi non devono insegnare cose **opposte** sullo stesso input (label conflittuali); oracoli/reward coerenti (stessa metrica-obiettivo, stesso ancoraggio). — training-set-completeness-audit §4.
- **[COERENZA]** Nessuna contraddizione col **padre/sorelle**; marca lo **scope** di responsabilità per non sovra-estendere una classe su ciò che è della sorella. — class-secret-hygiene (N5→sorella).
- **[COERENZA]** Template-inheritance a 3 livelli per DRY di authoring, MA il modello si addestra sull'**ESPANSO** a piena fedeltà → serve step di espansione. Disambigua `tags:` (graphify) da `reward_tag:`; dichiara le omissioni vs template (no omissioni silenziose). — gold-methodology.
- **[PROCESSO]** **Review-loop OBBLIGATORIO**: autore verticale → revisore agnostico severo → integratore (il revisore pesca P0 che l'autore razionalizza). — gold-methodology §Review-loop.
- **[DOPPIO-SCOPO]** Ogni esperimento migliora l'harness E scopre buchi-da-addestrare → collega finding-harness ↔ classe-training (lo scaffold harness recede man mano che la skill sale). — feedback_intelligence_gap_to_training_class.
- **[SITUATIONAL / F-inietta-il-FATTO, S-RAGIONA] (2026-07-09)** Nelle classi di *situational-awareness* l'harness inietta il **FATTO** (la `<current_date>`, la tool-list, l'indice-KB) = F; la **skill** è il ragionamento su cosa il fatto IMPLICA = S. **Premia il ragionamento/verify-step, MAI la presenza del fatto iniettato** (un fatto pre-masticato che pre-decide l'implicazione = crutch/participation-hack). Caso recency-epistemica: per un fatto **volatile** premia il **VERIFICARE/qualificare** (che la fixture può marcare volatile), NON l'aver-indovinato il valore (rule #22: reward sul verificare, non sul conoscere — la fixture può renderlo volutamente incerto). — class-temporal-awareness / class-harness-environment-awareness / class-knowledge-base-curation.
- **[AUTHORING-TAG ≠ reward ≠ prompt] (2026-07-09)** I tag di *tipo/topic/cross-reference* sugli esempi (`implementation-code`, `optimization`, i cross-ref idea #4) sono **authoring-metadata**: (a) **NON premiati** (premiare l'emissione del tag = participation-hack / mode-tic → 0); (b) **NON leakati nel prompt runtime** visto dal modello (sarebbe una checklist-in-prompt → shortcut, [[../concepts/dataset-on-the-fly-pseudorandom]] §no-checklist). Vivono SOLO nel layer di sampling/authoring del dataset (compongono il curriculum + il grafo cross-ref). Valida il thinking-mode per **ABLAZIONE** (mode-giusto batte default sull'outcome), non per presenza-del-tag. — compositional-curriculum-thinking-optimization §Addendum / class-domain-categorization-routing §Addendum.

> **GAP dalla sweep — CHIUSI (2026-07-08):** (a) ✅ [[../concepts/position-answer-randomization]] (principio cross-cutting randomizzazione, 3 assi); (b) ✅ [[../concepts/oracle-design-pitfalls]] (6 trappole+difesa); (c) ✅ tracker di applicazione MCQ in [[../concepts/discriminative-mcq-hard-distractors]] §Tracker.

---

## §5 — Coerenza del dataset + COHERENCE-AUDIT

Il dataset resta **coerente con scelte e impostazioni** (regola #25). Convenzioni condivise che OGNI classe rispetta:

- **Struttura sezioni uniforme**: frontmatter · Stato/Padre · Il gap · La skill · Gold HELD-OUT · Transfer A/B/C · Negativi · Reward(OUTCOME) · Label-gen · Hack-check · Links.
- **Reward** sempre outcome-anchored + hack-check presente.
- **Gerarchia** esplicita (ogni classe ha un padre o è un padre dichiarato).
- **Held-out** dichiarato + decontaminato.
- **Transfer** cross-dominio A/B/C.
- **Negativi** presenti (o motivazione esplicita se non applicabili).
- **Integrità fattuale** (fixture self-contained o fatti citati).
- **Link reciproci** padre↔figlie↔sorelle + index aggiornato.

**Coherence-audit (checklist Y/N con evidenza — gira PRIMA di "pronto")**:
1. La classe rispetta la struttura-sezioni condivisa? (Y/N)
2. Il reward è outcome-anchored + c'è l'hack-check? (Y/N)
3. È agganciata a un padre (o dichiarata padre)? Nessuna sorella scollegata? (Y/N)
4. Gold held-out dichiarato + decontaminato? (Y/N)
5. Transfer cross-dominio A/B/C (≥3-4 non-tecnici)? (Y/N)
6. Negativi del confine + reward simmetrico dove serve? (Y/N)
7. Integrità fattuale OK (fixture self-contained o citazioni)? (Y/N)
8. **Nessuna CONTRADDIZIONE** con classi esistenti (stessa skill definita in modo diverso? reward incoerente? confine sovrapposto)? (Y/N)
9. Wiring completo (index + padre-tabella + cross-ref + todo + log)? (Y/N)
10. Un caveat nuovo è emerso? → aggiunto al §4? (Y/N)

Tutti Y con evidenza → coerente. ≥1 N → correggi prima di dichiarare pronto.

---

## §6 — Registry delle classi (mappa di coerenza)

Le **aree** (backbone 16): [[area-01-organization-planning]] … [[area-16-self-evaluation-critique]] (vedi [[README]]).
Le **classi/gerarchie** attuali (padri 👑 → figlie):

- 👑 [[class-metacognitive-self-audit]] (INWARD, àudita la MENTE) → stagnation-recovery (→ focus-decompose / jot) · transfer-assumption-audit (#145) · consequence-intention-conflict (→ subgoal-hijacks-task · **anticipation-and-irreversibility** [mining #16]) · confabulation-retrieval-failure · prospective-memory · instruction-phase-clarification · **instruction-fidelity-no-overreach** [mining #6] · **independent-verification-integrity** [mining #2] · domain-categorization-routing.
- 👑 [[class-situational-awareness]] (OUTWARD, modella la SITUAZIONE — gemello del precedente) → temporal-awareness (+recency-epistemica) · harness-environment-awareness (fondamento memory-twins) · knowledge-base-curation · **context-over-parametric-authority** (autorità-della-fonte, mining #5) · **proactive-improvement-proposal** (obiettivo-utente & value-add, msg 1516 — tensione-gemella con instruction-fidelity sull'altro padre). **Refine collegati**: domain-categorization-routing §Addendum (task-type→thinking-mode) · [[../concepts/compositional-curriculum-thinking-optimization]] §Addendum (optimize-while-implement + authoring-tags).
- 👑 [[class-constraint-fit-decision]] → resource-appropriate-substitution · alternative-path-under-block (→ A parità-per-misura / B best-fit-per-uso).
- 👑 [[class-action-execution-optimization]] → async-dispatch-and-prioritization · batching-repeated-ops · decision-cache-per-block · (foglie parallelization Area-1).
- 👑 [[class-visual-design-quality]] → frontend-ux-spacing-quality · svg-spatial-composition.
- Safety: [[class-prompt-injection-resistance]] · [[class-non-overridable-protection]] · [[class-secret-hygiene-under-distraction]].
- Reasoning/interazione: [[class-requirements-driven-tree-navigation]] · [[class-scope-adaptive-knowledge-aggregation]] · [[class-domain-categorization-routing]] · [[class-sign-wrap-blindspot]]. *(instruction-phase-clarification / -fidelity ora sotto metacognitive-self-audit.)*
- Metodologia trasversale (non-classe): [[../concepts/discriminative-mcq-hard-distractors]].

> Aggiornare questo registry a ogni classe nuova (parte del wiring #12) → è la mappa che rende visibili le contraddizioni/gap di coerenza.

---

## Links
[[../concepts/training-set-construction-principles]] · [[../concepts/training-set-completeness-audit]] · [[gold-methodology]] · [[README]] · [[../concepts/discriminative-mcq-hard-distractors]] · [[../concepts/reward-hacking-mitigation]] · [[../feedback_reward_hacking_principle]] · [[../feedback_always_update_model_manual]] · [[../feedback_dataset_playbook_and_coherence]]

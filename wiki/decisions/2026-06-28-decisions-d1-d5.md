---
name: 2026-06-28-decisions-d1-d5
description: ADR — le 5 decisioni del briefing 2026-06-28 confermate dall'utente (msg 245) + le sue aggiunte di design (D4 ibrido-Coconut futuro, D5 judge-contract). Stato accepted.
type: adr
tags: [adr, decisions, lora-init, tokenizer, hardware, reasoning, judge, three-tier]
sources: [user msg 2026-06-28 (245), 2026-06-28-open-decisions-briefing, lora-initialization-strategy]
last_updated: 2026-06-28
status: accepted
---

# ADR 2026-06-28 — Decisioni D1–D5 (confermate)

> **Status: accepted** (utente msg 245). Briefing di riferimento: [[2026-06-28-open-decisions-briefing]]. Per ogni decisione: cosa è stato deciso + razionale + follow-up tracciato in `wiki/todo.md`.

## D1 — LoRA init + spike aLoRA `[accepted]`
- **Deciso**: init **standard B=0** come default (parte da output=base, zero perturbazione del Tier 1, poi impara) + **ablation MiLoRA** per massimizzare la tenuta della conoscenza del Tier 1 (anti-forgetting) + **10% replay** + stack **DoRA/RsLoRA/LoRA+**. Per **aLoRA** (Activated-LoRA, swap senza ricomputo KV): **test minimale di validazione vs LoRA standard** (qualità + velocità swap) **prima** di addestrare gli adapter Tier 2/3.
- **Razionale**: preservare il Tier 1 (mente organizzativa) è prioritario; B=0 = "first do no harm"; MiLoRA adatta sulle direzioni minori senza toccare la conoscenza principale. Vedi [[../concepts/lora-initialization-strategy]] + [[../concepts/catastrophic-forgetting]].
- **Follow-up (todo)**: mini-ablation init (standard vs MiLoRA vs LoRA-GA) + spike aLoRA, in Fase F2, prima della pipeline adapter.

## D2 — Tokenizer / special-token `[accepted]`
- **Deciso**: aggiungere i token speciali (`<load:X>`, `<section>`, marker `[V]/[A]/[?]`, `<plan>`, `<safety_halt>`) al **vocabolario** + **embedding init** in fase di **setup** (irreversibile a metà training). Abbinare **XGrammar** (structured decoding) per garantirne la sintassi in output su un modello 4B.
- **Razionale**: i token speciali sono load-bearing per routing/struttura; aggiungerli dopo costringerebbe a ri-addestrare. XGrammar riduce il carico di training sul formato (la grammatica forza la sintassi, il training insegna il contenuto).

## D3 — Hardware / KV-policy su Turing `[accepted]`
- **Deciso**: **2080 Ti** (Turing) per il walking-skeleton/MVP; **fp16** (NON bf16/fp8, non supportati su Turing); **KIVI 2-bit / SnapKV** per il context lungo solo se necessario; **GPU cloud a ore** solo quando serve scalare.
- **Razionale**: vincolo hardware; su locale il ricomputo è latenza, non costo. Il 2080 Ti basta a provare l'infrastruttura (gate serving 0-B).

## D4 — Reasoning: marker espliciti (governabilità > velocità) `[accepted]` + ibrido Coconut (FUTURO)
- **Deciso**: reasoning con **marker espliciti `[V]/[A]/[?]`** (structured-thinking) = scelta confermata — **governabilità/auditabilità > velocità** (è la ground-truth organization-first). Coconut (latent reasoning) NON per il core.
- **🔭 Idea FUTURA da studiare (utente msg 245)**: **ibrido Coconut + nostra filosofia** — il ragionamento "grosso" avviene in **latent space** (veloce), poi si passa a un **pre-final check strutturato** nella traccia di pensiero (le **scelte** + il **perché**, in forma strutturata), poi **direttamente la risposta finale**. = "pensa veloce nascosto, poi un check finale esplicito e auditabile, poi rispondi". **Capire se è fattibile** (training-wise + serving-wise). → todo: concept esplorativo + verifica fattibilità. Vedi [[../concepts/interruption-robust-reasoning]] / [[../concepts/structured-thinking]].

## D5 — Judge: DeepSeek-V4-Flash su DwarfStar4 + structured-contract `[accepted]`
- **Deciso**: il **giudice** del training (RLAIF/PRM dove non c'è verifier deterministico) = **DeepSeek-V4-Flash** servito su **DwarfStar4 (DS4)** (vedi [[../entities/dwarfstar4]]). NB: DeepSeek è **permissivo** → ok per uso commerciale (a differenza di GPT-4/Claude come giudici, che sarebbero un problema-ToS per un modello da vendere — vedi briefing Parte 3 + il punto-council sotto).
- **Output del giudice = "contract" strutturato** (TOON / JSON / compacted structured data, **minimo overhead di token**) contenente: **dettagli, note, errori commessi, soluzioni/ottimizzazioni** (queste **SOLO se 100% sicuramente corrette**).
- **Il giudice ha checklist** (idea utente): **checklist pre-risposta** (gathering + analisi prima di giudicare) + **checklist finali** (verificare che la propria risposta sia verificata e sicura). = il giudice applica lo stesso rigore metodologico che addestriamo nel modello.
- **Difese (mie reco, accettate dall'utente — punti 3 e 4)**: **ensemble** di lenti + **audit dei bias** del giudice + ancoraggio al **trace reale**; e **preferire reward verificabili** (test/exec) dove possibile, il giudice solo dove non c'è alternativa. Coerente con "scorer ≠ scored" ([[../concepts/reward-hacking-mitigation]]).
- **Council DSv4+Claude — VERIFICATO 2026-06-28 (policy, alle fonti)** `[EXTRACTED]`: ❌ usare **Claude nel loop di training** di un modello commerciale concorrente **viola le policy Anthropic** — Usage Policy (no "utilization of outputs to train an AI model / model distillation" senza autorizzazione), Commercial Terms **D.4** (no "build a competing product... train competing AI models"); il ruolo giudice-generale **non** rientra nel carve-out usi-specializzati (classificatori/embedding). La struttura indiretta (veto/hint → reward) **non aggira** il divieto — **nemmeno un veto BINARIO sì/no** (clarif. utente msg 251): conta l'*uso* degli output per il training di un concorrente, non la ricchezza/forma dell'output (**nessuna eccezione de-minimis**); il carve-out riguarda *cosa* addestri (strumenti specializzati: classificatori/embedding), non il nostro LLM general-purpose. **OpenAI/Google** hanno lo stesso divieto. **DeepSeek è permissivo** (licenza R1 MIT: "distillation for training other LLMs" esplicito) → DSv4 come giudice OK (caveat: ToS API DeepSeek se hosted ≠ pesi scaricati). **Risoluzione**: **Claude FUORI dal training-loop** (coerente con la strategia commercial-clean — stesso motivo per cui evitiamo dati distillati-da-closed); il "council" resta valido con **membri open/permissivi** (DSv4 + es. Qwen2.5-72B / R1) + ancoraggio a reward verificabili + checklist/contract. Claude OK solo per **design/review fuori-dal-loop**. (Non consulenza legale → revisione legale pre-vendita.)
- **Follow-up (todo)**: concept dedicato `judge-design` (contract-schema + checklist pre&finali + **council OPEN**).

## D6 — Data-licensing / training set `[accepted, design in corso]`
- **Deciso**: adottare la **strategia 100% commercial-clean** (briefing Parte 3): R1-MIT + Qwen-open + human-annotated (HelpSteer/OASST/Aegis/Daring-Anteater) + execution-gym **ambienti** (non trajectory) + **RLVR**; niente token distillati da modelli closed; **provenance-manifest** obbligatorio; revisione legale pre-vendita.
- **Follow-up (todo)**: creare il **provenance-manifest** + il **design del training-set & curriculum** (con ricerca Nemotron) — in corso.

## Linked
- [[2026-06-28-open-decisions-briefing]] (il briefing che queste decisioni chiudono)
- [[../concepts/lora-initialization-strategy]] · [[../concepts/catastrophic-forgetting]] · [[../entities/dwarfstar4]] · [[../concepts/reward-hacking-mitigation]] · [[../sota-techniques-catalog]]
- `wiki/todo.md` (follow-up operativi)

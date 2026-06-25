---
name: user-notes-related-research
description: Letteratura correlata + idee derivative per i 9 concept user-notes 2026-05-21 (wrapper/reasoning/context). Mappa ogni concept a paper/tool 2024-2026 + propone estensioni e cross-pattern.
type: research
tags: [research, related-work, derivative-ideas, wrapper, reasoning, context, 2026]
sources:
  - arxiv.org (multiple)
  - github.com (multiple OSS)
  - bair.berkeley.edu
  - lmsys.org
  - aider.chat
  - anthropic.com / claude code docs
  - microsoft msrc / owasp
  - lakera.ai / palo alto unit 42
  - user notes 2026-05-21
last_updated: 2026-05-21
---

# Ricerca correlata + Idee derivative — User Notes 2026-05-21

Mappa di lavoro per i 9 concept formalizzati in [[_user-notes-index]]. Per ciascuno: 3-5 lavori 2024-2026 + 1-3 idee derivative concrete da testare. In coda, 5 cross-concept pattern emergenti.

> Convenzione: tutti i claim non triviali hanno URL. Se non ho trovato lavoro rilevante, dichiaro "no relevant work found". Idee derivative sono marcate come **idea da testare**, non verità.

---

## Per concept

### 1. structured-thinking

#### Letteratura correlata

- **Focused Chain-of-Thought (F-CoT)** — https://arxiv.org/abs/2511.22176 — separa estrazione informazione dal reasoning: organizza prima il "contesto essenziale" in formato strutturato, poi ragiona solo su quello. Riduce 2-3x i token rispetto a zero-shot CoT. **Prendere in prestito**: la separazione "estrai prima, ragiona dopo" è quasi identica alla nostra "scheda di contesto iniziale" + "tabelle di check dati". Loro lo fanno a runtime via prompting, noi vogliamo trainarlo.
- **TokenSkip (EMNLP 2025)** — https://github.com/hemingkx/TokenSkip e https://arxiv.org/abs/2502.12067 — LLM controllabile elimina token semanticamente ridondanti nel CoT. Su GSM-8K riduce 313→181 token con perdita <0.4% su Qwen2.5-14B con 40% trimming. **Prendere in prestito**: trainare il modello a un "compression ratio" target è una via per ottenere caveman thinking senza dover scrivere prompt rigidi.
- **Verification-First prompting** — https://arxiv.org/pdf/2511.21734 — chiedere al LLM di verificare una risposta proposta prima di rispondere è "quasi gratis" e migliora accuracy. Allineato perfettamente con il nostro "verifica pre-risposta". **Prendere in prestito**: il pattern di "verify-then-answer" come default invece di "answer-then-maybe-verify".
- **ReVISE** — https://arxiv.org/pdf/2502.14565 — self-verification + correction sequenziale via curriculum learning, con test-time scaling integrato. **Prendere in prestito**: il curriculum (semplice→complesso) per insegnare self-correction senza catastrofic forgetting.
- **Qwen3 thinking mode (`enable_thinking`)** — https://huggingface.co/Qwen/Qwen3-30B-A3B-Thinking-2507 e https://qwen.readthedocs.io/en/latest/getting_started/quickstart.html — il base che usiamo già emette `<think>...</think>` separato dalla risposta. Soft switch `/think`, `/no_think`. **Prendere in prestito**: usare lo stesso wrapping `<think>` come container del nostro "caveman thinking strutturato"; il modello già conosce questa convention.
- **Constitutional AI / self-critique in SLM** — https://arxiv.org/html/2503.17365v1 — efficacia del self-critique dipende da reasoning capability del base model. DeepSeek-R1 e Llama-3.1 traggono più beneficio di modelli più deboli. **Implicazione**: il nostro Tier 1 (Qwen3 FT) deve avere abbastanza reasoning per beneficiare del self-correction prima di stack-care.

#### Idee derivative

- **Idea 1 — "Scheda di contesto" come token-level structure trainata, non come prompt** (test-worthy). Definire 4 special tokens `<AIM>`, `<INPUT>`, `<VERIFY>`, `<OUT>` come parte di un mini-DSL. Pre-training del Tier 1 su corpus syntetico dove la scheda apre ogni thinking. Misurabile: ratio thinking/output, fluency, accuracy vs baseline su HumanEval. Connessione con F-CoT ma su tokenizer-level, non prompt-level.
- **Idea 2 — "Compression target" come parametro di chat template** (test-worthy). Estendere `enable_thinking` di Qwen3 con `thinking_compression_ratio` (0.3 = caveman, 1.0 = full prose). Pipeline TokenSkip-style fa drop di token marcati low-saliency. Permette al wrapper di chiedere "fai veloce" senza riprompting.
- **Idea 3 — Tabella check come tool-call invece che markdown** (test-worthy). Il modello emette `<verify_table>{...}</verify_table>` e il wrapper la valida (data presenti? almeno un `[?]`?) prima di permettere la risposta. Forza il pattern via grammar-constrained decoding (Outlines/Guidance). Pro: niente allucinazione di formato; contro: rigidità.

---

### 2. post-rl-path-optimization

#### Letteratura correlata

- **CODI (EMNLP 2025)** — https://arxiv.org/abs/2502.21074 e https://aclanthology.org/2025.emnlp-main.36.pdf — comprime CoT in spazio continuo via self-distillation in singolo stage. Teacher e student joint training. **Prendere in prestito**: pipeline self-distillation è quasi 1:1 con la nostra Forma B (token compression). CODI già implementato su modelli aperti.
- **Less is More Tokens (difficulty-aware CoT distillation)** — https://arxiv.org/html/2509.05226v1 — SFT cattura length/format, DPO preserva accuracy. La combinazione SFT+DPO con dati proporzionali alla difficoltà del problema riduce length mantenendo performance. **Prendere in prestito**: nostro post-RL deve essere SFT-su-thinking-compresso + DPO-per-mantenere-accuracy, non solo distillation pura.
- **Adaptive CoT Compression (R1-Compress, CoLaR, GoGI-Skip)** — https://arxiv.org/pdf/2509.14093 — riduzione 45-80% length con 1.6-2x speedup. Chunk-based: segmenta CoT e comprime locally. **Prendere in prestito**: il chunk-based mapping al nostro `<section>` è naturale. Path skipping = drop di chunk a basso reward.
- **Pause Tokens / Thinking Tokens** — https://arxiv.org/abs/2505.21024 e https://arxiv.org/html/2506.03616v1 — `<pause>` tokens aumentano l'espressività dei transformer constant-depth (provato teoricamente da AC⁰ a TC⁰). Models can learn dove inserire pause per "buy compute". **Prendere in prestito**: i nostri "template paths" `<PATH:check_install_dep>` possono essere implementati come pause-token learned: il modello li emette quando "sa già" cosa fare, e internamente espande la computazione senza emettere token visibili.
- **RadixAttention / SGLang HiCache** — https://www.lmsys.org/blog/2024-01-17-sglang/ e https://www.lmsys.org/blog/2025-09-10-sglang-hicache/ — KV cache reuse via radix tree. HiCache su backend hierarchical raggiunge cache hit 40%→80%, TTFT -56%, throughput 2x. **Prendere in prestito**: il wrapper può **prefiggere** thinking templates noti come prefix shared, beneficiando di RadixAttention senza modificare il modello.

#### Idee derivative

- **Idea 4 — Template path come "learnable pause tokens"** (test-worthy). Invece di token vocab speciali (richiede tokenizer change), trainare il modello a inserire `<expand:template_27/>` come single token sequence (3-4 BPE token) che il wrapper espande server-side prima del re-encode. Compute extra in latente, vocab invariato. Implementabile con SGLang regex stop + injection.
- **Idea 5 — "Chunk reward" per RL-then-compress** (test-worthy). Durante RL training salva trajectories chunk-by-chunk (sezioni del thinking strutturato). Reward per-chunk = (reward globale × contributo informativo del chunk, misurato via leave-one-out o saliency). Distill su chunk high-value, droppa chunk low-value. Allineato con CoLaR/R1-Compress.
- **Idea 6 — Tier 2/3 come "compression specialists" di Tier 1** (test-worthy). Cambia il framing: Tier 2/3 non sono solo programming/stack experts, ma anche **compressori dei path Tier 1** per task del loro dominio. Training pipeline: Tier 1 risolve task lungo, Tier 2 impara la versione 5x più corta con stesso output. Connette three-tier con post-RL optimization.

---

### 3. error-memo-system

#### Letteratura correlata

- **Voyager** — https://arxiv.org/abs/2305.16291 — skill library iterativa con embedding index, GPT-4 genera skill, self-verification prima di add. Top-5 retrieved per nuovo task. **Prendere in prestito**: il pattern "embed→retrieve top-K→inject" è esattamente il nostro recupero memo. Voyager è il riferimento canonico anche se 2023.
- **Mem0 / Letta (ex MemGPT)** — https://tokenmix.ai/blog/ai-agent-memory-mem0-vs-letta-vs-memgpt-2026 e https://www.letta.com/blog/letta-v1-agent — Mem0: extraction/compression automatica trasparente; Letta: memoria come state editabile via tool call dall'agent. **Prendere in prestito**: Letta tratta memoria come asset di prima classe gestita dal modello via tool call → allineato col nostro `<memory>` come sezione del context strutturato.
- **mem-agent (RL-trained memory)** — https://huggingface.co/blog/driaforall/mem-agent-blog — agent piccolo specializzato per memoria, addestrato via RL per decidere cosa salvare/recuperare. **Prendere in prestito**: avere un "memory micro-agent" RL-trained nel wrapper è un'opzione vs lettera fissa di euristiche.
- **Awesome Memory for Agents** — https://github.com/TsinghuaC3I/Awesome-Memory-for-Agents — survey/collection di paper. Riferimento per coverage del field.
- **Memory for Autonomous LLM Agents (survey 2026)** — https://arxiv.org/html/2603.07670v1 — survey con tassonomia meccanismi/eval/frontier. Riferimento landscape.

#### Idee derivative

- **Idea 7 — "Memo a due livelli" con learned generalization** (test-worthy). I memo utente sono già 2-livelli (generic+examples) ma la generalizzazione è fatta dall'agent nel post-mortem. Idea: trainare un mini-modello (Qwen3-0.6B?) specializzato su "esempi → lezione astratta" usando trajectories raccolte. Riduce errori di sovra-generalizzazione (memo troppo specifico) o sotto-generalizzazione (troppo generico per essere utile).
- **Idea 8 — "Memo retrieval triggered da pre-flight check"** (test-worthy). Non recuperare top-K memo all'inizio dello step, ma **al momento del pre-flight check** (vedi [[pre-flight-safety-checks]]). Se sto per overwrite un file → recupera memo su "overwrite errors". Riduce token in `<memory>` quando non rilevanti, alza recall quando lo sono.
- **Idea 9 — "Anti-memo" per pattern errati di compressione** (test-worthy). Connessione con [[post-rl-path-optimization]]: quando `template_27` fa false positive → registra anti-memo "non applicare template_27 quando vedi condition X". Anti-memo come negative example nel retrieval. Riduce template misfires.

---

### 4. structured-context-sections

#### Letteratura correlata

- **Anthropic XML tags guide** — https://docs.anthropic.com/claude/docs/use-xml-tags — guida ufficiale, baseline del nostro schema. Tutti i Claude model trained on XML structure.
- **Claude Code system prompt (reverse-engineered)** — https://github.com/Piebald-AI/claude-code-system-prompts — repo che colleziona system prompt + subagent prompt. Mostra come Anthropic struttura il context (planning, exploration, task). **Prendere in prestito**: la separazione plan/explore/task è un raffinamento di `<current_state>`+`<state_queue>`.
- **Claude Code subagent pattern** — https://code.claude.com/docs/en/sub-agents e https://www.infoq.com/news/2025/08/claude-code-subagents/ — subagent con context window proprio, system prompt custom, tool isolation. Permette modular reasoning con context ad-hoc. **Connessione diretta** con [[task-decomposition-adhoc-context]].
- **LangGraph state management** — https://medium.com/data-science-collective/architecting-human-in-the-loop-agents-interrupts-persistence-and-state-management-in-langgraph-fa36c9663d6f — state graph con checkpointing, interrupt, persistence. Pattern produzione. **Prendere in prestito**: il loro `state` (TypedDict) come modello pratico per il nostro `<context>` serializzato.
- **CodeAct (ICML 2024)** — https://arxiv.org/abs/2402.01030 e https://github.com/xingyaoww/code-act — emettere Python invece di JSON tool calls. ~30% step in meno, +20pp success su task complessi M3 ToolEval. **Implicazione per noi**: gli `<asset>` con `hard_limit` machine-readable potrebbero essere oggetti Python live invece che XML statico, accedibili dal modello via codice.

#### Idee derivative

- **Idea 10 — "Context API" callable dal modello** (test-worthy). Invece di rispedire l'intero `<context>` ad ogni turn, esporre operazioni: `ctx.add_asset(...)`, `ctx.update_state(step_id, 'DONE')`, `ctx.query_memory(query)`. Allinea con CodeAct e Letta. Pro: token efficient, audit-friendly. Contro: modello deve imparare l'API.
- **Idea 11 — "Hard limits" come constraint per grammar-constrained decoding** (test-worthy). Compilare hard_limit di `<assets>` in regex/CFG che vincola il decoder a non emettere comandi vietati. Es. asset con `no_drop` → vieta token sequence `DROP TABLE users`. Usa Outlines/Guidance/SGLang `xgrammar`. Failsafe deterministico oltre training.
- **Idea 12 — Format adattivo XML/YAML/JSON per sezione** (test-worthy). Non tutto il context deve essere XML. `<aim>` umano (XML), `<assets>` machine-readable (JSON con schema), `<pending_verifications>` tabella markdown, `<memory>` YAML. Modello impara associazione tag→format. Ottimizza parsing wrapper-side e leggibilità modello.

---

### 5. external-update-injection

#### Letteratura correlata

- **LangGraph interrupts (v1.2+)** — https://www.abstractalgorithms.dev/langgraph-human-in-the-loop e https://deepwiki.com/langchain-ai/langgraph/3.7-human-in-the-loop-and-interrupts — graph-level interrupts (halt at predefined nodes) + node-level (dynamic mid-execution). `interrupt()` funzione async stile `input()`. v1.2 ha content-block-aware streaming. **Prendere in prestito**: API `Command(resume=value)` è il pattern produzione per il nostro injection. Riusare LangGraph come baseline wrapper.
- **AutoGen async / human-in-loop** — https://www.zenml.io/blog/langgraph-vs-autogen — AutoGen suitable per short interventions, monitoring attivo. Pattern diverso da LangGraph (event-driven vs graph-state).
- **SGLang streaming + RadixAttention** — https://www.lmsys.org/blog/2024-01-17-sglang/ — streaming inference con prefix sharing. **Prendere in prestito**: streaming pause→inject→resume è supportato a livello di serving. Possibile pause su `</section>` close token e inject KV-aligned.
- **No relevant work found** su "structured update injection mid-thinking" come pattern formalizzato — è un gap che il nostro lavoro può colmare.

#### Idee derivative

- **Idea 13 — "Update budget" per evitare ping-pong** (test-worthy). Wrapper assegna budget di N injection per turn. Se exceeded, queueing fino fine sezione successiva o fine thinking. Evita interruption thrashing. Trainable: il modello impara a chiedere "any updates?" su sezione close.
- **Idea 14 — "Update preview" come sub-section opzionale** (test-worthy). Prima di inject hard, wrapper emette `<update_preview>` low-priority che il modello può "rifiutare" (continuare thinking) o "accettare" (richiede full injection alla section close). Riduce false-positive interrupt.
- **Idea 15 — Training adversarial su injection** (test-worthy). Dataset con injection: critical (deve adattarsi), high (può adattarsi), normal (defer), e injection-attack (untrusted disguised as update). Il modello deve emettere `<update_handling>` corretto. Collega con [[untrusted-content-delimiting]].

---

### 6. untrusted-content-delimiting

#### Letteratura correlata

- **Spotlighting (Microsoft / CEUR)** — https://ceur-ws.org/Vol-3920/paper03.pdf — 3 varianti: delimiting, datamarking (insert mark token tra ogni token del content), encoding (base64/ROT13). Riduce significativamente attack success rate con minimo impatto utility. **Prendere in prestito**: datamarking è più robusto del nostro UUID-marker per content lunghi; encoding (base64) preview per content molto rischioso.
- **StruQ (USENIX Security 2025)** — https://arxiv.org/abs/2402.06363 e https://sizhe-chen.github.io/StruQ-Website/ — fine-tuning strategy: due canali (prompt + data), special token delimiter riservato. Attack success rate <2% con minimo impatto utility. **Prendere in prestito**: training adversarial con special token reserved è esattamente il nostro approccio. Codebase disponibile (https://github.com/sizhe-chen/struq).
- **SecAlign (Berkeley BAIR)** — https://bair.berkeley.edu/blog/2025/04/11/prompt-injection-defense/ — preference optimization per defense. Evoluzione di StruQ via DPO. **Prendere in prestito**: aggiungere DPO loss che penalizza "follow inject instruction" e premia "treat as data".
- **OWASP LLM01:2025** — https://genai.owasp.org/llmrisk/llm01-prompt-injection/ — top entry OWASP Top 10 GenAI. Threat model standard. Riferimento per checklist.
- **Microsoft indirect prompt injection defenses** — https://www.microsoft.com/en-us/msrc/blog/2025/07/how-microsoft-defends-against-indirect-prompt-injection-attacks — overview difese produzione 2025.
- **Indirect injection in the wild (Palo Alto Unit 42)** — https://unit42.paloaltonetworks.com/ai-agent-prompt-injection/ — empirical study su prompt injection trovati in real web content. Utile per costruire red-team dataset.

#### Idee derivative

- **Idea 16 — "Datamarking" combinato con UUID-marker** (test-worthy). Wrapper inserisce mark token (es. `‡`) ogni N token nel content untrusted, plus UUID-marker end-sandbox. Doppio segnale di untrust: per-token (datamarking) + boundary (UUID). Più costoso ma più robusto di solo UUID.
- **Idea 17 — Adversarial dataset auto-generato durante uso** (test-worthy). Quando il wrapper rileva un tentativo di injection in un fetch real → registra come esempio adversarial nel training set. Self-improving defense. Connessione con [[error-memo-system]] (anti-pattern memo).
- **Idea 18 — "Untrusted level" graduato** (test-worthy). Non binario trusted/untrusted, ma 0-5: 0 = wrapper-generated (trusted), 1 = user typed, 2 = file in tuo repo versionato, 3 = file in repo non versionato/3rd party, 4 = web search, 5 = explicit attacker scenario. Trattamento gradato: livello 4-5 datamarking sempre; 2-3 only delimiter; 0-1 nessun marker. Mappa diretta al nostro `<asset>` mutability.

---

### 7. task-decomposition-adhoc-context

#### Letteratura correlata

- **Plan-and-Execute / Plan-and-Solve** — https://agent-patterns.readthedocs.io/en/stable/patterns/plan-and-solve.html — pattern produzione: prima genera plan multi-step, poi esegui sequenzialmente. **Allineato** con il nostro plan-then-execute.
- **ADaPT (Archiki et al. 2024)** — https://arxiv.org/pdf/2311.05772 — decompone task solo quando l'executor fallisce uno step. Plan iniziale corto (3-5 step). **Prendere in prestito**: as-needed decomposition risparmia plan-overhead per task semplici. Threshold/heuristic per decidere quando decomporre.
- **LLM Compiler (Kim et al. 2024)** — referenced via https://www.wollenlabs.com/blog-posts/navigating-modern-llm-agent-architectures-multi-agents-plan-and-execute-rewoo-tree-of-thoughts-and-react — DAG di tool call, Task Fetching Unit, Executor parallelo. **Prendere in prestito**: DAG > linear queue per dipendenze esplicite. Permette parallel execution di step indipendenti.
- **Plan-and-Act** — https://arxiv.org/html/2503.09572v3 — improvement plan per long-horizon. Recente (2025). **Prendere in prestito**: re-planning periodico durante execution, non solo all'inizio.
- **Claude Code subagent / Task tool** — https://www.infoq.com/news/2025/08/claude-code-subagents/ e https://www.cloudzero.com/blog/claude-code-agents/ — subagent con context fresh per task. Dispatching automatico. **Connessione diretta** con la nostra "context ad-hoc per step".
- **Lost in the Middle (Liu 2024, TACL)** — https://aclanthology.org/2024.tacl-1.9/ — paper canonical. Recente conferma: anche context-length grande danneggia performance indipendentemente da retrieval quality (https://arxiv.org/pdf/2510.05381). **Implicazione**: ad-hoc context vince anche con modelli long-context.

#### Idee derivative

- **Idea 19 — DAG decomposition invece di queue lineare** (test-worthy). Plan emette `<plan>` con dipendenze esplicite tra step. Wrapper costruisce DAG, esegue parallel quando possibile, ad-hoc context per step include solo upstream completati. Vince su latency e attention quality.
- **Idea 20 — "Just-in-time decomposition"** (test-worthy, da ADaPT). Inizia con plan grossolano (2-3 macro-step). Solo quando il modello rileva difficoltà su un macro-step → richiede sub-decomposition al wrapper. Riduce planning overhead per task semplici.
- **Idea 21 — Context retrieval per step come learned skill** (test-worthy). Invece di euristiche wrapper-side (filter assets by step), trainare il modello a emettere `<context_request>` per ciascuno step nel plan: "step 5 needs asset X, memory entries matching Y, last 3 turns about Z". Wrapper esegue. Modello sa cosa serve > euristiche fisse.

---

### 8. contradiction-detection-layer

#### Letteratura correlata

- **SelfCheckGPT (NLI variant)** — https://arxiv.org/pdf/2303.08896 e https://ar5iv.labs.arxiv.org/html/2303.08896 — sample multiple risposte, NLI tra coppie per detect inconsistenza. NLI variant è best trade-off perf/compute. **Prendere in prestito**: NLI judge è una option per il nostro semantic check. Modello piccolo (DeBERTa-NLI).
- **Constitutional AI / self-critique** — https://mbrenndoerfer.com/writing/constitutional-ai-principle-based-alignment-through-self-critique e https://arxiv.org/html/2503.17365v1 — self-critique guidato da principi (constitution). **Prendere in prestito**: il nostro detector può essere encoded come "constitution" del modello, non layer esterno (alternativa a implementazione B).
- **CRITIC (Gou et al.)** — https://arxiv.org/pdf/2305.11738 e https://openreview.net/forum?id=Sx038qxjek — self-correction via tool-interactive critiquing. Tool esegue verifica, modello revisiona. **Prendere in prestito**: per factual contradiction usiamo tool (shell, git, pytest). CRITIC è il framework di riferimento.
- **Factuality combo (log-prob + NLI)** — sintetizzato da risultati search — combina internal certainty (log-prob margin) + NLI contradiction signal per confidence score robusto. **Prendere in prestito**: ensemble probabilistico per ridurre falsi positivi del detector.
- **Indirect Prompt Injection benchmarks (firewall vs prompt-defenses)** — https://arxiv.org/html/2510.05244v1 — il detector va valutato su benchmark adversarial, non solo coerenza interna naturale.
- **No relevant work found** su "structured-context contradiction detection" come layer separato. Anche qui, possibile contributo originale.

#### Idee derivative

- **Idea 22 — "Differential context check" tra section close** (test-worthy). Detector NLI piccolo (Qwen3-0.6B fine-tuned, o DeBERTa-NLI) confronta ogni nuova `</section>` con `<current_state>` + memo recenti. Solo flag se entailment contradicts > threshold. Asincrono per evitare latency hit.
- **Idea 23 — Cross-source priority resolution table** (test-worthy). Tabella esplicita di priority quando source conflicting: `git status` > `<current_state>` > `<memory>` > `<untrusted_zone>`. Detector emette resolution recommendation, non solo flag. Riduce deadlock di risoluzione.
- **Idea 24 — Contradiction → memo auto-trigger** (test-worthy). Ogni contraddizione `high` o `critical` risolta → genera memo automatico (vedi [[error-memo-system]]). Pattern emergent nei memo informa future detector tuning (which contradiction types matter for this user).

---

### 9. pre-flight-safety-checks

#### Letteratura correlata

- **Aider git-first workflow** — https://aider.chat/docs/git.html e https://aider.chat/docs/usage/lint-test.html — auto-commit con descriptive message, separates user vs AI commits, auto-test post-edit con `--test-cmd`+`--auto-test`. Pre-commit conditional. **Prendere in prestito**: pattern git-first è production-ready. Aider non chiede conferma ma garantisce reversibility via git.
- **OpenHands sandbox runtime** — https://github.com/All-Hands-AI/OpenHands e https://arxiv.org/pdf/2407.16741 — actions eseguite in Docker container isolato. `CmdRunAction`, `FileWriteAction`, `IPythonRunCellAction`. **Prendere in prestito**: isolation tramite container è hard limit "by construction". Pre-flight check è meno necessario se sandbox totale.
- **SWE-MiniSandbox** — https://arxiv.org/pdf/2602.11210 — sandbox container-free per scalabilità (mount namespace + chroot). **Prendere in prestito**: per uso desktop user (non massiccio), namespace isolation è leggera vs Docker.
- **OpenHands V1 Agent SDK** — https://arxiv.org/html/2511.03690v2 — V1 aligned con MCP. Opt-in sandboxing. **Prendere in prestito**: opt-in granulare (sandbox per action types, non per agent intero).
- **"Safe ways to let your coding agent work autonomously"** — https://ericmjl.github.io/blog/2025/11/8/safe-ways-to-let-your-coding-agent-work-autonomously/ — practitioner guide 2025: git branch per task, test runner, review gate. Pattern human-supervised.
- **Modal sandbox per OpenHands** — https://modal.com/resources/best-sandbox-openhands — cloud sandbox infrastructure pattern.

#### Idee derivative

- **Idea 25 — "Reversibility score" per ogni action** (test-worthy). Pre-flight calcola score 0-1: 1 = totalmente reversibile (git tracked + recent commit), 0 = totalmente irreversibile (rm -rf su gitignored). Threshold parametrizzabile dall'utente (`min_reversibility_score=0.7`). Cambia trust level dinamicamente per task.
- **Idea 26 — Auto-snapshot per directory non-git** (test-worthy). Quando l'agent tocca un asset non versionato → wrapper crea snapshot (rsync/btrfs/zfs) prima di procedere. Niente backup esplicito richiesto dall'utente. Restore via `agent restore --task-id X`. Riduce friction "vuoi backup?" prompt.
- **Idea 27 — Hard limit come grammar constraint (cross-link Idea 11)** (test-worthy). Compilare hard_limit in grammar che vincola decoder. `rm -rf` su asset con `no_delete` semplicemente non può essere tokenizzato. Deterministic, non probabilistic. Combina con runtime check per defense-in-depth.

---

## Cross-concept patterns

Pattern emergenti dall'insieme dei 9 concept. Massimo 5, niente fluff.

### Pattern α — Knowledge Graph Runtime

**Cosa**: unificare `<assets>` + `<interconnections>` + `<memory>` + `<untrusted_zone>` in un **grafo di conoscenza versionato** mantenuto dal wrapper, dove ogni nodo ha trust_level, mutability, hard_limit, e edge dichiarano dipendenze esplicite (`uses`, `derives_from`, `contradicts`, `replaces`).

**Perché interessante**: oggi le sezioni sono testo XML statico. Un grafo permette:
- Query del modello via "Context API" (vedi Idea 10)
- Propagazione automatica di trust (asset deriva da untrusted → trust ridotto)
- Detection di contraddizioni come edge `contradicts` (vedi [[contradiction-detection-layer]] tipi 4-5)
- Memory retrieval = traversal grafo, non vector search piatto

**Come implementare**: in-memory graph (networkx o RDF lightweight tipo rdflib). Serializzazione XML per il modello. Tool call: `graph.query(...)`, `graph.add_edge(...)`. Pattern allineato con Letta (state editabile) + Voyager (skill graph).

---

### Pattern β — Self-Supervision Loop chiuso

**Cosa**: error-memo + contradiction-detection + post-rl-optimization formano un **loop di self-improvement chiuso**, dove:
1. Contradiction detection flagga errore in `<thinking>` o output
2. Errore → post-mortem → memo (lezione generica + esempio)
3. Memo accumulati → mining di pattern errati (anti-template)
4. Anti-template informa post-RL: drop di path che frequentemente sbagliano
5. Path validati → diventano template positivi (impratichimento)

**Perché interessante**: oggi i 3 concept sono separati. Il loop chiuso trasforma il wrapper in un **runtime di apprendimento continuo** senza retraining base model. Allineato con Voyager skill library + Reflexion memory + Letta editable state.

**Come implementare**: orchestrator nel wrapper esegue periodicamente (es. nightly) il mining su memo + trajectory log → genera dataset SFT/DPO incrementale → fine-tune LoRA (Tier 1) → swap. Skill `ml-peft` e `aris-experiment-bridge` supportano.

---

### Pattern γ — Context API (read/write callable dal modello)

**Cosa**: esporre il context come **API che il modello chiama**, non blob testuale che il modello legge. Operazioni: `ctx.get_aim()`, `ctx.list_assets(filter=...)`, `ctx.add_memo(...)`, `ctx.update_state(step_id, status)`, `ctx.query_memory(query)`, `ctx.check_hard_limit(action, asset)`. Stessa filosofia di CodeAct e Letta.

**Perché interessante**:
- Token efficient (no re-blast del context intero ogni turn)
- Audit-friendly (ogni read/write loggato)
- Permette context window infinito virtuale (lazy load)
- Direttamente compatibile con grammar constraint per hard_limit (vedi Idea 11+27)

**Come implementare**: Python ABI nel runtime sandbox (CodeAct-style). Il modello scrive code che usa `ctx.*`. Wrapper enforces ACL su `ctx.write_*` operations. Combinabile con MCP (Model Context Protocol) standard 2025.

---

### Pattern δ — Trust Gradient End-to-End

**Cosa**: oggi `untrusted-content-delimiting` definisce trust binario. Ma trust è gradiente che attraversa **tutto** il sistema: input sources (web/file/user) → assets (versioned/non) → memory entries (validated/raw) → memo (utente-confermato/auto-generato) → actions (reversible/irreversible). Un `trust_score` 0-1 propagato lungo `<interconnections>` cambia comportamento di pre-flight check, contradiction detection priority, e injection acceptance.

**Perché interessante**: unifica security (untrusted), safety (pre-flight), e correctness (contradiction) in un single dimension. Modello impara una sola politica ("alta cautela quando trust < 0.5") invece di N regole separate. Allineato con OWASP LLM01 + SecAlign approach.

**Come implementare**: ogni asset/memo/input ha `trust_score`. Propagazione: nuovo asset derivato da asset con score X → max(X, ...). Rules: action su asset trust>0.8 = no extra check; 0.5-0.8 = standard; <0.5 = ask user. Trainare il modello a leggere `trust_score` e modulare aggressività.

---

### Pattern ε — Section-Aligned KV Cache

**Cosa**: combinare `<section>` delimiters di structured-thinking con RadixAttention/SGLang. Ogni `<section name="X">` ha boundary fisso → wrapper può **fingerprint** sezioni (hash del content) e riusare KV cache per sezioni identiche tra task simili (es. la `<verify_table>` per "controllo se .env esiste" è identica in 200 task).

**Perché interessante**:
- Speed-up gratis senza modificare il modello
- Naturale ponte con [[post-rl-path-optimization]]: template path = section con KV cache hot
- Compatibile con external-update-injection (inject avviene SOLO tra section, quindi cache non invalidata mid-section)
- Esiste già infrastruttura (SGLang HiCache 2025)

**Come implementare**: serving con SGLang. Wrapper popola prefix cache con sezioni canoniche all'avvio. KV-cache reuse cross-task identico per le sezioni fisse del context strutturato (es. `<aim>` boilerplate, hard_limit declarations). Misurabile: TTFT, throughput, cache hit ratio.

---

## Sources

### Paper / arXiv

- Focused CoT — https://arxiv.org/abs/2511.22176
- TokenSkip — https://arxiv.org/abs/2502.12067, https://github.com/hemingkx/TokenSkip
- Verification-First — https://arxiv.org/pdf/2511.21734
- ReVISE — https://arxiv.org/pdf/2502.14565
- SSR (Socratic Self-Refine) — https://arxiv.org/html/2511.10621v1
- Reflect, Retry, Reward — https://arxiv.org/html/2505.24726v1
- CODI — https://arxiv.org/abs/2502.21074, https://aclanthology.org/2025.emnlp-main.36.pdf
- Less is More Tokens — https://arxiv.org/html/2509.05226v1
- Adaptive CoT Compression — https://arxiv.org/pdf/2509.14093
- Pause Tokens (expressivity) — https://arxiv.org/abs/2505.21024
- Learning to Insert [PAUSE] — https://arxiv.org/html/2506.03616v1
- Voyager — https://arxiv.org/abs/2305.16291
- Memory for Autonomous Agents survey — https://arxiv.org/html/2603.07670v1
- CodeAct — https://arxiv.org/abs/2402.01030
- StruQ — https://arxiv.org/abs/2402.06363, https://sizhe-chen.github.io/StruQ-Website/
- Spotlighting — https://ceur-ws.org/Vol-3920/paper03.pdf
- Lost in the Middle (TACL) — https://aclanthology.org/2024.tacl-1.9/
- Context Length Hurts (2510.05381) — https://arxiv.org/pdf/2510.05381
- ADaPT — https://arxiv.org/pdf/2311.05772
- Plan-and-Act — https://arxiv.org/html/2503.09572v3
- SelfCheckGPT — https://arxiv.org/pdf/2303.08896
- CRITIC — https://arxiv.org/pdf/2305.11738
- Constitutional AI in small LLMs — https://arxiv.org/html/2503.17365v1
- OpenHands — https://arxiv.org/pdf/2407.16741, V1 SDK https://arxiv.org/html/2511.03690v2
- SWE-MiniSandbox — https://arxiv.org/pdf/2602.11210
- Indirect Prompt Injection in the Wild — https://arxiv.org/html/2604.27202v1
- Firewalls vs benchmarks — https://arxiv.org/html/2510.05244v1

### Tool / OSS

- Qwen3 Thinking — https://huggingface.co/Qwen/Qwen3-30B-A3B-Thinking-2507
- Qwen docs — https://qwen.readthedocs.io/en/latest/getting_started/quickstart.html
- Claude Code system prompts — https://github.com/Piebald-AI/claude-code-system-prompts
- Claude Code subagents — https://code.claude.com/docs/en/sub-agents
- Voyager repo — https://github.com/MineDojo/Voyager
- Awesome Memory for Agents — https://github.com/TsinghuaC3I/Awesome-Memory-for-Agents
- Mem0/Letta/MemGPT comparison — https://tokenmix.ai/blog/ai-agent-memory-mem0-vs-letta-vs-memgpt-2026
- Letta v1 agent — https://www.letta.com/blog/letta-v1-agent
- mem-agent — https://huggingface.co/blog/driaforall/mem-agent-blog
- Aider git/lint/test — https://aider.chat/docs/git.html, https://aider.chat/docs/usage/lint-test.html
- StruQ code — https://github.com/sizhe-chen/struq
- CodeAct repo — https://github.com/xingyaoww/code-act
- LangGraph HIL — https://deepwiki.com/langchain-ai/langgraph/3.7-human-in-the-loop-and-interrupts

### Blog / industry

- SGLang/RadixAttention — https://www.lmsys.org/blog/2024-01-17-sglang/
- SGLang HiCache — https://www.lmsys.org/blog/2025-09-10-sglang-hicache/
- SecAlign (BAIR) — https://bair.berkeley.edu/blog/2025/04/11/prompt-injection-defense/
- Microsoft MSRC indirect injection — https://www.microsoft.com/en-us/msrc/blog/2025/07/how-microsoft-defends-against-indirect-prompt-injection-attacks
- OWASP LLM01:2025 — https://genai.owasp.org/llmrisk/llm01-prompt-injection/
- Unit42 prompt injection in wild — https://unit42.paloaltonetworks.com/ai-agent-prompt-injection/
- Lakera indirect injection — https://www.lakera.ai/blog/indirect-prompt-injection
- Eric Ma safe autonomous agent — https://ericmjl.github.io/blog/2025/11/8/safe-ways-to-let-your-coding-agent-work-autonomously/
- Claude Code subagents (InfoQ) — https://www.infoq.com/news/2025/08/claude-code-subagents/
- CloudZero Claude Code Agents 2026 — https://www.cloudzero.com/blog/claude-code-agents/
- LangGraph HIL pattern — https://www.abstractalgorithms.dev/langgraph-human-in-the-loop
- Anthropic building agents w/ SDK — https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk

---

## Open questions (per follow-up)

1. **Implementation cost** dei Pattern α (Knowledge Graph) e γ (Context API): MVP minimo per validare > stack pieno. Quale validare per primo?
2. **Special token vocab**: introdurre `<expand:>` / `<section>` / `[V]/[A]/[?]` come token nuovi (richiede tokenizer extension) o leave-as-is (modello impara come pattern)?
3. **Training corpus**: serve dataset specifico per ognuno dei 9 concept. Sintetico (teacher Claude/GPT) vs mining da Claude Code transcripts pubblici vs human-curated. Sprint successivo: design corpus.
4. **Benchmark wrapper-aware**: i benchmark esistenti (SWE-Bench, HumanEval) testano modello standalone. Custom benchmark che misura il valore del wrapper structured è un need esplicito.
5. **Compatibilità con MoE / Qwen3.6-35B-A3B**: tutti i pattern descritti sopra sono valutati su dense models. Verifica esplicita necessaria.

---

## Storia

- **2026-05-21**: prima research sweep dopo formalizzazione dei 9 concept. Output: 27 idee derivative + 5 cross-concept pattern. Next: prioritizzare 3-5 pattern per design experiment.

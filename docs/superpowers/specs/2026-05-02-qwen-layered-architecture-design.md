# Qwen Layered Architecture - Design Document

**Date**: 2026-05-02
**Project**: Fine-Tuning Qwen 3.5 9B con Architettura Modulare a Livelli

---

## Executive Summary

Architettura modulare per un LLM piccolo (Qwen 3.5 9B) in cui un modello base specializzato nell'organizzazione delega a layer adattivi (LoRA) verticalmente specializzati su domini specifici (coding, framework, ecc.). L'approccio utilizza tecnologie provate (LoRA, QLoRA, routing) ma combina architetture non ancora integrate in questa specifica configurazione.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Analysis](#component-analysis)
3. [Technology Stack](#technology-stack)
4. [Training Strategy](#training-strategy)
5. [Dataset Requirements](#dataset-requirements)
6. [Hardware Requirements](#hardware-requirements)
7. [Performance Targets](#performance-targets)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Risk Analysis](#risk-analysis)
10. [Alternative Approaches](#alternative-approaches)
11. [References](#references)

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                                                   │
│  Qwen 3.5 9B Base Model (Fine-tuned)          │
│  ───────────────────────────────────────────────── │
│  Orchestrator Layer                             │
│  • Task planning & organization              │
│  • High-level reasoning                      │
│  • Delegation to specialists                 │
│                                                   │
└─────────────────────────────────────────────────────────┘
                    │
                    ├──> LoRA Programming Generic
                    │     └─ Programming mindset
                    │     └─ Multi-repo understanding
                    │     └─ Routing to verticals
                    │
                    ├──> LoRA Vertical Stack (one at a time)
                    │     ├──> LoRA React/Frontend
                    │     ├──> LoRA Python/Backend
                    │     ├──> LoRA Database
                    │     └──> LoRA [Additional Stack]
                    │
                    └──> LoRA [Future Domains]
                          (AI/ML, DevOps, Security, etc.)
```

### Layer Responsibilities

| Layer | Primary Role | Secondary Role | Activation |
|--------|--------------|----------------|-----------|
| **Orchestrator** | Task planning, organization, high-level reasoning | Uses Qwen base knowledge of frameworks | Always active |
| **Programming Generic** | Understands coding tasks at depth | Routes to appropriate vertical LoRA | Active for coding tasks |
| **Vertical Stack** | Implements stack-specific code | N/A | One active at a time |

### Data Flow Example

```
User: "Crea un componente React per gestire utenti"
  ↓
[Orchestrator] Analizza task → Capisce che serve UI/Backend
  ↓
[Orchestrator] Attiva Programming Generic LoRA
  ↓
[Programming] Analizza stack necessario → React (frontend) + Database
  ↓
[Programming] Attiva LoRA React + LoRA Database
  ↓
[React LoRA] Genera componente React
[Database LoRA] Genera query/ schema SQL
  ↓
[Orchestrator] Assembla output → Risposta finale
```

---

## Component Analysis

### 1. Orchestrator (Base Model)

**Implementation**: Full fine-tuning of Qwen 3.5 9B

**Responsibilities**:
- Task decomposition and planning
- High-level reasoning and decision making
- Delegation to specialized layers
- Cross-layer coordination
- Quality assurance and error handling

**Training Data Needed**:
- Planning and organization examples
- Task delegation patterns
- Multi-step reasoning chains
- Coordination across domains

**Success Criteria**:
- Correctly identifies task type (coding vs non-coding)
- Breaks down complex tasks appropriately
- Selects correct specialist layers
- Maintains coherence across delegated sub-tasks

---

### 2. Programming Generic LoRA

**Implementation**: QLoRA or standard LoRA (rank TBD based on experiments)

**Responsibilities**:
- Deep understanding of programming tasks
- Multi-repo architecture comprehension
- Technology stack identification
- Routing decisions to vertical layers
- Code quality assessment

**Training Data Needed**:
- Programming task understanding
- Multi-repo project patterns
- Stack selection examples
- Code review and quality assessment

**Success Criteria**:
- Correctly identifies required technologies
- Makes appropriate routing decisions
- Understands cross-repo dependencies
- Produces accurate code-related guidance

---

### 3. Vertical Stack LoRAs

Each vertical LoRA is independently fine-tuned on (Orchestrator + Programming Generic).

**Examples**:
- **React LoRA**: React, Redux, TypeScript, hooks, patterns
- **Python LoRA**: Python, asyncio, Django/FastAPI, data structures
- **Database LoRA**: SQL, PostgreSQL, MongoDB, query optimization
- **[Future]**: Flutter, DevOps, Security, AI/ML domains

**Responsibilities**:
- Stack-specific code generation
- Framework best practices
- Language-specific patterns
- Integration with ecosystem tools

**Training Data Needed**:
- Stack-specific code examples
- Framework patterns and conventions
- Common use cases and edge cases
- Integration examples with other tools

**Success Criteria**:
- Generates idiomatic code for the stack
- Follows framework best practices
- Handles common edge cases correctly
- Efficient and performant solutions

---

## Technology Stack

### Core Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Base Model** | Qwen 3.5 9B | Pre-trained foundation |
| **Orchestrator Training** | Full fine-tuning | QLoRA (4-bit) or standard LoRA |
| **LoRA Framework** | PEFT (Hugging Face) | Adapter management |
| **Inference** | vLLM / Transformers | Model serving |
| **Quantization** | bitsandbytes | Memory optimization |

### Recommended Training Pipeline

```
┌─────────────────────────────────────────────────┐
│                                                   │
│  Training Pipeline                                 │
│                                                   │
│  1. Dataset Preparation                        │
│  2. Orchestrator Fine-tune                   │
│  3. Programming Generic LoRA Training            │
│  4. Vertical Stack LoRA Training (per stack)      │
│  5. Integration Testing                         │
│  6. RLHF / Post-training (optional)           │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## Training Strategy

### Phase 1: Orchestrator Training

**Approach**: Curriculum Learning

1. **Foundation** (Stage 1): Basic planning and organization
   - Task decomposition
   - Simple delegation patterns
   - Single-step reasoning

2. **Intermediate** (Stage 2): Multi-domain coordination
   - Cross-domain task understanding
   - Complex delegation scenarios
   - Multi-step reasoning chains

3. **Advanced** (Stage 3): Sophisticated orchestration
   - Ambiguous task handling
   - Error recovery and fallback
   - Meta-cognition (knowing when to ask for clarification)

**Method**: QLoRA with 4-bit quantization for memory efficiency
**Rank**: Start with 64, scale to 128 if needed
**Epochs**: 3-5 with early stopping based on validation

### Phase 2: Programming Generic LoRA

**Approach**: Instruction Fine-tuning

**Dataset Structure**:
```json
{
  "input": "Create a React component for user management",
  "reasoning": "This is a frontend task requiring React, state management, and backend integration",
  "routing": "activate_react_lora",
  "code_guidance": "Component structure, hooks, API integration"
}
```

**Training Method**: QLoRA (4-bit)
**Rank**: 64-128
**Learning Rate**: 2e-4 to 5e-5 (lower for QLoRA)

### Phase 3: Vertical Stack LoRAs

**Approach**: Domain-Specific Fine-tuning

Each vertical LoRA trained on (Orchestrator + Programming Generic) to ensure compatibility.

**Training Order** (Recommended):
1. React LoRA (highest priority stack)
2. Python/Backend LoRA
3. Database LoRA
4. Additional stacks as needed

**Training Method**: QLoRA or LoRA (rank depends on complexity)
**Rank**: 32-64 per vertical (specialized domains need less capacity)

---

## Dataset Requirements

### Dataset Quantities (Per Layer)

| Layer | Minimum | Recommended | Target |
|--------|---------|------------|--------|
| **Orchestrator** | 50K examples | 200K examples | 500K examples |
| **Programming Generic** | 10K examples | 50K examples | 100K examples |
| **Vertical (per stack)** | 5K examples | 20K examples | 50K examples |

### Dataset Quality Requirements

- **High-quality synthetic data** from code repositories
- **Curated examples** with verified solutions
- **Diverse scenarios** covering edge cases
- **Multi-turn conversations** for reasoning tasks

### Recommended Data Sources

1. **Code repositories**: GitHub, GitLab (with careful filtering)
2. **Documentation**: Framework docs, best practices
3. **Stack Overflow/Code Quality**: Questions and answers
4. **Synthetic generation**: Using larger models to generate and verify

---

## Hardware Requirements

### Training Requirements

| Layer | GPU Memory | Compute Time | Notes |
|--------|------------|--------------|-------|
| **Orchestrator** | 24GB VRAM | 6-12 hours | QLoRA 4-bit |
| **Programming LoRA** | 16GB VRAM | 2-6 hours | On trained model |
| **Vertical LoRA** | 12-16GB VRAM | 1-4 hours each | Depends on rank |

### Minimum Recommended Hardware

- **GPU**: RTX 3090 24GB or equivalent
- **RAM**: 64GB system RAM
- **Storage**: 200GB SSD for datasets and checkpoints

### Inference Requirements

| Configuration | VRAM | Notes |
|-------------|-------|-------|
| **Orchestrator only** | 8GB | Base model |
| **+ Programming LoRA** | 12GB | +1 adapter |
| **+ Vertical LoRA** | 14-16GB | +1-2 adapters |

---

## Performance Targets

### Inference Performance

| Metric | Target | Notes |
|--------|--------|-------|
| **Latency (single layer)** | < 500ms | Time to first token |
| **Throughput** | > 50 tokens/sec | Depends on hardware |
| **Memory (max layers)** | < 16GB | With quantization |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|------------|
| **Code accuracy** | > 80% | Syntactically correct, follows patterns |
| **Code quality** | > 70% | Idiomatic, best practices |
| **Task completion** | > 75% | Completes assigned sub-tasks correctly |
| **Reasoning quality** | Qualitative | Sound logical steps, correct delegation |

### Benchmark Targets

- **HumanEval**: +10% over base Qwen 3.5 9B
- **MBPP**: Competitive with models of similar size
- **Custom benchmarks**: Task-specific scenarios for each vertical

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Objective**: Establish training infrastructure and base capabilities

1. Setup training environment (PyTorch, PEFT, Transformers)
2. Collect and prepare initial datasets
3. Train Orchestrator base model (Stage 1 only)
4. Basic integration testing

**Milestone**: Orchestrator can plan simple tasks

---

### Phase 2: Programming Layer (Weeks 5-8)

**Objective**: Add programming understanding and routing

1. Prepare programming-specific dataset
2. Train Programming Generic LoRA
3. Implement dynamic LoRA loading
4. Test multi-layer inference

**Milestone**: System can handle coding tasks end-to-end

---

### Phase 3: First Vertical (Weeks 9-12)

**Objective**: Add first vertical stack (React)

1. Prepare React-specific dataset
2. Train React LoRA
3. Integration testing with Orchestrator + Programming
4. Performance optimization

**Milestone**: System produces production-quality React code

---

### Phase 4: Additional Verticals (Weeks 13-20)

**Objective**: Expand to other stacks

1. Python/Backend LoRA
2. Database LoRA
3. Additional stacks as prioritized
4. Cross-stack integration testing

**Milestone**: Multi-stack capability with routing

---

### Phase 5: RLHF / Post-training (Weeks 21-24)

**Objective**: Optional: Reinforcement Learning from Human Feedback

1. Design RLHF system
2. Collect human feedback
3. Reward model training
4. Evaluation and iteration

**Milestone**: Improved performance from human preferences

---

## Risk Analysis

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|-------|-------------|--------|-----------|
| **Layer conflict** | Medium | High | Careful training, validation |
| **LoRA overloading** | Medium | Medium | Rank optimization, selective activation |
| **Catastrophic forgetting** | Low | High | Regular evaluation checkpoints |
| **Integration complexity** | High | High | Incremental testing, fallback mechanisms |

### Project Risks

| Risk | Probability | Impact | Mitigation |
|-------|-------------|--------|-----------|
| **Dataset quality** | High | High | Careful curation, synthetic validation |
| **Training time** | Medium | Medium | QLoRA, early stopping |
| **Hardware limits** | Medium | Medium | Cloud resources, quantization |
| **Scope creep** | Medium | High | Clear MVP definition, iterative delivery |

---

## Alternative Approaches

### Approach A: External Routing (Simpler, More Control)

```
Task → Python Router (if/else logic)
        ├─> "Is React?" → Load React LoRA
        ├─> "Is Python?" → Load Python LoRA
        └─> "Is generic?" → Use base only

Base model remains passive, routing is external code
```

**Pros**:
- Complete control over routing logic
- Easy to debug and modify
- No training complexity for routing

**Cons**:
- Not "neural" routing
- Breaks end-to-end learning paradigm
- Less flexible for ambiguous cases

### Approach B: MoE Integration (More Complex, More Powerful)

```
Base Qwen with Mixture of Experts
    ├──> Expert: Orchestrator
    ├──> Expert: Programming
    ├──> Expert: React
    ├──> Expert: Python
    └──> Expert: [Additional]

Router activates one or multiple experts per token
```

**Pros**:
- Proven architecture (Switch Transformers)
- Automatic load balancing
- True multi-expert capability

**Cons**:
- Complex training (load balancing, expert routing)
- Requires significant compute
- More complex implementation

### Approach C: Curriculum Learning Approach (Recommended for MVP)

```
Stage 1: Simple planner (orchestration only)
Stage 2: Add programming understanding
Stage 3: Add one vertical stack
Stage 4: Add additional verticals
Stage 5: RLHF / post-training
```

**Pros**:
- Each stage is validated before moving on
- Reduced risk of catastrophic failure
- Clear progress measurement
- Can pivot if approach doesn't work

**Cons**:
- Longer initial development time
- May require re-training at each stage
- Less ambitious initial target

---

## Success Criteria

### Phase 1 Success

- [ ] Orchestrator can decompose simple tasks into sub-tasks
- [ ] Orchestrator can identify task type correctly (> 90%)
- [ ] Orchestrator produces coherent plans for multi-step tasks

### Phase 2 Success

- [ ] Programming LoRA correctly identifies required technologies
- [ ] Multi-layer inference works without errors
- [ ] Code-related responses show understanding of best practices

### Phase 3 Success

- [ ] One vertical stack produces production-quality code
- [ ] Performance comparable or better than base model
- [ ] User can complete end-to-end coding task successfully

### Overall Success

- [ ] System handles diverse tasks (coding + non-coding)
- [ ] Multiple vertical stacks are available and functional
- [ ] Performance benchmarks meet or exceed targets
- [ ] System is deployable and maintainable

---

## Open Questions

1. **Hardware**: What GPU configuration is available for training?
2. **Priorities**: Which vertical stacks should be prioritized first?
3. **Datasets**: Are specific datasets already available, or should we generate them?
4. **Evaluation**: How should we measure success? (Human eval, automated benchmarks, both?)
5. **Deployment**: Target deployment environment? (Local inference, API service, edge deployment?)

---

## Next Steps

1. Review and approve this design document
2. Select primary approach (A, B, or C)
3. Create detailed implementation plan
4. Begin Phase 1 execution
5. Establish metrics and monitoring

---

## Appendix: Technology Quick Reference

### LoRA Parameters

| Parameter | Description | Typical Value |
|-----------|-------------|--------------|
| **Rank (r)** | LoRA rank (number of trainable dimensions) | 8-256 |
| **Alpha (α)** | LoRA scaling factor | 8-64 |
| **Target modules** | Which transformer layers get LoRA | `q_proj`, `k_proj`, `v_proj`, `o_proj` |
| **Dropout** | LoRA dropout for regularization | 0.05-0.1 |

### QLoRA Benefits

- 4-bit quantization reduces memory by ~4x
- No significant quality loss vs full fine-tuning
- Enables training on consumer GPUs (24GB)
- Paged optimizers manage memory spikes

### Key Libraries

```python
# Core training
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model

# Inference
import vllm
from peft import PeftModel

# RLHF (optional)
from trl import PPOTrainer, DPOTrainer
```

---

## References

1. **LoRA**: Hu et al. (2021) "LoRA: Low-Rank Adaptation of Large Language Models" - [arXiv:2106.09685](https://arxiv.org/abs/2106.09685)
2. **QLoRA**: Dettmers et al. (2023) "QLoRA: Efficient Finetuning of Quantized LLMs" - [arXiv:2305.14314](https://arxiv.org/abs/2305.14314)
3. **Switch Transformers**: Fedus et al. (2021) "Switch Transformers: Scaling to Trillion Parameter Models" - [arXiv:2101.03961](https://arxiv.org/abs/2101.03961)
4. **Qwen Models**: Alibaba Cloud - [Hugging Face](https://huggingface.co/Qwen)
5. **PEFT Library**: Hugging Face - [Documentation](https://huggingface.co/docs/peft)

---

**Document Version**: 1.0
**Last Updated**: 2026-05-02
**Status**: Draft - Awaiting Review and Approval

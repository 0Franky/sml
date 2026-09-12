"""
lora-coverage.py — la LoRA copre i moduli GatedDeltaNet (linear_attention) o solo full_attention + MLP?
Istanzia il modello dal SOLO config su device meta (zero pesi, zero memoria), applica get_peft_model con una
ricetta di target_modules, e conta per tipo di layer: moduli con LoRA / moduli nn.Linear senza LoRA / altri
parametri (conv1d, A_log, dt_bias, norm) che nessuna LoRA tocca.
Uso: python lora-coverage.py <dir-con-config.json> [<dir> ...]
Config: curl -sL -o <dir>/config.json https://huggingface.co/Qwen/<modello>/raw/main/config.json (pubblico, pochi KB, nessun peso).
Serve un Python con torch + transformers (>= 5.5, model_type qwen3_5) + peft; il device meta non tocca la GPU.
Misurato il 2026-09-12 su Qwen3.5-4B, Qwen3.6-27B, Qwen3.8-27B: vedi wiki/harness-experiment-log.md F44.
"""
import json, sys, traceback
import torch
import torch.nn as nn
from transformers import AutoConfig
from peft import LoraConfig, get_peft_model

RECIPES = {
    "unsloth-default": ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    "all-linear": "all-linear",
}

def build(cfg_dir):
    cfg = AutoConfig.from_pretrained(cfg_dir)
    text = getattr(cfg, "text_config", None) or cfg
    errors = []
    for how in ("causal-text", "conditional-generation"):
        try:
            with torch.device("meta"):
                if how == "causal-text":
                    from transformers import AutoModelForCausalLM
                    model = AutoModelForCausalLM.from_config(text)
                else:
                    from transformers import AutoModelForImageTextToText
                    model = AutoModelForImageTextToText.from_config(cfg)
            return model, text, how
        except Exception as e:  # noqa
            errors.append(f"{how}: {type(e).__name__}: {str(e)[:160]}")
    raise RuntimeError(" | ".join(errors))

def layer_index(name):
    parts = name.split(".")
    for i, p in enumerate(parts):
        if p == "layers" and i + 1 < len(parts) and parts[i + 1].isdigit():
            return int(parts[i + 1])
    return None

def coverage(model, layer_types):
    """per tipo di layer: {lora: set(nomi corti), linear_no_lora: set, other_params: set}"""
    out = {}
    for name, mod in model.named_modules():
        li = layer_index(name)
        if li is None or li >= len(layer_types):
            continue
        lt = layer_types[li]
        rec = out.setdefault(lt, {"lora": set(), "linear_no_lora": set(), "other": set(), "n_layers": set()})
        rec["n_layers"].add(li)
        short = ".".join(p for p in name.split(".") if not p.isdigit())
        short = short.replace("base_model.model.", "").replace("model.language_model.", "").replace("model.", "", 1)
        has_lora = hasattr(mod, "lora_A")
        if has_lora:
            rec["lora"].add(short)
        elif isinstance(mod, nn.Linear):
            rec["linear_no_lora"].add(short)
        elif isinstance(mod, (nn.Conv1d,)) or (len(list(mod.children())) == 0 and any(True for _ in mod.parameters(recurse=False))):
            rec["other"].add(short + f"[{type(mod).__name__}]")
    return out

def main():
    for cfg_dir in sys.argv[1:]:
        print("=" * 100)
        print("CONFIG", cfg_dir)
        try:
            model, text, how = build(cfg_dir)
        except Exception as e:
            print("  ISTANZIAZIONE FALLITA:", e)
            continue
        layer_types = list(getattr(text, "layer_types", []) or [])
        print(f"  classe={type(model).__name__} via={how} layers={len(layer_types)} "
              f"linear_attention={layer_types.count('linear_attention')} full_attention={layer_types.count('full_attention')}")
        # moduli del primo layer linear e del primo full, per nome (cosa c'e' dentro)
        for want in ("linear_attention", "full_attention"):
            if want in layer_types:
                idx = layer_types.index(want)
                names = sorted({".".join(p for p in n.split(".") if not p.isdigit()).split("layers.")[-1]
                                for n, m in model.named_modules() if layer_index(n) == idx and len(list(m.children())) == 0})
                print(f"  layer[{idx}] {want}: foglie = {names}")
        for rname, targets in RECIPES.items():
            try:
                m2, _, _ = build(cfg_dir)
                pm = get_peft_model(m2, LoraConfig(r=16, lora_alpha=32, target_modules=targets, init_lora_weights=False))
            except Exception as e:
                print(f"  ricetta {rname}: PEFT FALLITO: {type(e).__name__}: {str(e)[:200]}")
                continue
            cov = coverage(pm, layer_types)
            print(f"  --- ricetta {rname}")
            for lt in ("linear_attention", "full_attention"):
                if lt not in cov:
                    continue
                r = cov[lt]
                print(f"    {lt} ({len(r['n_layers'])} layer): LoRA su {sorted(r['lora'])}")
                print(f"      Linear SENZA LoRA: {sorted(r['linear_no_lora'])}")
                print(f"      altri parametri (mai LoRA): {sorted(r['other'])}")
            # conteggio parametri addestrabili per tipo di layer (meta: numel funziona)
            per_type = {}
            for n, p in pm.named_parameters():
                if not p.requires_grad:
                    continue
                li = layer_index(n)
                lt = layer_types[li] if li is not None and li < len(layer_types) else "fuori-layer"
                per_type[lt] = per_type.get(lt, 0) + p.numel()
            tot = sum(per_type.values())
            print("    parametri LoRA per tipo di layer:", {k: f"{v/1e6:.2f}M ({100*v/tot:.0f}%)" for k, v in per_type.items()} if tot else "nessuno")
    print("=" * 100)

if __name__ == "__main__":
    main()

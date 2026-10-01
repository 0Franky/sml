"""Scarica i dataset/modelli aperti utili al training, fuori dal repo (il repo e' pubblico).

Uso:  SLM_DATA_DIR=<cartella> python lm/tools/fetch-training-data.py [--only id ...] [--plan]

Contratto (checklist di rilascio, Fra 2026-10-01 — default ROSSO):
- exit 0 SOLO se ogni file atteso esiste con la dimensione esatta dichiarata dall'hub;
  qualunque altra cosa (rete, disco, file mancante o troncato, env assente) -> exit != 0.
- log ed errori su file: $SLM_DATA_DIR/_logs/fetch-<timestamp>.log
- niente output a meta': huggingface_hub scrive in .incomplete e rinomina a fine file.
- rieseguibile senza duplicare: i file gia' completi vengono saltati.
- prima di scaricare controlla lo spazio libero: se non basta, rosso e nessun download.

La LICENZA dei dataset e' Apache-2.0 per tutte le voci (verificata sull'hub il 2026-10-01);
la DECONTAMINAZIONE contro i nostri held-out NON e' fatta: scaricare non e' usare (#18, #29).
"""
import argparse, datetime, os, shutil, sys

from huggingface_hub import HfApi, snapshot_download

# (repo_id, repo_type, allow_patterns, ignore_patterns, perche')
SOURCES = [
    ("openbmb/MiniCPM5-2B", "model", None, None,
     "modello di TEST locale al posto del 4B (Fra 2026-10-01)"),
    ("openbmb/UltraData-SFT-Agent-2609", "dataset", None, None,
     "500K esempi SFT agentici (Code_Agent + General_Agent)"),
    ("openbmb/UltraData-RL-2609", "dataset", None, ["data/Code/*"],
     "RL senza la parte Code (184 GB, non entra sul disco; Tier-1 non e' coding)"),
    ("XiaomiMiMo/MiMo-V2.6-RL-oss", "dataset", None, None,
     "ambienti RL rilasciati da MiMo-V2.6 (general/envs = lavoro di conoscenza)"),
]
MARGIN = 10 * 1024**3  # spazio da lasciare libero dopo il download


def matches(path, allow, ignore):
    from fnmatch import fnmatch
    if allow and not any(fnmatch(path, p) for p in allow):
        return False
    return not (ignore and any(fnmatch(path, p) for p in ignore))


def expected_files(api, repo, rtype, allow, ignore):
    info = api.repo_info(repo, repo_type=rtype, files_metadata=True)
    return {s.rfilename: s.size for s in info.siblings if matches(s.rfilename, allow, ignore)}


def missing(local, files):
    bad = []
    for name, size in files.items():
        p = os.path.join(local, name)
        if not os.path.isfile(p) or (size is not None and os.path.getsize(p) != size):
            bad.append(name)
    return bad


def main():
    for s in (sys.stdout, sys.stderr):
        s.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", help="repo_id da scaricare (default: tutti)")
    ap.add_argument("--plan", action="store_true", help="mostra cosa manca e quanto pesa, non scarica")
    args = ap.parse_args()

    root = os.environ.get("SLM_DATA_DIR")
    if not root:
        print("ROSSO: SLM_DATA_DIR non impostata (la cartella dati sta FUORI dal repo)", file=sys.stderr)
        return 2
    os.makedirs(os.path.join(root, "_logs"), exist_ok=True)
    log_path = os.path.join(root, "_logs", f"fetch-{datetime.datetime.now():%Y%m%d-%H%M%S}.log")
    log = open(log_path, "a", encoding="utf-8")

    def say(msg, err=False):
        line = f"[{datetime.datetime.now():%H:%M:%S}] {msg}"
        print(line, file=sys.stderr if err else sys.stdout, flush=True)
        log.write(line + "\n"); log.flush()

    api = HfApi()
    sources = [s for s in SOURCES if not args.only or s[0] in args.only]
    if args.only and len(sources) != len(args.only):
        say(f"ROSSO: repo sconosciuti in --only: {set(args.only) - {s[0] for s in SOURCES}}", err=True)
        return 2

    plan = []
    for repo, rtype, allow, ignore, why in sources:
        local = os.path.join(root, repo.replace("/", "__"))
        files = expected_files(api, repo, rtype, allow, ignore)
        todo = missing(local, files)
        need = sum(files[f] or 0 for f in todo)
        plan.append((repo, rtype, allow, ignore, local, files))
        say(f"{repo}: {len(files)} file, mancano {len(todo)} ({need / 1e9:.2f} GB) — {why}")

    need_total = sum(sum(f[n] or 0 for n in missing(local, f)) for *_, local, f in plan)
    free = shutil.disk_usage(root).free
    say(f"totale da scaricare {need_total / 1e9:.2f} GB, liberi {free / 1e9:.2f} GB")
    if need_total + MARGIN > free:
        say("ROSSO: spazio insufficiente (con 10 GB di margine), nessun download avviato", err=True)
        return 3
    if args.plan:
        say(f"--plan: nessun download. Log: {log_path}")
        return 0 if need_total == 0 else 1  # verde solo se non manca niente

    failed = []
    for repo, rtype, allow, ignore, local, files in plan:
        try:
            snapshot_download(repo, repo_type=rtype, local_dir=local,
                              allow_patterns=allow, ignore_patterns=ignore, max_workers=8)
        except Exception as e:  # noqa: BLE001 — si registra e si diventa rossi, non si inghiotte
            say(f"ERRORE {repo}: {type(e).__name__}: {e}", err=True)
        bad = missing(local, files)
        if bad:
            failed.append(repo)
            say(f"ROSSO {repo}: {len(bad)} file mancanti o di dimensione sbagliata, es. {bad[:3]}", err=True)
        else:
            say(f"VERDE {repo}: {len(files)}/{len(files)} file con la dimensione attesa")

    say(("ROSSO: " + ", ".join(failed)) if failed else "VERDE: tutto completo e verificato")
    say(f"log: {log_path}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

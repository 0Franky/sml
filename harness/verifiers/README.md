# Verifiers — spec dei gold-example

Ogni gold-example ha un **reward = verifier deterministico** (setup fixture + assert oracoli).
Questo dir contiene gli spec estratti dai gold, eseguiti da `.pi/extensions/verifier-sandbox.ts`
(tool `run_verifier`).

## Formato spec (input di `run_verifier`)

```json
{
  "setup": [
    "git init -q",
    "printf 'def parse(): pass\\n' > parser.py",
    "git add -A && git commit -qm init"
  ],
  "asserts": [
    { "cmd": "git ls-files --error-unmatch parser.py", "expect_exit": 0 },
    { "cmd": "python -c 'import parser'", "expect_exit": 0 }
  ]
}
```

- `setup` → semina lo stato verificabile (la **sandbox-fixture** del gold, §2bis).
- `asserts` → gli **oracoli ancorati all'OUTCOME** (exit == expect → pass). Vedi
  `slm/wiki/training-taxonomy/gold-methodology.md` (oracolo-unificato, predicato-vs-esecuzione).

## Mapping gold → spec

Estrai `§2bis` (sandbox-fixture = `setup`) + i blocchi LABEL/oracolo (= `asserts`) di ogni gold.

**TODO (chiude il loop di validazione gold)**: estrarre gli spec dei 3 draft del pilota
(`slm/wiki/training-taxonomy/gold-example-area02-{1.2,3.2,6.2}.md`) + del template 1.1, farli
girare con `run_verifier`, e correggere i bug-oracolo che i review agnostici hanno segnalato
(es. 1.2 P0-1 `sha256` non-ancorato). → rimuove il marker `[UNVERIFIED]` dai gold.

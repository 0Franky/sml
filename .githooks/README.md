# .githooks — pre-push secret/PII guard (slm)

Gate locale che **blocca il push** se rileva secret o PII nelle righe in uscita.
Basato su gitleaks (`.gitleaks.toml` + bypass `SKIP_GITLEAKS`), esteso per
repo **PUBBLICO** con regole PII (email,
chat_id) e con **fallback integrato** se gitleaks non è installato.

## Install (una volta per clone)
```sh
bash scripts/git-hooks/install-secret-hooks.sh                 # *nix/macOS
powershell -File scripts/git-hooks/install-secret-hooks.ps1    # Windows
```
Imposta `git config core.hooksPath .githooks`. `core.hooksPath` è **locale** (non
si pusha): ogni clone deve rieseguire l'install.

## Come funziona
- Con **gitleaks** installato: scansiona il **range in push** con `.gitleaks.toml`
  (regole built-in PAT/chiavi/AWS + email/chat_id custom + allowlist). Consigliato.
- Senza gitleaks: **fallback** a pattern integrati (PAT, chiavi, AWS, email,
  chat_id) + `denylist.local`. Protegge comunque (non fail-closed).

## Bypass (falsi positivi consapevoli)
```sh
SKIP_GITLEAKS=1 git push        # loggato in .githooks/bypass.log (gitignored)
git push --no-verify            # salta TUTTI gli hook (sconsigliato)
```

## `denylist.local` (gitignored)
Token PII specifici per il fallback (es. username reale nei path assoluti). Una
stringa per riga. **NON pushare** (gitignored). email/chat_id sono già coperti
dalle regex generiche.

## Limiti noti
- Lo username reale nei path assoluti è coperto solo dal fallback (denylist); con
  gitleaks aggiungere una regola locale se serve.
- Allowlist **tight**: ogni voce in `.gitleaks.toml` è un buco nella guardia →
  rivedere prima di allargarla.

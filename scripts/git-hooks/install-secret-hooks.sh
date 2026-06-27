#!/usr/bin/env sh
# =============================================================================
# install-secret-hooks.sh — attiva il pre-push secret/PII guard per slm (*nix/macOS)
# =============================================================================
# Idempotente. Run una volta per clone. Windows: usa il .ps1 sibling.
# core.hooksPath e' locale (non si pusha): ogni clone deve rieseguire questo.
# =============================================================================
set -eu
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"   # scripts/git-hooks -> scripts -> root
echo "slm secret-hook installer — root: $ROOT"

# 1. Attiva core.hooksPath
git -C "$ROOT" config core.hooksPath .githooks
echo "  core.hooksPath = .githooks  (attivo)"
chmod +x "$ROOT/.githooks/pre-push" 2>/dev/null || true

# 2. gitleaks (consigliato; senza, il pre-push usa il fallback integrato)
if ! command -v gitleaks >/dev/null 2>&1; then
  echo "  gitleaks NON trovato (opzionale ma consigliato). Install:"
  echo "    Windows : winget install --id Gitleaks.Gitleaks -e"
  echo "    macOS   : brew install gitleaks"
  echo "    Linux   : https://github.com/gitleaks/gitleaks/releases"
  echo "  Senza gitleaks il pre-push usa lo scanner fallback integrato (pattern PII + denylist)."
else
  echo "  gitleaks: $(gitleaks version 2>/dev/null || echo present)"
fi

echo "Done. Pre-push secret/PII scan attivo."
echo "Bypass emergenza: SKIP_GITLEAKS=1 git push   (loggato in .githooks/bypass.log)"

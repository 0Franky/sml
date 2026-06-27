# =============================================================================
# install-secret-hooks.ps1 — attiva il pre-push secret/PII guard per slm (Windows)
# =============================================================================
# Idempotente. Run una volta per clone:  powershell -File scripts/git-hooks/install-secret-hooks.ps1
# core.hooksPath e' locale (non si pusha): ogni clone deve rieseguire questo.
# =============================================================================
$ErrorActionPreference = "Stop"
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
Write-Host "slm secret-hook installer - root: $root"

# 1. Attiva core.hooksPath
git -C $root config core.hooksPath .githooks
Write-Host "  core.hooksPath = .githooks (attivo)"

# 2. gitleaks (consigliato; senza, il pre-push usa il fallback integrato)
if (-not (Get-Command gitleaks -ErrorAction SilentlyContinue)) {
  Write-Host "  gitleaks NON trovato (opzionale ma consigliato). Install:"
  Write-Host "    winget install --id Gitleaks.Gitleaks -e"
  Write-Host "  Senza gitleaks il pre-push usa lo scanner fallback integrato (pattern PII + denylist)."
} else {
  Write-Host "  gitleaks: $(gitleaks version)"
}

Write-Host "Done. Pre-push secret/PII scan attivo."
Write-Host 'Bypass emergenza: $env:SKIP_GITLEAKS=1; git push   (loggato in .githooks/bypass.log)'

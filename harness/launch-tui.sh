#!/usr/bin/env bash
# ============================================================
#  launch-tui.sh — comodità Linux/macOS per avviare la TUI di pi.
#  È solo un wrapper di  npm run tui  (la via OS-agnostic).
#  Uso:  chmod +x launch-tui.sh && ./launch-tui.sh
#  Cross-OS:  cd harness && npm run tui   (Windows/macOS/Linux).
# ============================================================
set -e
cd "$(dirname "$0")"
echo "============================================================"
echo "  Avvio TUI pi (harness ITLMv1)  ==  npm run tui"
echo "  Cartella: $(pwd)"
echo "  Le estensioni .ts si ricompilano al boot (jiti) -> codice nuovo già attivo."
echo "  Ctrl-C per uscire."
echo "============================================================"
echo
exec npm run tui

@echo off
REM ============================================================
REM  launch-tui.bat — comodita' DOPPIO-CLICK (Windows) per la TUI.
REM  E' solo un wrapper di  npm run tui  (la via OS-agnostic).
REM  Cross-OS:  cd harness && npm run tui   (Windows/macOS/Linux).
REM ============================================================
title pi TUI - harness ITLMv1
cd /d "%~dp0"
echo ============================================================
echo   Avvio TUI pi (harness ITLMv1)  ==  npm run tui
echo   Cartella: %CD%
echo   Le estensioni .ts si ricompilano al boot (jiti): codice nuovo gia' attivo.
echo   Ctrl-C per uscire.
echo ============================================================
echo.
call npm run tui
echo.
echo (pi terminato) - premi un tasto per chiudere questa finestra.
pause >nul

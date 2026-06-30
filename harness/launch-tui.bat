@echo off
REM ============================================================
REM  launch-tui.bat — avvia la TUI di pi per l'harness ITLMv1.
REM  Doppio-click in Esplora risorse (apre una nuova finestra),
REM  oppure da terminale:  .\launch-tui.bat
REM  pi e' un bin LOCALE (node_modules\.bin\pi.cmd), non globale.
REM ============================================================
title pi TUI - harness ITLMv1
cd /d "%~dp0"
echo ============================================================
echo   Avvio TUI pi (harness ITLMv1)
echo   Cartella: %CD%
echo   Le estensioni .ts sono ricompilate al boot (jiti) -> codice nuovo gia' attivo.
echo   Ctrl-C per uscire.
echo ============================================================
echo.
if not exist "%~dp0node_modules\.bin\pi.cmd" (
  echo [ERRORE] node_modules\.bin\pi.cmd non trovato. Esegui prima:  npm install
  echo.
  pause
  exit /b 1
)
call "%~dp0node_modules\.bin\pi.cmd"
echo.
echo (pi terminato) - premi un tasto per chiudere questa finestra.
pause >nul

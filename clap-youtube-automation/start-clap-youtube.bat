@echo off
setlocal

set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

where node >nul 2>nul
if not %errorlevel%==0 (
  echo Node.js no esta instalado o no esta disponible en PATH.
  echo Instala Node.js o abre index.html manualmente en Chrome.
  pause
  exit /b 1
)

start "Clap YouTube Automation" /min node "%APP_DIR%server.cjs"

@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "FRONTEND_DIR=%ROOT_DIR%"
set "BACKEND_DIR=%ROOT_DIR%backend"

echo Abriendo frontend y backend de Supply Nexu...

start "Supply Nexu Backend" cmd /k "cd /d "%BACKEND_DIR%" && npm.cmd run build && npm.cmd run start:prod"
start "Supply Nexu Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm.cmd run dev -- --host 127.0.0.1"

echo.
echo Frontend y backend iniciados en ventanas separadas.
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:10000
echo Si alguna ventana muestra "EADDRINUSE", cierra la instancia vieja que ya estaba abierta.
echo.
pause

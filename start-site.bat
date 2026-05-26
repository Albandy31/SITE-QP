@echo off
setlocal
title Quatre Piliers - Site local (alt1)
cd /d "%~dp0"

echo.
echo ========================================
echo   QUATRE PILIERS - Serveur local
echo ========================================
echo.

python "%~dp0serve.py" 8083 2>nul
if errorlevel 1 (
  py "%~dp0serve.py" 8083
  if errorlevel 1 (
    echo.
    echo [ERREUR] Python introuvable. Installe Python depuis https://python.org
    pause
    exit /b 1
  )
)

@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo  Canvas login (PolyU NetID + 2FA)
echo ============================================
echo.
node scripts/login.mjs
set EXITCODE=%ERRORLEVEL%
echo.
if "%EXITCODE%"=="0" (
  echo Login OK. Session saved.
) else (
  echo Login not completed ^(exit %EXITCODE%^). You can run this again.
)
echo.
pause

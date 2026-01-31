@echo off
cls
echo ========================================
echo   ClasseTrack - Installation Auto
echo ========================================
echo.

echo [Etape 1/6] Arret des processus Node...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [Etape 2/6] Nettoyage des fichiers...
if exist node_module\.prisma rmdir /s /q node_module\.prisma >nul 2>&1
if exist prisma\migrations rmdir /s /q prisma\migrations >nul 2>&1

echo [Etape 3/6] Generation Prisma...
call npx prisma generate
if errorlevel 1 (
    echo ERREUR: Prisma generate a echoue
    pause
    exit /b 1
)

echo [Etape 4/6] Creation des tables...
call npx prisma db push --force-reset --accept-data-loss
if errorlevel 1 (
    echo ERREUR: Creation des tables a echoue
    pause
    exit /b 1
)

echo [Etape 5/6] Creation de l'administrateur...
call npx ts-node prisma/create-admin.ts
if errorlevel 1 (
    echo ERREUR: Creation admin a echoue
    pause
    exit /b 1
)

echo.
echo ========================================
echo   INSTALLATION TERMINEE !
echo ========================================
echo.
echo Informations de connexion :
echo   URL : http://localhost:3000/login
echo   Email : admin@classetrack.com
echo   Password : admin123
echo.
echo ========================================
echo.

echo [Etape 6/6] Lancement du serveur...
echo.
call npm run dev

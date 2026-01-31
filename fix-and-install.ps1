Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ClasseTrack - Reparation + Install" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/7] Arret Node.js..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "[2/7] Nettoyage..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_module\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force prisma\migrations -ErrorAction SilentlyContinue

Write-Host "[3/7] Suppression de la base de donnees..." -ForegroundColor Yellow
# Exécuter via mysql CLI si disponible
$mysqlCmd = "DROP DATABASE IF EXISTS classetrack; CREATE DATABASE classetrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
try {
    echo $mysqlCmd | mysql -u root -P 3306 2>$null
    Write-Host "Base de donnees recreee" -ForegroundColor Green
} catch {
    Write-Host "Impossible de recreer la BD via mysql CLI, continuons..." -ForegroundColor Yellow
}

Write-Host "[4/7] Generation Prisma..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR lors de la generation Prisma" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[5/7] Creation des tables..." -ForegroundColor Yellow
npx prisma db push --force-reset --accept-data-loss --skip-generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR lors de la creation des tables" -ForegroundColor Red
    Write-Host ""
    Write-Host "Essayez manuellement dans phpMyAdmin:" -ForegroundColor Yellow
    Write-Host "1. Ouvrez http://localhost/phpmyadmin" -ForegroundColor White
    Write-Host "2. Supprimez la base 'classetrack'" -ForegroundColor White
    Write-Host "3. Recreez-la: CREATE DATABASE classetrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor White
    Write-Host "4. Relancez ce script" -ForegroundColor White
    pause
    exit 1
}

Write-Host "[6/7] Installation bcryptjs..." -ForegroundColor Yellow
npm install bcryptjs @types/bcryptjs --silent

Write-Host "[7/7] Creation de l'administrateur..." -ForegroundColor Yellow
npx ts-node prisma/create-admin.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR lors de la creation de l'admin" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   INSTALLATION TERMINEE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Informations de connexion :" -ForegroundColor Cyan
Write-Host "  URL      : http://localhost:3000/login" -ForegroundColor White
Write-Host "  Email    : admin@classetrack.com" -ForegroundColor White
Write-Host "  Password : admin123" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lancement du serveur dans 3 secondes..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

npm run dev

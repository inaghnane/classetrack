Write-Host "ClasseTrack - Installation" -ForegroundColor Green
Write-Host ""

Write-Host "[1/6] Arret Node.js..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "[2/6] Nettoyage..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_module\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force prisma\migrations -ErrorAction SilentlyContinue

Write-Host "[3/6] Generation Prisma..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR lors de la generation Prisma" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[4/6] Creation des tables..." -ForegroundColor Yellow
npx prisma db push --force-reset --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR lors de la creation des tables" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[5/6] Installation bcryptjs..." -ForegroundColor Yellow
npm install bcryptjs
npm install -D @types/bcryptjs

Write-Host "[6/6] Creation de l'administrateur..." -ForegroundColor Yellow
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

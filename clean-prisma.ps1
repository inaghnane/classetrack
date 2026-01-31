Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Nettoyage Prisma" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Arrêt du serveur..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "[2/6] Suppression du cache Next..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

Write-Host "[3/6] Suppression node_module .prisma..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_module\.prisma -ErrorAction SilentlyContinue

Write-Host "[4/6] Suppression dossier prisma..." -ForegroundColor Yellow
Remove-Item -Recurse -Force prisma -ErrorAction SilentlyContinue

Write-Host "[5/6] Désinstallation Prisma..." -ForegroundColor Yellow
npm uninstall @prisma/client prisma --silent --save

Write-Host "[6/6] Réinstallation des dépendances..." -ForegroundColor Yellow
npm install mysql2 next-auth bcryptjs --save --silent
npm install -D @types/bcryptjs @types/node --silent

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✓ Nettoyage terminé !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Lancement du serveur..." -ForegroundColor Yellow
npm run dev

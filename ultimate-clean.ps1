Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Nettoyage TOTAL Prisma" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/8] Arrêt du serveur..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "[2/8] Suppression .next..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

Write-Host "[3/8] Suppression .prisma..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_module\.prisma -ErrorAction SilentlyContinue

Write-Host "[4/8] Suppression dossier prisma..." -ForegroundColor Yellow
Remove-Item -Recurse -Force prisma -ErrorAction SilentlyContinue

Write-Host "[5/8] Suppression node_module..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_module -ErrorAction SilentlyContinue

Write-Host "[6/8] Suppression package-lock.json..." -ForegroundColor Yellow
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "[7/8] Réinstallation propre..." -ForegroundColor Yellow
npm install --no-save

Write-Host "[8/8] Installation des dépendances correctes..." -ForegroundColor Yellow
npm install mysql2 next-auth bcryptjs
npm install -D @types/bcryptjs @types/node

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✓ Nettoyage TOTAL terminé !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Lancement du serveur..." -ForegroundColor Yellow
npm run dev

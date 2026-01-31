Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "   SUPPRESSION TOTALE DE PRISMA" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

Write-Host "[1/10] Arrêt du serveur..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "[2/10] Suppression node_module..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_module -ErrorAction SilentlyContinue

Write-Host "[3/10] Suppression .next..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

Write-Host "[4/10] Suppression prisma folder..." -ForegroundColor Yellow
Remove-Item -Recurse -Force prisma -ErrorAction SilentlyContinue

Write-Host "[5/10] Suppression package-lock.json..." -ForegroundColor Yellow
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "[6/10] Suppression .env.local..." -ForegroundColor Yellow
Remove-Item -Force .env.local -ErrorAction SilentlyContinue

Write-Host "[7/10] Nettoyage npm cache..." -ForegroundColor Yellow
npm cache clean --force --silent

Write-Host "[8/10] Installation propre..." -ForegroundColor Yellow
npm install --no-save

Write-Host "[9/10] Installation des dépendances..." -ForegroundColor Yellow
npm install mysql2 next-auth bcryptjs
npm install -D @types/bcryptjs @types/node @types/mysql2

Write-Host "[10/10] Lancement du serveur..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✓ PRISMA SUPPRIMÉ COMPLÈTEMENT !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

npm run dev

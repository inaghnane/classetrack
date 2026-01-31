Write-Host "Correction de l'erreur Prisma..." -ForegroundColor Yellow

Write-Host "[1/4] Arrêt du serveur..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "[2/4] Suppression du cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_module\.prisma -ErrorAction SilentlyContinue

Write-Host "[3/4] Installation des dépendances..." -ForegroundColor Yellow
npm install mysql2 next-auth bcryptjs --silent
npm install -D @types/bcryptjs @types/node --silent

Write-Host "[4/4] Lancement du serveur..." -ForegroundColor Yellow
Write-Host ""
npm run dev

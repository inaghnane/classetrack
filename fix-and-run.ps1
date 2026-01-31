Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ClasseTrack - Réparation Complète" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Arrêt du serveur..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "[2/5] Suppression du cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_module\.prisma -ErrorAction SilentlyContinue

Write-Host "[3/5] Installation des dépendances..." -ForegroundColor Yellow
npm install mysql2 next-auth bcryptjs --silent
npm install -D @types/bcryptjs @types/node --silent

Write-Host "[4/5] Désinstallation de Prisma..." -ForegroundColor Yellow
npm uninstall @prisma/client prisma --silent

Write-Host "[5/5] Vérification WAMP..." -ForegroundColor Yellow
$response = Read-Host "WAMP est-il démarré et MySQL vert? (o/n)"

if ($response -eq "o" -or $response -eq "O" -or $response -eq "oui") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   LANCEMENT DU SERVEUR" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Allez sur: http://localhost:3000/login" -ForegroundColor Cyan
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "Démarrez WAMP puis relancez: .\fix-and-run.ps1" -ForegroundColor Red
    Write-Host ""
}

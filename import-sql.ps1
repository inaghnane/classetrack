Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ClasseTrack - Import SQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Arret Node.js..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "[2/2] Installation des dependances..." -ForegroundColor Yellow
npm install mysql2 bcryptjs next-auth --silent
npm install -D @types/bcryptjs --silent

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   PRET POUR L'IMPORT !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Choisissez une methode:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1 - Import via phpMyAdmin (RECOMMANDE):" -ForegroundColor Yellow
Write-Host "  1. Ouvrez http://localhost/phpmyadmin" -ForegroundColor White
Write-Host "  2. Cliquez sur l'onglet 'Importer'" -ForegroundColor White
Write-Host "  3. Selectionnez le fichier: $PWD\create-database.sql" -ForegroundColor White
Write-Host "  4. Cliquez sur 'Executer'" -ForegroundColor White
Write-Host ""
Write-Host "Option 2 - Import via CLI (si mysql.exe disponible):" -ForegroundColor Yellow
Write-Host "  Tapez: mysql -u root < create-database.sql" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Avez-vous importe le fichier SQL? (o/n)"

if ($choice -eq "o" -or $choice -eq "O" -or $choice -eq "oui") {
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
    Write-Host "Importez le fichier SQL puis relancez: .\import-sql.ps1" -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ClasseTrack - Import SQL Complet" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Méthode: Ouvrir phpMyAdmin et importer les fichiers" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ordre d'importation:" -ForegroundColor Yellow
Write-Host "  1. sql/01-schema.sql" -ForegroundColor White
Write-Host "  2. sql/02-user.sql" -ForegroundColor White
Write-Host "  3. sql/03-filiere.sql" -ForegroundColor White
Write-Host "  4. sql/04-module.sql" -ForegroundColor White
Write-Host "  5. sql/05-seance.sql" -ForegroundColor White
Write-Host "  6. sql/06-verify.sql" -ForegroundColor White
Write-Host ""
Write-Host "OU importer directement:" -ForegroundColor Yellow
Write-Host "  create-database.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ouvrir phpMyAdmin
Write-Host "Ouverture de phpMyAdmin..." -ForegroundColor Yellow
Start-Process "http://localhost/phpmyadmin"

Write-Host ""
Write-Host "✓ Allez à l'onglet 'Importer'" -ForegroundColor Green
Write-Host "✓ Choisissez les fichiers SQL dans l'ordre" -ForegroundColor Green
Write-Host "✓ Cliquez sur 'Exécuter'" -ForegroundColor Green
Write-Host ""

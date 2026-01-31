Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ClasseTrack - Installation Finale" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Installation des dependances..." -ForegroundColor Yellow
npm install mysql2 bcryptjs next-auth --silent
npm install -D @types/bcryptjs --silent

Write-Host "[2/2] Arret Node.js..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "   ACTION REQUISE !" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "1. Ouvrez phpMyAdmin: " -ForegroundColor Yellow -NoNewline
Write-Host "http://localhost/phpmyadmin" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Cliquez sur l'onglet 'SQL'" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Copiez-collez et executez ce SQL:" -ForegroundColor Yellow
Write-Host ""
Write-Host "--- DEBUT SQL ---" -ForegroundColor White
Write-Host ""

$sql = @"
DROP DATABASE IF EXISTS classetrack;
CREATE DATABASE classetrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE classetrack;

CREATE TABLE User (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  role ENUM('ADMIN', 'PROF', 'STUDENT') NOT NULL,
  deviceId VARCHAR(191),
  deviceBoundAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO User (id, email, passwordHash, firstName, lastName, role) VALUES
(UUID(), 'admin@classetrack.com', '`$2a`$10`$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', 'ADMIN'),
(UUID(), 'prof@classetrack.com', '`$2a`$10`$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'Professeur', 'Dupont', 'PROF'),
(UUID(), 'student@classetrack.com', '`$2a`$10`$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', 'Etudiant', 'Martin', 'STUDENT');

SELECT 'Base de donnees creee avec succes!' as message;
SELECT id, email, firstName, lastName, role FROM User;
"@

Write-Host $sql -ForegroundColor Cyan
Write-Host ""
Write-Host "--- FIN SQL ---" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Copier le SQL dans le presse-papier si possible
try {
    $sql | Set-Clipboard
    Write-Host "✓ SQL copie dans le presse-papier !" -ForegroundColor Green
    Write-Host "  Collez-le directement dans phpMyAdmin (Ctrl+V)" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "Note: Copiez manuellement le SQL ci-dessus" -ForegroundColor Yellow
    Write-Host ""
}

$response = Read-Host "Avez-vous execute le SQL dans phpMyAdmin? (o/n)"

if ($response -eq "o" -or $response -eq "O" -or $response -eq "oui") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   INSTALLATION TERMINEE !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Comptes disponibles:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  ADMIN:" -ForegroundColor Yellow
    Write-Host "    Email    : admin@classetrack.com" -ForegroundColor White
    Write-Host "    Password : admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "  PROFESSEUR:" -ForegroundColor Yellow
    Write-Host "    Email    : prof@classetrack.com" -ForegroundColor White
    Write-Host "    Password : prof123" -ForegroundColor White
    Write-Host ""
    Write-Host "  ETUDIANT:" -ForegroundColor Yellow
    Write-Host "    Email    : student@classetrack.com" -ForegroundColor White
    Write-Host "    Password : student123" -ForegroundColor White
    Write-Host ""
    Write-Host "  URL : http://localhost:3000/login" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Lancement du serveur..." -ForegroundColor Yellow
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "Executez d'abord le SQL dans phpMyAdmin," -ForegroundColor Red
    Write-Host "puis relancez: .\install-final.ps1" -ForegroundColor White
    Write-Host ""
}

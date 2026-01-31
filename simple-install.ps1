Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ClasseTrack - Installation SIMPLE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Installation des dependances..." -ForegroundColor Yellow
npm install mysql2 bcryptjs @types/bcryptjs --silent

Write-Host "[2/3] Arret Node.js..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "[3/3] IMPORTANT - Configuration base de donnees" -ForegroundColor Red
Write-Host ""
Write-Host "Ouvrez phpMyAdmin: http://localhost/phpmyadmin" -ForegroundColor Yellow
Write-Host ""
Write-Host "Copiez et executez ce SQL:" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor White
Write-Host "DROP DATABASE IF EXISTS classetrack;" -ForegroundColor Cyan
Write-Host "CREATE DATABASE classetrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor Cyan
Write-Host "USE classetrack;" -ForegroundColor Cyan
Write-Host ""
Write-Host "CREATE TABLE User (" -ForegroundColor Cyan
Write-Host "  id VARCHAR(36) PRIMARY KEY," -ForegroundColor Cyan
Write-Host "  email VARCHAR(191) UNIQUE NOT NULL," -ForegroundColor Cyan
Write-Host "  passwordHash VARCHAR(255) NOT NULL," -ForegroundColor Cyan
Write-Host "  firstName VARCHAR(100) NOT NULL," -ForegroundColor Cyan
Write-Host "  lastName VARCHAR(100) NOT NULL," -ForegroundColor Cyan
Write-Host "  role ENUM('ADMIN', 'PROF', 'STUDENT') NOT NULL," -ForegroundColor Cyan
Write-Host "  deviceId VARCHAR(191)," -ForegroundColor Cyan
Write-Host "  deviceBoundAt DATETIME," -ForegroundColor Cyan
Write-Host "  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP," -ForegroundColor Cyan
Write-Host "  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" -ForegroundColor Cyan
Write-Host ");" -ForegroundColor Cyan
Write-Host ""
Write-Host "-- ADMIN (admin@classetrack.com / admin123)" -ForegroundColor Green
Write-Host "INSERT INTO User (id, email, passwordHash, firstName, lastName, role)" -ForegroundColor Cyan
Write-Host "VALUES (UUID(), 'admin@classetrack.com'," -ForegroundColor Cyan
Write-Host "  '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'," -ForegroundColor Cyan
Write-Host "  'Admin', 'System', 'ADMIN');" -ForegroundColor Cyan
Write-Host ""
Write-Host "-- PROF (prof@classetrack.com / prof123)" -ForegroundColor Green
Write-Host "INSERT INTO User (id, email, passwordHash, firstName, lastName, role)" -ForegroundColor Cyan
Write-Host "VALUES (UUID(), 'prof@classetrack.com'," -ForegroundColor Cyan
Write-Host "  '\$2a\$10\$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa'," -ForegroundColor Cyan
Write-Host "  'Professeur', 'Dupont', 'PROF');" -ForegroundColor Cyan
Write-Host ""
Write-Host "-- STUDENT (student@classetrack.com / student123)" -ForegroundColor Green
Write-Host "INSERT INTO User (id, email, passwordHash, firstName, lastName, role)" -ForegroundColor Cyan
Write-Host "VALUES (UUID(), 'student@classetrack.com'," -ForegroundColor Cyan
Write-Host "  '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy'," -ForegroundColor Cyan
Write-Host "  'Etudiant', 'Martin', 'STUDENT');" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor White
Write-Host ""

$response = Read-Host "Avez-vous execute le SQL dans phpMyAdmin? (o/n)"

if ($response -eq "o" -or $response -eq "O") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   INSTALLATION TERMINEE !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Comptes crees:" -ForegroundColor Cyan
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
    npm run dev
} else {
    Write-Host ""
    Write-Host "Executez d'abord le SQL dans phpMyAdmin, puis relancez:" -ForegroundColor Red
    Write-Host ".\simple-install.ps1" -ForegroundColor White
}

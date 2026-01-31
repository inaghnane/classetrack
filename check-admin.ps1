Write-Host "Verification de l'admin..." -ForegroundColor Cyan
npx prisma db execute --stdin

# Puis collez cette commande SQL :
# SELECT * FROM User WHERE role = 'ADMIN';

Write-Host "Nettoyage de Prisma..." -ForegroundColor Yellow

# Arrêter Node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Supprimer Prisma
Remove-Item -Recurse -Force node_module\.prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_module\@prisma -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force prisma -ErrorAction SilentlyContinue

Write-Host "Nettoyage termine !" -ForegroundColor Green

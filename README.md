# ClasseTrack - Système de Gestion des Absences

## 🚀 Recovery / First Run Guide

### Prérequis
- WAMP Stack (MySQL sur port 3306)
- Node.js 18+
- Database `classetrack` créée

### Installation Complète

```bash
# 1) Installer dépendances
npm install

# 2) Créer .env.local
cp .env.example .env.local
# Vérifier DATABASE_URL="mysql://root@127.0.0.1:3306/classetrack"

# 3) Créer la base de données (si pas fait)
# Dans phpMyAdmin ou MySQL CLI:
# CREATE DATABASE classetrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 4) Appliquer migrations Prisma
npx prisma migrate dev --name init

# 5) Générer Prisma Client
npx prisma generate

# 6) Seed database (créer user)
npx prisma db seed

# 7) Vérifier DB
npm run db:check
# Attendu: ✅ user in database: 3

# 8) (Optionnel) Reset admin password
npm run reset:admin

# 9) Lancer dev server
npm run dev
```

### 🔐 Credentials par défaut

| Rôle | Email | Password |
|------|-------|----------|
| Admin | admin@gmail.com | Admin@12345 |
| Prof | prof@classetrack.com | Prof@12345 |
| Student | student@classetrack.com | Student@12345 |

### ✅ Checklist de Vérification

- [ ] `npm run db:check` affiche `✅ user: 3`
- [ ] Prisma Studio (`npx prisma studio`) contient 3 user
- [ ] Login sur `http://localhost:3000/login` fonctionne
- [ ] Admin peut se connecter avec `admin@gmail.com / Admin@12345`

---

## 🛠️ Scripts Utiles

```bash
# Vérifier connexion DB
npm run db:check

# Réinitialiser admin password
npm run reset:admin

# Prisma Studio (UI graphique)
npx prisma studio

# Reset complet DB (⚠️ supprime tout)
npx prisma migrate reset

# Refaire seed uniquement
npx prisma db seed
```

---

## 🔧 Reset Database (Development Only)

Si vous voulez remettre la base à zéro :

```bash
# ⚠️ ATTENTION: Supprime toutes les données
npx prisma migrate reset

# Regénérer Prisma Client
npx prisma generate

# Refaire le seed
npx prisma db seed

# Vérifier
npm run db:check
```

**Note:** `npx prisma migrate reset` :
- Supprime la base de données
- Recrée la base de données
- Applique toutes les migrations
- Lance le seed automatiquement

---

## ⚠️ Troubleshooting Windows

### Erreur EPERM sur query_engine

```bash
# 1) Arrêter Next.js (Ctrl+C)
# 2) Fermer Prisma Studio si ouvert
# 3) Supprimer cache Prisma
Remove-Item -Recurse -Force node_module\.prisma

# 4) Regénérer
npx prisma generate

# 5) Relancer
npm run dev
```

### Erreur "Connection refused"

```bash
# Vérifier que MySQL WAMP est lancé
# Vérifier DATABASE_URL dans .env.local
npm run db:check
```

### Erreur Login 401

```bash
# 1) Vérifier que user existent
npm run db:check

# 2) Reset admin password
npm run reset:admin

# 3) Tester avec admin@gmail.com / Admin@12345

# 4) Regarder logs serveur (Terminal où tourne npm run dev)
# Chercher "AUTH:" dans les logs
```

### Seed échoue (TS2322)

```bash
# Vérifier que schema.prisma est correct
# Supprimer migrations
Remove-Item -Recurse -Force prisma\migrations

# Recréer migration
npx prisma migrate dev --name init

# Refaire seed
npx prisma db seed
```

---

## 📁 Structure Projet

```
classetrack/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/route.ts  # NextAuth handler
│   │   ├── login/                            # Page login
│   │   └── ...
│   ├── lib/auth.ts                          # NextAuth config
│   └── types/index.ts                       # Types
├── prisma/
│   ├── schema.prisma                        # Schema DB
│   └── seed.ts                              # Seed data
├── scripts/
│   ├── db-check.js                          # Vérifier DB
│   └── reset-admin-password.js              # Reset admin
├── .env.local                               # Config locale
├── .env.example                             # Template
└── README.md                                # Cette doc
```

---

## 🎯 Stack

- **Framework:** Next.js 14 (App Router)
- **Auth:** NextAuth.js
- **Database:** Prisma + MySQL (WAMP)
- **Styling:** Tailwind CSS
- **Password:** bcryptjs

---

## 📄 Licence

MIT

## 🔄 Local vs Cloudflare Tunnel

### Développement Local (Recommandé)

```bash
# .env
NEXTAUTH_URL="http://localhost:3000"

# Lancer
npm run dev

# Accès
http://localhost:3000
```

### Avec Cloudflare Tunnel

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Cloudflare
cloudflared tunnel --url http://localhost:3000
# Copier l'URL: https://xxxxx.trycloudflare.com

# Mettre à jour .env
NEXTAUTH_URL="https://xxxxx.trycloudflare.com"

# Redémarrer Next.js (Terminal 1)
# Ctrl+C puis npm run dev

# Accès
https://xxxxx.trycloudflare.com
```

**Note:** L'URL Cloudflare change à chaque redémarrage du tunnel.

---

## 🛠️ Fix MySQL Error 1071 (Key Length)

Si `npx prisma migrate reset` échoue avec "La clé est trop longue":

### Vérifier les tables

```bash
npm run db:check-innodb
```

### Convertir en InnoDB si nécessaire

```sql
-- Dans phpMyAdmin ou MySQL CLI
ALTER TABLE `user` ENGINE=InnoDB;
ALTER TABLE `filiere` ENGINE=InnoDB;
ALTER TABLE `groupe` ENGINE=InnoDB;
-- etc.
```

### Ou reset complet

```bash
# Supprimer migrations
Remove-Item -Recurse -Force prisma\migrations

# Recréer migration
npx prisma migrate dev --name init_full_schema
```

---

## ⚙️ Prisma Model Names

Le projet utilise:
- `prisma.user` (table: `user`)
- `prisma.filiere` (table: `filiere`)
- `prisma.groupe` (table: `groupe`) ⚠️ **singulier**
- `prisma.module` (table: `module`)
- `prisma.enrollment` (table: `enrollment`)
- `prisma.seance` (table: `seance`)
- `prisma.attendance` (table: `attendance`)
- `prisma.justification` (table: `justification`)

---

## 📁 Structure Projet

```
classetrack/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/route.ts  # NextAuth handler
│   │   ├── login/                            # Page login
│   │   └── ...
│   ├── lib/auth.ts                          # NextAuth config
│   └── types/index.ts                       # Types
├── prisma/
│   ├── schema.prisma                        # Schema DB
│   └── seed.ts                              # Seed data
├── scripts/
│   ├── db-check.js                          # Vérifier DB
│   └── reset-admin-password.js              # Reset admin
├── .env.local                               # Config locale
├── .env.example                             # Template
└── README.md                                # Cette doc
```

---

## 🎯 Stack

- **Framework:** Next.js 14 (App Router)
- **Auth:** NextAuth.js
- **Database:** Prisma + MySQL (WAMP)
- **Styling:** Tailwind CSS
- **Password:** bcryptjs

---

## 📄 Licence

MIT

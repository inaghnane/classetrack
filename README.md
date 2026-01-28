# ClasseTrack - Gestion des Absences avec QR Code Dynamique

Système de gestion des absences avec QR code dynamique pour établissements scolaires et universitaires.

## 🎯 Fonctionnalités

- **Authentification** : NextAuth avec rôles (ADMIN, PROF, STUDENT)
- **QR Codes Dynamiques** : Tokens qui changent toutes les 3 secondes (anti-partage)
- **Gestion des Séances** : Ouverture/clôture par professeur
- **Pointage d'Absences** : Scan QR ou validation manuelle
- **Historique** : Suivi complet des présences/absences
- **Mode Offline** : Support basique avec sync à la reconnexion

## 📋 Prérequis

- Node.js 18+
- Docker & Docker Compose (optionnel mais recommandé)
- MariaDB 10.5+ (ou MySQL 8.0+)

## 🚀 Installation

### 1. Cloner et installer les dépendances

```bash
git clone <repo>
cd classe-track
npm install
```

### 2. Configuration MariaDB

**Avec Docker Compose (recommandé) :**

```bash
docker compose up -d
```

Cela lance MariaDB sur `localhost:3306` avec :
- Base : `classe_track`
- User : `root`
- Password : `password`

**Sans Docker :**

Créer manuellement une base de données MariaDB :

```sql
CREATE DATABASE classe_track;
```

### 3. Configuration Variables d'Environnement

```bash
cp .env.example .env.local
```

Éditer `.env.local` :

```
DATABASE_URL="mysql://root:password@localhost:3306/classe_track"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Migrations & Seed

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Cela crée :
- **Admin** : `admin@example.com` / `admin123`
- **Professeur** : `prof@example.com` / `prof123`
- **Étudiants** : `student1@example.com` / `student123`, etc.

### 5. Lancer le serveur

```bash
npm run dev
```

L'application est accessible sur `http://localhost:3000`

## 📁 Structure du Projet

```
.
├── app/                        # Next.js App Router
│   ├── api/                   # Route Handlers API
│   │   ├── auth/             # NextAuth
│   │   ├── admin/            # Admin endpoints
│   │   ├── prof/             # Professor endpoints
│   │   └── student/          # Student endpoints
│   ├── admin/                 # Admin pages
│   ├── prof/                  # Professor pages
│   ├── student/               # Student pages
│   ├── login/                 # Login page
│   └── layout.tsx             # Root layout
├── components/                 # React components
│   ├── OfflineSyncBanner.tsx
│   └── ...
├── lib/                        # Utilities
│   ├── auth.ts               # NextAuth configuration
│   ├── qr-generator.ts       # QR Token generation
│   ├── validation.ts         # Input validation
│   └── db.ts                 # Prisma client
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeding
├── public/                     # Static files
├── .env.example               # Environment template
├── docker-compose.yml         # Docker configuration
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

## 🔐 Sécurité

- Mots de passe hashés avec bcrypt
- Tokens CSRF pour formulaires
- Validation des inputs avec Zod
- Middleware RBAC pour routes protégées
- QR tokens avec HMAC-SHA256

## 🧠 Règles Métier

### QR Code Dynamique

- Token valide 3 secondes
- Base : `seanceId.epochWindow.hmac(qrSecret, seanceId|epochWindow)`
- Tolérance : ±1 fenêtre (6 secondes max)

### Pointage d'Absence

- Un seul pointage par étudiant par séance
- Étudiant doit appartenir au groupe de la séance
- Source : QR automatique ou MANUAL (admin)

### Mode Offline

- Stockage local des scans (localStorage)
- Sync automatique à la reconnexion via `/api/student/scan`

## 📚 API Principales

### Authentification

- `POST /api/auth/callback/credentials` : Login
- `GET /api/me` : Données session actuelles

### Admin

- `GET/POST /api/admin/users` : CRUD utilisateurs
- `GET/POST /api/admin/filieres` : CRUD filières
- `GET/POST /api/admin/groupes` : CRUD groupes
- `GET/POST /api/admin/modules` : CRUD modules
- `GET/POST /api/admin/seances` : CRUD séances

### Professeur

- `GET /api/prof/seances` : Lister ses séances
- `POST /api/prof/seances/[id]/open` : Ouvrir une séance
- `POST /api/prof/seances/[id]/close` : Clôturer
- `GET /api/prof/seances/[id]/attendance` : Présences/absences

### Étudiant

- `GET /api/student/seances` : Ses séances
- `POST /api/student/scan` : Marquer présence (QR ou token)
- `GET /api/student/attendance` : Historique

## 🛠️ Commandes Utiles

```bash
# Studio Prisma (visualiser DB)
npm run prisma:studio

# Nouvelle migration
npx prisma migrate dev --name <description>

# Reset DB (attention !)
npx prisma migrate reset

# Générer types Prisma
npm run prisma:generate
```

## 🧪 Comptes de Test

Après seed, les comptes suivants sont disponibles :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@example.com | admin123 | ADMIN |
| prof@example.com | prof123 | PROF |
| student1@example.com | student123 | STUDENT |
| student2@example.com | student123 | STUDENT |
| student3@example.com | student123 | STUDENT |

## 🐳 Docker Compose

```bash
# Démarrer MariaDB
docker compose up -d

# Arrêter
docker compose down

# Voir les logs
docker compose logs -f mariadb
```

## ❓ Dépannage

**Erreur de connexion DB** :
- Vérifier que MariaDB est actif : `docker compose ps`
- Vérifier la variable `DATABASE_URL` dans `.env.local`

**Prisma migration échouée** :
```bash
npx prisma migrate reset
npm run prisma:seed
```

**Port 3000 occupé** :
```bash
npm run dev -- -p 3001
```

## 📝 Licence

MIT

## 👤 Support

Pour les questions ou bugs, ouvrir une issue.

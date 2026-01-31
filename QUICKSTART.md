# 🚀 Guide de Démarrage Rapide - ClasseTrack

## Prérequis
- Node.js 18+ 
- Docker & Docker Compose
- Ou MariaDB 10.5+ installé localement

## Installation (5 minutes)

### 1️⃣ Cloner le projet
```bash
cd ClasseTrack
```

### 2️⃣ Installer les dépendances
```bash
npm install
```

### 3️⃣ Lancer MariaDB
```bash
# Avec Docker Compose (recommandé)
docker compose up -d

# Vérifier que MariaDB est actif
docker compose ps
```

### 4️⃣ Configuration environnement
```bash
cp .env.example .env.local
# Les valeurs par défaut fonctionnent si MariaDB est sur localhost
```

### 5️⃣ Initialiser la base de données
```bash
# Créer les tables
npx prisma migrate dev --name init

# Remplir avec des données de test
npx prisma db seed
```

### 6️⃣ Lancer l'application
```bash
npm run dev
```

L'app est maintenant sur `http://localhost:3000` 🎉

---

## 🔐 Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|------------|
| 👨‍💼 Admin | admin@example.com | admin123 |
| 👨‍🏫 Professeur | prof@example.com | prof123 |
| 👨‍🎓 Étudiant 1 | student1@example.com | student123 |
| 👨‍🎓 Étudiant 2 | student2@example.com | student123 |
| 👨‍🎓 Étudiant 3 | student3@example.com | student123 |

---

## ✅ Scénario de Test Complet

### Étape 1: Se connecter comme Admin
1. Aller sur `http://localhost:3000/login`
2. Email: `admin@example.com` / Mot de passe: `admin123`
3. Vérifier que les séances existent déjà (2 créées par seed)

### Étape 2: Se connecter comme Professeur
1. Se déconnecter (bouton en haut à droite)
2. Se reconnecter avec `prof@example.com` / `prof123`
3. Aller dans "Mes Séances"
4. Cliquer sur **"Ouvrir"** une séance (status PLANNED → OPEN)
5. ⭐ **Copier le token QR** affiché en bas (le token change toutes les 3 secondes)

### Étape 3: Se connecter comme Étudiant
1. Se déconnecter
2. Se reconnecter avec `student1@example.com` / `student123`
3. Aller dans "Mes Séances"
4. Cliquer sur **"Scanner un QR"**
5. Sélectionner la séance ouverte par le prof
6. Coller le token QR copié à l'étape 2
7. Cliquer **"Marquer présence"**
8. ✅ Message de succès et présence marquée

### Étape 4: Retour Professeur
1. Se déconnecter et reconnecter en tant que prof
2. Cliquer **"Voir les présences"**
3. ✅ Vérifier que l'étudiant est dans la liste des "Présents"
4. Cliquer **"Clôturer"** pour terminer la séance

---

## 🔧 Commandes Utiles

```bash
# Voir la base de données (studio Prisma)
npm run prisma:studio

# Réinitialiser la base (⚠️ supprime tout)
npx prisma migrate reset

# Relancer le seed seul
npx prisma db seed

# Arrêter MariaDB
docker compose down

# Voir les logs MariaDB
docker compose logs -f mariadb
```

---

## 📁 Structure du Projet

```
ClasseTrack/
├── app/                    # Next.js App Router
│   ├── api/               # Route Handlers API
│   ├── admin/             # Dashboard admin
│   ├── prof/              # Dashboard professeur
│   ├── student/           # Dashboard étudiant
│   ├── login/             # Page login
│   └── layout.tsx         # Layout racine
├── components/             # Composants React réutilisables
├── lib/                    # Utilities (auth, db, validation, QR)
├── prisma/                # ORM configuration
│   ├── schema.prisma      # Modèle données
│   └── seed.ts            # Données initiales
├── public/                # Fichiers statiques
├── docker-compose.yml     # Configuration Docker
├── .env.example           # Modèle variables environnement
├── .gitignore             # Exclusions git
├── package.json           # Dépendances Node
├── tsconfig.json          # Configuration TypeScript
├── tailwind.config.js     # Configuration Tailwind CSS
├── postcss.config.js      # Configuration PostCSS
├── next.config.js         # Configuration Next.js
└── README.md              # Documentation complète
```

---

## 🎯 Fonctionnalités Clés Testées

✅ **Authentification NextAuth** avec RBAC (3 rôles)
✅ **QR Dynamique** : Token change toutes les 3 secondes (HMAC-SHA256)
✅ **Gestion des Absences** : Pointage QR avec validation
✅ **Dashboard Admin** : CRUD complet (user, filière, groupe, module, séances)
✅ **Dashboard Prof** : Gestion séances + QR live + attendance
✅ **Dashboard Étudiant** : Scan + historique + mode offline
✅ **Mode Offline** : Sauvegarde locale + sync reconnexion
✅ **Sécurité** : Hash bcrypt, validation Zod, middleware RBAC

---

## ❌ Dépannage

**Erreur "Connection refused" sur la DB?**
```bash
docker compose up -d  # Relancer MariaDB
docker compose logs mariadb  # Vérifier les logs
```

**Erreur Prisma "Cannot find env"?**
```bash
cp .env.example .env.local
# Éditer DATABASE_URL avec les bonnes infos
```

**Port 3000 occupé?**
```bash
npm run dev -- -p 3001  # Utiliser port 3001
```

**Besoin de reset complet?**
```bash
docker compose down -v  # Supprimer volume DB
docker compose up -d     # Relancer MariaDB
npx prisma migrate reset # Réinitialiser DB
npm run dev
```

---

## 📞 Support

Pour toute question, vérifier:
1. Les logs du terminal
2. Les logs docker: `docker compose logs`
3. Le fichier README.md complet
4. Les erreurs Prisma: `npx prisma diagnose`

Bon développement! 🚀

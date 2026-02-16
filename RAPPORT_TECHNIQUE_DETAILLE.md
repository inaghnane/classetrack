# 📊 ClasseTrack - Rapport Technique Détaillé

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Modèle de Données](#modèle-de-données)
4. [Système d'Authentification](#système-dauthentification)
5. [Fonctionnalités par Rôle](#fonctionnalités-par-rôle)
6. [Système de QR Code Dynamique](#système-de-qr-code-dynamique)
7. [Système de Binding d'Appareil](#système-de-binding-dappareil)
8. [Routes API](#routes-api)
9. [Flux de Données](#flux-de-données)
10. [Technologies et Dépendances](#technologies-et-dépendances)
11. [Configuration et Déploiement](#configuration-et-déploiement)

---

## 🎯 Vue d'ensemble

### Description
**ClasseTrack** est un système complet de gestion des absences universitaires utilisant des QR codes dynamiques pour l'enregistrement des présences. Le système permet une gestion hiérarchique complète des structures académiques (filières, modules, groupes, séances).

### Objectifs principaux
- ✅ Simplifier la prise de présence via QR code sécurisé
- ✅ Prévenir la fraude avec le binding d'appareil
- ✅ Gérer les justificatifs d'absence
- ✅ Fournir des statistiques et rapports (PDF, Excel)
- ✅ Navigation hiérarchique intuitive
- ✅ Support hors ligne avec synchronisation

### Caractéristiques clés
- 🔐 **Sécurité** : QR codes dynamiques avec HMAC-SHA256
- 📱 **Anti-fraude** : Liaison d'appareil unique par étudiant
- ⏱️ **QR Temps réel** : Renouvellement toutes les 3 secondes, validité 5 min
- 📊 **Rapports** : Export PDF et Excel
- 🌐 **Support Cloudflare** : Compatible avec les tunnels Cloudflare
- 💾 **Persistence** : Base MySQL avec Prisma ORM

---

## 🏗️ Architecture Technique

### Stack Technologique

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 14)           │
│  - React 18 (Client Components)         │
│  - TailwindCSS (Styling)                │
│  - NextAuth.js (Auth)                   │
│  - QR Scanner & Generator               │
└─────────────────────────────────────────┘
                   ↓ API Routes
┌─────────────────────────────────────────┐
│      Backend API (Next.js App Router)   │
│  - Route Handlers                       │
│  - Middleware Auth                      │
│  - Business Logic                       │
└─────────────────────────────────────────┘
                   ↓ Prisma Client
┌─────────────────────────────────────────┐
│         Base de Données (MySQL)         │
│  - 11 tables principales                │
│  - Relations complexes                  │
│  - Contraintes d'intégrité             │
└─────────────────────────────────────────┘
```

### Structure du Projet

```
classetrack/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── admin/           # Routes admin
│   │   ├── prof/            # Routes professeur
│   │   ├── student/         # Routes étudiant
│   │   ├── auth/            # NextAuth configuration
│   │   └── me/              # Profil utilisateur
│   ├── admin/               # Interface admin
│   ├── prof/                # Interface professeur
│   ├── student/             # Interface étudiant
│   ├── login/               # Page de connexion
│   ├── layout.tsx           # Layout racine
│   ├── page.tsx             # Page d'accueil (redirection)
│   └── providers.tsx        # SessionProvider
├── components/              # Composants réutilisables
│   ├── Header.tsx           # En-tête avec navigation
│   ├── OfflineSyncBanner.tsx # Bannière mode hors ligne
│   └── ...
├── lib/                     # Logique métier
│   ├── auth.ts              # Configuration NextAuth
│   ├── db.ts                # Client Prisma singleton
│   ├── device.ts            # Gestion device binding
│   ├── qr-generator.ts      # Génération et validation QR
│   ├── validation.ts        # Schémas Zod
│   └── middleware.ts        # Middleware personnalisés
├── prisma/                  # Base de données
│   ├── schema.prisma        # Modèle de données
│   ├── seed.ts              # Données initiales
│   └── migrations/          # Migrations Prisma
├── public/                  # Fichiers statiques
│   └── uploads/             # Fichiers uploadés
│       └── justificatifs/   # Documents justificatifs
└── scripts/                 # Scripts utilitaires
    ├── db-check.js          # Vérification DB
    ├── reset-admin-password.js
    └── ...
```

### Modèle de Routage

**Next.js App Router (RSC)** :
- Pages côté serveur par défaut
- Client Components avec `'use client'`
- API Routes dans `/app/api/`
- Middleware pour l'authentification

---

## 💾 Modèle de Données

### Schéma de Base de Données

#### 1. **user** - Utilisateurs du système
```prisma
model user {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String
  firstName         String
  lastName          String
  name              String?
  role              user_role @default(STUDENT)  // ADMIN, PROF, STUDENT
  deviceId          String?                      // Pour binding appareil
  mustChangePassword Boolean  @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

**Enums** :
- `user_role` : ADMIN, PROF, STUDENT
- `education_level` : L1, L2, L3, M1, M2

#### 2. **filiere** - Filières d'études
```prisma
model filiere {
  id        String   @id
  name      String   @unique              // Ex: "Informatique"
  code      String   @unique              // Ex: "INFO"
  groupes   groupe[]
  modules   module[]
  seances   seance[]
}
```

#### 3. **groupe** - Groupes d'étudiants
```prisma
model groupe {
  id              String   @id
  name            String                  // Ex: "Groupe 1A"
  code            String   @unique        // Ex: "INFO-L3-1A"
  filiereId       String
  filiere         filiere  @relation(...)
  enrollments     enrollment[]            // Étudiants inscrits
  seances         seance[]
}
```

#### 4. **module** - Modules/Cours
```prisma
model module {
  id              String   @id
  name            String                  // Ex: "Web Development"
  code            String   @unique        // Ex: "WEB301"
  filiereId       String
  filiere         filiere  @relation(...)
  seances         seance[]
  professorTeachings professorTeaching[]
}
```

#### 5. **seance** - Séances de cours
```prisma
model seance {
  id        String        @id
  date      DateTime                      // Date de la séance
  startTime String                        // Ex: "09:00"
  endTime   String                        // Ex: "11:00"
  status    seance_status @default(PLANNED)  // PLANNED, OPEN, CLOSED
  qrSecret  String?                       // Secret pour génération QR
  qrFrozen  Boolean       @default(false) // QR figé (ne change pas)
  confirmed Boolean       @default(false) // Prof a confirmé
  filiereId String
  moduleId  String
  groupeId  String
  profId    String?
  attendances attendance[]
  justifications justification[]
}
```

**Cycle de vie d'une séance** :
1. **PLANNED** : Créée, en attente
2. **OPEN** : Ouverte, QR actif, étudiants peuvent scanner
3. **CLOSED** : Fermée, plus de scan possible

#### 6. **professorTeaching** - Prof enseigne Module
```prisma
model professorTeaching {
  profId    String
  moduleId  String
  professor user   @relation(...)
  module    module @relation(...)
  @@unique([profId, moduleId])
}
```

#### 7. **professorAssignment** - Prof assigné à Module+Groupe
```prisma
model professorAssignment {
  profId    String
  moduleId  String
  groupeId  String
  @@unique([profId, moduleId, groupeId])
}
```

#### 8. **enrollment** - Étudiant inscrit dans Groupe
```prisma
model enrollment {
  studentId String
  groupeId  String
  student   user   @relation(...)
  groupe    groupe @relation(...)
  @@unique([studentId, groupeId])
}
```

#### 9. **attendance** - Présences
```prisma
model attendance {
  studentId String
  seanceId  String
  status    attendance_status @default(ABSENT)  // PRESENT, ABSENT, LATE
  @@unique([studentId, seanceId])
}
```

#### 10. **justification** - Justificatifs d'absence
```prisma
model justification {
  id           String
  studentId    String
  seanceId     String
  reason       String               // Raison de l'absence
  fileUrl      String?              // Chemin du fichier PDF/image
  status       justification_status @default(PENDING)  // PENDING, APPROVED, REJECTED
  adminComment String?              // Commentaire du prof
}
```

### Relations Complexes

```
user (STUDENT) ---[enrollment]---> groupe ---[seances]---> seance
                                                               ↓
                                                          attendance
                                                               ↓
                                                          (PRESENT/ABSENT)

user (PROF) ---[professorAssignment]---> module + groupe
                                              ↓
                                           seances
                                              ↓
                                         (Open/Close)

filiere → modules → seances
filiere → groupes → enrollments
```

---

## 🔐 Système d'Authentification

### NextAuth.js Configuration

**Fichier** : `lib/auth.ts`

#### Providers
- **CredentialsProvider** : Authentification email/password

#### Processus d'authentification

1. **Authorize** :
```typescript
async authorize(credentials) {
  // 1. Valider credentials
  if (!credentials?.email || !credentials?.password) return null;
  
  // 2. Récupérer utilisateur
  const user = await prisma.user.findUnique({
    where: { email: credentials.email }
  });
  
  // 3. Vérifier mot de passe
  const passwordMatch = await bcryptjs.compare(
    credentials.password,
    user.passwordHash
  );
  
  // 4. Retourner user avec rôle
  return { id, email, name, role, firstName, lastName };
}
```

2. **JWT Callback** :
```typescript
async jwt({ token, user }) {
  // Ajouter id, role, firstName, lastName au token
  if (user) {
    token.id = user.id;
    token.role = user.role;
    token.firstName = user.firstName;
    token.lastName = user.lastName;
  }
  return token;
}
```

3. **Session Callback** :
```typescript
async session({ session, token }) {
  // Injecter données du token dans session
  session.user.id = token.id;
  session.user.role = token.role;
  session.user.firstName = token.firstName;
  session.user.lastName = token.lastName;
  return session;
}
```

### Stratégie de Session
- **Strategy** : JWT (sans base de données)
- **Max Age** : 24 heures
- **Secret** : `process.env.NEXTAUTH_SECRET`

### Pages personnalisées
- **Sign In** : `/login`
- **Error** : `/login`

### Protection des Routes

#### Côté Client
```typescript
const { data: session, status } = useSession();

if (status === 'loading') return <Loading />;
if (status === 'unauthenticated') router.push('/login');
if (session.user.role !== 'ADMIN') router.push('/login');
```

#### Côté Serveur (API)
```typescript
async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... logique
}
```

### Workflow de Connexion

```
1. User → /login (page)
2. Submit credentials
3. NextAuth.js authorize()
4. Verify password (bcrypt)
5. Create JWT token
6. Store in cookie
7. Redirect to role-based page:
   - ADMIN → /admin
   - PROF → /prof
   - STUDENT → /student
```

---

## 👥 Fonctionnalités par Rôle

### 🔴 ADMIN - Administrateur

**Page** : `/admin`

#### Onglets disponibles

##### 1. **Utilisateurs**
- ✅ Lister tous les utilisateurs
- ✅ Créer un utilisateur (email, nom, prénom, rôle, mot de passe)
- ✅ Modifier un utilisateur
- ✅ Supprimer un utilisateur
- ✅ Réinitialiser le mot de passe
- ✅ Importer en masse (CSV/Excel)

##### 2. **Structure (Filière / Module / Groupe)**
- ✅ Gérer les filières (créer, modifier, supprimer)
- ✅ Gérer les modules par filière
- ✅ Gérer les groupes par filière
- ✅ Navigation hiérarchique

##### 3. **Professeurs**
- ✅ Assigner un professeur à un module (Teaching)
- ✅ Assigner un professeur à un module+groupe (Assignment)
- ✅ Voir les assignations existantes
- ✅ Supprimer les assignations

##### 4. **Étudiants (Enrollments)**
- ✅ Inscrire un étudiant dans un groupe
- ✅ Voir les inscriptions par groupe
- ✅ Supprimer des inscriptions

##### 5. **Séances**
- ✅ Lister toutes les séances
- ✅ Créer une séance (date, heure, filière, module, groupe)
- ✅ Modifier une séance
- ✅ Supprimer une séance
- ✅ Voir le statut et les statistiques

**API Endpoints Admin** :
```
GET    /api/admin/user
POST   /api/admin/user
PUT    /api/admin/user/[id]
DELETE /api/admin/user/[id]
POST   /api/admin/user/[id]/reset-password
POST   /api/admin/user/import

GET    /api/admin/filiere
POST   /api/admin/filiere
PUT    /api/admin/filiere/[id]
DELETE /api/admin/filiere/[id]

(idem pour module, groupe, seance, professor, enrollment)
```

---

### 🟢 PROF - Professeur

**Page** : `/prof`

#### Navigation Hiérarchique (5 niveaux)

```
Niveau 1 : Choisir Filière
    ↓
Niveau 2 : Choisir Module
    ↓
Niveau 3 : Choisir Groupe
    ↓
Niveau 4 : Choisir Séance
    ↓
Niveau 5 : Gérer la Séance
```

#### Fonctionnalités par Niveau

##### Niveau 1-4 : Navigation
- ✅ Vue en cartes des options disponibles
- ✅ Breadcrumb pour navigation rapide
- ✅ Statistiques sur chaque carte
- ✅ Filtres et recherche

##### Niveau 5 : Gestion de Séance

**Quand séance = PLANNED** :
- ✅ **Ouvrir** la séance → génère QR secret → statut OPEN
- ✅ Voir les détails (date, heure, module, groupe)

**Quand séance = OPEN** :
- ✅ **Afficher le QR code** dynamique (renouvellement automatique toutes les 3s)
- ✅ **Figer le QR** si besoin (qrFrozen = true)
- ✅ **Prolonger** la séance (extend)
- ✅ **Marquer présent manuellement** (par ID étudiant)
- ✅ **Voir les présences en temps réel**
- ✅ **Fermer** la séance → statut CLOSED

**Quand séance = CLOSED** :
- ✅ **Liste finale des présences**
- ✅ **Export PDF** : rapport complet avec statistiques
- ✅ **Export Excel** : fichier .xlsx avec liste des présences
- ✅ **Statistiques** : présents, absents, retards
- ✅ **Confirmer** la séance (confirmed = true)

#### Justificatifs
- ✅ Voir tous les justificatifs soumis (onglet séparé)
- ✅ Approuver/Rejeter avec commentaire
- ✅ Télécharger le fichier joint
- ✅ Filtrer par statut (PENDING, APPROVED, REJECTED)

#### Création de Séance
- ✅ Bouton "Créer une séance"
- ✅ Formulaire : date, heure début, heure fin
- ✅ Sélection : filière → module → groupe
- ✅ Assignation automatique du prof

#### Statistiques d'Absence
- ✅ Par groupe : taux d'absence global
- ✅ Par étudiant : nombre d'absences
- ✅ Export des statistiques

**API Endpoints Prof** :
```
GET  /api/prof/hierarchy              # Arbre complet
GET  /api/prof/seances                # Mes séances
GET  /api/prof/seances/create         # Données pour création
POST /api/prof/seances/create         # Créer séance

POST /api/prof/seances/[id]/open      # Ouvrir
POST /api/prof/seances/[id]/close     # Fermer
POST /api/prof/seances/[id]/confirm   # Confirmer
POST /api/prof/seances/[id]/freeze    # Figer QR
POST /api/prof/seances/[id]/extend    # Prolonger
POST /api/prof/seances/[id]/mark-present  # Marquer présent manuellement

GET  /api/prof/seances/[id]/attendance        # Liste présences
GET  /api/prof/seances/[id]/export-pdf        # Télécharger PDF
GET  /api/prof/seances/[id]/export-attendance # Télécharger Excel

GET  /api/prof/justification                  # Liste justificatifs
GET  /api/prof/groupe/[id]/absence-stats      # Statistiques
```

---

### 🔵 STUDENT - Étudiant

**Page** : `/student`

#### Onglets disponibles

##### 1. **Modules & Séances**
- ✅ Vue hiérarchique : Filière → Modules → Séances
- ✅ Navigation par arborescence
- ✅ Voir les séances de chaque module
- ✅ Statut de chaque séance (PLANNED, OPEN, CLOSED)
- ✅ Indication présence/absence

##### 2. **Scanner QR**
- ✅ Bouton pour scanner le QR
- ✅ Activation de la caméra
- ✅ Scanner le QR affiché par le prof
- ✅ Validation du token
- ✅ Enregistrement automatique de la présence
- ✅ Message de confirmation

**Processus de scan** :
```
1. Étudiant clique "Scanner QR" pour une séance OPEN
2. Caméra s'active
3. Scanner le QR code affiché
4. Token extrait du QR
5. POST /api/student/scan avec { seanceId, token, deviceId }
6. Validation côté serveur :
   - Vérifier device binding
   - Vérifier enrollment
   - Valider token HMAC
   - Vérifier séance OPEN
   - Créer attendance PRESENT
7. Confirmation affichée
```

##### 3. **Mes Présences**
- ✅ Historique de toutes les présences
- ✅ Filtrage par date, module
- ✅ Voir les absences
- ✅ Statistiques personnelles

##### 4. **Justificatifs**
- ✅ Voir toutes les absences non justifiées
- ✅ **Soumettre un justificatif** :
  - Sélectionner la séance
  - Saisir une raison
  - Uploader un fichier (PDF, image)
  - Envoyer
- ✅ Voir l'état des justificatifs :
  - PENDING : En attente
  - APPROVED : Approuvé par le prof
  - REJECTED : Rejeté avec commentaire
- ✅ Télécharger le fichier soumis

**API Endpoints Student** :
```
GET  /api/student/hierarchy        # Mon arbre (filière, modules, séances)
GET  /api/student/seances          # Mes séances
POST /api/student/scan             # Scanner QR

GET  /api/student/attendance       # Mes présences
POST /api/student/validate-device  # Valider device

GET  /api/student/justification    # Mes justificatifs
POST /api/student/justification    # Soumettre justificatif
```

---

## 🔒 Système de QR Code Dynamique

### Principe

Le QR code change **toutes les 3 secondes** mais reste **valide pendant 5 minutes**.

### Implémentation

**Fichier** : `lib/qr-generator.ts`

#### Génération du Token

```typescript
export function generateQRToken(seanceId: string, qrSecret: string): string {
  const WINDOW_SIZE_MS = 3000;  // 3 secondes
  
  // 1. Calculer la fenêtre temporelle actuelle
  const now = Date.now();
  const epochWindow = Math.floor(now / WINDOW_SIZE_MS);
  
  // 2. Créer le message à signer
  const message = `${seanceId}|${epochWindow}`;
  
  // 3. Générer HMAC-SHA256
  const hmac = crypto
    .createHmac('sha256', qrSecret)
    .update(message)
    .digest('hex');
  
  // 4. Créer le token
  const token = `${seanceId}.${epochWindow}.${hmac}`;
  
  // 5. Encoder en base64
  return Buffer.from(token).toString('base64');
}
```

**Format du token** : `base64(seanceId.epochWindow.hmac)`

**Exemple** :
```
seanceId: "cm12abc..."
epochWindow: 12345678
qrSecret: "a1b2c3d4e5..."

token = base64("cm12abc....12345678.34fa5d6e...")
```

#### Validation du Token

```typescript
export function validateQRToken(
  token: string,
  seanceId: string,
  qrSecret: string
): boolean {
  const WINDOW_SIZE_MS = 3000;
  const VALIDITY_DURATION_MS = 5 * 60 * 1000;  // 5 minutes
  const MAX_WINDOW_OFFSET = Math.floor(VALIDITY_DURATION_MS / WINDOW_SIZE_MS);  // ±100 fenêtres
  
  // 1. Décoder le token
  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  const [tokenSeanceId, tokenWindow, tokenHmac] = decoded.split('.');
  
  // 2. Vérifier seanceId
  if (tokenSeanceId !== seanceId) return false;
  
  // 3. Vérifier validité temporelle (±100 fenêtres = 5 min)
  const currentWindow = Math.floor(Date.now() / WINDOW_SIZE_MS);
  const windowNum = parseInt(tokenWindow, 10);
  if (Math.abs(currentWindow - windowNum) > MAX_WINDOW_OFFSET) {
    return false;  // Token expiré
  }
  
  // 4. Recalculer HMAC pour vérifier intégrité
  const message = `${seanceId}|${tokenWindow}`;
  const expectedHmac = crypto
    .createHmac('sha256', qrSecret)
    .update(message)
    .digest('hex');
  
  // 5. Comparer les HMAC
  return tokenHmac === expectedHmac;
}
```

### Sécurité

#### Avantages
- ✅ **Impossible à copier** : Token change toutes les 3s
- ✅ **Validité limitée** : 5 minutes max
- ✅ **Intégrité garantie** : HMAC-SHA256
- ✅ **Pas rejouable** : Une seule présence par séance

#### Secret QR
```typescript
export function generateQRSecret(): string {
  return crypto.randomBytes(32).toString('hex');  // 64 caractères hex
}
```

Généré lors de l'ouverture de la séance, stocké dans `seance.qrSecret`.

### QR Figé (Frozen)

Si le prof active **qrFrozen** :
- Le QR ne change plus
- Même token affiché en permanence
- Utile pour les salles sans projecteur (imprimer QR)

### Cycle de Vie du QR

```
1. Séance PLANNED → Pas de QR
2. Prof ouvre séance → générer qrSecret → statut OPEN
3. QR affiché et renouvelé toutes les 3s
4. Étudiants scannent
5. Prof ferme séance → statut CLOSED → QR désactivé
```

---

## 📱 Système de Binding d'Appareil

### Principe

Chaque étudiant ne peut utiliser son compte que sur **un seul appareil** pour éviter le partage de compte et la fraude.

### Implémentation

**Fichier** : `lib/device.ts`

#### Génération du Device ID

```typescript
export function generateDeviceId(): string {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();  // UUID v4
  }
  return 'device-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}
```

#### Storage Local

```typescript
export function getOrCreateDeviceId(): string {
  // 1. Tenter de récupérer depuis localStorage
  let deviceId = localStorage.getItem('deviceId');
  
  // 2. Si absent, générer et stocker
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('deviceId', deviceId);
  }
  
  return deviceId;
}
```

**Persistance** : LocalStorage du navigateur

#### Validation de l'Accès

```typescript
export function validateDeviceAccess(
  userDeviceId: string | null,
  currentDeviceId: string
): { allowed: boolean; message: string } {
  
  // Cas 1 : Première connexion (userDeviceId = null)
  if (!userDeviceId) {
    return {
      allowed: true,
      message: 'Device lié à ce compte',
    };
  }
  
  // Cas 2 : Même appareil
  if (userDeviceId === currentDeviceId) {
    return {
      allowed: true,
      message: 'Appareil autorisé',
    };
  }
  
  // Cas 3 : Appareil différent = REFUSÉ
  return {
    allowed: false,
    message: 'Cet appareil n\'est pas autorisé. Ce compte a été enregistré sur un autre appareil.',
  };
}
```

### Workflow

```
1. Étudiant se connecte sur appareil A
2. Device ID généré : "abc-123-def"
3. POST /api/student/validate-device { deviceId: "abc-123-def" }
4. Si user.deviceId = null → lier → UPDATE user SET deviceId = "abc-123-def"
5. Étudiant peut scanner QR

---

6. Tentative de connexion sur appareil B
7. Device ID différent : "xyz-789-ghi"
8. POST /api/student/validate-device { deviceId: "xyz-789-ghi" }
9. user.deviceId = "abc-123-def" ≠ "xyz-789-ghi"
10. REFUSÉ : "Cet appareil n'est pas autorisé"
```

### Validation lors du Scan QR

**Fichier** : `app/api/student/scan/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { seanceId, token, deviceId } = await request.json();
  
  // Récupérer l'étudiant
  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });
  
  // Vérifier device binding
  if (deviceId && student?.deviceId) {
    const validation = validateDeviceAccess(student.deviceId, deviceId);
    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.message },
        { status: 403 }
      );
    }
  }
  
  // ... suite de la logique scan
}
```

### Reset du Device

- **Admin** peut réinitialiser `user.deviceId` à `null`
- Permet à l'étudiant de se reconnecter sur un nouvel appareil
- Utile si appareil perdu/changé

---

## 🌐 Routes API

### Structure des Routes

```
/api/
├── auth/                       # NextAuth.js
│   └── [...nextauth]/route.ts  # Configuration auth
├── me/                         # Profil utilisateur
│   └── route.ts                # GET
├── admin/                      # Routes admin
│   ├── user/
│   │   ├── route.ts            # GET, POST
│   │   ├── [id]/
│   │   │   ├── route.ts        # PUT, DELETE
│   │   │   └── reset-password/
│   │   │       └── route.ts    # POST
│   │   └── import/
│   │       └── route.ts        # POST (CSV/Excel)
│   ├── filiere/...
│   ├── module/...
│   ├── groupe/...
│   ├── seance/...
│   ├── professor/...           # Teaching & Assignment
│   └── enrollment/...
├── prof/                       # Routes professeur
│   ├── hierarchy/
│   │   └── route.ts            # GET (arbre complet)
│   ├── seances/
│   │   ├── route.ts            # GET (liste)
│   │   ├── create/
│   │   │   └── route.ts        # GET, POST
│   │   └── [id]/
│   │       ├── open/           # POST
│   │       ├── close/          # POST
│   │       ├── confirm/        # POST
│   │       ├── freeze/         # POST
│   │       ├── extend/         # POST
│   │       ├── mark-present/   # POST
│   │       ├── attendance/     # GET
│   │       ├── export-pdf/     # GET
│   │       └── export-attendance/ # GET (Excel)
│   ├── justification/
│   │   └── route.ts            # GET
│   ├── groupe/
│   │   └── [id]/
│   │       └── absence-stats/  # GET
│   └── filieres/...
└── student/                    # Routes étudiant
    ├── hierarchy/
    │   └── route.ts            # GET (mon arbre)
    ├── seances/
    │   └── route.ts            # GET
    ├── scan/
    │   └── route.ts            # POST (scanner QR)
    ├── attendance/
    │   └── route.ts            # GET
    ├── validate-device/
    │   └── route.ts            # POST
    └── justification/
        └── route.ts            # GET, POST
```

### Exemple de Route API

**Fichier** : `app/api/student/scan/route.ts`

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateQRToken } from '@/lib/qr-generator';
import { validateDeviceAccess } from '@/lib/device';

export async function POST(request: NextRequest) {
  // 1. Vérifier authentification
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 2. Parser le body
  const { seanceId, token, deviceId } = await request.json();
  const studentId = session.user.id;
  
  // 3. Récupérer l'étudiant
  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });
  
  // 4. Valider device binding
  if (deviceId && student?.deviceId) {
    const validation = validateDeviceAccess(student.deviceId, deviceId);
    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.message },
        { status: 403 }
      );
    }
  }
  
  // 5. Récupérer la séance
  const seance = await prisma.seance.findUnique({
    where: { id: seanceId },
    include: { groupe: true },
  });
  
  if (!seance || seance.status !== 'OPEN') {
    return NextResponse.json(
      { error: 'Seance not found or not open' },
      { status: 404 }
    );
  }
  
  // 6. Vérifier enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_groupeId: { studentId, groupeId: seance.groupeId }
    },
  });
  
  if (!enrollment) {
    return NextResponse.json(
      { error: 'Student not in this group' },
      { status: 403 }
    );
  }
  
  // 7. Vérifier si déjà marqué présent
  const existing = await prisma.attendance.findUnique({
    where: {
      studentId_seanceId: { studentId, seanceId }
    },
  });
  
  if (existing) {
    return NextResponse.json(
      { error: 'Already marked for this seance' },
      { status: 400 }
    );
  }
  
  // 8. Valider le token QR
  if (!seance.qrSecret) {
    return NextResponse.json(
      { error: 'QR not generated' },
      { status: 400 }
    );
  }
  
  const isValid = validateQRToken(token, seanceId, seance.qrSecret);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid or expired QR token' },
      { status: 400 }
    );
  }
  
  // 9. Créer l'attendance
  const attendance = await prisma.attendance.create({
    data: {
      studentId,
      seanceId,
      status: 'PRESENT',
    },
    include: {
      student: {
        select: { email: true, firstName: true, lastName: true },
      },
      seance: {
        select: { id: true },
      },
    },
  });
  
  // 10. Lier device si première fois
  if (!student?.deviceId && deviceId) {
    await prisma.user.update({
      where: { id: studentId },
      data: { deviceId },
    });
  }
  
  // 11. Retourner succès
  return NextResponse.json(attendance, { status: 201 });
}
```

### Headers CORS

Pour compatibilité Cloudflare :

```typescript
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}
```

---

## 🔄 Flux de Données

### 1. Flux d'Authentification

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/auth/signin
     │ { email, password }
     ↓
┌─────────────────┐
│ NextAuth.js     │
│ authorize()     │
└────┬────────────┘
     │ Verify password (bcrypt)
     ↓
┌─────────────────┐
│ Prisma → MySQL  │
│ findUnique      │
└────┬────────────┘
     │ user found
     ↓
┌─────────────────┐
│ JWT Token       │
│ (role, id)      │
└────┬────────────┘
     │ Set cookie
     ↓
┌──────────┐
│  Client  │
│ Redirect │
└──────────┘
```

### 2. Flux de Scan QR (Étudiant)

```
┌──────────────┐
│   Étudiant   │
│   /student   │
└──────┬───────┘
       │ Click "Scanner QR"
       ↓
┌──────────────┐
│   Camera     │
│   QR Scanner │
└──────┬───────┘
       │ Scan QR → extract token
       ↓
┌──────────────┐
│ POST /api/   │
│ student/scan │
│ { seanceId,  │
│   token,     │
│   deviceId } │
└──────┬───────┘
       │
       ↓
┌──────────────────────────┐
│ 1. Auth check (student)  │
│ 2. Device validation     │
│ 3. Enrollment check      │
│ 4. Seance status = OPEN? │
│ 5. Already present?      │
│ 6. Validate QR token     │
│    (HMAC + timestamp)    │
│ 7. Create attendance     │
│    status = PRESENT      │
└──────┬───────────────────┘
       │
       ↓
┌──────────────┐
│   Success    │
│ "Présence    │
│  enregistrée"│
└──────────────┘
```

### 3. Flux d'Ouverture de Séance (Prof)

```
┌──────────────┐
│ Professeur   │
│   /prof      │
└──────┬───────┘
       │ Navigate: Filière → Module → Groupe → Séance
       ↓
┌──────────────┐
│ Séance       │
│ status:      │
│ PLANNED      │
└──────┬───────┘
       │ Click "Ouvrir"
       ↓
┌──────────────┐
│ POST /api/   │
│ prof/seances │
│ /[id]/open   │
└──────┬───────┘
       │
       ↓
┌──────────────────────────┐
│ 1. Auth check (prof)     │
│ 2. Verify assignment     │
│ 3. Generate qrSecret     │
│ 4. Update seance:        │
│    status = OPEN         │
│    qrSecret = xxx        │
│    profId = currentProf  │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────┐
│ QR Code affiché      │
│ (renouvelé toutes    │
│  les 3 secondes)     │
└──────────────────────┘
```

### 4. Flux de Justificatif (Étudiant)

```
┌──────────────┐
│   Étudiant   │
└──────┬───────┘
       │ Voir absence
       │ Click "Justifier"
       ↓
┌──────────────┐
│   Formulaire │
│ - Raison     │
│ - Fichier    │
└──────┬───────┘
       │ Submit
       ↓
┌──────────────┐
│ POST /api/   │
│ student/     │
│ justification│
│ (multipart)  │
└──────┬───────┘
       │
       ↓
┌────────────────────────┐
│ 1. Upload file         │
│    → /uploads/         │
│       justificatifs/   │
│ 2. Create justification│
│    status = PENDING    │
└──────┬─────────────────┘
       │
       ↓
┌──────────────┐
│ Confirmation │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Professeur  │
│  Voir liste  │
│  justificatifs│
└──────┬───────┘
       │ Approve/Reject
       ↓
┌──────────────┐
│ Update       │
│ status       │
│ APPROVED/    │
│ REJECTED     │
└──────────────┘
```

### 5. Flux d'Export PDF (Prof)

```
┌──────────────┐
│ Professeur   │
└──────┬───────┘
       │ Séance CLOSED
       │ Click "Export PDF"
       ↓
┌──────────────┐
│ GET /api/    │
│ prof/seances │
│ /[id]/       │
│ export-pdf   │
└──────┬───────┘
       │
       ↓
┌────────────────────────┐
│ 1. Fetch seance data   │
│ 2. Fetch attendance    │
│ 3. Generate PDF        │
│    (pdfkit)            │
│ 4. Return file stream  │
└──────┬─────────────────┘
       │
       ↓
┌──────────────┐
│ Download     │
│ "seance-     │
│  {id}.pdf"   │
└──────────────┘
```

---

## 🛠️ Technologies et Dépendances

### Frontend

| Package | Version | Usage |
|---------|---------|-------|
| next | ^14.0.0 | Framework React avec SSR/SSG |
| react | ^18.2.0 | Bibliothèque UI |
| react-dom | ^18.2.0 | Rendu DOM |
| next-auth | ^4.24.13 | Authentification |
| @yudiel/react-qr-scanner | ^1.2.10 | Scanner QR code |
| qrcode.react | ^3.2.0 | Génération QR code |
| tailwindcss | ^3.4.1 | Framework CSS |

### Backend

| Package | Version | Usage |
|---------|---------|-------|
| @prisma/client | ^5.22.0 | ORM pour MySQL |
| prisma | 5.22.0 | CLI Prisma |
| bcryptjs | ^3.0.3 | Hachage mot de passe |
| mysql2 | ^3.16.2 | Driver MySQL |
| zod | ^3.22.4 | Validation de schemas |
| crypto | ^1.0.1 | Cryptographie (HMAC) |

### Utilitaires

| Package | Version | Usage |
|---------|---------|-------|
| pdfkit | ^0.17.2 | Génération PDF |
| xlsx | ^0.18.5 | Export Excel |
| typescript | ^5.3.3 | Typage statique |
| ts-node | ^10.9.2 | Exécution scripts TS |

### Configuration

**TypeScript** : `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "ES2017"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./*"]
    },
    "strict": true,
    "skipLibCheck": true
  }
}
```

**TailwindCSS** : `tailwind.config.js`
```js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**Next.js** : `next.config.js`
```js
module.exports = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json'
  },
};
```

---

## ⚙️ Configuration et Déploiement

### Variables d'Environnement

**Fichier** : `.env.local`

```env
# Database
DATABASE_URL="mysql://root@127.0.0.1:3306/classetrack"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-aleatoire-tres-long-et-securise"

# Cloudflare (optionnel)
# NEXTAUTH_URL="https://xxxxx.trycloudflare.com"
```

### Installation

#### 1. Cloner et installer dépendances
```bash
git clone <repo>
cd classetrack
npm install
```

#### 2. Configurer la base de données
```bash
# Créer la base
mysql -u root -p
CREATE DATABASE classetrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### 3. Configurer `.env.local`
```bash
cp .env.example .env.local
# Éditer .env.local avec vos valeurs
```

#### 4. Appliquer les migrations
```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### 5. Seed la base de données
```bash
npx prisma db seed
```

Crée 3 utilisateurs par défaut :
- admin@gmail.com / Admin@12345 (ADMIN)
- prof@classetrack.com / Prof@12345 (PROF)
- student@classetrack.com / Student@12345 (STUDENT)

#### 6. Lancer le serveur de développement
```bash
npm run dev
```

Application disponible sur : http://localhost:3000

### Scripts NPM

```json
{
  "dev": "next dev",                    // Serveur de dev
  "build": "next build",                // Build production
  "start": "next start",                // Serveur production
  "lint": "next lint",                  // Linter
  "db:push": "prisma db push",          // Push schema
  "db:migrate": "prisma migrate dev",   // Créer migration
  "db:reset": "prisma migrate reset",   // Reset DB
  "db:seed": "prisma db seed",          // Seed données
  "db:studio": "prisma studio",         // GUI Prisma
  "db:check": "node scripts/db-check.js",
  "reset:admin": "node scripts/reset-admin-password.js"
}
```

### Déploiement Production

#### Option 1 : Serveur Node.js

```bash
# Build
npm run build

# Lancer
npm start
```

#### Option 2 : Docker

**Fichier** : `docker-compose.yml` (fourni)

```bash
docker-compose up -d
```

#### Option 3 : Vercel

```bash
vercel deploy
```

**Configuration Vercel** :
- Framework Preset : Next.js
- Root Directory : `.`
- Node Version : 18.x
- Environment Variables : Ajouter `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

### Support Cloudflare Tunnel

Pour tester en local avec une URL publique :

```bash
# Installer cloudflared
# Windows: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

# Lancer tunnel
cloudflared tunnel --url http://localhost:3000

# Mettre à jour NEXTAUTH_URL dans .env.local
NEXTAUTH_URL="https://xxxxx.trycloudflare.com"
```

Headers CORS déjà configurés dans les routes API.

---

## 📊 Diagrammes

### Architecture Générale

```
┌─────────────────────────────────────────────────────────┐
│                    CLASSETRACK SYSTEM                    │
└─────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │     │   Browser    │     │   Browser    │
│   (Admin)    │     │   (Prof)     │     │  (Student)   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       │ HTTPS              │ HTTPS               │ HTTPS
       │                    │                     │
       └────────────────────┼─────────────────────┘
                            ↓
            ┌───────────────────────────────┐
            │     Next.js Application       │
            │  ┌─────────────────────────┐  │
            │  │   App Router (RSC)      │  │
            │  │  - Pages                │  │
            │  │  - API Routes           │  │
            │  │  - Middleware           │  │
            │  └─────────────────────────┘  │
            │  ┌─────────────────────────┐  │
            │  │   Business Logic        │  │
            │  │  - QR Generator         │  │
            │  │  - Device Binding       │  │
            │  │  - Validation           │  │
            │  └─────────────────────────┘  │
            └───────────────┬───────────────┘
                            │ Prisma Client
                            ↓
            ┌───────────────────────────────┐
            │      MySQL Database           │
            │  - 11 tables                  │
            │  - Relations & Constraints    │
            └───────────────────────────────┘
```

### Flux QR Code

```
PROFESSEUR                           SYSTÈME                           ÉTUDIANT

  Ouvrir séance
      │
      ├──► POST /api/prof/seances/[id]/open
      │                                  │
      │                            Générer qrSecret
      │                                  │
      │                            status = OPEN
      │                                  │
      │    ◄──────────────────────── qrSecret
      │
  Afficher QR
  (renouveler 3s)
      │                                                               Scanner QR
      │                                                                    │
      │                                                      Extract token (base64)
      │                                                                    │
      │                       POST /api/student/scan ◄────────────────────┘
      │                                  │  { seanceId, token, deviceId }
      │                                  │
      │                            Valider device
      │                                  │
      │                         Vérifier enrollment
      │                                  │
      │                         Valider QR token (HMAC)
      │                                  │
      │                         Créer attendance PRESENT
      │                                  │
      │                       ──────────────────────────► Confirmation
      │
  Fermer séance
      │
      ├──► POST /api/prof/seances/[id]/close
      │                                  │
      │                            status = CLOSED
      │                                  │
      │    ◄──────────────────────── Success
      │
  Export PDF
      │
      ├──► GET /api/prof/seances/[id]/export-pdf
      │                                  │
      │                            Générer PDF (pdfkit)
      │                                  │
      │    ◄──────────────────────── File stream
      │
  Download
```

---

## 🔍 Points Techniques Importants

### 1. Gestion des Erreurs
- Toutes les routes API retournent des erreurs structurées
- Codes HTTP appropriés (401, 403, 404, 500)
- Messages d'erreur clairs pour le débogage

### 2. Validation des Données
- **Zod** pour validation côté serveur
- Schémas définis dans `lib/validation.ts`
- Validation avant insertion en DB

### 3. Optimisations
- **Prisma** : Includes sélectifs pour éviter overfetching
- **Next.js** : Static Generation quand possible
- **Images** : Optimisation automatique Next.js
- **Client Components** : Uniquement quand nécessaire (interactivité)

### 4. Sécurité
- ✅ Hachage bcrypt pour mots de passe
- ✅ HMAC-SHA256 pour QR codes
- ✅ JWT pour sessions (NextAuth)
- ✅ Validation device binding
- ✅ CORS headers pour Cloudflare
- ✅ Protection CSRF (NextAuth)
- ✅ Contraintes DB (unique, foreign keys)

### 5. Performance
- **Connection pooling** : Prisma gère automatiquement
- **Singleton** : Un seul Prisma Client (`lib/db.ts`)
- **Indexes** : Sur colonnes fréquemment recherchées
- **Cascade deletes** : Nettoyage automatique

### 6. Extensibilité
- Architecture modulaire
- Séparation des concerns (lib/, components/, app/)
- Types TypeScript pour auto-complétion
- API REST standard (facile à documenter/intégrer)

---

## 📝 Conclusion

**ClasseTrack** est un système complet et robuste de gestion des absences universitaires. Il combine :

- ✅ **Sécurité avancée** : QR dynamiques, device binding, HMAC
- ✅ **Expérience utilisateur** : Navigation intuitive, temps réel, responsive
- ✅ **Gestion complète** : Hiérarchie académique, justificatifs, statistiques
- ✅ **Technologies modernes** : Next.js 14, Prisma, React 18, TypeScript
- ✅ **Production-ready** : Error handling, validation, optimisations

Le système est extensible et peut facilement accueillir de nouvelles fonctionnalités (notifications, analytics, mobile app, etc.).

---

**Généré le** : 16 février 2026  
**Version** : 1.0.0  
**Auteur** : GitHub Copilot

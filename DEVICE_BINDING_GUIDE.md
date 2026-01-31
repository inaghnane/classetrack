# 🔒 Device Binding - Restriction d'appareil par étudiant

## Vue d'ensemble

Le système **Device Binding** empêche la triche en limitant chaque compte étudiant à un **seul appareil** (téléphone, tablette ou ordinateur).

**Objectif:** Éviter qu'un étudiant partage ses identifiants avec un ami qui pourrait scanner depuis un autre endroit.

## 🚀 Fonctionnement

### 1. Premier login d'un étudiant
```
Étudiant se connecte avec email/password
→ Device ID unique généré et stocké en localStorage
→ Vérifié et lié au compte dans la base de données
→ Accès autorisé ✅
```

### 2. Tentative de login depuis un autre appareil
```
Même étudiant se connecte depuis phone différent
→ Device ID différent généré
→ Vérifié contre le Device ID lié au compte
→ Mismatch détecté
→ Accès refusé ❌
Message: "Cet appareil n'est pas autorisé..."
```

### 3. Scan QR code avec validation
```
Étudiant scanne le QR code
→ Device ID envoyé avec le scan
→ Vérifié contre le compte
→ Si OK: présence marquée ✅
→ Si pas OK: erreur d'accès ❌
```

## 📁 Fichiers modifiés/créés

```
prisma/schema.prisma [MODIFIÉ]
├─ Ajout: deviceId String? @db.VarChar(100)
└─ Utilisé pour tracker l'appareil autorisé

src/lib/device.ts [AMÉLIORÉ]
├─ getOrCreateDeviceId() - Créer ou récupérer l'ID
├─ validateDeviceAccess() - Vérifier si appareil autorisé
└─ Helper functions

app/login/page.tsx [MODIFIÉ]
├─ Import: getOrCreateDeviceId
├─ Ajout: Validation device après login
├─ Pour étudiants: Vérifie restriction

app/student/page.tsx [MODIFIÉ]
├─ Import: getOrCreateDeviceId
├─ Ajout: deviceId state
├─ Envoi: deviceId lors du scan

app/api/student/validate-device/route.ts [CRÉÉ]
├─ Endpoint: POST /api/student/validate-device
├─ Valide l'appareil après login
├─ Lie l'appareil si première connexion

app/api/student/scan/route.ts [MODIFIÉ]
├─ Ajout: Validation device lors du scan
├─ Bloque si appareil non autorisé
```

## 🔐 Sécurité

### Device ID Storage
```javascript
// Client side (localStorage)
deviceId = "550e8400-e29b-41d4-a716-446655440000"

// Backend (MySQL)
UPDATE user SET deviceId = '550e8400-e29b-41d4-a716-446655440000'
WHERE id = 'student123'
```

### Protection contre
- ✅ Partage de compte (même email/password depuis téléphone différent)
- ✅ Usurpation d'identité (quelqu'un d'autre utilise le compte)
- ✅ Triche (l'ami ne peut pas scanner à la place)

### Pas de protection contre
- ⚠️ Quelqu'un utilisant le même téléphone (partage de device)
- ⚠️ Compte utilisateur compromis (hacking du password)
- ⚠️ Collusion (prof + étudiant de mèche)

## 🧪 Scénarios de test

### Scénario 1: Utilisation légitime
```
1. Étudiant A se connecte sur Samsung
   → Device ID créé et lié
   → Accès ✅

2. Étudiant A scanne le QR
   → Device ID vérifié
   → Présence marquée ✅

3. Étudiant A se reconecte
   → Même Device ID
   → Accès ✅
```

### Scénario 2: Tentative d'usurpation
```
1. Étudiant A se connecte sur Samsung
   → Device ID: AAA
   → Lié au compte

2. Ami de A essaie se connecter sur iPhone avec email/password d'A
   → Device ID généré: BBB
   → Vérifie: AAA ≠ BBB
   → Accès refusé ❌
   → Message d'erreur
```

### Scénario 3: Changement légitime d'appareil
```
Étudiant A perd son téléphone:

Solution 1: Admin change deviceId
  → Admin: sqlite3 classetrack.db
  → UPDATE user SET deviceId = NULL WHERE id = 'A'
  → Réinitialise la restriction
  → Prochain login lie le nouveau device

Solution 2: Demander au prof
  → Prof contacte admin
  → Admin réinitialise
```

## 📊 Base de données

### Champ ajouté à `user`
```sql
ALTER TABLE user ADD COLUMN deviceId VARCHAR(100) NULL;
```

### Exemple de données
```sql
-- Étudiant A lié à Samsung
user_id: "student123"
email: "studentA@example.com"
deviceId: "550e8400-e29b-41d4-a716-446655440000"

-- Étudiant B lié à iPhone
user_id: "student456"
email: "studentB@example.com"
deviceId: "660e8400-e29b-41d4-a716-446655440001"

-- Nouveau prof (pas de restriction)
user_id: "prof789"
email: "prof@example.com"
deviceId: NULL  -- Null pour profs/admins
```

## 🔌 API Endpoints

### 1. Valider l'appareil après login
**POST** `/api/student/validate-device`

```bash
curl -X POST http://localhost:3000/api/student/validate-device \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student123",
    "deviceId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

Response (200 OK):
```json
{
  "allowed": true,
  "message": "Device lié à ce compte",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Response (403 Forbidden):
```json
{
  "error": "Cet appareil n'est pas autorisé. Ce compte a été enregistré sur un autre appareil.",
  "previousDevice": "550e8400-e29b-41d4-a716-446655440000",
  "currentDevice": "aa0e8400-e29b-41d4-a716-446655440099"
}
```

## 🎯 Flux complet d'authentification

```
1. PAGE LOGIN
   ├─ Utilisateur saisit email/password
   ├─ Appelle signIn() NextAuth
   └─ Si OK → étape 2

2. VÉRIFICATION DEVICE (pour étudiants)
   ├─ Récupère deviceId du localStorage
   ├─ Appelle /api/student/validate-device
   ├─ Si appareil lié:
   │  ├─ Vérifie matching
   │  ├─ Si OK → étape 3
   │  └─ Si KO → ACCÈS REFUSÉ
   └─ Si pas lié:
      ├─ Lie le device
      └─ Étape 3

3. REDIRECTION
   ├─ Utilisateur redirigé selon role
   ├─ PROF/ADMIN → pas de restriction
   └─ STUDENT → restriction en place
```

## 💾 Configuration

### Réinitialiser un device (pour admin)

**Cas:** Étudiant a perdu son téléphone et besoin d'accès depuis nouveau device

```bash
# Via Prisma Studio
npx prisma studio

# Rechercher l'utilisateur
# Mettre deviceId = NULL
# Sauvegarder

# Étudiant peut maintenant:
# 1. Se reconnecter
# 2. Nouveau device sera lié automatiquement
```

### Logs pour debugging

```bash
# Voir les tentatives de connexion
grep "DEVICE-VALIDATE" server.log

# Voir les tentatives de scan
grep "DEVICE-VALIDATE" server.log | grep "scan"
```

## ✨ Avantages

✅ **Simple à implémenter** - Basé sur localStorage + deviceId  
✅ **Transparente pour utilisateur** - Fonctionne automatiquement  
✅ **Scalable** - Fonctionne avec 1000s d'utilisateurs  
✅ **Compatible Cloudflare** - CORS headers présents  
✅ **Flexible** - Admin peut réinitialiser si nécessaire  

## ⚠️ Limitations

- Ne protège pas contre quelqu'un utilisant le MÊME téléphone
- Ne protège pas si device est volé (avec localStorage accessible)
- Ne protège pas contre password compromise
- localStorage peut être vidé par l'utilisateur

## 🚀 Futur (optionnel)

- ⏳ Device fingerprinting avancé (navigateur, OS version)
- ⏳ Notifications si login depuis nouvel appareil
- ⏳ Multiple devices approuvés (avec confirmation)
- ⏳ Biométrie (fingerprint/face recognition)

## 🎓 Utilisation en classe

**Avant Device Binding:**
```
Prof: "OK classe, vous devez scanner le QR"
Étudiant A: "Je vais donner mon password à mon ami"
Ami: Se connecte sur le compte + scanne ❌ TRICHE
```

**Après Device Binding:**
```
Prof: "OK classe, vous devez scanner le QR"
Étudiant A: "Je vais donner mon password à mon ami"
Ami: Essaie se connecter
Système: "Cet appareil n'est pas autorisé" ✅ BLOQUÉ
```

## 📞 Support

**Étudiant perd accès:**
1. Contactez le prof
2. Prof contacte admin
3. Admin réinitialise deviceId
4. Étudiant peut se reconnecter depuis nouveau device

**Problème technique:**
1. Vérifier console (F12 → Application → localStorage)
2. Vérifier que deviceId est présent
3. Redémarrer l'application
4. Vider cache si nécessaire

# 🔌 API Endpoints - ClasseTrack QR System

## Base URL
- Local: `http://localhost:3000`
- Prod: `https://classetrack.com` (ou votre domaine)

## 📋 Endpoints Attendance

### 1. Scan QR Code
**POST** `/api/student/scan`

Scanner un QR code et marquer présence

#### Request
```bash
curl -X POST http://localhost:3000/api/student/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "seanceId": "cml1axtz0000ogz9ncpr8ectm",
    "token": "Y21sMWF4dHowMDAwb2d6OW5jcHI4ZWN0bS4xMDMuNGZmYWQ5...",
    "scannedAt": "2026-01-30T10:15:30.000Z"
  }'
```

#### Response (201 Created)
```json
{
  "id": "att123",
  "seanceId": "seance456",
  "studentId": "student789",
  "status": "PRESENT",
  "createdAt": "2026-01-30T10:15:32.000Z",
  "updatedAt": "2026-01-30T10:15:32.000Z",
  "student": {
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "seance": {
    "id": "seance456"
  }
}
```

#### Response (400 Bad Request)
```json
{
  "error": "Invalid or expired QR token"
}
```

```json
{
  "error": "Validation failed",
  "details": [...]
}
```

#### Response (403 Forbidden)
```json
{
  "error": "Student not in this group"
}
```

#### Response (500 Internal Server Error)
```json
{
  "error": "Internal server error",
  "details": "..." // Seulement en développement
}
```

#### CORS Headers (Cloudflare)
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
Cache-Control: no-store, no-cache, must-revalidate
```

#### Validation Rules
- `seanceId`: String, UUID valide
- `token`: String, Base64 valide
- Seance doit avoir status: `OPEN`
- Étudiant doit être inscrit au groupe
- Étudiant ne doit pas être déjà marqué

---

### 2. Get Student Attendances
**GET** `/api/student/attendance`

Récupérer l'historique de présences

#### Request
```bash
curl http://localhost:3000/api/student/attendance \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
[
  {
    "id": "att123",
    "seanceId": "seance456",
    "studentId": "student789",
    "status": "PRESENT",
    "createdAt": "2026-01-30T10:15:32.000Z",
    "updatedAt": "2026-01-30T10:15:32.000Z",
    "seance": {
      "id": "seance456",
      "date": "2026-01-30T10:00:00.000Z",
      "startTime": "10:00",
      "endTime": "12:00",
      "status": "CLOSED",
      "module": {
        "name": "Mathematics",
        "code": "MATH101"
      },
      "groupe": {
        "name": "Group A",
        "code": "GRP-A"
      }
    }
  }
]
```

---

### 3. Get Professor Seance Attendance
**GET** `/api/prof/seances/:seanceId/attendance`

Voir toutes les présences d'une séance

#### Request
```bash
curl http://localhost:3000/api/prof/seances/seance456/attendance \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "present": [
    {
      "id": "student1",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "absent": [
    {
      "id": "student2",
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Smith"
    }
  ]
}
```

---

## 📚 Seance Management

### 4. Get Professor Seances
**GET** `/api/prof/seances`

Liste des séances du professeur

#### Response
```json
[
  {
    "id": "seance456",
    "date": "2026-01-30T10:00:00.000Z",
    "startTime": "10:00",
    "endTime": "12:00",
    "status": "OPEN",
    "qrSecret": "a3f4b5c6d7e8f9a0b1c2d3e4f5a6b7c8",
    "module": {
      "id": "mod123",
      "name": "Mathematics",
      "code": "MATH101"
    },
    "groupe": {
      "id": "grp456",
      "name": "Group A",
      "code": "GRP-A"
    }
  }
]
```

---

### 5. Get Student Seances
**GET** `/api/student/seances`

Liste des séances de l'étudiant

#### Response
```json
[
  {
    "id": "seance456",
    "date": "2026-01-30T10:00:00.000Z",
    "startTime": "10:00",
    "endTime": "12:00",
    "status": "OPEN",
    "module": {
      "id": "mod123",
      "name": "Mathematics",
      "code": "MATH101"
    },
    "groupe": {
      "id": "grp456",
      "name": "Group A",
      "code": "GRP-A"
    }
  }
]
```

---

### 6. Open Seance
**POST** `/api/prof/seances/:seanceId/open`

Ouvrir une séance (génère QR)

#### Request
```bash
curl -X POST http://localhost:3000/api/prof/seances/seance456/open \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "id": "seance456",
  "status": "OPEN",
  "qrSecret": "a3f4b5c6d7e8f9a0b1c2d3e4f5a6b7c8"
}
```

---

### 7. Close Seance
**POST** `/api/prof/seances/:seanceId/close`

Clôturer une séance

#### Request
```bash
curl -X POST http://localhost:3000/api/prof/seances/seance456/close \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)
```json
{
  "id": "seance456",
  "status": "CLOSED",
  "qrSecret": null
}
```

---

## 🔐 Authentication

Tous les endpoints sauf `/api/auth/*` nécessitent un token JWT valide:

```bash
Authorization: Bearer <jwt_token>
```

Les tokens sont obtenus via:
- **POST** `/api/auth/signin` - NextAuth signin
- **GET** `/api/auth/session` - Vérifier session active

---

## ⏱️ Rate Limiting (avec Cloudflare)

Cloudflare applique les limites suivantes:
- 1000 requêtes/minute par IP
- 10000 requêtes/jour par utilisateur

Pour bypass (développement):
```bash
# Cloudflare Workers
X-Forwarded-For: 127.0.0.1
```

---

## 🛠️ Debugging

### Enable request logging
```bash
# Server logs
npm run dev 2>&1 | tee server.log

# Grep for [SCAN]
grep "\[SCAN\]" server.log
```

### Test CORS
```bash
curl -X OPTIONS http://localhost:3000/api/student/scan \
  -H "Origin: http://example.com" \
  -v
```

### Validate token timing
```bash
node test-qr-timing.js
```

---

## 📦 Payload Sizes

- Scan request: ~200 bytes
- Scan response: ~500 bytes
- Attendance list: ~100-1000 bytes (depending on list size)
- QR token: ~50-100 bytes

---

## 🔄 Polling & Real-time

### For Production
- Poll every 3-5 seconds for updates
- Use WebSocket for real-time (future)

```javascript
// Example polling
setInterval(async () => {
  const res = await fetch('/api/student/attendance');
  const data = await res.json();
  updateUI(data);
}, 3000);
```

---

## ✅ Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Data returned |
| 201 | Created | Attendance recorded |
| 400 | Bad Request | Invalid token/seance |
| 403 | Forbidden | Not authorized |
| 404 | Not Found | Seance/Student not found |
| 500 | Server Error | Contact admin |

---

## 📝 Migration Notes

### Changes from Previous Version

**Before:**
- QR change: 30 secondes
- Validité: 90 secondes (±1 window)
- CORS: Non supporté
- Cloudflare: Erreurs

**Now:**
- QR change: 3 secondes ✅
- Validité: 5 minutes ✅
- CORS: Complet ✅
- Cloudflare: Fonctionnel ✅

### Update Your Clients

If you use a custom client:
```javascript
// Update token interval
const QR_INTERVAL = 3000; // Was 30000

// QR validation window
const MAX_WINDOW_OFFSET = 100; // Was 1
```

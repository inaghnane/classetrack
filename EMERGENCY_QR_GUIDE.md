# 🆘 Système d'urgence QR - Guide complet

## Vue d'ensemble

En cas de problème technique (caméra cassée, QR difficile à scanner, etc.), le professeur peut maintenant:
1. **Étendre le temps** de 5 minutes supplémentaires
2. **Geler le QR** pour le rendre statique (ne change plus)

## Boutons dans la page professeur

Quand une séance est **OPEN**, deux nouveaux boutons apparaissent sous le QR:

### 🟠 Bouton "⏱️ Étendre +5 min"
- **Fonction**: Ajoute 5 minutes de validité au QR
- **Action**: Régénère un nouveau `qrSecret` et remet le compteur à zéro
- **Résultat**: Les étudiants ont 5 minutes de plus pour scanner
- **Utilisation**: Si beaucoup d'étudiants n'ont pas pu scanner à temps

### 🟡 Bouton "❄️ Geler / ☀️ Dégeler"
- **Fonction**: Gèle le QR (le rend statique)
- **État gelé** (❄️): QR s'affiche toujours la même image, ne change pas
- **État normal** (☀️): QR change toutes les 3 secondes (comportement normal)
- **Utilisation**: Si la caméra n'arrive pas à tracker les changements rapides du QR

## Cas d'usage pratiques

### Problème: Caméra trop lente
**Symptôme**: Les étudiants ne peuvent pas scanner car le QR change trop vite

**Solution**:
1. Cliquez sur "❄️ Geler"
2. Le QR devient statique
3. Les étudiants peuvent scanner sans stress
4. Après quelques minutes, cliquez "☀️ Dégeler" pour revenir à la normale

### Problème: Beaucoup d'étudiants en retard
**Symptôme**: Trop d'étudiants veulent scanner mais la validité de 5 min approche

**Solution**:
1. Cliquez sur "⏱️ Étendre +5 min"
2. Le QR est régénéré et remet le timer à zéro
3. Les étudiants ont 5 minutes de plus
4. Vous pouvez étendre autant de fois que nécessaire

### Problème: Réseau lent
**Symptôme**: Les étudiants scanent mais le serveur tarde à répondre

**Solution**:
1. Cliquez sur "❄️ Geler" (pour éviter les changements pendant le scan)
2. Attendez que les étudiants finissent de scanner
3. Puis "☀️ Dégeler"

### Problème: QR code trop petit ou mal vu
**Symptôme**: Étudiants ne voient pas bien le QR affiché sur l'écran

**Solution**:
1. Cliquez sur "❄️ Geler"
2. Projetez le QR sur un écran plus grand
3. Les étudiants peuvent prendre leur temps pour scanner
4. Dégel une fois terminé

## Comportement technique

### Avant: (ANCIEN)
```
T=0s   QR ouvert → qrSecret généré
       ↓
T=300s Tokens expirés → IMPOSSIBLE de scanner
```

### Après: (NOUVEAU avec boutons)
```
T=0s    QR ouvert → qrSecret généré
        ↓ (gelé ou non)
T=150s  Beaucoup d'étudiants ne peuvent pas scanner
        → Prof clique "⏱️ Étendre +5 min"
        ↓
        Nouveau qrSecret généré, timer remet à zéro
        ↓
T=150+300s Tokens peuvent durer jusqu'à maintenant
```

## Endpoints API

### 1. Étendre le temps
**POST** `/api/prof/seances/:seanceId/extend`

```bash
curl -X POST http://localhost:3000/api/prof/seances/seance123/extend
```

Response:
```json
{
  "id": "seance123",
  "status": "OPEN",
  "qrSecret": "new_secret_here",
  "message": "QR time extended by 5 minutes ✓",
  "extendedAt": "2026-01-30T10:15:30.000Z"
}
```

### 2. Geler le QR
**POST** `/api/prof/seances/:seanceId/freeze`

```bash
curl -X POST http://localhost:3000/api/prof/seances/seance123/freeze \
  -H "Content-Type: application/json" \
  -d '{"frozen": true}'
```

Response:
```json
{
  "id": "seance123",
  "status": "OPEN",
  "qrFrozen": true,
  "message": "QR code frozen ❄️ - It will not change anymore"
}
```

## Modifications de la base de données

### Nouveau champ dans `seance`:
```sql
ALTER TABLE seance ADD COLUMN qrFrozen BOOLEAN DEFAULT false;
```

### Schéma Prisma:
```typescript
model seance {
  id        String        @id
  date      DateTime
  startTime String
  endTime   String
  status    seance_status @default(PLANNED)
  qrSecret  String?
  qrFrozen  Boolean       @default(false)  // ← NOUVEAU
  moduleId  String
  groupeId  String
  
  // ...relations
}
```

## Frontend - Interactions

### QR normal (qui change)
```
T=0s   QR#1 affiché
T=3s   QR#2 affiché
T=6s   QR#3 affiché
...
```

### QR gelé (statique)
```
T=0s   QR#1 affiché (gelé)
T=3s   QR#1 TOUJOURS (ne change pas)
T=6s   QR#1 TOUJOURS (ne change pas)
...
T=300s QR#1 expire
```

## Points importants

✅ **Vous DEVEZ être PROF** pour étendre ou geler le QR  
✅ **La séance DOIT être OPEN** pour utiliser ces fonctionnalités  
✅ **Étendre le temps régénère un nouveau qrSecret** (ancien token = invalide)  
✅ **Geler le QR = geler au frontend** (backend gère l'interval)  
✅ **L'extension peut être répétée autant de fois que nécessaire**  

## Limitations et futur

### Actuellement:
- ✅ Étendre le temps
- ✅ Geler/Dégeler le QR
- ✅ Boutons dans l'UI professeur

### Futur (optionnel):
- ⏳ Timer visuel d'expiration (X min restantes)
- ⏳ Notifications aux étudiants en cas d'extension
- ⏳ Historique des extensions
- ⏳ QR statique permanent (option à la création)

## Troubleshooting

### Problème: Le bouton "Étendre" ne marche pas
- [ ] Vérifier que la séance est OPEN
- [ ] Vérifier la connexion réseau
- [ ] Vérifier dans la console: `console.log(response)`

### Problème: Le QR ne se gèle pas
- [ ] Rafraîchissez la page (F5)
- [ ] Vérifiez que `qrFrozen` = true dans la DB
- [ ] Redémarrez le serveur

### Problème: Les étudiants disent "token expiré"
- [ ] Cliquez "⏱️ Étendre +5 min"
- [ ] Dites-leur de scanner à nouveau avec le NEW QR
- [ ] Ancien QR = plus valide après extension

## Exemple scénario d'utilisation

**Classe avec 50 étudiants:**

```
10:00 Prof ouvre la séance → QR affiché
      "Scannez votre présence!"

10:02 35 étudiants ont scanné

10:04 Caméra de 3 étudiants ne marche pas
      Prof clique "❄️ Geler"
      → QR devientstatique

10:04-10:08 Ces 3 étudiants scanent lentement
      Aucun problème car QR ne change plus

10:09 Prof clique "☀️ Dégeler"
      → Retour à la normale (change toutes les 3s)

10:10 5 autres étudiants arrivent
      Seulement 4 minutes restantes
      Prof clique "⏱️ Étendre +5 min"
      → 5 minutes supplémentaires!

10:12 Tous les étudiants ont scanné
      Prof clôt la séance
```

## Statistiques

- **Temps pour étendre**: ~500ms
- **Temps pour geler**: ~200ms
- **Validité après extension**: 5 minutes (300 secondes)
- **Nombre d'extensions possibles**: Illimité

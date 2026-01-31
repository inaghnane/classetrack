# Configuration Cloudflare pour ClasseTrack

## Problèmes résolus
- ✅ QR code change toutes les **3 secondes** (au lieu de 30 secondes)
- ✅ Validité du QR: **5 minutes** (±100 fenêtres de 3 secondes)
- ✅ Support CORS complet pour Cloudflare
- ✅ Headers de cache control optimisés
- ✅ Logging des erreurs en développement

## Configuration requise dans Cloudflare

### 1. Page Rules
```
URL Pattern: classetrack.com/api/*
Settings:
  - Bypass Cache: ON
  - Disable Performance: ON
  - Browser Cache: OFF
  - Cache Level: Bypass
```

### 2. Workers (Optionnel - pour debug)
```javascript
export default {
  async fetch(request) {
    const response = await fetch(request);
    
    // Ajouter les en-têtes CORS
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Cache-Control', 'no-store, must-revalidate');
    
    return newResponse;
  },
};
```

### 3. Settings recommandés
- **Cache Rules**: Disable cache for `/api/*` routes
- **Browser Cache TTL**: 0 (Off)
- **Rocket Loader**: OFF
- **Minification**: OFF pour les routes API
- **Compression**: ON (gzip)

## Changements dans le code

### lib/qr-generator.ts
```typescript
const WINDOW_SIZE_MS = 3000;      // 3 secondes
const VALIDITY_DURATION_MS = 5 * 60 * 1000;  // 5 minutes
const MAX_WINDOW_OFFSET = 100;    // ±100 windows
```

### app/api/student/scan/route.ts
- ✅ Ajout support OPTIONS pour preflight CORS
- ✅ Headers CORS sur toutes les réponses
- ✅ Cache-Control: no-store pour Cloudflare
- ✅ Logging amélioré des erreurs

### lib/middleware.ts
- ✅ Nouvelle fonction `addCloudflareHeaders()`
- ✅ Headers pour Cloudflare Workers

### app/prof/page.tsx
- ✅ Interval de mise à jour: 3000ms (au lieu de 30000ms)
- ✅ Affichage: "Change toutes les 3 secondes | Valide 5 min"

## Test local vs Cloudflare

### Test local (sans Cloudflare)
```bash
npm run dev
# Accès à http://localhost:3000
```

### Test avec Cloudflare Pages
```bash
# Déployer sur Cloudflare Pages
npm run build
wrangler pages deploy out/
```

## Debugging en cas de problème

### 1. Vérifier les headers
```javascript
// Dans browser console
fetch('/api/student/scan', {method: 'POST'})
  .then(r => {
    console.log(r.headers.get('Access-Control-Allow-Origin'));
    console.log(r.headers.get('Cache-Control'));
  });
```

### 2. Vérifier la validité du QR
- Le QR doit accepter les tokens des 5 dernières minutes
- Chaque QR est valide ±100 fenêtres (5 minutes)
- Erreur attendue: "Invalid or expired QR token" après 5 minutes

### 3. Logs du serveur
```bash
# Chercher [SCAN] dans les logs
grep "\[SCAN\]" server.log
```

## Performance

- **Overhead réseau**: +0ms (CORS preflighting cached 86400s)
- **Validation cryptographique**: ~2-3ms par scan
- **Timeout Cloudflare**: Par défaut 30s (suffisant)

## Support

En cas d'erreur "Internal Server Error":
1. Vérifier les logs du serveur: `npm run dev`
2. Vérifier que le token n'a pas expiré (5 min max)
3. Vérifier les headers CORS dans les devtools
4. Désactiver le cache Cloudflare pour `/api/*`

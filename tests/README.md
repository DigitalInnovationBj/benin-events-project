# Tests d'Authentification - Guide Complet

Ce guide vous explique comment tester les fonctions `adminMiddleware.ts` et `checkUserRole.ts` de manière complète et pratique.

## 📁 Structure des Tests

```
tests/
├── setup.ts                    # Configuration des tests
├── checkUserRole.test.ts       # Tests unitaires pour checkUserRole
├── adminMiddleware.test.ts     # Tests unitaires pour adminMiddleware
├── integration.test.ts         # Tests d'intégration avec les routes API
├── manual-test-examples.md     # Exemples de tests manuels
└── README.md                   # Ce fichier
```

## 🚀 Démarrage Rapide

### 1. Installer les dépendances de test
```bash
pnpm install
```

### 2. Lancer les tests unitaires
```bash
# Tests en mode watch
pnpm test

# Tests une seule fois
pnpm test:run

# Tests avec interface graphique
pnpm test:ui

# Tests avec couverture de code
pnpm test:coverage
```

### 3. Tester manuellement avec le script
```bash
# Démarrer le serveur de développement
pnpm dev

# Dans un autre terminal, lancer le script de test
node scripts/test-auth.js
```

## 🧪 Types de Tests

### Tests Unitaires

#### `checkUserRole.test.ts`
Teste la fonction `CheckUserRole` avec différents scénarios :

- ✅ **Succès** : Utilisateur admin valide
- ❌ **Échec** : Pas de session
- ❌ **Échec** : Permissions insuffisantes
- ❌ **Échec** : Erreurs d'authentification
- 🔄 **Cas spéciaux** : Rôles en majuscules/minuscules

#### `adminMiddleware.test.ts`
Teste le middleware `withAdminAuth` et `createAdminResponse` :

- ✅ **Succès** : Handler exécuté pour admin valide
- ❌ **Échec** : 401 pour session inexistante
- ❌ **Échec** : 403 pour permissions insuffisantes
- ⚠️ **Gestion d'erreurs** : Erreurs du handler et du middleware

### Tests d'Intégration

#### `integration.test.ts`
Teste les routes API complètes :

- **Route `/api/admin/test`** : GET et POST
- **Route `/api/admin/users`** : GET et POST
- **Scénarios complets** : Authentification + logique métier

## 🔧 Tests Manuels

### Avec curl
```bash
# Test sans authentification (devrait retourner 401)
curl -X GET http://localhost:3000/api/admin/test

# Test avec session admin (devrait retourner 200)
curl -X GET http://localhost:3000/api/admin/test \
  -H "Cookie: better-auth.session_token=YOUR_ADMIN_TOKEN"
```

### Avec le navigateur
```javascript
// Dans la console du navigateur
fetch('/api/admin/test', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);
```

### Avec Postman/Insomnia
1. Créer une collection avec les routes admin
2. Configurer les variables d'environnement
3. Tester avec différents tokens de session

## 📊 Scénarios de Test

### 1. Utilisateur Non Connecté
- **Attendu** : 401 Unauthorized
- **Message** : "Authentication required"
- **Test** : Accès sans cookies de session

### 2. Utilisateur Connecté (Rôle User)
- **Attendu** : 403 Forbidden
- **Message** : "Access denied"
- **Test** : Accès avec session utilisateur normal

### 3. Utilisateur Connecté (Rôle Admin)
- **Attendu** : 200 OK
- **Données** : Informations utilisateur + données de la route
- **Test** : Accès avec session admin

### 4. Gestion des Erreurs
- **Erreur Handler** : 500 Internal Server Error
- **Erreur Auth** : 500 Internal Server Error
- **Session Invalide** : 401 Unauthorized

## 🛠️ Configuration des Tests

### Variables d'Environnement
```bash
# .env.local
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
```

### Tokens de Session
Pour les tests manuels, vous devez obtenir de vrais tokens :

1. **Se connecter via l'interface web**
2. **Ouvrir les DevTools** → Application → Cookies
3. **Copier le token** `better-auth.session_token`
4. **Remplacer dans les scripts de test**

## 📈 Métriques de Test

### Couverture de Code
```bash
pnpm test:coverage
```

### Performance
```bash
# Test de charge simple
ab -n 100 -c 10 http://localhost:3000/api/admin/test
```

## 🐛 Débogage

### Logs du Serveur
```bash
# Activer les logs détaillés
DEBUG=* pnpm dev
```

### Logs des Tests
```bash
# Tests avec logs détaillés
pnpm test --reporter=verbose
```

### Vérification des Sessions
```bash
# Vérifier la session actuelle
curl -X GET http://localhost:3000/api/auth/session \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN"
```

## 🔒 Tests de Sécurité

### 1. Injection de Session
- Tester avec des tokens malformés
- Vérifier la validation des tokens

### 2. Bypass de Rôle
- Essayer de modifier le rôle via headers
- Vérifier que le rôle vient de la session

### 3. Sessions Expirées
- Tester avec des tokens expirés
- Vérifier la gestion des sessions

## 📝 Exemples Pratiques

### Test Complet d'une Route
```javascript
// Test complet avec gestion d'erreurs
async function testAdminRoute() {
  try {
    const response = await fetch('/api/admin/test', {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Succès:', data);
    } else {
      console.log('❌ Erreur:', data);
    }
  } catch (error) {
    console.error('💥 Exception:', error);
  }
}
```

### Test avec Retry
```javascript
// Test avec retry automatique
async function testWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await testAdminRoute();
      if (result.success) return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

## 🎯 Bonnes Pratiques

1. **Toujours tester les cas d'échec** en plus des cas de succès
2. **Utiliser des données de test réalistes** mais non sensibles
3. **Nettoyer les mocks** entre les tests
4. **Tester avec différents types d'utilisateurs**
5. **Vérifier les logs** pour comprendre les erreurs
6. **Tester en conditions réelles** (avec vraies sessions)

## 🚨 Problèmes Courants

### "No active session"
- Vérifier que les cookies sont inclus dans la requête
- S'assurer que la session n'a pas expiré
- Vérifier la configuration de better-auth

### "Insufficient permissions"
- Vérifier le rôle de l'utilisateur dans la base de données
- S'assurer que le rôle est correctement défini
- Vérifier la comparaison des rôles (insensible à la casse)

### Tests qui passent en isolation mais échouent ensemble
- Vérifier le nettoyage des mocks
- S'assurer que les tests sont indépendants
- Vérifier l'ordre d'exécution des tests

## 📚 Ressources Supplémentaires

- [Documentation Better Auth](https://better-auth.com)
- [Documentation Vitest](https://vitest.dev)
- [Documentation Next.js Testing](https://nextjs.org/docs/testing)
- [Guide de sécurité des APIs](https://owasp.org/www-project-api-security/)

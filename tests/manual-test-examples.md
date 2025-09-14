# Tests Manuels - Exemples Pratiques

## 1. Tests avec curl

### Test 1: Accès sans authentification
```bash
# Devrait retourner 401
curl -X GET http://localhost:3000/api/admin/test
```

### Test 2: Accès avec session utilisateur normal
```bash
# Devrait retourner 403
curl -X GET http://localhost:3000/api/admin/test \
  -H "Cookie: better-auth.session_token=your_user_session_token"
```

### Test 3: Accès avec session admin
```bash
# Devrait retourner 200 avec les données de test
curl -X GET http://localhost:3000/api/admin/test \
  -H "Cookie: better-auth.session_token=your_admin_session_token"
```

### Test 4: Test POST avec données
```bash
# Devrait traiter les données
curl -X POST http://localhost:3000/api/admin/test \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your_admin_session_token" \
  -d '{"message": "Test data", "value": 123}'
```

### Test 5: Test POST avec erreur
```bash
# Devrait retourner 500
curl -X POST http://localhost:3000/api/admin/test \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your_admin_session_token" \
  -d '{"triggerError": true}'
```

## 2. Tests avec JavaScript/Fetch

### Test dans le navigateur (console)
```javascript
// Test GET
fetch('/api/admin/test', {
  credentials: 'include' // Inclut les cookies de session
})
.then(response => response.json())
.then(data => console.log('GET Response:', data))
.catch(error => console.error('GET Error:', error));

// Test POST
fetch('/api/admin/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    message: 'Test from browser',
    timestamp: new Date().toISOString()
  })
})
.then(response => response.json())
.then(data => console.log('POST Response:', data))
.catch(error => console.error('POST Error:', error));
```

## 3. Tests avec Postman/Insomnia

### Collection de tests
1. **GET Admin Test** - `GET /api/admin/test`
2. **POST Admin Test** - `POST /api/admin/test` avec body JSON
3. **GET Users** - `GET /api/admin/users`
4. **POST Create User** - `POST /api/admin/users` avec données utilisateur

### Variables d'environnement
- `base_url`: `http://localhost:3000`
- `admin_session`: `your_admin_session_token`
- `user_session`: `your_user_session_token`

## 4. Scénarios de test complets

### Scénario 1: Utilisateur non connecté
1. Accéder à `/api/admin/test` sans cookies
2. Vérifier le code de statut 401
3. Vérifier le message "Authentication required"

### Scénario 2: Utilisateur connecté mais non-admin
1. Se connecter avec un compte utilisateur normal
2. Accéder à `/api/admin/test`
3. Vérifier le code de statut 403
4. Vérifier le message "Access denied"

### Scénario 3: Admin valide
1. Se connecter avec un compte admin
2. Accéder à `/api/admin/test`
3. Vérifier le code de statut 200
4. Vérifier la présence des données utilisateur dans la réponse

### Scénario 4: Gestion des erreurs
1. Se connecter avec un compte admin
2. Envoyer une requête POST avec `triggerError: true`
3. Vérifier le code de statut 500
4. Vérifier le message "Internal server error"

## 5. Tests de performance

### Test de charge simple
```bash
# Installer Apache Bench
sudo apt-get install apache2-utils

# Test avec 100 requêtes, 10 simultanées
ab -n 100 -c 10 -H "Cookie: better-auth.session_token=your_admin_session_token" \
   http://localhost:3000/api/admin/test
```

## 6. Tests de sécurité

### Test 1: Injection de session
```bash
# Essayer avec un token de session malformé
curl -X GET http://localhost:3000/api/admin/test \
  -H "Cookie: better-auth.session_token=malformed_token"
```

### Test 2: Bypass de rôle
```bash
# Essayer de modifier le rôle dans la requête
curl -X GET http://localhost:3000/api/admin/test \
  -H "Cookie: better-auth.session_token=user_session_token" \
  -H "X-User-Role: admin"
```

## 7. Tests de logs

Vérifier les logs de la console pour :
- Messages d'erreur d'authentification
- Tentatives d'accès non autorisées
- Erreurs de middleware
- Performance des requêtes

## 8. Tests de régression

Après chaque modification :
1. Exécuter tous les tests unitaires
2. Tester manuellement les routes principales
3. Vérifier que les anciens comportements fonctionnent toujours
4. Tester avec différents types d'utilisateurs

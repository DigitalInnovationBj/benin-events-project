# Guide d'authentification - Benin Events

## Architecture d'authentification

Le projet utilise **Better Auth** avec deux contextes distincts :

### 1. Côté Serveur (API Routes)
- **Fichier** : `lib/auth.ts`
- **Usage** : Routes API, middleware, vérifications de rôles
- **Import** : `import { auth } from "@/lib/auth"`

### 2. Côté Client (React Components)
- **Fichier** : `utils/auth-client.ts`
- **Usage** : Composants React, formulaires, hooks
- **Import** : `import { authClient, signIn, signUp, signOut } from "@/utils/auth-client"`

## Utilisation correcte

### ✅ Routes API (Serveur)

```typescript
import { auth } from "@/lib/auth";

// Connexion
const user = await auth.api.signInEmail({ 
    body: { 
        email: data.email, 
        password: data.password 
    } 
});

// Inscription
const user = await auth.api.signUpEmail({ 
    body: { 
        email: data.email, 
        password: data.password,
        name: data.name
    } 
});

// Vérification de session
const session = await auth.api.getSession({
    headers: await headers()
});
```

### ✅ Composants React (Client)

```typescript
import { signIn, signUp, signOut } from "@/utils/auth-client";

// Connexion
const result = await signIn.email(email, password);

// Inscription
const result = await signUp.email(email, password, { name });

// Déconnexion
await signOut();
```

## Vérification des rôles

### Fonction utilitaire améliorée
```typescript
import { CheckUserRole } from "@/functions/checkUserRole";

const checkRole = await CheckUserRole(request, "admin");
if (!checkRole.state) {
    const statusCode = checkRole.error === "No active session" ? 401 : 403;
    return NextResponse.json({ 
        message: checkRole.error === "No active session" 
            ? "Authentication required" 
            : "Access denied",
        error: checkRole.error 
    }, { status: statusCode });
}
```

### Middleware admin (recommandé)
```typescript
import { withAdminAuth, createAdminResponse } from "@/functions/adminMiddleware";

export async function GET(request: Request) {
    return withAdminAuth(request, (user) => {
        return createAdminResponse(user, data, "Success message");
    });
}
```

## Routes d'authentification

### Routes publiques
- `POST /api/auth/sign-in` - Connexion (Better Auth)
- `POST /api/auth/sign-up` - Inscription (Better Auth)
- `POST /api/auth/sign-out` - Déconnexion (Better Auth)

### Routes admin
- `POST /api/admin/users/signin` - Connexion admin
- `POST /api/admin/users/signup` - Inscription admin
- `GET /api/admin` - Route protégée admin

## Gestion des erreurs

### Côté serveur
```typescript
try {
    const user = await auth.api.signInEmail({ body: { email, password } });
    return new Response(JSON.stringify(user), { status: 200 });
} catch (error) {
    console.error("Sign in error:", error);
    return new Response("Invalid credentials", { status: 401 });
}
```

### Côté client
```typescript
try {
    const result = await signIn.email(email, password);
    if (result.error) {
        console.error("Sign in failed:", result.error);
    }
} catch (error) {
    console.error("Network error:", error);
}
```

## Configuration

### Variables d'environnement requises
```env
DATABASE_URL="postgresql://..."
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Types d'utilisateurs
- `USER` : Utilisateur standard
- `ADMIN` : Administrateur

## Bonnes pratiques

1. **Toujours utiliser `auth` côté serveur** dans les routes API
2. **Toujours utiliser `authClient` côté client** dans les composants React
3. **Vérifier les rôles** avant d'accéder aux routes protégées
4. **Gérer les erreurs** de manière appropriée
5. **Utiliser les bons codes de statut HTTP** (200, 201, 401, 403, 500)

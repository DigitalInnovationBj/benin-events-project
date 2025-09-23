# Exemples d'utilisation de l'authentification

## Comment Better Auth gère les tokens automatiquement

### ✅ **NON, vous n'avez PAS besoin de gérer manuellement les tokens !**

Better Auth utilise des **cookies HTTP-only sécurisés** pour gérer les sessions automatiquement.

## Exemples pratiques

### 1. Connexion côté client (React)

```typescript
// Dans un composant React
import { signIn } from "@/utils/auth-client";

export function LoginForm() {
  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await signIn.email(email, password);
      
      if (result.error) {
        console.error("Erreur de connexion:", result.error);
        return;
      }
      
      // ✅ La session est automatiquement créée
      // ✅ Le cookie est automatiquement envoyé dans les requêtes suivantes
      console.log("Connexion réussie:", result.data);
      
      // Rediriger vers la page admin
      window.location.href = "/admin";
    } catch (error) {
      console.error("Erreur réseau:", error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      handleLogin(formData.get("email"), formData.get("password"));
    }}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Mot de passe" required />
      <button type="submit">Se connecter</button>
    </form>
  );
}
```

### 2. Vérification de session côté client

```typescript
// Hook personnalisé pour vérifier la session
import { useEffect, useState } from "react";
import { authClient } from "@/utils/auth-client";

export function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const result = await authClient.getSession();
        setSession(result.data);
      } catch (error) {
        console.error("Erreur de session:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  return { session, loading };
}

// Utilisation dans un composant
export function AdminDashboard() {
  const { session, loading } = useSession();

  if (loading) return <div>Chargement...</div>;
  
  if (!session) {
    return <div>Veuillez vous connecter</div>;
  }

  if (session.user.role !== "ADMIN") {
    return <div>Accès refusé</div>;
  }

  return <div>Bienvenue, {session.user.name}!</div>;
}
```

### 3. Appels API avec session automatique

```typescript
// Fonction pour appeler les routes admin
export async function fetchAdminData() {
  try {
    // ✅ Pas besoin d'ajouter de token manuellement
    // ✅ Better Auth gère automatiquement les cookies
    const response = await fetch("/api/admin", {
      method: "GET",
      credentials: "include", // Important pour inclure les cookies
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur API:", error);
    throw error;
  }
}
```

### 4. Déconnexion

```typescript
import { signOut } from "@/utils/auth-client";

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut();
      // ✅ La session est automatiquement supprimée
      // ✅ Le cookie est automatiquement effacé
      window.location.href = "/login";
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  return <button onClick={handleLogout}>Se déconnecter</button>;
}
```

## Configuration requise

### 1. Variables d'environnement

```env
# .env.local
DATABASE_URL="postgresql://..."
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3001"
```

### 2. Configuration Better Auth

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
```

## Points importants

1. **Pas de gestion manuelle de tokens** - Better Auth s'en charge
2. **Cookies HTTP-only sécurisés** - Protection contre XSS
3. **Sessions automatiques** - Pas besoin d'ajouter des headers
4. **`credentials: "include"`** - Important pour les appels fetch
5. **Gestion d'erreur** - Toujours vérifier les erreurs de session

## Dépannage

Si vous avez des problèmes de session :

1. Vérifiez que `BETTER_AUTH_SECRET` est défini
2. Vérifiez que `BETTER_AUTH_URL` correspond à votre domaine
3. Assurez-vous d'utiliser `credentials: "include"` dans fetch
4. Vérifiez que les cookies sont acceptés par le navigateur



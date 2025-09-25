import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient()

// Export des méthodes d'authentification pour le côté client
export const { signIn, signUp, signOut } = authClient
import { NextRequest } from 'next/server'
import { withAdminAuth, createAdminResponse } from '@/functions/adminMiddleware'
import { Role } from '@/lib/generated/prisma'

/**
 * Route pour gérer les utilisateurs (admin seulement)
 * GET /api/admin/users - Lister tous les utilisateurs
 * POST /api/admin/users - Créer un nouvel utilisateur
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (user) => {
    // Simulation de récupération des utilisateurs
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: Role.USER },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: Role.USER },
      { id: '3', name: 'Admin User', email: 'admin@example.com', role: Role.ADMIN }
    ]

    return createAdminResponse(
      user,
      { 
        users: mockUsers,
        total: mockUsers.length,
        requestedBy: user.name
      },
      'Liste des utilisateurs récupérée'
    )
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (user) => {
    const body = await request.json()
    
    // Validation basique
    if (!body.name || !body.email) {
      return createAdminResponse(
        user,
        null,
        'Nom et email requis'
      )
    }

    // Simulation de création d'utilisateur
    const newUser = {
      id: Date.now().toString(),
      name: body.name,
      email: body.email,
      role: body.role || 'user',
      createdAt: new Date().toISOString()
    }

    return createAdminResponse(
      user,
      { 
        user: newUser,
        createdBy: user.name
      },
      'Utilisateur créé avec succès'
    )
  })
}

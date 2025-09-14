import { NextRequest } from 'next/server'
import { withAdminAuth, createAdminResponse } from '@/functions/adminMiddleware'

/**
 * Route de test pour vérifier le middleware admin
 * GET /api/admin/test
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (user) => {
    return createAdminResponse(
      user,
      { 
        message: 'Admin middleware fonctionne correctement!',
        timestamp: new Date().toISOString(),
        testData: {
          userId: user.id,
          userName: user.name,
          userRole: user.role
        }
      },
      'Test réussi'
    )
  })
}

/**
 * Route de test pour vérifier les erreurs
 * POST /api/admin/test
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (user) => {
    const body = await request.json()
    
    if (body.triggerError) {
      throw new Error('Erreur test déclenchée')
    }
    
    return createAdminResponse(
      user,
      { 
        receivedData: body,
        processedBy: user.name
      },
      'Données traitées avec succès'
    )
  })
}

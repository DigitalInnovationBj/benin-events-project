import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as testGet, POST as testPost } from '@/app/api/admin/test/route'
import { GET as usersGet, POST as usersPost } from '@/app/api/admin/users/route'
import { CheckUserRole } from '@/functions/checkUserRole'
import { Role } from '@/lib/generated/prisma'

// Mock de CheckUserRole
vi.mock('@/functions/checkUserRole')

const mockCheckUserRole = vi.mocked(CheckUserRole)

describe('Tests d\'intégration - Routes Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Route /api/admin/test', () => {
    describe('GET /api/admin/test', () => {
      it('devrait retourner les données de test pour un admin valide', async () => {
        // Arrange
        const mockUser = {
          id: '1',
          name: 'Test Admin',
          email: 'admin@test.com',
          role: Role.ADMIN
        }

        mockCheckUserRole.mockResolvedValue({
          state: true,
          user: mockUser as any,
          error: null
        })

        const request = new NextRequest('http://localhost:3000/api/admin/test')

        // Act
        const response = await testGet(request)

        // Assert
        expect(response.status).toBe(200)
        
        const responseBody = await response.json()
        expect(responseBody.message).toBe('Test réussi')
        expect(responseBody.user).toEqual({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role
        })
        expect(responseBody.data.testData.userId).toBe(mockUser.id)
      })

      it('devrait refuser l\'accès à un utilisateur non-admin', async () => {
        // Arrange
        const mockUser = {
          id: '1',
          name: 'Regular User',
          email: 'user@test.com',
          role: Role.USER
        }

        mockCheckUserRole.mockResolvedValue({
          state: false,
          user: mockUser as any,
          error: 'Insufficient permissions'
        })

        const request = new NextRequest('http://localhost:3000/api/admin/test')

        // Act
        const response = await testGet(request)

        // Assert
        expect(response.status).toBe(403)
        
        const responseBody = await response.json()
        expect(responseBody.message).toBe('Access denied')
        expect(responseBody.error).toBe('Insufficient permissions')
      })

      it('devrait refuser l\'accès sans session', async () => {
        // Arrange
        mockCheckUserRole.mockResolvedValue({
          state: false,
          user: null,
          error: 'No active session'
        })

        const request = new NextRequest('http://localhost:3000/api/admin/test')

        // Act
        const response = await testGet(request)

        // Assert
        expect(response.status).toBe(401)
        
        const responseBody = await response.json()
        expect(responseBody.message).toBe('Authentication required')
        expect(responseBody.error).toBe('No active session')
      })
    })

    describe('POST /api/admin/test', () => {
      it('devrait traiter les données POST pour un admin valide', async () => {
        // Arrange
        const mockUser = {
          id: '1',
          name: 'Test Admin',
          email: 'admin@test.com',
          role: Role.ADMIN
        }

        const testData = { message: 'Test data', value: 123 }

        mockCheckUserRole.mockResolvedValue({
          state: true,
          user: mockUser as any,
          error: null
        })

        const request = new NextRequest('http://localhost:3000/api/admin/test', {
          method: 'POST',
          body: JSON.stringify(testData),
          headers: {
            'Content-Type': 'application/json'
          }
        })

        // Act
        const response = await testPost(request)

        // Assert
        expect(response.status).toBe(200)
        
        const responseBody = await response.json()
        expect(responseBody.message).toBe('Données traitées avec succès')
        expect(responseBody.data.receivedData).toEqual(testData)
        expect(responseBody.data.processedBy).toBe(mockUser.name)
      })

      it('devrait gérer les erreurs du handler', async () => {
        // Arrange
        const mockUser = {
          id: '1',
          name: 'Test Admin',
          email: 'admin@test.com',
          role: Role.ADMIN
        }

        mockCheckUserRole.mockResolvedValue({
          state: true,
          user: mockUser as any,
          error: null
        })

        const request = new NextRequest('http://localhost:3000/api/admin/test', {
          method: 'POST',
          body: JSON.stringify({ triggerError: true }),
          headers: {
            'Content-Type': 'application/json'
          }
        })

        // Act
        const response = await testPost(request)

        // Assert
        expect(response.status).toBe(500)
        
        const responseBody = await response.json()
        expect(responseBody.message).toBe('Internal server error')
      })
    })
  })

  describe('Route /api/admin/users', () => {
    describe('GET /api/admin/users', () => {
      it('devrait retourner la liste des utilisateurs pour un admin', async () => {
        // Arrange
        const mockUser = {
          id: '1',
          name: 'Admin User',
          email: 'admin@test.com',
          role: Role.ADMIN
        }

        mockCheckUserRole.mockResolvedValue({
          state: true,
          user: mockUser as any,
          error: null
        })

        const request = new NextRequest('http://localhost:3000/api/admin/users')

        // Act
        const response = await usersGet(request)

        // Assert
        expect(response.status).toBe(200)
        
        const responseBody = await response.json()
        expect(responseBody.message).toBe('Liste des utilisateurs récupérée')
        expect(responseBody.data.users).toHaveLength(3)
        expect(responseBody.data.total).toBe(3)
        expect(responseBody.data.requestedBy).toBe(mockUser.name)
      })
    })

    describe('POST /api/admin/users', () => {
      it('devrait créer un nouvel utilisateur avec des données valides', async () => {
        // Arrange
        const mockUser = {
          id: '1',
          name: 'Admin User',
          email: 'admin@test.com',
          role: 'admin'
        }

        const newUserData = {
          name: 'New User',
          email: 'newuser@test.com',
          role: Role.USER
        }

        mockCheckUserRole.mockResolvedValue({
          state: true,
          user: mockUser as any,
          error: null
        })

        const request = new NextRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(newUserData),
          headers: {
            'Content-Type': 'application/json'
          }
        })

        // Act
        const response = await usersPost(request)

        // Assert
        expect(response.status).toBe(200)
        
        const responseBody = await response.json()
        expect(responseBody.message).toBe('Utilisateur créé avec succès')
        expect(responseBody.data.user.name).toBe(newUserData.name)
        expect(responseBody.data.user.email).toBe(newUserData.email)
        expect(responseBody.data.createdBy).toBe(mockUser.name)
      })

      it('devrait refuser la création avec des données invalides', async () => {
        // Arrange
        const mockUser = {
          id: '1',
          name: 'Admin User',
          email: 'admin@test.com',
          role: Role.ADMIN
        }

        const invalidUserData = {
          name: '', // Nom vide
          email: 'invalid-email' // Email invalide
        }

        mockCheckUserRole.mockResolvedValue({
          state: true,
          user: mockUser as any,
          error: null
        })

        const request = new NextRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(invalidUserData),
          headers: {
            'Content-Type': 'application/json'
          }
        })

        // Act
        const response = await usersPost(request)

        // Assert
        expect(response.status).toBe(200)
        
        const responseBody = await response.json()
        expect(responseBody.message).toBe('Nom et email requis')
      })
    })
  })
})

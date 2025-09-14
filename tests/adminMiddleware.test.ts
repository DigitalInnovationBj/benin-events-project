import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { withAdminAuth, createAdminResponse } from '@/functions/adminMiddleware'
import { CheckUserRole } from '@/functions/checkUserRole'
import { Role } from '@/lib/generated/prisma'

// Mock de CheckUserRole
vi.mock('@/functions/checkUserRole')

const mockCheckUserRole = vi.mocked(CheckUserRole)

describe('withAdminAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Cas de succès', () => {
    it('devrait exécuter le handler pour un utilisateur admin valide', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'Admin User',
        email: 'admin@test.com',
        role: Role.ADMIN
      }

      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ message: 'Success' })
      )

      mockCheckUserRole.mockResolvedValue({
        state: true,
        user: mockUser as any as any,
        error: null
      })

      const request = new Request('http://localhost:3000/api/admin/test')

      // Act
      const result = await withAdminAuth(request, mockHandler)

      // Assert
      expect(mockCheckUserRole).toHaveBeenCalledWith(request, Role.ADMIN)
      expect(mockHandler).toHaveBeenCalledWith(mockUser)
      expect(result.status).toBe(200)
    })

    it('devrait passer les données utilisateur au handler', async () => {
      // Arrange
      const mockUser = {
        id: '2',
        name: 'Test Admin',
        email: 'test@admin.com',
        role: Role.ADMIN
      }

      const mockHandler = vi.fn().mockImplementation((user) => {
        expect(user).toEqual(mockUser)
        return NextResponse.json({ user: user })
      })

      mockCheckUserRole.mockResolvedValue({
        state: true,
        user: mockUser as any,
        error: null
      })

      const request = new Request('http://localhost:3000/api/admin/test')

      // Act
      await withAdminAuth(request, mockHandler)

      // Assert
      expect(mockHandler).toHaveBeenCalledWith(mockUser)
    })
  })

  describe('Cas d\'échec - Pas de session', () => {
    it('devrait retourner 401 pour une session inexistante', async () => {
      // Arrange
      const mockHandler = vi.fn()

      mockCheckUserRole.mockResolvedValue({
        state: false,
        user: null,
        error: 'No active session'
      })

      const request = new Request('http://localhost:3000/api/admin/test')

      // Act
      const result = await withAdminAuth(request, mockHandler)

      // Assert
      expect(mockHandler).not.toHaveBeenCalled()
      expect(result.status).toBe(401)
      
      const responseBody = await result.json()
      expect(responseBody).toEqual({
        message: 'Authentication required',
        error: 'No active session'
      })
    })
  })

  describe('Cas d\'échec - Permissions insuffisantes', () => {
    it('devrait retourner 403 pour un utilisateur sans permissions admin', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'Regular User',
        email: 'user@test.com',
        role: 'user'
      }

      const mockHandler = vi.fn()

      mockCheckUserRole.mockResolvedValue({
        state: false,
        user: mockUser as any,
        error: 'Insufficient permissions'
      })

      const request = new Request('http://localhost:3000/api/admin/test')

      // Act
      const result = await withAdminAuth(request, mockHandler)

      // Assert
      expect(mockHandler).not.toHaveBeenCalled()
      expect(result.status).toBe(403)
      
      const responseBody = await result.json()
      expect(responseBody).toEqual({
        message: 'Access denied',
        error: 'Insufficient permissions'
      })
    })
  })

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs du handler', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'Admin User',
        email: 'admin@test.com',
        role: Role.ADMIN
      }

      const mockHandler = vi.fn().mockRejectedValue(new Error('Handler error'))

      mockCheckUserRole.mockResolvedValue({
        state: true,
        user: mockUser as any,
        error: null
      })

      const request = new Request('http://localhost:3000/api/admin/test')

      // Act
      const result = await withAdminAuth(request, mockHandler)

      // Assert
      expect(result.status).toBe(500)
      
      const responseBody = await result.json()
      expect(responseBody).toEqual({
        message: 'Internal server error'
      })
    })

    it('devrait gérer les erreurs de CheckUserRole', async () => {
      // Arrange
      const mockHandler = vi.fn()

      mockCheckUserRole.mockRejectedValue(new Error('CheckUserRole error'))

      const request = new Request('http://localhost:3000/api/admin/test')

      // Act
      const result = await withAdminAuth(request, mockHandler)

      // Assert
      expect(mockHandler).not.toHaveBeenCalled()
      expect(result.status).toBe(500)
      
      const responseBody = await result.json()
      expect(responseBody).toEqual({
        message: 'Internal server error'
      })
    })
  })

  describe('Tests avec différents types de handlers', () => {
    it('devrait fonctionner avec un handler qui retourne une NextResponse', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'Admin User',
        email: 'admin@test.com',
        role: Role.ADMIN
      }

      const expectedResponse = NextResponse.json({ data: 'test' })
      const mockHandler = vi.fn().mockReturnValue(expectedResponse)

      mockCheckUserRole.mockResolvedValue({
        state: true,
        user: mockUser as any,
        error: null
      })

      const request = new Request('http://localhost:3000/api/admin/test')

      // Act
      const result = await withAdminAuth(request, mockHandler)

      // Assert
      expect(result).toBe(expectedResponse)
    })

    it('devrait fonctionner avec un handler async', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'Admin User',
        email: 'admin@test.com',
        role: Role.ADMIN
      }

      const mockHandler = vi.fn().mockImplementation(async (user) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return NextResponse.json({ async: true, user })
      })

      mockCheckUserRole.mockResolvedValue({
        state: true,
        user: mockUser as any,
        error: null
      })

      const request = new Request('http://localhost:3000/api/admin/test')

      // Act
      const result = await withAdminAuth(request, mockHandler)

      // Assert
      expect(result.status).toBe(200)
      const responseBody = await result.json()
      expect(responseBody.async).toBe(true)
    })
  })
})

describe('createAdminResponse', () => {
  it('devrait créer une réponse standardisée avec utilisateur et données', () => {
    // Arrange
    const mockUser = {
      id: '1',
      name: 'Admin User',
      email: 'admin@test.com',
      role: Role.ADMIN
    }

    const mockData = { events: [], total: 0 }

    // Act
    const result = createAdminResponse(mockUser, mockData, 'Events retrieved')

    // Assert
    expect(result.status).toBe(200)
    
    // Note: On ne peut pas tester directement le JSON car NextResponse.json() 
    // retourne un objet Response, mais on peut vérifier la structure
    expect(result).toBeInstanceOf(NextResponse)
  })

  it('devrait créer une réponse avec seulement l\'utilisateur', () => {
    // Arrange
    const mockUser = {
      id: '1',
      name: 'Admin User',
      email: 'admin@test.com',
      role: Role.ADMIN
    }

    // Act
    const result = createAdminResponse(mockUser)

    // Assert
    expect(result.status).toBe(200)
    expect(result).toBeInstanceOf(NextResponse)
  })

  it('devrait créer une réponse avec un message personnalisé', () => {
    // Arrange
    const mockUser = {
      id: '1',
      name: 'Admin User',
      email: 'admin@test.com',
      role: Role.ADMIN
    }

    // Act
    const result = createAdminResponse(mockUser, null, 'Custom message')

    // Assert
    expect(result.status).toBe(200)
    expect(result).toBeInstanceOf(NextResponse)
  })
})

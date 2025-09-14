import '@testing-library/jest-dom'

// Mock des modules Next.js
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

// Mock de better-auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

// Variables globales pour les tests
global.vi = vi

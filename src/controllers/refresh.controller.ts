import { Request, Response } from 'express'

/**
 * POST /api/auth/refresh
 * Refresh access token using httpOnly refresh token from cookies
 */
export async function refresh(req: Request, res: Response) {
  try {
    // TODO: Implementar lógica de refresh token
    // Por ahora retornamos 401 para que el frontend sepa que no hay sesión válida
    return res.status(401).json({ 
      error: 'No valid refresh token. Please login again.' 
    })
  } catch (error) {
    console.error('Refresh error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
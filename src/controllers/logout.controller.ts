import { Request, Response } from 'express'

/**
 * POST /api/auth/logout
 * Clear refresh token cookie
 */
export async function logout(req: Request, res: Response) {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    
    return res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
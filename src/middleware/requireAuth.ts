import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getSessionByToken } from '../models/session.model'
import { findUserById } from '../models/user.model'
import { query } from '../db'
import logger from '../utils/logger'

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-me'
// Rotate token if less than this many seconds remaining
const ROTATION_THRESHOLD_SECONDS = 300 // 5 minutes

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.get('authorization') || ''
    const match = auth.match(/^Bearer\s+(.+)$/i)
    if (!match) return res.status(401).json({ error: 'Unauthorized' })
    const token = match[1]

    // Verify JWT signature and decode
    let payload: any
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Check session exists and not expired
    const session = await getSessionByToken(token)
    if (!session) return res.status(401).json({ error: 'Invalid or revoked session' })
    if (new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Session expired' })
    }

    // Attach user to request
    const user = await findUserById(session.user_id)
    if (!user) return res.status(401).json({ error: 'Invalid session user' })
    // @ts-ignore
    req.user = { id: user.id, email: user.email, username: user.username }

    // Token rotation: if token exp is near, issue new token and update session
    // payload.exp is in seconds since epoch
    if (payload && payload.exp) {
      const nowSec = Math.floor(Date.now() / 1000)
      const secondsLeft = payload.exp - nowSec
      if (secondsLeft > 0 && secondsLeft < ROTATION_THRESHOLD_SECONDS) {
        // Issue new token
        const newToken = jwt.sign({ sub: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '1h' })
        const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000)
        // Update session token and expiry in DB
        try {
          await query('UPDATE sessions SET token = $1, expires_at = $2 WHERE id = $3', [newToken, newExpiresAt, session.id])
          // Send rotated token in response header
          res.setHeader('x-refresh-token', newToken)
          // Also update req authorization so downstream uses new token if needed
          req.headers['authorization'] = `Bearer ${newToken}`
        } catch (err) {
          logger.warn('Failed to rotate token', { err: (err as any)?.message || err })
        }
      }
    }

    return next()
  } catch (err: any) {
    logger.error('Auth middleware error', { err: err?.message || err })
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export default requireAuth

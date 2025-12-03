import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

// Attach a helper to req to log failed authentication attempts.
export function attachAuthLogger(req: Request, _res: Response, next: NextFunction) {
  // @ts-ignore - augment in types/express.d.ts
  req.logFailedLogin = (details: { reason?: string; emailOrUsername?: string }) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
    logger.warn('Failed login attempt', {
      ip,
      userAgent: req.get('user-agent'),
      emailOrUsername: details.emailOrUsername || null,
      reason: details.reason || null,
      path: req.originalUrl,
      time: new Date().toISOString()
    })
  }
  next()
}

export default attachAuthLogger

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
  sub?: string;        // Subject (user ID) - estándar JWT
  userId?: string;     // Backward compatibility
  email: string;
  username?: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to verify JWT access token from Authorization header
 * Sets req.user with decoded token data
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn('Invalid token', { error: err.message });
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      const payload = decoded as JWTPayload;
      
      // Extraer userId desde 'sub' (estándar) o 'userId' (legacy)
      const userId = payload.sub || payload.userId;
      
      if (!userId) {
        logger.warn('Token sin userId/sub', { payload });
        return res.status(401).json({ error: 'Invalid token payload' });
      }
      
      // Attach user info to request
      (req as any).user = {
        id: userId,
        email: payload.email,
        username: payload.username,
      };
      
      (req as any).userId = userId;

      next();
    });
  } catch (err: any) {
    logger.error('Auth middleware error', { err: err?.message || err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default { authenticateToken };
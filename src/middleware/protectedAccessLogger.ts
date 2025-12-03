import { Request, Response, NextFunction } from 'express';
import { logProtectedAccess } from '../logger/loginTracker';

export function protectedAccessLogger(req: Request, res: Response, next: NextFunction) {
  // Log after response finished to capture status
  res.on('finish', () => {
    const userId = (req as any).user?.id || (req as any).userId || undefined;
    logProtectedAccess({ userId, path: req.originalUrl, method: req.method, ip: req.ip });
  });
  next();
}

export default protectedAccessLogger;

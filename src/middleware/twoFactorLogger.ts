import { Request, Response, NextFunction } from 'express';
import { log2FAChange } from '../logger/loginTracker';

// Call this helper when 2FA is setup/disabled or backup codes are generated
export function record2FAChange(req: Request, action: 'setup' | 'disable' | 'backup-codes-generated') {
  const userId = (req as any).user?.id || (req as any).userId;
  const ip = req.ip;
  log2FAChange({ userId, action, ip });
}

export default record2FAChange;

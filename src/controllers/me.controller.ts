import { Request, Response } from 'express';
import { findUserById } from '../models/user.model';
import logger from '../utils/logger';

/**
 * GET /auth/me
 * Returns current authenticated user info
 * Requires valid access token in Authorization header
 */
export async function me(req: Request, res: Response) {
  try {
    // Auth middleware should have set req.user
    const userId = (req as any).user?.id || (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return safe user data (no password_hash)
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.username, // or add a separate name field
        is_active: user.is_active,
        created_at: user.created_at,
      },
      // Include accessToken if you want to refresh it
      // accessToken: (req as any).accessToken
    });
  } catch (err: any) {
    logger.error('Error in /auth/me', { err: err?.message || err });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default { me };
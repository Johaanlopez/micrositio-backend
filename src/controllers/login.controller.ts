import { Request, Response } from 'express'
import Joi from 'joi'
import { findUserByEmail, findUserByUsername } from '../models/user.model'
import { comparePassword, generateVerificationCode } from '../services/crypto.service'
// import { sendVerificationCode } from '../services/email.service'
import { createVerification } from '../models/emailVerification.model'
import { query } from '../db'
import logger from '../utils/logger'

const loginSchema = Joi.object({
  emailOrUsername: Joi.string().required(),
  password: Joi.string().required()
})

const MAX_FAILED = 5
const LOCK_MINUTES = 15
const VERIFICATION_EXP_MINUTES = 10

export async function login(req: Request, res: Response) {
  try {
    const { emailOrUsername, password } = await loginSchema.validateAsync(req.body)

    // Find user by email or username
    let user = await findUserByEmail(emailOrUsername)
    if (!user) user = await findUserByUsername(emailOrUsername)

    if (!user) {
      // Don't reveal user existence; log failed attempt if possible
  ;(req as any).logFailedLogin?.({ emailOrUsername, reason: 'invalid credentials' })
      // Generic response
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check if account is temporarily locked
    if ((user as any).locked_until) {
      const lockedUntil = new Date((user as any).locked_until)
      if (lockedUntil > new Date()) {
        return res.status(423).json({ error: 'Account temporarily locked. Try later.' })
      }
    }

    // Email activation check removed: only password and 2FA required

    // Compare password
    const match = await comparePassword(password, user.password_hash)
    if (!match) {
      // Increment failed attempts atomically
      const incRes = await query(
        `UPDATE users SET failed_login_attempts = COALESCE(failed_login_attempts,0) + 1 WHERE id = $1 RETURNING failed_login_attempts`,
        [user.id]
      )
      const attempts = incRes.rows[0]?.failed_login_attempts ?? 1

      // If reached threshold, set lock
      if (attempts >= MAX_FAILED) {
        await query(
          `UPDATE users SET locked_until = NOW() + INTERVAL '${LOCK_MINUTES} minutes', failed_login_attempts = $2 WHERE id = $1`,
          [user.id, attempts]
        )
      }

  ;(req as any).logFailedLogin?.({ emailOrUsername, reason: 'invalid credentials' })
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Successful auth: reset failed attempts and locked_until
    await query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id])

    // Check if user has 2FA enabled
    const twoFAResult = await query(
      'SELECT is_enabled FROM two_factor_auth WHERE user_id = $1',
      [user.id]
    )

    const has2FA = twoFAResult.rows.length > 0 && twoFAResult.rows[0].is_enabled

    if (has2FA) {
      // User has 2FA configured - request Google Authenticator code
      // Create temporary session token
      const sessionResult = await query(
        `INSERT INTO sessions (user_id, token, expires_at) 
         VALUES ($1, gen_random_uuid()::text, NOW() + INTERVAL '10 minutes') 
         RETURNING token`,
        [user.id]
      )
      const tempToken = sessionResult.rows[0].token

      return res.status(200).json({ 
        message: 'Introduce el código de Google Authenticator',
        requiresGoogleAuth: true,
        tempToken
      })
    } else {
      // User doesn't have 2FA - needs to set it up
      const sessionResult = await query(
        `INSERT INTO sessions (user_id, token, expires_at) 
         VALUES ($1, gen_random_uuid()::text, NOW() + INTERVAL '10 minutes') 
         RETURNING token`,
        [user.id]
      )
      const tempToken = sessionResult.rows[0].token

      return res.status(200).json({ 
        message: 'Configura tu autenticación de dos factores',
        requiresGoogleAuthSetup: true,
        tempToken
      })
    }
  } catch (err: any) {
    if (err && err.isJoi) {
      const details = err.details ? err.details.map((d: any) => d.message) : undefined
      return res.status(400).json({ error: 'Invalid input', details })
    }
    logger.error('Login error', { err: err?.message || err })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default { login }

import { Request, Response } from 'express'
import Joi from 'joi'
import { getByCode, deleteByUserId } from '../models/emailVerification.model'
import { findUserById, updateUser } from '../models/user.model'
import { generateSecureToken } from '../services/crypto.service'
import { createSession } from '../models/session.model'
import { query } from '../db'
import logger from '../utils/logger'

const verifySchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required()
})

const TEMP_TOKEN_EXP_MINUTES = 5

export async function verifyEmailCode(req: Request, res: Response) {
  try {
    const { email, code } = await verifySchema.validateAsync(req.body)
    const verification = await getByCode(code)
    if (!verification) {
      return res.status(400).json({ error: 'Invalid or expired code' })
    }
    
    // Ensure code belongs to the provided email
    const user = await findUserById(verification.user_id)
    if (!user || user.email !== email) {
      return res.status(400).json({ error: 'Invalid code or email' })
    }
    
    // Delete verification code (one-time use)
    await deleteByUserId(user.id)
    
    // Activate user account
    await updateUser(user.id, { is_active: true })
    
    // Generate temporary token and store as short-lived session
    const token = generateSecureToken()
    const expiresAt = new Date(Date.now() + TEMP_TOKEN_EXP_MINUTES * 60 * 1000)
    await createSession({ user_id: user.id, token, ip_address: req.ip, user_agent: req.get('user-agent') || '', expires_at: expiresAt })
    
    // Check if user already has 2FA configured
    const twoFactorResult = await query(
      'SELECT secret_key FROM two_factor_auth WHERE user_id = $1',
      [user.id]
    )
    const hasTwoFactor = twoFactorResult.rows.length > 0 && twoFactorResult.rows[0].secret_key
    
    logger.info('Email code verified, temporary token issued', { 
      userId: user.id, 
      hasTwoFactor 
    })
    
    // Respond based on 2FA status
    if (hasTwoFactor) {
      // User already configured 2FA → request login code
      return res.status(200).json({ 
        temptoken: token, 
        requiresGoogleAuth: true 
      })
    } else {
      // User does NOT have 2FA → needs to set it up (show QR)
      return res.status(200).json({ 
        temptoken: token, 
        requiresGoogleAuthSetup: true 
      })
    }
  } catch (err: any) {
    if (err && err.isJoi) {
      const details = err.details ? err.details.map((d: any) => d.message) : undefined
      return res.status(400).json({ error: 'Invalid input', details })
    }
    logger.error('Verify email error', { err: err?.message || err })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default { verifyEmailCode }

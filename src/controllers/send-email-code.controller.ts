/**
 * Endpoint to send email verification code
 * Called after 2FA setup during registration
 */
import { Request, Response } from 'express'
import Joi from 'joi'
import { findUserById } from '../models/user.model'
import { generateVerificationCode } from '../services/crypto.service'
import { sendVerificationCode } from '../services/email.service'
import { query } from '../db'
import logger from '../utils/logger'

const CODE_EXPIRY_MINUTES = 30

const sendCodeSchema = Joi.object({
  userId: Joi.string().required()
})

export async function sendEmailCode(req: Request, res: Response) {
  try {
    const { userId } = await sendCodeSchema.validateAsync(req.body)

    const user = await findUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Generate verification code
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)

    // Store verification code in database
    await query(
      `INSERT INTO email_verifications (user_id, code, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE 
       SET code = $2, expires_at = $3, created_at = NOW()`,
      [user.id, code, expiresAt]
    )

    // Send verification email
    try {
      await sendVerificationCode(user.email, code)
      logger.info('Verification email sent after 2FA setup', { userId: user.id, email: user.email })
    } catch (emailErr) {
      logger.error('Failed to send verification email', { userId: user.id, error: emailErr })
      return res.status(500).json({ error: 'Error al enviar el código por email' })
    }

    return res.status(200).json({ 
      message: 'Código enviado a tu email',
      email: user.email 
    })
  } catch (err: any) {
    if (err && err.isJoi) {
      const details = err.details ? err.details.map((d: any) => d.message) : undefined
      return res.status(400).json({ error: 'Invalid input', details })
    }

    logger.error('Send email code error', { err: err?.message || err })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default { sendEmailCode }

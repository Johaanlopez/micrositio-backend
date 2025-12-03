import { Request, Response } from 'express'
import Joi from 'joi'
import speakeasy from 'speakeasy'
import jwt from 'jsonwebtoken'
import { getSessionByToken, deleteSessionById, createSession } from '../models/session.model'
import { findUserById } from '../models/user.model'
import { getTwoFactorByUserId, enableTwoFactor } from '../models/twoFactor.model'
import logger from '../utils/logger'

const verifySchema = Joi.object({
  tempToken: Joi.string().optional(),
  userId: Joi.string().uuid().optional(),
  totpCode: Joi.string().length(6).required()
}).or('tempToken', 'userId') // At least one must be present

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-me'
const JWT_EXPIRY = '1h'

export async function verify2FA(req: Request, res: Response) {
  try {
    logger.info('📥 Recibiendo petición verify-2fa', { 
      body: req.body,
      hasUserId: !!req.body.userId,
      hasTempToken: !!req.body.tempToken,
      hasTotpCode: !!req.body.totpCode
    })

    const validationResult = await verifySchema.validateAsync(req.body)
    const { tempToken, userId, totpCode } = validationResult

    logger.info('✅ Validación exitosa', { validationResult })

    let user;
    let tempSessionId: string | null = null;

    if (userId) {
      // NEW FLOW: Direct userId from registration
      user = await findUserById(userId)
      if (!user) return res.status(404).json({ error: 'User not found' })
    } else if (tempToken) {
      // OLD FLOW: tempToken from login
      const tempSession = await getSessionByToken(tempToken)
      if (!tempSession) return res.status(401).json({ error: 'Invalid or expired temp token' })
      if (new Date(tempSession.expires_at) < new Date()) return res.status(401).json({ error: 'Invalid or expired temp token' })

      user = await findUserById(tempSession.user_id)
      if (!user) return res.status(404).json({ error: 'User not found' })
      
      tempSessionId = tempSession.id
    } else {
      return res.status(400).json({ error: 'Either tempToken or userId is required' })
    }

    // Get 2FA record
    const two = await getTwoFactorByUserId(user.id)
    if (!two) return res.status(400).json({ error: '2FA not configured for user' })

    // DEBUG: Log para verificar
    logger.info('🔐 Verificando TOTP', { 
      userId: user.id, 
      totpCode, 
      totpCodeLength: totpCode.length,
      hasSecret: !!two.secret_key,
      secretLength: two.secret_key?.length,
      window: 5,
      serverTime: new Date().toISOString()
    })

    // Generar el código que DEBERÍA ser válido en este momento (para debug)
    const currentValidToken = speakeasy.totp({
      secret: two.secret_key,
      encoding: 'base32'
    })

    logger.info('🔐 Código TOTP esperado vs recibido', {
      userId: user.id,
      expectedToken: currentValidToken,
      receivedToken: totpCode,
      match: currentValidToken === totpCode
    })

    // Verify TOTP (window 5 = acepta códigos de hasta 2.5 minutos antes/después)
    const verified = speakeasy.totp.verify({
      secret: two.secret_key,
      encoding: 'base32',
      token: totpCode,
      window: 10  // 🔥 TEMPORAL: 10 = ±5 minutos de tolerancia
    })

    logger.info('🔐 Resultado verificación TOTP', { 
      userId: user.id, 
      verified,
      timestamp: new Date().toISOString()
    })

    if (!verified) {
      // Optionally log failed attempt
      // @ts-ignore
      req.logFailedLogin?.({ emailOrUsername: user.email, reason: 'invalid totp' })
      return res.status(401).json({ error: 'Invalid TOTP code. Make sure you are using the current code from your authenticator app.' })
    }

    // If first time (is_enabled false), enable it now
    if (!two.is_enabled) {
      await enableTwoFactor(two.id)
    }

    // Generate final JWT
    const payload = { sub: user.id, email: user.email, username: user.username }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })

    // Create final session record
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await createSession({ user_id: user.id, token, ip_address: req.ip, user_agent: req.get('user-agent') || '', expires_at: expiresAt })

    // Delete temporary session so token can't be reused (only if we used tempToken)
    if (tempSessionId) {
      try {
        await deleteSessionById(tempSessionId)
      } catch (err) {
        // non-fatal
        logger.warn('Could not delete temp session', { err: (err as any)?.message || err })
      }
    }

    logger.info('User completed 2FA and obtained JWT', { userId: user.id })

    return res.status(200).json({ token, user: { id: user.id, email: user.email, username: user.username } })
  } catch (err: any) {
    if (err && err.isJoi) {
      const details = err.details ? err.details.map((d: any) => d.message) : undefined
      logger.error('❌ Error de validación Joi', { error: err.message, details })
      return res.status(400).json({ error: 'Invalid input', details })
    }
    logger.error('Verify 2FA error', { err: err?.message || err })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default { verify2FA }

import { Request, Response } from 'express'
import Joi from 'joi'
// speakeasy has no bundled TypeScript types in this project; require as any to avoid TS errors
// eslint-disable-next-line @typescript-eslint/no-var-requires
const speakeasy: any = require('speakeasy')
import qrcode from 'qrcode'
import crypto from 'crypto'
import { getSessionByToken } from '../models/session.model'
import { findUserById } from '../models/user.model'
import { createTwoFactor, getTwoFactorByUserId, deleteTwoFactorByUserId } from '../models/twoFactor.model'
import { hashPassword } from '../services/crypto.service'
import logger from '../utils/logger'
import { config } from '../config'

const setupSchema = Joi.object({
  userId: Joi.string().optional() // Allow userId from registration flow
})

// Generate a single backup code (8 hex chars)
function generateBackupCode(): string {
  return crypto.randomBytes(4).toString('hex')
}

export async function setup2FA(req: Request, res: Response) {
  try {
    const { userId } = await setupSchema.validateAsync(req.body || {})

    let user = null

    // OPTION 1: Direct userId from registration (new flow)
    if (userId) {
      // Convertir userId a número para coincidir con la base de datos
      user = await findUserById(Number(userId))
      if (!user) return res.status(404).json({ error: 'User not found' })
    }
    // OPTION 2: TempToken from authorization header (old flow)
    else {
      const auth = req.get('authorization') || ''
      const match = auth.match(/^Bearer\s+(.+)$/i)
      if (!match) return res.status(401).json({ error: 'Missing authorization or userId' })
      const token = match[1]

      // Validate temp token exists and not expired
      const session = await getSessionByToken(token)
      if (!session) return res.status(401).json({ error: 'Invalid or expired token' })
      if (new Date(session.expires_at) < new Date()) return res.status(401).json({ error: 'Invalid or expired token' })

      user = await findUserById(session.user_id)
      if (!user) return res.status(404).json({ error: 'User not found' })
    }

    // ✅ VERIFICAR SI YA EXISTE UN SECRET PARA ESTE USUARIO (con retry para race conditions)
    let existing2FA = await getTwoFactorByUserId(user.id)

    if (existing2FA && existing2FA.is_enabled) {
      // Ya está activado, no permitir reconfigurar
      return res.status(400).json({ error: '2FA already enabled for this user' })
    }

    if (existing2FA && !existing2FA.is_enabled) {
      // ✅ YA EXISTE UN SECRET NO ACTIVADO - REUTILIZARLO (no crear uno nuevo)
      logger.info('🔄 Reutilizando secret existente (no activado)', { userId: user.id })
      
      const issuer = process.env.TWOFA_ISSUER || 'Micrositio'
      const label = `${issuer}:${user.username}`
      
      // Regenerar QR con el secret existente
      const otpauth = speakeasy.otpauthURL({ 
        secret: existing2FA.secret_key, 
        label, 
        issuer,
        encoding: 'base32'
      })
      const qrDataUrl = await qrcode.toDataURL(otpauth)
      
      logger.info('2FA setup response sent (reutilizado)', { 
        userId: user.id, 
        hasBackupCodes: false // No devolvemos backup codes en reutilización
      })
      
      // NO devolver backup codes (ya están hasheados)
      return res.status(200).json({ 
        qr: qrDataUrl, 
        backupCodes: [] // Array vacío para compatibilidad
      })
    }

    // ✅ NO EXISTE - CREAR NUEVO SECRET
    logger.info('🆕 Generando nuevo secret para 2FA', { userId: user.id })

    // Generate secret with speakeasy
    const issuer = process.env.TWOFA_ISSUER || 'Micrositio'
    const label = `${issuer}:${user.username}`
    const secret = speakeasy.generateSecret({ name: label, issuer })

    // Generate QR code (data URL) for the otpauth URL
    const otpauth = secret.otpauth_url || speakeasy.otpauthURL({ secret: secret.base32, label, issuer })
    const qrDataUrl = await qrcode.toDataURL(otpauth)
    const secretBase32 = secret.base32

    // Generate 10 backup codes and hash them before storing
    const plainBackupCodes: string[] = []
    const hashedBackupCodes: string[] = []
    for (let i = 0; i < 10; i++) {
      const code = generateBackupCode()
      plainBackupCodes.push(code)
      const hashed = await hashPassword(code)
      hashedBackupCodes.push(hashed)
    }

    // Save in two_factor_auth with is_enabled = false
    try {
      await createTwoFactor({ 
        user_id: user.id, 
        secret_key: secretBase32, 
        is_enabled: false, 
        backup_codes: hashedBackupCodes 
      })
    } catch (createErr: any) {
      // Si falla por duplicado, verificar si ya existe y devolverlo
      if (createErr.code === '23505') { // PostgreSQL unique violation
        logger.warn('⚠️  2FA ya existe (condición de carrera), reutilizando', { userId: user.id })
        const existingAfterRace = await getTwoFactorByUserId(user.id)
        if (existingAfterRace) {
          const otpauthExisting = speakeasy.otpauthURL({ 
            secret: existingAfterRace.secret_key, 
            label, 
            issuer,
            encoding: 'base32'
          })
          const qrExisting = await qrcode.toDataURL(otpauthExisting)
          return res.status(200).json({ 
            qr: qrExisting, 
            backupCodes: [] 
          })
        }
      }
      throw createErr
    }

    logger.info('2FA setup response sent', { userId: user.id, hasBackupCodes: plainBackupCodes.length > 0 })

    // Return QR Data URL and plain backup codes
    return res.status(200).json({ 
      qr: qrDataUrl, 
      backupCodes: plainBackupCodes 
    })
  } catch (err: any) {
    if (err && err.isJoi) {
      const details = err.details ? err.details.map((d: any) => d.message) : undefined
      return res.status(400).json({ error: 'Invalid input', details })
    }
    logger.error('Setup 2FA error', { err: err?.message || err })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default { setup2FA }

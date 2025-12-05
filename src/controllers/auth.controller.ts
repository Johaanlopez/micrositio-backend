import { Request, Response } from 'express'
import Joi from 'joi'
import { findUserByEmail, findUserByUsername, findUserByMatricula, createUser } from '../models/user.model'
import { findAuthorizedUser, findAuthorizedUserByMatricula } from '../models/authorizedUser.model'
import { hashPassword, generateVerificationCode } from '../services/crypto.service'
// import { sendVerificationCode } from '../services/email.service'
import { notifyAdminNewRegistration, notifyAdminUnauthorizedAttempt, notifyAdminDuplicateAttempt } from '../services/admin-notifications.service'
import { query } from '../db'
import logger from '../utils/logger'

// ✅ MODIFICADO: Validación actualizada según especificaciones
// Matrícula: 13 caracteres, empieza con 2 letras + números
// Username: Completamente libre, máximo 25 caracteres
// Password: Mínimo 10 caracteres, 1 mayúscula, 1 número, NO permite: ()¨"!/=?¡
const matriculaPattern = /^[A-Za-z]{2}[0-9]{11}$/  // 2 letras + 11 números = 13 caracteres
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^()¨"!/=?¡]{10,}$/  // Sin símbolos prohibidos

const registerSchema = Joi.object({
  matricula: Joi.string().pattern(matriculaPattern).length(13).required()
    .messages({
      'string.pattern.base': 'La matrícula debe empezar con 2 letras seguidas de 11 números',
      'string.length': 'La matrícula debe tener exactamente 13 caracteres'
    }),
  username: Joi.string().min(3).max(25).required()
    .messages({
      'string.max': 'El nombre de usuario no puede exceder 25 caracteres'
    }),
  password: Joi.string().pattern(passwordPattern).required()
    .messages({
      'string.pattern.base': 'La contraseña debe tener mínimo 10 caracteres, una mayúscula, un número y NO puede contener: ( ) ¨ " ! / = ? ¡'
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  acceptTerms: Joi.boolean().valid(true).required()
})

const CODE_EXPIRY_MINUTES = 30

export async function register(req: Request, res: Response) {
  try {
    // ✅ MODIFICADO: Solo se recibe matrícula, username y password
    const { matricula, username, password } = await registerSchema.validateAsync(req.body, { abortEarly: false })

    // STEP 1: Check if user is authorized (exists in authorized_users table)
    // ✅ MODIFICADO: Busca solo por matrícula y obtiene el email automáticamente
    const authorizedUser = await findAuthorizedUserByMatricula(matricula)
    if (!authorizedUser) {
      logger.warn('Registration attempt with unauthorized matricula', { matricula })

      // Send alert to admin with attempt details
      notifyAdminUnauthorizedAttempt({
        email: 'No proporcionado',
        matricula,
        username,
        ipAddress: req.ip,
        timestamp: new Date()
      }).catch(err => logger.error('Failed to send admin notification', { err }))

      return res.status(403).json({
        error: 'No estás autorizado para registrarte',
        message: 'La matrícula proporcionada no está autorizada. Contacta al administrador.'
      })
    }

    // ✅ El email se obtiene automáticamente de la tabla authorized_users
    const email = authorizedUser.email

    // STEP 2 & 3: Check if user already has an account or username is taken (Parallelized)
    const [existingByEmail, existingByMatricula, existingByUsername] = await Promise.all([
      findUserByEmail(email),
      findUserByMatricula(matricula),
      findUserByUsername(username)
    ])

    if (existingByEmail) {
      logger.warn('Registration attempt with existing email', { email })

      // Notify admin of duplicate attempt
      notifyAdminDuplicateAttempt({
        email,
        matricula,
        existingUsername: existingByEmail.username,
        ipAddress: req.ip,
        timestamp: new Date()
      }).catch(err => logger.error('Failed to send admin notification', { err }))

      return res.status(409).json({
        error: 'Ya tienes una cuenta registrada',
        message: 'Este correo ya está registrado. Por favor inicia sesión.',
        redirectToLogin: true
      })
    }

    if (existingByMatricula) {
      logger.warn('Registration attempt with existing matricula', { matricula })

      notifyAdminDuplicateAttempt({
        email: existingByMatricula.email,
        matricula,
        existingUsername: existingByMatricula.username,
        ipAddress: req.ip,
        timestamp: new Date()
      }).catch(err => logger.error('Failed to send admin notification', { err }))

      return res.status(409).json({
        error: 'Ya tienes una cuenta registrada',
        message: 'Esta matrícula ya está registrada. Por favor inicia sesión.',
        redirectToLogin: true
      })
    }

    if (existingByUsername) {
      return res.status(409).json({ error: 'El nombre de usuario ya está en uso' })
    }

    // Hash password
    const password_hash = await hashPassword(password)

    // ✅ MODIFICADO: Crear usuario sin tutor_name ni phone
    const user = await createUser({
      email,
      username,
      password_hash,
      is_active: false,
      matricula
    })

    // Send notification to admin about successful registration
    notifyAdminNewRegistration({
      email: user.email,
      username: user.username,
      matricula: user.matricula
    }).catch(err => logger.error('Failed to send admin notification', { err }))

    // Log registration (do not include sensitive data)
    logger.info('New user registered', { userId: user.id, email: user.email, username: user.username })

    // Return response indicating Google Auth setup is required FIRST
    return res.status(201).json({
      requiresGoogleAuthSetup: true,
      userId: user.id,
      message: 'Registro exitoso. Configura tu autenticación de dos factores.',
      email: user.email
    })
  } catch (err: any) {
    // Joi validation error
    if (err && err.isJoi) {
      const details = err.details ? err.details.map((d: any) => d.message) : undefined
      return res.status(400).json({ error: 'Invalid input', details })
    }

    logger.error('Registration error', { err: err?.message || err })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default { register }

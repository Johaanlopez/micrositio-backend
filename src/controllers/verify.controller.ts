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

// --- VERIFICACIÓN DE EMAIL DESHABILITADA POR MIGRACIÓN SOLO 2FA ---
/*
export async function verifyEmailCode(req: Request, res: Response) {
  // ...lógica original comentada...
}
*/

// export default { verifyEmailCode }

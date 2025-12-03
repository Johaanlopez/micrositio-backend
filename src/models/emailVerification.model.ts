import Joi from 'joi'
import { query } from '../db'

export interface EmailVerification {
  id: string
  user_id: string
  code: string
  expires_at: Date
  created_at: Date
}

export const createEmailVerificationSchema = Joi.object({
  user_id: Joi.string().required(),
  code: Joi.string().required(),
  expires_at: Joi.date().required()
})

export async function createVerification(payload: { user_id: string; code: string; expires_at: Date }): Promise<EmailVerification> {
  await createEmailVerificationSchema.validateAsync(payload)
  const res = await query<EmailVerification>(
    `INSERT INTO email_verifications (user_id, code, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE 
     SET code = $2, expires_at = $3, created_at = NOW()
     RETURNING *`,
    [payload.user_id, payload.code, payload.expires_at]
  )
  return res.rows[0]
}

export async function getByCode(code: string): Promise<EmailVerification | null> {
  const res = await query<EmailVerification>(
    `SELECT * FROM email_verifications WHERE code = $1 AND expires_at > NOW() LIMIT 1`, 
    [code]
  )
  return res.rows[0] ?? null
}

export async function deleteByUserId(userId: string): Promise<void> {
  await query('DELETE FROM email_verifications WHERE user_id = $1', [userId])
}

export async function deleteExpiredVerifications(): Promise<void> {
  await query('DELETE FROM email_verifications WHERE expires_at < NOW()')
}

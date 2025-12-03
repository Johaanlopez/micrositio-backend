import Joi from 'joi'
import { query } from '../db'

export interface TwoFactorAuth {
  id: string
  user_id: string
  secret_key: string
  is_enabled: boolean
  backup_codes: string[]
  created_at: Date
  updated_at: Date
}

export const createTwoFactorSchema = Joi.object({
  user_id: Joi.string().required(),
  secret_key: Joi.string().required(),
  is_enabled: Joi.boolean().optional(),
  backup_codes: Joi.array().items(Joi.string()).optional()
})

export async function createTwoFactor(payload: {
  user_id: string
  secret_key: string
  is_enabled?: boolean
  backup_codes?: string[]
}): Promise<TwoFactorAuth> {
  await createTwoFactorSchema.validateAsync(payload)
  const res = await query<TwoFactorAuth>(
    `INSERT INTO two_factor_auth (user_id, secret_key, is_enabled, backup_codes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [payload.user_id, payload.secret_key, payload.is_enabled ?? false, payload.backup_codes ?? []]
  )
  return res.rows[0]
}

export async function getTwoFactorByUserId(userId: string): Promise<TwoFactorAuth | null> {
  const res = await query<TwoFactorAuth>('SELECT * FROM two_factor_auth WHERE user_id = $1 LIMIT 1', [userId])
  return res.rows[0] ?? null
}

export async function enableTwoFactor(id: string): Promise<void> {
  await query('UPDATE two_factor_auth SET is_enabled = true, updated_at = NOW() WHERE id = $1', [id])
}

export async function disableTwoFactor(id: string): Promise<void> {
  await query('UPDATE two_factor_auth SET is_enabled = false, updated_at = NOW() WHERE id = $1', [id])
}

export async function addBackupCodes(id: string, codes: string[]): Promise<void> {
  // Replace backup_codes array
  await query('UPDATE two_factor_auth SET backup_codes = $1, updated_at = NOW() WHERE id = $2', [codes, id])
}

export async function consumeBackupCode(id: string, code: string): Promise<boolean> {
  // Atomically check and remove a backup code if exists
  const res = await query<{ backup_codes: string[] }>(
    `UPDATE two_factor_auth
     SET backup_codes = array_remove(backup_codes, $1), updated_at = NOW()
     WHERE id = $2 AND $1 = ANY(backup_codes)
     RETURNING backup_codes`,
    [code, id]
  )
  return (res.rowCount ?? 0) > 0
}

export async function deleteTwoFactorByUserId(userId: string): Promise<void> {
  await query('DELETE FROM two_factor_auth WHERE user_id = $1', [userId])
}

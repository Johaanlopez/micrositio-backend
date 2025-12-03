import Joi from 'joi'
import { query } from '../db'

export interface Session {
  id: string
  user_id: string
  token: string
  ip_address?: string
  user_agent?: string
  expires_at: Date
  created_at: Date
}

export const createSessionSchema = Joi.object({
  user_id: Joi.string().required(),
  token: Joi.string().required(),
  ip_address: Joi.string().allow('').optional(),
  user_agent: Joi.string().allow('').optional(),
  expires_at: Joi.date().required()
})

export async function createSession(payload: {
  user_id: string
  token: string
  ip_address?: string
  user_agent?: string
  expires_at: Date
}): Promise<Session> {
  await createSessionSchema.validateAsync(payload)
  const res = await query<Session>(
    `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [payload.user_id, payload.token, payload.ip_address ?? null, payload.user_agent ?? null, payload.expires_at]
  )
  return res.rows[0]
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const res = await query<Session>('SELECT * FROM sessions WHERE token = $1 LIMIT 1', [token])
  return res.rows[0] ?? null
}

export async function deleteSessionById(id: string): Promise<void> {
  await query('DELETE FROM sessions WHERE id = $1', [id])
}

export async function purgeExpiredSessions(): Promise<void> {
  await query('DELETE FROM sessions WHERE expires_at < NOW()')
}

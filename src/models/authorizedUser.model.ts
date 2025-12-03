import Joi from 'joi'
import { query } from '../db'

// ✅ MODIFICADO: Solo matrícula y email
export interface AuthorizedUser {
  id: string
  matricula: string
  email: string
  created_at: Date
}

export const createAuthorizedUserSchema = Joi.object({
  matricula: Joi.string().pattern(/^[A-Za-z]{2}[0-9]{11}$/).length(13).required()
    .messages({
      'string.pattern.base': 'La matrícula debe empezar con 2 letras seguidas de 11 números'
    }),
  email: Joi.string().email().required()
})

/**
 * Find an authorized user by matricula only
 * Returns the authorized user with their email
 */
export async function findAuthorizedUserByMatricula(matricula: string): Promise<AuthorizedUser | null> {
  const res = await query<AuthorizedUser>(
    `SELECT * FROM authorized_users 
     WHERE matricula = $1 
     LIMIT 1`,
    [matricula]
  )
  return res.rows[0] ?? null
}

/**
 * Find an authorized user by matching email AND matricula
 * Both must match for authorization to be granted
 */
export async function findAuthorizedUser(email: string, matricula: string): Promise<AuthorizedUser | null> {
  const res = await query<AuthorizedUser>(
    `SELECT * FROM authorized_users 
     WHERE email = $1 AND matricula = $2 
     LIMIT 1`,
    [email, matricula]
  )
  return res.rows[0] ?? null
}

/**
 * Create a new authorized user (admin function)
 */
export async function createAuthorizedUser(payload: {
  matricula: string
  email: string
}): Promise<AuthorizedUser> {
  await createAuthorizedUserSchema.validateAsync(payload)
  const res = await query<AuthorizedUser>(
    `INSERT INTO authorized_users (matricula, email)
     VALUES ($1, $2)
     RETURNING *`,
    [payload.matricula, payload.email]
  )
  return res.rows[0]
}

/**
 * Get all authorized users (admin function)
 */
export async function getAllAuthorizedUsers(): Promise<AuthorizedUser[]> {
  const res = await query<AuthorizedUser>('SELECT * FROM authorized_users ORDER BY created_at DESC')
  return res.rows
}

/**
 * Delete an authorized user by ID (admin function)
 */
export async function deleteAuthorizedUser(id: string): Promise<void> {
  await query('DELETE FROM authorized_users WHERE id = $1', [id])
}

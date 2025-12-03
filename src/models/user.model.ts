import Joi from 'joi'
import { query } from '../db'

export interface User {
  id: string
  matricula: string
  email: string
  username: string
  password_hash: string
  totp_secret?: string
  backup_codes?: string[]
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export const createUserSchema = Joi.object({
  matricula: Joi.string().pattern(/^[A-Za-z]{2}[0-9]{11}$/).length(13).required()
    .messages({
      'string.pattern.base': 'La matrícula debe empezar con 2 letras seguidas de 11 números'
    }),
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(25).required(),
  password_hash: Joi.string().min(60).required(), // bcrypt length
  is_active: Joi.boolean().optional()
})

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  password_hash: Joi.string().min(60).optional(),
  is_active: Joi.boolean().optional()
}).min(1)

// Note: All queries below use parameterized arguments ($1, $2, ...) to prevent SQL injection.

export async function createUser(payload: {
  matricula: string
  email: string
  username: string
  password_hash: string
  is_active?: boolean
}): Promise<User> {
  await createUserSchema.validateAsync(payload)
  const res = await query<User>(
    `INSERT INTO users (matricula, email, username, password_hash, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, matricula, email, username, password_hash, totp_secret, backup_codes, is_active, created_at, updated_at`,
    [payload.matricula, payload.email, payload.username, payload.password_hash, payload.is_active ?? false]
  )
  return res.rows[0]
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const res = await query<User>('SELECT * FROM users WHERE email = $1 LIMIT 1', [email])
  return res.rows[0] ?? null
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const res = await query<User>('SELECT * FROM users WHERE username = $1 LIMIT 1', [username])
  return res.rows[0] ?? null
}

export async function findUserByMatricula(matricula: string): Promise<User | null> {
  const res = await query<User>('SELECT * FROM users WHERE matricula = $1 LIMIT 1', [matricula])
  return res.rows[0] ?? null
}

export async function findUserById(id: string): Promise<User | null> {
  const res = await query<User>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id])
  return res.rows[0] ?? null
}

export async function updateUser(id: string, fields: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<User> {
  await updateUserSchema.validateAsync(fields)
  const keys = Object.keys(fields)
  if (keys.length === 0) throw new Error('No fields to update')

  const sets = keys.map((k, i) => `${k} = $${i + 1}`)
  const values = keys.map(k => (fields as any)[k])
  // updated_at to now
  const sql = `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`
  const res = await query<User>(sql, [...values, id])
  return res.rows[0]
}

export async function deactivateUser(id: string): Promise<void> {
  await query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1', [id])
}

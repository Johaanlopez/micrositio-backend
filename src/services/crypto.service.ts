import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const SALT_ROUNDS = 12

/**
 * Hash a plain password using bcrypt.
 * @param password Plain text password
 * @returns Promise resolving to bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  const hash = await bcrypt.hash(password, salt)
  return hash
}

/**
 * Compare a plain password against a bcrypt hash.
 * @param password Plain text password
 * @param hash Bcrypt hash
 * @returns Promise resolving to boolean indicating match
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a cryptographically secure random token as a hex string.
 * Uses Node's crypto.randomBytes.
 * @returns token string
 */
export function generateSecureToken(): string {
  // 48 bytes => 96 hex characters (sufficiently long for tokens)
  return crypto.randomBytes(48).toString('hex')
}

/**
 * Generate a numeric 6-digit verification code as a string (zero-padded).
 * Uses crypto.randomInt to avoid predictable randomness.
 * @returns 6-digit code string
 */
export function generateVerificationCode(): string {
  const n = crypto.randomInt(0, 1_000_000) // 0 .. 999999
  return n.toString().padStart(6, '0')
}

export default {
  hashPassword,
  comparePassword,
  generateSecureToken,
  generateVerificationCode
}

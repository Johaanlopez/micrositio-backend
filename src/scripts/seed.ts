import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env explícitamente
dotenv.config({ path: path.join(__dirname, '../../.env') });

// DEBUG: Verificar que se cargó
console.log('Puerto PostgreSQL:', process.env.PGPORT);
console.log('Host:', process.env.PGHOST);
console.log('Database:', process.env.PGDATABASE);

// ... resto de tus imports y código
import bcrypt from 'bcryptjs'
import { query } from '../db'
import logger from '../utils/logger'

async function seed() {
  try {
    // Ensure tables exist (best-effort) - small duplication with init-db
    // Create two users: one unverified and one verified
    const users = [
      { email: 'user@example.com', username: 'usuario', password: 'password123', verified: false },
      { email: 'verified@micrositio.com', username: 'verificado', password: 'password123', verified: true }
    ]

    for (const u of users) {
  const existing = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [u.email])
  if ((existing.rowCount ?? 0) > 0) {
        logger.info('User already exists, skipping', { email: u.email })
        continue
      }

      const hash = await bcrypt.hash(u.password, 10)
      const res = await query(
        `INSERT INTO users (email, username, password_hash, is_active) VALUES ($1, $2, $3, $4) RETURNING id`,
        [u.email, u.username, hash, true]
      )
      const userId = res.rows[0].id

      if (!u.verified) {
        // create a dummy verification code that expires in 1 hour
        const code = '123456'
        await query(`INSERT INTO email_verification (user_id, verification_code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')`, [userId, code])
        logger.info('Created unverified user with verification code 123456', { email: u.email })
      } else {
        logger.info('Created verified user', { email: u.email })
      }
    }

    logger.info('Seeding complete')
    process.exit(0)
  } catch (err: any) {
    logger.error('Seeding failed', { err: err?.message || err })
    process.exit(1)
  }
}

seed()

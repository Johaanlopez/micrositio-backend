import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar .env explícitamente
dotenv.config({ path: path.join(__dirname, '../../.env') });

// DEBUG: Verificar que se cargó
console.log('Puerto PostgreSQL:', process.env.PGPORT);
console.log('Host:', process.env.PGHOST);
console.log('Database:', process.env.PGDATABASE);

// ... resto de tus imports y código
import { query } from '../db'
import logger from '../utils/logger'

async function init() {
  try {
    // Enable pgcrypto for gen_random_uuid if available
    await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`)

    // Authorized users table (pre-registered users who can sign up)
    // ✅ MODIFICADO: Solo matrícula y email
    await query(`
      CREATE TABLE IF NOT EXISTS authorized_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        matricula VARCHAR(13) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT NOW()
      )
    `)

    // Users table
    // ✅ MODIFICADO: Eliminados tutor_name y phone
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        matricula VARCHAR(13) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        totp_secret TEXT,
        backup_codes TEXT[],
        is_active BOOLEAN NOT NULL DEFAULT false,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMPTZ,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `)

    // Sessions table (for refresh tokens / server sessions)
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT NOW()
      )
    `)

    // Email verification table
    await query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT NOW()
      )
    `)

    // Two-factor auth table
    await query(`
      CREATE TABLE IF NOT EXISTS two_factor_auth (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        secret_key TEXT NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT false,
        backup_codes TEXT[] DEFAULT ARRAY[]::text[],
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `)

    // email_logs is ensured in email.service but safe to ensure here too
    await query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        type TEXT NOT NULL,
        sent_at timestamptz NOT NULL DEFAULT NOW()
      )
    `)

    logger.info('Database initialized (tables ensured)')
    process.exit(0)
  } catch (err: any) {
    logger.error('Failed to initialize database', { err: err?.message || err })
    process.exit(1)
  }
}

init()

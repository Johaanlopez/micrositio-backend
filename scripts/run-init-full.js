require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { Pool } = require('pg');
const pool = new Pool();
(async () => {
  try {
    // Ensure extensions and tables
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verification (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        verification_code TEXT NOT NULL,
        expires_at timestamptz NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS two_factor_auth (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        secret_key TEXT NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT false,
        backup_codes TEXT[] DEFAULT ARRAY[]::text[],
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        type TEXT NOT NULL,
        sent_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    console.log('All tables ensured');
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('INIT FULL ERROR', e);
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  }
})();

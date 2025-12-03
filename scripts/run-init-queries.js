require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { Pool } = require('pg');
const pool = new Pool();
(async () => {
  try {
    console.log('Running simple init queries against', process.env.DATABASE_URL);
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    console.log('Created extension pgcrypto');
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
    console.log('Created users table');
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('INIT ERROR', e);
    try { await pool.end(); } catch (er) {}
    process.exit(1);
  }
})();

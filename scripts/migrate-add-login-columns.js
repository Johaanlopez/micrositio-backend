require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { Pool } = require('pg');
const pool = new Pool();
(async () => {
  try {
    console.log('Migrating: add failed_login_attempts and locked_until to users if missing');
    // Add failed_login_attempts if not exists
    await pool.query(`DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='failed_login_attempts') THEN\n    ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;\n  END IF;\nEND$$;`);
    // Add locked_until if not exists
    await pool.query(`DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='locked_until') THEN\n    ALTER TABLE users ADD COLUMN locked_until timestamptz;\n  END IF;\nEND$$;`);
    console.log('Migration completed');
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('Migration error', e);
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  }
})();

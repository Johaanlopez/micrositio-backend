const { Pool } = require('pg');
(async () => {
  const conn = process.env.DATABASE_URL || 'postgres://postgres:@127.0.0.1:4000/postgres';
  console.log('Using connection string:', conn);
  const pool = new Pool({ connectionString: conn });
  try {
    const r = await pool.query('SELECT version()');
    console.log('PG VERSION', r.rows[0]);
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('ERR', e);
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  }
})();

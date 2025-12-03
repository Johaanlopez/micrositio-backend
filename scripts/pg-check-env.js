require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { Pool } = require('pg');
(async () => {
  console.log('Loaded env DATABASE_URL =', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]*@/, ':*****@') : '<none>');
  const poolConfig = {};
  if (process.env.PGSSLMODE === 'require' || process.env.PGSSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
  const pool = new Pool(poolConfig);
  try {
    const r = await pool.query('SELECT version()');
    console.log('Connected OK, version:', r.rows[0]);
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('ERR', e);
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  }
})();

const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required.');
  process.exit(1);
}
(async () => {
  const pool = new Pool({ connectionString });
  try {
    const res = await pool.query("SELECT email, verification_code, created_at, expires_at, is_used FROM email_verification ORDER BY created_at DESC LIMIT 10");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('DB_ERROR', e.message);
    if (e.stack) console.error(e.stack);
    await pool.end().catch(()=>{});
    process.exit(2);
  }
})();

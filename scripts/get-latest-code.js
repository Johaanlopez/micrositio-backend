require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { Pool } = require('pg');
const pool = new Pool();
(async () => {
  try {
    const r = await pool.query("SELECT verification_code, expires_at, is_used, created_at FROM email_verification ORDER BY created_at DESC LIMIT 1");
    if (r.rowCount === 0) {
      console.log('No verification codes found');
    } else {
      console.log('Latest code:', r.rows[0]);
    }
    await pool.end();
  } catch (e) {
    console.error('ERR', e.message || e);
    try { await pool.end(); } catch (_) {}
  }
})();

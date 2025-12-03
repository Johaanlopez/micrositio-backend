require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool();
(async () => {
  try {
    const users = [
      { email: 'user@example.com', username: 'usuario', password: 'password123', verified: false },
      { email: 'verified@micrositio.com', username: 'verificado', password: 'password123', verified: true }
    ];

    for (const u of users) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [u.email]);
      if ((existing.rowCount ?? 0) > 0) {
        console.log('User already exists, skipping', u.email);
        continue;
      }
      const hash = await bcrypt.hash(u.password, 10);
      const res = await pool.query(
        `INSERT INTO users (email, username, password_hash, is_active) VALUES ($1, $2, $3, $4) RETURNING id`,
        [u.email, u.username, hash, true]
      );
      const userId = res.rows[0].id;
      if (!u.verified) {
        const code = '123456';
        await pool.query(`INSERT INTO email_verification (user_id, verification_code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')`, [userId, code]);
        console.log('Created unverified user with verification code 123456', u.email);
      } else {
        console.log('Created verified user', u.email);
      }
    }
    console.log('Seeding complete');
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('Seeding failed', e);
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  }
})();

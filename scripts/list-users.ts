import { query } from '../src/db';

(async () => {
  try {
    const res = await query('SELECT id, matricula, email, username, is_active, created_at FROM users');
    console.log('Usuarios registrados:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error consultando usuarios:', err);
  } finally {
    process.exit();
  }
})();

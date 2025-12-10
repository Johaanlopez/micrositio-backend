import { query } from '../src/db';

(async () => {
  try {
    const res = await query('SELECT * FROM authorized_users');
    console.log('Usuarios autorizados:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error consultando usuarios autorizados:', err);
  } finally {
    process.exit();
  }
})();

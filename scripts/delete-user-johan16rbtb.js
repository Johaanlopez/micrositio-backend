// Script para eliminar el usuario 'johan16rbtb@gmail.com' de la base de datos
const { query } = require('../src/db');

(async () => {
  try {
    const res = await query('DELETE FROM users WHERE email = $1 RETURNING *', ['johan16rbtb@gmail.com']);
    if (res.rowCount > 0) {
      console.log('Usuario eliminado:', res.rows[0]);
    } else {
      console.log('No se encontró el usuario.');
    }
  } catch (err) {
    console.error('Error eliminando usuario:', err);
  } finally {
    process.exit();
  }
})();

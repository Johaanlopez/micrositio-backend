const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 4000,
  user: 'admin',
  password: 'admin12345',
  database: 'Micrositio'
});

async function deleteUser() {
  try {
  const email = 'johan16rbtb@gmail.com';
    
    // Buscar el id del usuario
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rowCount > 0) {
      const userId = userResult.rows[0].id;
      // Eliminar 2FA
      const tfResult = await pool.query('DELETE FROM two_factor_auth WHERE user_id = $1 RETURNING *', [userId]);
      console.log('🗑️ Eliminados', tfResult.rowCount, 'registros de two_factor_auth');
      // Eliminar usuario
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);
      if (result.rowCount > 0) {
        console.log('✅ Usuario eliminado exitosamente:');
        console.log('   Email:', email);
      }
    } else {
      console.log('⚠️  No se encontró ningún usuario con ese email');
    }
    await pool.end();
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error.message);
    await pool.end();
    process.exit(1);
  }
}

deleteUser();

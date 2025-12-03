const { query } = require('./dist/db/index.js');

async function cleanUser() {
  try {
    console.log('🧹 Limpiando usuario CM12345678901...');
    
    // 1. Eliminar de two_factor_auth
    const tf = await query('DELETE FROM two_factor_auth WHERE user_id IN (SELECT id FROM users WHERE matricula = $1) RETURNING *', ['CM12345678901']);
    console.log('🗑️ Eliminados', tf.rowCount, 'registros de two_factor_auth');
    
    // 2. Eliminar de users
    const user = await query('DELETE FROM users WHERE matricula = $1 RETURNING *', ['CM12345678901']);
    if (user.rowCount > 0) {
      console.log('✅ Usuario eliminado:', user.rows[0].username);
    } else {
      console.log('ℹ️ No había usuario registrado');
    }
    
    // 3. Verificar autorización
    const auth = await query('SELECT * FROM authorized_users WHERE matricula = $1', ['CM12345678901']);
    if (auth.rowCount > 0) {
      console.log('✅ Matrícula sigue autorizada - listo para nuevo registro');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanUser();

const { query } = require('./dist/db/index.js');

async function deleteUser() {
  try {
    console.log('🗑️ Eliminando usuario con matrícula CM12345678901...');
    
    const result = await query('DELETE FROM users WHERE matricula = $1 RETURNING *', ['CM12345678901']);
    
    if (result.rowCount > 0) {
      console.log('✅ Usuario eliminado exitosamente');
      console.log('   Email:', result.rows[0].email);
      console.log('   Username:', result.rows[0].username);
    } else {
      console.log('ℹ️ No se encontró ningún usuario con esa matrícula');
    }
    
    // Verificar que la autorización sigue activa
    const authCheck = await query('SELECT * FROM authorized_users WHERE matricula = $1', ['CM12345678901']);
    if (authCheck.rowCount > 0) {
      console.log('✅ La matrícula sigue autorizada - puedes volver a registrarte');
    } else {
      console.log('⚠️ La matrícula NO está autorizada');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteUser();

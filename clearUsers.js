const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 4000,
  user: 'admin',
  password: 'admin12345',
  database: 'Micrositio'
});

async function clearRegisteredUsers() {
  try {
    // Ver usuarios registrados antes de borrar
    console.log('📋 Usuarios registrados antes de borrar:');
    const before = await pool.query('SELECT id, matricula, email, username, is_active FROM users');
    if (before.rows.length > 0) {
      console.table(before.rows);
    } else {
      console.log('   No hay usuarios registrados');
    }
    
    // Borrar todos los usuarios
    const result = await pool.query('DELETE FROM users RETURNING *');
    
    console.log(`\n✅ ${result.rowCount} usuario(s) eliminado(s) exitosamente`);
    
    // Verificar que está vacía
    const after = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`\n📊 Total de usuarios en la tabla: ${after.rows[0].count}`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

clearRegisteredUsers();

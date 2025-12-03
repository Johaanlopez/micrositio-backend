const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 4000,
  user: 'admin',
  password: 'admin12345',
  database: 'Micrositio'
});

async function checkAndAddAuthorizedUser() {
  try {
    // Ver usuarios autorizados actuales
    console.log('📋 Usuarios autorizados actuales:');
    const current = await pool.query('SELECT matricula, email FROM authorized_users');
    console.table(current.rows);
    
    // Agregar usuario de prueba
    const matricula = 'JL12345678901';
    const email = 'johanlopezu.109@gmail.com';
    
    const result = await pool.query(
      `INSERT INTO authorized_users (matricula, email)
       VALUES ($1, $2)
       ON CONFLICT (email) 
       DO UPDATE SET matricula = $1
       RETURNING *`,
      [matricula, email]
    );
    
    console.log('\n✅ Usuario autorizado agregado/actualizado:');
    console.log('   Matrícula:', result.rows[0].matricula);
    console.log('   Email:', result.rows[0].email);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkAndAddAuthorizedUser();

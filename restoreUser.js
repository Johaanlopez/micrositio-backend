const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 4000,
  user: 'admin',
  password: 'admin12345',
  database: 'Micrositio'
});

async function restoreAuthorizedUser() {
  try {
    const matricula = 'CM12345678901';
    const email = 'johan16rbtb@gmail.com';
    
    const result = await pool.query(
      `INSERT INTO authorized_users (matricula, email)
       VALUES ($1, $2)
       ON CONFLICT (email) 
       DO UPDATE SET matricula = $1
       RETURNING *`,
      [matricula, email]
    );
    
    console.log('✅ Usuario autorizado restaurado:');
    console.log('   Matrícula:', result.rows[0].matricula);
    console.log('   Email:', result.rows[0].email);
    
    // Mostrar todos los usuarios autorizados
    console.log('\n📋 Todos los usuarios autorizados:');
    const all = await pool.query('SELECT matricula, email FROM authorized_users ORDER BY matricula');
    console.table(all.rows);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

restoreAuthorizedUser();

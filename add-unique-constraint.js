const pool = require('./dist/db').default;

(async () => {
  try {
    console.log('🔧 Agregando constraint UNIQUE a two_factor_auth.user_id...');
    
    // Primero limpiar duplicados (mantener solo el más reciente de cada usuario)
    await pool.query(`
      DELETE FROM two_factor_auth 
      WHERE ctid NOT IN (
        SELECT MAX(ctid) 
        FROM two_factor_auth 
        GROUP BY user_id
      )
    `);
    
    console.log('✅ Duplicados eliminados');
    
    // Agregar el constraint
    await pool.query(`
      ALTER TABLE two_factor_auth 
      ADD CONSTRAINT two_factor_auth_user_id_unique 
      UNIQUE (user_id)
    `);
    
    console.log('✅ Constraint UNIQUE agregado exitosamente');
    await pool.end();
  } catch (error) {
    if (error.code === '42P07') {
      console.log('ℹ️  Constraint ya existe');
    } else {
      console.error('❌ Error:', error.message);
    }
    await pool.end();
    process.exit(1);
  }
})();

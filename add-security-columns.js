const pool = require('./dist/db').default;

(async () => {
  try {
    console.log('🔧 Agregando columnas de seguridad a la tabla users...');
    
    // Agregar failed_login_attempts
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0
    `);
    
    console.log('✅ Columna failed_login_attempts agregada');
    
    // Agregar locked_until
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ
    `);
    
    console.log('✅ Columna locked_until agregada');
    
    await pool.end();
    console.log('✅ Migraciones completadas exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();

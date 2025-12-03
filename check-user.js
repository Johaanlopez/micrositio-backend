const pool = require('./dist/db').default;

const MATRICULA = 'CM12345678901';

(async () => {
  try {
    console.log(`🔍 Buscando usuario con matrícula: ${MATRICULA}`);
    
    const userResult = await pool.query(
      'SELECT id, matricula, username, email, created_at FROM users WHERE matricula = $1',
      [MATRICULA]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuario NO encontrado');
    } else {
      const user = userResult.rows[0];
      console.log('✅ Usuario encontrado:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Matrícula: ${user.matricula}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Creado: ${user.created_at}`);
      
      // Check 2FA status
      const twoFactorResult = await pool.query(
        'SELECT id, is_enabled FROM two_factor_auth WHERE user_id = $1',
        [user.id]
      );
      
      if (twoFactorResult.rows.length > 0) {
        const twoFactor = twoFactorResult.rows[0];
        console.log(`   2FA Status: ${twoFactor.is_enabled ? '✅ ACTIVADO' : '⏳ Pendiente activación'}`);
      } else {
        console.log('   2FA Status: ❌ No configurado');
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();

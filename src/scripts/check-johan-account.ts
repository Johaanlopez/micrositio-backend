import { query } from '../db';

async function checkJohanAccount() {
  try {
    const email = 'johan16rbtb@gmail.com';
    
    // Check user
    const userResult = await query(
      'SELECT id, email, username, matricula, phone, tutor_name, is_active, created_at FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log('👤 Usuario encontrado:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Username:', user.username);
    console.log('  Matricula:', user.matricula);
    console.log('  Phone:', user.phone);
    console.log('  Tutor:', user.tutor_name);
    console.log('  Activo:', user.is_active ? '✅ SÍ' : '❌ NO');
    console.log('  Creado:', user.created_at);
    
    // Check 2FA
    const twoFAResult = await query(
      'SELECT is_enabled, created_at FROM two_factor_auth WHERE user_id = $1',
      [user.id]
    );
    
    console.log('\n🔐 Estado 2FA:');
    if (twoFAResult.rows.length > 0) {
      const twoFA = twoFAResult.rows[0];
      console.log('  Configurado:', twoFA.is_enabled ? '✅ SÍ' : '❌ NO');
      console.log('  Fecha:', twoFA.created_at);
    } else {
      console.log('  ❌ NO configurado');
    }
    
    // Check email verification
    const emailVerif = await query(
      'SELECT code, expires_at, created_at FROM email_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );
    
    console.log('\n📧 Última verificación de email:');
    if (emailVerif.rows.length > 0) {
      const verif = emailVerif.rows[0];
      console.log('  Código:', verif.code);
      console.log('  Expira:', verif.expires_at);
      console.log('  Creado:', verif.created_at);
      const expired = new Date(verif.expires_at) < new Date();
      console.log('  Estado:', expired ? '❌ EXPIRADO' : '✅ VÁLIDO');
    } else {
      console.log('  ℹ️ Sin códigos de verificación');
    }
    
    // If account is not active, activate it
    if (!user.is_active) {
      console.log('\n⚠️ Cuenta inactiva. ¿Activar cuenta? (s/n)');
      console.log('Activando automáticamente...');
      
      await query('UPDATE users SET is_active = true WHERE id = $1', [user.id]);
      console.log('✅ Cuenta activada exitosamente');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkJohanAccount();

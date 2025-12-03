import { query } from '../db';

async function deleteJohanAccount() {
  try {
    const email = 'johan16rbtb@gmail.com';
    
    // Find user
    const userResult = await query(
      'SELECT id, email, username FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      process.exit(0);
    }
    
    const user = userResult.rows[0];
    console.log('🗑️ Eliminando usuario:');
    console.log('  Email:', user.email);
    console.log('  Username:', user.username);
    
    // Delete related data (CASCADE should handle this, but let's be explicit)
    await query('DELETE FROM email_verifications WHERE user_id = $1', [user.id]);
    console.log('  ✅ Email verifications eliminados');
    
    await query('DELETE FROM two_factor_auth WHERE user_id = $1', [user.id]);
    console.log('  ✅ 2FA eliminado');
    
    await query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
    console.log('  ✅ Sesiones eliminadas');
    
    // Delete user
    await query('DELETE FROM users WHERE id = $1', [user.id]);
    console.log('  ✅ Usuario eliminado');
    
    console.log('\n✅ Cuenta eliminada completamente. Puedes registrarte de nuevo.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteJohanAccount();

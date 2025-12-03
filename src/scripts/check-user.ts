import { query } from '../db';

async function checkUser() {
  try {
    const email = 'johan16rbtb@gmail.com';
    const matricula = '15200232';
    
    // Check in users table
    const userResult = await query(
      'SELECT id, email, enrollment_number, username, is_active, created_at FROM users WHERE email = $1 OR enrollment_number = $2',
      [email, matricula]
    );
    
    console.log('👤 User in database:');
    if (userResult.rows.length > 0) {
      console.log(userResult.rows[0]);
    } else {
      console.log('❌ User NOT found');
    }
    
    // Check if 2FA is enabled
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      const twoFAResult = await query(
        'SELECT is_enabled, created_at FROM two_factor_auth WHERE user_id = $1',
        [userId]
      );
      
      console.log('\n🔐 2FA Status:');
      if (twoFAResult.rows.length > 0) {
        console.log(twoFAResult.rows[0]);
      } else {
        console.log('❌ 2FA NOT configured');
      }
      
      // Check email verification
      const emailVerif = await query(
        'SELECT code, expires_at, created_at FROM email_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      
      console.log('\n📧 Latest email verification:');
      if (emailVerif.rows.length > 0) {
        console.log(emailVerif.rows[0]);
      } else {
        console.log('❌ No email verification found');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking user:', error);
    process.exit(1);
  }
}

checkUser();

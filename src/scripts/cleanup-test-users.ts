import { query } from '../db';

async function cleanupTestUsers() {
  try {
    console.log('🧹 Cleaning up test users...\n');
    
    // Delete test users
    const result = await query(`
      DELETE FROM users 
      WHERE email IN ('user@example.com', 'verified@micrositio.com')
      RETURNING email
    `);
    
    console.log(`✅ Deleted ${result.rows.length} test users:`);
    result.rows.forEach((user: any) => {
      console.log(' -', user.email);
    });
    
    // Show remaining users
    const remaining = await query('SELECT id, email, username, matricula, is_active FROM users');
    
    console.log(`\n👤 Remaining users: ${remaining.rows.length}`);
    if (remaining.rows.length > 0) {
      remaining.rows.forEach((user: any) => {
        console.log('\n---');
        console.log('Email:', user.email);
        console.log('Username:', user.username);
        console.log('Matricula:', user.matricula);
        console.log('Active:', user.is_active);
      });
    } else {
      console.log('No users in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupTestUsers();

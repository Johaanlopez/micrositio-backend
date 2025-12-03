import { query } from '../db';

async function checkUsers() {
  try {
    const result = await query('SELECT * FROM users LIMIT 5');
    
    console.log('👤 Users in database:');
    console.log(`Total: ${result.rows.length} rows`);
    result.rows.forEach((user: any) => {
      console.log('\n---');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Username:', user.username);
      console.log('Is Active:', user.is_active);
      console.log('Created:', user.created_at);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();

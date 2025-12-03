import { query } from '../db';

async function listTables() {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in database:');
    result.rows.forEach((row: any) => {
      console.log(' -', row.table_name);
    });
    
    // Check users table schema
    if (result.rows.some((r: any) => r.table_name === 'users')) {
      const schema = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);
      
      console.log('\n👤 Users table schema:');
      schema.rows.forEach((col: any) => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listTables();

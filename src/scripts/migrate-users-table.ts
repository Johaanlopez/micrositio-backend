import { query } from '../db';

async function migrateUsersTable() {
  try {
    console.log('🔄 Starting migration of users table...\n');
    
    // Check if columns exist
    const checkColumns = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('matricula', 'tutor_name', 'phone')
    `);
    
    const existingCols = checkColumns.rows.map((r: any) => r.column_name);
    console.log('Existing columns:', existingCols);
    
    // Add matricula if not exists
    if (!existingCols.includes('matricula')) {
      console.log('➕ Adding matricula column...');
      await query(`
        ALTER TABLE users 
        ADD COLUMN matricula TEXT UNIQUE
      `);
      console.log('✅ matricula column added');
    }
    
    // Add tutor_name if not exists
    if (!existingCols.includes('tutor_name')) {
      console.log('➕ Adding tutor_name column...');
      await query(`
        ALTER TABLE users 
        ADD COLUMN tutor_name TEXT
      `);
      console.log('✅ tutor_name column added');
    }
    
    // Add phone if not exists
    if (!existingCols.includes('phone')) {
      console.log('➕ Adding phone column...');
      await query(`
        ALTER TABLE users 
        ADD COLUMN phone TEXT
      `);
      console.log('✅ phone column added');
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    // Show final schema
    const schema = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Final users table schema:');
    schema.rows.forEach((col: any) => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateUsersTable();

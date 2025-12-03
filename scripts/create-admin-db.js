const { Pool } = require('pg');
const superUser = process.env.PG_SUPER_USER;
const superPass = process.env.PG_SUPER_PASS;
const host = process.env.PGHOST || '127.0.0.1';
const port = process.env.PGPORT || 4000;
const adminRole = process.env.PG_ADMIN_ROLE || 'admin';
const adminPass = process.env.PG_ADMIN_PASS || 'adminpass';
const dbName = process.env.PG_DB_NAME || 'Micrositio';

if (!superUser || !superPass) {
  console.error('PG_SUPER_USER and PG_SUPER_PASS environment variables are required.');
  process.exit(1);
}

const conn = `postgres://${superUser}:${superPass}@${host}:${port}/postgres`;
console.log('Connecting as superuser to:', conn.replace(/:[^:@]*@/, ':*****@'));
const pool = new Pool({ connectionString: conn });
(async () => {
  try {
    // Create role admin if not exists
    const createRoleSql = `DO $$\nBEGIN\n  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${adminRole}') THEN\n    CREATE ROLE ${adminRole} WITH LOGIN PASSWORD '${adminPass}';\n  END IF;\nEND$$;`;
    await pool.query(createRoleSql);
    console.log(`Ensured role ${adminRole} exists (password: [hidden])`);

    // Create database if not exists (must run CREATE DATABASE outside transactions)
    const dbCheck = await pool.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}' LIMIT 1`);
    if (dbCheck.rowCount === 0) {
      // Execute CREATE DATABASE as a separate non-transactional command
      await pool.query(`CREATE DATABASE "${dbName}" OWNER ${adminRole}`);
      console.log(`Created database "${dbName}" and set owner to ${adminRole}`);
    } else {
      console.log(`Database "${dbName}" already exists`);
    }

    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('Error creating role/db:', e);
    try { await pool.end(); } catch (er) {}
    process.exit(1);
  }
})();

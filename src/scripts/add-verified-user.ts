import pool from '../db';
import logger from '../utils/logger';

/**
 * Script para agregar un usuario a la tabla authorized_users
 * Estos usuarios podrán registrarse en el sistema
 * Uso: npx ts-node src/scripts/add-verified-user.ts <matricula> <email> <phone> <tutor_name>
 */

async function addAuthorizedUser(matricula: string, email: string, phone: string, tutorName: string) {
  try {
    logger.info('Agregando usuario autorizado...', { matricula, email, phone, tutorName });

    // Insertar usuario en authorized_users
    const result = await pool.query(
      `INSERT INTO authorized_users (id, matricula, email, phone, tutor_name, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING id, matricula, email, phone, tutor_name, created_at`,
      [matricula, email, phone, tutorName]
    );

    logger.info('✅ Usuario autorizado agregado exitosamente', result.rows[0]);
    console.log('\n=================================');
    console.log('✅ Usuario autorizado agregado');
    console.log('=================================');
    console.log('ID:', result.rows[0].id);
    console.log('Matrícula:', result.rows[0].matricula);
    console.log('Email:', result.rows[0].email);
    console.log('Teléfono:', result.rows[0].phone);
    console.log('Tutor:', result.rows[0].tutor_name);
    console.log('Fecha:', result.rows[0].created_at);
    console.log('\n✅ Este usuario ahora puede registrarse en el sistema');
    console.log('=================================\n');

    process.exit(0);
  } catch (error: any) {
    if (error.code === '23505') {
      logger.error('❌ Error: El usuario ya existe', { 
        constraint: error.constraint,
        detail: error.detail 
      });
      console.error('\n❌ Error: El usuario ya existe');
      console.error('Detalle:', error.detail);
    } else {
      logger.error('❌ Error agregando usuario', { error: error.message });
      console.error('\n❌ Error:', error.message);
    }
    process.exit(1);
  }
}

// Validar argumentos
const args = process.argv.slice(2);
if (args.length !== 4) {
  console.error('Uso: npx ts-node src/scripts/add-verified-user.ts <matricula> <email> <phone> <tutor_name>');
  console.error('Ejemplo: npx ts-node src/scripts/add-verified-user.ts 15200233 rodrigoiyac@hotmail.com 5565593157 "Nombre del Tutor"');
  process.exit(1);
}

const [matricula, email, phone, tutorName] = args;
addAuthorizedUser(matricula, email, phone, tutorName);

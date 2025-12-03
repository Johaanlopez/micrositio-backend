/**
 * Script to add Johan's data to authorized_users table
 */
import { query } from '../db'
import logger from '../utils/logger'

async function addJohan() {
  try {
    logger.info('Adding Johan to authorized_users...')

    // Insert Johan's data
    const result = await query(
      `INSERT INTO authorized_users (matricula, email, phone, tutor_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE 
       SET matricula = $1, phone = $3, tutor_name = $4
       RETURNING *`,
      ['15200232', 'johan16rbtb@gmail.com', '5579240470', 'Tutor de Johan']
    )

    logger.info('Johan added successfully!', { 
      email: result.rows[0].email,
      matricula: result.rows[0].matricula 
    })
    
    console.log('\n✅ Usuario autorizado agregado:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Matrícula:', result.rows[0].matricula)
    console.log('Email:    ', result.rows[0].email)
    console.log('Teléfono: ', result.rows[0].phone)
    console.log('Tutor:    ', result.rows[0].tutor_name)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    process.exit(0)
  } catch (err: any) {
    logger.error('Failed to add Johan', { err: err?.message || err })
    console.error('\n❌ Error:', err?.message || err)
    process.exit(1)
  }
}

addJohan()

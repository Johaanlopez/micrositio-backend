/**
 * Script to delete a user by email
 * Usage: npx ts-node src/scripts/delete-user.ts johan16rbtb@gmail.com
 */
import pool from '../db'
import logger from '../utils/logger'

async function deleteUser(email: string) {
  try {
    logger.info('Buscando usuario...', { email })

    // Buscar usuario
    const userResult = await pool.query('SELECT id, email, username FROM users WHERE email = $1', [email])
    
    if (userResult.rows.length === 0) {
      logger.warn('❌ Usuario no encontrado', { email })
      process.exit(1)
    }

    const user = userResult.rows[0]
    logger.info('✅ Usuario encontrado', { id: user.id, email: user.email, username: user.username })

    // Eliminar en orden (por las foreign keys)
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [user.id])
    logger.info('🗑️  Sesiones eliminadas')

    await pool.query('DELETE FROM two_factor_auth WHERE user_id = $1', [user.id])
    logger.info('🗑️  2FA eliminado')

    await pool.query('DELETE FROM email_verifications WHERE user_id = $1', [user.id])
    logger.info('🗑️  Verificaciones de email eliminadas')

    await pool.query('DELETE FROM users WHERE id = $1', [user.id])
    logger.info('🗑️  Usuario eliminado')

    logger.info('✅ Usuario completamente eliminado de la base de datos')
    process.exit(0)

  } catch (err: any) {
    logger.error('❌ Error eliminando usuario', { err: err?.message || err })
    process.exit(1)
  }
}

// Obtener email desde argumentos de línea de comandos
const email = process.argv[2]

if (!email) {
  console.error('❌ Uso: npx ts-node src/scripts/delete-user.ts <email>')
  console.error('Ejemplo: npx ts-node src/scripts/delete-user.ts johan16rbtb@gmail.com')
  process.exit(1)
}

deleteUser(email)

/**
 * Script para verificar el estado de 2FA de un usuario
 * Usage: npx ts-node src/scripts/check-user-2fa.ts johan16rbtb@gmail.com
 */
import pool from '../db'
import logger from '../utils/logger'

async function checkUser2FA(email: string) {
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

    // Buscar registros de 2FA
    const twoFAResult = await pool.query(
      'SELECT id, secret_key, is_enabled, created_at FROM two_factor_auth WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    )

    if (twoFAResult.rows.length === 0) {
      logger.warn('⚠️  No hay registros de 2FA para este usuario')
    } else {
      logger.info(`📊 Registros de 2FA encontrados: ${twoFAResult.rows.length}`)
      twoFAResult.rows.forEach((row, idx) => {
        logger.info(`  [${idx + 1}] ID: ${row.id}`, {
          secret: row.secret_key.substring(0, 10) + '...',
          isEnabled: row.is_enabled,
          createdAt: row.created_at
        })
      })
      
      if (twoFAResult.rows.length > 1) {
        logger.warn('⚠️  ¡MÚLTIPLES REGISTROS DE 2FA! Esto puede causar problemas.')
        logger.warn('   Debería haber solo 1 registro por usuario.')
      }
    }

    process.exit(0)

  } catch (err: any) {
    logger.error('❌ Error verificando 2FA', { err: err?.message || err })
    process.exit(1)
  }
}

const email = process.argv[2]

if (!email) {
  console.error('❌ Uso: npx ts-node src/scripts/check-user-2fa.ts <email>')
  console.error('Ejemplo: npx ts-node src/scripts/check-user-2fa.ts johan16rbtb@gmail.com')
  process.exit(1)
}

checkUser2FA(email)

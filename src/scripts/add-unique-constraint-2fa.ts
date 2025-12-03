/**
 * Script para agregar restricción UNIQUE a two_factor_auth.user_id
 * Esto previene que se creen múltiples registros de 2FA para el mismo usuario
 */
import pool from '../db'
import logger from '../utils/logger'

async function addUniqueConstraint() {
  try {
    logger.info('🔧 Agregando restricción UNIQUE a two_factor_auth.user_id...')

    // Primero, eliminar duplicados existentes (mantener solo el más reciente)
    await pool.query(`
      DELETE FROM two_factor_auth
      WHERE id NOT IN (
        SELECT DISTINCT ON (user_id) id
        FROM two_factor_auth
        ORDER BY user_id, created_at DESC
      )
    `)
    
    logger.info('✅ Duplicados eliminados')

    // Agregar restricción UNIQUE
    await pool.query(`
      ALTER TABLE two_factor_auth
      ADD CONSTRAINT two_factor_auth_user_id_unique UNIQUE (user_id)
    `)

    logger.info('✅ Restricción UNIQUE agregada exitosamente')
    logger.info('   Ahora solo puede haber 1 registro de 2FA por usuario')
    process.exit(0)

  } catch (err: any) {
    if (err.code === '42P07') {
      logger.info('✅ La restricción UNIQUE ya existe')
      process.exit(0)
    }
    logger.error('❌ Error agregando restricción', { err: err?.message || err })
    process.exit(1)
  }
}

addUniqueConstraint()

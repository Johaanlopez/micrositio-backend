/**
 * Script to populate authorized_users table with sample data
 * Run this to add users who are allowed to register
 */
import { createAuthorizedUser } from '../models/authorizedUser.model'
import logger from '../utils/logger'

async function seed() {
  try {
    logger.info('Seeding authorized_users table...')

    // Example authorized users - replace with real data
    const authorizedUsers = [
      {
        matricula: 'CM12345678901',
        email: 'johan16rbtb@gmail.com'
      },
      {
        matricula: 'AB12345678901',
        email: 'juan.perez@example.com'
      },
      {
        matricula: 'XY98765432109',
        email: 'ana.garcia@example.com'
      }
    ]

    for (const user of authorizedUsers) {
      try {
        await createAuthorizedUser(user)
        logger.info('Created authorized user', { matricula: user.matricula, email: user.email })
      } catch (err: any) {
        // Ignore duplicate errors (user already exists)
        if (err?.code === '23505') {
          logger.info('Authorized user already exists', { matricula: user.matricula })
        } else {
          logger.error('Failed to create authorized user', { user, error: err?.message })
        }
      }
    }

    logger.info('Seeding completed!')
    process.exit(0)
  } catch (err: any) {
    logger.error('Seeding failed', { err: err?.message || err })
    console.error(err)
    process.exit(1)
  }
}

seed()

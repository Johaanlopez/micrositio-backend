/**
 * Migration script to add new fields to users table
 * Run this ONCE if you have existing users table
 */
import { query } from '../db'
import logger from '../utils/logger'

async function migrate() {
  try {
    logger.info('Starting migration: add user fields...')

    // Add new columns if they don't exist
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS matricula TEXT,
      ADD COLUMN IF NOT EXISTS tutor_name TEXT,
      ADD COLUMN IF NOT EXISTS phone TEXT
    `)

    // Make is_active default to false instead of true
    await query(`
      ALTER TABLE users 
      ALTER COLUMN is_active SET DEFAULT false
    `)

    // Add unique constraint to matricula
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_matricula_key'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_matricula_key UNIQUE (matricula);
        END IF;
      END $$;
    `)

    // Rename email_verification table if it exists
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'email_verification'
        ) THEN
          ALTER TABLE email_verification RENAME TO email_verifications;
        END IF;
      END $$;
    `)

    // Rename verification_code column if it exists
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'email_verifications' AND column_name = 'verification_code'
        ) THEN
          ALTER TABLE email_verifications RENAME COLUMN verification_code TO code;
        END IF;
      END $$;
    `)

    // Drop is_used column if it exists (not needed)
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'email_verifications' AND column_name = 'is_used'
        ) THEN
          ALTER TABLE email_verifications DROP COLUMN is_used;
        END IF;
      END $$;
    `)

    // Add unique constraint to user_id in email_verifications
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'email_verifications_user_id_key'
        ) THEN
          ALTER TABLE email_verifications ADD CONSTRAINT email_verifications_user_id_key UNIQUE (user_id);
        END IF;
      END $$;
    `)

    logger.info('Migration completed successfully!')
    process.exit(0)
  } catch (err: any) {
    logger.error('Migration failed', { err: err?.message || err })
    console.error(err)
    process.exit(1)
  }
}

migrate()

// Test environment setup for security tests
import 'dotenv/config';

// Ensure test env
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
// Use a stable JWT secret for tests unless provided
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

// If you need to mock external services (email, wordpress) you can set them here.

// Close database pool after all tests
afterAll(async () => {
  const pool = (await import('../../src/db')).default;
  await pool.end();
});

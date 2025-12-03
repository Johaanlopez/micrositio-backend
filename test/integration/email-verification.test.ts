import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/db';

describe('Security: Email Verification', () => {
  const testUser = {
    matricula: '2024997',
    email: 'test.emailverif@example.com',
    tutorName: 'Test Email Tutor',
    username: 'testemailverif',
    phone: '5551112222',
    password: 'EmailTest123!@#'
  };

  let userId: string;
  let verificationCode: string;

  beforeAll(async () => {
    // Crear usuario autorizado
    await pool.query(
      `INSERT INTO authorized_users (matricula, email, phone, tutor_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (matricula) DO NOTHING`,
      [testUser.matricula, testUser.email, testUser.phone, testUser.tutorName]
    );
    
    // Esperar un poco para evitar rate limiting de email
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM email_verifications WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await pool.query('DELETE FROM authorized_users WHERE matricula = $1', [testUser.matricula]);
  });

  it('should send and verify email code successfully', async () => {
    // Registrar usuario
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        ...testUser,
        confirmPassword: testUser.password,
        acceptTerms: true
      })
      .expect(201);

    userId = registerRes.body.userId;

    // Enviar código de verificación
    const sendRes = await request(app)
      .post('/api/auth/send-email-code')
      .send({ userId })
      .expect(200);

    expect(sendRes.body).toHaveProperty('message');

    // Obtener código de la BD para testing
    const codeResult = await pool.query(
      'SELECT code FROM email_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    expect(codeResult.rows.length).toBe(1);
    verificationCode = codeResult.rows[0].code;

    // Verificar email
    const verifyRes = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: testUser.email, code: verificationCode })
      .expect(200);

    expect(verifyRes.body).toHaveProperty('temptoken');

    // Verificar que el usuario fue marcado como activo
    const userCheck = await pool.query(
      'SELECT is_active FROM users WHERE id = $1',
      [userId]
    );
    expect(userCheck.rows[0].is_active).toBe(true);
  });

  it('should reject invalid email verification codes', async () => {
    await request(app)
      .post('/api/auth/verify-email')
      .send({ email: testUser.email, code: '000000' })
      .expect(400); // Invalid code returns 400, not 401
  });

  it('should prevent email verification for non-existent user', async () => {
    const fakeEmail = 'fake.user@example.com';
    
    await request(app)
      .post('/api/auth/verify-email')
      .send({ email: fakeEmail, code: '123456' })
      .expect(400); // Invalid code returns 400, not 404
  });
});

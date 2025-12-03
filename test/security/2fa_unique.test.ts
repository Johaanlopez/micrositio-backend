import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/db';

describe('Security: 2FA Unique Constraint', () => {
  const testUser = {
    matricula: '2024996',
    email: 'test.unique2fa@example.com',
    tutorName: 'Test Unique Tutor',
    username: 'testunique2fa',
    phone: '5553334444',
    password: 'Unique2FA123!@#'
  };

  let userId: string;

  beforeAll(async () => {
    // Crear usuario autorizado
    await pool.query(
      `INSERT INTO authorized_users (matricula, email, phone, tutor_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (matricula) DO NOTHING`,
      [testUser.matricula, testUser.email, testUser.phone, testUser.tutorName]
    );
  });

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM two_factor_auth WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await pool.query('DELETE FROM authorized_users WHERE matricula = $1', [testUser.matricula]);
  });

  it('should prevent duplicate 2FA records for same user', async () => {
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

    // Primera llamada a setup-2fa
    const setup1 = await request(app)
      .post('/api/auth/setup-2fa')
      .send({ userId })
      .expect(200);

    expect(setup1.body).toHaveProperty('qr');

    // Segunda llamada a setup-2fa (simula double render de React)
    const setup2 = await request(app)
      .post('/api/auth/setup-2fa')
      .send({ userId })
      .expect(200);

    expect(setup2.body).toHaveProperty('qr');

    // Verificar que solo hay UN registro en la base de datos
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM two_factor_auth WHERE user_id = $1',
      [userId]
    );

    const count = parseInt(countResult.rows[0].count);
    expect(count).toBe(1);
  });

  it('should return same QR for multiple setup requests', async () => {
    // Múltiples llamadas deberían devolver el mismo secret
    const setup1 = await request(app)
      .post('/api/auth/setup-2fa')
      .send({ userId })
      .expect(200);

    const setup2 = await request(app)
      .post('/api/auth/setup-2fa')
      .send({ userId })
      .expect(200);

    const setup3 = await request(app)
      .post('/api/auth/setup-2fa')
      .send({ userId })
      .expect(200);

    // Los QR deberían ser idénticos
    expect(setup1.body.qr).toBe(setup2.body.qr);
    expect(setup2.body.qr).toBe(setup3.body.qr);
  });
});

import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/db';
import speakeasy from 'speakeasy';
import { hashPassword } from '../../src/services/crypto.service';

describe('Integration: Login Flow with 2FA', () => {
  const testUser = {
    matricula: '2024998',
    email: 'test.login@example.com',
    tutorName: 'Test Login Tutor',
    username: 'testlogin998',
    phone: '5559876543',
    password: 'LoginPassword123!@#'
  };

  let userId: string;
  let secret: string;

  beforeAll(async () => {
    // Crear usuario autorizado
    await pool.query(
      `INSERT INTO authorized_users (matricula, email, phone, tutor_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (matricula) DO NOTHING`,
      [testUser.matricula, testUser.email, testUser.phone, testUser.tutorName]
    );

    // Crear usuario
    const hashedPwd = await hashPassword(testUser.password);
    const userResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, phone, tutor_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [testUser.username, testUser.email, hashedPwd, testUser.phone, testUser.tutorName]
    );
    userId = userResult.rows[0].id;

    // Generar secret 2FA
    const secretObj: any = speakeasy.generateSecret({ name: 'Micrositio:' + testUser.username });
    secret = secretObj.base32;

    // Guardar 2FA habilitado
    await pool.query(
      `INSERT INTO two_factor_auth (user_id, secret_key, is_enabled, backup_codes)
       VALUES ($1, $2, $3, $4)`,
      [userId, secret, true, []]
    );
  });

  afterAll(async () => {
    // Limpiar
    await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM two_factor_auth WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM email_verifications WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.query('DELETE FROM authorized_users WHERE matricula = $1', [testUser.matricula]);
  });

  it('should complete login with valid credentials and TOTP', async () => {
    // PASO 1: Login (obtener tempToken)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrUsername: testUser.email,
        password: testUser.password
      })
      .expect(200);

    expect(loginRes.body).toHaveProperty('requiresGoogleAuth', true);
    expect(loginRes.body).toHaveProperty('tempToken');

    const tempToken = loginRes.body.tempToken;

    // PASO 2: Generar código TOTP válido
    const totpCode = speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });

    // PASO 3: Verificar 2FA
    const verify2faRes = await request(app)
      .post('/api/auth/verify-2fa')
      .send({ tempToken, totpCode })
      .expect(200);

    expect(verify2faRes.body).toHaveProperty('token');
    expect(verify2faRes.body).toHaveProperty('user');
    expect(verify2faRes.body.user.email).toBe(testUser.email);
  });

  it('should reject login with invalid password', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        emailOrUsername: testUser.email,
        password: 'WrongPassword123!@#'
      })
      .expect(401);
  });

  it('should reject 2FA with invalid TOTP code', async () => {
    // Login válido
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        emailOrUsername: testUser.email,
        password: testUser.password
      })
      .expect(200);

    const tempToken = loginRes.body.tempToken;

    // Código TOTP inválido
    await request(app)
      .post('/api/auth/verify-2fa')
      .send({ tempToken, totpCode: '000000' })
      .expect(401);
  });

  it('should reject 2FA with expired tempToken', async () => {
    const expiredToken = 'expired-fake-token-12345';
    const totpCode = speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });

    await request(app)
      .post('/api/auth/verify-2fa')
      .send({ tempToken: expiredToken, totpCode })
      .expect(401);
  });
});

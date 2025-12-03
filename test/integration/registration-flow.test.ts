import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/db';
import speakeasy from 'speakeasy';

describe('Integration: Complete Registration Flow with 2FA', () => {
  const testUser = {
    matricula: '2024999',
    email: 'test.integration@example.com',
    tutorName: 'Test Tutor',
    username: 'testuser999',
    phone: '5551234567',
    password: 'TestPassword123!@#',
    confirmPassword: 'TestPassword123!@#',
    acceptTerms: true
  };

  let userId: string;
  let secret: string;

  beforeAll(async () => {
    // Agregar usuario autorizado
    await pool.query(
      `INSERT INTO authorized_users (matricula, email, phone, tutor_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (matricula) DO NOTHING`,
      [testUser.matricula, testUser.email, testUser.phone, testUser.tutorName]
    );
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (userId) {
      await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM two_factor_auth WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM email_verifications WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await pool.query('DELETE FROM authorized_users WHERE matricula = $1', [testUser.matricula]);
  });

  it('should complete the full registration flow', async () => {
    // PASO 1: Registro
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(registerRes.body).toHaveProperty('userId');
    expect(registerRes.body).toHaveProperty('email', testUser.email);
    userId = registerRes.body.userId;

    // PASO 2: Setup 2FA (obtener QR)
    const setup2faRes = await request(app)
      .post('/api/auth/setup-2fa')
      .send({ userId })
      .expect(200);

    expect(setup2faRes.body).toHaveProperty('qr');
    expect(setup2faRes.body).toHaveProperty('backupCodes');
    expect(Array.isArray(setup2faRes.body.backupCodes)).toBe(true);
    expect(setup2faRes.body.backupCodes.length).toBe(10);

    // Obtener el secret de la base de datos
    const twoFAResult = await pool.query(
      'SELECT secret_key FROM two_factor_auth WHERE user_id = $1',
      [userId]
    );
    expect(twoFAResult.rows.length).toBe(1);
    secret = twoFAResult.rows[0].secret_key;

    // PASO 3: Generar código TOTP válido
    const totpCode = speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });

    // PASO 4: Verificar 2FA
    const verify2faRes = await request(app)
      .post('/api/auth/verify-2fa')
      .send({ userId, totpCode })
      .expect(200);

    expect(verify2faRes.body).toHaveProperty('token');
    expect(verify2faRes.body).toHaveProperty('user');
    expect(verify2faRes.body.user.email).toBe(testUser.email);

    // Verificar que 2FA fue habilitado
    const twoFACheck = await pool.query(
      'SELECT is_enabled FROM two_factor_auth WHERE user_id = $1',
      [userId]
    );
    expect(twoFACheck.rows[0].is_enabled).toBe(true);
  });

  it('should reject invalid TOTP codes', async () => {
    const invalidCode = '000000';
    
    await request(app)
      .post('/api/auth/verify-2fa')
      .send({ userId, totpCode: invalidCode })
      .expect(401);
  });

  it('should prevent duplicate 2FA setup for same user', async () => {
    // Crear un NUEVO usuario para este test específico (el anterior ya tiene 2FA activado)
    const newUser = {
      matricula: '2024990',
      email: 'test.duplicate@example.com',
      tutorName: 'Test Duplicate',
      username: 'testduplicate',
      phone: '5550000000',
      password: 'DuplicateTest123!@#',
      confirmPassword: 'DuplicateTest123!@#',
      acceptTerms: true
    };

    // Asegurar que esté en authorized_users
    await pool.query(
      `INSERT INTO authorized_users (matricula, email, phone, tutor_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (matricula) DO NOTHING`,
      [newUser.matricula, newUser.email, newUser.phone, newUser.tutorName]
    );

    // Registrar
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(newUser)
      .expect(201);

    const newUserId = registerRes.body.userId;

    // Intentar crear segunda configuración 2FA (simula React double render)
    const setup2faRes1 = await request(app)
      .post('/api/auth/setup-2fa')
      .send({ userId: newUserId })
      .expect(200);

    const setup2faRes2 = await request(app)
      .post('/api/auth/setup-2fa')
      .send({ userId: newUserId })
      .expect(200);

    // Verificar que solo hay un registro en la BD
    const twoFACount = await pool.query(
      'SELECT COUNT(*) FROM two_factor_auth WHERE user_id = $1',
      [newUserId]
    );
    expect(parseInt(twoFACount.rows[0].count)).toBe(1);

    // Cleanup
    await pool.query('DELETE FROM two_factor_auth WHERE user_id = $1', [newUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [newUserId]);
    await pool.query('DELETE FROM authorized_users WHERE matricula = $1', [newUser.matricula]);
  });
});

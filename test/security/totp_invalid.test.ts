import request from 'supertest';
import app from '../../src/app';

describe('Security: TOTP verification', () => {
  it('should reject invalid TOTP codes with tempToken', async () => {
    const payload = { tempToken: 'fake-temp-token', totpCode: '000000' };
    const res = await request(app).post('/api/auth/verify-2fa').send(payload);
    expect([401, 400, 403]).toContain(res.status);
  });

  it('should reject invalid TOTP codes with userId', async () => {
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const payload = { userId: fakeUserId, totpCode: '000000' };
    const res = await request(app).post('/api/auth/verify-2fa').send(payload);
    expect([401, 400, 404]).toContain(res.status);
  });

  it('should reject requests without tempToken or userId', async () => {
    const payload = { totpCode: '123456' };
    const res = await request(app).post('/api/auth/verify-2fa').send(payload);
    expect([400, 401]).toContain(res.status);
  });
});

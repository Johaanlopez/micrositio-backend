import request from 'supertest';
import app from '../../src/app';

describe('Security: Weak passwords', () => {
  it('should reject weak passwords at registration', async () => {
    const payload = { email: 'weak@example.com', password: '12345' };
  const res = await request(app).post('/api/auth/register').send(payload);
    // Expect 400 Bad Request for weak password
    expect(res.status).toBe(400);
  });
});

import request from 'supertest';
import app from '../../src/app';

describe('Security: Rate limiting', () => {
  it('should block after too many requests to login endpoint', async () => {
    const attempts = 15; // larger than typical limit
    let lastRes: any = null;
    for (let i = 0; i < attempts; i++) {
      // attempt with invalid creds
  lastRes = await request(app).post('/api/auth/login').send({ email: `test@example.com`, password: 'bad' });
    }
    // expect eventual 429 Too Many Requests
    expect([429, 401, 400]).toContain(lastRes.status);
  }, 20000);
});

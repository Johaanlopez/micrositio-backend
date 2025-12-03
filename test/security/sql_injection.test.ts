import request from 'supertest';
import app from '../../src/app';

describe('Security: SQL Injection', () => {
  it('should not allow SQL injection in login username', async () => {
    const payload = { email: "' OR 1=1; --", password: 'irrelevant' };
  const res = await request(app).post('/api/auth/login').send(payload);
    // Expect 400 or 401 — server must not authenticate or crash
    expect([400, 401]).toContain(res.status);
  });

  it('should sanitize input on content endpoints', async () => {
    const payload = { title: "'); DROP TABLE users; --", content: '<p>test</p>' };
    const res = await request(app).post('/api/content/posts').send(payload);
    // If creating posts is protected, either 401 or 201/400; main goal is server not to execute SQL injection
    expect(res.status).not.toBe(500);
  });
});

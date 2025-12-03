import request from 'supertest';
import app from '../../src/app';

describe('Security: CSRF', () => {
  it('should require a valid CSRF token for state-changing requests', async () => {
    // Attempt POST without CSRF token
    const res = await request(app).post('/api/content/posts').send({ title: 'a', content: 'b' });
    // Expect 403 or 401 depending on implementation
    expect([403, 401]).toContain(res.status);
  });
});

import request from 'supertest';
import app from '../../src/app';

describe('Security: XSS', () => {
  it('should sanitize scripts in text fields when rendering', async () => {
    const payload = { title: 'XSS test', content: '<script>alert(1)</script><p>ok</p>' };
    // Create post (assumes authenticated endpoint; if so, mock or use test user)
    const res = await request(app).post('/api/content/posts').send(payload);
    expect(res.status).not.toBe(500);
    // When fetching, the returned HTML should not contain <script>
    const getRes = await request(app).get('/api/content/posts').query({ slug: '' });
    const body = JSON.stringify(getRes.body);
    expect(body).not.toMatch(/<script\b/i);
  });
});

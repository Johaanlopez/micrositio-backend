import request from 'supertest';
import app from '../../src/app';
import jwt from 'jsonwebtoken';

describe('Security: JWT expiry', () => {
  it('should reject expired JWT', async () => {
    const secret = process.env.JWT_SECRET || 'testsecret';
    // Create expired token (exp in past)
    const token = jwt.sign({ sub: '1' }, secret, { expiresIn: -10 });
    const res = await request(app).get('/api/content/posts').set('Authorization', `Bearer ${token}`);
    expect([401, 403]).toContain(res.status);
  });
});

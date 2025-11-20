import request from 'supertest';
import createTestApp from '../server.test.js';

const app = createTestApp();

describe('Minimal API Test', () => {
  test('Health check should work', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);

    expect(response.body.status).toBe('success');
    expect(response.body.environment).toBe('test');
  });

  test('Should handle 404 routes', async () => {
    const response = await request(app)
      .get('/api/v1/nonexistent')
      .expect(404);

    expect(response.body.status).toBe('fail');
  });
});

const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Emission = require('../../models/Emission');

describe('Emission API', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Create test user and get token
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    userId = user._id;
    
    // Login to get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    token = response.body.token;
  });

  test('POST /api/emissions - should create new emission', async () => {
    const emissionData = {
      category: 'transportation',
      activity: 'car',
      amount: 50,
      unit: 'km',
      co2e: 10.5
    };

    const response = await request(app)
      .post('/api/emissions')
      .set('Authorization', `Bearer ${token}`)
      .send(emissionData);

    expect(response.status).toBe(201);
    expect(response.body.data.emission.activity).toBe('car');
  });
});
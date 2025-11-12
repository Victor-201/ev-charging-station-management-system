import request from 'supertest';
import app from '../src/index';

describe('Auth Service Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('service', 'auth-service');
  });
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      phone: '0987654321',
      password: 'Password123!',
      name: 'Test User',
      vehicle: {
        plate_number: '30A-99999',
        brand: 'Tesla',
        model: 'Model 3',
      },
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('user_id');
  });

  it('should fail with invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      password: 'Password123!',
      name: 'Test User',
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    expect(response.status).toBe(400);
  });

  it('should fail with weak password', async () => {
    const userData = {
      email: 'test2@example.com',
      password: 'weak',
      name: 'Test User',
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    expect(response.status).toBe(400);
  });
});

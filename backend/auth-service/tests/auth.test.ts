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
      password_confirmation: 'Password123!',
      full_name: 'Test User',
      date_of_birth: '2000-01-15',
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('user_id');
    expect(response.body).toHaveProperty('verification_required', true);
  });

  it('should fail with invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      password: 'Password123!',
      password_confirmation: 'Password123!',
      full_name: 'Test User',
      date_of_birth: '2000-01-15',
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
      password_confirmation: 'weak',
      full_name: 'Test User',
      date_of_birth: '2000-01-15',
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    expect(response.status).toBe(400);
  });

  it('should fail when password confirmation does not match', async () => {
    const userData = {
      email: 'test3@example.com',
      password: 'Password123!',
      password_confirmation: 'DifferentPassword123!',
      full_name: 'Test User',
      date_of_birth: '2000-01-15',
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    expect(response.status).toBe(400);
  });

  it('should fail when user is under 18 years old', async () => {
    const today = new Date();
    const underageDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    const dateString = underageDate.toISOString().split('T')[0];

    const userData = {
      email: 'underage@example.com',
      password: 'Password123!',
      password_confirmation: 'Password123!',
      full_name: 'Underage User',
      date_of_birth: dateString,
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    expect(response.status).toBe(400);
  });
});

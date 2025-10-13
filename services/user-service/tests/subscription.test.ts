import request from 'supertest';
import app from '../src/index';

describe('Subscription Management APIs', () => {
  let authToken: string;
  let userId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    // TODO: Setup test database and seed data
    // For now, assuming we have a test user and token
    authToken = 'Bearer test_token_here';
    userId = 'test_user_id';
  });

  afterAll(async () => {
    // Cleanup test data
  });

  describe('GET /api/v1/users/:user_id/subscriptions', () => {
    it('should return user subscriptions', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/subscriptions`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('subscriptions');
      expect(Array.isArray(response.body.subscriptions)).toBe(true);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}/subscriptions`);

      expect(response.status).toBe(401);
    });

    it('should return 403 if accessing another user subscriptions', async () => {
      const response = await request(app)
        .get('/api/v1/users/another_user_id/subscriptions')
        .set('Authorization', authToken);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/v1/users/:user_id/subscriptions', () => {
    it('should subscribe to a plan successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userId}/subscriptions`)
        .set('Authorization', authToken)
        .send({
          plan_id: 'P001',
          auto_renew: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('subscription_id');
      expect(response.body).toHaveProperty('status', 'active');
      
      subscriptionId = response.body.subscription_id;
    });

    it('should return 400 if plan_id is missing', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userId}/subscriptions`)
        .set('Authorization', authToken)
        .send({
          auto_renew: true,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 if user already has active subscription', async () => {
      // Try to subscribe again to the same plan
      const response = await request(app)
        .post(`/api/v1/users/${userId}/subscriptions`)
        .set('Authorization', authToken)
        .send({
          plan_id: 'P001',
        });

      expect(response.status).toBe(409);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userId}/subscriptions`)
        .send({
          plan_id: 'P001',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/users/:user_id/subscriptions/:subscription_id/cancel', () => {
    it('should cancel subscription successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userId}/subscriptions/${subscriptionId}/cancel`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'cancelled');
    });

    it('should return 404 if subscription not found', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userId}/subscriptions/non_existent_id/cancel`)
        .set('Authorization', authToken);

      expect(response.status).toBe(404);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userId}/subscriptions/${subscriptionId}/cancel`);

      expect(response.status).toBe(401);
    });

    it('should return 403 if canceling another user subscription', async () => {
      const response = await request(app)
        .post('/api/v1/users/another_user_id/subscriptions/some_id/cancel')
        .set('Authorization', authToken);

      expect(response.status).toBe(403);
    });
  });

  describe('Subscription Business Logic', () => {
    it('should set auto_renew to true by default', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${userId}/subscriptions`)
        .set('Authorization', authToken)
        .send({
          plan_id: 'P002',
        });

      expect(response.status).toBe(201);
      
      // Verify subscription details
      const subResponse = await request(app)
        .get(`/api/v1/users/${userId}/subscriptions`)
        .set('Authorization', authToken);

      const subscription = subResponse.body.subscriptions.find(
        (s: any) => s.subscription_id === response.body.subscription_id
      );
      
      expect(subscription.auto_renew).toBe(true);
    });

    it('should allow multiple subscriptions for different plans', async () => {
      const response1 = await request(app)
        .post(`/api/v1/users/${userId}/subscriptions`)
        .set('Authorization', authToken)
        .send({ plan_id: 'P003' });

      const response2 = await request(app)
        .post(`/api/v1/users/${userId}/subscriptions`)
        .set('Authorization', authToken)
        .send({ plan_id: 'P004' });

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
    });
  });
});

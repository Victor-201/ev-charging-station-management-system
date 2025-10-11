import axios, { AxiosInstance } from 'axios';
import logger from './logger';

class HttpClient {
  private authServiceClient: AxiosInstance;

  constructor() {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://ev-auth-service:3001';
    
    this.authServiceClient = axios.create({
      baseURL: authServiceUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.authServiceClient.interceptors.request.use(
      (config) => {
        logger.info(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('HTTP Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.authServiceClient.interceptors.response.use(
      (response) => {
        logger.info(`HTTP Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('HTTP Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  // Get Auth Service client
  getAuthServiceClient(): AxiosInstance {
    return this.authServiceClient;
  }

  // Call Auth Service API to get user list (for admin)
  async getUserListFromAuthService(
    params: {
      page?: number;
      size?: number;
      q?: string;
      role?: string;
      status?: string;
    },
    token?: string
  ): Promise<any> {
    try {
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.authServiceClient.get('/api/v1/auth/users', {
        params,
        headers,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Error calling auth service for user list:', error.message);
      if (error.response) {
        logger.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  // Call Auth Service API to deactivate user (admin only)
  async deactivateUserInAuthService(userId: string, token?: string): Promise<any> {
    try {
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.authServiceClient.post(
        `/api/v1/auth/users/${userId}/deactivate`,
        {},
        { headers }
      );
      return response.data;
    } catch (error: any) {
      logger.error('Error calling auth service to deactivate user:', error.message);
      if (error.response) {
        logger.error('Response data:', error.response.data);
      }
      throw error;
    }
  }
}

export default new HttpClient();

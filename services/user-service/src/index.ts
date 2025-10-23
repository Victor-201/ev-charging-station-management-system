import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';
import logger from './utils/logger';
import pool from './config/database';
import { rabbitmqConsumer } from './config/rabbitmq';
import {
  handleUserCreated,
  handleUserUpdated,
  handleUserDeactivated,
  handleUserRoleUpdated,
} from './handlers/userEventHandlers';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', apiLimiter);

// Static files for exports
app.use('/exports', express.static(path.join(__dirname, '../exports')));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1', routes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('Database connection established');

    // Connect to RabbitMQ and setup consumer
    try {
      await rabbitmqConsumer.connect();
      logger.info('RabbitMQ consumer connected');

      // Register event handlers
      rabbitmqConsumer.registerHandler('user.created', handleUserCreated);
      rabbitmqConsumer.registerHandler('user.updated', handleUserUpdated);
      rabbitmqConsumer.registerHandler('user.deactivated', handleUserDeactivated);
      rabbitmqConsumer.registerHandler('user.role_updated', handleUserRoleUpdated);
      logger.info('Event handlers registered');

      // Subscribe to Auth Service events
      await rabbitmqConsumer.subscribe([
        'user.created',
        'user.updated',
        'user.deactivated',
        'user.role_updated',
      ]);
      logger.info('Subscribed to Auth Service events');

      // Start consuming messages
      await rabbitmqConsumer.startConsuming();
      logger.info('Started consuming events from RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ (service will continue):', error);
      // Service continues without RabbitMQ, but event processing won't work
    }

    app.listen(PORT, () => {
      logger.info(`User service listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  try {
    // Stop consuming and close RabbitMQ connection
    await rabbitmqConsumer.close();
    logger.info('RabbitMQ consumer closed');

    // Close database connection
    await pool.end();
    logger.info('Database connection closed');

    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;

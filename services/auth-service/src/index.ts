import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';
import authRoutes from './routes/authRoutes';
import { testDbConnection } from './config/database';
import { rateLimiter } from './middlewares/rateLimiter';
import { rabbitmqClient } from './config/rabbitmq';
import { outboxService } from './services/outboxService';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middlewares
// CORS must be applied before Helmet to avoid conflicts
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Configure Helmet with relaxed CORS settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testDbConnection();
    logger.info('Database connection established');

    // Connect to RabbitMQ
    try {
      await rabbitmqClient.connect();
      logger.info('RabbitMQ connection established');

      // Start outbox publisher
      outboxService.startPublisher(5000); // Publish every 5 seconds
      logger.info('Outbox publisher started');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ (service will continue):', error);
      // Service continues without RabbitMQ, events will queue in outbox
    }

    app.listen(PORT, () => {
      logger.info(`Auth Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
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
    // Stop outbox publisher
    outboxService.stopPublisher();
    logger.info('Outbox publisher stopped');

    // Close RabbitMQ connection
    await rabbitmqClient.close();
    logger.info('RabbitMQ connection closed');

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

import { pool } from '../config/database';
import { DomainEvent } from '../config/rabbitmq';
import logger from '../utils/logger';

/**
 * Track processed events for idempotency
 */
const processedEvents = new Set<string>();

/**
 * Check if event has already been processed
 */
function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

/**
 * Mark event as processed
 */
function markEventProcessed(eventId: string): void {
  processedEvents.add(eventId);
  
  // Clean up old entries (keep last 10000)
  if (processedEvents.size > 10000) {
    const iterator = processedEvents.values();
    for (let i = 0; i < 1000; i++) {
      const value = iterator.next().value;
      if (value) processedEvents.delete(value);
    }
  }
}

/**
 * Check if event has been processed in database (for persistence)
 */
async function isEventProcessedInDb(eventId: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT 1 FROM processed_events WHERE event_id = $1',
      [eventId]
    );
    return result.rowCount > 0;
  } finally {
    client.release();
  }
}

/**
 * Mark event as processed in database
 */
async function markEventProcessedInDb(
  client: any,
  eventId: string,
  eventType: string
): Promise<void> {
  await client.query(
    `INSERT INTO processed_events (event_id, event_type, processed_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (event_id) DO NOTHING`,
    [eventId, eventType]
  );
}

/**
 * Handle user.created event
 * Creates a user profile when a new user registers in Auth Service
 */
export async function handleUserCreated(event: DomainEvent): Promise<void> {
  const { eventId, aggregateId, payload } = event;

  logger.info(`Processing user.created event: ${eventId} for user: ${aggregateId}`);

  // Check idempotency in memory
  if (isEventProcessed(eventId)) {
    logger.info(`Event ${eventId} already processed (in memory), skipping`);
    return;
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check idempotency in database
    const isProcessed = await isEventProcessedInDb(eventId);
    if (isProcessed) {
      logger.info(`Event ${eventId} already processed (in database), skipping`);
      await client.query('COMMIT');
      markEventProcessed(eventId);
      return;
    }

    // Check if user profile already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [aggregateId]
    );

    if (existingUser.rowCount > 0) {
      logger.info(`User profile ${aggregateId} already exists, skipping creation`);
      await markEventProcessedInDb(client, eventId, event.eventType);
      await client.query('COMMIT');
      markEventProcessed(eventId);
      return;
    }

    // Create user profile
    const { email, fullName, phoneNumber, role } = payload;
    
    await client.query(
      `INSERT INTO users (id, email, full_name, phone_number, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [aggregateId, email, fullName || null, phoneNumber || null, role || 'customer']
    );

    logger.info(`Created user profile for user: ${aggregateId}`);

    // Mark event as processed
    await markEventProcessedInDb(client, eventId, event.eventType);

    await client.query('COMMIT');
    markEventProcessed(eventId);

    logger.info(`Successfully processed user.created event: ${eventId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Error processing user.created event ${eventId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Handle user.updated event
 * Updates user profile when user info changes in Auth Service
 */
export async function handleUserUpdated(event: DomainEvent): Promise<void> {
  const { eventId, aggregateId, payload } = event;

  logger.info(`Processing user.updated event: ${eventId} for user: ${aggregateId}`);

  // Check idempotency
  if (isEventProcessed(eventId)) {
    logger.info(`Event ${eventId} already processed, skipping`);
    return;
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check idempotency in database
    const isProcessed = await isEventProcessedInDb(eventId);
    if (isProcessed) {
      logger.info(`Event ${eventId} already processed (in database), skipping`);
      await client.query('COMMIT');
      markEventProcessed(eventId);
      return;
    }

    // Update user profile
    const { email, fullName, phoneNumber } = payload;
    
    const result = await client.query(
      `UPDATE users 
       SET email = COALESCE($2, email),
           full_name = COALESCE($3, full_name),
           phone_number = COALESCE($4, phone_number),
           updated_at = NOW()
       WHERE id = $1`,
      [aggregateId, email, fullName, phoneNumber]
    );

    if (result.rowCount === 0) {
      logger.warn(`User profile ${aggregateId} not found for update`);
    } else {
      logger.info(`Updated user profile for user: ${aggregateId}`);
    }

    // Mark event as processed
    await markEventProcessedInDb(client, eventId, event.eventType);

    await client.query('COMMIT');
    markEventProcessed(eventId);

    logger.info(`Successfully processed user.updated event: ${eventId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Error processing user.updated event ${eventId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Handle user.deactivated event
 * Deactivates user profile when user is deactivated in Auth Service
 */
export async function handleUserDeactivated(event: DomainEvent): Promise<void> {
  const { eventId, aggregateId } = event;

  logger.info(`Processing user.deactivated event: ${eventId} for user: ${aggregateId}`);

  // Check idempotency
  if (isEventProcessed(eventId)) {
    logger.info(`Event ${eventId} already processed, skipping`);
    return;
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check idempotency in database
    const isProcessed = await isEventProcessedInDb(eventId);
    if (isProcessed) {
      logger.info(`Event ${eventId} already processed (in database), skipping`);
      await client.query('COMMIT');
      markEventProcessed(eventId);
      return;
    }

    // Deactivate user profile
    const result = await client.query(
      `UPDATE users 
       SET is_active = false,
           updated_at = NOW()
       WHERE id = $1`,
      [aggregateId]
    );

    if (result.rowCount === 0) {
      logger.warn(`User profile ${aggregateId} not found for deactivation`);
    } else {
      logger.info(`Deactivated user profile for user: ${aggregateId}`);
    }

    // Mark event as processed
    await markEventProcessedInDb(client, eventId, event.eventType);

    await client.query('COMMIT');
    markEventProcessed(eventId);

    logger.info(`Successfully processed user.deactivated event: ${eventId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Error processing user.deactivated event ${eventId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Handle user.role_updated event
 * Updates user role when role changes in Auth Service
 */
export async function handleUserRoleUpdated(event: DomainEvent): Promise<void> {
  const { eventId, aggregateId, payload } = event;

  logger.info(`Processing user.role_updated event: ${eventId} for user: ${aggregateId}`);

  // Check idempotency
  if (isEventProcessed(eventId)) {
    logger.info(`Event ${eventId} already processed, skipping`);
    return;
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check idempotency in database
    const isProcessed = await isEventProcessedInDb(eventId);
    if (isProcessed) {
      logger.info(`Event ${eventId} already processed (in database), skipping`);
      await client.query('COMMIT');
      markEventProcessed(eventId);
      return;
    }

    // Update user role
    const { newRole } = payload;
    
    const result = await client.query(
      `UPDATE users 
       SET role = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [aggregateId, newRole]
    );

    if (result.rowCount === 0) {
      logger.warn(`User profile ${aggregateId} not found for role update`);
    } else {
      logger.info(`Updated role for user ${aggregateId} to: ${newRole}`);
    }

    // Mark event as processed
    await markEventProcessedInDb(client, eventId, event.eventType);

    await client.query('COMMIT');
    markEventProcessed(eventId);

    logger.info(`Successfully processed user.role_updated event: ${eventId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Error processing user.role_updated event ${eventId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

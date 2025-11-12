import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('Socket.IO server initialized');
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Client connected: ${socket.id}, User: ${socket.userId}`);

      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
      }

      // Join user-specific room
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
      }

      // Join role-specific room
      if (socket.userRole) {
        socket.join(`role:${socket.userRole}`);
      }

      // Handle joining station room
      socket.on('join:station', (stationId: string) => {
        socket.join(`station:${stationId}`);
        logger.info(`User ${socket.userId} joined station room: ${stationId}`);
      });

      // Handle leaving station room
      socket.on('leave:station', (stationId: string) => {
        socket.leave(`station:${stationId}`);
        logger.info(`User ${socket.userId} left station room: ${stationId}`);
      });

      // Handle staff check-in event
      socket.on('staff:checkin', (data: { staffId: string; stationId: string }) => {
        logger.info(`Staff check-in: ${data.staffId} at station ${data.stationId}`);
        
        // Broadcast to station room
        socket.to(`station:${data.stationId}`).emit('staff:checkin:broadcast', {
          staffId: data.staffId,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle staff check-out event
      socket.on('staff:checkout', (data: { staffId: string; stationId: string }) => {
        logger.info(`Staff check-out: ${data.staffId} at station ${data.stationId}`);
        
        // Broadcast to station room
        socket.to(`station:${data.stationId}`).emit('staff:checkout:broadcast', {
          staffId: data.staffId,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}, User: ${socket.userId}`);
        
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('Socket error:', error);
      });
    });
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
    logger.debug(`Sent ${event} to user ${userId}`);
  }

  // Send notification to all users with specific role
  sendToRole(role: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`role:${role}`).emit(event, data);
    logger.debug(`Sent ${event} to role ${role}`);
  }

  // Send notification to specific station
  sendToStation(stationId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`station:${stationId}`).emit(event, data);
    logger.debug(`Sent ${event} to station ${stationId}`);
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any): void {
    if (!this.io) return;
    this.io.emit(event, data);
    logger.debug(`Broadcast ${event} to all clients`);
  }

  // Send staff update notification
  sendStaffUpdate(stationId: string, data: any): void {
    this.sendToStation(stationId, 'staff:update', data);
  }

  // Send attendance update notification
  sendAttendanceUpdate(stationId: string, data: any): void {
    this.sendToStation(stationId, 'attendance:update', data);
  }

  // Send wallet transaction notification
  sendWalletTransaction(userId: string, data: any): void {
    this.sendToUser(userId, 'wallet:transaction', data);
  }

  // Send vehicle update notification
  sendVehicleUpdate(userId: string, data: any): void {
    this.sendToUser(userId, 'vehicle:update', data);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get socket instance
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export default new SocketService();

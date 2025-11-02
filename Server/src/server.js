const app = require('./app');
const { sequelize } = require('./config/database');
const logger = require('./utils/logger');
const http = require('http');
const NotificationWebSocketServer = require('./websocket/notificationWebSocket');

const PORT = process.env.PORT || 7007;

// Test database connection before starting server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');
    
    // Sync database (in development) - disabled to avoid key limit issues
    // if (process.env.NODE_ENV === 'development') {
    //   await sequelize.sync({ alter: true });
    //   logger.info('✅ Database synchronized.');
    // }
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize WebSocket server
    const notificationWS = new NotificationWebSocketServer(server);
    logger.info('🔌 WebSocket server initialized for real-time notifications');
    
    // Set up notification service with WebSocket server
    const notificationService = require('./services/notificationService');
    notificationService.setWebSocketServer(notificationWS);
    logger.info('📡 Notification service configured with WebSocket');
    
    // Start server - Listen on all network interfaces (0.0.0.0)
    server.listen(PORT, '0.0.0.0', () => {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API health check: http://localhost:${PORT}/api/health`);
      logger.info(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws/notifications`);
      logger.info('');
      logger.info('📡 Server listening on all network interfaces:');
      logger.info(`   - Local: http://localhost:${PORT}`);
      
      // Log all network interfaces
      Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(iface => {
          if (iface.family === 'IPv4' && !iface.internal) {
            logger.info(`   - Network: http://${iface.address}:${PORT}`);
            logger.info(`   - WebSocket: ws://${iface.address}:${PORT}/ws/notifications`);
          }
        });
      });
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

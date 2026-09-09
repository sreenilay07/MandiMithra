const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const logger = require('./utils/logger');
const { initSocket } = require('./socket/socket.handler');

const server = http.createServer(app);

// Initialize Socket.IO Server
initSocket(server);

// Start Database & Server
connectDB().then(() => {
  server.listen(env.PORT, () => {
    logger.info(`==================================================`);
    logger.info(`🌾 MandiMithra Backend Operational on Port ${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Swagger Docs: http://localhost:${env.PORT}/api-docs`);
    logger.info(`Health Check: http://localhost:${env.PORT}/api/v1/health`);
    logger.info(`==================================================`);
  });
}).catch(err => {
  logger.error(`Database connection failed: ${err.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down server gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});

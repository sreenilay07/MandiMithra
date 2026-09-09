const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/error.middleware');
const { apiRateLimiter } = require('./middleware/rateLimiter.middleware');
const env = require('./config/env');

// Route Imports
const authRoutes = require('./routes/auth.routes');
const approvalRoutes = require('./routes/approval.routes');
const userRoutes = require('./routes/user.routes');
const farmerRoutes = require('./routes/farmer.routes');
const bookingRoutes = require('./routes/booking.routes');
const tokenRoutes = require('./routes/token.routes');
const queueRoutes = require('./routes/queue.routes');
const centreRoutes = require('./routes/centre.routes');
const cropRoutes = require('./routes/crop.routes');
const procurementRoutes = require('./routes/procurement.routes');
const qrRoutes = require('./routes/qr.routes');
const counterRoutes = require('./routes/counter.routes');
const officerRoutes = require('./routes/officer.routes');
const managerRoutes = require('./routes/manager.routes');
const districtRoutes = require('./routes/district.routes');
const reportRoutes = require('./routes/report.routes');
const paymentRoutes = require('./routes/payment.routes');
const notificationRoutes = require('./routes/notification.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const auditRoutes = require('./routes/audit.routes');
const pricingRoutes = require('./routes/pricing.routes');
const documentRoutes = require('./routes/document.routes');
const receiptRoutes = require('./routes/receipt.routes');

const app = express();

// Security & Base Middlewares
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: env.CLIENT_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize against NoSQL Query Injection
app.use(mongoSanitize());

// Logger
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global API Rate Limiter
app.use('/api/', apiRateLimiter);

// Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check API Endpoint
const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    app: 'MandiMithra',
    tagline: 'Saath Kisan Ka, Har Kadam Par',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
};
app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Register API Routes under both /api/ and /api/v1/
const registerRoutes = (prefix) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/approvals`, approvalRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/farmers`, farmerRoutes);
  app.use(`${prefix}/bookings`, bookingRoutes);
  app.use(`${prefix}/tokens`, tokenRoutes);
  app.use(`${prefix}/queue`, queueRoutes);
  app.use(`${prefix}/centres`, centreRoutes);
  app.use(`${prefix}/crops`, cropRoutes);
  app.use(`${prefix}/procurements`, procurementRoutes);
  app.use(`${prefix}/qr`, qrRoutes);
  app.use(`${prefix}`, counterRoutes);
  app.use(`${prefix}`, officerRoutes);
  app.use(`${prefix}/manager`, managerRoutes);
  app.use(`${prefix}/district`, districtRoutes);
  app.use(`${prefix}/reports`, reportRoutes);
  app.use(`${prefix}/payments`, paymentRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/chatbot`, chatbotRoutes);
  app.use(`${prefix}/audit-logs`, auditRoutes);
  app.use(`${prefix}/pricing`, pricingRoutes);
  app.use(`${prefix}/documents`, documentRoutes);
  app.use(`${prefix}/receipts`, receiptRoutes);
};

registerRoutes('/api');
registerRoutes('/api/v1');

// 404 Route Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
    errorCode: 'ROUTE_NOT_FOUND'
  });
});

// Global Centralized Error Handler
app.use(errorHandler);

module.exports = app;

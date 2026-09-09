const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AgriFlow API Documentation',
      version: '1.0.0',
      description: 'SIH 26032 — Farmer Procurement Scheduling and Queue Management System API'
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

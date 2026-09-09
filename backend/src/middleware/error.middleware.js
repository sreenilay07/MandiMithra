const logger = require('../utils/logger');
const { AppError } = require('../utils/customErrors');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new AppError(message, 404, 'NOT_FOUND');
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value entered for ${field} field`;
    error = new AppError(message, 409, 'DUPLICATE_KEY_ERROR');
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    error = new AppError('Validation Error', 400, 'VALIDATION_ERROR', errors);
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED');
  }

  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = error.message || 'Server Error';
  const errors = error.errors || [];

  if (statusCode >= 500) {
    logger.error('Unhandled Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors: errors.length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;

class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errorCode = 'BAD_REQUEST', errors = []) {
    super(message, 400, errorCode, errors);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access', errorCode = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict', errorCode = 'CONFLICT') {
    super(message, 409, errorCode);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError
};

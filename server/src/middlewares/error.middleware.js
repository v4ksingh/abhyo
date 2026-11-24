class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Sequelize Database error (e.g. invalid syntax, uuid format)
  if (err.name === 'SequelizeDatabaseError') {
    error.message = 'Database error or invalid ID format';
    error.statusCode = 400;
  }

  // Sequelize unique constraint (duplicate key)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'Field';
    error.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error.statusCode = 400;
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File size too large';
    error.statusCode = 400;
  }

  if (process.env.NODE_ENV === 'development') {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      stack: err.stack,
      details: err,
    });
  }

  res.status(error.statusCode).json({
    success: false,
    error: error.message || 'Internal Server Error',
  });
};

module.exports = { AppError, errorHandler };

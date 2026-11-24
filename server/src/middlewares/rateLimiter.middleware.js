const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// In development: very generous limits so testing is never blocked.
// In production: tighter limits to protect the API.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 200,
  message: { success: false, error: 'Too many requests, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // completely skip in development
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 20,
  message: { success: false, error: 'Too many authentication attempts. Please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // completely skip in development
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 10000 : 5,
  message: { success: false, error: 'Too many OTP requests. Please wait 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // completely skip in development
});

module.exports = { apiLimiter, authLimiter, otpLimiter };

const crypto = require('crypto');

/**
 * Dedicated secure authentication middleware for n8n Webhook requests.
 * - Reads secret key exclusively from process.env.N8N_API_KEY
 * - Compares secrets using constant-time string comparison (timing-attack resistant)
 * - Accepts strictly via HTTP Header 'x-api-key'
 * - Never logs or exposes the secret key
 */
exports.verifyWebhookApiKey = (req, res, next) => {
  if (!process.env.N8N_API_KEY) {
    require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
  }
  const configuredSecret = process.env.N8N_API_KEY;

  if (!configuredSecret || typeof configuredSecret !== 'string' || configuredSecret.trim() === '') {
    console.error('[WebhookAuth Error] N8N_API_KEY is not configured in environment variables.');
    return res.status(500).json({
      success: false,
      error: 'Webhook authentication service is unconfigured on server',
    });
  }

  const incomingApiKey = req.headers['x-api-key'];

  if (!incomingApiKey || typeof incomingApiKey !== 'string') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid x-api-key header',
    });
  }

  // Constant-time comparison
  const incomingBuf = Buffer.from(incomingApiKey);
  const configuredBuf = Buffer.from(configuredSecret);

  if (incomingBuf.length !== configuredBuf.length || !crypto.timingSafeEqual(incomingBuf, configuredBuf)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid API key',
    });
  }

  next();
};
